const app = require('./server');

const PORT = process.env.API_PORT || 3001;

let server = null;

const startApiServer = () => {
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(PORT, () => {
        console.log(`🚀 Attendance API Server running on http://localhost:${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
        console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
        resolve(server);
      });

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`⚠️  Port ${PORT} is already in use. Trying next port...`);
          const newPort = PORT + 1;
          server = app.listen(newPort, () => {
            console.log(`🚀 Attendance API Server running on http://localhost:${newPort}`);
            console.log(`📚 API Documentation: http://localhost:${newPort}/api/docs`);
            console.log(`❤️  Health Check: http://localhost:${newPort}/api/health`);
            resolve(server);
          });
        } else {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const stopApiServer = () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('📴 API Server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

// If this file is run directly (not imported)
if (require.main === module) {
  startApiServer().catch(console.error);
}

module.exports = {
  startApiServer,
  stopApiServer
}; 