import uuid
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from db.repositories.base import AbstractListRepository, AbstractTaskRepository, AbstractStepRepository
from models.orm import List, Task, Step


class ListRepository(AbstractListRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_all(self, user_id: str) -> list[List]:
        result = await self._session.execute(select(List).where(List.user_id == user_id))
        return list(result.scalars().all())

    async def get_by_id(self, list_id: str, user_id: str) -> List | None:
        result = await self._session.execute(
            select(List).where(List.id == list_id, List.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: str, title: str) -> List:
        lst = List(id=str(uuid.uuid4()), user_id=user_id, title=title)
        self._session.add(lst)
        await self._session.commit()
        await self._session.refresh(lst)
        return lst

    async def update(self, lst: List, title: str) -> List:
        lst.title = title
        await self._session.commit()
        await self._session.refresh(lst)
        return lst

    async def delete(self, lst: List) -> None:
        await self._session.delete(lst)
        await self._session.commit()


class TaskRepository(AbstractTaskRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def _get_with_steps(self, task_id: str) -> Task:
        result = await self._session.execute(
            select(Task).where(Task.id == task_id)
            .options(selectinload(Task.steps))
        )
        return result.scalar_one()

    async def get_all(self, user_id: str) -> list[Task]:
        result = await self._session.execute(
            select(Task).where(Task.user_id == user_id)
            .options(selectinload(Task.steps))
            .execution_options(populate_existing=True)
        )
        return list(result.scalars().all())

    async def get_by_id(self, task_id: str, user_id: str) -> Task | None:
        result = await self._session.execute(
            select(Task)
            .where(Task.id == task_id, Task.user_id == user_id)
            .options(selectinload(Task.steps))
            .execution_options(populate_existing=True)
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: str, **kwargs) -> Task:
        task = Task(id=str(uuid.uuid4()), user_id=user_id, **kwargs)
        self._session.add(task)
        await self._session.commit()
        task_id = task.id
        self._session.expire_all()
        return await self._get_with_steps(task_id)

    async def update(self, task: Task, **kwargs) -> Task:
        for key, value in kwargs.items():
            setattr(task, key, value)
        await self._session.commit()
        return await self._get_with_steps(task.id)

    async def delete(self, task: Task) -> None:
        await self._session.delete(task)
        await self._session.commit()

    async def reset_my_day(self, user_id: str) -> None:
        await self._session.execute(
            update(Task).where(Task.user_id == user_id).values(is_my_day=False)
        )
        await self._session.commit()


class StepRepository(AbstractStepRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, task_id: str, title: str, position: int) -> Step:
        step = Step(id=str(uuid.uuid4()), task_id=task_id, title=title, position=position)
        self._session.add(step)
        await self._session.commit()
        await self._session.refresh(step)
        return step

    async def get_by_id(self, step_id: str, task_id: str) -> Step | None:
        result = await self._session.execute(
            select(Step).where(Step.id == step_id, Step.task_id == task_id)
        )
        return result.scalar_one_or_none()

    async def update(self, step: Step, **kwargs) -> Step:
        for key, value in kwargs.items():
            setattr(step, key, value)
        await self._session.commit()
        await self._session.refresh(step)
        return step

    async def delete(self, step: Step) -> None:
        await self._session.delete(step)
        await self._session.commit()
