from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings
from core.dependencies import get_current_user
from db.session import get_db
from services.openrouter_service import RoadmapService, ChatMessage
from models.orm import User, Roadmap, Task, Step, List
from models.schemas import (
    RoadmapOut,
    RoadmapCreateIn,
    RoadmapUpdateIn,
    RoadmapChatIn,
    RoadmapChatOut,
    RoadmapConfirmIn,
    RoadmapGenerateOut,
    TaskOut,
    ListOut,
)
from sqlalchemy import select
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


@router.post("", response_model=RoadmapOut, status_code=status.HTTP_201_CREATED)
async def create_roadmap(
    body: RoadmapCreateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapOut:
    roadmap = Roadmap(user_id=current_user.id, goal=body.goal, context=body.context)
    db.add(roadmap)
    await db.commit()
    await db.refresh(roadmap)
    return RoadmapOut.model_validate(roadmap)


@router.get("", response_model=list[RoadmapOut])
async def get_roadmaps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[RoadmapOut]:
    result = await db.execute(
        select(Roadmap)
        .where(Roadmap.user_id == current_user.id)
        .order_by(Roadmap.created_at.desc())
    )
    return [RoadmapOut.model_validate(r) for r in result.scalars().all()]


@router.get("/{roadmap_id}", response_model=RoadmapOut)
async def get_roadmap(
    roadmap_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapOut:
    result = await db.execute(
        select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id)
    )
    roadmap = result.scalar_one_or_none()
    if not roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return RoadmapOut.model_validate(roadmap)


@router.patch("/{roadmap_id}", response_model=RoadmapOut)
async def update_roadmap(
    roadmap_id: str,
    body: RoadmapUpdateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapOut:
    result = await db.execute(
        select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id)
    )
    roadmap = result.scalar_one_or_none()
    if not roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(roadmap, field, value)
    await db.commit()
    await db.refresh(roadmap)
    return RoadmapOut.model_validate(roadmap)


@router.delete("/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_roadmap(
    roadmap_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id)
    )
    roadmap = result.scalar_one_or_none()
    if not roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    await db.delete(roadmap)
    await db.commit()


@router.post("/{roadmap_id}/chat", response_model=RoadmapChatOut)
async def roadmap_chat(
    roadmap_id: str,
    body: RoadmapChatIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapChatOut:
    result = await db.execute(
        select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id)
    )
    roadmap = result.scalar_one_or_none()
    if not roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    service = RoadmapService(api_key=settings.openrouter_api_key)
    try:
        messages = [ChatMessage(role=m.role, content=m.content) for m in body.messages]
        response = await service.chat(messages, goal=roadmap.goal)
        return RoadmapChatOut(
            status=response.status,
            message=response.message,
            plan=[{"title": t.title, "subtasks": t.subtasks} for t in response.plan] if response.plan else None,
        )
    finally:
        await service.close()


@router.post("/{roadmap_id}/confirm", response_model=RoadmapGenerateOut, status_code=status.HTTP_201_CREATED)
async def confirm_roadmap(
    roadmap_id: str,
    body: RoadmapConfirmIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapGenerateOut:
    result = await db.execute(
        select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    goal_list = List(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=body.goal[:100],
    )
    db.add(goal_list)

    created_task_ids = []
    for item in body.plan:
        task_id = str(uuid.uuid4())
        db.add(Task(
            id=task_id,
            user_id=current_user.id,
            roadmap_id=roadmap_id,
            list_id=goal_list.id,
            title=item.title,
        ))
        for i, subtask_title in enumerate(item.subtasks):
            db.add(Step(
                id=str(uuid.uuid4()),
                task_id=task_id,
                title=subtask_title,
                position=i,
            ))
        created_task_ids.append(task_id)

    await db.commit()

    list_out = ListOut(id=goal_list.id, user_id=goal_list.user_id, title=goal_list.title)

    now = datetime.now(timezone.utc)
    tasks_out = []
    for i, item in enumerate(body.plan):
        task_id = created_task_ids[i]
        tasks_out.append(TaskOut(
            id=task_id,
            user_id=current_user.id,
            list_id=goal_list.id,
            title=item.title,
            is_completed=False,
            is_important=False,
            is_my_day=False,
            due_date=None,
            note=None,
            completed_at=None,
            created_at=now,
            order=now.timestamp() * 1000 + i,
            estimated_hours=None,
            steps=[
                {"id": str(uuid.uuid4()), "task_id": task_id, "title": s, "is_completed": False, "position": j}
                for j, s in enumerate(item.subtasks)
            ],
        ))

    return {"tasks": tasks_out, "list": list_out}
