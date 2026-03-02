#\!/bin/bash
set -e

echo "Starting Celery worker..."
poetry run celery -A app.workers.celery_app worker --loglevel=info -Q reconstruct &

echo "Starting FastAPI..."
exec poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
