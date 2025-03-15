
// src/components/candidate/Profile.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidateService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import NavBar from '../layout/NavBar';

function Profile() {
  const { currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    skills: '',
    education: [],
    experience: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    current: false
  });
  
  const [newExperience, setNewExperience] = useState({
    company: '',
    position: '',
    description: '',
    startDate: '',
    endDate: '',
    current: false
  });
  
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showExperienceForm, setShowExperienceForm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await candidateService.getProfile();
      const candidate = response.data.candidate;
      
      setProfile(candidate);
      setFormData({
        firstName: candidate.firstName || '',
        lastName: candidate.lastName || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        skills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : '',
        education: Array.isArray(candidate.education) ? candidate.education : [],
        experience: Array.isArray(candidate.experience) ? candidate.experience : []
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load your profile. Please try again later.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleEducationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEducation(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // If current is checked, clear the end date
    if (name === 'current' && checked) {
      setNewEducation(prev => ({
        ...prev,
        endDate: ''
      }));
    }
  };

  const handleExperienceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewExperience(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // If current is checked, clear the end date
    if (name === 'current' && checked) {
      setNewExperience(prev => ({
        ...prev,
        endDate: ''
      }));
    }
  };

  const addEducation = () => {
    // Validate form
    if (!newEducation.institution || !newEducation.degree || !newEducation.startDate) {
      return setError('Please fill in all required fields for education');
    }
    
    const updatedEducation = [...formData.education, { ...newEducation, id: Date.now() }];
    
    setFormData(prev => ({
      ...prev,
      education: updatedEducation
    }));
    
    // Reset form
    setNewEducation({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false
    });
    
    setShowEducationForm(false);
  };

  const removeEducation = (id) => {
    const updatedEducation = formData.education.filter(edu => edu.id !== id);
    setFormData(prev => ({
      ...prev,
      education: updatedEducation
    }));
  };

  const addExperience = () => {
    // Validate form
    if (!newExperience.company || !newExperience.position || !newExperience.startDate) {
      return setError('Please fill in all required fields for experience');
    }
    
    const updatedExperience = [...formData.experience, { ...newExperience, id: Date.now() }];
    
    setFormData(prev => ({
      ...prev,
      experience: updatedExperience
    }));
    
    // Reset form
    setNewExperience({
      company: '',
      position: '',
      description: '',
      startDate: '',
      endDate: '',
      current: false
    });
    
    setShowExperienceForm(false);
  };

  const removeExperience = (id) => {
    const updatedExperience = formData.experience.filter(exp => exp.id !== id);
    setFormData(prev => ({
      ...prev,
      experience: updatedExperience
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Convert skills string to array
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill);
      
      await candidateService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        skills: skillsArray,
        education: formData.education,
        experience: formData.experience
      });
      
      // Update user data in context if needed
      if (currentUser) {
        updateUser({
          firstName: formData.firstName,
          lastName: formData.lastName
        });
      }
      
      setSuccess('Profile updated successfully');
      setSaving(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Error updating profile. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <NavBar userType="candidate" />
        <div className="max-w-3xl mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar userType="candidate" />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-gray-600">Update your information to improve your job matches</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Personal Information</h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                  Skills
                </label>
                <textarea
                  id="skills"
                  name="skills"
                  rows={3}
                  value={formData.skills}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your skills, separated by commas (e.g. JavaScript, React, Node.js)"
                ></textarea>
              </div>
              
              {/* CV Section */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-medium">Resume/CV</h3>
                  <Link
                    to="/candidate/upload-cv"
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    {profile.cvUrl ? 'Update CV' : 'Upload CV'}
                  </Link>
                </div>
                
                {profile.cvUrl ? (
                  <div className="mt-2 flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">
                      CV uploaded. <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">View CV</a>
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    No CV uploaded yet. You need to upload your CV to apply for jobs.
                  </p>
                )}
              </div>
              
              {/* Education Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium">Education</h3>
                  <button
                    type="button"
                    onClick={() => setShowEducationForm(true)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Add Education
                  </button>
                </div>
                
                {showEducationForm && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium mb-3">Add Education</h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                          Institution <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="institution"
                          name="institution"
                          value={newEducation.institution}
                          onChange={handleEducationChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="University name"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="degree" className="block text-sm font-medium text-gray-700">
                            Degree <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="degree"
                            name="degree"
                            value={newEducation.degree}
                            onChange={handleEducationChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Computer Science, Business, etc."
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={newEducation.startDate}
                            onChange={handleEducationChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                            End Date {!newEducation.current && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={newEducation.endDate}
                            onChange={handleEducationChange}
                            disabled={newEducation.current}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="currentEducation"
                          name="current"
                          type="checkbox"
                          checked={newEducation.current}
                          onChange={handleEducationChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="currentEducation" className="ml-2 block text-sm text-gray-700">
                          I am currently studying here
                        </label>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowEducationForm(false)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={addEducation}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.education.length > 0 ? (
                  <div className="space-y-3">
                    {formData.education.map((edu) => (
                      <div key={edu.id} className="border border-gray-200 rounded-md p-3 relative">
                        <button
                          type="button"
                          onClick={() => removeEducation(edu.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <h4 className="text-sm font-medium">{edu.institution}</h4>
                        <p className="text-sm text-gray-600">{`${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No education information added yet.</p>
                )}
              </div>
              
              {/* Experience Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium">Work Experience</h3>
                  <button
                    type="button"
                    onClick={() => setShowExperienceForm(true)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Add Experience
                  </button>
                </div>
                
                {showExperienceForm && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium mb-3">Add Work Experience</h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                          Company <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={newExperience.company}
                          onChange={handleExperienceChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Company name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                          Position <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="position"
                          name="position"
                          value={newExperience.position}
                          onChange={handleExperienceChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Your job title"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={2}
                          value={newExperience.description}
                          onChange={handleExperienceChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Brief description of your responsibilities"
                        ></textarea>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="expStartDate" className="block text-sm font-medium text-gray-700">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            id="expStartDate"
                            name="startDate"
                            value={newExperience.startDate}
                            onChange={handleExperienceChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="expEndDate" className="block text-sm font-medium text-gray-700">
                            End Date {!newExperience.current && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="date"
                            id="expEndDate"
                            name="endDate"
                            value={newExperience.endDate}
                            onChange={handleExperienceChange}
                            disabled={newExperience.current}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="currentExperience"
                          name="current"
                          type="checkbox"
                          checked={newExperience.current}
                          onChange={handleExperienceChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="currentExperience" className="ml-2 block text-sm text-gray-700">
                          I currently work here
                        </label>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowExperienceForm(false)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={addExperience}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.experience.length > 0 ? (
                  <div className="space-y-3">
                    {formData.experience.map((exp) => (
                      <div key={exp.id} className="border border-gray-200 rounded-md p-3 relative">
                        <button
                          type="button"
                          onClick={() => removeExperience(exp.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <h4 className="text-sm font-medium">{exp.position}</h4>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                        {exp.description && (
                          <p className="text-sm text-gray-500 mt-1">{exp.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No work experience added yet.</p>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 text-right">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

export default Profile;