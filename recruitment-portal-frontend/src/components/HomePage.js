// src/components/HomePage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Define custom colors directly
const colors = {
  primaryBlue: {
    light: '#2a6d8f',
    dark: '#1a4d6f',
    veryLight: '#e6f0f3' // Light background shade
  },
  primaryTeal: {
    light: '#5fb3a1',
    dark: '#3f9381',
    veryLight: '#eaf5f2' // Light background shade
  },
  primaryOrange: {
    light: '#f5923e',
    dark: '#e67e22',
    veryLight: '#fef2e9' // Light background shade
  }
};

function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: colors.primaryBlue.veryLight }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: colors.primaryBlue.light }} className="shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-white">Efficiental</span>
              </div>
              
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="#features" className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                  Características
                </a>
                <a href="#portals" className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                  Portales
                </a>
                <a href="#contact" className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                  Contacto
                </a>
              </div>
            </div>
     
            
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-200 hover:bg-gray-700"
              >
                <span className="sr-only">Abrir menú</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="#features"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Características
            </a>
            <a
              href="#portals"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Portales
            </a>
            <a
              href="#contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contacto
            </a>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="flex items-center px-5 space-x-3">
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-teal-600 hover:bg-teal-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Portal Cards Section */}
      <div id="portals" className="py-16" style={{ backgroundColor: colors.primaryBlue.veryLight }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Elige Tu Portal
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-700 mx-auto">
              Tres interfaces personalizadas diseñadas para candidatos, empresas y administradores
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
            {/* Candidate Portal Card */}
            <div className="group rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl bg-white border border-gray-200">
              <div className="p-6 text-white" style={{ backgroundColor: colors.primaryBlue.light }}>
                <h3 className="text-xl font-bold">Portal de Candidatos</h3>
                <p className="mt-2">Encuentra tu trabajo ideal y muestra tus talentos</p>
              </div>
              <div className="p-6">
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryBlue.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Crea y gestiona tu perfil
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryBlue.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Sube tu CV
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryBlue.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Aplica a ofertas de trabajo
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryBlue.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Participa en entrevistas con IA
                  </li>
                </ul>
                <div className="mt-8 space-y-3">
                  <Link 
                    to="/register?type=candidate" 
                    className="w-full block text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white" 
                    style={{ backgroundColor: colors.primaryBlue.light, borderColor: colors.primaryBlue.light }}
                  >
                    Crear Cuenta
                  </Link>
                  <Link 
                    to="/login?type=candidate" 
                    className="w-full block text-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium bg-white" 
                    style={{ borderColor: colors.primaryBlue.light, color: colors.primaryBlue.light }}
                  >
                    Iniciar Sesión
                  </Link>
                </div>
              </div>
            </div>

            {/* Company Portal Card */}
            <div className="group rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl bg-white border border-gray-200">
              <div className="p-6 text-white" style={{ backgroundColor: colors.primaryTeal.light }}>
                <h3 className="text-xl font-bold">Portal de Empresas</h3>
                <p className="mt-2">Encuentra el mejor talento para tu organización</p>
              </div>
              <div className="p-6">
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryTeal.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Gestiona el perfil de la empresa
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryTeal.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Publica y gestiona vacantes
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryTeal.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Configura entrevistas con IA
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryTeal.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Revisa solicitudes de candidatos
                  </li>
                </ul>
                <div className="mt-8 space-y-3">
                  <p className="text-xs text-gray-500 text-center">Las empresas necesitan aprobación de administrador</p>
                  <Link 
                    to="/login?type=company" 
                    className="w-full block text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white" 
                    style={{ backgroundColor: colors.primaryTeal.light, borderColor: colors.primaryTeal.light }}
                  >
                    Iniciar Sesión de Empresa
                  </Link>
                  <Link 
                    to="/contact" 
                    className="w-full block text-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium bg-white" 
                    style={{ borderColor: colors.primaryTeal.light, color: colors.primaryTeal.light }}
                  >
                    Solicitar Acceso
                  </Link>
                </div>
              </div>
            </div>

            {/* Admin Portal Card */}
            <div className="group rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl bg-white border border-gray-200">
              <div className="p-6 text-white" style={{ backgroundColor: colors.primaryOrange.light }}>
                <h3 className="text-xl font-bold">Portal de Administrador</h3>
                <p className="mt-2">Gestiona toda la plataforma de reclutamiento</p>
              </div>
              <div className="p-6">
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryOrange.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Crea y gestiona cuentas de empresas
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryOrange.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Gestiona permisos de usuarios
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryOrange.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Configuración del sistema
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryOrange.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Monitoriza la actividad de la plataforma
                  </li>
                </ul>
                <div className="mt-8 space-y-3">
                  <p className="text-xs text-gray-500 text-center">Solo acceso para administradores</p>
                  <Link 
                    to="/login?type=admin" 
                    className="w-full block text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white" 
                    style={{ backgroundColor: colors.primaryOrange.light, borderColor: colors.primaryOrange.light }}
                  >
                    Iniciar Sesión de Admin
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16" style={{ backgroundColor: colors.primaryTeal.veryLight }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Impulsado por Azure AI
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-700 mx-auto">
              Características innovadoras que transforman el proceso de reclutamiento
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3" style={{ backgroundColor: colors.primaryBlue.light }}>
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Procesamiento de CV</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Azure Form Recognizer extrae y analiza automáticamente información clave de los CV de los candidatos.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3" style={{ backgroundColor: colors.primaryTeal.light }}>
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Entrevistas Automatizadas</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Azure OpenAI genera preguntas dinámicas de entrevista basadas en perfiles de candidatos y requisitos laborales.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3" style={{ backgroundColor: colors.primaryOrange.light }}>
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Análisis de Entrevistas</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Azure Video y Text Analytics evalúan las respuestas de los candidatos, proporcionando información completa.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3" style={{ backgroundColor: colors.primaryBlue.light }}>
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Emparejamiento de Candidatos</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Azure Machine Learning puntúa a los candidatos según los requisitos de la vacante y genera informes de compatibilidad.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3" style={{ backgroundColor: colors.primaryTeal.light }}>
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Generación de Informes</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Power BI crea informes visuales y Azure OpenAI genera resúmenes con recomendaciones.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3" style={{ backgroundColor: colors.primaryOrange.light }}>
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Acceso Seguro</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Los permisos basados en roles para candidatos, empresas y administradores garantizan la seguridad de los datos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16" style={{ background: `linear-gradient(135deg, ${colors.primaryBlue.light} 0%, ${colors.primaryTeal.light} 50%, ${colors.primaryOrange.light} 100%)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            ¿Listo para transformar tu reclutamiento?
          </h2>
          <p className="mt-4 text-xl text-white">
            Comienza con FlowRecruit hoy mismo
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100">
              Comenzar
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-opacity-80">
              Contáctanos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;