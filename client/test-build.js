const { execSync } = require('child_process');

console.log('Starting build...\n');

try {
  const output = execSync('npm run build', {
    cwd: __dirname,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log(output);
  console.log('\n✅ Build successful!');
} catch (error) {
  console.error('❌ Build failed!');
  console.error('\nSTDOUT:');
  console.error(error.stdout);
  console.error('\nSTDERR:');
  console.error(error.stderr);
  process.exit(1);
}
