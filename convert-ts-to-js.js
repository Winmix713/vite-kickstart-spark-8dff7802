#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function removeTypeAnnotations(content) {
  // Remove type annotations from function parameters and return types
  content = content.replace(/:(\s*[A-Za-z_][A-Za-z0-9_<>,[\]\|& ]*)/g, '');
  
  // Remove type assertions (as Type)
  content = content.replace(/\s+as\s+[A-Za-z_][A-Za-z0-9_<>,[\]\|& ]*/g, '');
  
  // Remove generic type parameters
  content = content.replace(/<[A-Za-z_][A-Za-z0-9_<>,[\]\|& ]*>/g, '');
  
  // Remove interface declarations
  content = content.replace(/interface\s+[A-Za-z_][A-Za-z0-9_]*\s*{[\s\S]*?}\n?/g, '');
  
  // Remove type declarations
  content = content.replace(/export\s+type\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*[\s\S]*?;\n?/g, '');
  content = content.replace(/type\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*[\s\S]*?;\n?/g, '');
  
  // Remove type imports
  content = content.replace(/import\s+type\s+{[^}]*}\s+from\s+['"][^'"]*['"];?\n?/g, '');
  
  // Clean up multiple empty lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return content;
}

function updateImportExtensions(content) {
  // Update .ts extensions to .js in import statements
  content = content.replace(/from\s+['"]([^'"]*)\.ts['"]/g, "from '$1.js'");
  content = content.replace(/from\s+['"]([^'"]*)\.tsx['"]/g, "from '$1.jsx'");
  
  return content;
}

function convertFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let convertedContent = content;
    
    // Remove TypeScript-specific syntax
    convertedContent = removeTypeAnnotations(convertedContent);
    
    // Update import extensions
    convertedContent = updateImportExtensions(convertedContent);
    
    // Generate new file path
    const ext = path.extname(filePath);
    let newExt;
    if (ext === '.ts') newExt = '.js';
    else if (ext === '.tsx') newExt = '.jsx';
    else return; // Skip non-TypeScript files
    
    const newPath = filePath.replace(ext, newExt);
    
    // Write converted content
    fs.writeFileSync(newPath, convertedContent, 'utf8');
    console.log(`Converted: ${filePath} -> ${newPath}`);
    
    return newPath;
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error.message);
    return null;
  }
}

function findTypeScriptFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTypeScriptFiles(fullPath));
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main conversion process
const srcDir = path.join(__dirname, 'src');
console.log('Starting TypeScript to JavaScript conversion...');

const tsFiles = findTypeScriptFiles(srcDir);
console.log(`Found ${tsFiles.length} TypeScript files to convert`);

const convertedFiles = [];
for (const file of tsFiles) {
  const converted = convertFile(file);
  if (converted) {
    convertedFiles.push(converted);
  }
}

console.log(`\nConversion complete! Converted ${convertedFiles.length} files.`);
console.log('Now you should delete the original .ts and .tsx files.');