import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Loader } from "lucide-react";

import { toast } from "react-toastify";
import { useDragControls } from "framer-motion";
 
const Login = () => {
  const [formData, setFormData] = useState({
    Email: "",
    Password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
 
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

 
  const getRandomOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
 
    // Validate required fields
    // if (!formData.Role) {
    //   setError("Role is required");
    //   setIsLoading(false);
    //   return;
    // }
    if (!formData.Email || !formData.Password) {
      setError("Email and Password are required");
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(
        "https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/DVS/Digital_Evaluation_Login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grpCode: process.env.REACT_APP_GRPCODE,
            userName: formData.Email,
            password: formData.Password,
            flag : "VIEW"
          }),
        }
      );
      const data = await response.json();
   
      if (data.message!="Please Enter Valid Credentials") {
        const userDetails = data.singleAddLoginDto;

 
 
    localStorage.setItem("user",JSON.stringify({
      id:userDetails.originatorId,
      email : userDetails.userName,
      // name : userDetails.valuatorName,
 
    }))
        const mockOtp = getRandomOtp();
        console.log(`Random Otp for ${formData.Email} : ${mockOtp}`);
        toast.success("Login successful. check Otp in console.");
        navigate("/otppage",{
            state: {
              email: formData.Email,
              // name: userDetails.valuatorName,
              userId: userDetails.originatorId,
              role:userDetails.userType,
              otp:mockOtp,
              pwChanged: userDetails.pwChanged,
            }})
       
      } else {
        setError(data.message);
        toast.error(data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error during login");
      toast.error("Error during login");
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <div className="flex justify-center items-center min-h-screen  relative">
      <div
        className="absolute inset-0 bg-cover bg-center transform"
        style={{ backgroundImage: `url(${"./cloudbackgroundimage.png"})` }}
      />
      <div className="relative mx-auto max-w-sm w-full z-10 lg:mr-48 md:mr-32 sm:mr-0">
        <div className="border bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 space-y-1">
            <h2 className="text-2xl font-bold text-gray-600">Login</h2>
            <p className="text-sm text-gray-400">
              Enter your userName, and password to login to your account
            </p>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
             
              <div className="space-y-2">
                <label
                  htmlFor="userName"
                  className="block text-sm font-medium text-gray-600"
                >
                  UserName
                </label>
                <input
                  id="Email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  className="w-full outline-none px-3 py-2 border text-black border-gray-300 rounded-md"
                  value={formData.Email}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="Password"
                  className="block text-sm font-medium text-gray-600"
                >
                  Password
                </label>
                <input
                  id="Password"
                  type="password"
                  required
                  className="w-full outline-none px-3 py-2 border text-black  border-gray-300 rounded-md"
                  value={formData.Password}
                  onChange={handleChange}
                />
              </div>
              <button
                type="submit"
                className="w-full duration-75 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader className="w-6 h-6 animate-ping text-black" />
                ) : (
                  "Login"
                )}
              </button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-sm text-black">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:text-blue-950 hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default Login;
