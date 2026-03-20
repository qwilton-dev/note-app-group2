from abc import ABC, abstractmethod
from models.orm import User


class AbstractUserRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: str) -> User | None: ...

    @abstractmethod
    async def get_by_google_id(self, google_id: str) -> User | None: ...

    @abstractmethod
    async def create(self, google_id: str, email: str, name: str, avatar: str | None) -> User: ...

    @abstractmethod
    async def update(self, user: User, **kwargs) -> User: ...
