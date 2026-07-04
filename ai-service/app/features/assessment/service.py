import json
from app.config import settings
from app.core.gemini import gemini_client
from app.features.assessment.schemas import CodeReviewRequest, CodeReviewResponse

class AssessmentService:
    async def review_code(self, data: CodeReviewRequest) -> CodeReviewResponse:

        prompt = f"""
        You are an expert Senior Staff Software Engineer and Coding interviewer. Perform a comprehensive code review of the following solution submission.
        
        Problem Title:
        {data.problem_title}

        Problem Description:
        {data.problem_description}

        Programming Language:
        {data.language}

        Submitted Code:
        {data.code}

        Perform:
        1. Time complexity analysis (Big-O).
        2. Space complexity analysis (Big-O).
        3. Detailed description of an alternative or more optimal approach.
        4. Grade code quality out of 10.
        5. Variable/function naming suggestions.
        6. List of edge cases missed or not handled.
        7. Clear optimization bullet suggestions.
        8. Summary interview feedback.

        Provide the output in structured JSON matching the expected schema.
        """

        result = await gemini_client.generate_structured(
            prompt=prompt,
            response_schema=CodeReviewResponse,
            temperature=0.2
        )
        return result


assessment_service = AssessmentService()
