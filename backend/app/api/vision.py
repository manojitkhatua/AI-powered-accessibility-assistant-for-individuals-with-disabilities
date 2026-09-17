from pathlib import Path
from tempfile import NamedTemporaryFile

from PIL import Image
from fastapi import APIRouter, File, UploadFile

from app.services.depth_service import depth_service
from app.services.spatial_service import spatial_service
from app.services.vision_service import vision_service
from app.services.ocr_service import ocr_service

router = APIRouter(
    prefix="/api/vision",
    tags=["Vision"],
)


@router.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix or ".jpg"

    with NamedTemporaryFile(
        delete=False,
        suffix=suffix,
    ) as temp_file:
        temp_file.write(await file.read())
        temp_path = temp_file.name

    try:
        detections = vision_service.detect(temp_path)

        image_width = Image.open(temp_path).width

        for detection in detections:
            detection["horizontal"] = spatial_service.get_horizontal_position(
                detection["bbox"],
                image_width,
            )

        detections = depth_service.estimate_distances(
            temp_path,
            detections,
        )

        return {"detections": detections}

    finally:
        Path(temp_path).unlink(missing_ok=True)
        
@router.post("/ocr")
async def read_text(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix or ".jpg"

    with NamedTemporaryFile(
        delete=False,
        suffix=suffix,
    ) as temp_file:
        temp_file.write(await file.read())
        temp_path = temp_file.name

    try:
        text = ocr_service.extract_text(
            temp_path
        )

        return {
            "text": text,
        }

    finally:
        Path(temp_path).unlink(
            missing_ok=True
        )