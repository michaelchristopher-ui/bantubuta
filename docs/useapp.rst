How to use the app
=====================================

The first time you activate the app, you will be asked two types of permissions: 

1. Audio and Video permissions
2. Camera permissions

You must accept both of them in order for the app to function properly.

Once you have accepted the permission, the app can be used. 

The user can now tap once on the screen to record a command. Once the user has finished saying the command, the user can tap once again to have the app process it.

Currently the app accepts these commands:

1. Bantu Buta, bacakan teks ini untukku
2. Bantu Buta, barang apakah yang ada di depanku
3. Bantu Buta, ada siapa di depanku

The first command activates the Read Text Feature. It will send the image to the ocr Google Cloud Function.
The ocr Google Cloud Function will then save the image in temporary storage.
It will then send the image to Google Vision API by the instanced client, and using the textDetection function.
It will then return an object, which we will take the first description only.

The second command activates the object detection feature. It will send the image to the objectDetection Google Cloud Function
The objectDetection Google Cloud function will then save the image in temporary storage.
It will then send the image to Google Vision API by the instanced client, and using the objectLocalized function.
It will then return an object, which contains object names. We will take each object name and put it in an array that we will return.

The third command activates the face detection feacure. It will send the image to the faceDetection Google Cloud Function
The faceDetection Google Cloud Function will then save the image in temporary storage.
It will then send the image to Google Vision API by the instanced client, and using the faceDetection function.
It will then return an object, which contains the most likley emotions for each face.