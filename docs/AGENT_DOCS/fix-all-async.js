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
  const patterns = [
    // Pattern 1: return (async function*
    {
      pattern: /return \(async function\*/g,
      replacement: 'return (function*'
    },
    // Pattern 2: inline async generators
    {
      pattern: /\(async function\* \(\)/g,
      replacement: '(function* ()'
    },
    // Pattern 3: async generator with type annotation
    {
      pattern: /\(async function\* \(\): AsyncGenerator<[^>]+>/g,
      replacement: (match) => {
        // Extract the generic types
        const typeMatch = match.match(/AsyncGenerator<([^>]+)>/);
        if (typeMatch) {
          const types = typeMatch[1];
          // For sync generators, we use Generator or just leave without type
          return '(function* ()';
        }
        return '(function* ()';
      }
    },
    // Pattern 4: AsyncWorkflow to Workflow
    {
      pattern: /: AsyncWorkflow</g,
      replacement: ': Workflow<'
    },
    // Pattern 5: AsyncGenerator type annotations
    {
      pattern: /: AsyncGenerator<[^>]+>/g,
      replacement: (match) => {
        // Extract the types
        const typeMatch = match.match(/AsyncGenerator<([^,]+),\s*([^,]+),\s*([^>]+)>/);
        if (typeMatch) {
          // AsyncGenerator<YieldType, ReturnType, NextType> -> Generator<YieldType, ReturnType, NextType>
          return `: Generator<${typeMatch[1]}, ${typeMatch[2]}, ${typeMatch[3]}>`;
        }
        // Fallback for simpler cases
        return match.replace('AsyncGenerator', 'Generator');
      }
    },
    // Pattern 6: async function* in parameters or variables
    {
      pattern: /= async function\*/g,
      replacement: '= function*'
    },
    // Pattern 7: typed async function*
    {
      pattern: /: async function\*/g,
      replacement: ': function*'
    }
  ];

  patterns.forEach(({ pattern, replacement }) => {
    if (typeof replacement === 'string') {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    } else {
      // Function replacement
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const newValue = replacement(match);
          content = content.replace(match, newValue);
        });
        modified = true;
      }
    }
  });

  // Special handling for dom-smart.ts inline generators
  if (filePath.includes('dom-smart.ts')) {
    // Fix the asyncGenerator properties
    content = content.replace(
      /asyncGenerator: \(([^)]*)\) => \{[\s\S]*?return \(async function\* \(\)[^}]*\}\)\(\);[\s\S]*?\}\)\(\);[\s\S]*?\}/g,
      (match, params) => {
        // Convert to sync generator
        return match
          .replace(/async function\*/g, 'function*')
          .replace(/AsyncGenerator<[^>]+>/g, 'Generator<any, any, any>');
      }
    );
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
  if (content.includes('Operation') && !content.includes('Workflow')) {
    // Find the import statement for types
    const importPattern = /import type \{([^}]+)\} from ["']\.\.\/types["']/;
    const match = content.match(importPattern);

    if (match) {
      const imports = match[1];
      if (!imports.includes('Workflow')) {
        // Add Workflow to the imports
        const importList = imports.split(',').map(s => s.trim()).filter(s => s);
        importList.push('Workflow');
        const newImports = importList.join(',\n  ');
        content = content.replace(match[0], `import type {\n  ${newImports}\n} from "../types"`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✓ Added Workflow import to ${filePath}`);
      }
    }
  }
}

// Main execution
console.log('Starting comprehensive async generator fix...\n');

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    // Ensure Workflow import first
    if (file.startsWith('src/')) {
      ensureWorkflowImport(fullPath);
    }
    // Then fix async generators
    fixAsyncGenerators(fullPath);
  } else {
    console.log(`  ✗ File not found: ${fullPath}`);
  }
});

console.log('\nDone! Now run npm run build to check for remaining issues.');
