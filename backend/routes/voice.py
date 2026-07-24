from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.models import User, Tenant
from utils.dependencies import get_current_user
from services.voice_service import transcribe_audio, detect_escalation_intent
from services.rag_service import search_documents
from services.email_service import send_email
from services.domain_service import get_domain_prompt
from groq import Groq
from dotenv import load_dotenv
import os
import uuid
import tempfile
import shutil

load_dotenv()

router = APIRouter(prefix="/voice", tags=["voice"])
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    domain: str = "general",
    current_user: dict = Depends(get_current_user)
):
    try:
        # Detect correct extension from content type
        content_type = audio.content_type or "audio/webm"
        if "mp4" in content_type:
            suffix = ".mp4"
        elif "ogg" in content_type:
            suffix = ".ogg"
        else:
            suffix = ".webm"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(audio.file, tmp)
            tmp_path = tmp.name

        text = transcribe_audio(tmp_path, domain)

        try:
            os.unlink(tmp_path)
        except:
            pass

        if not text:
            return {"text": "", "error": "Could not transcribe audio"}

        return {"text": text}
    except Exception as e:
        return {"text": "", "error": str(e)}
    
@router.post("/respond")
async def voice_respond(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Process transcribed text and return AI voice response"""
    user_text = data.get("text", "")
    domain = data.get("domain", "general")
    history = data.get("history", [])
    tenant_id = current_user["tenant_id"]
    user_id = current_user["user_id"]

    if not user_text:
        return {"response": "I didn't catch that. Could you please repeat?",
                "needs_escalation": False}

    # Search company documents first
    doc_results = search_documents(tenant_id, user_text)
    doc_context = ""
    has_docs = bool(doc_results)
    sources = []

    if doc_results:
        doc_context = "\n\nRelevant company information:\n"
        for r in doc_results:
            doc_context += f"\n[From: {r['filename']}]\n{r['content']}\n"
            if r['filename'] not in sources:
                sources.append(r['filename'])

    # Get tenant info
    tenant_result = await db.execute(
        select(Tenant).where(Tenant.id == uuid.UUID(tenant_id))
    )
    tenant = tenant_result.scalar_one_or_none()
    tenant_name = tenant.name if tenant else "the company"

    base_prompt = get_domain_prompt(domain)

    # Build voice-optimized system prompt
    if has_docs:
        system_prompt = f"""{base_prompt}

You are answering a VOICE CALL. Keep responses SHORT and conversational (2-3 sentences max).
You are the AI assistant for {tenant_name}.
Answer ONLY from the company documents provided below.
If the answer is not in the documents, say exactly:
"I don't have that information in our records. Would you like me to connect you with our team at {tenant_name}?"

Company documents:{doc_context}"""
    else:
        system_prompt = f"""{base_prompt}

You are answering a VOICE CALL. Keep responses SHORT and conversational (2-3 sentences max).
You are the AI assistant for {tenant_name}.
You don't have relevant documents for this query.
Say: "I don't have that information in our records. Would you like me to connect you with our team at {tenant_name}?"
Only say yes/no if the user is responding to whether they want to be connected."""

    messages = [{"role": "system", "content": system_prompt}]
    messages += history
    messages.append({"role": "user", "content": user_text})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=200,  # Short for voice
    )

    ai_response = response.choices[0].message.content

    # Detect if escalation needed
    needs_escalation = False
    escalation_confirmed = False

    if "would you like me to connect" in ai_response.lower():
        needs_escalation = True

    # If user confirmed escalation
    if detect_escalation_intent(user_text) and history:
        last_bot = next(
            (m["content"] for m in reversed(history) if m["role"] == "assistant"),
            ""
        )
        if "would you like me to connect" in last_bot.lower():
            escalation_confirmed = True

    # Send escalation email to tenant admin
    if escalation_confirmed:
        user_result = await db.execute(
            select(User).where(
                User.tenant_id == uuid.UUID(tenant_id),
                User.role == "tenant_admin"
            )
        )
        admin = user_result.scalar_one_or_none()
        if admin:
            caller_result = await db.execute(
                select(User).where(User.id == uuid.UUID(user_id))
            )
            caller = caller_result.scalar_one_or_none()
            caller_name = caller.name if caller else "A user"
            caller_email = caller.email if caller else "unknown"

            send_email(
                to_email=admin.email,
                subject=f"📞 Voice Call Escalation — {tenant_name}",
                body=f"""A user requested to connect with your team during a voice call.

User: {caller_name}
Email: {caller_email}
Last question: {user_text}

Please follow up with this user as soon as possible.

— UniAssist AI"""
            )

        ai_response = f"I've notified the {tenant_name} team. They will contact you at {caller_email} shortly. Is there anything else I can help you with?"

    return {
        "response": ai_response,
        "needs_escalation": needs_escalation,
        "escalation_confirmed": escalation_confirmed,
        "sources": sources
    }