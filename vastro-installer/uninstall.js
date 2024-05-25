const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Define paths
const installDir = '/usr/local/bin'; // Assuming Vastro is installed in /usr/local/bin (or any other desired location)

// Function to recursively remove a directory and its contents
function removeDirRecursive(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
            const currentPath = path.join(dirPath, file);
            if (fs.lstatSync(currentPath).isDirectory()) {
                removeDirRecursive(currentPath);
            } else {
                fs.unlinkSync(currentPath);
            }
        });
        fs.rmdirSync(dirPath);
    }
}

// Ask for confirmation before uninstalling
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Are you sure you want to uninstall Vastro? This action cannot be undone. (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
        // Remove Vastro files from the install directory
        removeDirRecursive(installDir);

        console.log('Vastro has been uninstalled.');
    } else {
        console.log('Uninstallation canceled.');
    }

    rl.close();
});
