import base64

from google import genai

from app.core.config import settings


class STTService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.gemini_api_key
        )

    def transcribe(self, audio_path: str) -> str:
        with open(audio_path, "rb") as audio_file:
            audio_bytes = audio_file.read()

        if not audio_bytes:
            raise RuntimeError(
                "The recorded speech audio is empty."
            )

        audio_data = base64.b64encode(
            audio_bytes
        ).decode("utf-8")

        prompt = """
Transcribe the spoken audio exactly.

Return only the transcription.
Do not add explanations, labels, or commentary.
"""

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                {
                    "inline_data": {
                        "mime_type": "audio/webm",
                        "data": audio_data,
                    }
                },
                prompt,
            ],
        )

        # First try the SDK convenience property.
        text = getattr(response, "text", None)

        # Fall back to extracting text from candidates.
        if not text:
            candidates = getattr(
                response,
                "candidates",
                None,
            ) or []

            parts = []

            for candidate in candidates:
                content = getattr(
                    candidate,
                    "content",
                    None,
                )

                if not content:
                    continue

                for part in (
                    getattr(content, "parts", None)
                    or []
                ):
                    part_text = getattr(
                        part,
                        "text",
                        None,
                    )

                    if part_text:
                        parts.append(
                            part_text
                        )

            text = " ".join(parts).strip()

        if not text:
            print(
                "Gemini STT returned no text."
            )
            print(
                "Gemini response:",
                response,
            )

            raise RuntimeError(
                "Gemini could not transcribe the recorded speech."
            )

        return text.strip()


stt_service = STTService()