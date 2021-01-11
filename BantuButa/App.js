import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import mime from "mime";
import {urls} from './Urls';


/**
* Function which is a custom hook for asking Camera permission
* @returns {Object} hasCameraPermission which is a state variable
*/
function useCameraPermission(){
  const [hasCameraPermission, setHasCameraPermission] = useState(null);

  /**
   * This useEffect will only be run once which is indicated by the optional second parameter of useEffect which is empty 
   */
  useEffect(() => {
    (async () => {
      if (!hasCameraPermission){
        try {
          const { status } = await Camera.requestPermissionsAsync();
          setHasCameraPermission(status === 'granted');
        } catch (error){
        }
      }
    })();
  }, []);
  
  return hasCameraPermission;
}


/**
* Function which is a custom hook for asking AV permission
* @returns {Object} hasAVPermission which is a state variable
*/
function useAVPermission(){
  const [hasAVPermission, setHasAVPermission] = useState(null);

  /**
   * This useEffect will only be run once which is indicated by the optional second parameter of useEffect which is empty 
   */
  useEffect(() => {
    (async () => {
      if (!hasAVPermission){
        try {
          const { status } = await Audio.requestPermissionsAsync();
          setHasAVPermission(status === 'granted');
        } catch (error) {
        }
      }
    })();
  }, []);

  return hasAVPermission;
}

/**
* Function which is a custom hook for returning a certain camera type
* @returns {Object} type which is a state variable
*/
function useType() {
  const [type, setType] = useState(Camera.Constants.Type.back);
  return type;
}



