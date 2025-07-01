// Import face-api.js for browser environment
import * as faceapi from 'face-api.js';

// Path configuration for models
const MODEL_PATHS = [
  './models',
  '../models',
  './public/models',
  '../public/models',
  'models',
  '/models'
];

// Load models from various possible locations
export const loadModels = async () => {
  for (const path of MODEL_PATHS) {
    try {
      console.log(`Attempting to load models from: ${path}`);
      
      // Load models using SSD MobileNetv1 (more accurate than TinyFaceDetector)
      await faceapi.nets.ssdMobilenetv1.loadFromUri(path);
      await faceapi.nets.faceLandmark68Net.loadFromUri(path);
      await faceapi.nets.faceRecognitionNet.loadFromUri(path);
      
      console.log(`✓ Models loaded successfully from ${path}`);
      return true;
    } catch (error) {
      console.log(`Failed to load from ${path}`);
    }
  }
  
  console.error('Could not load models from any path');
  return false;
};

// Detect faces in an image
export const detectFaces = async (imageElement) => {
  if (!imageElement || (imageElement instanceof HTMLVideoElement && imageElement.readyState !== 4)) {
    return [];
  }
  
  try {
    // Use SSD MobileNetv1 for more accurate detection
    const detections = await faceapi.detectAllFaces(imageElement);
    return detections || [];
  } catch (error) {
    console.error('Error detecting faces:', error);
    return [];
  }
};

// Get face descriptor from image
export const getFaceDescriptor = async (imageElement) => {
  if (!imageElement || (imageElement instanceof HTMLVideoElement && imageElement.readyState !== 4)) {
    return null;
  }
  
  try {
    // Detect single face and extract descriptor
    const detection = await faceapi
      .detectSingleFace(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (detection) {
      return detection.descriptor;
    }
    return null;
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    return null;
  }
};

// Compare face descriptors using FaceMatcher
export const compareFaceDescriptors = (descriptor1, referenceDescriptors) => {
  if (!descriptor1 || !referenceDescriptors || referenceDescriptors.length === 0) {
    return { match: false, distance: 1.0, similarity: 0 };
  }
  
  try {
    // Create labeled descriptors for the reference faces
    const labeledDescriptors = new faceapi.LabeledFaceDescriptors('user', referenceDescriptors);
    
    // Create face matcher with custom threshold (increased to 0.7 for 70% confidence)
    const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7);
    
    // Find best match
    const bestMatch = matcher.findBestMatch(descriptor1);
    
    // Calculate similarity (0-1)
    const similarity = 1 - bestMatch.distance;
    
    return {
      match: bestMatch.label !== 'unknown',
      label: bestMatch.label,
      distance: bestMatch.distance,
      similarity: similarity
    };
  } catch (error) {
    console.error('Error comparing face descriptors:', error);
    return { match: false, distance: 1.0, similarity: 0 };
  }
};

// Get full face details including landmarks and descriptor
export const getFaceDetails = async (imageElement) => {
  if (!imageElement || (imageElement instanceof HTMLVideoElement && imageElement.readyState !== 4)) {
    return null;
  }
  
  try {
    // Get full face details using SSD MobileNetv1
    const detection = await faceapi
      .detectSingleFace(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    return detection || null;
  } catch (error) {
    console.error('Error getting face details:', error);
    return null;
  }
};

// Export faceapi for direct use
export default faceapi; 