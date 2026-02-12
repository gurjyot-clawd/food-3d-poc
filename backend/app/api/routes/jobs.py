from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from typing import List
from uuid import uuid4

from app.schemas.job import JobCreate, JobMode, JobProgress, JobResult, JobStatus

router = APIRouter(prefix="/jobs", tags=["jobs"])

# In-memory store for proto stage (will replace with Redis/celery metadata)
JOB_STORE: dict[str, JobProgress] = {}


def _init_job(mode: JobMode) -> JobProgress:
    job_id = str(uuid4())
    progress = JobProgress(job_id=job_id, status=JobStatus.queued, progress=0, stage="ingest", message=None)
    JOB_STORE[job_id] = progress
    return progress


@router.post("/", response_model=JobProgress)
async def create_job(
    background_tasks: BackgroundTasks,
    mode: JobMode = Form(JobMode.photo),
    files: List[UploadFile] = File(...),
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required")
    job = _init_job(mode)

    async def fake_pipeline(job_id: str):
        stages = ["ingest", "preprocess", "reconstruct", "postprocess", "export"]
        for idx, stage in enumerate(stages, start=1):
            JOB_STORE[job_id].stage = stage
            JOB_STORE[job_id].status = JobStatus.running
            JOB_STORE[job_id].progress = int(idx / len(stages) * 100)
        JOB_STORE[job_id].status = JobStatus.done
        JOB_STORE[job_id].message = "Demo pipeline complete"

    background_tasks.add_task(fake_pipeline, job.job_id)
    return job


@router.get("/{job_id}", response_model=JobProgress)
async def get_job(job_id: str):
    if job_id not in JOB_STORE:
        raise HTTPException(status_code=404, detail="Job not found")
    return JOB_STORE[job_id]


@router.get("/{job_id}/result", response_model=JobResult)
async def get_result(job_id: str):
    if job_id not in JOB_STORE:
        raise HTTPException(status_code=404, detail="Job not found")
    progress = JOB_STORE[job_id]
    if progress.status != JobStatus.done:
        raise HTTPException(status_code=400, detail="Job not completed yet")
    return JobResult(job_id=job_id, model_glb_url=f"/storage/{job_id}/outputs/model.glb", metadata_url=f"/storage/{job_id}/metadata.json")
