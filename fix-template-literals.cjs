const fs = require('fs');
const path = require('path');

function fixTemplLiterals(content) {
  // Match patterns like: styled.div' or styled(Component)' 
  // and convert them to use backticks
  
  let result = content;
  const styledMatches = [];
  
  // Find all styled component declarations
  const regex = /const\s+(\w+)\s*=\s*styled\.([\w]+)'([^]*?)'\s*;/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    styledMatches.push({
      full: match[0],
      name: match[1],
      tag: match[2],
      body: match[3],
      index: match.index
    });
  }
  
  // Replace from end to beginning to preserve indices
  for (let i = styledMatches.length - 1; i >= 0; i--) {
    const m = styledMatches[i];
    const fixed = `const ${m.name} = styled.${m.tag}\`${m.body}\`;`;
    result = result.substring(0, m.index) + fixed + result.substring(m.index + m.full.length);
  }
  
  // Also handle styled(Component) pattern
  const wrappedRegex = /const\s+(\w+)\s*=\s*styled\(([\w]+)\)'([^]*?)'\s*;/g;
  const wrappedMatches = [];
  
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

// Test
const testContent = `const Container = styled.div'
  background: red;
  color: blue;
';`;

console.log('Test input:', testContent);
console.log('Test output:', fixTemplLiterals(testContent));

// Apply to ClubCard as test
const filePath = path.join(__dirname, 'src/components/ClubCard.jsx');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fixed = fixTemplLiterals(content);
  console.log('\n--- FIXED ClubCard.jsx ---\n');
  console.log(fixed.substring(0, 500));
}
