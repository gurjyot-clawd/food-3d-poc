# Food 3D Wireframe POC

Proof-of-concept system that ingests multi-view food captures (photo set or short video), reconstructs a high-density 3D mesh + wireframe using a photogrammetry pipeline, and renders the result inside an interactive 3D web viewer.

## High-Level Architecture

| Layer     | Stack                    | Notes |
|-----------|-------------------------|-------|
| Frontend  | Next.js + Three.js      | Upload UI, progress dashboard, GLTF viewer with orbit/pan/zoom + render mode toggles |
| Backend   | FastAPI + Celery        | Job API, async pipeline orchestration, storage of artifacts |
| Pipeline  | COLMAP + OpenMVS        | SfM + MVS reconstruction, mesh cleanup, texture bake, LOD + wireframe generation |
| Storage   | Local disk (POC)        | `storage/jobs/<job_id>/...` keeps raw media, frames, COLMAP outputs, meshes, exports |
| Queue     | Redis (via docker-compose) | Handles long-running reconstruction tasks |

## Roadmap (POC)

1. **Scaffold** backend (FastAPI endpoints + Celery worker) and frontend (Next.js app, Three.js viewer shell).
2. **Implement ingest** module: upload handling, frame extraction for videos, blur filtering, capture validation.
3. **Integrate photogrammetry** stack (COLMAP + OpenMVS) via pipeline wrappers; emit dense meshes + textures.
4. **Postprocess & export**: cleanup mesh, generate LODs, wireframe overlays, GLB/OBJ export, metadata JSON.
5. **Frontend viewer**: fetch job result, render GLB with textured/shaded/wireframe modes, show stats + download button.
6. **Docker-compose** for local bring-up + README instructions.

## Tech Principles

- **Poetry-managed Python envs** per service (backend pipeline runs inside Poetry venv).
- **Modular pipeline** (`backend/pipeline/*`) for future swaps (NeRF, segmentation, etc.).
- **Configurable density** (triangle targets per LOD) via settings file / env.
- **Progress visibility**: stages emit logs + percent progress for frontend polling.

More detailed docs will follow as implementation lands.