/**
  * The Main App Functional Component
  * @returns {Component} 
*/
export default function App() {
  const hasCameraPermission = useCameraPermission();
  const hasAVPermission = useAVPermission();
  const type = useType();
  const [isRecordingNow, setIsRecordingNow] = useState(false);

  // Start of recording instance related state and hook
  // I am unable to refactor this into custom hook since it uses two state variables for now 
  const [canRecord, setCanRecord] = useState(false);
  const [recordingInstance, setRecordingInstance] = useState(null);

  
  useEffect(() => {
    (async() => {
      if (canRecord){
        try{
          const {isRecording} = await recordingInstance.startAsync();
          setIsRecordingNow(isRecording);
          speakSomething("Berbicaralah sekarang");
        } catch(error) {

        } 
      }
    })();
  });
  // End of recording instance related state and hook

  /**
  * Asyncronous function which takes a picture and stores it in a temporary storage
  * @returns {String} uri The uri where the image is located
  */
  const takePicture = async () => {
    if (this.camera) {
        const data = await this.camera.takePictureAsync();
        const {uri} = data;
        return uri;
    }
  };

  /**
  * Asyncronous function which processes tanscripts
  * It will accept three commands, and processes it differently depending on the command.
  * @param {String} transcript The transcript that will be processed
  */
  const processTranscript = async (transcript) => {
    try {
      let uriPicture = await takePicture();
      const formData = new FormData();
      console.log(uriPicture)
      console.log(mime.getType(uriPicture))
      formData.append('filename', 'file');
      formData.append('fileName', 'file');
      formData.append('file', {
        uri: uriPicture,
        name: 'image.jpg', 
        type: 'image/jpg'
      });
      console.log(transcript);

      if (transcript.includes("bantu buta bacakan teks ini untukku")) {
        fetch(urls.OCR , {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'multipart/form-data',
        },
        body: formData
      }).then((response) => {
        if(response.ok) {
            return response.json();
        }
      }).then(data => {
        if(data) {
            speakSomething(data["message"]);
        }
    }).catch(err => console.error(err));
      } else if (transcript.includes("bantu buta barang apakah yang ada di depanku")){
          console.log("Valid Command");
          fetch(urls.OBJECT_DETECTION, {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'multipart/form-data',
            },
            body: formData
          }).then((response) => {
            if(response.ok) {
                return response.json();
            }
          }).then(data => {
            if(data) {
                const totalString = "Ada " + data["message"].length + " barang di depan anda yang saya kenali."
                speakSomething(totalString);
                for (let i = 0; i < data["message"].length; i++) {
                  speakSomething("Barang ke " + (i + 1).toString() + " masuk ke dalam kategori");
                  speakSomething(data["message"][i]);
                }
            }
        }).catch(err => console.error(err));
      } else if (transcript.includes("bantu buta ada siapa di depanku")) {
        console.log("Valid Command");
          fetch(urls.FACE_DETECTION, {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'multipart/form-data',
            },
            body: formData
          }).then((response) => {
            if(response.ok) {
                return response.json();
            }
          }).then(data => {
            if(data) {
                const totalString = "Ada " + data["message"].length + " orang di depan anda.";
                console.log(totalString);
                speakSomething(totalString);
                for (let i = 0; i < data["message"].length; i++) {
                  let rautMuka = data["message"][i];
                  if (rautMuka === null) rautMuka = "Tidak diketahui";
                  const eachPersonSpokenString = "Orang nomor " + (i + 1).toString() + " memiliki raut muka " + rautMuka ;
                  console.log(eachPersonSpokenString);
                  speakSomething(eachPersonSpokenString);
                }
            }
        }).catch(err => console.error(err));
      } else {
        console.log("Invalid Command");
      }
    } catch (err){ 
      console.log(err);
    }
  };

  /**
  * Asyncronous function which does two things depending on whether or not it is currently recording
  * If it is recording it will stop and unload the recording instance and will send the audio to the specified URL.
  */
  const tapped = (async () => { 
    if (isRecordingNow){
      let transcript;
        try {
          await recordingInstance.stopAndUnloadAsync();
          setIsRecordingNow(false);
          speakSomething("Selesai Perekaman. Memproses perintah sekarang.");
          const uri = await recordingInstance.getURI();
          const formData = new FormData();
          formData.append('file', {
            uri,
            type: 'audio/mp4',
            name: 'speech2text.m4a'
          });
          await fetch(urls.AUDIO_TO_TEXT, {
            method: 'POST',
            body: formData
          }).then((response) => response.json())
          .then(async (json) => {
            transcript = json["transcript"].toLowerCase();
            processTranscript(transcript);
          })

        } catch (error) {
          console.log(error)
        }
        
    } else {
      try {
        const recording = new Audio.Recording();
        const recordingSetting = {
          android: {
              extension: '.m4a',
              outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
              audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 128000,
          },
          ios: {
              extension: '.wav',
              audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
              sampleRate: 44100,
              numberOfChannels: 1,
              bitRate: 128000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
          },
      };
        const {canRecord} = await recording.prepareToRecordAsync(recordingSetting);
        setRecordingInstance(recording);
        setCanRecord(canRecord);
      } catch (error) {
        console.log(error)
      }
    }
  });
  
  if (hasCameraPermission === null || hasAVPermission === null ) {
    return <View />;
  }
  if (hasCameraPermission === false) {
    speakSomething("Tidak ada akses ke fitur kamera");
    return <Text>Tidak ada akses ke fitur kamera</Text>;
  }
  if (hasAVPermission === false){
    speakSomething("Tidak ada akses ke fitur perekam suara");
    return <Text>Tidak ada akses ke fitur perekam suara</Text>
  } 
  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} type={type} ref={ref => {
    this.camera = ref;
  }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={tapped} >
          </TouchableOpacity>
      </Camera>
    </View>
  );
}


 /**
  * Function which sends a string to expo speech to text with the predefined configuration.
  * The predefined configuration will ask expo speech to text to speak it in Indonesian.
  * @param {String} somethingToSay The string that will be spoken by expo speech to text.
  */
function speakSomething(somethingToSay){
  Speech.speak(somethingToSay,  {language: 'id', pitch:1});
}

  

