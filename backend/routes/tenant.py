from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db
from models.models import Tenant, User
from utils.auth import hash_password
from utils.dependencies import require_super_admin
import uuid

router = APIRouter(prefix="/tenants", tags=["tenants"])

class CreateTenantRequest(BaseModel):
    name: str
    slug: str
    enabled_modules: list
    bot_name: str = "UniAssist AI"
    bot_description: str = "Your AI Assistant"
    admin_name: str
    admin_email: str
    admin_password: str

@router.post("/create")
async def create_tenant(
    data: CreateTenantRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_super_admin)
):
    # Check slug uniqueness
    result = await db.execute(
        select(Tenant).where(Tenant.slug == data.slug)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug already exists")

    # Create tenant
    tenant = Tenant(
        id=uuid.uuid4(),
        name=data.name,
        slug=data.slug,
        enabled_modules=data.enabled_modules,
        bot_name=data.bot_name,
        bot_description=data.bot_description
    )
    db.add(tenant)
    await db.flush()

    # Create tenant admin
    admin = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        name=data.admin_name,
        email=data.admin_email,
        password_hash=hash_password(data.admin_password),
        role="tenant_admin"
    )
    db.add(admin)
    await db.commit()

    return {
        "message": "Tenant created successfully",
        "tenant_id": str(tenant.id),
        "slug": tenant.slug,
        "enabled_modules": tenant.enabled_modules
    }

@router.get("/list")
async def list_tenants(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_super_admin)
):
    result = await db.execute(select(Tenant).order_by(Tenant.created_at.desc()))
    tenants = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "slug": t.slug,
            "enabled_modules": t.enabled_modules,
            "bot_name": t.bot_name,
            "is_active": t.is_active,
            "created_at": str(t.created_at)
        }
        for t in tenants
    ]

@router.patch("/{tenant_id}/modules")
async def update_modules(
    tenant_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_super_admin)
):
    result = await db.execute(
        select(Tenant).where(Tenant.id == uuid.UUID(tenant_id))
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.enabled_modules = data.get("enabled_modules", tenant.enabled_modules)
    await db.commit()
    return {"message": "Modules updated", "enabled_modules": tenant.enabled_modules}