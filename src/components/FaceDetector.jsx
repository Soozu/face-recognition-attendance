import React, { useState, useEffect, useRef } from 'react';
import { loadModels, detectFaces } from '../utils/faceApiConfig';

const FaceDetector = ({ webcamRef, onFaceDetected, onNoFaceDetected, isActive = true }) => {
  const [faceDetected, setFaceDetected] = useState(false);
  const detectionInterval = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const consecutiveDetectionsRef = useRef(0);
  const consecutiveNonDetectionsRef = useRef(0);
  const detectionThreshold = 2; // Require 2 consecutive detections/non-detections

  // Enhanced face detection using simple pixel analysis
  const detectFaceSimple = (video) => {
    if (!video) return false;
    
    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Multiple detection regions for better accuracy
      const detectionRegions = [
        // Center region (primary)
        {
          x: Math.floor(canvas.width * 0.35),
          y: Math.floor(canvas.height * 0.25),
          width: Math.floor(canvas.width * 0.3),
          height: Math.floor(canvas.height * 0.5)
        },
        // Upper center
        {
          x: Math.floor(canvas.width * 0.35),
          y: Math.floor(canvas.height * 0.15),
          width: Math.floor(canvas.width * 0.3),
          height: Math.floor(canvas.height * 0.3)
        },
        // Lower center
        {
          x: Math.floor(canvas.width * 0.35),
          y: Math.floor(canvas.height * 0.4),
          width: Math.floor(canvas.width * 0.3),
          height: Math.floor(canvas.height * 0.35)
        }
      ];
      
      // Test each region for a face
      for (const region of detectionRegions) {
        const { x, y, width, height } = region;
        
        // Get image data for this region
        const imageData = context.getImageData(x, y, width, height);
        const data = imageData.data;
        
        // Calculate average RGB values
        let r = 0, g = 0, b = 0;
        const pixelCount = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        
        r /= pixelCount;
        g /= pixelCount;
        b /= pixelCount;
        
        // Calculate variance (for feature detection)
        let variance = 0;
        for (let i = 0; i < data.length; i += 4) {
          const rDiff = data[i] - r;
          const gDiff = data[i + 1] - g;
          const bDiff = data[i + 2] - b;
          variance += (rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
        }
        variance /= pixelCount;
        
        // Enhanced skin tone detection
        const isSkinTone = (
          r > g && // Red channel stronger than green in skin
          r > b && // Red channel stronger than blue in skin
          r > 50 && // Lower threshold for darker skin tones
          g > 30 && 
          b > 15 &&
          r < 250 // Avoid pure white areas
        );
        
        // Variance should be in a reasonable range
        const hasVariance = variance > 80 && variance < 6000;
        
        // Color proportion check
        const rgRatio = r / g; // Typically between 1.0 and 1.5 for skin
        const rbRatio = r / b; // Typically between 1.2 and 3.0 for skin
        const colorCheck = rgRatio > 0.9 && rgRatio < 2.2 && rbRatio > 1.1 && rbRatio < 5.0;
        
        // Consider a face detected if all conditions are met
        if (isSkinTone && hasVariance && colorCheck) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error in face detection:', error);
      return false;
    }
  };

  // Start face detection
  useEffect(() => {
    if (!webcamRef.current || !isActive) return;

    const runFaceDetection = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        try {
          // Get video element
          const video = webcamRef.current.video;
          
          // Use our reliable face detection method
          const faceFound = detectFaceSimple(video);

          // Update consecutive detection counters
          if (faceFound) {
            consecutiveDetectionsRef.current++;
            consecutiveNonDetectionsRef.current = 0;
            
            // Face detected consistently
            if (consecutiveDetectionsRef.current >= detectionThreshold && !faceDetected) {
              console.log('Face detected!');
              setFaceDetected(true);
              if (onFaceDetected) onFaceDetected();
            }
          } else {
            // Increment consecutive non-detections counter
            consecutiveNonDetectionsRef.current++;
            consecutiveDetectionsRef.current = 0;
            
            // Face lost consistently
            if (consecutiveNonDetectionsRef.current >= detectionThreshold && faceDetected) {
              console.log('Face lost');
              setFaceDetected(false);
              if (onNoFaceDetected) onNoFaceDetected();
            }
          }
        } catch (error) {
          console.error('Error in face detection:', error);
        }
      }
    };

    // Set up interval for continuous detection
    detectionInterval.current = setInterval(runFaceDetection, 200); // Fast detection

    // Cleanup function
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [webcamRef, faceDetected, onFaceDetected, onNoFaceDetected, isActive]);

  return (
    <div className="face-detector-status">
      <div className={`detector-status ${faceDetected ? 'face-detected' : 'no-face'}`}>
        {faceDetected ? 'Face Detected ✓' : 'No Face Detected ✗'}
      </div>
    </div>
  );
};

export default FaceDetector; 