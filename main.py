import os
import uuid
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

REPLICATE_API = "https://api.replicate.com/v1"
REPLICATE_TOKEN = os.getenv("REPLICATE_API_TOKEN", "")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app = FastAPI(title="AI Music Ops API", version="0.01")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# First-release job index. Replicate remains the source of truth for job status.
jobs: dict[str, dict[str, Any]] = {}


class GenerationRequest(BaseModel):
    track_name: str = Field(default="Untitled track", max_length=80)
    prompt: str = Field(min_length=3, max_length=1000)
    duration: int = Field(default=15, ge=5, le=30)
    output_format: str = Field(default="mp3", pattern="^mp3$")


@app.get("/")
async def root():
    return {"name": "AI Music Ops API", "version": "0.01", "docs": "/docs"}


@app.get("/api/health")
async def health():
    return {"status": "ok", "provider_configured": bool(REPLICATE_TOKEN)}


@app.post("/api/generations")
async def create_generation(request: GenerationRequest):
    if not REPLICATE_TOKEN:
        raise HTTPException(status_code=503, detail="Backend is missing REPLICATE_API_TOKEN.")
    payload = {
        "input": {
            "prompt": request.prompt,
            "duration": request.duration,
            "output_format": request.output_format,
        }
    }
    headers = {
        "Authorization": f"Bearer {REPLICATE_TOKEN}",
        "Content-Type": "application/json",
        "Prefer": "wait=1",
    }
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{REPLICATE_API}/models/meta/musicgen/predictions",
            headers=headers,
            json=payload,
        )
    if response.status_code >= 400:
        detail = "Replicate request failed."
        try:
            detail = response.json().get("detail", detail)
        except ValueError:
            pass
        raise HTTPException(status_code=502, detail=str(detail))
    data = response.json()
    job_id = data.get("id") or str(uuid.uuid4())
    job = {
        "id": job_id,
        "track_name": request.track_name,
        "status": data.get("status", "starting"),
        "output": data.get("output"),
        "error": data.get("error"),
        "urls": data.get("urls", {}),
    }
    jobs[job_id] = job
    return job


@app.get("/api/generations/{job_id}")
async def get_generation(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found on this server.")
    get_url = job.get("urls", {}).get("get")
    if not get_url:
        return job
    headers = {"Authorization": f"Bearer {REPLICATE_TOKEN}"}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(get_url, headers=headers)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Could not retrieve generation status from Replicate.")
    data = response.json()
    job.update({
        "status": data.get("status", job["status"]),
        "output": data.get("output"),
        "error": data.get("error"),
    })
    return job
