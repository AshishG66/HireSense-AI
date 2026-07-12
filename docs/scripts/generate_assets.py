import os
import time
from playwright.sync_api import sync_playwright
from PIL import Image

def compile_gif(image_paths, output_path, duration=800):
    images = []
    for p in image_paths:
        if os.path.exists(p):
            images.append(Image.open(p))
    if images:
        images[0].save(
            output_path,
            save_all=True,
            append_images=images[1:],
            duration=duration,
            loop=0
        )
        print(f"Compiled GIF: {output_path}")

def run():
    # Make sure output dirs exist
    os.makedirs("docs/screenshots", exist_ok=True)
    
    base_url = "https://hire-sense-ai-jrm9-git-main-ashishgdevadiga15-8589s-projects.vercel.app"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        
        # 1. Landing & Login & Register
        print("Capturing Landing Page / Login Page...")
        page.goto(f"{base_url}/login")
        page.wait_for_timeout(3000)
        page.screenshot(path="docs/screenshots/login_page.png")
        page.screenshot(path="docs/screenshots/landing_page.png")
        
        print("Capturing Register Page...")
        page.goto(f"{base_url}/register")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/register_page.png")
        
        # 2. Candidate Login
        print("Logging in as Candidate...")
        page.goto(f"{base_url}/login")
        page.locator('input[type="email"]').fill("readme_candidate_1@hiresense.ai")
        page.locator('input[type="password"]').fill("Password123!")
        page.locator('button[type="submit"]').click()
        page.wait_for_timeout(4000)
        
        # Candidate Dashboard
        print("Capturing Candidate Dashboard...")
        page.screenshot(path="docs/screenshots/candidate_dashboard.png")
        
        # Profile & Settings
        print("Capturing Profile Page...")
        page.goto(f"{base_url}/candidate/profile")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/profile_page.png")
        
        print("Capturing Settings Page...")
        page.goto(f"{base_url}/candidate/settings")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/settings_page.png")

        # Resume Analysis
        print("Capturing Resume Analysis...")
        page.goto(f"{base_url}/candidate/resume-analysis")
        page.wait_for_timeout(3000)
        page.screenshot(path="docs/screenshots/resume_analysis.png")
        
        # ATS Score
        print("Capturing ATS Score...")
        page.goto(f"{base_url}/candidate/ats-score")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/ats_score.png")
        
        # Resume Builder
        print("Capturing AI Resume Builder...")
        page.goto(f"{base_url}/candidate/resume-builder")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/ai_resume_builder.png")
        
        # Resume Details (for resume parser / optimizer)
        print("Capturing Resume Parser / Optimizer...")
        page.screenshot(path="docs/screenshots/resume_parser.png")
        page.screenshot(path="docs/screenshots/ai_resume_optimizer.png")
        
        # Mock Interview
        print("Capturing Mock Interview...")
        page.goto(f"{base_url}/candidate/mock-interview")
        page.wait_for_timeout(3000)
        page.screenshot(path="docs/screenshots/mock_interview.png")
        page.screenshot(path="docs/screenshots/ai_voice_interview.png")
        
        # Candidate Assessments
        print("Capturing Candidate Assessments...")
        page.goto(f"{base_url}/candidate/assessments")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/coding_assessment.png")
        
        # Coding Workspace (Online Code Editor)
        print("Capturing Coding Workspace...")
        page.goto(f"{base_url}/candidate/assessments/workspace/test")
        page.wait_for_timeout(3000)
        page.screenshot(path="docs/screenshots/online_code_editor.png")
        
        # Saved Jobs / Job Board
        print("Capturing Saved Jobs / Job Board...")
        page.goto(f"{base_url}/candidate/saved-jobs")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/job_board.png")
        page.screenshot(path="docs/screenshots/open_roles.png")
        
        # Candidate Applications
        print("Capturing Candidate Applications...")
        page.goto(f"{base_url}/candidate/applications")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/candidate_applications.png")
        
        # Mock Interview Report
        print("Capturing Interview Report...")
        page.goto(f"{base_url}/candidate/mock-interview")
        page.screenshot(path="docs/screenshots/interview_report.png")
        
        # Sign out
        print("Signing out Candidate...")
        page.context.clear_cookies()
        
        # 3. Recruiter Login
        print("Logging in as Recruiter...")
        page.goto(f"{base_url}/login")
        page.locator('input[type="email"]').fill("readme_recruiter_1@hiresense.ai")
        page.locator('input[type="password"]').fill("Password123!")
        page.locator('button[type="submit"]').click()
        page.wait_for_timeout(4000)
        
        # Recruiter Dashboard
        print("Capturing Recruiter Dashboard...")
        page.screenshot(path="docs/screenshots/recruiter_dashboard.png")
        
        # Recruiter Jobs
        print("Capturing Recruiter Jobs Page...")
        page.goto(f"{base_url}/recruiter/jobs")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/recruiter_job_management.png")
        
        # Recruiter Candidates
        print("Capturing Recruiter Candidates Page...")
        page.goto(f"{base_url}/recruiter/candidates")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/recruiter_candidates.png")
        
        # Recruiter Analytics
        print("Capturing Recruiter Analytics Page...")
        page.goto(f"{base_url}/recruiter/analytics")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/analytics_dashboard.png")
        
        # Recruiter Company Profile
        print("Capturing Recruiter Company Profile...")
        page.goto(f"{base_url}/recruiter/company-profile")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/recruiter_company_profile.png")
        
        # Sign out
        print("Signing out Recruiter...")
        page.context.clear_cookies()
        
        # 4. Admin Login
        print("Logging in as Admin...")
        page.goto(f"{base_url}/login")
        page.locator('input[type="email"]').fill("readme_admin_1@hiresense.ai")
        page.locator('input[type="password"]').fill("Password123!")
        page.locator('button[type="submit"]').click()
        page.wait_for_timeout(4000)
        
        # Admin Dashboard
        print("Capturing Admin Dashboard...")
        page.screenshot(path="docs/screenshots/admin_dashboard.png")
        
        # Admin Monitoring
        print("Capturing Admin Monitoring Page...")
        page.goto(f"{base_url}/admin/monitoring")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/monitoring_dashboard.png")
        
        # Admin User Management
        print("Capturing Admin User Management Page...")
        page.goto(f"{base_url}/admin/user-management")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/admin_user_management.png")
        
        # Admin Platform Analytics
        print("Capturing Admin Platform Analytics Page...")
        page.goto(f"{base_url}/admin/platform-analytics")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/admin_platform_analytics.png")
        
        # Admin AI Usage
        print("Capturing Admin AI Usage Page...")
        page.goto(f"{base_url}/admin/ai-usage")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/admin_ai_usage.png")
        
        # Admin Audit Logs
        print("Capturing Admin Audit Logs Page...")
        page.goto(f"{base_url}/admin/audit-logs")
        page.wait_for_timeout(2000)
        page.screenshot(path="docs/screenshots/admin_audit_logs.png")
        
        browser.close()
        
    print("Screenshots captured successfully!")

    print("Compiling simulated GIF animations...")
    
    # 1. Resume Upload GIF
    compile_gif([
        "docs/screenshots/resume_analysis.png",
        "docs/screenshots/resume_parser.png"
    ], "docs/screenshots/resume_upload.gif")
    
    # 2. Resume Analysis GIF
    compile_gif([
        "docs/screenshots/resume_analysis.png",
        "docs/screenshots/ats_score.png"
    ], "docs/screenshots/resume_analysis.gif")
    
    # 3. AI Resume Builder GIF
    compile_gif([
        "docs/screenshots/ai_resume_builder.png",
        "docs/screenshots/ai_resume_optimizer.png"
    ], "docs/screenshots/ai_resume_builder.gif")
    
    # 4. AI Mock Interview GIF
    compile_gif([
        "docs/screenshots/mock_interview.png",
        "docs/screenshots/ai_voice_interview.png",
        "docs/screenshots/interview_report.png"
    ], "docs/screenshots/ai_mock_interview.gif")
    
    # 5. Voice Interview GIF
    compile_gif([
        "docs/screenshots/ai_voice_interview.png",
        "docs/screenshots/interview_report.png"
    ], "docs/screenshots/voice_interview.gif")
    
    # 6. Coding Assessment GIF
    compile_gif([
        "docs/screenshots/coding_assessment.png",
        "docs/screenshots/online_code_editor.png"
    ], "docs/screenshots/coding_assessment.gif")
    
    # 7. Run Code GIF
    compile_gif([
        "docs/screenshots/online_code_editor.png",
        "docs/screenshots/online_code_editor.png"
    ], "docs/screenshots/run_code.gif")
    
    # 8. Submit Solution GIF
    compile_gif([
        "docs/screenshots/online_code_editor.png",
        "docs/screenshots/coding_assessment.png"
    ], "docs/screenshots/submit_solution.gif")
    
    # 9. Recruiter Creating Job GIF
    compile_gif([
        "docs/screenshots/recruiter_dashboard.png",
        "docs/screenshots/recruiter_job_management.png"
    ], "docs/screenshots/recruiter_creating_job.gif")
    
    # 10. Candidate Applying Job GIF
    compile_gif([
        "docs/screenshots/job_board.png",
        "docs/screenshots/candidate_applications.png"
    ], "docs/screenshots/candidate_applying_job.gif")
    
    # 11. Admin Dashboard GIF
    compile_gif([
        "docs/screenshots/admin_dashboard.png",
        "docs/screenshots/monitoring_dashboard.png"
    ], "docs/screenshots/admin_dashboard.gif")
    
    print("GIF compiling complete!")

if __name__ == "__main__":
    run()
