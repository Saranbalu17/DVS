import { UserCircleIcon, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const Home = () => {
  const [user, setUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showBundle, setShowBundle] = useState(false);
  const [bundleList, setBundleList] = useState([]);
  const [error, setError] = useState(null);
  const [showShimmer, setShowShimmer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const profileRef = useRef(null);
  const profileIconRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { userId } = useParams();
  const userData = JSON.parse(localStorage.getItem("user")) || {};
  const [url, setUrl] = useState("");

  const requiredFields = [
    "accountNumber",
    "address",
    "bankBranch",
    "bankName",
    "department",
    "designation",
    "ifscCode",
    "mobileNumber",
    "panNumber",
    "qualification",
  ];


  useEffect(() => {
    if (userData.valId === undefined) {
      return;
    }
    const fetchBundles = async () => {
      try {
        const response = await axios.post(
          `${
            process.env.REACT_APP_API_URL || "https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper"
          }/DVS/Digital_Evaluation_ValuatorBundleDetails`,
          {
            GrpCode:  "devprod",
            ColCode:  "0001",
            collegeId:"1",
            ValuatorId: new String(userData.valId),
          }
        );

        setBundleList(response.data.listBundleNo || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching bundle list:", err);
        setError(
          err.response?.data?.message || "Failed to fetch bundle details."
        );
        toast.error(
          err.response?.data?.message || "Failed to fetch bundle details."
        );
      }
    };
    fetchBundles();
  }, [userData.valId]);

  useEffect(() => {
    if (!userData.id) {
      navigate("/login");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axios.post(
          `${
            process.env.REACT_APP_API_URL || "https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper"
          }/DVS/Digital_EValuation_Get_UserDetails`,
          {
            grpCode: "devprod",
            colCode: "0001",
            collegeId: "1",
            email: userData.email,
            flag:  "VIEW",
            OriginatorId: String(userData.id),
          }
        );

        if (response.data.singleAddRegistration) {
          const userProfile = response.data.singleAddRegistration;
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...userData,
              valId: userProfile.valuatorId,
            })
          );
          setUser(userProfile);
          setUpdatedUser(userProfile);
          if (userProfile.imagePath) {
            try {
              console.log(userProfile.valuatorId);
              const imageURL = `https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/DVS/ValuatorPhotos/${userProfile.valuatorId}`;
              await fetch(imageURL);

              console.log(imageURL);
              setImagePreview(imageURL);
            } catch (err) {
              console.error("Error fetching image:", err.message);
              setImagePreview(null);
            }
          }

          const hasEmptyFields = requiredFields.some(
            (field) => !userProfile[field] || userProfile[field].trim() === ""
          );
          if (hasEmptyFields) {
            setShowProfile(true);
            setIsEditing(true);
          }
        } else {
          setError("Failed to fetch user profile.");
          toast.error("Failed to fetch user profile.");
          setUser({
            valuatorName: userData.name,
            email: userData.email,
            originatorId: userData.id,
            type: userData.role,
          });
          setUpdatedUser({
            valuatorName: userData.name,
            email: userData.email,
            originatorId: userData.id,
            type: userData.role,
          });
          setShowProfile(true);
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.message || "Error fetching profile.");
        toast.error(err.response?.data?.message || "Error fetching profile.");
        setUser({
          valuatorName: userData.name,
          email: userData.email,
          originatorId: userData.id,
          type: userData.role,
        });
        setUpdatedUser({
          valuatorName: userData.name,
          email: userData.email,
          originatorId: userData.id,
          type: userData.role,
        });
        setShowProfile(true);
        setIsEditing(true);
      }
    };

    const loadData = async () => {
      await Promise.all([fetchUserProfile()]);
      setIsLoading(false);
      setShowButton(true);
    };

    loadData();

    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        profileIconRef.current &&
        !profileIconRef.current.contains(event.target)
      ) {
        // setShowProfile(false);
        // setIsEditing(false);
        // setSelectedImage(null);
        // setImagePreview(user?.imagePath || null);
        if (
          user.accountNumber === "" ||
          user.address === "" ||
          user.bankBranch === "" ||
          user.bankName === "" ||
          user.department === "" ||
          user.designation === "" ||
          user.email === "" ||
          user.expinYears === "" ||
          user.ifscCode === "" ||
          user.originatorId === "" ||
          user.panNumber === "" ||
          user.qualification === "" ||
          user.valuatorId === "" ||
          user.valuatorName === ""
        ) {
          setShowProfile(true);
          alert("Please Complete the Profile");
          return;
        } else {
          setShowProfile(false);
          setIsEditing(false);
          setSelectedImage(null);
          setImagePreview(user?.imagePath || null);
        }
      }
    };
    // document.addEventListener("mousedown", handleClickOutside);

    // return () => {
    //   window.removeEventListener("resize", checkMobile);
    //   document.removeEventListener("mousedown", handleClickOutside);
    // };
  }, [navigate, userData.id, userId, imagePreview]);

  // const handleImageChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     const validTypes = ["image/jpeg", "image/png", "image/jpg"];
  //     if (!validTypes.includes(file.type)) {
  //       toast.error("Please upload a JPEG, JPG, or PNG image.");
  //       return;
  //     }
  //     if (file.size > 5 * 1024 * 1024) {
  //       toast.error("Image size must be less than 5MB.");
  //       return;
  //     }
  //     setSelectedImage(file);
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setImagePreview(reader.result);
  //       setUpdatedUser((prev) => ({
  //         ...prev,
  //         imagePath: reader.result,
  //       }));
  //     };
  //     reader.readAsDataURL(file);

  //   }
  // };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, JPG, or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    setSelectedImage(file);

    // Generate local preview
    // const reader = new FileReader();
    // reader.onloadend = () => {
    //   setImagePreview(reader.result);
    // };
    // reader.readAsDataURL(file);

    // Upload image to backend
    const formData = new FormData();
    formData.append("file", file);
    formData.append("valId", userData.valId); // Matches backend parameter

    try {
      const uploadResponse = await axios.post(
        "https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/DVS/Digital_Evaluation_UploadPhoto", // Adjust protocol/port
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const imagePath = uploadResponse.data;
      if (imagePath) {
        try {
          
          const imageURL = `https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/ValuatorPhotos/${userData.valId}`;
          await fetch(imageURL);

          setImagePreview(imageURL);
        } catch (err) {
          console.error("Error fetching image:", err.message);
          setImagePreview(null);
        }
      }

      if (!imagePath) {
        throw new Error("Image upload failed: No imagePath returned.");
      }

      // Update state with server image path

      // setImagePreview(imagePath); // Use server path for preview
      toast.success("Image uploaded successfully");
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error(
        err.response?.data?.Message || err.message || "Error uploading image."
      );
      setSelectedImage(null);
      setImagePreview(updatedUser.imagePath || null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };
  const handleShowBundle = () => {
    setShowBundle(!showBundle);
    if (!showBundle) {
      setShowShimmer(true);
      setTimeout(() => setShowShimmer(false), 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const handleUpdateProfile = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);

    const emptyFields = requiredFields.filter(
      (field) => !updatedUser[field] || updatedUser[field].trim() === ""
    );
    if (emptyFields.length > 0) {
      setError(`Please fill in: ${emptyFields.join(", ")}`);
      toast.error(`Please fill in: ${emptyFields.join(", ")}`);
      setIsSaving(false);
      return;
    }

    const validations = [
      {
        field: "designation",
        regex: /^.{0,100}$/,
        message: "Designation must be up to 100 characters.",
      },
      {
        field: "department",
        regex: /^.{0,100}$/,
        message: "Department must be up to 100 characters.",
      },
      {
        field: "mobileNumber",
        regex: /^[0-9]{10}$/,
        message: "Mobile number must be 10 digits.",
      },
      {
        field: "accountNumber",
        regex: /^[0-9]{1,20}$/,
        message: "Account number must be 1-20 digits.",
      },
      {
        field: "address",
        regex: /^.{1,100}$/,
        message: "Address must be 1-100 characters.",
      },
      {
        field: "ifscCode",
        regex: /^[A-Z]{4}0[A-Z0-9]{6}$/,
        message: "IFSC code must be in format ABCD0XXXXXX.",
      },
      {
        field: "bankName",
        regex: /^.{1,100}$/,
        message: "Bank name must be 1-100 characters.",
      },
      {
        field: "bankBranch",
        regex: /^.{1,100}$/,
        message: "Bank branch must be 1-100 characters.",
      },
      {
        field: "qualification",
        regex: /^.{1,100}$/,
        message: "Qualification must be 1-100 characters.",
      },
      {
        field: "expinYears",
        regex: /^[0-9]{0,2}$/,
        message: "Experience must be a number between 0 and 99.",
      },
      {
        field: "panNumber",
        regex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        message: "PAN number must be in format ABCDE1234F.",
      },
    ];

    for (const { field, regex, message } of validations) {
      const value = updatedUser[field] || "";

      if (!regex.test(value)) {
        setError(message);
        toast.error(message);
        setIsSaving(false);
        return;
      }
    }

    try {
      let imagePath = updatedUser.imagePath;
      const payload = {
        grpCode:  "devprod",
        colCode: "0001",
        collegeId: parseInt("1"),
        valuatorId: updatedUser.valuatorId || userData.id,
        valuatorName: updatedUser.valuatorName || userData.name,
        designation: updatedUser.designation || "",
        department: updatedUser.department || "",
        qualification: updatedUser.qualification || "",
        expinYears: updatedUser.expinYears || "",
        mobileNumber: updatedUser.mobileNumber || "",
        email: updatedUser.email || userData.email,
        address: updatedUser.address || "",
        accountNumber: updatedUser.accountNumber || "",
        bankName: updatedUser.bankName || "",
        bankBranch: updatedUser.bankBranch || "",
        ifscCode: updatedUser.ifscCode || "",
        panNumber: updatedUser.panNumber || "",
        ImagePath: url || " ",
        type: updatedUser.type || userData.role,
        flag: "OVERWRITE",
      };
      console.log(payload);
      const response = await axios.post(
        `${
          process.env.REACT_APP_API_URL || "https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper"
        }/DVS/Digital_EValuation_Get_UserDetails`,
        payload
      );

      if (response.data.message?.includes("Record Successfully Updated")) {
        setUser(response.data.singleAddRegistration || updatedUser);
        setIsEditing(false);
        setShowProfile(false);
        toast.success("Profile updated successfully");
        navigate(`/subjects/${userData.id}`);
      } else {
        setError(response.data.message || "Failed to update profile.");
        toast.error(response.data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Error updating profile.");
      toast.error(err.response?.data?.message || "Error updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setUpdatedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileToggle = () => {
    // if (
    //   user.accountNumber === "" ||
    //   user.address === "" ||
    //   user.bankBranch === "" ||
    //   user.bankName === "" ||
    //   user.department === "" ||
    //   user.designation === "" ||
    //   user.email === "" ||
    //   user.expinYears === "" ||
    //   user.ifscCode === "" ||
    //   user.originatorId === "" ||
    //   user.panNumber === "" ||
    //   user.qualification === "" ||
    //   user.valuatorId === "" ||
    //   user.valuatorName === ""
    // ) {
    //   setShowProfile(true);
    //   alert("Please Complete the Profile");
    //   return;
    // } else {
    //   setShowProfile(false);
    //   setIsEditing(false);
    //   setSelectedImage(null);
    //   setImagePreview(user?.imagePath || null);
    // }
    setShowProfile(!showProfile);
    // setIsEditing(!isEditing)
    // setSelectedImage(null);
    // console.log(user.ImagePath)
    // setImagePreview(user?.imagePath || null);
  };

  const handleCloseProfile = () => {
    if (
      user.accountNumber === "" ||
      user.address === "" ||
      user.bankBranch === "" ||
      user.bankName === "" ||
      user.department === "" ||
      user.designation === "" ||
      user.email === "" ||
      user.expinYears === "" ||
      user.ifscCode === "" ||
      user.originatorId === "" ||
      user.panNumber === "" ||
      user.qualification === "" ||
      user.valuatorId === "" ||
      user.valuatorName === ""
    ) {
      setShowProfile(true);
      alert("Please Complete the Profile");
      return;
    } else {
      setShowProfile(false);
      setIsEditing(false);
      setSelectedImage(null);
      //setImagePreview(user?.imagePath || null);
    }
  };

  const profileFields = [
    { label: "Name", name: "valuatorName", type: "text" },
    { label: "Designation", name: "designation", type: "text" },
    { label: "Department", name: "department", type: "text" },
    { label: "Email", name: "email", type: "email" },
    { label: "Mobile No", name: "mobileNumber", type: "text" },
    { label: "Account Number", name: "accountNumber", type: "text" },
    { label: "Address", name: "address", type: "text" },
    { label: "IFSC Code", name: "ifscCode", type: "text" },
    { label: "Bank Name", name: "bankName", type: "text" },
    { label: "Branch Name", name: "bankBranch", type: "text" },
    { label: "PAN Number", name: "panNumber", type: "text" },
    { label: "Qualification", name: "qualification", type: "text" },
    { label: "Experience (Years)", name: "expinYears", type: "number" },
  ];

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  const inputFocusVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  const closeIconVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  if (!userData.id) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-10" />
      )}
      <div
        className={
          showProfile
            ? "relative opacity-60 transition-opacity duration-300"
            : ""
        }
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">
              Evaluator: {user?.valuatorName}
            </h1>
            <div className="flex items-center space-x-4">
              <div
                ref={profileIconRef}
                className="relative z-20"
                onClick={handleProfileToggle}
              >
                <UserCircleIcon className="hover:cursor-pointer w-8 h-8 text-white" />
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 active:bg-red-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-lg w-full shadow flex flex-col p-6">
              {isLoading ? (
                <div className="flex flex-col gap-4">
                  <div className="h-10 w-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-md"></div>
                  <div className="h-10 w-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-md"></div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4">CSE-Bundle</h2>
                  {showButton && (
                    <button
                      className="bg-blue-600 w-fit text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-800 transition-colors"
                      onClick={handleShowBundle}
                    >
                      {showBundle ? "Hide Bundle" : "Show Bundle"}
                    </button>
                  )}
                </>
              )}
            </div>
            {showBundle && (
              <div className="bg-white rounded-lg shadow flex flex-col p-6">
                {showShimmer ? (
                  <>
                    <h2 className="text-3xl text-red-500 text-center pb-4">
                      Bundle Details
                    </h2>
                    <table
                      style={{
                        border: "1px solid gray",
                        borderCollapse: "collapse",
                        width: "100%",
                      }}
                    >
                      <thead>
                        <tr className="bg-gray-200">
                          {[...Array(12)].map((_, index) => (
                            <th
                              key={index}
                              className="p-3"
                              style={{
                                border: "1px solid gray",
                                borderCollapse: "collapse",
                              }}
                            >
                              <div className="h-6 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-md"></div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(4)].map((_, rowIndex) => (
                          <tr key={rowIndex}>
                            {[...Array(12)].map((_, colIndex) => (
                              <td
                                key={colIndex}
                                className="p-3"
                                style={{
                                  border: "1px solid gray",
                                  borderCollapse: "collapse",
                                }}
                              >
                                <div className="h-6 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-md"></div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl text-red-500 text-center pb-4">
                      Bundle Details
                    </h2>
                    {showButton &&
                      (bundleList.length > 0 ? (
                        <table
                          style={{
                            border: "1px solid gray",
                            borderCollapse: "collapse",
                            width: "100%",
                          }}
                        >
                          <thead>
                            <tr className="bg-gray-200 text-gray-700 font-semibold">
                              <th
                                className="p-3 text-center whitespace-nowrap"
                                style={{ border: "1px solid gray" }}
                              >
                                S.NO
                              </th>
                              <th
                                className="p-3 text-center whitespace-nowrap"
                                style={{ border: "1px solid gray" }}
                              >
                                Bundle No
                              </th>
                              <th
                                className="p-3 text-center whitespace-nowrap"
                                style={{ border: "1px solid gray" }}
                              >
                                Role
                              </th>
                              <th
                                className="p-3 text-center whitespace-nowrap"
                                style={{ border: "1px solid gray" }}
                              >
                                Semester
                              </th>
                              {/* <th className="p-3 text-center whitespace-nowrap" style={{ border: "1px solid gray" }}>MonthYear</th> */}
                              <th
                                className="p-3 text-center whitespace-nowrap"
                                style={{ border: "1px solid gray" }}
                              >
                                ExamCode
                              </th>
                              <th
                                className="p-3 text-center whitespace-nowrap"
                                style={{ border: "1px solid gray" }}
                              >
                                Total Scripts
                              </th>
                              <th
                                className="p-3 text-center whitespace-nowrap"
                                style={{ border: "1px solid gray" }}
                              >
                                Scripts Pending
                              </th>
                              <th
                                className="p-3 text-center whitespace-nowrap"
                                style={{ border: "1px solid gray" }}
                              >
                                Scripts Completed
                              </th>
                              <th
                                className="p-3 text-center whitespace-nowrap"
                                style={{ border: "1px solid gray" }}
                              >
                                Valuation StartDate
                              </th>
                              <th
                                className="p-3 text-center whitespace-nowrap"
                                style={{ border: "1px solid gray" }}
                              >
                                Valuation EndDate
                              </th>
                              <th
                                className="p-3 text-center whitespace-nowrap"
                                style={{ border: "1px solid gray" }}
                              >
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {bundleList.map((item, index) => (
                              <tr key={item.SlNo || index}>
                                <td
                                  className="p-3 text-center whitespace-nowrap"
                                  style={{ border: "1px solid gray" }}
                                >
                                  {index + 1}
                                </td>
                                <td
                                  className="p-3 text-center whitespace-nowrap"
                                  style={{ border: "1px solid gray" }}
                                >
                                  <button
                                    className={`border p-2 rounded-md font-bold ${
                                      item.status1 !== "0"
                                        ? "bg-green-100 border-green-500 text-green-600"
                                        : "bg-blue-100 border-blue-500 text-blue-600"
                                    }`}
                                    onClick={() =>
                                      navigate(
                                        `/${userData.id}/bundle-correction`,
                                        {
                                          state: {
                                            bundleId: item.bundlewithPrefix,
                                          },
                                        }
                                      )
                                    }
                                  >
                                    {item.bundlewithPrefix || "N/A"}
                                  </button>
                                </td>
                                <td
                                  className="p-3 text-center whitespace-nowrap"
                                  style={{ border: "1px solid gray" }}
                                >
                                  <button className="border p-2 rounded-md cursor-default">
                                    {item.valuatorRoleName || "N/A"}
                                  </button>
                                </td>
                                <td
                                  className="p-3 text-center whitespace-nowrap"
                                  style={{ border: "1px solid gray" }}
                                >
                                  {item.sem || "N/A"}
                                </td>
                                {/* <td className="p-3 text-center whitespace-nowrap" style={{ border: "1px solid gray" }}>
                                    {item.monthYear || "N/A"}
                                  </td> */}
                                <td
                                  className="p-3 text-center whitespace-nowrap"
                                  style={{ border: "1px solid gray" }}
                                >
                                  {item.examCode || "N/A"}
                                </td>
                                <td
                                  className="p-3 text-center whitespace-nowrap"
                                  style={{ border: "1px solid gray" }}
                                >
                                  {item.totalscripts || "N/A"}
                                </td>
                                <td
                                  className="p-3 text-center whitespace-nowrap"
                                  style={{ border: "1px solid gray" }}
                                >
                                  {item.pending || "N/A"}
                                </td>
                                <td
                                  className="p-3 text-center whitespace-nowrap"
                                  style={{ border: "1px solid gray" }}
                                >
                                  {item.completed || "N/A"}
                                </td>
                                <td
                                  className="p-3 text-center whitespace-nowrap"
                                  style={{ border: "1px solid gray" }}
                                >
                                  {item.startDate || "N/A"}
                                </td>
                                <td
                                  className="p-3 text-center whitespace-nowrap"
                                  style={{ border: "1px solid gray" }}
                                >
                                  {item.endDate || "N/A"}
                                </td>
                                <td
                                  className={`p-3 text-center whitespace-nowrap font-extrabold ${
                                    item.status1 === "0"
                                      ? "text-blue-500"
                                      : "text-green-500"
                                  }`}
                                  style={{
                                    border: "1px solid gray",
                                    cursor: "pointer",
                                  }}
                                >
                                  {item.status || "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-2xl text-red-500 font-bold text-center whitespace-nowrap">
                          No Bundle Assigned
                        </div>
                      ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {showProfile && (
        <div className="fixed inset-0 flex items-center justify-center z-20">
          <motion.div
            ref={profileRef}
            className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 border border-gray-200"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.button
              className="absolute top-4 right-4 text-red-500 hover:text-red-700"
              onClick={handleCloseProfile}
              variants={closeIconVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <X className="w-6 h-6" />
            </motion.button>
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">
              Profile
            </h3>
            <div className="flex justify-center mb-4">
              <img
                src={
                  imagePreview
                    ? imagePreview
                    : "https://www.pngplay.com/wp-content/uploads/12/User-Avatar-Profile-PNG-Pic-Clip-Art-Background.png"
                }
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
              />

              {isEditing && (
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/jpg"
                  className="ml-4 mt-8"
                  aria-label="Upload profile image"
                />
              )}
            </div>
            <hr className="mb-6 border-gray-300" />
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center"
              >
                {error}
              </motion.div>
            )}
            {!isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {profileFields.map((field) => (
                    <motion.div
                      key={field.name}
                      variants={itemVariants}
                      className="bg-white shadow-sm border border-gray-300 rounded-md p-3"
                    >
                      <span className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </span>
                      <span className="block text-base text-gray-900 font-semibold">
                        {user && user[field.name]
                          ? user[field.name]
                          : "Not Provided"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {profileFields.map((field) => (
                  <motion.div
                    key={field.name}
                    variants={itemVariants}
                    className="flex flex-col"
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <motion.input
                      type={field.type}
                      name={field.name}
                      value={updatedUser[field.name] || ""}
                      onChange={handleInputChange}
                      className={`mt-2 p-2 w-full border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all ${
                        field.name === "email" ||
                        field.name === "valuatorName" ||
                        field.name === "panNumber"
                      }`}
                    />
                  </motion.div>
                ))}
              </div>
            )}
            <motion.div
              variants={itemVariants}
              className="mt-6 flex justify-center"
            >
              <motion.button
                className={`relative px-6 py-2 rounded text-white font-medium ${
                  isEditing
                    ? "bg-green-600 hover:bg-green-700 active:bg-green-800"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                } transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed`}
                onClick={isEditing ? handleSaveProfile : handleUpdateProfile}
                disabled={isSaving}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </span>
                ) : isEditing ? (
                  "Save"
                ) : (
                  "Update"
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Home;
