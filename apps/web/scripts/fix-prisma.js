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

// Create JavaScript wrapper files for CommonJS require
const clientPath = path.join(__dirname, '../../../node_modules/.prisma/client');
if (fs.existsSync(clientPath)) {
  const defaultJs = path.join(clientPath, 'default.js');
  const indexJs = path.join(clientPath, 'index.js');
  const clientTs = path.join(clientPath, 'client.ts');
  
  // Read the PrismaClient export from client.ts
  let prismaClientExport = 'PrismaClient';
  if (fs.existsSync(clientTs)) {
    const clientContent = fs.readFileSync(clientTs, 'utf8');
    const exportMatch = clientContent.match(/export\s+(?:const|)\s*(\w+)\s*=/);
    if (exportMatch) {
      prismaClientExport = exportMatch[1];
    }
  }
  
  // Compile TypeScript to JavaScript using esbuild
  const { execSync } = require('child_process');
  const clientJs = path.join(clientPath, 'client.js');
  
  try {
    // Use esbuild to compile client.ts to client.js
    if (fs.existsSync(clientTs) && (!fs.existsSync(clientJs) || fs.statSync(clientTs).mtime > fs.statSync(clientJs).mtime)) {
      console.log('Compiling Prisma client TypeScript to JavaScript with esbuild...');
      try {
        // Use esbuild with proper settings for Prisma client
        const esbuildCmd = `npx esbuild "${clientTs}" --bundle --platform=node --format=cjs --outfile="${clientJs}" --external:@prisma/client/runtime/* --external:*.node --external:@prisma/client/runtime/library --keep-names --sourcemap=false`;
        execSync(esbuildCmd, {
          stdio: 'pipe',
          cwd: clientPath,
          env: { ...process.env, NODE_ENV: 'production' }
        });
        console.log('✓ Compiled client.ts to client.js with esbuild');
      } catch (buildError) {
        console.log('⚠ esbuild failed, trying TypeScript compiler...');
        try {
          // Try using tsc if available
          execSync(`npx tsc "${clientTs}" --outDir "${clientPath}" --module commonjs --target es2020 --skipLibCheck --esModuleInterop`, {
            stdio: 'pipe',
            cwd: clientPath
          });
          console.log('✓ Compiled with tsc');
        } catch (tscError) {
          console.log('⚠ tsc failed, compiling all TypeScript files with esbuild...');
          try {
            // Compile all .ts files in the directory
            const tsFiles = fs.readdirSync(clientPath).filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'));
            for (const tsFile of tsFiles) {
              const tsPath = path.join(clientPath, tsFile);
              const jsPath = path.join(clientPath, tsFile.replace('.ts', '.js'));
              if (tsFile === 'client.ts') continue; // Already handled
              try {
                execSync(`npx esbuild "${tsPath}" --bundle --platform=node --format=cjs --outfile="${jsPath}" --external:@prisma/client/runtime/* --external:*.node`, {
                  stdio: 'pipe',
                  cwd: clientPath
                });
              } catch (e) {
                // Skip files that can't be compiled individually
              }
            }
            // Now compile client.ts with all dependencies
            execSync(`npx esbuild "${clientTs}" --bundle --platform=node --format=cjs --outfile="${clientJs}" --external:@prisma/client/runtime/* --external:*.node`, {
              stdio: 'pipe',
              cwd: clientPath
            });
            console.log('✓ Compiled all TypeScript files');
          } catch (finalError) {
            console.log('⚠ All compilation methods failed, using Next.js/Turbopack fallback');
            // Fallback wrapper
            const wrapperContent = `// Fallback wrapper - Next.js/Turbopack will compile
module.exports = require('./client.ts');
`;
            fs.writeFileSync(clientJs, wrapperContent);
          }
        }
      }
    }
  } catch (error) {
    console.log('⚠ Could not compile TypeScript:', error.message);
  }
  
  // Create default.js that exports from the compiled client.js
  const defaultJsContent = `// Auto-generated wrapper for @prisma/client/default.js
// Export from the compiled JavaScript version
try {
  module.exports = require('./client.js');
} catch (error) {
  // Fallback: try to require TypeScript (Turbopack should handle this)
  try {
    module.exports = require('./client.ts');
  } catch (e) {
    throw new Error(\`Failed to load Prisma client: \${error.message}\`);
  }
}
`;
  
  fs.writeFileSync(defaultJs, defaultJsContent);
  
  // Create index.js that exports from default
  fs.writeFileSync(indexJs, `// Re-export from default
module.exports = require('./default.js');
`);
  
  console.log('✓ Created JavaScript wrapper files');
}

console.log('✓ Prisma client setup complete');
