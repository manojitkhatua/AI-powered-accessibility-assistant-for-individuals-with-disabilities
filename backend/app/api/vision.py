from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, UploadFile

from app.services.vision_service import vision_service


router = APIRouter(
    prefix="/api/vision",
    tags=["Vision"],
)


@router.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix or ".jpg"

    with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(await file.read())
        temp_path = temp_file.name

    try:
        return {
            "detections": vision_service.detect(temp_path)
        }
    finally:
        Path(temp_path).unlink(missing_ok=True)