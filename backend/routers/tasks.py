from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_current_user
from db.session import get_db
from db.repositories.task_repository import TaskRepository, StepRepository
from models.orm import User
from models.schemas import TaskOut, TaskCreateIn, TaskUpdateIn, StepOut, StepCreateIn, StepUpdateIn

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
async def get_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TaskOut]:
    repo = TaskRepository(db)
    return [TaskOut.from_orm_safe(t) for t in await repo.get_all(current_user.id)]


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskOut:
    repo = TaskRepository(db)
    task = await repo.create(current_user.id, **body.model_dump())
    return TaskOut.from_orm_safe(task)


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str,
    body: TaskUpdateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskOut:
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    updates = body.model_dump(exclude_unset=True)

    if "is_completed" in updates:
        if updates["is_completed"] and not task.is_completed:
            updates["completed_at"] = datetime.now(timezone.utc).isoformat()
        elif not updates["is_completed"]:
            updates["completed_at"] = None

    task = await repo.update(task, **updates)
    return TaskOut.from_orm_safe(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    await repo.delete(task)


@router.post("/{task_id}/steps", response_model=StepOut, status_code=status.HTTP_201_CREATED)
async def create_step(
    task_id: str,
    body: StepCreateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StepOut:
    task_repo = TaskRepository(db)
    task = await task_repo.get_by_id(task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    position = len(task.steps)
    step_repo = StepRepository(db)
    step = await step_repo.create(task_id, body.title, position)
    return StepOut.model_validate(step)


@router.patch("/{task_id}/steps/{step_id}", response_model=StepOut)
async def update_step(
    task_id: str,
    step_id: str,
    body: StepUpdateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StepOut:
    task_repo = TaskRepository(db)
    task = await task_repo.get_by_id(task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    step_repo = StepRepository(db)
    step = await step_repo.get_by_id(step_id, task_id)
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    step = await step_repo.update(step, **body.model_dump(exclude_unset=True))
    return StepOut.model_validate(step)


@router.delete("/{task_id}/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_step(
    task_id: str,
    step_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    task_repo = TaskRepository(db)
    task = await task_repo.get_by_id(task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    step_repo = StepRepository(db)
    step = await step_repo.get_by_id(step_id, task_id)
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    await step_repo.delete(step)
