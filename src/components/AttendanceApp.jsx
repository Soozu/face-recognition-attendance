import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import AttendanceImage from './AttendanceImage';
import FaceRecognitionHandler from './FaceRecognitionHandler';
import { getFaceDetails } from '../utils/faceApiConfig';

const AttendanceApp = () => {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState('Ready to record attendance');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '' });
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showTodayView, setShowTodayView] = useState(false);
  const [todayRecords, setTodayRecords] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);
  const [useFaceRecognition, setUseFaceRecognition] = useState(true);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const autoCaptureTimeoutRef = useRef(null);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await window.api.getAllUsers();
        if (response.success) {
          setUsers(response.users);
        } else {
          setMessage(`Failed to fetch users: ${response.message}`);
        }
      } catch (error) {
        setMessage(`Error: ${error.message || 'Failed to fetch users'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch attendance records for a user
  const fetchUserAttendance = async (userId) => {
    try {
      setLoading(true);
      const response = await window.api.getUserAttendance(userId);
      if (response.success) {
        setAttendanceRecords(response.records);
      } else {
        setMessage(`Failed to fetch attendance records: ${response.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message || 'Failed to fetch attendance records'}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's attendance records
  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const response = await window.api.getTodayAttendance();
      if (response.success) {
        setTodayRecords(response.records);
      } else {
        setMessage(`Failed to fetch today's attendance: ${response.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message || 'Failed to fetch today\'s attendance'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle new user input changes
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  // Capture image from webcam
  const captureImage = useCallback(() => {
    if (!webcamRef.current) {
      setMessage('Camera not available');
      return null;
    }
    
    if (!isFaceDetected) {
      setMessage('No face detected. Please position your face in the camera.');
      return null;
    }
    
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setMessage('Image captured successfully!');
    return imageSrc;
  }, [isFaceDetected]);

  // Auto-capture when face is detected
  useEffect(() => {
    // Clear any existing timeout
    if (autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
      autoCaptureTimeoutRef.current = null;
    }
    
    // Set up auto-capture if enabled and face is detected
    if (autoCapture && isFaceDetected && showRegisterForm && !capturedImage) {
      setMessage('Face detected. Auto-capturing in 2 seconds...');
      
      autoCaptureTimeoutRef.current = setTimeout(() => {
        if (isFaceDetected && !capturedImage) {
          captureImage();
        }
      }, 2000); // 2 second delay to let user position properly
    }
    
    // Cleanup on unmount
    return () => {
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
      }
    };
  }, [isFaceDetected, autoCapture, showRegisterForm, capturedImage, captureImage]);

  // Handle face detection callback
  const handleFaceDetected = useCallback((detections) => {
    setIsFaceDetected(true);
    if (!selectedUser && !showRegisterForm) {
      setMessage('Face detected. Identifying...');
    } else {
      setMessage('Face detected. Ready to capture.');
    }
  }, [selectedUser, showRegisterForm]);

  // Handle face loss callback
  const handleNoFaceDetected = useCallback(() => {
    setIsFaceDetected(false);
    setMessage('No face detected. Please position your face in the camera.');
  }, []);

  // Handle user identification
  const handleUserIdentified = useCallback(async (faceImageBase64) => {
    if (showRegisterForm || selectedUser || isIdentifying) return;
    
    try {
      setIsIdentifying(true);
      setMessage('Identifying user...');
      
      // Send to backend for identification
      const result = await window.api.identifyUserByFace(faceImageBase64);
      
      if (result.success) {
        setSelectedUser(result.user);
        setMessage(`Welcome, ${result.user.name || `${result.user.firstName} ${result.user.lastName}`}! (Match confidence: ${Math.round(result.user.similarity * 100)}%)`);
        fetchUserAttendance(result.user.id);
      } else {
        // Show a more informative message if the best similarity is close to the threshold
        if (result.bestSimilarity && result.bestSimilarity > 0.5) {
          setMessage(`Almost recognized you (${Math.round(result.bestSimilarity * 100)}% match). Need 70% or higher to authenticate.`);
        } else {
          setMessage(`${result.message}. Please register or try again.`);
        }
      }
    } catch (error) {
      console.error('Identification error:', error);
      setMessage(`Error identifying user: ${error.message || 'Unknown error'}`);
    } finally {
      setIsIdentifying(false);
    }
  }, [showRegisterForm, selectedUser, isIdentifying, fetchUserAttendance]);

  // Toggle between user and today view
  const toggleView = () => {
    if (!showTodayView) {
      fetchTodayAttendance();
    }
    setShowTodayView(!showTodayView);
  };

  // Register a new user
  const registerUser = async (e) => {
    e.preventDefault();
    if (!newUser.firstName || !newUser.lastName || !newUser.email) {
      setMessage('Please provide first name, last name, and email');
      return;
    }

    if (!capturedImage) {
      setMessage('Please capture your face image first');
      return;
    }

    try {
      setLoading(true);
      setMessage('Processing face data...');
      
      // Extract face descriptor from captured image before sending to backend
      const video = webcamRef.current.video;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      
      // Create image element from captured image
      const img = new Image();
      img.src = capturedImage;
      
      // Wait for image to load
      await new Promise(resolve => {
        img.onload = resolve;
      });
      
      // Draw image to canvas (needed for face-api.js processing)
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get face details with descriptor using face-api.js
      const faceDetails = await getFaceDetails(canvas);
      
      if (!faceDetails) {
        setMessage('Unable to extract face details. Please try again with clearer lighting.');
        setLoading(false);
        return;
      }
      
      // Create payload with both image and descriptor
      const descriptor = Array.from(faceDetails.descriptor);
      const imageWithDescriptor = {
        image: capturedImage,
        descriptor: descriptor
      };
      
      // Send combined data to backend
      const response = await window.api.createUser(
        newUser.firstName,
        newUser.lastName, 
        newUser.email, 
        JSON.stringify(imageWithDescriptor)
      );
      
      if (response.success) {
        setMessage(`User registered successfully: ${newUser.firstName} ${newUser.lastName}`);
        // Refresh users list
        const usersResponse = await window.api.getAllUsers();
        if (usersResponse.success) {
          setUsers(usersResponse.users);
          
          // Select the newly registered user
          const identifyResponse = await window.api.identifyUserByFace(JSON.stringify(imageWithDescriptor));
          if (identifyResponse.success) {
            setSelectedUser(identifyResponse.user);
            fetchUserAttendance(identifyResponse.user.id);
          }
          
          // Reset form
          setNewUser({ firstName: '', lastName: '', email: '' });
          setCapturedImage(null);
          setShowRegisterForm(false);
        }
      } else {
        setMessage(`Failed to register user: ${response.message}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(`Error: ${error.message || 'Failed to register user'}`);
    } finally {
      setLoading(false);
    }
  };

  // Track selected attendance mode
  const [attendanceMode, setAttendanceMode] = useState(null);
  
  // Record attendance
  const selectAttendanceMode = useCallback((type, status) => {
    if (!selectedUser) {
      setMessage('No user identified. Please position your face for identification.');
      return;
    }
    
    // Set the selected mode
    setAttendanceMode({ type, status });
    setMessage(`Selected ${type} ${status}. Please position your face for scanning...`);
  }, [selectedUser]);
  
  // States to track the two-step process
  const [isWaitingForFace, setIsWaitingForFace] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  
  // Process attendance based on selected mode
  const processAttendance = useCallback(async () => {
    if (!attendanceMode || !selectedUser) return;
    
    if (!isFaceDetected) {
      setMessage(`Face not detected. Please position your face in the camera.`);
      return;
    }
    
    // Mark that we're waiting for face detection
    setIsWaitingForFace(true);
    setMessage(`Face detected! Processing ${attendanceMode.type} ${attendanceMode.status}...`);
    setLoading(true);

    try {
      // Capture image
      const faceImage = captureImage();
      if (!faceImage) {
        setLoading(false);
        setIsWaitingForFace(false);
        return;
      }
      
      // Send to backend for processing
      const result = await window.api.recordAttendance(
        selectedUser.id, 
        attendanceMode.type, 
        attendanceMode.status, 
        faceImage
      );
      
      // Display the result
      setMessage(result.message);
      
      // Mark processing as complete
      setProcessingComplete(true);
      
      // Refresh attendance records
      await fetchUserAttendance(selectedUser.id);
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        setAttendanceMode(null);
        setIsWaitingForFace(false);
        setProcessingComplete(false);
      }, 3000);
      
    } catch (error) {
      setMessage(`Error: ${error.message || 'Failed to record attendance'}`);
      setIsWaitingForFace(false);
    } finally {
      setLoading(false);
    }
  }, [selectedUser, captureImage, isFaceDetected, fetchUserAttendance, attendanceMode]);
  
  // Manual process button handler
  const handleProcessAttendance = useCallback(() => {
    if (isFaceDetected) {
      processAttendance();
    } else {
      setMessage(`Face not detected. Please position your face in the camera.`);
    }
  }, [isFaceDetected, processAttendance]);

  // Show image modal
  const viewAttendanceImage = (attendanceId) => {
    setSelectedImageId(attendanceId);
  };

  // Close image modal
  const closeImageModal = () => {
    setSelectedImageId(null);
  };

  // Reset user selection
  const resetUserSelection = () => {
    setSelectedUser(null);
    setAttendanceRecords([]);
    setMessage('User reset. Position your face for identification.');
  };

  return (
    <div className="container">
      <h1>Face Recognition Attendance</h1>
      
      <div className="recognition-toggle">
        <label>
          <input 
            type="checkbox" 
            checked={useFaceRecognition} 
            onChange={() => setUseFaceRecognition(!useFaceRecognition)} 
          />
          Use Face Recognition for Identification
        </label>
      </div>
      
      <div className="view-toggle">
        <button 
          className={`toggle-button ${!showTodayView ? 'active' : ''}`} 
          onClick={() => setShowTodayView(false)}
        >
          User View
        </button>
        <button 
          className={`toggle-button ${showTodayView ? 'active' : ''}`} 
          onClick={() => {
            fetchTodayAttendance();
            setShowTodayView(true);
          }}
        >
          Today's Attendance
        </button>
      </div>
      
      {!showTodayView && (
        <div className="user-section">
          {selectedUser ? (
            <div className="identified-user">
              <h2>Identified User: {selectedUser.name || `${selectedUser.firstName} ${selectedUser.lastName}`}</h2>
              {selectedUser.firstName && selectedUser.lastName && (
                <div className="user-details">
                  <p><strong>First Name:</strong> {selectedUser.firstName}</p>
                  <p><strong>Last Name:</strong> {selectedUser.lastName}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                </div>
              )}
              <button 
                className="reset-user-btn" 
                onClick={resetUserSelection}
                disabled={loading}
              >
                Reset User
              </button>
            </div>
          ) : (
            <div className="identification-message">
              {isIdentifying ? (
                <p>Identifying user... Please wait.</p>
              ) : (
                <p>Position your face in the camera for identification.</p>
              )}
              <button 
                className="register-toggle" 
                onClick={() => {
                  setShowRegisterForm(!showRegisterForm);
                  setCapturedImage(null);
                }}
                disabled={loading}
              >
                {showRegisterForm ? 'Cancel' : 'Register New User'}
              </button>
            </div>
          )}

          {showRegisterForm && (
            <form className="register-form" onSubmit={registerUser}>
              <h2>Register New User</h2>
              <div className="form-group">
                <label htmlFor="firstName">First Name:</label>
                <input 
                  type="text" 
                  id="firstName" 
                  name="firstName"
                  value={newUser.firstName}
                  onChange={handleNewUserChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name:</label>
                <input 
                  type="text" 
                  id="lastName" 
                  name="lastName"
                  value={newUser.lastName}
                  onChange={handleNewUserChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={newUser.email}
                  onChange={handleNewUserChange}
                  required
                />
              </div>
              
              <div className="auto-capture-toggle">
                <label>
                  <input 
                    type="checkbox" 
                    checked={autoCapture} 
                    onChange={() => setAutoCapture(!autoCapture)} 
                  />
                  Auto-capture when face is detected
                </label>
              </div>
              
              {!capturedImage && (
                <button 
                  type="button"
                  className="capture-button"
                  onClick={captureImage}
                  disabled={loading || !isFaceDetected}
                >
                  {autoCapture ? "Manual Capture" : "Capture Face Image"}
                </button>
              )}
              
              {capturedImage && (
                <div className="preview-image">
                  <h3>Preview Captured Image:</h3>
                  <img src={capturedImage} alt="Captured face" />
                  <button 
                    type="button"
                    className="recapture-button"
                    onClick={() => setCapturedImage(null)}
                    disabled={loading}
                  >
                    Retake Photo
                  </button>
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  disabled={loading || !capturedImage}
                  className="register-button"
                >
                  Register User
                </button>
                <button 
                  type="button"
                  className="cancel-button" 
                  onClick={() => {
                    setShowRegisterForm(false);
                    setCapturedImage(null);
                  }}
                >
                  Cancel
                </button>
              </div>
              
              <p className="face-instructions">
                {autoCapture 
                  ? "Position your face in the camera. Image will be captured automatically." 
                  : "Please position your face in the camera before capturing."}
              </p>
            </form>
          )}
        </div>
      )}
      
      <div className="camera-container">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width="100%"
          videoConstraints={{
            facingMode: "user"
          }}
        />
        
        {/* Use face recognition for detection and identification */}
        <FaceRecognitionHandler
          webcamRef={webcamRef}
          onFaceDetected={handleFaceDetected}
          onNoFaceDetected={handleNoFaceDetected}
          onUserIdentified={handleUserIdentified}
          isActive={true}
        />
        
        {isFaceDetected && (
          <div className="face-detected-indicator">
            Face Detected ✓
          </div>
        )}
      </div>
      
      {selectedUser && !showRegisterForm && !showTodayView && (
        <div className="attendance-section">
          {attendanceMode ? (
            <div className="scanning-mode">
              <div className="selected-mode">
                <h3>STEP 1: MODE SELECTED - {attendanceMode.type} {attendanceMode.status}</h3>
                <div className="step-indicator">
                  <div className="step-circle active">1</div>
                  <div className="step-line"></div>
                  <div className={`step-circle ${isWaitingForFace || processingComplete ? 'active' : ''}`}>2</div>
                </div>
                <h4>
                  {processingComplete 
                    ? "✅ ATTENDANCE RECORDED SUCCESSFULLY!" 
                    : isWaitingForFace 
                      ? "STEP 2: FACE DETECTED - Processing..." 
                      : "STEP 2: POSITION YOUR FACE IN THE CAMERA"}
                </h4>
              </div>
              
              {!processingComplete && !isWaitingForFace && (
                <button 
                  className="process-button" 
                  onClick={handleProcessAttendance}
                  disabled={loading || !isFaceDetected}
                >
                  {isFaceDetected ? "Confirm & Process" : "Position Face First"}
                </button>
              )}
              
              <button 
                className="cancel-scan-button" 
                onClick={() => {
                  setAttendanceMode(null);
                  setIsWaitingForFace(false);
                  setProcessingComplete(false);
                }}
                disabled={loading && !processingComplete}
              >
                {processingComplete ? "Continue" : "Cancel"}
              </button>
            </div>
          ) : (
            <>
              <h3 className="mode-selection-title">Select Attendance Mode:</h3>
              <div className="button-container">
                <button 
                  className="button morning-in" 
                  onClick={() => selectAttendanceMode('Morning', 'In')}
                  disabled={loading}
                >
                  Morning In
                </button>
                <button 
                  className="button morning-out" 
                  onClick={() => selectAttendanceMode('Morning', 'Out')}
                  disabled={loading}
                >
                  Morning Out
                </button>
                <button 
                  className="button afternoon-in" 
                  onClick={() => selectAttendanceMode('Afternoon', 'In')}
                  disabled={loading}
                >
                  Afternoon In
                </button>
                <button 
                  className="button afternoon-out" 
                  onClick={() => selectAttendanceMode('Afternoon', 'Out')}
                  disabled={loading}
                >
                  Afternoon Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
      
      <div className="status">
        {message}
      </div>

      {!showTodayView && selectedUser && attendanceRecords.length > 0 && (
        <div className="attendance-history">
          <h2>User Attendance History</h2>
          <div className="records-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map(record => (
                  <tr key={record.id}>
                    <td>{record.type}</td>
                    <td>{record.status}</td>
                    <td>{new Date(record.timestamp).toLocaleString()}</td>
                    <td>{record.verified ? 'Yes' : 'No'}</td>
                    <td>
                      {record.hasFaceImage && (
                        <button 
                          className="view-image-btn"
                          onClick={() => viewAttendanceImage(record.id)}
                        >
                          View Image
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTodayView && todayRecords.length > 0 && (
        <div className="attendance-history">
          <h2>Today's Attendance</h2>
          <div className="records-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.map(record => (
                  <tr key={record.id}>
                    <td>{record.userName}</td>
                    <td>{record.type}</td>
                    <td>{record.status}</td>
                    <td>{new Date(record.timestamp).toLocaleString()}</td>
                    <td>
                      {record.hasFaceImage && (
                        <button 
                          className="view-image-btn"
                          onClick={() => viewAttendanceImage(record.id)}
                        >
                          View Image
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedImageId && (
        <AttendanceImage 
          attendanceId={selectedImageId} 
          onClose={closeImageModal} 
        />
      )}
    </div>
  );
};

export default AttendanceApp; 