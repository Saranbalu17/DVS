import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Verification = () => {
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
const user=JSON.parse(localStorage.getItem("user"))
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
  }, [webcamRef]);

  const handleUpload = async () => {
    if (!image) {
      setMessage("Please capture an image first");
      return;
    }

    setLoading(true);
    try {
      const blob = await fetch(image).then((res) => res.blob());
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
     const formData = new FormData();
    formData.append("image", file);
 
    // Use user.id as OriginatorId
    formData.append("originatorId", user.id);
 
    // Optional: add these only if your API requires them
    formData.append("grpCode", "DEVPROD");
    formData.append("colCode", "0001");
    formData.append("userName", ""); // Or get from context
    formData.append("password", ""); // Avoid hardcoding in production
    formData.append("flag", "Embbedings");
 
    const response = await axios.post("http://localhost:8080/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
 
    console.log("Upload response:", response);
    alert("Image and embeddings uploaded successfully!");
      // setMessage(response.data.message || "Upload successful");
      // if (response.status === 200) navigate("/live-camera");
    } catch (err) {
      setMessage(err.response?.data?.message || "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setImage(null);
    setMessage("");
  };

  return (
    <div className="max-w-5xl mx-auto mt-12 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
        Face Verification
      </h2>

      {/* Webcam & Buttons Side by Side */}
      <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
        <div className="flex flex-col items-center space-y-4 w-full max-w-md">
          {/* Webcam or Captured Image */}
          <div className="w-full border rounded-lg overflow-hidden shadow-md">
            {!image ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-auto object-cover"
              />
            ) : (
              <img
                src={image}
                alt="Captured"
                className="w-full h-auto object-cover"
              />
            )}
          </div>

          {/* Buttons */}
          {!image ? (
            <button
              onClick={capture}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded transition disabled:opacity-50"
            >
              Capture Photo
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleUpload}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded transition disabled:opacity-50"
              >
                {loading ? "Uploading..." : "Upload Image"}
              </button>
              <button
                onClick={handleRetake}
                className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2 rounded transition"
              >
                Retake Photo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructions Below */}
      <div className="mt-10 max-w-3xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">📸 Image Capture Instructions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              svg: (
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4s-3 1.567-3 3.5 1.343 3.5 3 3.5zM6 19v-1a6 6 0 0112 0v1"
                  ></path>
                </svg>
              ),
              text: "Face the camera directly with your entire face visible.",
            },
            {
              svg: (
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12H9m6 0a6 6 0 11-6-6 6 6 0 016 6z"
                  ></path>
                </svg>
              ),
              text: "Remove glasses, hats, or anything blocking your face.",
            },
            {
              svg: (
                <svg
                  className="w-10 h-10 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2m0 14v2m7.071-11.071l-1.414 1.414M6.343 17.657l-1.414 1.414M21 12h-2M5 12H3m15.071 4.071l-1.414-1.414M6.343 6.343L4.93 4.93"
                  ></path>
                </svg>
              ),
              text: "Ensure you're in a well-lit area with no strong shadows.",
            },
            {
              svg: (
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
              ),
              text: "Use a neutral or plain background without distractions.",
            },
            {
              svg: (
                <svg
                  className="w-10 h-10 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01"></path>
                </svg>
              ),
              text: "Keep a neutral facial expression—avoid smiling or frowning.",
            },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              {item.svg}
              <p className="text-sm text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {message && (
        <p className="mt-6 text-center text-sm text-gray-700">{message}</p>
      )}
    </div>
  );
};

export default Verification;
