import React, {useState} from 'react';
import * as ImagePicker from 'react-native-image-picker';
import {
  SafeAreaView,
  StatusBar,
  Button,
  StyleSheet,
  Image,
  Text,
  View,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';

const API_KEY = '';
const App = () => {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [googleVisionResponse, setGoogleVisionResponse] = useState(null);
  const [rectangles, setRectangles] = useState(null);
  const [lengthOfDetectedObject, setlengthOfDetectedObject] = useState(0);

  const pickImageFromGallery = () =>
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        maxHeight: 200,
        maxWidth: 200,
      },
      (response) => {
        if (!response.didCancel) {
          console.log(response);

          fetchObjectRecognition(response.base64);
          setImage(response.uri);
        }
      },
    );

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'App Camera Permission',
          message: 'App needs access to your camera ',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Camera permission given');
        ImagePicker.launchCamera(
          {
            mediaType: 'photo',
            includeBase64: true,
          },
          (response) => {
            if (!response.didCancel) {
              console.log(response);

              fetchObjectRecognition(response.base64);
              setImage(response.uri);
            }
          },
        );
      } else {
        console.log('Camera permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const fetchObjectRecognition = async (base64) => {
    setLoading(true);
    setGoogleVisionResponse(null);
    setRectangles(null);
    setlengthOfDetectedObject(null);
    setImage(null);
    let googleVisionRes = await fetch(
      'https://vision.googleapis.com/v1/images:annotate?key='.concat(API_KEY),
      {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64,
              },
              features: [
                {type: 'LABEL_DETECTION', maxResults: 13},
                {type: 'OBJECT_LOCALIZATION', maxResults: 5},
                // {type: 'LANDMARK_DETECTION', maxResults: 5},
                // {type: 'FACE_DETECTION', maxResults: 5},
                // {type: 'LOGO_DETECTION', maxResults: 5},
                // {type: 'TEXT_DETECTION', maxResults: 5},
                // {type: 'DOCUMENT_TEXT_DETECTION', maxResults: 5},
                // {type: 'SAFE_SEARCH_DETECTION', maxResults: 5},
                // {type: 'IMAGE_PROPERTIES', maxResults: 5},
                // {type: 'CROP_HINTS', maxResults: 5},
                // {type: 'WEB_DETECTION', maxResults: 5},
              ],
            },
          ],
        }),
      },
    );
    await googleVisionRes
      .json()
      .then((response) => {
        console.log('Gelen Response');
        console.log(response.responses);
        console.log('localizations \n');
        console.log(response?.responses[0]['localizedObjectAnnotations']);
        setLoading(false);
        if (response) {
          parseVisionResponse(response);
          //console.log(parseVisionResponse(response?.responses[0]));
          //setGoogleVisionResponse(response?.responses[0]);
        }
      })
      .catch((error) => {
        console.log(error);
        setGoogleVisionResponse(error);
      });
  };

  const parseVisionResponse = (response) => {
    let objects = [];
    let rectanglesForObject = [];
    const detectedObjects = response?.responses[0]['labelAnnotations'];
    const localizedObjectAnnotations =
      response?.responses[0]['localizedObjectAnnotations'];

    console.log('locallll objeectss');
    console.log(localizedObjectAnnotations);

    //console.log('detected objects');
    detectedObjects.map;
    for (const detectedObject in detectedObjects) {
      //console.log(detectedObjects[detectedObject]);
      objects.push({
        description: detectedObjects[detectedObject]['description'],
        score: detectedObjects[detectedObject]['score'],
      });
    }

    for (const localizedObjectAnnotation in localizedObjectAnnotations) {
      //console.log(detectedObjects[detectedObject]);
      rectanglesForObject.push({
        name: localizedObjectAnnotations[localizedObjectAnnotation]['name'],
        coordinates:
          localizedObjectAnnotations[localizedObjectAnnotation]['boundingPoly'][
            'normalizedVertices'
          ],
      });
    }

    setGoogleVisionResponse(
      rectanglesForObject.map((data) => {
        return (
          <View key={data.name} style={styles.descText}>
            <Text> Detected Object: {data.name} </Text>
          </View>
        );
      }),
    );
    setRectangles(
      rectanglesForObject.map((data) => {
        return (
          <View
            key={data.name}
            style={{
              height:
                Math.abs(data.coordinates[0]['y'] - data.coordinates[3]['y']) *
                  100 +
                '%',
              width:
                Math.abs(data.coordinates[0]['x'] - data.coordinates[1]['x']) *
                  100 +
                '%',
              borderWidth: 2,
              borderColor: 'red',
              position: 'absolute',
              zIndex: 99,
              top: Math.abs(data.coordinates[0].y) * 96 + '%',
              left: Math.abs(data.coordinates[0].x) * 110 + '%',
            }}></View>
        );
      }),
    );

    setlengthOfDetectedObject(rectanglesForObject.length);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Object Recognition</Text>

        <Button
          title="Pick Image From Gallery"
          onPress={pickImageFromGallery}
        />
        <Button
          title="Pick Image From Camera"
          onPress={requestCameraPermission}
        />
        {image && (
          <View style={styles.containerNew}>
            <Image
              source={{uri: image}}
              style={{resizeMode: 'contain', height: 300}}
            />
            {rectangles}
          </View>
        )}
        {loading === true ? <ActivityIndicator size="large" /> : <Text></Text>}
        <Text>{googleVisionResponse}</Text>
        <Text>Detected Objects: {lengthOfDetectedObject}</Text>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    color: 'blue',
    alignSelf: 'center',
  },
  descText: {
    flexDirection: 'column',
    alignItems: 'stretch',
    alignContent: 'center',
    alignSelf: 'center',
    padding: 4,
  },
  title: {
    fontSize: 24,
    padding: 16,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },

  containerNew: {
    backgroundColor: 'black',
    resizeMode: 'contain',
    padding: 8,
    position: 'relative',
  },
  rectangle: {
    height: 128,
    width: 128,
    borderWidth: 1,
    borderColor: 'red',
    position: 'absolute',
    zIndex: 99,
    top: '0%',
    left: '0%',
  },
});

export default App;
