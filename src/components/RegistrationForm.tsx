import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';
import { X } from 'lucide-react';

interface FormData {
  name: string;
  branch_name: string;
  student_no: string;
  hackerrank: string;
  phone: string;
  email: string;
  gender: string;
  hosteller: string;
  year: string;
  registration_type: string;
}

interface ToastProps {
  message: string;
  onClose: () => void;
}

// Toast component for displaying errors
const ErrorToast: React.FC<ToastProps> = ({ message, onClose }) => {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-md"
    >
      <div className="flex items-start justify-between">
        <p className="mr-4">{message}</p>
        <button 
          onClick={onClose}
          className="text-white hover:text-red-100"
        >
          <X size={18} />
        </button>
      </div>
    </motion.div>
  );
};

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    branch_name: '',
    student_no: '',
    hackerrank: '',
    phone: '',
    email: '',
    gender: '',
    hosteller: '',
    year: '',
    registration_type: ''
  });

  // Get the reCAPTCHA site key from environment variables
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Reset registration_type when year changes
  useEffect(() => {
    // Clear registration_type when year changes
    if (formData.year === '1') {
      setFormData(prevData => ({
        ...prevData,
        registration_type: 'workshop_contest'
      }));
    } else if (formData.registration_type === '') {
      // If no registration type is selected yet, don't change anything
      return;
    }
  }, [formData.year]);

  const validateForm = () => {
    // Email validation for AKGEC domain
    if (!formData.email.endsWith('@akgec.ac.in')) {
      setError('Please use your AKGEC email address');
      return false;
    }

    // Phone number validation (10 digits)
    if (!/^\d{10}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }

    // Student number validation (7 or 8 digits)
    if (!/^\d{7,8}$/.test(formData.student_no)) {
      setError('Please enter a valid 7 or 8-digit student number');
      return false;
    }

    // HackerRank username validation (no spaces or special characters)
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.hackerrank)) {
      setError('Please enter a valid HackerRank username (no spaces or special characters)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Transform the data to exactly match the API schema
    const apiData = {
      name: formData.name,
      branch_name: formData.branch_name,
      recaptcha_token: recaptchaToken,
      student_no: formData.student_no,
      hackerrank: formData.hackerrank,
      phone: formData.phone,
      email: formData.email,
      gender: formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1).toLowerCase(),
      hosteller: formData.hosteller === 'yes' ? 'True' : 'False',
      year: formData.year,
      registration_type: formData.registration_type === 'workshop_contest' ? 'contest_workshop' : 'contest'
    };

    try {
      setIsLoading(true);
      const response = await fetch('https://api.programming-club.tech/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json().catch(() => ({ message: 'Failed to parse response' }));
      
      if (response.status !== 201) {
        const errorMessage = data.message || data.error || data.detail || 
                            (typeof data === 'string' ? data : 'Registration failed');
        throw new Error(errorMessage);
      }

      console.log('Registration successful:', data);
      navigate('/success');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Format phone number to remove any non-digit characters
    if (name === 'phone') {
      const formattedValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: formattedValue });
      return;
    }

    // Format student number to remove any non-digit characters and limit to 8 digits
    if (name === 'student_no') {
      const formattedValue = value.replace(/\D/g, '').slice(0, 8);
      setFormData({ ...formData, [name]: formattedValue });
      return;
    }

    // Handle year change
    if (name === 'year') {
      // If changing to 1st year, force registration type to workshop_contest
      if (value === '1') {
        setFormData({
          ...formData,
          [name]: value,
          registration_type: 'workshop_contest'
        });
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const closeErrorToast = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      {/* Error Toast */}
      <AnimatePresence>
        {error && <ErrorToast message={error} onClose={closeErrorToast} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-700 mb-2 sm:mb-4 animate-pulse">
            INCLUDE 4.0 REGISTRATION
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 italic">Organized by Programming Club, AKGEC</p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="bg-white shadow-2xl rounded-3xl p-6 sm:p-8 md:p-12 border border-red-200"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 md:gap-x-12 gap-y-6 md:gap-y-8">
            {/* Full Name moved to the top */}
            <div className="space-y-1.5">
              <label className="block text-base sm:text-lg font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-base sm:text-lg font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@akgec.ac.in"
              />
            </div>

            {/* Year field */}
            <div className="space-y-1.5">
              <label className="block text-base sm:text-lg font-medium text-gray-700">
                Year
              </label>
              <select
                name="year"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                value={formData.year}
                onChange={handleChange}
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
              </select>
            </div>

            {/* Registration Type field with conditional options */}
            <div className="space-y-1.5">
              <label className="block text-base sm:text-lg font-medium text-gray-700">
                Registration Type
              </label>
              <select
                name="registration_type"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                value={formData.registration_type}
                onChange={handleChange}
                disabled={formData.year === '1'}
              >
                <option value="">Select Option</option>
                <option value="workshop_contest">Workshop + Contest</option>
                {formData.year === '2' && (
                  <option value="contest">Contest Only (Free)</option>
                )}
              </select>
              {formData.year === '1' && formData.registration_type === 'workshop_contest' && (
                <p className="text-sm text-red-600 mt-1">
                  First-year students can only register for Workshop + Contest
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-base sm:text-lg font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
              />
            </div>

            {/* Branch */}
            <div className="space-y-1.5">
              <label className="block text-base sm:text-lg font-medium text-gray-700">
                Branch
              </label>
              <select
                name="branch_name"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                value={formData.branch_name}
                onChange={handleChange}
              >
                <option value="">Select Branch</option>
                <option value="CSE">CSE</option>
                <option value="CSE (AIML)">CSE (AIML)</option>
                <option value="CSE (Hindi)">CSE (Hindi)</option>
                <option value="CSE (DS)">CSE (DS)</option>
                <option value="CS">CS</option>
                <option value="AIML">AIML</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EE">EE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
              </select>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="block text-base sm:text-lg font-medium text-gray-700">
                Gender
              </label>
              <select
                name="gender"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Hosteller */}
            <div className="space-y-1.5">
              <label className="block text-base sm:text-lg font-medium text-gray-700">
                Are you a Hosteller?
              </label>
              <select
                name="hosteller"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                value={formData.hosteller}
                onChange={handleChange}
              >
                <option value="">Select Option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            {/* HackerRank Profile */}
            <div className="space-y-1.5">
              <label className="block text-base sm:text-lg font-medium text-gray-700">
                HackerRank Profile
              </label>
              <input
                type="text"
                name="hackerrank"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                value={formData.hackerrank}
                onChange={handleChange}
                placeholder="Your HackerRank username"
              />
            </div>

            {/* Student Number */}
            <div className="space-y-1.5">
              <label className="block text-base sm:text-lg font-medium text-gray-700">
                Student Number
              </label>
              <input
                type="text"
                name="student_no"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-red-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                value={formData.student_no}
                onChange={handleChange}
                placeholder="Enter your student number"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-center scale-90 sm:scale-100">
            <ReCAPTCHA
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={handleRecaptchaChange}
            />
          </div>

          <div className="mt-6 sm:mt-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !recaptchaToken}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 border border-transparent rounded-xl shadow-sm text-lg sm:text-xl font-medium text-white 
                ${isLoading || !recaptchaToken ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors`}
            >
              {isLoading ? 'Registering...' : 'Register Now'}
            </motion.button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default RegistrationForm;