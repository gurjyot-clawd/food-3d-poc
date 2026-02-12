from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class JobMode(str, Enum):
    photo = "photo"
    video = "video"


class JobStatus(str, Enum):
    queued = "queued"
    running = "running"
    done = "done"
    failed = "failed"


class JobCreate(BaseModel):
    mode: JobMode = JobMode.photo


class JobProgress(BaseModel):
    job_id: str
    status: JobStatus
    progress: int = Field(ge=0, le=100)
    stage: str
    message: Optional[str]


class JobResult(BaseModel):
    job_id: str
    model_glb_url: Optional[str]
    metadata_url: Optional[str]
