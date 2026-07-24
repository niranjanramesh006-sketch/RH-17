import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal, engine, Base
from models.models import Tenant, User
from utils.auth import hash_password
import uuid

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Tenant))
        existing_tenants = result.scalars().all()

        if not existing_tenants:
            platform = Tenant(
                id=uuid.uuid4(),
                name="UniAssist Platform",
                slug="platform",
                enabled_modules=["general", "hr", "education", "healthcare", "support", "sales"],
                bot_name="UniAssist AI",
                bot_description="Platform Admin"
            )
            db.add(platform)
            await db.flush()

            super_admin = User(
                id=uuid.uuid4(),
                tenant_id=platform.id,
                name="Super Admin",
                email="admin@uniassist.ai",
                password_hash=hash_password("admin123"),
                role="super_admin"
            )
            db.add(super_admin)

            hospital = Tenant(
                id=uuid.uuid4(),
                name="ABC Hospital",
                slug="abc-hospital",
                enabled_modules=["healthcare", "general"],
                bot_name="MedAssist AI",
                bot_description="Your Healthcare Assistant"
            )
            db.add(hospital)
            await db.flush()

            hospital_admin = User(
                id=uuid.uuid4(),
                tenant_id=hospital.id,
                name="Hospital Admin",
                email="admin@abchospital.com",
                password_hash=hash_password("hospital123"),
                role="tenant_admin"
            )
            db.add(hospital_admin)

            college = Tenant(
                id=uuid.uuid4(),
                name="XYZ College",
                slug="xyz-college",
                enabled_modules=["education", "general"],
                bot_name="EduAssist AI",
                bot_description="Your Education Assistant"
            )
            db.add(college)
            await db.flush()

            college_admin = User(
                id=uuid.uuid4(),
                tenant_id=college.id,
                name="College Admin",
                email="admin@xyzcollege.com",
                password_hash=hash_password("college123"),
                role="tenant_admin"
            )
            db.add(college_admin)

            await db.commit()
            print("✅ Seed complete!")
            print("Super Admin: admin@uniassist.ai / admin123 (slug: platform)")
            print("Hospital Admin: admin@abchospital.com / hospital123 (slug: abc-hospital)")
            print("College Admin: admin@xyzcollege.com / college123 (slug: xyz-college)")
            return True

        print("✅ Seed skipped: tenants already exist")
        return False

if __name__ == "__main__":
    asyncio.run(seed())