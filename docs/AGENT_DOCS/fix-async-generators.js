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

  // Check if Workflow is already imported
  if (!content.includes('Workflow') || content.includes('Workflow is not defined')) {
    // Find the import statement for types
    const importPattern = /import type \{([^}]+)\} from "\.\.\/types"/;
    const match = content.match(importPattern);

    if (match) {
      const imports = match[1];
      if (!imports.includes('Workflow')) {
        // Add Workflow to the imports
        const newImports = imports.trim() + ',\n  Workflow';
        content = content.replace(importPattern, `import type {${newImports}} from "../types"`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✓ Added Workflow import to ${filePath}`);
      }
    }
  }
}

// Main execution
console.log('Starting async generator fix...\n');

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
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
