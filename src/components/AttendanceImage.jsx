import React, { useState, useEffect } from 'react';

const AttendanceImage = ({ attendanceId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      if (!attendanceId) return;
      
      try {
        setLoading(true);
        const response = await window.api.getAttendanceImage(attendanceId);
        
        if (response.success) {
          setImage(response.imageData);
        } else {
          setError(response.message || 'Failed to load image');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while loading the image');
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [attendanceId]);

  return (
    <div className="attendance-image-modal">
      <div className="attendance-image-content">
        <div className="attendance-image-header">
          <h3>Attendance Image</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="attendance-image-body">
          {loading && <p>Loading image...</p>}
          
          {error && <div className="error-message">{error}</div>}
          
          {!loading && !error && image && (
            <div className="image-container">
              <img src={image} alt="Attendance verification" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceImage; 