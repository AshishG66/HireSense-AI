import json
import asyncio
import logging
from typing import Type, Any, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types
from google.genai.errors import APIError
from app.config import settings

logger = logging.getLogger("uvicorn.error")

class GeminiClient:
    """
    Unified client manager wrapper around the Google GenAI SDK.
    Handles content generation, structuring, and token telemetry checks.
    """
    def __init__(self):
        # Uses standard API Key from config
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

    async def generate_structured(
        self,
        prompt: str,
        response_schema: Type[BaseModel],
        model: str = "gemini-2.5-flash",
        temperature: float = 0.1,
        max_retries: int = 3,
        timeout: float = 30.0
    ) -> Any:
        """
        Unified structured content generation method.
        Handles timeout safely, retries on transient failures,
        strips markdown fences, and validates JSON schema.
        """
        logger.info(f"GeminiClient: Requesting structured output for model {model} (schema: {response_schema.__name__})")
        
        # Configure model parameters
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=temperature
        )

        backoff = 2.0
        last_exception = None

        for attempt in range(max_retries):
            try:
                # Wrap synchronous generate_content call in to_thread and wait with timeout
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self.client.models.generate_content,
                        model=model,
                        contents=prompt,
                        config=config
                    ),
                    timeout=timeout
                )
                
                raw_text = response.text
                if not raw_text:
                    raise ValueError("Empty response received from Gemini API")

                # Strip markdown fences (e.g. ```json ... ```)
                cleaned_text = raw_text.strip()
                if cleaned_text.startswith("```"):
                    lines = cleaned_text.splitlines()
                    if len(lines) > 1 and lines[0].startswith("```"):
                        lines = lines[1:]
                    if len(lines) > 0 and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    cleaned_text = "\n".join(lines).strip()

                # Validate JSON schema using Pydantic
                parsed_json = json.loads(cleaned_text)
                validated = response_schema.model_validate(parsed_json)
                return validated

            except asyncio.TimeoutError as e:
                logger.warn(f"GeminiClient: Request timed out on attempt {attempt + 1}/{max_retries}")
                last_exception = Exception("Gemini request timed out")
            except APIError as e:
                status_code = getattr(e, 'code', None)
                logger.warn(f"GeminiClient: API Error code {status_code} on attempt {attempt + 1}/{max_retries}: {str(e)}")
                # Check for transient errors (rate limits or server errors)
                if status_code in [429, 500, 502, 503, 504]:
                    last_exception = e
                else:
                    # Non-transient API error (e.g. 400 Bad Request, 403 Forbidden), fail immediately
                    raise e
            except Exception as e:
                logger.warn(f"GeminiClient: General error on attempt {attempt + 1}/{max_retries}: {str(e)}")
                last_exception = e

            # Apply exponential backoff sleep
            if attempt < max_retries - 1:
                sleep_time = backoff ** attempt
                logger.info(f"GeminiClient: Sleeping for {sleep_time}s before retry...")
                await asyncio.sleep(sleep_time)

        # If all retries failed, raise structured exception
        error_msg = f"Gemini API request failed after {max_retries} attempts. Last error: {str(last_exception)}"
        logger.error(f"GeminiClient: {error_msg}")
        raise Exception(error_msg)

gemini_client = GeminiClient()
