Setup
=====================================

You must first setup the URL. The urls are located on the urls.js file.
There you will see four url variables:

1. OCR 
2. FACE_DETECTION
3. OBJECT_DETECTION
4. AUDIO_TO_TEXT

In the repository there are four folders named like the variables above.
Create four Google Cloud Functions by uploading each of the files to separate Google Cloud Functions and use the URLs given to you for each of those functions.
All the Google Cloud Functions is written with the Node.js 10 runtime in mind, with the export functions as follows:

1. OCR -> ocr
2. FACE_DETECTION -> faceDetection 
3. OBJECT_DETECTION -> objectDetection
4. AUDIO_TO_TEXT -> audioToText

This app currently only works with Android, and since it uses camera and microphone, you cannot use it with the android emulator. You must use a real android device to use this app.

As with any expo app, refer to the Expo Documentation for instructions on how to run it: https://docs.expo.io/




