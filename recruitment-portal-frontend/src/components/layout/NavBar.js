// src/components/layout/NavBar.js (Updated with Enhanced Search highlight)
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function NavBar({ userType }) {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="bg-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-white font-bold text-xl">
                Recruitment Portal
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {userType === 'candidate' && (
                  <>
                    <Link to="/candidate/dashboard" className={`${isActive('/candidate/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}>
                      Dashboard
                    </Link>
                    <Link to="/candidate/jobs" className={`${isActive('/candidate/jobs') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}>
                      Find Jobs
                    </Link>
                    <Link to="/candidate/applications" className={`${isActive('/candidate/applications') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}>
                      My Applications
                    </Link>
                    <Link to="/candidate/profile" className={`${isActive('/candidate/profile') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}>
                      Profile
                    </Link>
                  </>
                )}
                
                {userType === 'company' && (
                  <>
                    <Link to="/company/dashboard" className={`${isActive('/company/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}>
                      Dashboard
                    </Link>
                    <Link to="/company/vacancies" className={`${isActive('/company/vacancies') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}>
                      Vacancies
                    </Link>
                    <Link to="/company/candidate-search" className={`
                      ${isActive('/company/candidate-search') ? 'bg-indigo-700 text-white' : 'text-white'} 
                      px-3 py-2 rounded-md text-sm font-medium relative group
                      ${location.pathname === '/company/candidate-search' ? '' : 'hover:bg-indigo-500'}
                    `}>
                      <span>AI Candidate Search</span>
                      {!isActive('/company/candidate-search') && (
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                      )}
                    </Link>
                    <Link to="/company/recommendations" className={`${isActive('/company/recommendations') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}>
                      Recommendations
                    </Link>
                    <Link to="/company/profile" className={`${isActive('/company/profile') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}>
                      Company Profile
                    </Link>
                  </>
                )}
                
                {userType === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className={`${isActive('/admin/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}>
                      Dashboard
                    </Link>
                    <Link to="/admin/users" className={`${isActive('/admin/users') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}>
                      Users
                    </Link>
                    <Link to="/admin/companies" className={`${isActive('/admin/companies') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}>
                      Companies
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {currentUser ? (
                <div className="relative ml-3">
                  <div>
                    <button
                      type="button"
                      className="max-w-xs bg-indigo-700 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-800 focus:ring-white"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                      <span className="sr-only">Open user menu</span>
                      <span className="h-8 w-8 rounded-full bg-white text-indigo-600 flex items-center justify-center font-medium">
                        {currentUser.firstName ? currentUser.firstName.charAt(0) : 'U'}
                      </span>
                    </button>
                  </div>
                  {isMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        <p className="font-medium">{currentUser.firstName} {currentUser.lastName}</p>
                        <p className="text-gray-500">{currentUser.email}</p>
                      </div>
                      <Link 
                        to={`/${userType}/profile`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => { logout(); setIsMenuOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link to="/login" className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium">
                    Login
                  </Link>
                  <Link to="/register" className="bg-white text-indigo-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-indigo-700 inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-800 focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {userType === 'candidate' && (
            <>
              <Link to="/candidate/dashboard" className={`${isActive('/candidate/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}>
                Dashboard
              </Link>
              <Link to="/candidate/jobs" className={`${isActive('/candidate/jobs') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}>
                Find Jobs
              </Link>
              <Link to="/candidate/applications" className={`${isActive('/candidate/applications') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}>
                My Applications
              </Link>
              <Link to="/candidate/profile" className={`${isActive('/candidate/profile') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}>
                Profile
              </Link>
            </>
          )}
          
          {userType === 'company' && (
            <>
              <Link to="/company/dashboard" className={`${isActive('/company/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}>
                Dashboard
              </Link>
              <Link to="/company/vacancies" className={`${isActive('/company/vacancies') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}>
                Vacancies
              </Link>
              <Link to="/company/candidate-search" className={`
                ${isActive('/company/candidate-search') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} 
                block px-3 py-2 rounded-md text-base font-medium relative
              `}>
                <span>AI Candidate Search</span>
                {!isActive('/company/candidate-search') && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
              </Link>
              <Link to="/company/recommendations" className={`${isActive('/company/recommendations') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}>
                Recommendations
              </Link>
              <Link to="/company/profile" className={`${isActive('/company/profile') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}>
                Company Profile
              </Link>
            </>
          )}
          
          {userType === 'admin' && (
            <>
              <Link to="/admin/dashboard" className={`${isActive('/admin/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}>
                Dashboard
              </Link>
              <Link to="/admin/users" className={`${isActive('/admin/users') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}>
                Users
              </Link>
              <Link to="/admin/companies" className={`${isActive('/admin/companies') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}>
                Companies
              </Link>
            </>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-indigo-700">
          {currentUser ? (
            <>
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <span className="h-10 w-10 rounded-full bg-white text-indigo-600 flex items-center justify-center font-medium">
                    {currentUser.firstName ? currentUser.firstName.charAt(0) : 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{currentUser.firstName} {currentUser.lastName}</div>
                  <div className="text-sm font-medium text-indigo-300">{currentUser.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link 
                  to={`/${userType}/profile`}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="px-2 space-y-1">
              <Link 
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;