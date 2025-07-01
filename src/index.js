const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');
const userService = require('./services/userService');
const attendanceService = require('./services/attendanceService');
const { startApiServer, stopApiServer } = require('./api/startServer');
require('dotenv').config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null;
let updateStatus = 'idle';

// Configure auto updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Configure GitHub update source
autoUpdater.setFeedURL({
  provider: 'github',
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
  token: process.env.GITHUB_TOKEN,
  private: true
});

// Auto updater events
autoUpdater.on('checking-for-update', () => {
  updateStatus = 'checking';
  console.log('Checking for updates...');
  mainWindow?.webContents.send('update-status', { status: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  updateStatus = 'available';
  console.log('Update available:', info);
  mainWindow?.webContents.send('update-available', {
    version: info.version,
    releaseNotes: info.releaseNotes
  });
});

autoUpdater.on('update-not-available', (info) => {
  updateStatus = 'not-available';
  console.log('Update not available:', info);
  mainWindow?.webContents.send('update-status', { status: 'not-available' });
});

autoUpdater.on('error', (err) => {
  updateStatus = 'error';
  console.error('Error in auto-updater:', err);
  mainWindow?.webContents.send('update-status', { status: 'error', error: err.message });
});

autoUpdater.on('download-progress', (progressObj) => {
  updateStatus = 'downloading';
  console.log('Download progress:', progressObj);
  mainWindow?.webContents.send('update-progress', {
    percent: progressObj.percent,
    bytesPerSecond: progressObj.bytesPerSecond,
    total: progressObj.total,
    transferred: progressObj.transferred
  });
});

autoUpdater.on('update-downloaded', (info) => {
  updateStatus = 'ready';
  console.log('Update downloaded:', info);
  mainWindow?.webContents.send('update-ready', {
    version: info.version,
    releaseNotes: info.releaseNotes
  });
});

// Version and update IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-update-status', () => {
  return updateStatus;
});

ipcMain.handle('check-for-updates', async () => {
  if (process.env.NODE_ENV === 'development') {
    return { status: 'development' };
  }
  try {
    return await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { status: 'error', error: error.message };
  }
});

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Check for updates
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }
};

// Set up IPC handlers for database operations
// User operations
ipcMain.handle('create-user', async (event, { firstName, lastName, email, faceData }) => {
  return await userService.createUser(firstName, lastName, email, faceData);
});

ipcMain.handle('get-user-by-id', async (event, { userId }) => {
  return await userService.getUserById(userId);
});

ipcMain.handle('get-all-users', async () => {
  return await userService.getAllUsers();
});

ipcMain.handle('identify-user-by-face', async (event, { faceImage }) => {
  return await userService.identifyUserByFace(faceImage);
});

ipcMain.handle('delete-user', async (event, { userId }) => {
  return await userService.deleteUser(userId);
});

// Attendance operations
ipcMain.handle('record-attendance', async (event, { userId, type, status, faceImage }) => {
  return await attendanceService.recordAttendance(userId, type, status, faceImage);
});

ipcMain.handle('get-user-attendance', async (event, { userId }) => {
  return await attendanceService.getUserAttendance(userId);
});

ipcMain.handle('get-attendance-image', async (event, { attendanceId }) => {
  return await attendanceService.getAttendanceImage(attendanceId);
});

ipcMain.handle('get-today-attendance', async () => {
  return await attendanceService.getTodayAttendance();
});

ipcMain.handle('get-all-attendance-logs', async () => {
  return await attendanceService.getAllAttendanceLogs();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  createWindow();

  // Start the API server
  try {
    await startApiServer();
    console.log('✅ API Server started successfully');
  } catch (error) {
    console.error('❌ Failed to start API server:', error);
  }

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  // Stop the API server when app is closing
  try {
    await stopApiServer();
    console.log('✅ API Server stopped successfully');
  } catch (error) {
    console.error('❌ Error stopping API server:', error);
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
