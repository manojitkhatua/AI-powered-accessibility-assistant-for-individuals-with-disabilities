from google import genai

from app.core.config import settings


class STTService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.gemini_api_key)

    def transcribe(self, audio_path: str) -> str:
        audio_file = self.client.files.upload(file=audio_path)

        interaction = self.client.interactions.create(
            model="gemini-3.6-flash",
            input=[
                {
                    "type": "audio",
                    "uri": audio_file.uri,
                    "mime_type": audio_file.mime_type,
                },
                {
                    "type": "text",
                    "text": "Transcribe this audio exactly. Return only the spoken words.",
                },
            ],
        )

        if not interaction.output_text:
            raise RuntimeError(
                f"Gemini returned no transcription. Response: {interaction}"
            )

        return interaction.output_text.strip()


stt_service = STTService()