from fastapi import APIRouter


router = APIRouter(
    prefix="/api/health",
    tags=["Health"],
)


@router.get("")
async def health_check():
    return {
        "status": "ok",
        "service": "AI-01 backend",
        "environment": "development",
    }