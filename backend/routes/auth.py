from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db
from models.models import User, Tenant
from utils.auth import hash_password, verify_password, create_access_token
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    tenant_slug: str  # company identifier e.g. "abc-hospital"

class LoginRequest(BaseModel):
    email: str
    password: str
    tenant_slug: str

@router.post("/signup")
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Find tenant
    result = await db.execute(
        select(Tenant).where(Tenant.slug == data.tenant_slug)
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Company not found")
    if not tenant.is_active:
        raise HTTPException(status_code=403, detail="Company account is inactive")

    # Check email uniqueness within tenant
    result = await db.execute(
        select(User).where(
            User.email == data.email,
            User.tenant_id == tenant.id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="user"
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "tenant_id": str(tenant.id)
    })

    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "role": user.role,
            "tenant_id": str(tenant.id),
            "tenant_name": tenant.name,
            "bot_name": tenant.bot_name,
            "enabled_modules": tenant.enabled_modules
        }
    }

@router.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    tenant_slug = (data.tenant_slug or "").strip().lower()

    tenant = None
    if tenant_slug:
        result = await db.execute(select(Tenant).where(Tenant.slug == tenant_slug))
        tenant = result.scalar_one_or_none()

    if not tenant:
        result = await db.execute(select(Tenant).where(Tenant.slug == "platform"))
        tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(status_code=404, detail="Company not found")

    # Find user within tenant
    result = await db.execute(
        select(User).where(
            User.email == data.email,
            User.tenant_id == tenant.id
        )
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "tenant_id": str(tenant.id)
    })

    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "role": user.role,
            "tenant_id": str(tenant.id),
            "tenant_name": tenant.name,
            "bot_name": tenant.bot_name,
            "enabled_modules": tenant.enabled_modules
        }
    }