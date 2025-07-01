const express = require('express');
const cors = require('cors');
const prisma = require('../services/prismaClient');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes

// Get all attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      type, 
      status, 
      verified,
      limit = 100,
      offset = 0 
    } = req.query;

    // Build where clause based on query parameters
    const where = {};
    
    if (startDate || endDate) {
      where.timestamp = {};  
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate + 'T23:59:59');
    }
    
    if (userId) where.userId = parseInt(userId);
    if (type) where.type = type;
    if (status) where.status = status;
    if (verified !== undefined) where.verified = verified === 'true';

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            uid: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
            officeType: true,
            unitId: true,
            schoolId: true,
            unit: {
              select: {
                name: true,
                unitGroup: {
                  select: {
                    name: true
                  }
                }
              }
            },
            school: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Format the response
    const formattedRecords = records.map(record => ({
      id: record.id,
      userId: record.userId,
      user: {
        id: record.user.uid,
        firstName: record.user.firstName,
        lastName: record.user.lastName,
        fullName: record.user.name || `${record.user.firstName} ${record.user.lastName}`,
        email: record.user.email,
        officeType: record.user.officeType,
        unit: record.user.unit?.name || null,
        unitGroup: record.user.unit?.unitGroup?.name || null,
        school: record.user.school?.name || null
      },
      type: record.type,
      status: record.status,
      timestamp: record.timestamp,
      verified: record.verified,
      hasFaceImage: !!record.faceImage
    }));

    res.json({
      success: true,
      data: formattedRecords,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: formattedRecords.length
      }
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance records',
      message: error.message
    });
  }
});

// Get attendance records for a specific user
app.get('/api/attendance/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;

    const where = {
      userId: parseInt(userId)
    };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate + 'T23:59:59');
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            uid: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
            officeType: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const formattedRecords = records.map(record => ({
      id: record.id,
      userId: record.userId,
      user: {
        id: record.user.uid,
        firstName: record.user.firstName,
        lastName: record.user.lastName,
        fullName: record.user.name || `${record.user.firstName} ${record.user.lastName}`,
        email: record.user.email,
        officeType: record.user.officeType
      },
      type: record.type,
      status: record.status,
      timestamp: record.timestamp,
      verified: record.verified
    }));

    res.json({
      success: true,
      data: formattedRecords,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: formattedRecords.length
      }
    });

  } catch (error) {
    console.error('Error fetching user attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user attendance records',
      message: error.message
    });
  }
});

// Get today's attendance
app.get('/api/attendance/today', async (req, res) => {
  try {
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
            uid: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
            officeType: true,
            unit: {
              select: {
                name: true,
                unitGroup: {
                  select: {
                    name: true
                  }
                }
              }
            },
            school: {
              select: {
                name: true
              }
            }
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
      user: {
        id: record.user.uid,
        firstName: record.user.firstName,
        lastName: record.user.lastName,
        fullName: record.user.name || `${record.user.firstName} ${record.user.lastName}`,
        email: record.user.email,
        officeType: record.user.officeType,
        unit: record.user.unit?.name || null,
        unitGroup: record.user.unit?.unitGroup?.name || null,
        school: record.user.school?.name || null
      },
      type: record.type,
      status: record.status,
      timestamp: record.timestamp,
      verified: record.verified
    }));

    res.json({
      success: true,
      data: formattedRecords,
      date: today.toISOString().split('T')[0],
      total: formattedRecords.length
    });

  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today\'s attendance',
      message: error.message
    });
  }
});

