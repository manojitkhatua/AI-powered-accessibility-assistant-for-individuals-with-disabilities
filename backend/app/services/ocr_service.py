import base64

from google import genai

from app.core.config import settings


class OCRService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.gemini_api_key
        )

    def extract_text(self, image_path: str) -> str:
        with open(image_path, "rb") as image_file:
            image_bytes = image_file.read()

        if not image_bytes:
            raise RuntimeError(
                "The camera image is empty."
            )

        image_data = base64.b64encode(
            image_bytes
        ).decode("utf-8")

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_data,
                    }
                },
                """
Read all clearly visible text in this image.

Return only the text you can actually read.
Preserve the natural order of the text.
Do not describe the image.
If there is no readable text, return an empty response.
""",
            ],
        )

        text = getattr(
            response,
            "text",
            None,
        )

        if not text:
            return ""

        return text.strip()


ocr_service = OCRService()