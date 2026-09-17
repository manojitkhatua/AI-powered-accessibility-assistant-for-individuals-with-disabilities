from google import genai

from app.core.config import settings


class OCRService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.gemini_api_key
        )

    def extract_text(self, image_path: str) -> str:
        image_file = self.client.files.upload(
            file=image_path
        )

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                image_file,
                (
                    "Read all clearly visible text in this image. "
                    "Return only the extracted text. "
                    "Preserve the natural reading order. "
                    "Do not describe objects or the image. "
                    "If there is no visible text, return an empty string."
                ),
            ],
        )

        if not response.text:
            return ""

        return response.text.strip()


ocr_service = OCRService()