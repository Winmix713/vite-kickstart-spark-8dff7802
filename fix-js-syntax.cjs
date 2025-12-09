#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common patterns that need fixing after conversion
const fixPatterns = [
  {
    // Fix object property syntax errors
    pattern: /(\w+)\s*:\s*(\w+)\s*:\s*\(/g,
    replacement: '$1: $2,'
  },
  {
    // Fix incomplete function definitions
    pattern: /(\w+)\s*=\s*await\s+(\w+)/g,
    replacement: 'async $1() {\n    return await $2'
  },
  {
    // Fix broken method definitions
    pattern: /async\s+(\w+)\s*=\s*await/g,
    replacement: 'async $1() {\n    const'
  },
  {
    // Fix property access in queryKey
    pattern: /queryKey\.(\w+)\(/g,
    replacement: 'queryKey: $1('
  },
  {
    // Fix incomplete objects
    pattern: /(\w+)\s*:\s*\{$/g,
    replacement: '$1: {},'
  },
  {
    // Fix string interpolation issues
    pattern: /(\w+)\.toISOString\(\)/g,
    replacement: 'new Date().toISOString()'
  },
  {
    // Fix type declarations that weren't removed
    pattern: /type\s+\w+\s*=\s*[\s\S]*?;/g,
    replacement: ''
  },
  {
    // Fix interface declarations that weren't removed
    pattern: /interface\s+\w+\s*\{[\s\S]*?\}\s*\n/g,
    replacement: ''
  }
];

function fixJavaScriptFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Apply each fix pattern
    fixPatterns.forEach(({ pattern, replacement }) => {
      const beforeLength = content.length;
      content = content.replace(pattern, replacement);
      if (content.length !== beforeLength) {
        hasChanges = true;
      }
    });
    
    // Additional manual fixes for common issues
    const manualFixes = [
      // Fix multiple colons in object literals
      { from: /(['"]\w+['"]):\s*([^:,\n}]+):\s*([^:,\n}]+):\s*([^:,\n}]+)/g, to: '$1: $2, $3: $4' },
      
      // Fix broken function syntax
      { from: /(\w+)\(\)\s*=\s*async\s*\{/g, to: 'async $1() {' },
      
      // Fix incomplete return statements
      { from: /return\s+await\s+(\w+)\s*$/gm, to: 'return await $1' },
      
      // Fix broken destructuring
      { from: /const\s*\{([^}]+)\}\s*=\s*await/g, to: 'const { $1 } = await' },
      
      // Fix property assignments
      { from: /(\w+):\s*(\w+)\(\)\.toISOString/g, to: '$1: new Date().toISOString()' }
    ];
    
    manualFixes.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`🔧 Fixed: ${path.basename(filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Find all JavaScript files in src directory
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
console.log('🔧 Starting JavaScript syntax fixes...\n');

if (!fs.existsSync(srcDir)) {
  console.error('❌ src directory not found!');
  process.exit(1);
}

const jsFiles = findJavaScriptFiles(srcDir);
console.log(`📁 Found ${jsFiles.length} JavaScript files to check\n`);

let fixedCount = 0;

for (const file of jsFiles) {
  const relativePath = path.relative(srcDir, file);
  console.log(`Checking: ${relativePath}`);
  
  if (fixJavaScriptFile(file)) {
    fixedCount++;
  }
  console.log('');
}

console.log('=' .repeat(50));
console.log(`📊 Fix Summary:`);
console.log(`🔧 Fixed: ${fixedCount} files`);
console.log(`✅ Checked: ${jsFiles.length} files`);
console.log('\n🎉 JavaScript syntax fixes complete!');