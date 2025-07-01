const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
require('dotenv').config();

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Face Recognition Attendance',
    executableName: 'face-recognition-attendance',
    // Icon configuration for different platforms
    icon: path.join(__dirname, 'assets', 'icon'), // Will look for icon.ico, icon.icns, icon.png
    // Windows specific
    win32metadata: {
      CompanyName: 'Soozu',
      FileDescription: 'Face Recognition Attendance System',
      ProductName: 'Face Recognition Attendance',
      InternalName: 'face-recognition-attendance'
    }
  },
  rebuildConfig: {},
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: process.env.GITHUB_OWNER,
          name: process.env.GITHUB_REPO
        },
        prerelease: false,
        draft: false,
        authToken: process.env.GITHUB_TOKEN
      }
    }
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'face-recognition-attendance',
        authors: 'Soozu',
        exe: 'face-recognition-attendance.exe',
        setupExe: 'FaceRecognitionAttendanceSetup.exe',
        // Remove problematic icon settings for now
        noMsi: true
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        icon: path.join(__dirname, 'assets', 'icon.icns')
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Soozu',
          homepage: 'https://github.com/yourusername/face-recognition-attendance',
          description: 'Face Recognition Attendance System',
          icon: path.join(__dirname, 'assets', 'icon.png'),
          categories: ['Office', 'Utility']
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'Soozu',
          homepage: 'https://github.com/yourusername/face-recognition-attendance',
          description: 'Face Recognition Attendance System',
          icon: path.join(__dirname, 'assets', 'icon.png'),
          categories: ['Office', 'Utility']
        }
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
