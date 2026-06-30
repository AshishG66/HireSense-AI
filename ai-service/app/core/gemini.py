from google import genai
from app.config import settings

class GeminiClient:
    """
    Unified client manager wrapper around the Google GenAI SDK.
    Handles content generation, structuring, and token telemetry checks.
    """
    def __init__(self):
        # Uses standard API Key from config, fails gracefully for mock testing
        self.client = genai.Client(api_key=settings.gemini_api_key)

    def generate_text(self, prompt: str, model: str = "gemini-2.5-flash") -> str:
        """
        Submits prompt content to Gemini API and harvests response texts.
        """
        response = self.client.models.generate_content(
            model=model,
            contents=prompt,
        )
        return response.text

gemini_client = GeminiClient()
