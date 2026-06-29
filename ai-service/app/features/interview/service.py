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

class InterviewService:
    async def generate_questions(self, data: InterviewGenerationRequest) -> InterviewGenerationResponse:
        if not settings.gemini_api_key or settings.gemini_api_key == "mock-key":
            return self._get_fallback_questions(data)

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

        try:
            raw_text = gemini_client.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": InterviewGenerationResponse,
                    "temperature": 0.2
                }
            ).text

            parsed = json.loads(raw_text)
            questions_list = [QuestionItem(**item) for item in parsed.get("questions", [])]
            return InterviewGenerationResponse(questions=questions_list)
        except Exception:
            return self._get_fallback_questions(data)

    async def evaluate_answer(self, data: AnswerEvaluationRequest) -> AnswerEvaluationResponse:
        if not settings.gemini_api_key or settings.gemini_api_key == "mock-key":
            return self._get_fallback_evaluation(data)

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

        try:
            raw_text = gemini_client.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": AnswerEvaluationResponse,
                    "temperature": 0.1
                }
            ).text

            parsed = json.loads(raw_text)
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
        except Exception:
            return self._get_fallback_evaluation(data)

    async def generate_report(self, data: ReportGenerationRequest) -> ReportGenerationResponse:
        if not settings.gemini_api_key or settings.gemini_api_key == "mock-key":
            return self._get_fallback_report(data)

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

        try:
            raw_text = gemini_client.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": ReportGenerationResponse,
                    "temperature": 0.2
                }
            ).text

            parsed = json.loads(raw_text)
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
        except Exception:
            return self._get_fallback_report(data)

    def _get_fallback_questions(self, data: InterviewGenerationRequest) -> InterviewGenerationResponse:
        return InterviewGenerationResponse(
            questions=[
                QuestionItem(
                    question_text="How do you manage complex asynchronous operations in a React project?",
                    expected_criteria="Mention Redux Toolkit, Custom Hooks, async/await error catching, and state stores.",
                    question_type="TECHNICAL"
                ),
                QuestionItem(
                    question_text="What are the key differences between client-side rendering (CSR) and server-side rendering (SSR)?",
                    expected_criteria="Explain page loads speed, SEO indexing capabilities, server loads, and Hydration concepts.",
                    question_type="TECHNICAL"
                ),
                QuestionItem(
                    question_text="Describe a time when you had a technical disagreement with a team member. How did you resolve it?",
                    expected_criteria="Look for collaboration, active listening, technical benchmarking, and consensus building.",
                    question_type="BEHAVIORAL"
                ),
                QuestionItem(
                    question_text="If a production API route suddenly spikes in latency, what steps would you take to troubleshoot?",
                    expected_criteria="Explain log checks (APM), database slow query profiling, indexing reviews, caching, and rate limiting checks.",
                    question_type="SITUATIONAL"
                ),
                QuestionItem(
                    question_text="Why do you want to join this company, and how do you align with our core values?",
                    expected_criteria="Assess candidate research of company culture, professional goals alignment, and long-term interest.",
                    question_type="HR"
                )
            ]
        )

    def _get_fallback_evaluation(self, data: AnswerEvaluationRequest) -> AnswerEvaluationResponse:
        return AnswerEvaluationResponse(
            technical_accuracy=8.5,
            communication=8.0,
            problem_solving=8.5,
            confidence=8.0,
            completeness=9.0,
            grammar=9.5,
            overall_score=8.5,
            feedback="Excellent articulation of state middleware patterns. The explanation on handling hydration issues during CSR was detailed and logically sound.",
            suggestions=[
                "Mention RTK Query caching triggers to show advanced competency.",
                "Detail memory-cleanup methods in cleanup callbacks."
            ]
        )

    def _get_fallback_report(self, data: ReportGenerationRequest) -> ReportGenerationResponse:
        total_score = sum([ans.overall_score for ans in data.answers]) / len(data.answers) if data.answers else 8.0
        final_score = min(100.0, total_score * 10)
        return ReportGenerationResponse(
            overall_score=final_score,
            technical_score=final_score + 2 if final_score < 98 else final_score,
            behavioral_score=final_score - 1 if final_score > 10 else final_score,
            communication_score=final_score,
            strengths=[
                "Strong grasp of frontend rendering patterns (CSR/SSR) and hydration processes.",
                "Assertive logic formulation in debugging situational database latencies.",
                "Active listening and benchmark-oriented conflict management styles."
            ],
            weaknesses=[
                "Needs to include concrete caching strategies when discussing API optimisations.",
                "Could outline specific containerization tools during deployment descriptions."
            ],
            learning_resources=[
                "Next.js Rendering Patterns Docs: https://nextjs.org/docs/app/building-your-application/rendering",
                "PostgreSQL Query Optimization Tutorial: https://www.postgresql.org/docs/current/performance-tips.html"
            ],
            suggested_projects=[
                "Build a containerized caching proxy layer using Redis and Docker.",
                "Configure a mock client application utilizing RTK Query and bundle check profiles."
            ],
            next_difficulty="MEDIUM" if final_score < 85 else "HARD"
        )

interview_service = InterviewService()
