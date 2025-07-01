const prisma = require('./prismaClient');

// Service to handle attendance operations
const attendanceService = {
  // Record a new attendance
  async recordAttendance(userId, type, status, faceImageBase64) {
    try {
      // Store image as base64 string directly
      // Just remove the prefix "data:image/jpeg;base64," if present
      const faceImage = faceImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Create attendance record
      const attendance = await prisma.attendance.create({
        data: {
          userId,
          type,
          status,
          faceImage,
          verified: true // Set to true for now, in a real app would be verified by face recognition
        }
      });
      
      return {
        success: true,
        message: `Successfully recorded ${type} ${status}`,
        timestamp: attendance.timestamp.toISOString(),
        id: attendance.id
      };
    } catch (error) {
      console.error('Error recording attendance:', error);
      return {
        success: false,
        message: `Failed to record attendance: ${error.message}`,
      };
    }
  },
  
  // Get all attendance records for a user
  async getUserAttendance(userId) {
    try {
      const records = await prisma.attendance.findMany({
        where: {
          userId
        },
        orderBy: {
          timestamp: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      // Convert records to a format suitable for the client
      // (without the actual image data which we'll fetch separately)
      const formattedRecords = records.map(record => ({
        id: record.id,
        userId: record.userId,
        userName: record.user.name || `${record.user.firstName} ${record.user.lastName}`,
        userEmail: record.user.email,
        userFirstName: record.user.firstName,
        userLastName: record.user.lastName,
        type: record.type,
        status: record.status,
        timestamp: record.timestamp,
        verified: record.verified,
        hasFaceImage: !!record.faceImage
      }));
      
      return {
        success: true,
        records: formattedRecords
      };
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      return {
        success: false,
        message: `Failed to fetch attendance records: ${error.message}`,
      };
    }
  },
  
  // Get a specific attendance record with the face image
  async getAttendanceImage(attendanceId) {
    try {
      const record = await prisma.attendance.findUnique({
        where: {
          id: attendanceId
        },
        select: {
          faceImage: true
        }
      });
      
      if (!record || !record.faceImage) {
        return {
          success: false,
          message: 'Face image not found'
        };
      }
      
      // Add prefix back to the base64 data for display
      const imageBase64 = `data:image/jpeg;base64,${record.faceImage}`;
      
      return {
        success: true,
        imageData: imageBase64
      };
    } catch (error) {
      console.error('Error fetching attendance image:', error);
      return {
        success: false,
        message: `Failed to fetch attendance image: ${error.message}`,
      };
    }
  },
  
  // Get today's attendance summary
  async getTodayAttendance() {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      const records = await prisma.attendance.findMany({
        where: {
          timestamp: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      const formattedRecords = records.map(record => ({
        id: record.id,
        userId: record.userId,
        userName: record.user.name || `${record.user.firstName} ${record.user.lastName}`,
        userEmail: record.user.email,
        userFirstName: record.user.firstName,
        userLastName: record.user.lastName,
        type: record.type,
        status: record.status,
        timestamp: record.timestamp,
        verified: record.verified,
        hasFaceImage: !!record.faceImage
      }));
      
      return {
        success: true,
        records: formattedRecords
      };
    } catch (error) {
      console.error('Error fetching today\'s attendance:', error);
      return {
        success: false,
        message: `Failed to fetch today's attendance: ${error.message}`,
      };
    }
  },

  // Get all attendance logs (for reports)
  async getAllAttendanceLogs() {
    try {
      const records = await prisma.attendance.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      const formattedRecords = records.map(record => ({
        id: record.id,
        userId: record.userId,
        userName: record.user.name || `${record.user.firstName} ${record.user.lastName}`,
        userEmail: record.user.email,
        userFirstName: record.user.firstName,
        userLastName: record.user.lastName,
        type: record.type,
        status: record.status,
        timestamp: record.timestamp,
        verified: record.verified,
        hasFaceImage: !!record.faceImage
      }));
      
      return {
        success: true,
        logs: formattedRecords
      };
    } catch (error) {
      console.error('Error fetching all attendance logs:', error);
      return {
        success: false,
        message: `Failed to fetch attendance logs: ${error.message}`,
      };
    }
  }
};

module.exports = attendanceService; 