const { execSync } = require('child_process');

console.log('Installing Vastro CLI...');

try {
    // Create a symbolic link for the CLI tool
    execSync('npm link', { stdio: 'inherit' });
    console.log('Vastro CLI installed successfully!');
} catch (error) {
    console.error('Installation failed:', error);
}
