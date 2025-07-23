const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'projects', '[id]', 'page.tsx');

// Read the current file
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Starting cleanup of project page...');

// Remove dependency-related functions and handlers
const functionsToRemove = [
  'saveDependenciesToBackend',
  'clearAllDependencies',
  'handleStepComplete'
];

functionsToRemove.forEach(funcName => {
  // Find function definition and remove it
  const funcRegex = new RegExp(`\\s*\\/\\/ [^\\n]*\\n\\s*const ${funcName}[^}]+}[^}]*}`, 'gs');
  content = content.replace(funcRegex, '');
  
  const asyncFuncRegex = new RegExp(`\\s*\\/\\/ [^\\n]*\\n\\s*const ${funcName}[^}]+}[^}]*}[^}]*}`, 'gs');
  content = content.replace(asyncFuncRegex, '');
  
  console.log(`✅ Removed function: ${funcName}`);
});

// Clean up interface definitions - remove dependency properties
content = content.replace(/\s*dependencies\?\:\s*Task\[\]\s*\n/, '');
content = content.replace(/\s*subtasks\?\:\s*Task\[\]\s*\n/, '');
content = content.replace(/\s*workflowStep\?\:\s*WorkflowStep\s*\n/, '');

// Remove WorkflowStep interface completely
content = content.replace(/interface WorkflowStep \{[^}]+\}/s, '');

// Remove workflow steps from ExtendedProject interface
content = content.replace(/\s*workflowSteps:\s*WorkflowStep\[\]\s*\n/, '');

// Clean up task processing in calendar - remove dependency references
content = content.replace(/taskType:\s*\([^,]+,\s*\n/gs, 'taskType: \'INDEPENDENT\',\n');
content = content.replace(/dependencies:\s*[^,]+,\s*\n/gs, '');
content = content.replace(/dependents:\s*[^,]+,\s*\n/gs, '');

console.log('✅ Cleaned up interfaces and task processing');

// Remove dependency display from task cards
const dependencyDisplayRegex = /\{.*taskDependencies.*?\}\s*\n[^}]+\}\)\s*\n/gs;
content = content.replace(dependencyDisplayRegex, '');

const dependentsDisplayRegex = /\{.*taskDependents.*?\}\s*\n[^}]+\}\)\s*\n/gs;
content = content.replace(dependentsDisplayRegex, '');

console.log('✅ Removed dependency displays from task cards');

// Remove the Link button from task actions
const linkButtonRegex = /<button[^>]*onClick.*setSelectedTaskForDependency[^>]*>.*?<\/button>\s*/gs;
content = content.replace(linkButtonRegex, '');

console.log('✅ Removed link buttons from task cards');

// Remove entire linking tab content (everything between linking tab start and next tab)
const linkingTabRegex = /\{\s*\/\*\s*Task Linking Tab\s*\*\/\s*\}\s*\{activeTab\s*===\s*'linking'[^}]+(?:\{[^{}]*\}|[^{}])*?\}\s*\)/gs;
content = content.replace(linkingTabRegex, '');

// Also remove the dependency modal content if it exists
const modalRegex = /\{showDependencyModal[\s\S]*?<\/div>\s*<\/div>\s*\}\s*\)/s;
content = content.replace(modalRegex, '');

console.log('✅ Removed linking tab and modal content');

// Write the cleaned file
fs.writeFileSync(filePath, content, 'utf8');

console.log('🎉 Cleanup completed! Project page cleaned of workflow and linking features.');
console.log('📝 Next: You should now have a clean project page with only essential features.');
