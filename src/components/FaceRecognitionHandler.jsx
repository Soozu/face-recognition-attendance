import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { loadModels, getFaceDetails, getFaceDescriptor } from '../utils/faceApiConfig';

// Component to handle face recognition using simple detection
const FaceRecognitionHandler = ({ 
  webcamRef, 
  onFaceDetected, 
  onNoFaceDetected, 
  onUserIdentified,
  isActive = true 
}) => {
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const detectionInterval = useRef(null);
  const identificationInterval = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const consecutiveDetectionsRef = useRef(0);
  const consecutiveNonDetectionsRef = useRef(0);
  const detectionThreshold = 2; // Require 2 consecutive detections/non-detections
  const lastIdentificationTimeRef = useRef(0);
  const MIN_IDENTIFICATION_INTERVAL = 3000; // 3 seconds between identifications

  // Load face-api.js models
  useEffect(() => {
    const initModels = async () => {
      try {
        console.log('Loading face recognition models...');
        const success = await loadModels();
        setModelsLoaded(success);
        console.log('Face recognition models loaded:', success);
      } catch (error) {
        console.error('Error loading face recognition models:', error);
      }
    };
    
    initModels();
    
    return () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
      if (identificationInterval.current) clearInterval(identificationInterval.current);
    };
  }, []);
  
  // Face detection effect
  useEffect(() => {
    if (!webcamRef.current || !isActive || !modelsLoaded) {
      console.log('Face detection not active. Models loaded:', modelsLoaded);
      return;
    }
    
    console.log('Starting face detection using SSD MobileNetv1');
    
    const detectFace = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        try {
          // Detect face using SSD MobileNetv1
          const detections = await faceapi.detectAllFaces(webcamRef.current.video);
          
          // Update face detection state
          const faceFound = detections && detections.length > 0;
          
          if (faceFound) {
            consecutiveDetectionsRef.current++;
            consecutiveNonDetectionsRef.current = 0;
            
            // Face detected consistently
            if (consecutiveDetectionsRef.current >= detectionThreshold && !faceDetected) {
              console.log('Face detected with SSD MobileNetv1');
              setFaceDetected(true);
              if (onFaceDetected) onFaceDetected(detections);
            }
          } else {
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
    
    // Set up detection interval
    detectionInterval.current = setInterval(detectFace, 500);
    
    // Cleanup
    return () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
    };
  }, [webcamRef, modelsLoaded, faceDetected, isActive, onFaceDetected, onNoFaceDetected]);
  
  // User identification effect
  useEffect(() => {
    if (!webcamRef.current || !isActive || !modelsLoaded || !onUserIdentified || !faceDetected) {
      return;
    }
    
    const identifyUser = async () => {
      if (
        webcamRef.current && 
        webcamRef.current.video && 
        webcamRef.current.video.readyState === 4
      ) {
        // Limit identification frequency
        const now = Date.now();
        if (now - lastIdentificationTimeRef.current < MIN_IDENTIFICATION_INTERVAL) {
          return;
        }
        
        try {
          // Get face details with descriptor
          const faceDetails = await getFaceDetails(webcamRef.current.video);
          
          if (faceDetails) {
            // Draw to canvas for backend processing
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            // Set canvas dimensions
            canvas.width = webcamRef.current.video.videoWidth;
            canvas.height = webcamRef.current.video.videoHeight;
            
            // Draw video frame to canvas
            context.drawImage(webcamRef.current.video, 0, 0, canvas.width, canvas.height);
            
            // Create high-quality JPEG
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);
            
            // Store face descriptor in base64 string for backend
            const descriptor = Array.from(faceDetails.descriptor);
            const imageWithDescriptor = {
              image: imageBase64,
              descriptor: descriptor
            };
            
            // Send to backend for identification
            onUserIdentified(JSON.stringify(imageWithDescriptor));
            
            // Update timestamp
            lastIdentificationTimeRef.current = now;
          }
        } catch (error) {
          console.error('Error in face identification:', error);
        }
      }
    };
    
    // Set up identification interval
    identificationInterval.current = setInterval(identifyUser, 3000);
    
    // Cleanup
    return () => {
      if (identificationInterval.current) clearInterval(identificationInterval.current);
    };
  }, [webcamRef, modelsLoaded, faceDetected, isActive, onUserIdentified]);
  
  return null; // No UI rendered by this component
};

export default FaceRecognitionHandler; 