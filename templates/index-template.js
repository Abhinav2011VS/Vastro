const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const autoUpdater = require('electron-updater').autoUpdater;
const ejse = require('ejs-electron');
const fs = require('fs');
const isDev = require('./assets/js/isdev');
const path = require('path');
const semver = require('semver');
const { pathToFileURL } = require('url');

function initAutoUpdater(event, data) {
  if (data) {
    autoUpdater.allowPrerelease = true;
  } else {
    autoUpdater.allowPrerelease = semver.prerelease(app.getVersion()) != null;
  }

  if (isDev) {
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
  }

  if (process.platform === 'darwin') {
    autoUpdater.autoDownload = false;
  }

  autoUpdater.on('update-available', (info) => {
    event.sender.send('autoUpdateNotification', 'update-available', info);
  });
  autoUpdater.on('update-downloaded', (info) => {
    event.sender.send('autoUpdateNotification', 'update-downloaded', info);
  });
  autoUpdater.on('update-not-available', (info) => {
    event.sender.send('autoUpdateNotification', 'update-not-available', info);
  });
  autoUpdater.on('checking-for-update', () => {
    event.sender.send('autoUpdateNotification', 'checking-for-update');
  });
  autoUpdater.on('error', (err) => {
    event.sender.send('autoUpdateNotification', 'realerror', err);
  });
}

ipcMain.on('autoUpdateAction', (event, arg, data) => {
  switch (arg) {
    case 'initAutoUpdater':
      console.log('Initializing auto updater.');
      initAutoUpdater(event, data);
      event.sender.send('autoUpdateNotification', 'ready');
      break;
    case 'checkForUpdate':
      autoUpdater.checkForUpdates().catch((err) => {
        event.sender.send('autoUpdateNotification', 'realerror', err);
      });
      break;
    case 'allowPrereleaseChange':
      if (!data) {
        const preRelComp = semver.prerelease(app.getVersion());
        if (preRelComp != null && preRelComp.length > 0) {
          autoUpdater.allowPrerelease = true;
        } else {
          autoUpdater.allowPrerelease = data;
        }
      } else {
        autoUpdater.allowPrerelease = data;
      }
      break;
    case 'installUpdateNow':
      autoUpdater.quitAndInstall();
      break;
    default:
      console.log('Unknown argument', arg);
      break;
  }
});

ipcMain.on('distributionIndexDone', (event, res) => {
  event.sender.send('distributionIndexDone', res);
});

ipcMain.handle('SHELL_OPCODE.TRASH_ITEM', async (event, ...args) => {
  try {
    await shell.trashItem(args[0]);
    return { result: true };
  } catch (error) {
    return { result: false, error: error };
  }
});

app.disableHardwareAcceleration();

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 980,
    height: 552,
    icon: getPlatformIcon('favicon'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile('index.html');
}

function getPlatformIcon(filename) {
  let ext;
  switch (process.platform) {
    case 'win32':
      ext = 'ico';
      break;
    case 'darwin':
    case 'linux':
    default:
      ext = 'png';
      break;
  }
  return path.join(__dirname, 'assets', 'images', `${filename}.${ext}`);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
