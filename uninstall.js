const { execSync } = require('child_process');
const inquirer = require('inquirer');

async function uninstall() {
    const answers = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmUninstall',
            message: 'Are you sure you want to uninstall Vastro CLI?',
            default: false
        },
        {
            type: 'input',
            name: 'finalConfirm',
            message: 'Type "confirm" to proceed with uninstallation:',
            validate: function (value) {
                if (value === 'confirm') {
                    return true;
                }
                return 'Please type "confirm" to proceed with uninstallation.';
            }
        }
    ]);

    if (answers.confirmUninstall && answers.finalConfirm === 'confirm') {
        console.log('Uninstalling Vastro CLI...');
        try {
            // Remove the symbolic link for the CLI tool
            execSync('npm unlink', { stdio: 'inherit' });
            console.log('Vastro CLI uninstalled successfully!');
        } catch (error) {
            console.error('Uninstallation failed:', error);
        }
    } else {
        console.log('Uninstallation aborted.');
    }
}

uninstall();
