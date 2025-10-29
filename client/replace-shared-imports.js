const fs = require('fs');
const path = require('path');

const replacements = [
  { from: "from '@shared/IAuth'", to: "from 'src/types/IAuth'" },
  { from: "from '@shared/IUser'", to: "from 'src/types/IUser'" },
  { from: "from '@shared/Response'", to: "from 'src/types/Response'" },
  { from: "from '@shared/types'", to: "from 'src/types/types'" },
];

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      replaceInFile(filePath);
    }
  });
}

const srcPath = path.join(__dirname, 'src');
console.log('Starting replacement in:', srcPath);
walkDirectory(srcPath);
console.log('Replacement complete!');
