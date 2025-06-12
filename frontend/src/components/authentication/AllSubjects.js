import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { ArrowLeft, BookOpen, CheckSquare, Loader2, Search, X } from "lucide-react";
 
const SubjectSelection = () => {
  const [subjects, setSubjects] = useState([]);
  const [savedSubjects, setSavedSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userData, setUserData] = useState(null);
 
  const navigate = useNavigate();
 
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user")) || {};

    if (!storedUser.id || !storedUser.valId) {
      navigate("/login");
    } else {
      setUserData(storedUser);
    }
  }, [navigate]);
 
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch(
          "https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/DVS/Digital_Evaluation_SubjectSelection",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              grpCode: "DEVPROD",
              colCode: "0001",
              courseCode: "",
              ValId: userData.valId,
              flag: "0",
            }),
          }
        );
        const data = await response.json();
 
        
        if (response.ok && Array.isArray(data.subjectListDisplay)) {
          setSubjects(data.subjectListDisplay);
        } else {
          throw new Error(data.message || "Failed to load available subjects.");
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      }
    };
 
    if (userData?.valId) {
      fetchSubjects();
    }
  }, [userData]);
 
  useEffect(() => {
    const fetchSavedSubjects = async () => {
      try {
        const response = await fetch(
          "https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/DVS/Digital_Evaluation_SubjectSelection",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              grpCode: "DEVPROD",
              colCode: "0001",
              courseCode: "",
              ValId: userData.ValId,
              flag: "2",
            }),
          }
        );
        const data = await response.json();
        console.log(data)
        if (response.ok && Array.isArray(data.subjectListDisplay)) {
          setSavedSubjects(data.subjectListDisplay);
          setSelectedSubjects(data.subjectListDisplay.map((s) => s.courseCode));
        } else {
          throw new Error(data.message || "Failed to load saved subjects.");
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      }
    };
 
    if (userData?.valId) {
      fetchSavedSubjects();
    }
  }, [userData]);
 
  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const search = searchQuery.toLowerCase();
      return (
        subject.courseName.toLowerCase().includes(search) ||
        subject.courseCode.toLowerCase().includes(search)
      );
    });
  }, [subjects, searchQuery]);
 
  const handleCheckboxChange = (courseCode) => {
    setSelectedSubjects((prev) =>
      prev.includes(courseCode)
        ? prev.filter((code) => code !== courseCode)
        : [...prev, courseCode]
    );
  };
 
  const handleRemoveSubject = async (courseCode) => {
    setError(null);
    try{
    const response = await fetch(
      "https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/DVS/Digital_Evaluation_SubjectSelection",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grpCode: "DEVPROD",
          colCode: "0001",
          courseCode: `'${courseCode}'`,
          ValId: userData.ValId,
          flag: "3",
        }),
      }
    );
 
    const data = await response.json();

    
   if (response.ok) {
        toast.success("Subject removed successfully!");
        // Update saved subjects and selected subjects
        setSavedSubjects((prev) =>
          prev.filter((subject) => subject.courseCode !== courseCode)
        );
        setSelectedSubjects((prev) =>
          prev.filter((code) => code !== courseCode)
        );
      } else {
        throw new Error(data.message || "Failed to remove subject.");
      }
    } catch(err) {
      setError(err.message);
      toast.error(err.message);
    }
  };
 
  const handleBack = ()=>{
    navigate(`/home/${userData.id}`)
  }
 
 
  const handleSave = async () => {
    if (selectedSubjects.length === 0) {
      setError("Please select at least one subject.");
      toast.error("Please select at least one subject.");
      return;
    }
 
    setIsSaving(true);
    setError(null);
 
    try {
      const courseCodeString = selectedSubjects
        .map((code) => `'${code}'`)
        .join(",");
      
        
      const response = await fetch(
        "https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/DVS/Digital_Evaluation_SubjectSelection",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grpCode: "DEVPROD",
            colCode: "0001",
            ValId: userData.ValId,
            courseCode: courseCodeString,
            flag: "1",
          }),
        }
      );
 
      const data = await response.json();
   
      
      if (response.ok && data.message?.includes("successfully")) {
        toast.success("Subjects saved successfully!");
 
        // Refresh saved subjects
        const savedResponse = await fetch(
          "https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/DVS/Digital_Evaluation_SubjectSelection",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              grpCode: "DEVPROD",
              colCode: "0001",
              courseCode: "",
              ValId: userData.ValId,
              flag: "2",
            }),
          }
        );
 
        const savedData = await savedResponse.json();
        if (savedResponse.ok && Array.isArray(savedData.subjectListDisplay)) {
          setSavedSubjects(savedData.subjectListDisplay);
          setSelectedSubjects(
            savedData.subjectListDisplay.map((s) => s.courseCode)
          );
        } else {
          throw new Error(
            savedData.message || "Failed to load saved subjects."
          );
        }
      } else {
        throw new Error(data.message || "Failed to save subjects.");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };
 
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 },
    },
  };
 
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };
 
  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };
 
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-700 to-indigo-700 shadow-xl z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
<div className="flex items-center">
            <motion.button
              onClick={handleBack}
              className="text-white hover:bg-blue-800 p-2 rounded-full transition-colors duration-200"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              aria-label="Go back to home"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <BookOpen className="w-8 h-8 text-white ml-3 mr-3" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Subject Selection
            </h1>
          </div>
        </div>
       
      </div>
 
      <div className="flex-1 mt-16 max-w-7xl mx-auto w-full px-6 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm font-medium"
          >
            {error}
          </motion.div>
        )}
 
        <div className="flex flex-col lg:flex-row gap-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="bg-white rounded-xl shadow-lg p-6 flex-1 flex flex-col min-h-[400px]"
          >
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by course name or code"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
                />
              </div>
            </div>
 
            <div className="flex-1 overflow-y-auto max-h-[400px] pr-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 sticky top-0 bg-white z-10">
                Available Subjects
              </h2>
              {filteredSubjects.length === 0 ? (
                <p className="text-gray-500 text-center text-sm py-4">
                  {searchQuery
                    ? "No subjects match your search."
                    : "No subjects available."}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredSubjects.map((subject) => (
                    <motion.div
                      key={subject.courseCode}
                      variants={itemVariants}
                      className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-200 hover:shadow-md"
                    >
                      <input
                        type="checkbox"
                        id={subject.courseCode}
                        checked={selectedSubjects.includes(subject.courseCode)}
                        onChange={() =>
                          handleCheckboxChange(subject.courseCode)
                        }
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 border-gray-300 cursor-pointer"
                        aria-label={`Select ${subject.courseName}`}
                      />
                      <label
                        htmlFor={subject.courseCode}
                        className="flex-1 cursor-pointer ml-4"
                      >
                        <span className="font-medium text-gray-900 text-sm">
                          {subject.courseName}
                        </span>
                        {/* <span className="text-xs text-gray-500 block mt-1">
                          Code: {subject.courseCode}
                        </span> */}
                      </label>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
 
            <motion.div
              variants={itemVariants}
              className="mt-6 flex justify-end pt-4 border-t border-gray-200"
            >
              <motion.button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-all duration-200 shadow-md ${
                  isSaving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                }`}
                variants={buttonVariants}
                whileHover={!isSaving ? "hover" : ""}
                whileTap={!isSaving ? "tap" : ""}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-5 h-5 mr-2" />
                    Save Selection
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
 
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="bg-white rounded-xl shadow-lg p-6 flex-1 flex flex-col min-h-[400px]"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 sticky top-0 bg-white z-10">
              Saved Subjects
            </h2>
 
            <div className="flex-1 overflow-y-auto max-h-[400px] pr-2">
              {savedSubjects.length === 0 ? (
                <p className="text-gray-500 text-center text-sm py-4">
                  No subjects saved.
                </p>
              ) : (
                <div className="space-y-3">
                  {savedSubjects.map((subject) => (
                    <motion.div
                      key={subject.courseCode}
                      variants={itemVariants}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors duration-200"
                    >
                      <div>
                        <span className="font-medium text-blue-900 text-sm">
                          {subject.courseName}
                        </span>
                        {/* <span className="text-xs text-blue-600 block mt-1">
                          Code: {subject.courseCode}
                        </span> */}
                      </div>
                      <button
                        onClick={() => handleRemoveSubject(subject.courseCode)}
                        className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                        aria-label={`Remove ${subject.courseName}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
 
export default SubjectSelection;
