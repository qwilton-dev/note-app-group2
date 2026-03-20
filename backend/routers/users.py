from fastapi import APIRouter, Depends
from core.dependencies import get_current_user
from db.session import get_db
from db.repositories.user_repository import UserRepository
from models.orm import User
from models.schemas import UserOut, UserUpdateIn
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UserUpdateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    updates = body.model_dump(exclude_none=True)
    if not updates:
        return UserOut.model_validate(current_user)
    repo = UserRepository(db)
    user = await repo.update(current_user, **updates)
    return UserOut.model_validate(user)
