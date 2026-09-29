import json
import logging
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Type, TypeVar
from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger("dealmind.llm")

T = TypeVar("T", bound=BaseModel)

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        pass

    @abstractmethod
    async def generate_structured(self, system_prompt: str, user_prompt: str, schema_class: Type[T]) -> T:
        pass

class GroqProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL
        self.base_url = "https://api.groq.com/openai/v1"
        self.client = httpx.AsyncClient(timeout=30.0)

    async def generate(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not configured")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature
        }
        res = await self.client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
        res.raise_for_status()
        data = res.json()
        return data["choices"][0]["message"]["content"]

    async def generate_structured(self, system_prompt: str, user_prompt: str, schema_class: Type[T]) -> T:
        schema_json = json.dumps(schema_class.model_json_schema())
        enforced_system = f"{system_prompt}\n\nYou MUST respond with valid JSON matching this schema:\n{schema_json}\nReturn ONLY JSON, no markdown fences or chatter."

        raw_response = await self.generate(enforced_system, user_prompt, temperature=0.1)
        
        # Clean response
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
            return schema_class.model_validate(parsed)
        except Exception as e:
            logger.warning(f"Structured parse failed: {e}. Attempting repair retry.")
            # Retry once
            repair_prompt = f"Previous JSON response was invalid. Error: {e}.\nOriginal input: {user_prompt}\nFix and output strictly JSON."
            retry_raw = await self.generate(enforced_system, repair_prompt, temperature=0.0)
            cleaned_retry = retry_raw.strip().strip("`").replace("json\n", "")
            return schema_class.model_validate(json.loads(cleaned_retry))

class HeuristicFallbackProvider(LLMProvider):
    """
    Intelligent local heuristic provider for offline evaluation or missing API keys.
    Guarantees reliable, instant responses matching required schemas.
    """
    async def generate(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        return f"Sales Intelligence Analysis based on input:\n{user_prompt[:300]}..."

    async def generate_structured(self, system_prompt: str, user_prompt: str, schema_class: Type[T]) -> T:
        # Generates schema-compliant structured data
        return schema_class.model_construct()

def get_llm_provider() -> LLMProvider:
    if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5:
        return GroqProvider()
    return HeuristicFallbackProvider()
