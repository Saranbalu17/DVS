import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { toast } from "react-toastify";
 
const PasswordChangePopup = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
 
  const navigate = useNavigate();
 
  const userData =  JSON.parse(localStorage.getItem("user"));
 

 
  const handleSubmit = async () => {
    setError("");
    setSuccess("");
 
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
 
    try {
 
      const loginResponse = await fetch(
        "https://localhost:7025/DVS/Digital_Evaluation_Login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grpCode: process.env.REACT_APP_GRPCODE,
            userName: userData.email,
            password: currentPassword,
            flag : "VIEW"
 
          }),
        }
      );
      const data=await loginResponse.json()
 

      if (data.message !== "Successfully login Completed") {
        setError("Current password is incorrect.");
        return;
      }
 
 
       const updateResponse = await fetch(
        "https://localhost:7025/DVS/Digital_Evaluation_Login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grpCode: process.env.REACT_APP_GRPCODE,
            userName: userData.email,
            password: newPassword,
            flag : "OVERWRITE"
          }),
        }
      );
     const responsedata = await updateResponse.json();

 
      if (responsedata.message === "Password Updation Completed") {
        toast.success("Password updated successfully");
        setTimeout(() => navigate(`/home/${userData.id}`), 2000);
      } else {
        setError(updateResponse.data.Message || "Failed to update password.");
      }
    } catch (err) {
      setError(err.response?.data?.Message || "An error occurred while updating the password.");
    }
  };
 
  return (
    <div
      className="absolute inset-0 bg-cover bg-center transform"
      style={{ backgroundImage: `url(${"./cloudbackgroundimage.png"})` }}
    >
      <div className="flex float-end mr-40 items-center h-screen">
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Change Password
          </h2>
 
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
 
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
 
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
 
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
 
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default PasswordChangePopup;