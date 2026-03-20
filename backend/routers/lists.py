from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_current_user
from db.session import get_db
from db.repositories.task_repository import ListRepository
from models.orm import User
from models.schemas import ListOut, ListCreateIn, ListUpdateIn

router = APIRouter(prefix="/lists", tags=["lists"])


@router.get("", response_model=list[ListOut])
async def get_lists(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ListOut]:
    repo = ListRepository(db)
    return [ListOut.model_validate(l) for l in await repo.get_all(current_user.id)]


@router.post("", response_model=ListOut, status_code=status.HTTP_201_CREATED)
async def create_list(
    body: ListCreateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ListOut:
    repo = ListRepository(db)
    lst = await repo.create(current_user.id, body.title)
    return ListOut.model_validate(lst)


@router.patch("/{list_id}", response_model=ListOut)
async def update_list(
    list_id: str,
    body: ListUpdateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ListOut:
    repo = ListRepository(db)
    lst = await repo.get_by_id(list_id, current_user.id)
    if not lst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    lst = await repo.update(lst, body.title)
    return ListOut.model_validate(lst)


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_list(
    list_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = ListRepository(db)
    lst = await repo.get_by_id(list_id, current_user.id)
    if not lst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    await repo.delete(lst)
