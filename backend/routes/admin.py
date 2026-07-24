from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.models import User, Conversation, Message
from utils.dependencies import get_current_user, require_admin, require_super_admin
import uuid

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    tenant_id = uuid.UUID(current_user["tenant_id"])

    users_result = await db.execute(
        select(func.count(User.id)).where(User.tenant_id == tenant_id)
    )
    total_users = users_result.scalar()

    conv_result = await db.execute(
        select(func.count(Conversation.id)).where(Conversation.tenant_id == tenant_id)
    )
    total_conversations = conv_result.scalar()

    msg_result = await db.execute(
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Conversation.tenant_id == tenant_id)
    )
    total_messages = msg_result.scalar()

    from datetime import datetime, timedelta
    daily_stats = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59)
        result = await db.execute(
            select(func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Conversation.tenant_id == tenant_id,
                Message.created_at >= day_start,
                Message.created_at <= day_end
            )
        )
        count = result.scalar()
        daily_stats.append({"date": day.strftime("%b %d"), "messages": count})

    return {
        "total_users": total_users,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "daily_stats": daily_stats
    }

@router.get("/users")
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    tenant_id = uuid.UUID(current_user["tenant_id"])
    result = await db.execute(
        select(User).where(User.tenant_id == tenant_id).order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "created_at": str(u.created_at)
        }
        for u in users
    ]

@router.patch("/users/{user_id}/role")
async def update_role(
    user_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    from fastapi import HTTPException
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = data.get("role", user.role)
    await db.commit()
    return {"message": "Role updated"}

@router.get("/platform/stats")
async def platform_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_super_admin)
):
    from models.models import Tenant, User, Conversation, Message
    from sqlalchemy import func

    # Total counts
    total_tenants = (await db.execute(select(func.count(Tenant.id)))).scalar()
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_conversations = (await db.execute(select(func.count(Conversation.id)))).scalar()
    total_messages = (await db.execute(select(func.count(Message.id)))).scalar()

    # Messages per tenant
    tenant_result = await db.execute(select(Tenant))
    tenants = tenant_result.scalars().all()

    tenant_stats = []
    for t in tenants:
        msg_count = (await db.execute(
            select(func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.tenant_id == t.id)
        )).scalar()

        user_count = (await db.execute(
            select(func.count(User.id)).where(User.tenant_id == t.id)
        )).scalar()

        tenant_stats.append({
            "name": t.name,
            "slug": t.slug,
            "messages": msg_count,
            "users": user_count,
            "modules": t.enabled_modules
        })

    # Messages last 7 days
    from datetime import datetime, timedelta
    daily = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        end = day.replace(hour=23, minute=59, second=59)
        count = (await db.execute(
            select(func.count(Message.id))
            .where(Message.created_at >= start, Message.created_at <= end)
        )).scalar()
        daily.append({"date": day.strftime("%b %d"), "messages": count})

    return {
        "total_tenants": total_tenants,
        "total_users": total_users,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "tenant_stats": tenant_stats,
        "daily_stats": daily
    }

@router.get("/platform/stats")
async def platform_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_super_admin)
):
    from models.models import Tenant, User, Conversation, Message
    from sqlalchemy import func

    total_tenants = (await db.execute(select(func.count(Tenant.id)))).scalar()
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_conversations = (await db.execute(select(func.count(Conversation.id)))).scalar()
    total_messages = (await db.execute(select(func.count(Message.id)))).scalar()

    tenant_result = await db.execute(select(Tenant))
    tenants = tenant_result.scalars().all()

    tenant_stats = []
    for t in tenants:
        msg_count = (await db.execute(
            select(func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.tenant_id == t.id)
        )).scalar()

        user_count = (await db.execute(
            select(func.count(User.id)).where(User.tenant_id == t.id)
        )).scalar()

        tenant_stats.append({
            "name": t.name,
            "slug": t.slug,
            "messages": msg_count,
            "users": user_count,
            "modules": t.enabled_modules
        })

    from datetime import datetime, timedelta
    daily = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        end = day.replace(hour=23, minute=59, second=59)
        count = (await db.execute(
            select(func.count(Message.id))
            .where(Message.created_at >= start, Message.created_at <= end)
        )).scalar()
        daily.append({"date": day.strftime("%b %d"), "messages": count})

    return {
        "total_tenants": total_tenants,
        "total_users": total_users,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "tenant_stats": tenant_stats,
        "daily_stats": daily
    }