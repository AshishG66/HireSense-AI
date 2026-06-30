const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        callback(fullPath);
      }
    }
  }
}

let modified = 0;

walk(srcDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Replacements for generic errors
  newContent = newContent.replace(/Something went wrong/g, 'An unexpected error occurred while processing your request');
  newContent = newContent.replace(/Failed to load candidate reports/g, 'Unable to retrieve candidate reports');
  newContent = newContent.replace(/Failed to load assessment data/g, 'Unable to retrieve assessment data');
  newContent = newContent.replace(/Failed to load application history details/g, 'Unable to retrieve application history details');
  newContent = newContent.replace(/Failed to load coding dashboard/g, 'Unable to retrieve coding dashboard');
  newContent = newContent.replace(/Failed to load workspace data/g, 'Unable to retrieve workspace data');
  newContent = newContent.replace(/Failed to load Candidate dashboard context/g, 'Unable to retrieve Candidate dashboard context');
  newContent = newContent.replace(/Failed to load interview report/g, 'Unable to retrieve interview report');
  newContent = newContent.replace(/Failed to load ATS details/g, 'Unable to retrieve ATS details');
  newContent = newContent.replace(/Failed to load resume details/g, 'Unable to retrieve resume details');
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
    modified++;
  }
});

console.log(`\nCompleted replacing error strings. Modified ${modified} files.`);