// Get attendance statistics
app.get('/api/attendance/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate + 'T23:59:59');
    }

    // Get total records
    const totalRecords = await prisma.attendance.count({ where });

    // Get records by type
    const byType = await prisma.attendance.groupBy({
      by: ['type'],
      where,
      _count: {
        id: true
      }
    });

    // Get records by status
    const byStatus = await prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    });

    // Get verified vs unverified
    const byVerified = await prisma.attendance.groupBy({
      by: ['verified'],
      where,
      _count: {
        id: true
      }
    });

    // Get unique users count
    const uniqueUsers = await prisma.attendance.findMany({
      where,
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    res.json({
      success: true,
      data: {
        totalRecords,
        uniqueUsers: uniqueUsers.length,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {}),
        byVerified: byVerified.reduce((acc, item) => {
          acc[item.verified ? 'verified' : 'unverified'] = item._count.id;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance statistics',
      message: error.message
    });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { officeType, unitId, schoolId, limit = 100, offset = 0 } = req.query;

    const where = {};
    if (officeType) where.officeType = officeType;
    if (unitId) where.unitId = parseInt(unitId);
    if (schoolId) where.schoolId = parseInt(schoolId);

    const users = await prisma.users.findMany({
      where,
      select: {
        uid: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        officeType: true,
        status: true,
        createdAt: true,
        dateHired: true,
        unit: {
          select: {
            name: true,
            unitGroup: {
              select: {
                name: true
              }
            }
          }
        },
        school: {
          select: {
            name: true
          }
        },
        roles: {
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        },
        positions: {
          select: {
            position: true
          }
        }
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: {
        firstName: 'asc'
      }
    });

    const formattedUsers = users.map(user => ({
      id: user.uid,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.name || `${user.firstName} ${user.lastName}`,
      email: user.email,
      officeType: user.officeType,
      status: user.status,
      createdAt: user.createdAt,
      dateHired: user.dateHired,
      unit: user.unit?.name || null,
      unitGroup: user.unit?.unitGroup?.name || null,
      school: user.school?.name || null,
      roles: user.roles.map(r => r.role.name),
      positions: user.positions.map(p => p.position)
    }));

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: formattedUsers.length
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// Get user by ID
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.users.findUnique({
      where: {
        uid: parseInt(userId)
      },
      select: {
        uid: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        officeType: true,
        status: true,
        salary: true,
        createdAt: true,
        dateHired: true,
        dateUpdated: true,
        unit: {
          select: {
            name: true,
            unitGroup: {
              select: {
                name: true
              }
            }
          }
        },
        school: {
          select: {
            name: true
          }
        },
        roles: {
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        },
        positions: {
          select: {
            position: true
          }
        },
        supervisor: {
          select: {
            uid: true,
            firstName: true,
            lastName: true,
            name: true
          }
        },
        approvingAuthority: {
          select: {
            uid: true,
            firstName: true,
            lastName: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const formattedUser = {
      id: user.uid,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.name || `${user.firstName} ${user.lastName}`,
      email: user.email,
      officeType: user.officeType,
      status: user.status,
      salary: user.salary,
      createdAt: user.createdAt,
      dateHired: user.dateHired,
      dateUpdated: user.dateUpdated,
      unit: user.unit?.name || null,
      unitGroup: user.unit?.unitGroup?.name || null,
      school: user.school?.name || null,
      roles: user.roles.map(r => r.role.name),
      positions: user.positions.map(p => p.position),
      supervisor: user.supervisor ? {
        id: user.supervisor.uid,
        name: user.supervisor.name || `${user.supervisor.firstName} ${user.supervisor.lastName}`
      } : null,
      approvingAuthority: user.approvingAuthority ? {
        id: user.approvingAuthority.uid,
        name: user.approvingAuthority.name || `${user.approvingAuthority.firstName} ${user.approvingAuthority.lastName}`
      } : null
    };

    res.json({
      success: true,
      data: formattedUser
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// Create new user
app.post('/api/users', async (req, res) => {
  try {
    const { firstName, lastName, email, faceData, officeType, unitId, schoolId } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'firstName, lastName, and email are required'
      });
    }

    // Check if user with email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Create the user
    const userData = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      officeType: officeType || 'SDO',
      status: 'active',
      createdAt: new Date(),
      dateUpdated: new Date()
    };

    if (unitId) userData.unitId = parseInt(unitId);
    if (schoolId) userData.schoolId = parseInt(schoolId);

    const user = await prisma.users.create({
      data: userData,
      select: {
        uid: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        officeType: true,
        status: true,
        createdAt: true
      }
    });

    // Store face data if provided
    if (faceData) {
      await prisma.userFaceData.create({
        data: {
          userId: user.uid,
          faceDescriptor: faceData,
          createdAt: new Date()
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.uid,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.name,
        email: user.email,
        officeType: user.officeType,
        status: user.status,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
});

// Update user
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, officeType, unitId, schoolId, status } = req.body;

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { uid: parseInt(userId) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prepare update data
    const updateData = {
      dateUpdated: new Date()
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (firstName || lastName) {
      updateData.name = `${firstName || existingUser.firstName} ${lastName || existingUser.lastName}`;
    }
    if (email) updateData.email = email;
    if (officeType) updateData.officeType = officeType;
    if (unitId !== undefined) updateData.unitId = unitId ? parseInt(unitId) : null;
    if (schoolId !== undefined) updateData.schoolId = schoolId ? parseInt(schoolId) : null;
    if (status) updateData.status = status;

    // Update the user
    const updatedUser = await prisma.users.update({
      where: { uid: parseInt(userId) },
      data: updateData,
      select: {
        uid: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        officeType: true,
        status: true,
        dateUpdated: true
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.uid,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: updatedUser.name,
        email: updatedUser.email,
        officeType: updatedUser.officeType,
        status: updatedUser.status,
        dateUpdated: updatedUser.dateUpdated
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// Delete user
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { uid: parseInt(userId) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete related records first (face data, attendance records, etc.)
    await prisma.$transaction(async (prisma) => {
      // Delete user face data
      await prisma.userFaceData.deleteMany({
        where: { userId: parseInt(userId) }
      });

      // Delete attendance records
      await prisma.attendance.deleteMany({
        where: { userId: parseInt(userId) }
      });

      // Delete user roles
      await prisma.userRoles.deleteMany({
        where: { userId: parseInt(userId) }
      });

      // Delete user positions
      await prisma.userPositions.deleteMany({
        where: { userId: parseInt(userId) }
      });

      // Finally delete the user
      await prisma.users.delete({
        where: { uid: parseInt(userId) }
      });
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// Identify user by face
app.post('/api/users/identify', async (req, res) => {
  try {
    const { faceImage } = req.body;

    if (!faceImage) {
      return res.status(400).json({
        success: false,
        error: 'Missing face image',
        message: 'faceImage is required'
      });
    }

    // This would typically call your face recognition service
    // For now, we'll return a placeholder response
    res.json({
      success: false,
      message: 'Face identification not implemented in API server',
      note: 'This functionality is handled by the main process via IPC'
    });

  } catch (error) {
    console.error('Error identifying user by face:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to identify user',
      message: error.message
    });
  }
});

// Record attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const { userId, type, status, faceImage } = req.body;

    // Validate required fields
    if (!userId || !type || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'userId, type, and status are required'
      });
    }

    // Validate type and status values
    if (!['Morning', 'Afternoon'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type',
        message: 'type must be either "Morning" or "Afternoon"'
      });
    }

    if (!['In', 'Out'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'status must be either "In" or "Out"'
      });
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { uid: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create attendance record
    const attendanceData = {
      userId: parseInt(userId),
      type,
      status,
      timestamp: new Date(),
      verified: true
    };

    if (faceImage) {
      attendanceData.faceImage = faceImage;
    }

    const attendance = await prisma.attendance.create({
      data: attendanceData,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: {
        id: attendance.id,
        userId: attendance.userId,
        user: {
          name: attendance.user.name || `${attendance.user.firstName} ${attendance.user.lastName}`,
          email: attendance.user.email
        },
        type: attendance.type,
        status: attendance.status,
        timestamp: attendance.timestamp,
        verified: attendance.verified
      }
    });

  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record attendance',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Face Recognition Attendance API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    title: 'Face Recognition Attendance API Documentation',
    version: '1.0.0',
    endpoints: {
      'GET /api/health': 'API health check',
      'GET /api/attendance': 'Get all attendance records with optional filters',
      'POST /api/attendance': 'Record new attendance entry',
      'GET /api/attendance/user/:userId': 'Get attendance records for a specific user',
      'GET /api/attendance/today': 'Get today\'s attendance records',
      'GET /api/attendance/stats': 'Get attendance statistics',
      'GET /api/users': 'Get all users with optional filters',
      'POST /api/users': 'Create new user',
      'GET /api/users/:userId': 'Get specific user details',
      'PUT /api/users/:userId': 'Update user information',
      'DELETE /api/users/:userId': 'Delete user and related data',
      'POST /api/users/identify': 'Identify user by face image'
    },
    queryParameters: {
      attendance: {
        startDate: 'Filter by start date (YYYY-MM-DD)',
        endDate: 'Filter by end date (YYYY-MM-DD)',
        userId: 'Filter by user ID',
        type: 'Filter by attendance type (Morning/Afternoon)',
        status: 'Filter by status (In/Out)',
        verified: 'Filter by verification status (true/false)',
        limit: 'Limit number of results (default: 100)',
        offset: 'Offset for pagination (default: 0)'
      },
      users: {
        officeType: 'Filter by office type (SDO/School)',
        unitId: 'Filter by unit ID',
        schoolId: 'Filter by school ID',
        limit: 'Limit number of results (default: 100)',
        offset: 'Offset for pagination (default: 0)'
      }
    },
    requestBodies: {
      'POST /api/users': {
        firstName: 'User first name (required)',
        lastName: 'User last name (required)',
        email: 'User email address (required)',
        faceData: 'Face recognition data (optional)',
        officeType: 'Office type: SDO/School (optional, default: SDO)',
        unitId: 'Unit ID (optional)',
        schoolId: 'School ID (optional)'
      },
      'PUT /api/users/:userId': {
        firstName: 'User first name (optional)',
        lastName: 'User last name (optional)',
        email: 'User email address (optional)',
        officeType: 'Office type: SDO/School (optional)',
        unitId: 'Unit ID (optional)',
        schoolId: 'School ID (optional)',
        status: 'User status: active/inactive (optional)'
      },
      'POST /api/users/identify': {
        faceImage: 'Base64 encoded face image (required)'
      },
      'POST /api/attendance': {
        userId: 'User ID (required)',
        type: 'Attendance type: Morning/Afternoon (required)',
        status: 'Attendance status: In/Out (required)',
        faceImage: 'Base64 encoded face image (optional)'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Route ${req.originalUrl} not found`
  });
});

module.exports = app; 