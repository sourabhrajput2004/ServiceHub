Face movement runtime assets

SDK: @mediapipe/tasks-vision 1.2.2 (pinned in package.json).
The wasm/ files are copied from that package's wasm/ directory. Keep both versions matched.
SDK source and license: https://github.com/google-ai-edge/mediapipe (Apache-2.0).
Model source: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
Model documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker

The app loads these assets from its own origin. Video frames are analysed on-device.
The frontend challenge is a face-movement check, not certified liveness, face identity matching or ID-document verification.
Do not replace these assets with unrelated versions without verifying model initialization in a supported browser.
