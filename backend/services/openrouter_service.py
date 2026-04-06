import httpx
import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)

MODELS = [
    "google/gemma-3n-e4b-it:free",
    "google/gemma-3n-e2b-it:free",
    "google/gemma-3-4b-it:free",
]

SYSTEM_PROMPT = """Ты — ассистент по планированию проектов. Твоя задача — помочь пользователю разбить его цель на конкретные задачи.

ТЫ ВСЕГДА ОТВЕЧАЕШЬ НА РУССКОМ ЯЗЫКЕ, независимо от языка пользователя.

ТЫ ВСЕГДА отвечаешь одним JSON-объектом в одном из двух форматов:

1. Если нужно уточнить детали перед составлением плана:
{"status": "clarify", "message": "Твой вопрос пользователю"}

2. Если информации достаточно — показываешь план на утверждение:
{"status": "plan", "message": "Краткое описание плана", "plan": [{"title": "Название задачи", "subtasks": ["Подзадача 1", "Подзадача 2"]}]}

Правила:
- Задавай максимум 1 уточняющий вопрос за весь диалог
- Если цель понятна или пользователь говорит что уточнять нечего — сразу переходи к плану
- В плане должно быть 3-7 задач, в каждой 2-5 подзадач
- Подзадачи — простые строки
- ТОЛЬКО чистый JSON, без markdown, без лишнего текста
- ВСЕГДА на русском языке
"""


class PlanTask(BaseModel):
    title: str
    subtasks: List[str] = []


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    status: str  # "clarify" | "plan"
    message: str
    plan: Optional[List[PlanTask]] = None


class RoadmapService:
    def __init__(self, api_key: str, base_url: str = "https://openrouter.ai/api/v1"):
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            base_url=base_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "https://focusflow.app",
                "X-Title": "FocusFlow AI Roadmap Generator",
            },
            timeout=60.0,
        )

    async def chat(self, messages: List[ChatMessage], goal: str = "") -> ChatResponse:
        payload_messages = [
            {"role": "user", "content": SYSTEM_PROMPT + "\n\nЦель роадмапа: " + goal + "\n\nПользователь: " + messages[0].content}
        ]
        if len(messages) > 1:
            payload_messages += [{"role": m.role, "content": m.content} for m in messages[1:]]

        last_error: Exception = Exception("No models available")
        for model in MODELS:
            try:
                response = await self.client.post("/chat/completions", json={
                    "model": model,
                    "messages": payload_messages,
                    "temperature": 0.3,
                    "max_tokens": 1500,
                })
                if response.status_code == 429:
                    logger.warning(f"Rate limit on {model}, trying next")
                    last_error = Exception(f"OpenRouter error: 429")
                    continue
                if response.status_code != 200:
                    raise Exception(f"OpenRouter error: {response.status_code}")
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                logger.info(f"AI raw response ({model}): {content}")
                return self._parse_response(content)
            except Exception as e:
                if "429" in str(e):
                    last_error = e
                    continue
                raise
        raise last_error

    def _parse_response(self, content: str) -> ChatResponse:
        content = content.strip()

        # Strip markdown code blocks
        if content.startswith("```"):
            content = content.split("\n", 1)[-1]
            content = content.rsplit("```", 1)[0].strip()

        # Find JSON object
        start = content.find("{")
        end = content.rfind("}") + 1
        if start == -1 or end == 0:
            return ChatResponse(status="clarify", message=content)

        try:
            parsed = json.loads(content[start:end])
            status = parsed.get("status", "clarify")
            message = parsed.get("message", "")
            plan_data = parsed.get("plan")

            plan = None
            if plan_data and isinstance(plan_data, list):
                plan = []
                for item in plan_data:
                    if isinstance(item, dict):
                        subtasks = item.get("subtasks", [])
                        # subtasks могут быть строками или объектами
                        subtask_titles = [
                            s if isinstance(s, str) else s.get("title", "")
                            for s in subtasks
                        ]
                        plan.append(PlanTask(title=item.get("title", ""), subtasks=subtask_titles))

            return ChatResponse(status=status, message=message, plan=plan)

        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse AI response: {e}\nContent: {content}")
            return ChatResponse(status="clarify", message=content)

    async def close(self):
        await self.client.aclose()
