from fastapi import APIRouter, Depends
from utils.dependencies import get_current_user
from services.email_service import send_email
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.models import User
import uuid

router = APIRouter(prefix="/email", tags=["email"])

class EmailRequest:
    pass

from pydantic import BaseModel

class SendEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str

@router.post("/send")
async def send_email_endpoint(
    data: SendEmailRequest,
    current_user: dict = Depends(get_current_user)
):
    success = send_email(data.to_email, data.subject, data.body)
    if success:
        return {"message": f"Email sent to {data.to_email}"}
    return {"message": "Failed to send email"}