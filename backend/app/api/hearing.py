from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.sound_service import sound_service


router = APIRouter(
    prefix="/api/hearing",
    tags=["Hearing"],
)


@router.post("/analyze")
async def analyze_sound(
    audio: UploadFile = File(...),
):
    audio_suffix = Path(audio.filename or "").suffix or ".webm"
    audio_path = None

    with NamedTemporaryFile(
        delete=False,
        suffix=audio_suffix,
    ) as audio_file:
        audio_file.write(await audio.read())
        audio_path = audio_file.name

    try:
        result = sound_service.classify(audio_path)

        return result

    except Exception as exc:
        import traceback

        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail="Sound analysis failed. Please try again.",
        ) from exc
        
    finally:
        if audio_path:
            Path(audio_path).unlink(missing_ok=True)