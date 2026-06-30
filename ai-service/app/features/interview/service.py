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

        raw_text = gemini_client.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": InterviewGenerationResponse,
                "temperature": 0.2
            }
        ).text

        parsed = json.loads(clean_json(raw_text))
        questions_list = [QuestionItem(**item) for item in parsed.get("questions", [])]
        return InterviewGenerationResponse(questions=questions_list)

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

        raw_text = gemini_client.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": AnswerEvaluationResponse,
                "temperature": 0.1
            }
        ).text

        parsed = json.loads(clean_json(raw_text))
        return AnswerEvaluationResponse(
            technical_accuracy=float(parsed.get("technical_accuracy", 7.0)),
            communication=float(parsed.get("communication", 7.0)),
            problem_solving=float(parsed.get("problem_solving", 7.0)),
            confidence=float(parsed.get("confidence", 7.0)),
            completeness=float(parsed.get("completeness", 7.0)),
            grammar=float(parsed.get("grammar", 7.0)),
            overall_score=float(parsed.get("overall_score", 7.0)),
            feedback=parsed.get("feedback", "Answer parsed successfully."),
            suggestions=parsed.get("suggestions", [])
        )

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

        raw_text = gemini_client.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": ReportGenerationResponse,
                "temperature": 0.2
            }
        ).text

        parsed = json.loads(clean_json(raw_text))
        return ReportGenerationResponse(
            overall_score=float(parsed.get("overall_score", 75.0)),
            technical_score=float(parsed.get("technical_score", 75.0)),
            behavioral_score=float(parsed.get("behavioral_score", 75.0)),
            communication_score=float(parsed.get("communication_score", 75.0)),
            strengths=parsed.get("strengths", []),
            weaknesses=parsed.get("weaknesses", []),
            learning_resources=parsed.get("learning_resources", []),
            suggested_projects=parsed.get("suggested_projects", []),
            next_difficulty=parsed.get("next_difficulty", "MEDIUM")
        )


interview_service = InterviewService()
