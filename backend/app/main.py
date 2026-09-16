from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.memory import router as memory_router

from app.api.vision import router as vision_router


app = FastAPI(
    title="AI-01 Accessibility Assistant API",
    description="Backend API for the AI-powered accessibility assistant.",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health_router)
app.include_router(memory_router) 
app.include_router(vision_router)

@app.get("/")
async def root():
    return {
        "message": "AI-01 Accessibility Assistant API",
        "status": "running",
    }