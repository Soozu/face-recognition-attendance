import React, { useState, useEffect, useRef } from 'react';

const SimpleFaceDetector = ({ webcamRef, onFaceDetected, onNoFaceDetected, isActive = true }) => {
  const [faceDetected, setFaceDetected] = useState(false);
  const detectionInterval = useRef(null);
  const canvasRef = useRef(null);
  const consecutiveDetectionsRef = useRef(0);
  const consecutiveNonDetectionsRef = useRef(0);
  const detectionThreshold = 2; // Reduced from 3 for faster response
  const detectionDebugRef = useRef(null);

  // Simple face detection using canvas and pixel analysis
  useEffect(() => {
    if (!webcamRef.current || !isActive) return;

    const detectFace = () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          // Improved face detection using multiple sampling regions
          // Expanded to cover more of the frame
          const detectionRegions = [
            // Center region (primary) - made larger
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
            },
            // Left side
            {
              x: Math.floor(canvas.width * 0.25),
              y: Math.floor(canvas.height * 0.25),
              width: Math.floor(canvas.width * 0.3),
              height: Math.floor(canvas.height * 0.5)
            },
            // Right side
            {
              x: Math.floor(canvas.width * 0.45),
              y: Math.floor(canvas.height * 0.25),
              width: Math.floor(canvas.width * 0.3),
              height: Math.floor(canvas.height * 0.5)
            }
          ];

          // Test each region for a face
          let detectedInAnyRegion = false;
          const debugInfo = [];
          
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
            
            // Calculate variance
            let variance = 0;
            for (let i = 0; i < data.length; i += 4) {
              const rDiff = data[i] - r;
              const gDiff = data[i + 1] - g;
              const bDiff = data[i + 2] - b;
              variance += (rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
            }
            variance /= pixelCount;
            
            // Enhanced skin tone detection - more permissive
            const isSkinTone = (
              r > g && // Red channel is typically stronger than green in skin
              r > b && // Red channel is typically stronger than blue in skin
              r > 50 && // Lower threshold for darker skin tones
              g > 30 && 
              b > 15 &&
              r < 250 // Avoid pure white areas
            );
            
            // Variance should be in a reasonable range - wider range
            const hasVariance = variance > 80 && variance < 6000;
            
            // Color proportion check - wider acceptable ranges
            const rgRatio = r / g; // Typically between 1.0 and 1.5 for skin
            const rbRatio = r / b; // Typically between 1.2 and 3.0 for skin
            const colorCheck = rgRatio > 0.9 && rgRatio < 2.2 && rbRatio > 1.1 && rbRatio < 5.0;
            
            // Track detection values for debugging
            debugInfo.push({
              region: `${x},${y}`,
              r, g, b,
              variance,
              isSkinTone,
              hasVariance,
              rgRatio,
              rbRatio,
              colorCheck,
              pass: isSkinTone && hasVariance && colorCheck
            });
            
            // Consider a face detected if all conditions are met
            if (isSkinTone && hasVariance && colorCheck) {
              detectedInAnyRegion = true;
              break; // Exit as soon as we detect in one region
            }
          }
          
          // Save debug info
          detectionDebugRef.current = debugInfo;
          
          // Update consecutive detection counters
          if (detectedInAnyRegion) {
            consecutiveDetectionsRef.current++;
            consecutiveNonDetectionsRef.current = 0;
          } else {
            consecutiveNonDetectionsRef.current++;
            consecutiveDetectionsRef.current = 0;
          }
          
          // Only change detection state after meeting threshold
          // This prevents flickering between detected/not detected states
          if (consecutiveDetectionsRef.current >= detectionThreshold && !faceDetected) {
            setFaceDetected(true);
            if (onFaceDetected) onFaceDetected();
            console.log('Face detected with values:', detectionDebugRef.current);
          } else if (consecutiveNonDetectionsRef.current >= detectionThreshold && faceDetected) {
            setFaceDetected(false);
            if (onNoFaceDetected) onNoFaceDetected();
          }
          
        } catch (error) {
          console.error('Error in face detection:', error);
        }
      }
    };

    // Set up interval for continuous detection - even faster
    detectionInterval.current = setInterval(detectFace, 200); // Was 300ms

    // Cleanup function
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [webcamRef, faceDetected, onFaceDetected, onNoFaceDetected, isActive]);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }} // Hide the canvas
      />
      <div className="face-detector-status">
        <div className={`detector-status ${faceDetected ? 'face-detected' : 'no-face'}`}>
          {faceDetected ? 'Face Detected ✓' : 'No Face Detected ✗'}
        </div>
      </div>
    </>
  );
};

export default SimpleFaceDetector; 