// src/components/candidate/AccountSettings.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import NavBar from '../layout/NavBar';

// Define custom colors directly from HomePage
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

function AccountSettings() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  
  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirmText('');
    setError('');
  };
  
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };
  
  const handleDeleteConfirmChange = (e) => {
    setDeleteConfirmText(e.target.value);
  };
  
  const handleDeleteAccount = async () => {
    // Verify confirmation text
    if (deleteConfirmText !== 'eliminar mi cuenta') {
      return setError('Por favor, escribe "eliminar mi cuenta" para confirmar');
    }
    
    try {
      setDeleteLoading(true);
      setError('');
      
      // Call the API to delete the account
      await candidateService.deleteAccount();
      
      // Log out the user and redirect to home page
      logout();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.response?.data?.message || 'Error al eliminar la cuenta. Por favor, inténtalo de nuevo.');
      setDeleteLoading(false);
    }
  };
  
  return (
    <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
      <NavBar userType="candidate" />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Configuración de la Cuenta</h1>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Account Information Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información de la Cuenta</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre</p>
                <p className="mt-1 text-sm text-gray-900">{currentUser.firstName} {currentUser.lastName}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Correo Electrónico</p>
                <p className="mt-1 text-sm text-gray-900">{currentUser.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de Cuenta</p>
                <p className="mt-1 text-sm text-gray-900">Candidato</p>
              </div>
            </div>
          </div>
          
          {/* Change Password Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Contraseña</h2>
            
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Por razones de seguridad, no puedes ver tu contraseña actual. Puedes restablecer tu contraseña contactando con soporte.
              </p>
              
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => alert('Esta función aún no está implementada')}
              >
                Restablecer Contraseña
              </button>
            </div>
          </div>
          
          {/* Delete Account Section */}
          <div className="p-6 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Eliminar Cuenta</h2>
            
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.
              </p>
              
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                style={{ backgroundColor: '#ef4444' }} // Red color for delete button
                onClick={openDeleteModal}
              >
                Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Eliminar Tu Cuenta
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Esta acción eliminará permanentemente tu cuenta, perfil y todos tus datos. 
                      Esta acción no se puede deshacer. ¿Estás seguro de que quieres continuar?
                    </p>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4" role="alert">
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
              
              <div className="mt-4">
                <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700">
                  Escribe "eliminar mi cuenta" para confirmar:
                </label>
                <input
                  type="text"
                  id="confirm-delete"
                  name="confirm-delete"
                  value={deleteConfirmText}
                  onChange={handleDeleteConfirmChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="eliminar mi cuenta"
                />
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </span>
                  ) : 'Eliminar Cuenta'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={closeDeleteModal}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountSettings;