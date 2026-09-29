import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "DealMind"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./dealmind.db"
    
    # Hindsight Memory Engine
    HINDSIGHT_API_URL: str = "http://localhost:8888"
    HINDSIGHT_API_KEY: Optional[str] = ""
    HINDSIGHT_BANK_PREFIX: str = "dealmind-bank"
    
    # LLM Configuration
    GROQ_API_KEY: Optional[str] = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    FALLBACK_MODEL: str = "qwen/qwen3-32b"
    
    # Frontend and Security
    FRONTEND_URL: str = "http://localhost:5173"
    JWT_SECRET: str = "dealmind-hackathon-2026-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

settings = Settings()
