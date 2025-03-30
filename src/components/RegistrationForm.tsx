import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';

// Form UI interface - what users interact with
interface FormUI {
  fullName: string;
  email: string;
  phone: string;
  year: string;
  branch: string;
  registeredFor: string;
  gender: string;
  isHosteller: string;
  hackerRank: string;
  studentNumber: string;
}

// Backend API interface - the schema expected by the API
interface ApiPayload {
  name: string;
  email: string;
  phone: string;
  year: string;
  branch_name: string;
  registration_type: string;
  gender: string;
  hosteller: string;
  hackerrank: string;
  student_no: string;
  recaptcha_token: string;
}

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  
  // Initialize with empty form values
  const [formData, setFormData] = useState<FormUI>({
    fullName: '',
    email: '',
    phone: '',
    year: '',
    branch: '',
    registeredFor: '',
    gender: '',
    isHosteller: '',
    hackerRank: '',
    studentNumber: '',
  });

  // Get the reCAPTCHA site key from environment variables
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Transform UI form data to API payload format
  const createApiPayload = (): ApiPayload => {
    return {
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      year: formData.year,
      branch_name: formData.branch,
      registration_type: formData.registeredFor,
      gender: formData.gender,
      hosteller: formData.isHosteller,
      hackerrank: formData.hackerRank,
      student_no: formData.studentNumber,
      recaptcha_token: recaptchaToken || '',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recaptchaToken) {
      alert('Please complete the reCAPTCHA verification');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create API payload with the correct field names
      const payload = createApiPayload();
      
      console.log('Sending payload:', payload);
      
      const response = await fetch('https://api.programming-club.tech/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage += ` - ${JSON.stringify(errorData)}`;
        } catch (e) {
          // If it's not valid JSON, use the raw text
          errorMessage += ` - ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      console.log('Registration successful!');
      navigate('/success');
    } catch (error) {
      console.error('Registration error:', error);
      alert(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-purple-600 mb-2 sm:mb-4 animate-pulse">
            INCLUDE 4.0 REGISTRATION
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 italic">Organized by Programming Club, AKGEC</p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="bg-white shadow-2xl rounded-3xl p-6 sm:p-8 md:p-12"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 md:gap-x-12 gap-y-6 md:gap-y-8">
            {/* Form fields with responsive spacing and sizing */}
            {[
              { label: 'Full Name', name: 'fullName', type: 'text', placeholder: 'Enter your full name' },
              { label: 'Email', name: 'email', type: 'email', placeholder: 'your.email@example.com' },
              { label: 'Phone', name: 'phone', type: 'tel', placeholder: 'Enter your phone number' },
              { 
                label: 'Year', 
                name: 'year', 
                type: 'select',
                options: [
                  { value: '', label: 'Select Year' },
                  { value: '1', label: '1st Year' },
                  { value: '2', label: '2nd Year' }
                ]
              },
              {
                label: 'Branch',
                name: 'branch',
                type: 'select',
                options: [
                  { value: '', label: 'Select Branch' },
                  { value: 'CSE', label: 'CSE' },
                  { value: 'CSE(AIML)', label: 'CSE(AIML)' },
                  { value: 'CSE(DS)', label: 'CSE(DS)' },
                  { value: 'IT', label: 'IT' },
                  { value: 'ECE', label: 'ECE' },
                  { value: 'ME', label: 'ME' },
                  { value: 'CE', label: 'CE' }
                ]
              },
              {
                label: 'Registration Type',
                name: 'registeredFor',
                type: 'select',
                options: [
                  { value: '', label: 'Select Option' },
                  { value: 'contest_workshop', label: 'Workshop + Contest (Chargeable)' },
                  { value: 'contest', label: 'Contest Only (Free)' }
                ]
              },
              {
                label: 'Gender',
                name: 'gender',
                type: 'select',
                options: [
                  { value: '', label: 'Select Gender' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' }
                ]
              },
              {
                label: 'Are you a Hosteller?',
                name: 'isHosteller',
                type: 'select',
                options: [
                  { value: '', label: 'Select Option' },
                  { value: 'True', label: 'Yes' },
                  { value: 'False', label: 'No' }
                ]
              },
              { label: 'HackerRank Profile', name: 'hackerRank', type: 'text', placeholder: 'Your HackerRank username' },
              { label: 'Student Number', name: 'studentNumber', type: 'text', placeholder: 'Enter your student number' }
            ].map((field, index) => (
              <div key={index} className="space-y-1.5">
                <label className="block text-base sm:text-lg font-medium text-gray-700">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    required
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-purple-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                    onChange={handleChange}
                  >
                    {field.options?.map((option, optIndex) => (
                      <option key={optIndex} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    required
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-purple-50/50 p-2.5 sm:p-3 text-base sm:text-lg"
                    onChange={handleChange}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
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
                ${isLoading || !recaptchaToken ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors`}
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