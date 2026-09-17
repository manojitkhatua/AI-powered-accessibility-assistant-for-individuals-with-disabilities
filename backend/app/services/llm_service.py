from google import genai

from app.core.config import settings


class LLMService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.gemini_api_key
        )

    def answer(
        self,
        question: str,
        detections: list[dict],
        memories: list[dict] | None = None,
    ) -> str:
        memories = memories or []

        prompt = f"""
            You are an accessibility assistant for a person with a disability.

            User question:
            {question}

            Objects detected by the camera:
            {detections}

            Relevant remembered objects:
            {memories}

            Answer the user's question using the current detections and remembered information.
            Be concise, clear, and spatially specific when possible.
            Mention uncertainty when detection confidence is low.
            Do not invent objects that are not in the detections or memories.
            """

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )

        if not response.text:
            raise RuntimeError(
                "Gemini returned no answer."
            )

        return response.text.strip()


llm_service = LLMService()