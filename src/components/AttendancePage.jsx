import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Webcam from 'react-webcam';
import FaceRecognitionHandler from './FaceRecognitionHandler';
import '../styles/AttendancePage.css';
// Import logo with fallback handling
let depedLogo;
try {
  depedLogo = require('../assets/deped-logo.png');
} catch (e) {
  depedLogo = null; // Fallback when image doesn't exist
}

const AttendancePage = () => {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState('Select an attendance option to begin.');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState(null);
  const [isWaitingForFace, setIsWaitingForFace] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [isCameraFlipped, setIsCameraFlipped] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [version, setVersion] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateProgress, setUpdateProgress] = useState(null);

  // Helper function to format button text
  const getButtonText = useCallback((type, status) => {
    return (
      <span className="button-content">
        <span className="button-text">{type} {status}</span>
      </span>
    );
  }, []);

  // Format current date and time
  const getFormattedDateTime = useCallback(() => {
    return {
      date: currentDateTime.toLocaleDateString('en-PH', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: currentDateTime.toLocaleTimeString('en-PH', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    };
  }, [currentDateTime]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance records on component mount
  useEffect(() => {
    fetchTodayAttendance();
  }, []);
  
  // Fetch today's attendance records
  const fetchTodayAttendance = useCallback(async () => {
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
  }, []);
  
  // Fetch attendance records for a user
  const fetchUserAttendance = useCallback(async (userId) => {
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
  }, []);
  
  // Check if user already has attendance entry for the selected type and status
  const checkDuplicateAttendance = useCallback((userId, type, status) => {
    // Filter today's records for this user
    const userRecordsToday = todayRecords.filter(record => record.userId === userId);
    
    // Check if there's already an entry for the selected attendance type and status
    const existingEntry = userRecordsToday.find(
      record => record.type === type && record.status === status
    );
    
    // For "In" status, check if user has already clocked in
    if (status === 'In' && existingEntry) {
      return {
        isDuplicate: true,
        message: `You have already clocked in for ${type} today at ${new Date(existingEntry.timestamp).toLocaleTimeString()}. Cannot clock in again.`
      };
    }
    
    // For "Out" status, check if user has clocked in first
    if (status === 'Out') {
      const hasCorrespondingIn = userRecordsToday.some(
        record => record.type === type && record.status === 'In'
      );
      
      if (!hasCorrespondingIn) {
        return {
          isDuplicate: true,
          message: `You need to clock in for ${type} before clocking out.`
        };
      }
      
      if (existingEntry) {
        return {
          isDuplicate: true,
          message: `You have already clocked out for ${type} today at ${new Date(existingEntry.timestamp).toLocaleTimeString()}. Cannot clock out again.`
        };
      }
    }
    
    // No duplicate found
    return { isDuplicate: false };
  }, [todayRecords]);
  
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
    return imageSrc;
  }, [isFaceDetected]);
  
  // Reset states after attendance processing
  const resetStates = useCallback(() => {
    setAttendanceMode(null);
    setIsWaitingForFace(false);
    setProcessingComplete(false);
    setIsIdentifying(false);
    setIsCameraActive(false);
    setSelectedUser(null);
    setValidationMessage(null);
  }, []);
  
  // Validate time-based attendance selection
  const validateAttendanceTime = useCallback((type) => {
    const currentHour = new Date().getHours();
    const currentMinutes = new Date().getMinutes();
    const currentTime = currentHour + (currentMinutes / 60);

    // Define time ranges
    const morningStart = 6; // 6:00 AM
    const morningEnd = 13; // 1:00 PM (extended for morning)
    const afternoonStart = 12; // 12:00 PM (noon)
    const afternoonEnd = 22; // 10:00 PM

    if (type === 'Morning') {
      if (currentTime < morningStart || currentTime >= morningEnd) {
        return {
          isValid: false,
          message: `Morning attendance is only available between 6:00 AM and 1:00 PM. Current time: ${new Date().toLocaleTimeString()}`
        };
      }
    } else if (type === 'Afternoon') {
      if (currentTime < afternoonStart || currentTime >= afternoonEnd) {
        return {
          isValid: false,
          message: `Afternoon attendance is only available between 12:00 PM and 10:00 PM. Current time: ${new Date().toLocaleTimeString()}`
        };
      }
    }

    return { isValid: true };
  }, []);
  
  // Select attendance mode
  const selectAttendanceMode = useCallback((type, status) => {
    // Validate time-based attendance
    const timeValidation = validateAttendanceTime(type);
    
    if (!timeValidation.isValid) {
      setValidationMessage(timeValidation.message);
      setMessage(timeValidation.message);
      return;
    }

    // Set the selected mode and activate camera
    setAttendanceMode({ type, status });
    setIsCameraActive(true);
    setValidationMessage(null);
    setMessage(`Selected ${type} ${status}. Please position your face in the camera for scanning...`);
  }, [validateAttendanceTime]);
  
  // Record attendance with user ID and image
  const recordAttendance = useCallback(async (userId, faceImage) => {
    setLoading(true);
    
    try {
      // Check for duplicate attendance entries
      const validation = checkDuplicateAttendance(userId, attendanceMode.type, attendanceMode.status);
      if (validation.isDuplicate) {
        // Display error message and stop processing
        setMessage(`Error: ${validation.message}`);
        setIsWaitingForFace(false);
        setIsIdentifying(false);
        setLoading(false);
        
        // Auto-reset after 4 seconds to show the error
        setTimeout(() => {
          resetStates();
        }, 4000);
        return;
      }
      
      // Send to backend for processing
      const result = await window.api.recordAttendance(
        userId, 
        attendanceMode.type, 
        attendanceMode.status, 
        faceImage
      );
      
      // Display the result
      setMessage(`Success: ${result.message}`);
      
      // Mark processing as complete
      setProcessingComplete(true);
      
      // Refresh attendance records
      if (selectedUser) {
        await fetchUserAttendance(userId);
      }
      await fetchTodayAttendance();
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        resetStates();
      }, 3000);
    } catch (error) {
      setMessage(`Error: ${error.message || 'Failed to record attendance'}`);
      setIsWaitingForFace(false);
      setIsIdentifying(false);
    } finally {
      setLoading(false);
    }
  }, [attendanceMode, checkDuplicateAttendance, fetchTodayAttendance, fetchUserAttendance, resetStates, selectedUser]);
  
  // Process attendance based on selected mode
  const processAttendance = useCallback(async () => {
    if (!attendanceMode) return;
    
    if (!isFaceDetected) {
      setMessage(`Face not detected. Please position your face in the camera.`);
      return;
    }
    
    // If no user is identified yet, try to identify first
    if (!selectedUser && !isIdentifying) {
      setIsIdentifying(true);
      setMessage('Identifying user first...');
      
      try {
        // Capture image for identification
        const faceImage = captureImage();
        if (!faceImage) {
          setIsIdentifying(false);
          return;
        }
        
        // Send to backend for identification
        const result = await window.api.identifyUserByFace(faceImage);
        
        if (result.success) {
          // Set the user but show verification prompt before proceeding
          setSelectedUser(result.user);
          setMessage(`Identified as ${result.user.name || `${result.user.firstName} ${result.user.lastName}`}! Please verify your details below and confirm.`);
          setIsIdentifying(false);
          setIsWaitingForFace(false);
          
          return;
        } else {
          if (result.bestSimilarity && result.bestSimilarity > 0.5) {
            setMessage(`Almost recognized you (${Math.round(result.bestSimilarity * 100)}% match). Need 70% or higher to authenticate.`);
          } else {
            setMessage(`${result.message || 'No match found'}. Please try again or contact administrator.`);
          }
          setIsIdentifying(false);
          setIsWaitingForFace(false);
          return;
        }
      } catch (error) {
        console.error('Identification error:', error);
        setMessage(`Error identifying user: ${error.message || 'Unknown error'}`);
        setIsIdentifying(false);
        setIsWaitingForFace(false);
        return;
      }
    } else {
      // User already identified and verified, proceed with attendance
      setIsWaitingForFace(true);
      setMessage(`Face detected! Processing ${attendanceMode.type} ${attendanceMode.status} for ${selectedUser.name || `${selectedUser.firstName} ${selectedUser.lastName}`}...`);
      
      // Capture image
      const faceImage = captureImage();
      if (!faceImage) {
        setIsWaitingForFace(false);
        return;
      }
      
      await recordAttendance(selectedUser.id, faceImage);
    }
  }, [selectedUser, captureImage, isFaceDetected, attendanceMode, isIdentifying, recordAttendance]);
  
  // Manual process button handler
  const handleProcessAttendance = useCallback(() => {
    if (isFaceDetected) {
      processAttendance();
    } else {
      setMessage(`Face not detected. Please position your face in the camera.`);
    }
  }, [isFaceDetected, processAttendance]);
  
  // Handle face detection callback
  const handleFaceDetected = useCallback(() => {
    setIsFaceDetected(true);
    if (attendanceMode && !isWaitingForFace) {
      setMessage('Face detected. Ready to process attendance.');
    } else if (!selectedUser && !attendanceMode) {
      setMessage('Face detected. Select an attendance option.');
    }
  }, [selectedUser, attendanceMode, isWaitingForFace]);
  
  // Handle face loss callback
  const handleNoFaceDetected = useCallback(() => {
    setIsFaceDetected(false);
    setMessage('No face detected. Please position your face in the camera.');
  }, []);
  
  // Handle user identification
  const handleUserIdentified = useCallback(async (faceImageBase64) => {
    if (selectedUser || isIdentifying || !attendanceMode || !isCameraActive) return;
    
    try {
      setIsIdentifying(true);
      setMessage('Identifying user...');
      
      // Send to backend for identification
      const result = await window.api.identifyUserByFace(faceImageBase64);
      
      if (result.success) {
        setSelectedUser(result.user);
        setMessage(`Welcome, ${result.user.name || `${result.user.firstName} ${result.user.lastName}`}! Verifying and processing attendance...`);
        
        // Check for duplicate attendance before processing
        const validation = checkDuplicateAttendance(result.user.id, attendanceMode.type, attendanceMode.status);
        if (validation.isDuplicate) {
          setMessage(`Error: ${validation.message}`);
          setIsIdentifying(false);
          setIsWaitingForFace(false);
          
          // Auto-reset after 4 seconds to show the error
          setTimeout(() => {
            resetStates();
          }, 4000);
          return;
        }
        
        // Auto-process attendance after successful identification
        setTimeout(() => {
          // Use the captured image from face recognition handler
          recordAttendance(result.user.id, faceImageBase64);
        }, 1500); // Short delay to show the user info before processing
      } else {
        if (result.bestSimilarity && result.bestSimilarity > 0.5) {
          setMessage(`Almost recognized you (${Math.round(result.bestSimilarity * 100)}% match). Need 70% or higher to authenticate.`);
        } else {
          setMessage(`${result.message || 'No match found'}. Please try again or contact administrator.`);
        }
        setIsIdentifying(false);
      }
    } catch (error) {
      console.error('Identification error:', error);
      setMessage(`Error identifying user: ${error.message || 'Unknown error'}`);
    } finally {
      setIsIdentifying(false);
    }
  }, [selectedUser, isIdentifying, attendanceMode, isCameraActive, recordAttendance, checkDuplicateAttendance, resetStates]);
  
  // Reset user selection
  const resetUserSelection = useCallback(() => {
    setSelectedUser(null);
    setAttendanceRecords([]);
    setAttendanceMode(null);
    setIsWaitingForFace(false);
    setProcessingComplete(false);
    setIsCameraActive(false);
    setValidationMessage(null);
    setMessage('User reset. Select an attendance option to begin.');
  }, []);
  
  // Toggle camera flipped state
  const toggleCameraFlip = useCallback(() => {
    setIsCameraFlipped(!isCameraFlipped);
  }, [isCameraFlipped]);
  
  // Cancel attendance and return to mode selection
  const cancelAttendance = useCallback(() => {
    resetStates();
    setMessage('Select an attendance option to begin.');
  }, [resetStates]);

  // Memoize the camera component to prevent unnecessary re-renders
  const cameraComponent = useMemo(() => {
    if (!isCameraActive) return null;
    
    return (
      <div className="camera-section">
        <div className="camera-container">
          <div className={`webcam-container ${isCameraFlipped ? 'flipped' : ''}`}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{
                facingMode: "user"
              }}
            />
          </div>
          
          <FaceRecognitionHandler
            webcamRef={webcamRef}
            onFaceDetected={handleFaceDetected}
            onNoFaceDetected={handleNoFaceDetected}
            onUserIdentified={handleUserIdentified}
            isActive={isCameraActive && !selectedUser && !isWaitingForFace}
          />
          
          <button 
            className="camera-flip-button" 
            onClick={toggleCameraFlip}
            title={isCameraFlipped ? "Normal View" : "Flip Camera"}
          >
            {isCameraFlipped ? "Normal" : "Flip"}
          </button>
        </div>
        
        <div className="status-container">
          <p className="status-message">{message}</p>
          {validationMessage && (
            <div className="validation-message">
              {validationMessage}
            </div>
          )}
        </div>
      </div>
    );
  }, [
    isCameraActive, 
    isCameraFlipped, 
    isFaceDetected, 
    handleFaceDetected, 
    handleNoFaceDetected, 
    handleUserIdentified, 
    message, 
    selectedUser, 
    isWaitingForFace, 
    toggleCameraFlip,
    validationMessage
  ]);

  // Check if attendance type is available at current time
  const getButtonAvailability = useCallback((type) => {
    const validation = validateAttendanceTime(type);
    return validation.isValid;
  }, [validateAttendanceTime]);

  // Get user's attendance status for today
  const getUserAttendanceStatus = useCallback((userId) => {
    if (!userId) return null;
    
    const userRecordsToday = todayRecords.filter(record => record.userId === userId);
    const status = {
      morningIn: userRecordsToday.find(r => r.type === 'Morning' && r.status === 'In'),
      morningOut: userRecordsToday.find(r => r.type === 'Morning' && r.status === 'Out'),
      afternoonIn: userRecordsToday.find(r => r.type === 'Afternoon' && r.status === 'In'),
      afternoonOut: userRecordsToday.find(r => r.type === 'Afternoon' && r.status === 'Out')
    };
    
    return status;
  }, [todayRecords]);

  // Memoize attendance controls
  const attendanceControls = useMemo(() => {
    if (isCameraActive) {
      return (
        <div className="attendance-section">
          <div className="scanning-mode">
            <div className="selected-mode">
              <h3>SELECTED: {attendanceMode.type} {attendanceMode.status}</h3>
              <div className="step-indicator">
                <div className="step-circle active">1</div>
                <div className="step-line"></div>
                <div className={`step-circle ${isWaitingForFace || processingComplete ? 'active' : ''}`}>2</div>
              </div>
              <h4 className={processingComplete ? (validationMessage ? "warning" : "success") : ""}>
                {processingComplete 
                  ? validationMessage ? "Attention: Attendance Validation Check" : "Attendance Recorded Successfully!" 
                  : isWaitingForFace 
                    ? "Face Detected - Processing..." 
                    : "Position Your Face in the Camera for Automatic Verification"}
              </h4>
            </div>
            
            {!processingComplete && !isWaitingForFace && selectedUser && (
              <div className="process-buttons">
                <div className="user-details">
                  <h4>User Verification</h4>
                  <div className="detail-row">
                    <span className="label">Name:</span>
                    <span className="value">
                      {selectedUser.name || `${selectedUser.firstName} ${selectedUser.lastName}`}
                    </span>
                  </div>
                  {selectedUser.firstName && selectedUser.lastName && (
                    <>
                      <div className="detail-row">
                        <span className="label">First Name:</span>
                        <span className="value">{selectedUser.firstName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Last Name:</span>
                        <span className="value">{selectedUser.lastName}</span>
                      </div>
                    </>
                  )}
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span className="value">{getFormattedDateTime().time}</span>
                  </div>
                  
                  <div className="verification-actions">
                    <p>Processing attendance automatically...</p>
                  </div>
                </div>
              </div>
            )}
            
            <button 
              className="cancel-scan-button" 
              onClick={cancelAttendance}
              disabled={loading && !processingComplete}
            >
              {processingComplete ? "Continue" : "Cancel"}
            </button>
          </div>
        </div>
      );
    } else {
      const isMorningAvailable = getButtonAvailability('Morning');
      const isAfternoonAvailable = getButtonAvailability('Afternoon');
      
      return (
        <div className="attendance-buttons">
          <div className="current-datetime-selection">
            <span className="current-date">{getFormattedDateTime().date}</span>
            <span className="current-time">{getFormattedDateTime().time}</span>
          </div>
          <h3>Select Attendance Option:</h3>
          {validationMessage && (
            <div className="time-validation-message">
              Warning: {validationMessage}
            </div>
          )}
          <div className="button-grid">
            <button 
              className={`button morning-in ${!isMorningAvailable ? 'disabled-time' : ''}`}
              onClick={() => selectAttendanceMode('Morning', 'In')}
              disabled={loading || !isMorningAvailable}
              title={!isMorningAvailable ? 'Morning attendance only available 6:00 AM - 1:00 PM' : ''}
            >
              {getButtonText('Morning', 'In')}
              {!isMorningAvailable && <span className="time-indicator">6AM-1PM</span>}
            </button>
            <button 
              className={`button morning-out ${!isMorningAvailable ? 'disabled-time' : ''}`}
              onClick={() => selectAttendanceMode('Morning', 'Out')}
              disabled={loading || !isMorningAvailable}
              title={!isMorningAvailable ? 'Morning attendance only available 6:00 AM - 1:00 PM' : ''}
            >
              {getButtonText('Morning', 'Out')}
              {!isMorningAvailable && <span className="time-indicator">6AM-1PM</span>}
            </button>
            <button 
              className={`button afternoon-in ${!isAfternoonAvailable ? 'disabled-time' : ''}`}
              onClick={() => selectAttendanceMode('Afternoon', 'In')}
              disabled={loading || !isAfternoonAvailable}
              title={!isAfternoonAvailable ? 'Afternoon attendance only available 12:00 PM - 10:00 PM' : ''}
            >
              {getButtonText('Afternoon', 'In')}
              {!isAfternoonAvailable && <span className="time-indicator">12PM-10PM</span>}
            </button>
            <button 
              className={`button afternoon-out ${!isAfternoonAvailable ? 'disabled-time' : ''}`}
              onClick={() => selectAttendanceMode('Afternoon', 'Out')}
              disabled={loading || !isAfternoonAvailable}
              title={!isAfternoonAvailable ? 'Afternoon attendance only available 12:00 PM - 10:00 PM' : ''}
            >
              {getButtonText('Afternoon', 'Out')}
              {!isAfternoonAvailable && <span className="time-indicator">12PM-10PM</span>}
            </button>
          </div>
        </div>
      );
    }
  }, [
    isCameraActive, 
    attendanceMode, 
    isWaitingForFace, 
    processingComplete, 
    selectedUser, 
    loading, 
    validationMessage, 
    cancelAttendance,
    selectAttendanceMode,
    getButtonText,
    getButtonAvailability,
    getFormattedDateTime
  ]);

  // Memoize attendance history
  const attendanceHistoryTable = useMemo(() => {
    if (loading && !attendanceMode) {
      return <p className="loading-text">Loading records...</p>;
    } else if (todayRecords.length > 0) {
      return (
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {todayRecords.map(record => (
              <tr key={record.id}>
                <td>
                  {record.userName || 
                   (record.userFirstName && record.userLastName 
                    ? `${record.userFirstName} ${record.userLastName}` 
                    : 'Unknown User')}
                </td>
                <td>{record.type}</td>
                <td>{record.status}</td>
                <td>{new Date(record.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else {
      return <p className="no-records">No attendance records for today.</p>;
    }
  }, [todayRecords, loading, attendanceMode]);
  
  useEffect(() => {
    // Get current version
    window.api.getAppVersion().then(setVersion);

    // Get initial update status
    window.api.getUpdateStatus().then(setUpdateStatus);

    // Listen for update events
    window.api.onUpdateAvailable((event, info) => {
      setUpdateStatus(`Update available: ${info.version}`);
    });

    window.api.onUpdateProgress((event, progress) => {
      setUpdateProgress(progress);
      setUpdateStatus(`Downloading update: ${Math.round(progress.percent)}%`);
    });

    window.api.onUpdateReady((event, info) => {
      setUpdateStatus(`Update ready to install: ${info.version}`);
    });

    // Check for updates
    window.api.checkForUpdates();
  }, []);

  return (
    <div className="attendance-container fade-in">
      <header className="attendance-header">
        <div className="header-content">
          <div className="city-logo">
            <div className="logo-placeholder">
              {depedLogo ? (
                <img src={depedLogo} alt="Department of Education Logo" />
              ) : (
                <div className="logo-fallback">DepEd</div>
              )}
            </div>
          </div>
          <div className="header-text">
            <h1>Face Recognition Attendance System</h1>
            <div className="header-subtitle">
              <span className="city-name">Department of Education</span>
              <span className="division-name">Division of Imus City, Cavite</span>
            </div>
            {isCameraActive && (
              <div className="current-datetime">
                <span className="current-date">{getFormattedDateTime().date}</span>
                <span className="current-time">{getFormattedDateTime().time}</span>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="main-grid">
        {cameraComponent}
          {attendanceControls}
        </div>
      
      <section className="attendance-history-section">
        <div className="section-header">
          <div className="section-title">
            <h2>Today's Attendance Records</h2>
            <span className="record-count">
              {todayRecords.length} {todayRecords.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <button 
            className="refresh-button" 
            onClick={fetchTodayAttendance} 
            disabled={loading}
            title="Refresh attendance records"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="records-container">
          {attendanceHistoryTable}
        </div>
      </section>
      
      <footer className="attendance-footer">
        <div className="footer-content">
          <div className="footer-info">
            <span className="system-info">Powered by AI Face Recognition Technology</span>
            <span className="version-info">
              Version {version} • Secure & Reliable
              {updateStatus && ` • ${updateStatus}`}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default React.memo(AttendancePage);  