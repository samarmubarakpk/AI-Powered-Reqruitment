// src/components/admin/CreateCompany.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import NavBar from '../layout/NavBar';

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

function CreateCompany() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    password: '',
    confirmPassword: '',
    industry: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.companyName || !formData.companyEmail || !formData.password) {
      return setError('Por favor, completa todos los campos requeridos');
    }
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.companyEmail)) {
      return setError('Por favor, introduce una dirección de correo electrónico válida');
    }
    
    try {
      setLoading(true);
      setError('');
      
      await adminService.createCompany({
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        password: formData.password,
        industry: formData.industry,
        description: formData.description
      });
      
      // Redirect to companies list
      navigate('/admin/companies');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear cuenta de empresa');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
      <NavBar userType="admin" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: colors.primaryBlue.dark }}>Crear Cuenta de Empresa</h1>
          <Link
            to="/admin/companies"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            Volver a Empresas
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Nombre de la Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                  placeholder="Nombre de la empresa"
                />
              </div>
              
              <div>
                <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="companyEmail"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                  placeholder="correo@empresa.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                  placeholder="Contraseña segura"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Mínimo 8 caracteres con letras y números
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                  placeholder="Repite la contraseña"
                />
              </div>
              
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Industria
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Selecciona una industria</option>
                  <option value="Technology">Tecnología</option>
                  <option value="Healthcare">Salud</option>
                  <option value="Finance">Finanzas</option>
                  <option value="Education">Educación</option>
                  <option value="Retail">Comercio</option>
                  <option value="Manufacturing">Manufactura</option>
                  <option value="Consulting">Consultoría</option>
                  <option value="Entertainment">Entretenimiento</option>
                  <option value="Other">Otra</option>
                </select>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción de la Empresa
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Breve descripción de la empresa"
                ></textarea>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Link
                to="/admin/companies"
                className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: colors.primaryTeal.light, borderColor: colors.primaryTeal.light }}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando...
                  </span>
                ) : 'Crear Empresa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateCompany;