#!/usr/bin/env node

/**
 * Winmix File Repair System V6
 * Repairs repo-wide code corruption caused by PR #10
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

// Check dependencies  
function checkDependencies() {
  const requiredDeps = ['@babel/parser', 'prettier'];
  const missing = [];
  
  for (const dep of requiredDeps) {
    try {
      require.resolve(dep);
    } catch (e) {
      missing.push(dep);
    }
  }
  
  if (missing.length > 0) {
    console.error(`❌ Missing dependencies: ${missing.join(', ')}`);
    console.error(`   Install with: npm install -D ${missing.join(' ')}`);
    process.exit(1);
  }
}

checkDependencies();

const parser = require('@babel/parser');
const prettier = require('prettier');

const TARGET_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', '.winmix-backups'];
const BACKUP_DIR = path.join(process.cwd(), '.winmix-backups', new Date().toISOString().replace(/:/g, '-'));

let stats = { filesProcessed: 0, filesRepaired: 0, filesFailed: 0, filesSkipped: 0, errors: [] };

function log(message, level = 'info') {
  const prefix = { info: '📝', success: '✅', error: '❌', warning: '⚠️', verbose: '🔍' }[level] || '  ';
  if (level === 'verbose' && !isVerbose) return;
  console.log(`${prefix} ${message}`);
}

function createBackup(filePath, content) {
  if (isDryRun) return;
  const relativePath = path.relative(process.cwd(), filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.writeFileSync(backupPath, content, 'utf8');
}

function validateWithAST(code, filePath) {
  try {
    const ext = path.extname(filePath);
    const plugins = ['jsx'];
    if (ext === '.ts' || ext === '.tsx') {
      plugins.push('typescript');
    }
    parser.parse(code, { sourceType: 'module', plugins, errorRecovery: false });
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function fixStyledComponents(content) {
  let result = content;
  
  // Fix styled.tag' ... '; patterns
  const matches = [];
  const regex = /const\s+(\w+)\s*=\s*styled\.([\w]+)'([^]*?)'\s*;/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    matches.push({
      full: match[0],
      name: match[1],
      tag: match[2],
      body: match[3],
      index: match.index
    });
  }
  
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const fixed = `const ${m.name} = styled.${m.tag}\`${m.body}\`;`;
    result = result.substring(0, m.index) + fixed + result.substring(m.index + m.full.length);
  }
  
  // Fix styled(Component)' ... '; patterns
  const wrappedMatches = [];
  const wrappedRegex = /const\s+(\w+)\s*=\s*styled\(([\w]+)\)'([^]*?)'\s*;/g;
  
  while ((match = wrappedRegex.exec(result)) !== null) {
    wrappedMatches.push({
      full: match[0],
      name: match[1],
      component: match[2],
      body: match[3],
      index: match.index
    });
  }
  
  for (let i = wrappedMatches.length - 1; i >= 0; i--) {
    const m = wrappedMatches[i];
    const fixed = `const ${m.name} = styled(${m.component})\`${m.body}\`;`;
    result = result.substring(0, m.index) + fixed + result.substring(m.index + m.full.length);
  }
  
  return result;
}

function repairFile(content) {
  let repaired = content;
  
  // CRITICAL: Fix styled-components template literals first
  repaired = fixStyledComponents(repaired);
  
  // Fix ternary operators where : became ,
  repaired = repaired.replace(/(\?\s*'[^']+'\s*),(\s*'[^']+')/g, '$1:$2');
  repaired = repaired.replace(/(\?\s*"[^"]+"\s*),(\s*"[^"]+")/g, '$1:$2');
  
  // Fix collapsed imports with double 'from'
  repaired = repaired.replace(/import\s+([^from]+)from\s+([^{;]+)\s+({[^}]+})\s+from\s+/g, 'import $3 from ');
  
  // Split collapsed imports
  repaired = repaired.replace(/import\s+([^;]+);(\s*)import\s+/g, 'import $1;\nimport ');
  
  // Add spacing after comments before imports
  repaired = repaired.replace(/\/\/\s*(\w+)\s+import\s+/g, '// $1\nimport ');
  
  // Split const/function after imports
  repaired = repaired.replace(/import\s+([^;]+);(\s*)(const|let|var|function|class)\s+/g, 'import $1;\n\n$3 ');
  
  // Split exports from closing braces
  repaired = repaired.replace(/}\s*export\s+(default\s+)/g, '}\n\nexport $1');
  
  // Split PropTypes
  repaired = repaired.replace(/}\s*([\w]+)\.propTypes\s*=/g, '}\n\n$1.propTypes =');
  
  // Fix JSX spacing
  repaired = repaired.replace(/>\s*</g, '>\n<');
  
  // Add newlines between functions
  repaired = repaired.replace(/}\s*(function|const|let|var)\s+/g, '}\n\n$1 ');
  
  // Split return statements
  repaired = repaired.replace(/=>\s*{\s*return\s+\(/g, '=> {\n  return (');
  repaired = repaired.replace(/\)\s*}\s*([\w]+)\./g, ')\n}\n\n$1.');
  
  return repaired;
}

function processFile(filePath) {
  stats.filesProcessed++;
  
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    // Skip already well-formatted files
    const lineCount = originalContent.split('\n').length;
    if (lineCount > 50 && originalContent.length / lineCount < 200) {
      log(`Skip (formatted): ${path.relative(process.cwd(), filePath)}`, 'verbose');
      stats.filesSkipped++;
      return;
    }
    
    const firstLine = originalContent.split('\n')[0];
    if (firstLine.length < 300 && lineCount > 10) {
      log(`Skip (OK): ${path.relative(process.cwd(), filePath)}`, 'verbose');
      stats.filesSkipped++;
      return;
    }
    
    log(`Processing: ${path.relative(process.cwd(), filePath)}`, 'verbose');
    
    // Apply regex repairs
    let repairedContent = repairFile(originalContent);
    
    // Try Prettier (but don't fail if it doesn't work - the regex repair might be good enough)
    try {
      const ext = path.extname(filePath);
      const parserType = ext === '.ts' || ext === '.tsx' ? 'typescript' : 'babel';
      const formatted = prettier.format(repairedContent, {
        parser: parserType,
        printWidth: 100,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        arrowParens: 'avoid',
        endOfLine: 'lf'
      });
      
      const validation = validateWithAST(formatted, filePath);
      if (validation.valid) {
        repairedContent = formatted;
        log(`Prettier OK`, 'verbose');
      }
    } catch (e) {
      log(`Prettier failed, using regex version`, 'verbose');
    }
    
    // Final validation - if still not valid, save what we have for manual fixing
    const finalValidation = validateWithAST(repairedContent, filePath);
    if (!finalValidation.valid) {
      log(`⚠️  ${path.relative(process.cwd(), filePath)} - needs manual fix`, 'warning');
      stats.filesFailed++;
      stats.errors.push({ file: path.relative(process.cwd(), filePath), error: finalValidation.error });
      // Still save it - it might be close enough to fix manually
      if (originalContent !== repairedContent) {
        createBackup(filePath, originalContent);
        if (!isDryRun) {
          fs.writeFileSync(filePath, repairedContent, 'utf8');
        }
      }
      return;
    }
    
    // Check if changed
    if (originalContent === repairedContent) {
      stats.filesSkipped++;
      return;
    }
    
    // Backup and write
    createBackup(filePath, originalContent);
    
    if (!isDryRun) {
      fs.writeFileSync(filePath, repairedContent, 'utf8');
      log(`✓ ${path.relative(process.cwd(), filePath)}`, 'success');
    } else {
      log(`Would repair: ${path.relative(process.cwd(), filePath)}`, 'info');
    }
    
    stats.filesRepaired++;
    
  } catch (error) {
    log(`Error: ${path.relative(process.cwd(), filePath)} - ${error.message}`, 'error');
    stats.filesFailed++;
    stats.errors.push({ file: path.relative(process.cwd(), filePath), error: error.message });
  }
}

function walkDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        walkDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (TARGET_EXTENSIONS.includes(ext)) {
        processFile(fullPath);
      }
    }
  }
}

function main() {
  console.log('\n🔧 Winmix File Repair System V6\n');
  
  if (isDryRun) {
    log('DRY-RUN MODE (no changes will be made)', 'warning');
  }
  
  const startTime = Date.now();
  const srcDir = path.join(process.cwd(), 'src');
  
  log(`Scanning: ${srcDir}`, 'info');
  walkDirectory(srcDir);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPAIR SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files processed:  ${stats.filesProcessed}`);
  console.log(`Files repaired:   ${stats.filesRepaired}`);
  console.log(`Files skipped:    ${stats.filesSkipped}`);
  console.log(`Files failed:     ${stats.filesFailed}`);
  console.log(`Duration:         ${duration}s`);
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  FILES NEEDING MANUAL FIX:');
    stats.errors.forEach(({ file }) => {
      console.log(`  - ${file}`);
    });
  }
  
  if (!isDryRun && (stats.filesRepaired > 0 || stats.filesFailed > 0)) {
    console.log(`\n✅ Backups: ${BACKUP_DIR}`);
  }
  
  console.log('='.repeat(60) + '\n');
  
  if (stats.filesRepaired > 0) {
    log(`Successfully repaired ${stats.filesRepaired} files!`, 'success');
  }
  
  if (stats.filesFailed > 0) {
    log(`${stats.filesFailed} files need manual fixing`, 'warning');
  }
  
  if (stats.filesRepaired === 0 && stats.filesFailed === 0) {
    log('No files needed repair!', 'success');
  }
}

main();
