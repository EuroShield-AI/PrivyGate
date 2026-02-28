const fs = require('fs');
const path = require('path');

// Find where Prisma generated the client
const possiblePaths = [
  path.join(__dirname, '../../node_modules/.prisma/client'),
  path.join(__dirname, '../../../node_modules/.prisma/client'),
  path.join(__dirname, '../../../../node_modules/.prisma/client'),
];

let generatedPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    generatedPath = p;
    break;
  }
}

if (!generatedPath) {
  console.log('⚠ Prisma client not found, run: npm run db:generate');
  process.exit(0);
}

// Target location where @prisma/client expects it
const targetPath = path.join(__dirname, '../../../node_modules/.prisma/client');
const targetDir = path.dirname(targetPath);

// Create target directory if needed
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// If target doesn't exist or is different, create symlink or copy
if (!fs.existsSync(targetPath) || fs.realpathSync(targetPath) !== fs.realpathSync(generatedPath)) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  
  try {
    fs.symlinkSync(fs.realpathSync(generatedPath), targetPath, 'dir');
    console.log('✓ Created symlink for Prisma client');
  } catch (error) {
    // If symlink fails, copy the directory
    console.log('⚠ Symlink failed, copying files...');
    const { execSync } = require('child_process');
    execSync(`cp -r "${generatedPath}" "${targetPath}"`, { stdio: 'inherit' });
    console.log('✓ Copied Prisma client files');
  }
}

// Create default symlink if needed
const defaultPath = path.join(__dirname, '../../../node_modules/.prisma/default');
if (!fs.existsSync(defaultPath)) {
  try {
    fs.symlinkSync('client', defaultPath);
    console.log('✓ Created default symlink');
  } catch (error) {
    console.log('⚠ Could not create default symlink:', error.message);
  }
}

console.log('✓ Prisma client setup complete');
