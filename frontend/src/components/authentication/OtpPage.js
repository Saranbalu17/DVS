import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import backgroundImage from '../../assets/bees.png';
// import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
 
const OtpPage = () => {
  const [otp, setOtp] = useState(new Array(4).fill(''));
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [error, setError] = useState('');
  const inputRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  // const { login } = useAuth();
 
 
  const { email, userId ,otp:initialOtp,role,password,pwChanged} = location.state || {};
 
 
  //  const userData = JSON.parse(localStorage.getItem("user")) || {};

 
  const getRandomOtp = ()=>{
    return Math.floor(1000+Math.random()*9000).toString();
  }
 
  // Effect to handle resend timer
  useEffect(() => {
    let countDown;
    if (resendTimer > 0) {
      countDown = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countDown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countDown);
  }, [resendTimer]);
 
  const handleResend = ()=>{
  if (resendTimer > 0 || isResending) return;
 
    setIsResending(true);
    setError('');
    setOtp(new Array(4).fill(''));
 
    // Generate new mock OTP
    const newOtp = getRandomOtp();
    console.log(`New Mock OTP for ${email}: ${newOtp}`);
 
    // Update navigation state with new OTP
    navigate(location.pathname, {
      state: { email,userId, otp: newOtp,role,password },
      replace: true,
    });
 
    setResendTimer(30);
    toast.success('New OTP generated. Check console.');
    setIsResending(false);
 
  }
 
  const handleChange = (e, index) => {
    const val = e.target.value;
    if (val && !/^[0-9]/.test(val)) return;
 
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
 
    if (val && index < 3) {
      inputRef.current[index + 1].focus();
    }
    if (newOtp.every((digit) => digit !== '')) {
      handleSubmit(newOtp.join(''));
    }
  };
 
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRef.current[index - 1].focus();
    }
  };
 
  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d{0,4}$/.test(pasteData)) {
      const newOtp = new Array(4).fill('');
      pasteData.split('').forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      const focusIndex = Math.min(pasteData.length, 3);
      inputRef.current[focusIndex].focus();
    }
    e.preventDefault();
  };
 
 
    const handleSubmit = (otpValue) => {
    if (!email || !userId || !initialOtp) {
     
      setError('User details or OTP not found. Please log in again.');
      navigate('/login');
      return;
    }
 
    // Validate OTP against the one in location.state
    if (otpValue === initialOtp) {

      setError('');
      // login({ Id: userId, Email: email,Role:role,Password:password});
      toast.success('OTP verified successfully');
      if(pwChanged === null || pwChanged === 0){
         navigate(`/passwordChange/${userId}`,{
         });
      }else{
 
        navigate(`/home/${userId}`);
      }
    } else {
      setError('Invalid OTP.');
      setOtp(new Array(4).fill(''));
      inputRef.current[0].focus();
      toast.error('Invalid OTP');
    }
  };
 
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-100">
      <div
        className="absolute inset-0 bg-cover bg-center transform scale-x-[-1]"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="relative border border-white shadow bg-transparent p-6 rounded-md flex flex-col gap-3 w-fit text-center items-center justify-center">
        <h1 className="text-xl font-bold text-white">OTP Verification</h1>
        <div className="w-full flex justify-center">
          <img
            className="rounded-full"
            width={100}
            src="https://static.vecteezy.com/system/resources/thumbnails/018/834/464/small_2x/document-verification-user-authentication-success-clipboard-with-a-checkmark-illustration-free-vector.jpg"
            alt="OTP verification"
          />
        </div>
        <p className="text-sm text-white">
          {email}
          <br />
          <span className="text-xs">(Check console for the dummy OTP)</span>
        </p>
        {error && (
          <p className="bg-white p-2 rounded-sm text-red-500 text-sm font-bold">{error}</p>
        )}
        <div className="flex gap-x-10">
          {otp.map((data, i) => (
            <input
              className="border focus:border-2 text-center outline-none border-white rounded-md w-[50px] p-3 text-black"
              key={i}
              value={data}
              maxLength={1}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={i === 0 ? handlePaste : undefined}
              type="text"
              ref={(el) => (inputRef.current[i] = el)}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          ))}
        </div>
        <div className="flex items-center justify-center">
          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-950 focus:outline-none focus:ring-blue-500 focus:ring-offset-2 cursor-pointer flex items-center justify-center"
            onClick={() => handleSubmit(otp.join(''))}
          >
            Verify & Proceed
          </button>
        </div>
        <p className="text-white">
          If you didn't receive a code!{' '}
          <span
            onClick={handleResend}
            className={`${
              resendTimer > 0 || isResending
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-900 cursor-pointer'
            }`}
          >
            {isResending
              ? 'Resending...'
              : resendTimer > 0
              ? `Resend in ${resendTimer}s`
              : 'Resend'}
          </span>
        </p>
      </div>
    </div>
  );
};
 
export default OtpPage;