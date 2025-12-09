#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Comprehensive JavaScript syntax fixes
const comprehensiveFixes = [
  // Fix double colon object syntax
  { from: /(\w+)\s*:\s*(\w+)\s*:\s*\(/g, to: '$1: $2,' },
  { from: /(\w+)\s*:\s*(\w+)\s*:\s*(\w+)/g, to: '$1: $2, $3' },
  
  // Fix missing queryKey: and queryFn: prefixes
  { from: /queryKey\s+([^,]+)/g, to: 'queryKey: $1' },
  { from: /queryFn\s+([^,]+)/g, to: 'queryFn: $1' },
  { from: /queryFn:\s*([^,]+)/g, to: 'queryFn: $1' },
  
  // Fix broken function syntax
  { from: /async\s+(\w+)\s*=\s*await/g, to: 'async $1() {\n    const' },
  { from: /(\w+)\s*=\s*async\s*\{/g, to: 'async $1() {' },
  { from: /async\s+(\w+)\s*\(\)\s*=>/g, to: 'async $1() =>' },
  
  // Fix incomplete destructuring
  { from: /const\s*\{([^}]+)\}\s*=\s*await/g, to: 'const { $1 } = await' },
  { from: /const\s*\{([^}]*)\}\s*=\s*await\s+(\w+)/g, to: 'const { $1 } = await $2' },
  
  // Fix broken property access
  { from: /\.(\w+)\(\)/g, to: '.$1()' },
  { from: /queryFn\.\w+/g, to: 'queryFn:' },
  
  // Fix type annotation remnants
  { from: /\{[^}]*:\s*\{[^}]*\}\s*:?\s*\{[^}]*\}?/g, to: '{}' },
  { from: /:\s*\{[^}]*\}/g, to: '' },
  { from: /\(\)\s*:\s*\{/g, to: '() {' },
  
  // Fix incomplete arrow functions
  { from: /=>\s*await\s+(\w+)/g, to: '=> $1' },
  
  // Fix broken object literals
  { from: /([^:,\n}]+):\s*([^:,\n}]+):\s*([^:,\n}]+)/g, to: '$1: $2, $3' },
  { from: /([^:,\n}]+):\s*([^:,\n}]+):\s*\(/g, to: '$1: $2,' },
  
  // Fix incomplete return statements
  { from: /return\s+await\s+(\w+)\s*$/gm, to: 'return await $1' },
  
  // Fix broken imports
  { from: /import\s+{([^}]+)}\s+from\s+['"][^'"]*['"];\s*\n\s*import/g, to: 'import { $1 } from' },
  
  // Fix missing function parentheses
  { from: /(\w+)\s*\{\}/g, to: '$1()' },
  { from: /(\w+)\s*\[/g, to: '$1[' },
  
  // Fix broken async/await
  { from: /async\s+async/g, to: 'async' },
  { from: /await\s+await/g, to: 'await' }
];

// File-specific fixes
const fileSpecificFixes = {
  // Hook files need special handling
  '/hooks/': [
    // Fix the query keys object syntax
    { 
      from: /(\w+Keys\s*=\s*\{[^}]*):\s*(\[[^\]]+\]):\s*\(\)\s*=>\s*\[([^,]+),\s*'list'\]:\s*(\([^)]*\))\s*=>\s*\[([^,]+),\s*\{([^}]+)\}\]:\s*\(\)\s*=>\s*\[([^,]+),\s*'detail'\]:\s*(\([^)]*\))\s*=>\s*\[([^,]+),\s*id\]/g,
      to: '$1: $2,\n  lists: () => [...$1.all, \'list\'],\n  list: $4 => [...$5.lists(), { $6 }],\n  details: () => [...$7.all, \'detail\'],\n  detail: $8 => [...$9.details(), id],'
    },
    // Fix queryKey references
    { from: /queryKey\s*:\s*list\(/g, to: 'queryKey: $1Keys.list(' },
    { from: /queryKey\s*:\s*detail\(/g, to: 'queryKey: $1Keys.detail(' },
    { from: /queryKey\s*:\s*lists\(\)/g, to: 'queryKey: $1Keys.lists()' },
    { from: /queryKey\s*:\s*details\(\)/g, to: 'queryKey: $1Keys.details()' },
    // Fix mutationFn references
    { from: /mutationFn\s*:\s*(\w+Service\.\w+)/g, to: 'mutationFn: $1' },
    // Fix invalid destructuring in mutations
    { from: /mutationFn\s*:\s*\(\{\s*([^,\}]+),\s*([^,\}]+)\s*\}\s*\)/g, to: 'mutationFn: ({ $1, $2 })' }
  ]
};

function applyFileSpecificFixes(filePath, content) {
  const directory = path.dirname(filePath);
  
  for (const [dir, fixes] of Object.entries(fileSpecificFixes)) {
    if (filePath.includes(dir)) {
      fixes.forEach(({ from, to }) => {
        content = content.replace(from, to);
      });
    }
  }
  
  return content;
}

function fixJavaScriptContent(content, filePath) {
  let fixedContent = content;
  
  // Apply comprehensive fixes
  comprehensiveFixes.forEach(({ from, to }) => {
    fixedContent = fixedContent.replace(from, to);
  });
  
  // Apply file-specific fixes
  fixedContent = applyFileSpecificFixes(filePath, fixedContent);
  
  // Additional cleanup
  fixedContent = fixedContent
    // Remove empty function parameters
    .replace(/\(\s*\)/g, '()')
    // Fix double commas
    .replace(/,\s*,/g, ',')
    // Fix multiple spaces
    .replace(/\s+/g, ' ')
    // Fix missing function closing
    .replace(/\{\s*\}\s*,\s*\}/g, '{} }')
    // Clean up template strings
    .replace(/`([^`]*)`/g, "'$1'");
  
  return fixedContent;
}

// Find all JavaScript files
function findJavaScriptFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findJavaScriptFiles(fullPath));
    } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
console.log('🔧 Starting comprehensive JavaScript syntax fixes...\n');

if (!fs.existsSync(srcDir)) {
  console.error('❌ src directory not found!');
  process.exit(1);
}

const jsFiles = findJavaScriptFiles(srcDir);
console.log(`📁 Found ${jsFiles.length} JavaScript files to fix\n`);

let fixedCount = 0;

for (const file of jsFiles) {
  try {
    const relativePath = path.relative(srcDir, file);
    const content = fs.readFileSync(file, 'utf8');
    const fixedContent = fixJavaScriptContent(content, file);
    
    if (content !== fixedContent) {
      fs.writeFileSync(file, fixedContent, 'utf8');
      console.log(`🔧 Fixed: ${relativePath}`);
      fixedCount++;
    } else {
      console.log(`✅ Clean: ${relativePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
}

console.log('\n' + '=' .repeat(60));
console.log(`📊 Fix Summary:`);
console.log(`🔧 Fixed: ${fixedCount} files`);
console.log(`✅ Total: ${jsFiles.length} files`);
console.log('\n🎉 Comprehensive JavaScript fixes complete!');