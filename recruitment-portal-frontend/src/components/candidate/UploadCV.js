import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidateService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import NavBar from '../layout/NavBar';

function UploadCV() {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentCV, setCurrentCV] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await candidateService.getProfile();
        if (response.data.candidate.cvUrl) {
          setCurrentCV(response.data.candidate.cvUrl);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    setSuccess('');
    
    if (!selectedFile) {
      return setFile(null);
    }
    
    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload only PDF files');
      return setFile(null);
    }
    
    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return setFile(null);
    }
    
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      return setError('Please select a file to upload');
    }
    
    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('cv', file);
      
      const response = await candidateService.uploadCV(formData);
      
      setSuccess('CV uploaded successfully!');
      setCurrentCV(response.data.cvUrl);
      setFile(null);
      
      // Reset file input
      document.getElementById('cv-upload').value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading CV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavBar userType="candidate" />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Upload Your CV</h1>
          <p className="text-gray-600 mt-2">Upload your CV in PDF format to apply for jobs</p>
        </div>
        
        {currentCV && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">You already have a CV uploaded. You can view it or replace it with a new one.</p>
                <div className="mt-2">
                  <a href={currentCV} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-green-700 hover:text-green-600">
                    View Current CV
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="cv-upload">
                Select your CV (PDF)
              </label>
              <input
                id="cv-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
              <p className="mt-1 text-xs text-gray-500">PDF files only, max 5MB</p>
            </div>
            
            {file && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB • PDF</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <Link to="/candidate/dashboard" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !file}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading || !file
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : 'Upload CV'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-6 rounded-md bg-gray-50 p-6">
          <h2 className="text-lg font-medium text-gray-900">Tips for an effective CV</h2>
          <ul className="mt-3 text-sm text-gray-600 space-y-2">
            <li>• Keep your CV concise and relevant (1-2 pages)</li>
            <li>• Include your most recent experience and achievements</li>
            <li>• Highlight skills that match your desired positions</li>
            <li>• Proofread carefully for errors</li>
            <li>• Use clear, professional formatting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UploadCV;