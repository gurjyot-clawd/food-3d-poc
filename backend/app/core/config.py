from pathlib import Path
from pydantic import BaseModel, Field
from functools import lru_cache


class Settings(BaseModel):
    api_prefix: str = "/api"
    storage_root: Path = Field(default=Path("storage"))
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/1"
    celery_result_backend: str = "redis://redis:6379/2"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.storage_root.mkdir(parents=True, exist_ok=True)
    return settings
