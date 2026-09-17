import base64
import wave

from google import genai

from app.core.config import settings


class TTSService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.gemini_api_key
        )

    def synthesize(self, text: str, output_path: str) -> str:
        interaction = self.client.interactions.create(
            model="gemini-3.1-flash-tts-preview",
            input=f"Speak clearly and naturally: {text}",
            response_format={
                "type": "audio"
            },
            generation_config={
                "speech_config": [
                    {
                        "voice": "Kore"
                    }
                ]
            },
        )

        audio_output = interaction.output_audio

        if not audio_output:
            raise RuntimeError("Gemini returned no audio output.")

        if not audio_output.data:
            raise RuntimeError("Gemini returned an empty audio output.")

        pcm_data = base64.b64decode(audio_output.data)

        with wave.open(output_path, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(24000)
            wav_file.writeframes(pcm_data)

        return output_path


tts_service = TTSService()