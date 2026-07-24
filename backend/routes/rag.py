from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.models import Document
from utils.dependencies import get_current_user
from services.rag_service import index_document, search_documents
import os, shutil, uuid

router = APIRouter(prefix="/rag", tags=["rag"])

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files supported")

    tenant_id = current_user["tenant_id"]
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Index with tenant_id scope
    chunk_count = index_document(tenant_id, file_path, file.filename)

    # Save document record
    doc = Document(
        id=uuid.uuid4(),
        tenant_id=uuid.UUID(tenant_id),
        filename=filename,
        original_filename=file.filename,
        chunk_count=str(chunk_count)
    )
    db.add(doc)
    await db.commit()

    return {
        "message": "Document indexed successfully",
        "filename": file.filename,
        "chunks": chunk_count
    }

@router.get("/documents")
async def list_documents(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = uuid.UUID(current_user["tenant_id"])
    result = await db.execute(
        select(Document).where(Document.tenant_id == tenant_id)
        .order_by(Document.uploaded_at.desc())
    )
    docs = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "filename": d.original_filename,
            "chunks": d.chunk_count,
            "uploaded_at": str(d.uploaded_at)
        }
        for d in docs
    ]