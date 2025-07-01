// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', 
  {
    // Version and update operations
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', callback),
    onUpdateReady: (callback) => ipcRenderer.on('update-ready', callback),

    // User operations
    createUser: (firstName, lastName, email, faceData) => {
      return ipcRenderer.invoke('create-user', { firstName, lastName, email, faceData });
    },
    getUserById: (userId) => {
      return ipcRenderer.invoke('get-user-by-id', { userId });
    },
    getAllUsers: () => {
      return ipcRenderer.invoke('get-all-users');
    },
    identifyUserByFace: (faceImage) => {
      return ipcRenderer.invoke('identify-user-by-face', { faceImage });
    },
    deleteUser: (userId) => {
      return ipcRenderer.invoke('delete-user', { userId });
    },
    
    // Attendance operations
    recordAttendance: (userId, type, status, faceImage) => {
      return ipcRenderer.invoke('record-attendance', { userId, type, status, faceImage });
    },
    getUserAttendance: (userId) => {
      return ipcRenderer.invoke('get-user-attendance', { userId });
    },
    getAttendanceImage: (attendanceId) => {
      return ipcRenderer.invoke('get-attendance-image', { attendanceId });
    },
    getTodayAttendance: () => {
      return ipcRenderer.invoke('get-today-attendance');
    },
    getAllAttendanceLogs: () => {
      return ipcRenderer.invoke('get-all-attendance-logs');
    }
  }
);
