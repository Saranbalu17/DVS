import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader, Search } from 'lucide-react';
import Select from 'react-select';
// import backgroundImage from '../../assets/blue.png';
import { toast } from 'react-toastify';
 
const Signup = () => {
  const [formData, setFormData] = useState({
    Name: '',
    Email: '',
    Mobile: '',
    panCard: '',
  });
  const [selectedCollegeCode, setSelectedCollegeCode] = useState(null);
  const [manualCollegeCode, setManualCollegeCode] = useState('');
  const [manualCollegeName, setManualCollegeName] = useState('');
  const [collegeCodes, setCollegeCodes] = useState([]);
  const [showCollegeCode, setShowCollegeCode] = useState(true);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const selectRef = useRef(null);
 
  useEffect(() => {
    const fetchCollegeCodes = async () => {
      try {
        const payload = {
          grpCode: "devprod",
          colCode: "0001",
          name: '',
          email: '',
          panCard: '',
          mobileNumber: '',
          flag: 'CollegeCodeList',
        };
        const response = await axios.post(
          'https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/api/Registration/ValuatorRegistration',
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );
      
        setCollegeCodes(response.data.valCodes || []);
      } catch (err) {
        console.error('Error fetching college codes:', err);
        setError('Failed to load college codes. Please enter manually.');
        setCollegeCodes([]);
      }
    };
    fetchCollegeCodes();
  }, []);
 
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };
 
  const handleCollegeCodeChange = (selectedOption) => {
    setSelectedCollegeCode(selectedOption ? selectedOption.value : null);
    setManualCollegeCode('');
    setManualCollegeName('');
    setError('');
  };
 
  const handleManualCollegeCodeChange = (e) => {
    setManualCollegeCode(e.target.value);
    setError('');
  };
 
  const handleManualCollegeNameChange = (e) => {
    setManualCollegeName(e.target.value);
    setError('');
  };
 
  const handleSearchClick = () => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  };
 
  const handleCollegeSubmit = (e) => {
    e.preventDefault();
    if (!selectedCollegeCode) {
      setError('Please select a college code.');
      return;
    }
    if (selectedCollegeCode === 'Other') {
      if (!manualCollegeCode) {
        setError('Please enter a college code.');
        return;
      }
      if (!/^[A-Za-z0-9]{2,}$/.test(manualCollegeCode)) {
        setError('College code must be at least 2 alphanumeric characters.');
        return;
      }
      if (!manualCollegeName) {
        setError('Please enter a college name.');
        return;
      }
      if (!/^[A-Za-z\s]{2,100}$/.test(manualCollegeName)) {
        setError('College name must be 2-100 characters, letters and spaces only.');
        return;
      }
    }
    setShowCollegeCode(false);
    setShowRegistrationForm(true);
    setError('');
  };
 
  const handleBackClick = () => {
    setShowCollegeCode(true);
    setShowRegistrationForm(false);
    setError('');
  };
 
  const validateForm = () => {
    setError('');
    const requiredFields = ['Name', 'Email', 'Mobile', 'panCard'];
 
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`${field.replace(/([A-Z])/g, ' $1').trim()} is required`);
        return false;
      }
    }
 
    if (!/^[A-Za-z\s]{2,50}$/.test(formData.Name)) {
      setError('Name must be between 2-50 characters, letters and spaces only');
      return false;
    }
 
    if (!/^\S+@\S+\.\S+$/.test(formData.Email)) {
      setError('Invalid email format');
      return false;
    }
 
    if (!/^\+?\d{10,15}$/.test(formData.Mobile)) {
      setError('Invalid mobile number format (10-15 digits, optional +)');
      return false;
    }
 
    if (!/^[A-Z0-9]{5,10}$/.test(formData.panCard)) {
      setError('Pan Card must be 5-10 alphanumeric characters');
      return false;
    }
 
    return true;
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
 
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
 
    try {
      const finalCode = selectedCollegeCode === 'Other' ? manualCollegeCode : selectedCollegeCode;
      const selectedCollege = collegeCodes.find(
        (college) => college.valuatorCollegeCode === finalCode
      );
      const collegeName = selectedCollege ? selectedCollege.valuatorCollegeName : manualCollegeName;
 
      const payload = {
        grpCode: "devprod",
        colCode: "0001",
        name: formData.Name,
        email: formData.Email,
        panCard: formData.panCard,
        collegeName: collegeName,
        collegecode: finalCode,
        mobileNumber: formData.Mobile.replace(/^\+/, ''),
        flag: 'UserRegistration',
      };
      
 
      const response = await axios.post(
        'https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/api/Registration/ValuatorRegistration',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
 

 
      if (response.data.message === 'Registered For Approval') {
        setIsSubmitted(true);
        toast.success('Registration submitted. Pending for approval.');
        setTimeout(() => navigate('/login'), 5000);
      } else {
        setError(response.data.message || 'Registration failed. Please try again.');
        toast.error(response.data.message || 'Error in registration');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage =
        err.response?.data?.message ||
        (err.request ? 'No response from server. Please check if the backend is running.' : err.message);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
 
  const collegeOptions = [
    ...(collegeCodes.map((college) => ({
      value: college.valuatorCollegeCode,
      label: `${college.valuatorCollegeCode} - ${college.valuatorCollegeName}`,
    }))),
    { value: 'Other', label: 'Other' },
  ];
 
  const customStyles = {
    control: (provided) => ({
      ...provided,
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '0.5rem',
      boxShadow: 'none',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      '&:hover': { borderColor: '#3b82f6' },
      '&:focus-within': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)',
      },
    }),
    menu: (provided) => ({
      ...provided,
      marginTop: '0.25rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      zIndex: 30,
      backgroundColor: 'white',
      position: 'absolute',
      top: '100%',
      width: '100%',
      left: 0,
      right: 0,
      overflow: 'hidden',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '240px',
      overflowY: 'auto',
      padding: '0.25rem 0',
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      '-ms-overflow-style': 'none',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
        ? '#eff6ff'
        : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'background-color 0.2s ease',
      '&:hover': { backgroundColor: '#eff6ff' },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1f2937',
      fontSize: '0.875rem',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '0.875rem',
    }),
    input: (provided) => ({
      ...provided,
      fontSize: '0.875rem',
      color: '#1f2937',
    }),
  };
 
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 relative">
      <div
        className="absolute inset-0 bg-cover bg-center transform scale-x-[-1]"
        // style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="relative mx-auto max-w-lg w-full z-10 p-6">
        <div className="rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: 'rgb(247, 247, 247)' }}>
          <div className="p-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-gray-800">Sign Up</h2>
              {showRegistrationForm && !isSubmitted && (
                <button
                  onClick={handleBackClick}
                  className="bg-blue-600 text-white py-1 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-6">Create a new faculty account</p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
            {showCollegeCode && (
              <form
                onSubmit={handleCollegeSubmit}
                className={`space-y-4 transition-all duration-300 ease-in-out relative ${isDropdownOpen ? 'pb-72' : 'pb-4'}`}
              >
                <div className="space-y-2">
                  <label htmlFor="CollegeCode" className="block text-sm font-medium text-gray-700">
                    College Code
                  </label>
                  <div className="relative flex items-center">
                    <Select
                      ref={selectRef}
                      id="CollegeCode"
                      options={collegeOptions}
                      value={collegeOptions.find((option) => option.value === selectedCollegeCode) || null}
                      onChange={handleCollegeCodeChange}
                      placeholder="Select a college code"
                      styles={customStyles}
                      isSearchable={true}
                      className="flex-1"
                      required
                      onMenuOpen={() => setIsDropdownOpen(true)}
                      onMenuClose={() => setIsDropdownOpen(false)}
                    />
                    <button
                      type="button"
                      onClick={handleSearchClick}
                      className="ml-2 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      aria-label="Search college codes"
                    >
                      <Search className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
                {selectedCollegeCode === 'Other' && (
                  <div className="space-y-2">
                    <label htmlFor="ManualCollegeCode" className="block text-sm font-medium text-gray-700">
                      Enter College Code
                    </label>
                    <input
                      id="ManualCollegeCode"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={manualCollegeCode}
                      onChange={handleManualCollegeCodeChange}
                      placeholder="Enter college code"
                    />
                    <label htmlFor="ManualCollegeName" className="block text-sm font-medium text-gray-700">
                      Enter College Name
                    </label>
                    <input
                      id="ManualCollegeName"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={manualCollegeName}
                      onChange={handleManualCollegeNameChange}
                      placeholder="Enter college name"
                    />
                  </div>
                )}
                <div className={`flex justify-end transition-all duration-300 ease-in-out ${isDropdownOpen ? 'absolute right-0  bottom-0 ' : 'mt-4'}`}>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </form>
            )}
            {!showCollegeCode && showRegistrationForm && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="Name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    id="Name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={formData.Name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="Email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="Email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={formData.Email}
                    onChange={handleChange}
                    placeholder="Enter email"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="Mobile" className="block text-sm font-medium text-gray-700">
                    Mobile number
                  </label>
                  <input
                    id="Mobile"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={formData.Mobile}
                    onChange={handleChange}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="panCard" className="block text-sm font-medium text-gray-700">
                    Pan Number
                  </label>
                  <input
                    id="panCard"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={formData.panCard}
                    onChange={handleChange}
                    placeholder="Enter Pan Card ID"
                  />
                </div>
                <div className="flex flex-col justify-end mt-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      'Register'
                    )}
                  </button>
                <div className='p-2 flex items-center justify-center'>
                    <Link to="/login" className=" text-blue-600 hover:text-blue-800 font-medium text-sm">
                Already have an account? Log in
              </Link>
                </div>
                </div>
              </form>
            )}
          </div>
          {showRegistrationForm && isSubmitted && (
            <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-sm mb-2">
                Registration request is pending COE-Hub approval. You will be notified upon approval.
              </p>
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                Already have an account? <span className='hover:underline'>Log in</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default Signup;
