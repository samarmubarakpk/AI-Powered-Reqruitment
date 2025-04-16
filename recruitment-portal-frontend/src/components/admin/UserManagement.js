// src/components/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userType, setUserType] = useState('all');
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term and selected user type
    const result = users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = userType === 'all' || user.userType === userType;
      
      return matchesSearch && matchesType;
    });
    
    setFilteredUsers(result);
  }, [searchTerm, userType, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar usuarios. Por favor, inténtalo de nuevo más tarde.');
      setLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      // Log the deletion attempt
      console.log(`Intentando eliminar usuario con ID: ${userToDelete.id}`);
      
      await adminService.deleteUser(userToDelete.id);
      
      // If successful, update the UI
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setFilteredUsers(filteredUsers.filter(user => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError(`Error al eliminar usuario: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Function to get user avatar letter(s)
  const getUserAvatar = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    } else if (user.firstName) {
      return user.firstName.charAt(0);
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    } else {
      return '?';
    }
  };

  // Function to get user's full name
  const getUserFullName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.email) {
      // Extract name from email if no name is provided
      const emailName = user.email.split('@')[0];
      // Try to format as Name.Surname or similar patterns
      const nameParts = emailName.split(/[._-]/);
      if (nameParts.length > 1) {
        return nameParts.map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
      }
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    } else {
      return 'Usuario sin nombre';
    }
  };

  return (
    <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
      <NavBar userType="admin" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: colors.primaryBlue.dark }}>Gestión de Usuarios</h1>
          <Link
            to="/admin/users/create-admin"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            style={{ backgroundColor: colors.primaryOrange.light, borderColor: colors.primaryOrange.light }}
          >
            Crear Administrador
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
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">Buscar</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Buscar por nombre o correo electrónico"
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="userType" className="sr-only">Tipo de Usuario</label>
                <select
                  id="userType"
                  name="userType"
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                >
                  <option value="all">Todos los Tipos</option>
                  <option value="admin">Administrador</option>
                  <option value="company">Empresa</option>
                  <option value="candidate">Candidato</option>
                </select>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: colors.primaryTeal.light }}></div>
              <p className="mt-2 text-gray-500">Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Acceso
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: getUserAvatarColor(user.userType) }}>
                            {getUserAvatar(user)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {getUserFullName(user)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getUserTypeStyles(user.userType)}`}>
                          {formatUserType(user.userType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-600 hover:text-red-900"
                            disabled={user.userType === 'admin' && filteredUsers.filter(u => u.userType === 'admin').length === 1}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No se encontraron usuarios que coincidan con tus criterios.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Eliminar Usuario
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar a {getUserFullName(userToDelete)}? Todos sus datos serán eliminados permanentemente.
                        Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCancelDelete}
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

// Helper functions
function getUserTypeStyles(userType) {
  switch (userType) {
    case 'admin':
      return 'bg-orange-100 text-orange-800';
    case 'company':
      return 'bg-blue-100 text-blue-800';
    case 'candidate':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getUserAvatarColor(userType) {
  switch (userType) {
    case 'admin':
      return '#f5923e'; // Orange
    case 'company':
      return '#2a6d8f'; // Blue
    case 'candidate':
      return '#5fb3a1'; // Teal
    default:
      return '#6B7280'; // Gray
  }
}

function formatUserType(userType) {
  switch (userType) {
    case 'admin':
      return 'Administrador';
    case 'company':
      return 'Empresa';
    case 'candidate':
      return 'Candidato';
    default:
      return 'Desconocido';
  }
}

export default UserManagement;