import base64
import json

from google import genai

from app.core.config import settings


class SoundService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.gemini_api_key,
        )

    def classify(self, audio_path: str) -> dict:
        """Analyze a short environmental audio recording."""

        with open(audio_path, "rb") as audio_file:
            audio_bytes = audio_file.read()

        if not audio_bytes:
            raise RuntimeError(
                "The recorded audio file is empty."
            )

        audio_data = base64.b64encode(audio_bytes).decode("utf-8")

        prompt = """
You are an environmental sound detection assistant
for a person with a hearing disability.

Analyze the uploaded audio and identify the most important
environmental sound that can actually be heard.

Return ONLY valid JSON using exactly this structure:

{
  "sound": "short sound name",
  "category": "short category",
  "description": "one concise description",
  "urgency": "low"
}

Allowed urgency values:

- low
- normal
- warning
- high

Possible sounds include:

- Doorbell
- Alarm
- Siren
- Vehicle horn
- Vehicle
- Dog barking
- Human speech
- Footsteps
- Glass breaking
- Knock
- Phone ringing
- Appliance
- Music
- Background noise
- Unclear sound

Use "high" only for clearly audible potentially urgent sounds
such as alarms, sirens, or vehicle horns.

Do not invent sounds.

If no clearly identifiable sound is present, return:

{
  "sound": "Unclear sound",
  "category": "Environmental Sound",
  "description": "No clearly identifiable sound was detected.",
  "urgency": "low"
}
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

        if not response.text:
            raise RuntimeError(
                "Gemini returned no sound classification."
            )

        text = response.text.strip()

        if text.startswith("```json"):
            text = text[7:]

        elif text.startswith("```"):
            text = text[3:]

        if text.endswith("```"):
            text = text[:-3]

        text = text.strip()

        try:
            result = json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "Gemini returned invalid JSON."
            ) from exc

        required_fields = (
            "sound",
            "category",
            "description",
            "urgency",
        )

        for field in required_fields:
            if field not in result:
                raise RuntimeError(
                    f"Gemini response is missing '{field}'."
                )

        allowed_urgency = {
            "low",
            "normal",
            "warning",
            "high",
        }

        if result["urgency"] not in allowed_urgency:
            result["urgency"] = "normal"

        return {
            "sound": str(result["sound"]),
            "category": str(result["category"]),
            "description": str(result["description"]),
            "urgency": result["urgency"],
        }


sound_service = SoundService()