import json
from app.config import settings
from app.core.gemini import gemini_client
from app.features.interview.schemas import (
    InterviewGenerationRequest,
    InterviewGenerationResponse,
    AnswerEvaluationRequest,
    AnswerEvaluationResponse,
    ReportGenerationRequest,
    ReportGenerationResponse,
    QuestionItem,
    AnswerDetail,
)

def clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

class InterviewService:
    async def generate_questions(self, data: InterviewGenerationRequest) -> InterviewGenerationResponse:

        prompt = f"""
        You are an expert Technical Recruiter and Engineering Manager. Generate a set of 5 interview questions for a candidate.
        
        Candidate Resume:
        {data.resume_text}

        Target Job Description:
        {data.job_description}

        Session Parameters:
        - Difficulty: {data.difficulty}
        - Interview Type: {data.interview_type}
        - Previous rounds history context: {data.previous_history}

        Create a mix of Technical, HR, Behavioral, and Situational questions. For each question, supply expected criteria (core keywords, definitions, or bullet milestones expected in a high-grade response).
        
        Provide the output in structured JSON matching the expected schema.
        """

        result = await gemini_client.generate_structured(
            prompt=prompt,
            response_schema=InterviewGenerationResponse,
            temperature=0.2
        )
        return result

    async def evaluate_answer(self, data: AnswerEvaluationRequest) -> AnswerEvaluationResponse:

        prompt = f"""
        You are an AI Interview Grader. Evaluate the candidate's answer to the given question.
        
        Question Asked:
        {data.question}

        Expected Criteria Guidelines:
        {data.expected_criteria}

        Candidate Response Transcript:
        {data.student_answer}

        Difficulty level:
        {data.difficulty}

        Assess the answer and grade it on a 0 to 10 scale across these categories:
        - technical_accuracy (Correctness of details and definitions)
        - communication (Vocabulary clarity, speed flow, phrasing)
        - problem_solving (Logic application, structured thinking)
        - confidence (Tone presence, assertiveness)
        - completeness (Addressed all subcomponents of the prompt)
        - grammar (Errors in word order, syntax)
        Provide an aggregate overall_score, summary feedback paragraph, and suggestions list.

        Provide the output in structured JSON matching the expected schema.
        """

        result = await gemini_client.generate_structured(
            prompt=prompt,
            response_schema=AnswerEvaluationResponse,
            temperature=0.1
        )
        return result

    async def generate_report(self, data: ReportGenerationRequest) -> ReportGenerationResponse:

        answers_summary = "\n\n".join([
            f"Question: {ans.question}\nExpected: {ans.expected_criteria}\nAnswer: {ans.student_answer}\nScore: {ans.overall_score}"
            for ans in data.answers
        ])

        prompt = f"""
        You are an executive Technical Assessor. Synthesize the final evaluation report for the candidate based on these interview question grading transcripts:
        
        {answers_summary}

        Compile:
        - overall_score (0-100 index)
        - subcategory indexes (technical_score, behavioral_score, communication_score, each 0-100)
        - strengths (3 key points)
        - weaknesses (3 key gap points)
        - learning_resources (specific documentation or tutorial links)
        - suggested_projects (hands-on portfolio projects to address gaps)
        - next_difficulty (recommended next round level: EASY, MEDIUM, or HARD)

        Provide the output in structured JSON matching the expected schema.
        """

        result = await gemini_client.generate_structured(
            prompt=prompt,
            response_schema=ReportGenerationResponse,
            temperature=0.2
        )
        return result


interview_service = InterviewService()
