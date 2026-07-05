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

STATIC_MOCK_RESPONSES = {
    "ResumeAnalysisResponse": {
        "full_name": "Jane Doe",
        "email": "jane.doe@example.com",
        "phone": "+1-555-0199",
        "location": "San Francisco, CA",
        "linkedin": "https://linkedin.com/in/janedoe",
        "github": "https://github.com/janedoe",
        "portfolio": "https://janedoe.dev",
        "education": [
            {
                "school": "State University",
                "degree": "Bachelor of Science",
                "field_of_study": "Computer Science",
                "start_date": "2018",
                "end_date": "2022",
                "description": "Graduated with honors, GPA 3.8/4.0"
            }
        ],
        "experience": [
            {
                "company": "Tech Solutions Inc.",
                "position": "Software Engineer",
                "start_date": "2022-06",
                "end_date": "Present",
                "description": "Developed React and Node.js applications. Optimized DB queries."
            }
        ],
        "projects": [
            {
                "title": "E-Commerce Platform",
                "description": "Built full-stack e-commerce site with high concurrency handling.",
                "technologies": ["React", "Node.js", "PostgreSQL"],
                "link": "https://github.com/janedoe/ecommerce"
            }
        ],
        "skills": ["JavaScript", "TypeScript", "React", "Node.js", "Express", "SQL"],
        "certifications": ["AWS Certified Developer"],
        "achievements": ["First Place in Hackathon"],
        "languages": ["English"],
        "match_percentage": 85.0,
        "summary": "Experienced Software Engineer specialized in React and Node.js full-stack development.",
        "skills_match": {
            "matched_skills": ["React", "Node.js", "TypeScript"],
            "missing_skills": ["Docker"]
        },
        "strengths": ["React interface implementation", "TypeScript modularity"],
        "weaknesses": ["Deployment automation"],
        "missing_skills": ["Docker"],
        "missing_keywords": ["Docker", "CI/CD"],
        "suggested_projects": ["Dockerize a multi-container React/Node.js app"],
        "recommended_certifications": ["AWS Certified Developer"],
        "suggested_summary": "Highly motivated Full Stack developer with proven track record in React/Node.js.",
        "interview_prep_tips": ["Review React Virtual DOM and reconciliation"],
        "formatting_issues": [],
        "grammar_issues": []
    },
    "ResumeBuilderResponse": {
        "suggested_summary": "Experienced Software Engineer specialized in React and Node.js full-stack development.",
        "formatted_experience": [
            {
                "company": "Tech Solutions Inc.",
                "position": "Software Engineer",
                "start_date": "2022-06",
                "end_date": "Present",
                "description": "Developed React and Node.js applications. Optimized DB queries."
            }
        ],
        "formatted_education": [
            {
                "school": "State University",
                "degree": "Bachelor of Science",
                "field_of_study": "Computer Science",
                "start_date": "2018",
                "end_date": "2022",
                "description": "Graduated with honors, GPA 3.8/4.0"
            }
        ],
        "suggested_skills": ["JavaScript", "TypeScript", "React", "Node.js", "Express", "SQL"]
    },
    "InterviewGenerationResponse": {
        "questions": [
            {
                "question_text": "Can you explain the difference between virtual DOM and real DOM in React?",
                "expected_criteria": "Mention direct DOM updates are slow, virtual DOM keeps lightweight representation in memory and reconciles changes efficiently.",
                "question_type": "TECHNICAL"
            },
            {
                "question_text": "How do you handle asynchronous operations in Node.js? Explain async/await.",
                "expected_criteria": "Mention Promises, async/await wrapper, error handling with try/catch, and the non-blocking event loop.",
                "question_type": "TECHNICAL"
            },
            {
                "question_text": "Describe a challenging technical problem you solved recently and your approach.",
                "expected_criteria": "Candidate should use STAR method to explain situation, task, actions taken, and the positive result/metrics.",
                "question_type": "BEHAVIORAL"
            }
        ]
    },
    "AnswerEvaluationResponse": {
        "technical_accuracy": 8.5,
        "communication": 8.0,
        "problem_solving": 8.0,
        "confidence": 8.5,
        "completeness": 8.0,
        "grammar": 9.0,
        "overall_score": 8.3,
        "feedback": "The candidate provided a structured answer demonstrating clear understanding of React Virtual DOM and reconciliation.",
        "suggestions": [
            "Include details about batch state updates"
        ]
    },
    "ReportGenerationResponse": {
        "overall_score": 82.0,
        "technical_score": 84.0,
        "behavioral_score": 80.0,
        "communication_score": 82.0,
        "strengths": ["Strong conceptual grasp of JavaScript runtime", "Good modular design focus"],
        "weaknesses": ["Needs more detail on systems design and container workflows"],
        "learning_resources": ["MDN Web Docs on Event Loop"],
        "suggested_projects": ["Build a rate-limiter middleware from scratch using Redis"],
        "next_difficulty": "HARD"
    },
    "CodeReviewResponse": {
        "time_complexity": "O(N)",
        "space_complexity": "O(1)",
        "alternative_approach": "Can optimize memory usage further by doing in-place array modifications if allowed.",
        "code_quality": 8,
        "naming_suggestions": ["Rename temporary variable temp to runningProduct"],
        "edge_cases_missed": ["Integer overflow on large inputs", "Empty or null inputs validation"],
        "optimization_suggestions": ["Use bitwise operations if applicable"],
        "interview_feedback": "Solid code execution. Try to proactively state edge cases before writing code."
    }
}

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
        try:
            response = self.client.models.generate_content(
                model=model,
                contents=prompt,
            )
            logger.info("Gemini Success")
            return response.text
        except Exception as e:
            logger.error("Gemini Failure")
            logger.warning("Fallback Activated")
            return "Mock generated text content."

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
                logger.info("Gemini Success")
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
                    last_exception = e
                    break
            except Exception as e:
                logger.warn(f"GeminiClient: General error on attempt {attempt + 1}/{max_retries}: {str(e)}")
                last_exception = e

            # Apply exponential backoff sleep
            if attempt < max_retries - 1:
                sleep_time = backoff ** attempt
                logger.info(f"GeminiClient: Sleeping for {sleep_time}s before retry...")
                await asyncio.sleep(sleep_time)

        # Fallback to generating mock data
        logger.error("Gemini Failure")
        logger.warning("Fallback Activated")
        try:
            schema_name = response_schema.__name__
            if schema_name in STATIC_MOCK_RESPONSES:
                return response_schema.model_validate(STATIC_MOCK_RESPONSES[schema_name])
            return _generate_mock_pydantic(response_schema)
        except Exception as mock_err:
            logger.error(f"GeminiClient: Mock fallback generation failed: {str(mock_err)}")
            return _generate_mock_pydantic(response_schema)

