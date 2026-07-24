from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
from services.domain_service import get_domain_prompt, get_available_domains
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from database import engine, Base, get_db
from models.models import Conversation, Message, User
from routes.tenant import router as tenant_router
from routes.auth import router as auth_router
from routes.rag import router as rag_router
from routes.admin import router as admin_router
from routes.email import router as email_router
from utils.dependencies import get_current_user
from services.memory_service import search_memory, extract_and_save_memory
from services.rag_service import search_documents
from services.tools_service import calculator, web_search, detect_tools_needed, extract_math_expression
from services.email_service import send_email, detect_email_intent
from services.scheduler_service import (
    schedule_reminder, detect_reminder_intent,
    parse_reminder_datetime, get_scheduled_jobs
)
import os, uuid
from routes.voice import router as voice_router
from seed import seed as seed_data
load_dotenv()

app = FastAPI()

app.include_router(auth_router)
app.include_router(rag_router)
app.include_router(email_router)
app.include_router(admin_router)
app.include_router(tenant_router)
app.include_router(voice_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_data()
    print("✅ Database tables created and default data ensured")


@app.post("/chat")
async def chat(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_message = data.get("message")
    history = data.get("history", [])
    conversation_id = data.get("conversation_id")
    user_id = uuid.UUID(current_user["user_id"])
    domain = data.get("domain", "general")
    base_prompt = get_domain_prompt(domain)

    # Create new conversation if none exists
    if not conversation_id:
        conversation = Conversation(
            id=uuid.uuid4(),
            tenant_id=uuid.UUID(current_user["tenant_id"]),  # ← missing
            user_id=user_id,
            title=user_message[:40] if len(user_message) > 40 else user_message,
            domain=domain
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        conversation_id = str(conversation.id)
    else:
        conversation_id = uuid.UUID(conversation_id)

    # Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=user_message
    )
    db.add(user_msg)

    # ── PRIORITY 1: Search company documents (RAG) ──
    tenant_id = current_user["tenant_id"]
    doc_results = search_documents(tenant_id, user_message)
    doc_context = ""
    sources = []
    if doc_results:
        doc_context = "\n\n📄 Relevant information from company documents:\n"
        for r in doc_results:
            doc_context += f"\n[Source: {r['filename']}]\n{r['content']}\n"
            if r['filename'] not in sources:
                sources.append(r['filename'])

    # ── PRIORITY 2: Search user memories ──
    memories = search_memory(str(user_id), user_message)
    memory_context = ""
    if memories:
        memory_context = "\n\n🧠 User context:\n" + "\n".join(f"- {m}" for m in memories)

    # ── PRIORITY 3: Tools + Email + Reminder intent detection ──
    tool_context = ""
    tools_needed = detect_tools_needed(user_message)
    email_intent = detect_email_intent(user_message)
    email_sent = False
    reminder_scheduled = False

    if email_intent["send_email"]:
        tool_context += "\n\n📧 Email action: You ARE sending this answer to the user's registered email. Tell the user you are sending it."

    if "calculator" in tools_needed:
        expression = extract_math_expression(user_message)
        if expression:
            calc_result = calculator(expression)
            tool_context += f"\n\n🔢 Calculation result: {expression} = {calc_result}"

    if "web_search" in tools_needed:
        search_result = web_search(user_message)
        tool_context += f"\n\n🌐 Web search results:\n{search_result}"

    if detect_reminder_intent(user_message):
        remind_at = parse_reminder_datetime(user_message)
        if remind_at and remind_at > datetime.now():
            tool_context += f"\n\n⏰ Reminder action: You ARE scheduling a reminder for {remind_at.strftime('%B %d at %H:%M')}. Confirm this to the user."
        else:
            tool_context += "\n\n⏰ Reminder: User wants a reminder but no valid future date was found. Ask them for the date and time."

    # ── BUILD SYSTEM PROMPT ──
    has_doc_context = bool(doc_results)

    tenant_name = data.get("tenant_name", "the company")
    
    if has_doc_context:
        system_prompt = f"""{base_prompt}

    You are the AI assistant for {tenant_name}.
    You ONLY answer questions relevant to your assigned domain.
    You CAN send emails and schedule reminders.
    IMPORTANT: Answer primarily from the company documents provided below.
    Always mention which document your answer comes from.{memory_context}{doc_context}{tool_context}"""
    else:
        system_prompt = f"""{base_prompt}

    You are the AI assistant for {tenant_name}.
    You ONLY answer questions relevant to your assigned domain.
    You CAN send emails and schedule reminders when requested.{memory_context}{tool_context}"""

    messages = [{"role": "system", "content": system_prompt}]
    messages += history
    messages.append({"role": "user", "content": user_message})

    # ── CALL GROQ ──
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1024,
    )
    ai_response = response.choices[0].message.content

    # ── SAVE MESSAGES ──
    ai_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=ai_response
    )
    db.add(ai_msg)
    await db.commit()

    # ── SAVE MEMORY ──
    extract_and_save_memory(str(user_id), user_message, ai_response)

    # ── SEND EMAIL ──
    if email_intent["send_email"]:
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user_obj = user_result.scalar_one_or_none()
        if user_obj:
            success = send_email(
                to_email=user_obj.email,
                subject="UniAssist AI — Your Answer",
                body=f"Your question:\n{user_message}\n\nAnswer:\n{ai_response}"
            )
            email_sent = success

    # ── SCHEDULE REMINDER ──
    if detect_reminder_intent(user_message):
        remind_at = parse_reminder_datetime(user_message)
        if remind_at and remind_at > datetime.now():
            user_result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user_obj = user_result.scalar_one_or_none()
            if user_obj:
                job_id = schedule_reminder(
                    user_email=user_obj.email,
                    user_name=user_obj.name,
                    reminder_text=user_message,
                    remind_at=remind_at
                )
                reminder_scheduled = True
                print(f"⏰ Reminder set: {job_id}")

    return {
        "response": ai_response,
        "conversation_id": str(conversation_id),
        "sources": sources,
        "tools_used": tools_needed,
        "email_sent": email_sent,
        "reminder_scheduled": reminder_scheduled,
        "domain": domain
    }


