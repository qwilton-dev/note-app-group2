from pydantic import BaseModel
from datetime import datetime


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    avatar: str | None
    theme: str

    model_config = {"from_attributes": True}


class UserUpdateIn(BaseModel):
    theme: str | None = None


class StepOut(BaseModel):
    id: str
    task_id: str
    title: str
    is_completed: bool
    position: int

    model_config = {"from_attributes": True}


class StepCreateIn(BaseModel):
    title: str


class StepUpdateIn(BaseModel):
    title: str | None = None
    is_completed: bool | None = None
    position: int | None = None


class TaskOut(BaseModel):
    id: str
    user_id: str
    list_id: str | None
    title: str
    is_completed: bool
    is_important: bool
    is_my_day: bool
    due_date: str | None
    note: str | None
    completed_at: str | None
    created_at: datetime
    order: float
    steps: list[StepOut]

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_safe(cls, task) -> 'TaskOut':
        steps = task.__dict__.get('steps') or []
        return cls(
            id=task.id,
            user_id=task.user_id,
            list_id=task.list_id,
            title=task.title,
            is_completed=task.is_completed,
            is_important=task.is_important,
            is_my_day=task.is_my_day,
            due_date=task.due_date,
            note=task.note,
            completed_at=task.completed_at,
            created_at=task.created_at,
            order=task.order,
            steps=[StepOut.model_validate(s) for s in steps],
        )


class TaskCreateIn(BaseModel):
    title: str
    list_id: str | None = None
    is_important: bool = False
    is_my_day: bool = False
    due_date: str | None = None


class TaskUpdateIn(BaseModel):
    title: str | None = None
    list_id: str | None = None
    is_completed: bool | None = None
    is_important: bool | None = None
    is_my_day: bool | None = None
    due_date: str | None = None
    note: str | None = None
    completed_at: str | None = None
    order: float | None = None


class ListOut(BaseModel):
    id: str
    user_id: str
    title: str

    model_config = {"from_attributes": True}


class ListCreateIn(BaseModel):
    title: str


class ListUpdateIn(BaseModel):
    title: str
