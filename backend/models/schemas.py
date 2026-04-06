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
    estimated_hours: float | None
    steps: list[StepOut]

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_safe(cls, task) -> "TaskOut":
        raw = task.__dict__.get("steps", [])
        steps = raw if isinstance(raw, list) else (list(task.steps) if task.steps is not None else [])
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
            estimated_hours=task.estimated_hours,
            steps=[StepOut.model_validate(s) for s in steps],
        )


class TaskCreateIn(BaseModel):
    title: str
    list_id: str | None = None
    is_important: bool = False
    is_my_day: bool = False
    due_date: str | None = None
    estimated_hours: float | None = None


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
    estimated_hours: float | None = None


class ListOut(BaseModel):
    id: str
    user_id: str
    title: str

    model_config = {"from_attributes": True}


class ListCreateIn(BaseModel):
    title: str


class ListUpdateIn(BaseModel):
    title: str


class RoadmapGenerateOut(BaseModel):
    tasks: list[TaskOut]
    list: ListOut

    model_config = {"from_attributes": True}


class RoadmapChatMessageIn(BaseModel):
    role: str
    content: str


class RoadmapChatIn(BaseModel):
    messages: list[RoadmapChatMessageIn]


class RoadmapPlanTask(BaseModel):
    title: str
    subtasks: list[str] = []


class RoadmapChatOut(BaseModel):
    status: str  # "clarify" | "plan"
    message: str
    plan: list[RoadmapPlanTask] | None = None


class RoadmapConfirmIn(BaseModel):
    goal: str
    plan: list[RoadmapPlanTask]

class RoadmapOut(BaseModel):
    id: str
    user_id: str
    goal: str
    context: str | None
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RoadmapCreateIn(BaseModel):
    goal: str
    context: str | None = None


class RoadmapUpdateIn(BaseModel):
    goal: str | None = None
    context: str | None = None
    is_completed: bool | None = None


class RoadmapGenerateIn(BaseModel):
    goal: str
    context: str | None = None
    max_depth: int = 3
    include_deadlines: bool = False
