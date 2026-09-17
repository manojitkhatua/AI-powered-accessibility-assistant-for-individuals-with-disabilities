from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, UploadFile

from app.services.llm_service import llm_service
from app.services.spatial_service import spatial_service
from app.services.stt_service import stt_service
from app.services.vision_service import vision_service


router = APIRouter(
    prefix="/api/assistant",
    tags=["Assistant"],
)


@router.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    image: UploadFile = File(...),
):
    audio_suffix = Path(audio.filename or "").suffix or ".wav"
    image_suffix = Path(image.filename or "").suffix or ".jpg"

    with NamedTemporaryFile(delete=False, suffix=audio_suffix) as audio_file:
        audio_file.write(await audio.read())
        audio_path = audio_file.name

    with NamedTemporaryFile(delete=False, suffix=image_suffix) as image_file:
        image_file.write(await image.read())
        image_path = image_file.name

    try:
        transcription = stt_service.transcribe(audio_path)

        detections = vision_service.detect(image_path)

        image_width = 3000

        for detection in detections:
            detection["horizontal"] = (
                spatial_service.get_horizontal_position(
                    detection["bbox"],
                    image_width,
                )
            )

        answer = llm_service.answer(
            transcription,
            detections,
        )

        return {
            "transcription": transcription,
            "detections": detections,
            "answer": answer,
        }

    finally:
        Path(audio_path).unlink(missing_ok=True)
        Path(image_path).unlink(missing_ok=True)