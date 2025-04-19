// src/components/layout/NavBar.js (Updated with Spanish translations and HomePage color scheme)
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function NavBar({ userType }) {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  // Define HomePage color scheme
  const colors = {
    primaryBlue: {
      light: '#2a6d8f',
      dark: '#1a4d6f',
    },
    primaryTeal: {
      light: '#5fb3a1',
      dark: '#3f9381',
    },
    primaryOrange: {
      light: '#f5923e',
      dark: '#e67e22',
    }
  };
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <nav style={{ backgroundColor: colors.primaryBlue.light }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-white font-bold text-xl">
                Efficiental
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {userType === 'candidate' && (
                  <>
                    <Link to="/candidate/dashboard" className={`${isActive('/candidate/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}
                    style={{ backgroundColor: isActive('/candidate/dashboard') ? colors.primaryBlue.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryBlue.dark } }}>
                      Panel
                    </Link>
                    <Link to="/candidate/jobs" className={`${isActive('/candidate/jobs') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}
                    style={{ backgroundColor: isActive('/candidate/jobs') ? colors.primaryBlue.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryBlue.dark } }}>
                      Buscar Empleos
                    </Link>
                    <Link to="/candidate/applications" className={`${isActive('/candidate/applications') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}
                    style={{ backgroundColor: isActive('/candidate/applications') ? colors.primaryBlue.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryBlue.dark } }}>
                      Mis Solicitudes
                    </Link>
                    <Link to="/candidate/profile" className={`${isActive('/candidate/profile') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}
                    style={{ backgroundColor: isActive('/candidate/profile') ? colors.primaryBlue.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryBlue.dark } }}>
                      Perfil
                    </Link>
                  </>
                )}
                
                {userType === 'company' && (
                  <>
                    <Link to="/company/dashboard" className={`${isActive('/company/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}
                    style={{ backgroundColor: isActive('/company/dashboard') ? colors.primaryTeal.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryTeal.dark } }}>
                      Panel
                    </Link>
                    <Link to="/company/vacancies" className={`${isActive('/company/vacancies') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}
                    style={{ backgroundColor: isActive('/company/vacancies') ? colors.primaryTeal.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryTeal.dark } }}>
                      Vacantes
                    </Link>
                    <Link to="/company/candidate-search" className={`
                      ${isActive('/company/candidate-search') ? 'bg-indigo-700 text-white' : 'text-white'} 
                      px-3 py-2 rounded-md text-sm font-medium relative group
                      ${location.pathname === '/company/candidate-search' ? '' : 'hover:bg-indigo-500'}
                    `}
                    style={{ backgroundColor: isActive('/company/candidate-search') ? colors.primaryTeal.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryTeal.dark } }}>
                      <span>Búsqueda de Candidatos </span>
                      {!isActive('/company/candidate-search') && (
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                      )}
                    </Link>
                    <Link to="/company/recommendations" className={`${isActive('/company/recommendations') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}
                    style={{ backgroundColor: isActive('/company/recommendations') ? colors.primaryTeal.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryTeal.dark } }}>
                      Recomendaciones
                    </Link>
                    <Link to="/company/profile" className={`${isActive('/company/profile') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}
                    style={{ backgroundColor: isActive('/company/profile') ? colors.primaryTeal.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryTeal.dark } }}>
                      Perfil de Empresa
                    </Link>
                  </>
                )}
                
                {userType === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className={`${isActive('/admin/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}
                    style={{ backgroundColor: isActive('/admin/dashboard') ? colors.primaryOrange.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryOrange.dark } }}>
                      Panel
                    </Link>
                    <Link to="/admin/users" className={`${isActive('/admin/users') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}
                    style={{ backgroundColor: isActive('/admin/users') ? colors.primaryOrange.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryOrange.dark } }}>
                      Usuarios
                    </Link>
                    <Link to="/admin/companies" className={`${isActive('/admin/companies') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} px-3 py-2 rounded-md text-sm font-medium`}
                    style={{ backgroundColor: isActive('/admin/companies') ? colors.primaryOrange.dark : 'transparent', 
                            hover: { backgroundColor: colors.primaryOrange.dark } }}>
                      Empresas
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
                      style={{ backgroundColor: userType === 'candidate' ? colors.primaryBlue.dark : 
                                            userType === 'company' ? colors.primaryTeal.dark : 
                                            colors.primaryOrange.dark }}
                    >
                      <span className="sr-only">Abrir menú de usuario</span>
                      <span className="h-8 w-8 rounded-full bg-white text-indigo-600 flex items-center justify-center font-medium"
                      style={{ color: userType === 'candidate' ? colors.primaryBlue.light : 
                                    userType === 'company' ? colors.primaryTeal.light : 
                                    colors.primaryOrange.light }}>
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
                        Perfil
                      </Link>
                      <Link 
                        to={`/${userType}/account`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Configuración de Cuenta
                      </Link>
                      <button
                        onClick={() => { logout(); setIsMenuOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link to="/login" className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium">
                    Iniciar Sesión
                  </Link>
                  <Link to="/register" className="bg-white text-indigo-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                  style={{ color: userType === 'candidate' ? colors.primaryBlue.light : 
                                userType === 'company' ? colors.primaryTeal.light : 
                                colors.primaryOrange.light }}>
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-indigo-700 inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-800 focus:ring-white"
              style={{ backgroundColor: userType === 'candidate' ? colors.primaryBlue.dark : 
                                    userType === 'company' ? colors.primaryTeal.dark : 
                                    colors.primaryOrange.dark }}
            >
              <span className="sr-only">Abrir menú principal</span>
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
              <Link to="/candidate/dashboard" className={`${isActive('/candidate/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}
              style={{ backgroundColor: isActive('/candidate/dashboard') ? colors.primaryBlue.dark : 'transparent' }}>
                Panel
              </Link>
              <Link to="/candidate/jobs" className={`${isActive('/candidate/jobs') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}
              style={{ backgroundColor: isActive('/candidate/jobs') ? colors.primaryBlue.dark : 'transparent' }}>
                Buscar Empleos
              </Link>
              <Link to="/candidate/applications" className={`${isActive('/candidate/applications') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}
              style={{ backgroundColor: isActive('/candidate/applications') ? colors.primaryBlue.dark : 'transparent' }}>
                Mis Solicitudes
              </Link>
              <Link to="/candidate/profile" className={`${isActive('/candidate/profile') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}
              style={{ backgroundColor: isActive('/candidate/profile') ? colors.primaryBlue.dark : 'transparent' }}>
                Perfil
              </Link>
            </>
          )}
          
          {userType === 'company' && (
            <>
              <Link to="/company/dashboard" className={`${isActive('/company/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}
              style={{ backgroundColor: isActive('/company/dashboard') ? colors.primaryTeal.dark : 'transparent' }}>
                Panel
              </Link>
              <Link to="/company/vacancies" className={`${isActive('/company/vacancies') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}
              style={{ backgroundColor: isActive('/company/vacancies') ? colors.primaryTeal.dark : 'transparent' }}>
                Vacantes
              </Link>
              <Link to="/company/candidate-search" className={`
                ${isActive('/company/candidate-search') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} 
                block px-3 py-2 rounded-md text-base font-medium relative
              `}
              style={{ backgroundColor: isActive('/company/candidate-search') ? colors.primaryTeal.dark : 'transparent' }}>
                <span>Búsqueda de Candidatos IA</span>
                {!isActive('/company/candidate-search') && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
              </Link>
              <Link to="/company/recommendations" className={`${isActive('/company/recommendations') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}
              style={{ backgroundColor: isActive('/company/recommendations') ? colors.primaryTeal.dark : 'transparent' }}>
                Recomendaciones
              </Link>
              <Link to="/company/profile" className={`${isActive('/company/profile') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}
              style={{ backgroundColor: isActive('/company/profile') ? colors.primaryTeal.dark : 'transparent' }}>
                Perfil de Empresa
              </Link>
            </>
          )}

          {userType === 'company' && (
            <>
              {/* Your existing navigation links */}
              
              {/* Add this new link */}
              <Link
                to="/company/interviews"
                className={`${
                  location.pathname === '/company/interviews'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } px-3 py-2 rounded-md text-sm font-medium`}
                style={{ backgroundColor: isActive('/company/interviews') ? colors.primaryTeal.dark : 'transparent' }}
              >
                Entrevistas
              </Link>
            </>
          )}
          
          {userType === 'admin' && (
            <>
              <Link to="/admin/dashboard" className={`${isActive('/admin/dashboard') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}
              style={{ backgroundColor: isActive('/admin/dashboard') ? colors.primaryOrange.dark : 'transparent' }}>
                Panel
              </Link>
              <Link to="/admin/users" className={`${isActive('/admin/users') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}
              style={{ backgroundColor: isActive('/admin/users') ? colors.primaryOrange.dark : 'transparent' }}>
                Usuarios
              </Link>
              <Link to="/admin/companies" className={`${isActive('/admin/companies') ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500'} block px-3 py-2 rounded-md text-base font-medium`}
              style={{ backgroundColor: isActive('/admin/companies') ? colors.primaryOrange.dark : 'transparent' }}>
                Empresas
              </Link>
            </>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-indigo-700">
          {currentUser ? (
            <>
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <span className="h-10 w-10 rounded-full bg-white text-indigo-600 flex items-center justify-center font-medium"
                  style={{ color: userType === 'candidate' ? colors.primaryBlue.light : 
                                userType === 'company' ? colors.primaryTeal.light : 
                                colors.primaryOrange.light }}>
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
                  style={{ hover: { backgroundColor: userType === 'candidate' ? colors.primaryBlue.dark : 
                                                   userType === 'company' ? colors.primaryTeal.dark : 
                                                   colors.primaryOrange.dark } }}
                >
                  Perfil
                </Link>
                <Link 
                  to={`/${userType}/account`}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                  onClick={() => setIsMenuOpen(false)}
                  style={{ hover: { backgroundColor: userType === 'candidate' ? colors.primaryBlue.dark : 
                                                   userType === 'company' ? colors.primaryTeal.dark : 
                                                   colors.primaryOrange.dark } }}
                >
                  Configuración de Cuenta
                </Link>
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                  style={{ hover: { backgroundColor: userType === 'candidate' ? colors.primaryBlue.dark : 
                                                   userType === 'company' ? colors.primaryTeal.dark : 
                                                   colors.primaryOrange.dark } }}
                >
                  Cerrar Sesión
                </button>
              </div>
            </>
          ) : (
            <div className="px-2 space-y-1">
              <Link 
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                onClick={() => setIsMenuOpen(false)}
                style={{ hover: { backgroundColor: colors.primaryBlue.dark } }}
              >
                Iniciar Sesión
              </Link>
              <Link 
                to="/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                onClick={() => setIsMenuOpen(false)}
                style={{ hover: { backgroundColor: colors.primaryBlue.dark } }}
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;