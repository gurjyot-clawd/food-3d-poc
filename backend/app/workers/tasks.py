import time
from loguru import logger

from app.workers.celery_app import celery_app


@celery_app.task(bind=True)
def reconstruct_task(self, job_id: str):
    stages = ["ingest", "preprocess", "reconstruct", "postprocess", "export"]
    for idx, stage in enumerate(stages, start=1):
        logger.info("Job %s stage %s", job_id, stage)
        time.sleep(1)
    logger.info("Job %s finished", job_id)
    return {"job_id": job_id, "status": "done"}