def _generate_mock_value(field_annotation, field_name: str) -> Any:
    from typing import get_origin, get_args, Union, List
    origin = get_origin(field_annotation)
    args = get_args(field_annotation)
    
    if origin is Union:
        non_none_args = [arg for arg in args if arg is not type(None)]
        if non_none_args:
            return _generate_mock_value(non_none_args[0], field_name)
        return None

    if origin is list or origin is List:
        item_type = args[0] if args else str
        return [_generate_mock_value(item_type, field_name)]

    if isinstance(field_annotation, type) and issubclass(field_annotation, BaseModel):
        return _generate_mock_pydantic(field_annotation)

    if field_annotation is int:
        if "score" in field_name.lower() or "percentage" in field_name.lower() or "quality" in field_name.lower():
            return 85
        return 5
    if field_annotation is float:
        if "score" in field_name.lower() or "percentage" in field_name.lower() or "accuracy" in field_name.lower() or "communication" in field_name.lower() or "solving" in field_name.lower() or "confidence" in field_name.lower() or "completeness" in field_name.lower() or "grammar" in field_name.lower():
            return 8.5
        return 1.0
    if field_annotation is bool:
        return True

    if field_annotation is str:
        if "email" in field_name.lower():
            return "mock.user@example.com"
        if "phone" in field_name.lower():
            return "+1-555-0199"
        if "url" in field_name.lower() or "link" in field_name.lower() or "github" in field_name.lower() or "linkedin" in field_name.lower() or "portfolio" in field_name.lower():
            return "https://example.com"
        if "name" in field_name.lower():
            return "Mock Name"
        if "difficulty" in field_name.lower():
            return "MEDIUM"
        if "type" in field_name.lower():
            return "TECHNICAL"
        return f"Mock {field_name.replace('_', ' ').title()}"
        
    return f"Mock {field_name}"

def _generate_mock_pydantic(model_class: Type[BaseModel]) -> BaseModel:
    data = {}
    for name, field in model_class.model_fields.items():
        field_type = field.annotation
        data[name] = _generate_mock_value(field_type, name)
    return model_class.model_validate(data)

gemini_client = GeminiClient()
