# Face Recognition Attendance System

A face recognition-based attendance tracking system built with Electron, React, and MySQL.

## Features

- User registration with face capture
- Automatic face detection and recognition
- Attendance tracking (Morning/Afternoon In/Out)
- User attendance history and reporting
- Face-based user identification

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Face Recognition Models

The application uses face-api.js for face detection and recognition. You need to download the model files manually:

1. Create a directory `public/models` if it doesn't exist already
2. Download the following model files from the [face-api.js GitHub repository](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
3. Place them in the `public/models` directory:

Required model files:
- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1
- face_landmark_68_model-weights_manifest.json
- face_landmark_68_model-shard1
- face_recognition_model-weights_manifest.json
- face_recognition_model-shard1
- face_recognition_model-shard2
- face_expression_model-weights_manifest.json
- face_expression_model-shard1

Alternatively, you can download the models using the following steps:

```bash
# Create directories
mkdir -p public/models

# Change to the models directory
cd public/models

# Download models using curl or wget
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1

# Return to the project root
cd ../..
```

### 3. Run the Application

```bash
npm run dev
```

## Usage

1. **Register New Users**: Click "Register New User" and complete the form with your face image
2. **User Identification**: The system will automatically identify registered users by their face
3. **Record Attendance**: Click the appropriate button (Morning In/Out, Afternoon In/Out) to record attendance
4. **View History**: The system will display attendance history for the identified user

## Troubleshooting

If you encounter issues with face detection:

1. Make sure the model files are correctly placed in the `public/models` directory
2. Run `npm run prepare-models` to copy the models to all necessary locations
3. Restart the application completely
4. Check the browser console for any errors related to model loading
5. Ensure adequate lighting for better face detection

## License

MIT 