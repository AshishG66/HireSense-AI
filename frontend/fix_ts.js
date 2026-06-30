const fs = require('fs');

const tscOutput = `
src/features/candidate/pages/ATSScore.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
src/features/candidate/pages/CandidateAssessments.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
src/features/candidate/pages/CandidateAssessments.tsx(19,3): error TS6133: 'HelpCircle' is declared but its value is never read.
src/features/candidate/pages/CandidateAssessments.tsx(23,3): error TS6133: 'TrendingUp' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(5,3): error TS6133: 'CardHeader' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(6,3): error TS6133: 'CardTitle' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(7,3): error TS6133: 'CardDescription' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(8,3): error TS6133: 'CardContent' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(12,1): error TS6133: 'Skeleton' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(15,3): error TS6133: 'Play' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(19,3): error TS6133: 'HelpCircle' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(20,3): error TS6133: 'BookOpen' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(24,3): error TS6133: 'FileCode' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(25,3): error TS6133: 'CheckCircle' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(26,3): error TS6133: 'AlertTriangle' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(27,3): error TS6133: 'Code2' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(39,10): error TS6133: 'languages' is declared but its value is never read.
src/features/candidate/pages/CodingWorkspace.tsx(178,17): error TS6133: 'updated' is declared but its value is never read.
src/features/candidate/pages/InterviewReport.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
src/features/candidate/pages/MockInterview.tsx(14,1): error TS6133: 'Skeleton' is declared but its value is never read.
src/features/candidate/pages/MockInterview.tsx(23,3): error TS6133: 'AlertCircle' is declared but its value is never read.
src/features/candidate/pages/MockInterview.tsx(24,3): error TS6133: 'HelpCircle' is declared but its value is never read.
src/features/candidate/pages/MockInterview.tsx(25,3): error TS6133: 'FileText' is declared but its value is never read.
src/features/candidate/pages/MockInterview.tsx(26,3): error TS6133: 'UserCheck' is declared but its value is never read.
src/features/candidate/pages/ResumeAnalysis.tsx(12,1): error TS6133: 'Input' is declared but its value is never read.
src/features/candidate/pages/ResumeAnalysis.tsx(18,3): error TS6133: 'Trophy' is declared but its value is never read.
src/features/candidate/pages/ResumeAnalysis.tsx(26,3): error TS6133: 'TrendingUp' is declared but its value is never read.
src/features/candidate/pages/ResumeAnalysis.tsx(151,11): error TS6133: 'res' is declared but its value is never read.
src/features/candidate/pages/ResumeComparison.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
src/features/candidate/pages/ResumeComparison.tsx(5,3): error TS6133: 'ChevronRight' is declared but its value is never read.
src/features/candidate/pages/ResumeComparison.tsx(8,3): error TS6133: 'CheckCircle' is declared but its value is never read.
src/features/candidate/pages/ResumeComparison.tsx(9,3): error TS6133: 'AlertTriangle' is declared but its value is never read.
src/features/candidate/pages/ResumeComparison.tsx(10,3): error TS6133: 'XCircle' is declared but its value is never read.
src/features/candidate/pages/ResumeComparison.tsx(20,1): error TS6133: 'Button' is declared but its value is never read.
src/features/candidate/pages/ResumeDetails.tsx(6,3): error TS6133: 'FileText' is declared but its value is never read.
src/features/candidate/pages/ResumeDetails.tsx(9,3): error TS6133: 'CheckCircle2' is declared but its value is never read.
src/features/candidate/pages/ResumeDetails.tsx(11,3): error TS6133: 'Play' is declared but its value is never read.
src/features/candidate/pages/ResumeDetails.tsx(14,3): error TS6133: 'FileDown' is declared but its value is never read.
src/features/candidate/pages/ResumeDetails.tsx(209,50): error TS6133: 'index' is declared but its value is never read.
src/features/design-system/AboutArchitecture.tsx(1,1): error TS6133: 'React' is declared but its value is never read.
src/features/recruiter/pages/RecruiterAssessments.tsx(12,1): error TS6133: 'Select' is declared but its value is never read.
src/features/recruiter/pages/RecruiterAssessments.tsx(23,3): error TS6133: 'Settings' is declared but its value is never read.
src/features/recruiter/pages/RecruiterAssessments.tsx(26,3): error TS6133: 'Link2' is declared but its value is never read.
src/features/recruiter/pages/RecruiterAssessments.tsx(41,22): error TS6133: 'setVisibility' is declared but its value is never read.
src/features/recruiter/pages/RecruiterInterviewReports.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
src/features/recruiter/pages/RecruiterInterviewReports.tsx(5,3): error TS6133: 'CardHeader' is declared but its value is never read.
src/features/recruiter/pages/RecruiterInterviewReports.tsx(6,3): error TS6133: 'CardTitle' is declared but its value is never read.
src/features/recruiter/pages/RecruiterInterviewReports.tsx(7,3): error TS6133: 'CardDescription' is declared but its value is never read.
src/features/recruiter/pages/RecruiterInterviewReports.tsx(21,3): error TS6133: 'TrendingUp' is declared but its value is never read.
src/features/recruiter/pages/RecruiterInterviewReports.tsx(22,3): error TS6133: 'AlertCircle' is declared but its value is never read.
src/features/recruiter/pages/RecruiterInterviewReports.tsx(23,3): error TS6133: 'TrendingDown' is declared but its value is never read.
src/tests/Button.test.tsx(1,1): error TS6133: 'React' is declared but its value is never read.
src/tests/CandidateAssessments.test.tsx(1,1): error TS6133: 'React' is declared but its value is never read.
`;

