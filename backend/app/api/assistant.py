from pathlib import Path
from tempfile import NamedTemporaryFile

from PIL import Image
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.database.repositories.memory_repository import get_memories
from app.services.depth_service import depth_service
from app.services.llm_service import llm_service
from app.services.spatial_service import spatial_service
from app.services.stt_service import stt_service
from app.services.tts_service import tts_service
from app.services.vision_service import vision_service


router = APIRouter(
    prefix="/api/assistant",
    tags=["Assistant"],
)


def cleanup_file(path: str | None) -> None:
    if path:
        Path(path).unlink(missing_ok=True)


@router.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    image: UploadFile = File(...),
):
    audio_suffix = Path(audio.filename or "").suffix or ".wav"
    image_suffix = Path(image.filename or "").suffix or ".jpg"

    audio_path = None
    image_path = None
    output_path = None

    with NamedTemporaryFile(
        delete=False,
        suffix=audio_suffix,
    ) as audio_file:
        audio_file.write(await audio.read())
        audio_path = audio_file.name

    with NamedTemporaryFile(
        delete=False,
        suffix=image_suffix,
    ) as image_file:
        image_file.write(await image.read())
        image_path = image_file.name

    try:
        # 1. Speech-to-text
        transcription = stt_service.transcribe(audio_path)

        # 2. Object detection
        detections = vision_service.detect(image_path)

        # 3. Spatial reasoning
        image_width = Image.open(image_path).width

        for detection in detections:
            detection["horizontal"] = (
                spatial_service.get_horizontal_position(
                    detection["bbox"],
                    image_width,
                )
            )

        # 4. Distance estimation
        detections = depth_service.estimate_distances(
            image_path,
            detections,
        )

        # 5. Retrieve remembered objects
        memories = get_memories(
            "00000000-0000-0000-0000-000000000001",
            limit=20,
        )

        # 6. LLM reasoning
        answer = llm_service.answer(
            transcription,
            detections,
            memories,
        )

        # 7. Text-to-speech
        with NamedTemporaryFile(
            delete=False,
            suffix=".wav",
        ) as output_file:
            output_path = output_file.name

        tts_service.synthesize(
            answer,
            output_path,
        )

        return FileResponse(
            output_path,
            media_type="audio/wav",
            filename="assistant_response.wav",
            background=BackgroundTask(
                cleanup_file,
                output_path,
            ),
        )

    except Exception as exc:
        cleanup_file(audio_path)
        cleanup_file(image_path)
        cleanup_file(output_path)

        raise HTTPException(
            status_code=500,
            detail="Assistant processing failed. Please try again.",
        ) from exc

    finally:
        cleanup_file(audio_path)
        cleanup_file(image_path)