@app.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == uuid.UUID(conversation_id))
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return [{"role": m.role, "content": m.content} for m in messages]


@app.get("/reminders")
async def get_reminders(current_user: dict = Depends(get_current_user)):
    jobs = get_scheduled_jobs()
    return {"reminders": jobs}

@app.get("/domains")
async def get_domains(current_user: dict = Depends(get_current_user),
                      db: AsyncSession = Depends(get_db)):
    from models.models import Tenant
    result = await db.execute(
        select(Tenant).where(Tenant.id == uuid.UUID(current_user["tenant_id"]))
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        return {"domains": get_available_domains()}
    
    all_domains = {d["id"]: d for d in get_available_domains()}
    enabled = [all_domains[m] for m in tenant.enabled_modules if m in all_domains]
    return {"domains": enabled}

@app.get("/health")
async def health():
    return {"status": "ok"}  

@app.get("/conversations")
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = uuid.UUID(current_user["user_id"])
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
        .limit(20)
    )
    conversations = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "title": c.title,
            "domain": c.domain,
            "created_at": str(c.created_at)
        }
        for c in conversations
    ]

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from models.models import Message
    conv_id = uuid.UUID(conversation_id)
    
    # Delete messages first
    await db.execute(
        select(Message).where(Message.conversation_id == conv_id)
    )
    messages = (await db.execute(
        select(Message).where(Message.conversation_id == conv_id)
    )).scalars().all()
    
    for msg in messages:
        await db.delete(msg)
    
    # Delete conversation
    conv = (await db.execute(
        select(Conversation).where(Conversation.id == conv_id)
    )).scalar_one_or_none()
    
    if conv:
        await db.delete(conv)
    
    await db.commit()
    return {"message": "Deleted"}


#uvicorn main:app --reload --host 0.0.0.0 --port 8000