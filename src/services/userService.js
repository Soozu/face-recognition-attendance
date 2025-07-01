const prisma = require('./prismaClient');

// Helper function to convert base64 to buffer
const base64ToBuffer = (base64) => {
  return Buffer.from(base64, 'base64');
};

// Helper function to calculate Euclidean distance between two arrays
const euclideanDistance = (arr1, arr2) => {
  if (!arr1 || !arr2 || arr1.length !== arr2.length) {
    return 1.0; // Maximum distance if invalid
  }
  
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    const diff = arr1[i] - arr2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

// Service to handle user operations
const userService = {
  // Create a new user
  async createUser(firstName, lastName, email, faceDataInput = null) {
    try {
      let faceData = null;
      let faceDescriptor = null;
      
      // Initialize multi-angle data
      let faceDataFront = null, faceDataLeft = null, faceDataRight = null, faceDataTilt = null;
      let faceDescriptorFront = null, faceDescriptorLeft = null, faceDescriptorRight = null, faceDescriptorTilt = null;
      
      // Check if we have face data input (can be JSON string or base64 image)
      if (faceDataInput) {
        try {
          // Try to parse as JSON (contains image and descriptor)
          const parsedInput = JSON.parse(faceDataInput);
          
          // Check if it's multi-angle data
          if (parsedInput.angles) {
            // Process multi-angle data
            for (const [angle, data] of Object.entries(parsedInput.angles)) {
              if (data.image && data.descriptor) {
                const imageData = data.image.replace(/^data:image\/[a-z]+;base64,/, '');
                const descriptorData = JSON.stringify(data.descriptor);
                
                switch (angle) {
                  case 'front':
                    faceDataFront = imageData;
                    faceDescriptorFront = descriptorData;
                    break;
                  case 'left':
                    faceDataLeft = imageData;
                    faceDescriptorLeft = descriptorData;
                    break;
                  case 'right':
                    faceDataRight = imageData;
                    faceDescriptorRight = descriptorData;
                    break;
                  case 'tilt':
                    faceDataTilt = imageData;
                    faceDescriptorTilt = descriptorData;
                    break;
                }
              }
            }
            
            // Also store legacy format for backward compatibility
            if (parsedInput.image) {
              faceData = parsedInput.image.replace(/^data:image\/[a-z]+;base64,/, '');
            }
            if (parsedInput.descriptor) {
              faceDescriptor = JSON.stringify(parsedInput.descriptor);
            }
          } else {
            // Legacy single image format
          if (parsedInput.image) {
            faceData = parsedInput.image.replace(/^data:image\/[a-z]+;base64,/, '');
          }
          
          if (parsedInput.descriptor) {
            faceDescriptor = JSON.stringify(parsedInput.descriptor);
            }
          }
        } catch (e) {
          // Not JSON, treat as base64 image only
          faceData = faceDataInput.replace(/^data:image\/[a-z]+;base64,/, '');
        }
      }
      
      // Create full name from first and last name
      const fullName = `${firstName} ${lastName}`;
      
      // Create user record
      const user = await prisma.users.create({
        data: {
          firstName,
          lastName,
          name: fullName, // For backward compatibility
          email,
          password: 'default', // Required field - you may want to implement proper password handling
          officeType: 'School', // Default value - adjust as needed
          changePass: 1, // Default value indicating password needs to be changed
          faceData,
          faceDescriptor,
          // Multi-angle data
          faceDataFront,
          faceDataLeft,
          faceDataRight,
          faceDataTilt,
          faceDescriptorFront,
          faceDescriptorLeft,
          faceDescriptorRight,
          faceDescriptorTilt,
          updatedAt: new Date()
        }
      });
      
      return {
        success: true,
        message: 'User created successfully',
        userId: user.uid
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: `Failed to create user: ${error.message}`,
      };
    }
  },
  
  // Get a user by ID
  async getUserById(userId) {
    try {
      const user = await prisma.users.findUnique({
        where: {
          uid: userId
        }
      });
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      return {
        success: true,
        user: {
          id: user.uid,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          hasFaceData: !!user.faceData,
          hasFaceDescriptor: !!user.faceDescriptor
        }
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        message: `Failed to fetch user: ${error.message}`,
      };
    }
  },
  
  // Get all users
  async getAllUsers() {
    try {
      const users = await prisma.users.findMany({
        select: {
          uid: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          // Check if face data exists without returning the actual data
          faceData: true,
          faceDescriptor: true
        }
      });
      
      return {
        success: true,
        users: users.map(user => ({
          id: user.uid,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          hasFaceData: user.faceData !== null,
          hasFaceDescriptor: user.faceDescriptor !== null
        }))
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        message: `Failed to fetch users: ${error.message}`,
      };
    }
  },
  
  // Identify user by face using face descriptors
  async identifyUserByFace(faceDataInput) {
    try {
      if (!faceDataInput) {
        return {
          success: false,
          message: 'No face data provided'
        };
      }
      
      let capturedFaceData = null;
      let capturedDescriptor = null;
      
      // Parse input (can be JSON or base64 image)
      try {
        // Try to parse as JSON with image and descriptor
        const parsedInput = JSON.parse(faceDataInput);
        
        if (parsedInput.image) {
          capturedFaceData = parsedInput.image.replace(/^data:image\/[a-z]+;base64,/, '');
        }
        
        if (parsedInput.descriptor) {
          capturedDescriptor = parsedInput.descriptor;
        }
      } catch (e) {
        // Not JSON, treat as base64 image only
        capturedFaceData = faceDataInput.replace(/^data:image\/[a-z]+;base64,/, '');
      }
      
      // Get all users with face descriptor (prioritize multi-angle data)
      const usersWithFaceData = await prisma.users.findMany({
        where: {
          OR: [
            { faceDescriptor: { not: null } },
            { faceDescriptorFront: { not: null } },
            { faceDescriptorLeft: { not: null } },
            { faceDescriptorRight: { not: null } },
            { faceDescriptorTilt: { not: null } }
          ]
        },
        select: {
          uid: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          faceDescriptor: true,
          faceData: true,
          // Multi-angle descriptors
          faceDescriptorFront: true,
          faceDescriptorLeft: true,
          faceDescriptorRight: true,
          faceDescriptorTilt: true,
          faceDataFront: true,
          faceDataLeft: true,
          faceDataRight: true,
          faceDataTilt: true
        }
      });
      
      if (usersWithFaceData.length === 0) {
        return {
          success: false,
          message: 'No users with face data found'
        };
      }
      
      // If we have a descriptor, use it for comparison (more accurate)
      if (capturedDescriptor) {
        let bestMatch = null;
        let lowestDistance = 1.0;
        let bestAngle = null;
        const DISTANCE_THRESHOLD = 0.4; // Slightly relaxed for multi-angle matching
        
        for (const user of usersWithFaceData) {
          try {
            // Check multi-angle descriptors first (more accurate)
            const angles = ['front', 'left', 'right', 'tilt'];
            for (const angle of angles) {
              const descriptorField = `faceDescriptor${angle.charAt(0).toUpperCase() + angle.slice(1)}`;
              if (user[descriptorField]) {
                try {
                  const userDescriptor = JSON.parse(user[descriptorField]);
                  const distance = euclideanDistance(capturedDescriptor, userDescriptor);
                  
                  if (distance < lowestDistance) {
                    lowestDistance = distance;
                    bestMatch = user;
                    bestAngle = angle;
                  }
                } catch (e) {
                  continue;
                }
              }
            }
            
            // Fallback to legacy descriptor if no multi-angle match
            if (user.faceDescriptor && lowestDistance > 0.5) {
              try {
              const userDescriptor = JSON.parse(user.faceDescriptor);
              const distance = euclideanDistance(capturedDescriptor, userDescriptor);
              
              if (distance < lowestDistance) {
                lowestDistance = distance;
                bestMatch = user;
                  bestAngle = 'legacy';
                }
              } catch (e) {
                continue;
              }
            }
          } catch (error) {
            continue;
          }
        }
        
        // Check if we found a match below the threshold
        if (bestMatch && lowestDistance < DISTANCE_THRESHOLD) {
          return {
            success: true,
            user: {
              id: bestMatch.uid,
              firstName: bestMatch.firstName,
              lastName: bestMatch.lastName,
              name: bestMatch.name,
              email: bestMatch.email,
              distance: lowestDistance,
              similarity: 1 - lowestDistance,
              matchedAngle: bestAngle
            }
          };
        } else {
          return {
            success: false,
            message: 'No matching user found',
            bestDistance: lowestDistance,
            bestSimilarity: 1 - lowestDistance,
            checkedAngles: bestAngle ? [bestAngle] : []
          };
        }
      } 
      // Fall back to image comparison if no descriptor
      else if (capturedFaceData) {
        let bestMatch = null;
        let highestSimilarity = 0;
        const SIMILARITY_THRESHOLD = 0.7; // Increased to 70% for stricter matching
        
        const capturedBuffer = base64ToBuffer(capturedFaceData);
        
        for (const user of usersWithFaceData) {
          try {
            if (user.faceData) {
              // Compare face images
              const userFaceBuffer = base64ToBuffer(user.faceData);
              const similarity = this.compareBuffersEnhanced(capturedBuffer, userFaceBuffer);
              
              if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = user;
              }
            }
          } catch (error) {
            // Skip this user if there's an error
            continue;
          }
        }
        
        // Check if we found a match above the threshold
        if (bestMatch && highestSimilarity >= SIMILARITY_THRESHOLD) {
          return {
            success: true,
            user: {
              id: bestMatch.uid,
              firstName: bestMatch.firstName,
              lastName: bestMatch.lastName,
              name: bestMatch.name,
              email: bestMatch.email,
              similarity: highestSimilarity
            }
          };
        } else {
          return {
            success: false,
            message: 'No matching user found',
            bestSimilarity: highestSimilarity
          };
        }
      } else {
        return {
          success: false,
          message: 'Invalid face data format'
        };
      }
    } catch (error) {
      console.error('Error identifying user by face:', error);
      return {
        success: false,
        message: `Failed to identify user: ${error.message}`
      };
    }
  },
  
  // Delete a user
  async deleteUser(userId) {
    try {
      // Check if user exists
      const user = await prisma.users.findUnique({
        where: {
          uid: parseInt(userId)
        }
      });
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // Delete all attendance records for this user first
      await prisma.attendance.deleteMany({
        where: {
          userId: parseInt(userId)
        }
      });
      
      // Delete the user
      await prisma.users.delete({
        where: {
          uid: parseInt(userId)
        }
      });
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        message: `Failed to delete user: ${error.message}`
      };
    }
  },
  
  // Enhanced buffer comparison for face image matching
  compareBuffersEnhanced(buffer1, buffer2) {
    try {
      // If either buffer is null, can't compare
      if (!buffer1 || !buffer2) return 0;
      
      // Get the smaller buffer length to avoid index out of bounds
      const minLength = Math.min(buffer1.length, buffer2.length);
      
      // Different strategies for face comparison
      const strategies = {
        // Compare RGB triplets (more accurate for face tones)
        rgbTriplets: () => {
          let matches = 0;
          let samples = 0;
          const sampleRate = 15; 
          const threshold = 80;
          
          for (let i = 0; i < minLength - 3; i += sampleRate) {
            if (i + 2 >= minLength) continue;
            
            samples++;
            
            // Compare RGB values as a group
            const r1 = buffer1[i], g1 = buffer1[i+1], b1 = buffer1[i+2];
            const r2 = buffer2[i], g2 = buffer2[i+1], b2 = buffer2[i+2];
            
            // Calculate color distance using a simple distance formula
            const colorDistance = Math.sqrt(
              Math.pow(r1 - r2, 2) + 
              Math.pow(g1 - g2, 2) + 
              Math.pow(b1 - b2, 2)
            );
            
            // If colors are similar enough, count as a match
            if (colorDistance < threshold) {
              matches++;
            }
          }
          
          return { matches, samples };
        },
        
        // Compare intensity (good for different lighting conditions)
        intensity: () => {
          let matches = 0;
          let samples = 0;
          const sampleRate = 15;
          const threshold = 60;
          
          for (let i = 0; i < minLength - 3; i += sampleRate) {
            if (i + 2 >= minLength) continue;
            
            samples++;
            
            // Calculate grayscale intensity using standard weights
            const intensity1 = (buffer1[i] * 0.299 + buffer1[i+1] * 0.587 + buffer1[i+2] * 0.114);
            const intensity2 = (buffer2[i] * 0.299 + buffer2[i+1] * 0.587 + buffer2[i+2] * 0.114);
            
            // Compare intensities with threshold
            if (Math.abs(intensity1 - intensity2) < threshold) {
              matches++;
            }
          }
          
          return { matches, samples };
        },
        
        // Histogram comparison (good for overall image similarity)
        histogram: () => {
          // Create color histograms (32 bins for better precision)
          const bins = 32;
          const hist1 = new Array(bins).fill(0);
          const hist2 = new Array(bins).fill(0);
          
          // Sample at wider intervals for histogram
          const sampleRate = 20;
          
          for (let i = 0; i < minLength; i += sampleRate) {
            if (i >= minLength) continue;
            
            // Add to histogram buckets
            const value = Math.floor(buffer1[i] / (256/bins));
            hist1[Math.min(value, bins-1)]++;
            
            const value2 = Math.floor(buffer2[i] / (256/bins));
            hist2[Math.min(value2, bins-1)]++;
          }
          
          // Calculate histogram intersection
          let intersection = 0;
          let totalSamples = 0;
          
          for (let i = 0; i < bins; i++) {
            intersection += Math.min(hist1[i], hist2[i]);
            totalSamples += Math.max(hist1[i], hist2[i]);
          }
          
          return { matches: intersection, samples: totalSamples };
        }
      };
      
      // Run all comparison strategies
      const rgbResults = strategies.rgbTriplets();
      const intensityResults = strategies.intensity();
      const histResults = strategies.histogram();
      
      // Weighted average of strategies
      const weights = { rgb: 0.5, intensity: 0.3, histogram: 0.2 };
      
      const weightedMatches = 
        (rgbResults.matches * weights.rgb) + 
        (intensityResults.matches * weights.intensity) + 
        (histResults.matches * weights.histogram);
        
      const weightedSamples = 
        (rgbResults.samples * weights.rgb) + 
        (intensityResults.samples * weights.intensity) + 
        (histResults.samples * weights.histogram);
      
      // Calculate final similarity score
      const similarity = weightedSamples > 0 ? weightedMatches / weightedSamples : 0;
      return similarity;
    } catch (error) {
      console.error('Error comparing buffers:', error);
      return 0;
    }
  }
};

module.exports = userService; 