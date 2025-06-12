import React, { useState } from "react";
import { Modal } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
 
const FinishEvaluation = ({ bundleId, onFinish, userId, navigate, studentStatuses, staticStudents }) => {
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
 
  const handleFinishEvaluation = async () => {
    // Log statuses for debugging
    console.log("Student Statuses:", studentStatuses);
    // Check if all students in the bundle are finished or all_corrected
    const allFinished = staticStudents.every(
      (student) => studentStatuses[student.StudId] === "finished" || studentStatuses[student.StudId] === "all_corrected"
    );
    if (!allFinished) {
      alert("Please ensure all scripts in the bundle are corrected before finishing.");
      return;
    }
 
    const success = await onFinish();
    if (success) {
      setIsSuccessModalVisible(true);
      setTimeout(() => {
        setIsSuccessModalVisible(false);
        // localStorage.removeItem("currentUser");
        // localStorage.removeItem(`correctionStates_${userId}`);
        // localStorage.removeItem(`studentStatuses_${userId}`);
        navigate(`/home/${userId}`);
      }, 3000);
    }
  };
 
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <input
          id="terms-checkbox"
          type="checkbox"
          checked={termsAgreed}
          onChange={(e) => setTermsAgreed(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="terms-checkbox" className="text-sm text-gray-700">
          I confirm that all scripts in bundle {bundleId} have been corrected.
        </label>
      </div>
      <button
        id="finish-evaluation"
        className={`p-2 rounded shadow ${
          termsAgreed
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        onClick={handleFinishEvaluation}
        disabled={!termsAgreed}
      >
        Finish Evaluation
      </button>
      {isSuccessModalVisible && (
        <Modal
          open={isSuccessModalVisible}
          footer={null}
          closable={false}
          centered
          bodyStyle={{ textAlign: "center", padding: "24px" }}
        >
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="text-green-500 text-4xl mb-4"
          />
          <p className="text-lg font-semibold">
            Successfully corrected all scripts in bundle {bundleId}!
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Redirecting to home in a few seconds...
          </p>
        </Modal>
      )}
    </div>
  );
};
 
export default FinishEvaluation;