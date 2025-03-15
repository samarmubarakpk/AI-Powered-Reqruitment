// src/components/company/EditVacancy.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';

function EditVacancy() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    experienceRequired: '',
    closingDate: '',
    status: 'open'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Load vacancy data
  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        setLoading(true);
        const response = await companyService.getVacancy(id);
        const vacancy = response.data.vacancy;
        
        // Format skills as comma-separated string
        const skillsString = Array.isArray(vacancy.requiredSkills) 
          ? vacancy.requiredSkills.join(', ') 
          : '';
        
        // Format date for input field
        let closingDateFormatted = '';
        if (vacancy.closingDate) {
          const date = new Date(vacancy.closingDate);
          closingDateFormatted = date.toISOString().split('T')[0];
        }
        
        setFormData({
          title: vacancy.title || '',
          description: vacancy.description || '',
          requiredSkills: skillsString,
          experienceRequired: vacancy.experienceRequired?.toString() || '',
          closingDate: closingDateFormatted,
          status: vacancy.status || 'open'
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching vacancy:', err);
        setError('Failed to load vacancy data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchVacancy();
  }, [id]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title || !formData.description) {
      return setError('Please fill in all required fields');
    }
    
    try {
      setSaving(true);
      setError('');
      
      // Format skills as array
      const skills = formData.requiredSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      await companyService.updateVacancy(id, {
        title: formData.title,
        description: formData.description,
        requiredSkills: skills,
        experienceRequired: parseInt(formData.experienceRequired) || 0,
        closingDate: formData.closingDate || null,
        status: formData.status
      });
      
      // Redirect to vacancies list
      navigate('/company/vacancies');
    } catch (err) {
      console.error('Error updating vacancy:', err);
      setError(err.response?.data?.message || 'Error updating vacancy. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div>
        <NavBar userType="company" />
        <div className="max-w-3xl mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <NavBar userType="company" />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Vacancy</h1>
          <Link
            to="/company/vacancies"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            Cancel
          </Link>
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
        
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Job Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
              
              {/* Job Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  required
                ></textarea>
              </div>
              
              {/* Required Skills */}
              <div>
                <label htmlFor="requiredSkills" className="block text-sm font-medium text-gray-700">
                  Required Skills
                </label>
                <input
                  type="text"
                  id="requiredSkills"
                  name="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g. JavaScript, React, Node.js"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Comma-separated list of skills required for this position.
                </p>
              </div>
              
              {/* Years of Experience */}
              <div>
                <label htmlFor="experienceRequired" className="block text-sm font-medium text-gray-700">
                  Years of Experience Required
                </label>
                <input
                  type="number"
                  id="experienceRequired"
                  name="experienceRequired"
                  min="0"
                  max="20"
                  value={formData.experienceRequired}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              {/* Closing Date */}
              <div>
                <label htmlFor="closingDate" className="block text-sm font-medium text-gray-700">
                  Application Deadline
                </label>
                <input
                  type="date"
                  id="closingDate"
                  name="closingDate"
                  value={formData.closingDate}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave blank if there is no deadline.
                </p>
              </div>
              
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="open">Active</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Link
                to="/company/vacancies"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditVacancy;