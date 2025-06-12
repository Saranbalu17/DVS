import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const Proctoring = () => {
  const videoConstraints = {
    facingMode: "user",
  };
  const webCamRef = useRef(null);
  const [image, setImage] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const intervalRef = useRef(null);
  const [embeddings, setEmbeddings] = useState([]);
  const [intruder, setIntruder] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const navigator = useNavigate();
  const user=JSON.parse(localStorage.getItem('user'))
  // Capture frames from webcam
  const captureFrames = useCallback(() => {
    if (webCamRef.current) {
      const imageSrc = webCamRef.current.getScreenshot();
      setImage(imageSrc);
    }
  }, [webCamRef]);

  // Load face-api models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Make sure your models are in the correct location (public/models)
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };

    loadModels();

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Set up interval for frame capture once models are loaded
  useEffect(() => {
    if (modelsLoaded) {
      intervalRef.current = setInterval(() => {
        captureFrames();
      }, 5000);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [modelsLoaded, captureFrames]);

  // Process image for face detection when a new image is captured
  useEffect(() => {
    // if(attempts>=2){
    //   alert('You have exceeded the limit')
    // }
    const handleFaceDetection = async () => {
      if (!image || !modelsLoaded) return;
      try {
        const imgElement = document.getElementById("myImg");

        // Make sure the image is loaded before processing
        if (!imgElement) {
          setTimeout(handleFaceDetection, 100);
          return;
        }
        const detectionOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        });

        const detection = await faceapi
          .detectSingleFace(imgElement, detectionOptions)
          .withFaceLandmarks()
          .withFaceDescriptor(); //detection result

        if (detection) {
          setDetectionResult(detection);

          // Here you would compare the face descriptor with stored embeddings
          // const faceDescriptor = detection.descriptor;
          // compareWithStoredEmbedding(faceDescriptor);
          const faceDescriptor = detection.descriptor; // embeddings frontend
          compareWithStoredEmbedding(faceDescriptor);
          // if(faceTensors){
          //   const embeddings = f
          // }
        } else {
          console.log("No face detected");
          setDetectionResult(null);
        }
      } catch (error) {
        console.error("Face detection error:", error);
      }
    };

    handleFaceDetection();
  }, [image, modelsLoaded]);

  useEffect(() => {
  const getEmbeddings = async () => {
   try {
     if (!modelsLoaded) return;
  const response = await axios.post("http://localhost:8080/get-embeddings", {
    grpCode: "DEVPROD",
    colCode: "0001",
    originatorId: user.id,
    userName: "",
    password: "",
    flag: "GetEmbbedings"
  });
  console.log("RESPONSE:", response.data);
} catch (error) {
  if (error.response) {
    console.error("Server responded with error:", error.response.status);
    console.error("Response body:", error.response.data);
  } else {
    console.error("Network or other error:", error.message);
  }
}

  };
 
  getEmbeddings();
}, [modelsLoaded]);

  function compareWithStoredEmbedding(faceDescriptor) {
    try {
      const result = faceapi.euclideanDistance(faceDescriptor, embeddings);
      const threshold = 0.5;
      if (result > threshold) {
        const imgSrc = webCamRef.current.getScreenshot();
        setIntruder(imgSrc);
        setAttempts(attempts + 1);
        localStorage.setItem("attempts", attempts);
        alert("Face not recognized");
      } else {
        console.log("Face recognized");
        setIntruder(null);
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    const attempts = localStorage.getItem("attempts");
    if (attempts >= 2) {
      navigator("/");
      localStorage.clear();
    }
  }, [captureFrames, intruder]);
  return (
    <div>
      <Webcam
        ref={webCamRef}
        imageSmoothing
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        style={{ width: "100%", maxWidth: "500px" }}
      />

      {image && (
        <img
          src={image}
          alt="Captured frame"
          id="myImg"
          style={{ display: "none" }}
        />
      )}

      <div>
        {!modelsLoaded && <p>Loading face detection models...</p>}
        {detectionResult ? (
          <p>
            Face detected! Confidence:{" "}
            {detectionResult?.detection?.score.toFixed(2)}
          </p>
        ) : (
          <p>No face detected</p>
        )}
      </div>

      {intruder && <img src={intruder} alt="Intruder" />}
    </div>
  );
};

export default Proctoring;
