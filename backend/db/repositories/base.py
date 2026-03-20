from abc import ABC, abstractmethod
from models.orm import List, Task, Step


class AbstractListRepository(ABC):
    @abstractmethod
    async def get_all(self, user_id: str) -> list[List]: ...

    @abstractmethod
    async def get_by_id(self, list_id: str, user_id: str) -> List | None: ...

    @abstractmethod
    async def create(self, user_id: str, title: str) -> List: ...

    @abstractmethod
    async def update(self, lst: List, title: str) -> List: ...

    @abstractmethod
    async def delete(self, lst: List) -> None: ...


class AbstractTaskRepository(ABC):
    @abstractmethod
    async def get_all(self, user_id: str) -> list[Task]: ...

    @abstractmethod
    async def get_by_id(self, task_id: str, user_id: str) -> Task | None: ...

    @abstractmethod
    async def create(self, user_id: str, **kwargs) -> Task: ...

    @abstractmethod
    async def update(self, task: Task, **kwargs) -> Task: ...

    @abstractmethod
    async def delete(self, task: Task) -> None: ...

    @abstractmethod
    async def reset_my_day(self, user_id: str) -> None: ...


class AbstractStepRepository(ABC):
    @abstractmethod
    async def create(self, task_id: str, title: str, position: int) -> Step: ...

    @abstractmethod
    async def get_by_id(self, step_id: str, task_id: str) -> Step | None: ...

    @abstractmethod
    async def update(self, step: Step, **kwargs) -> Step: ...

    @abstractmethod
    async def delete(self, step: Step) -> None: ...