const lines = tscOutput.trim().split('\n');
const filesToProcess = {};

lines.forEach(line => {
    const match = line.match(/^(.+?)\((\d+),(\d+)\): error TS6133: '([^']+)'/);
    if (!match) return;
    const file = match[1];
    const lineNum = parseInt(match[2], 10);
    const varName = match[4];
    
    if (!filesToProcess[file]) filesToProcess[file] = [];
    filesToProcess[file].push({ lineNum, varName });
});

for (const file of Object.keys(filesToProcess)) {
    let content = fs.readFileSync(file, 'utf8');
    let fileLines = content.split('\n');
    
    // Sort descending by line number to avoid shifting issues if we were to delete lines (though we just blank them or modify in place)
    filesToProcess[file].sort((a, b) => b.lineNum - a.lineNum).forEach(({ lineNum, varName }) => {
        let targetLine = fileLines[lineNum - 1];
        
        if (varName === 'React') {
            if (targetLine.includes('import React from') || targetLine.includes('import React,')) {
                targetLine = targetLine.replace(/import React,?\s*{?/, 'import {');
                if (targetLine.includes('import React from')) targetLine = targetLine.replace(/import React from ['"][^'"]+['"];?/, '');
                if (targetLine.match(/^import\s*\{\s*\}\s*from/)) targetLine = '';
                if (targetLine.trim() === 'import {') targetLine = '';
            } else if (targetLine.includes('import * as React from')) {
                targetLine = '';
            } else if (targetLine.match(/^import React\b/)) {
                targetLine = '';
            }
        } else if (varName === 'res') {
            // src/features/candidate/pages/ResumeAnalysis.tsx(151,11): error TS6133: 'res'
            // Probably `.then(res => ...)` -> `.then(() => ...)`
            targetLine = targetLine.replace(/\bres\s*=>/, '() =>');
        } else if (varName === 'index') {
            // map((item, index) => ) -> map((item) => )
            targetLine = targetLine.replace(/,\s*index\b/, '');
        } else if (varName === 'setVisibility') {
            // const [visibility, setVisibility] = useState(...) -> const [visibility] = useState(...)
            targetLine = targetLine.replace(/,\s*setVisibility\b/, '');
        } else if (varName === 'languages' || varName === 'updated') {
            // const { languages, ... } = ...
            targetLine = targetLine.replace(new RegExp('\\b' + varName + '\\s*,?\\s*'), '');
            targetLine = targetLine.replace(/,\s*\}/, ' }');
            targetLine = targetLine.replace(/\{\s*,/, '{ ');
            targetLine = targetLine.replace(/\{\s*\}/, ''); // Might leave empty let/const
            if (targetLine.match(/const\s+=\s+/)) targetLine = ''; // clean up empty destruct
        } else {
            // Component or Icon import
            let re1 = new RegExp('\\b' + varName + '\\b\\s*,?\\s*');
            targetLine = targetLine.replace(re1, '');
            targetLine = targetLine.replace(/,\s*\}/, ' }');
            targetLine = targetLine.replace(/\{\s*,/, '{ ');
            if (targetLine.match(/import\s*\{\s*\}\s*from/)) targetLine = '';
        }
        
        fileLines[lineNum - 1] = targetLine;
    });
    
    // Filter out completely empty lines we just created if they were imports
    fileLines = fileLines.filter(line => line.trim() !== 'import {');
    
    fs.writeFileSync(file, fileLines.join('\n'));
    console.log(`Processed ${file}`);
}
