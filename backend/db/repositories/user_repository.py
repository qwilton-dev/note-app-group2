import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.repositories.base_user import AbstractUserRepository
from models.orm import User


class UserRepository(AbstractUserRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: str) -> User | None:
        result = await self._session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_google_id(self, google_id: str) -> User | None:
        result = await self._session.execute(select(User).where(User.google_id == google_id))
        return result.scalar_one_or_none()

    async def create(self, google_id: str, email: str, name: str, avatar: str | None) -> User:
        user = User(
            id=str(uuid.uuid4()),
            google_id=google_id,
            email=email,
            name=name,
            avatar=avatar,
        )
        self._session.add(user)
        await self._session.commit()
        await self._session.refresh(user)
        return user

    async def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            setattr(user, key, value)
        await self._session.commit()
        await self._session.refresh(user)
        return user
