#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to remove TypeScript-specific syntax
function stripTypeScriptSyntax(content) {
  // Remove type annotations from parameters and return types
  content = content.replace(/:\s*[A-Za-z_][A-Za-z0-9_<>,[\]\|&{}\s*]*/g, '');
  
  // Remove type assertions (as Type)
  content = content.replace(/\s+as\s+[A-Za-z_][A-Za-z0-9_<>,[\]\|&{}\s*]*/g, '');
  
  // Remove generic type parameters in function calls
  content = content.replace(/<[A-Za-z_][A-Za-z0-9_<>,[\]\|&{}\s*]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_<>,[\]\|&{}\s*]*)*>/g, '');
  
  // Remove interface declarations
  content = content.replace(/interface\s+[A-Za-z_][A-Za-z0-9_]*\s*{[\s\S]*?}\n\s*(?=\n|$)/g, '');
  
  // Remove type declarations
  content = content.replace(/export\s+type\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*[\s\S]*?;\n\s*(?=\n|$)/g, '');
  content = content.replace(/type\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*[\s\S]*?;\n\s*(?=\n|$)/g, '');
  
  // Remove type-only imports
  content = content.replace(/import\s+type\s+{[^}]*}\s+from\s+['"][^'"]*['"];?\s*(?=\n|$)/g, '');
  content = content.replace(/import\s+{[^}]*}\s+from\s+['"][^'"]*['"];?\s*(?=\n|$)/g, match => {
    // Only keep non-type imports
    const importMatch = match.match(/import\s+{([^}]*)}\s+from\s+['"]([^'"]*)['"]/);
    if (importMatch) {
      const imports = importMatch[1].split(',').map(item => item.trim()).filter(item => 
        !item.includes(':') && !item.match(/^[A-Z][A-Za-z0-9_]*$/) // Filter out type-only imports
      );
      if (imports.length > 0) {
        return `import { ${imports.join(', ')} } from '${importMatch[2]}'\n`;
      }
    }
    return '';
  });
  
  // Remove JSDoc type comments
  content = content.replace(/\/\*\*[\s\S]*?\*\//g, '');
  
  // Clean up multiple empty lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return content;
}

// Function to update import extensions
function updateImportExtensions(content) {
  // Update .ts extensions to .js in import statements
  content = content.replace(/from\s+['"]([^'"]*)\.ts['"]/g, "from '$1.js'");
  content = content.replace(/from\s+['"]([^'"]*)\.tsx['"]/g, "from '$1.jsx'");
  content = content.replace(/from\s+['"]([^'"]*)\/types['"]/g, "from '$1/types.js'");
  content = content.replace(/from\s+['"]([^'"]*)\/types\.ts['"]/g, "from '$1/types.js'");
  
  return content;
}

// Function to convert a single file
function convertFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let convertedContent = content;
    
    // Remove TypeScript-specific syntax
    convertedContent = stripTypeScriptSyntax(convertedContent);
    
    // Update import extensions
    convertedContent = updateImportExtensions(convertedContent);
    
    // Determine new extension
    const ext = path.extname(filePath);
    let newExt;
    if (ext === '.ts') newExt = '.js';
    else if (ext === '.tsx') newExt = '.jsx';
    else return null;
    
    const newPath = filePath.replace(ext, newExt);
    
    // Write converted content
    fs.writeFileSync(newPath, convertedContent, 'utf8');
    console.log(`✅ Converted: ${path.basename(filePath)} -> ${path.basename(newPath)}`);
    
    return newPath;
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message);
    return null;
  }
}

// Find all TypeScript files recursively
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
console.log('🚀 Starting TypeScript to JavaScript conversion...\n');

if (!fs.existsSync(srcDir)) {
  console.error('❌ src directory not found!');
  process.exit(1);
}

const tsFiles = findTypeScriptFiles(srcDir);
console.log(`📁 Found ${tsFiles.length} TypeScript files to convert:\n`);

const convertedFiles = [];
const errors = [];

for (const file of tsFiles) {
  const relativePath = path.relative(srcDir, file);
  console.log(`Processing: ${relativePath}`);
  
  const converted = convertFile(file);
  if (converted) {
    convertedFiles.push(converted);
    // Delete original file after successful conversion
    try {
      fs.unlinkSync(file);
      console.log(`🗑️  Deleted original: ${path.basename(file)}`);
    } catch (error) {
      console.warn(`⚠️  Could not delete original ${file}:`, error.message);
    }
  } else {
    errors.push(file);
  }
  console.log(''); // Empty line for readability
}

console.log('=' .repeat(60));
console.log(`📊 Conversion Summary:`);
console.log(`✅ Successfully converted: ${convertedFiles.length} files`);
console.log(`❌ Errors: ${errors.length} files`);

if (errors.length > 0) {
  console.log('\n❌ Files with errors:');
  errors.forEach(file => console.log(`   - ${path.relative(srcDir, file)}`));
}

if (convertedFiles.length > 0) {
  console.log('\n✅ Successfully converted files:');
  convertedFiles.forEach(file => console.log(`   - ${path.relative(srcDir, file)}`));
}

console.log('\n🎉 TypeScript to JavaScript conversion complete!');
console.log('💡 Next steps:');
console.log('   1. Review converted files for any manual fixes needed');
console.log('   2. Update build configuration to use JavaScript');
console.log('   3. Test the application to ensure everything works');