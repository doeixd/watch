const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'src/generator/events.ts',
  'src/generator/wrappers.ts',
  'src/api/dom-smart.ts',
  'src/api/extra.ts',
  'src/api/tag.ts',
  'src/explicit/dom.ts',
  'src/core/async-wrapper.ts',
  'examples/sync-with-async-example.ts'
];

// Function to fix async generators in a file
function fixAsyncGenerators(filePath) {
  console.log(`Fixing ${filePath}...`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace async function* with function* for Workflow returns
  const asyncGenPattern = /return \(async function\*/g;
  if (asyncGenPattern.test(content)) {
    content = content.replace(asyncGenPattern, 'return (function*');
    modified = true;
  }

  // Replace AsyncWorkflow with Workflow in return types (for sync-by-default)
  const asyncWorkflowPattern = /: AsyncWorkflow</g;
  if (asyncWorkflowPattern.test(content)) {
    content = content.replace(asyncWorkflowPattern, ': Workflow<');
    modified = true;
  }

  // Fix specific patterns in event handlers
  const eventAsyncPattern = /\): Workflow<void> \{\s*return \(async function\*/g;
  if (eventAsyncPattern.test(content)) {
    content = content.replace(eventAsyncPattern, '): Workflow<void> {\n  return (function*');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Fixed async generators in ${filePath}`);
  } else {
    console.log(`  - No changes needed in ${filePath}`);
  }
}

// Add Workflow import if missing
function ensureWorkflowImport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // If Workflow is already imported from any *types* module, no-op
  const hasWorkflowImport = /\bimport\s+type\s*\{[^}]*\bWorkflow\b[^}]*\}\s*from\s*['"][^'"]*types['"]/.test(content);
  if (hasWorkflowImport) return;

  // Prefer augmenting an existing import from ../types or ../../types (any quotes)
  const importPattern = /import\s+type\s*\{([^}]+)\}\s*from\s*['"](\.\.\/)+types['"]/;
  const match = content.match(importPattern);
  if (match) {
    const names = match[1];
    if (!/\bWorkflow\b/.test(names)) {
      const replacement = match[0].replace('{' + names + '}', `{ ${names.trim()}, Workflow }`);
      content = content.replace(importPattern, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✓ Added Workflow import to ${filePath}`);
    }
    return;
  }

  // Fallback: insert a new import after the first import line (assumes ../types from src/*)
  const firstImport = content.match(/^\s*import[^\n]*\n/m);
  const importLine = 'import type { Workflow } from "../types";\n';
  content = firstImport
    ? content.replace(firstImport[0], firstImport[0] + importLine)
    : importLine + content;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✓ Inserted Workflow import into ${filePath}`);
}

// Main execution
console.log('Starting async generator fix...\n');

filesToFix.forEach(file => {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    // Ensure Workflow import first
    if (file.startsWith('src/generator/')) {
      ensureWorkflowImport(fullPath);
    }
    // Then fix async generators
    fixAsyncGenerators(fullPath);
  } else {
    console.log(`  ✗ File not found: ${fullPath}`);
  }
});

console.log('\nDone! Now run npm run build to check for remaining issues.');
