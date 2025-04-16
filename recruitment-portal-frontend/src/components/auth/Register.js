// src/components/auth/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Define custom colors to match HomePage
const colors = {
  primaryBlue: {
    light: '#2a6d8f',
    dark: '#1a4d6f',
    veryLight: '#e6f0f3'
  },
  primaryTeal: {
    light: '#5fb3a1',
    dark: '#3f9381',
    veryLight: '#eaf5f2'
  },
  primaryOrange: {
    light: '#f5923e',
    dark: '#e67e22',
    veryLight: '#fef2e9'
  }
};

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeTOS: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // Two-step registration form

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    
    // Validate first step
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Por favor, completa todos los campos requeridos.');
      return;
    }
    
    // Clear errors and go to next step
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }

    // Validate terms agreement
    if (!formData.agreeTOS) {
      return setError('Debes aceptar los Términos de Servicio');
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Register the user
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        userType: 'candidate' // Explicitly set the user type
      });
      
      // Redirect to candidate dashboard
      navigate('/candidate/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error en el registro. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: colors.primaryBlue.veryLight }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/">
          <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: colors.primaryBlue.light }}>
            FlowRecruit
          </h2>
        </Link>
        <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">
          Crear una cuenta de candidato
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          O{' '}
          <Link to="/login?type=candidate" className="font-medium hover:text-indigo-500" style={{ color: colors.primaryBlue.light }}>
            inicia sesión en tu cuenta existente
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`rounded-full flex items-center justify-center h-8 w-8 text-white ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200 text-gray-600'}`} style={step >= 1 ? { backgroundColor: colors.primaryBlue.light } : {}}>
                  1
                </div>
                <div className="ml-2 text-sm font-medium text-gray-700">Información Personal</div>
              </div>
              <div className="flex-grow mx-4 h-0.5 bg-gray-200">
                <div className={`h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} style={{ width: step >= 2 ? '100%' : '0%', backgroundColor: step >= 2 ? colors.primaryBlue.light : undefined }}></div>
              </div>
              <div className="flex items-center">
                <div className={`rounded-full flex items-center justify-center h-8 w-8 text-white ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200 text-gray-600'}`} style={step >= 2 ? { backgroundColor: colors.primaryBlue.light } : {}}>
                  2
                </div>
                <div className="ml-2 text-sm font-medium text-gray-700">Configuración de Cuenta</div>
              </div>
            </div>
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
          
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <form onSubmit={handleNext}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Juan"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Apellidos <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Pérez"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo electrónico <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="tu@ejemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Número de teléfono
                  </label>
                  <div className="mt-1">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="+34 (666) 123-456"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Opcional, pero recomendado para programar entrevistas</p>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: colors.primaryBlue.light, borderColor: colors.primaryBlue.light }}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Step 2: Account Security */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Crea una contraseña"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Debe tener al menos 8 caracteres con números y letras
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmar contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Confirma tu contraseña"
                    />
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeTOS"
                      name="agreeTOS"
                      type="checkbox"
                      checked={formData.agreeTOS}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      style={{ color: colors.primaryBlue.light }}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeTOS" className="font-medium text-gray-700">
                      Acepto los <a href="/terms" className="font-medium hover:text-indigo-500" style={{ color: colors.primaryBlue.light }}>Términos de Servicio</a> y la <a href="/privacy" className="font-medium hover:text-indigo-500" style={{ color: colors.primaryBlue.light }}>Política de Privacidad</a> <span className="text-red-500">*</span>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: colors.primaryBlue.light, borderColor: colors.primaryBlue.light }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creando cuenta...
                      </span>
                    ) : 'Crear Cuenta'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">¿Ya tienes una cuenta?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login?type=candidate"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;