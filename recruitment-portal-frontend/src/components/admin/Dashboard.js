// src/components/admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

function Dashboard() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalCandidates: 0,
    totalAdmins: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersResponse = await adminService.getUsers();
        const usersList = usersResponse.data.users;
        setUsers(usersList);
        
        // Fetch companies
        const companiesResponse = await adminService.getCompanies();
        const companiesList = companiesResponse.data.companies;
        setCompanies(companiesList);
        
        // Calculate stats
        setStats({
          totalUsers: usersList.length,
          totalCompanies: companiesList.length,
          totalCandidates: usersList.filter(user => user.userType === 'candidate').length,
          totalAdmins: usersList.filter(user => user.userType === 'admin').length
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error al cargar datos del dashboard');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: colors.primaryBlue.veryLight }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primaryTeal.light }}></div>
      </div>
    );
  }

  // Sort users and companies to show most recent first
  const sortedUsers = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sortedCompanies = [...companies].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
      <NavBar userType="admin" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6" style={{ color: colors.primaryBlue.dark }}>Panel de Administrador</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Admin Information */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: colors.primaryBlue.dark }}>Administrador</h2>
              <p className="text-gray-600 truncate max-w-xs">{currentUser?.email}</p>
              <p className="mt-2">Bienvenido al panel de administrador, donde puedes gestionar usuarios, empresas y configuración del sistema.</p>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="shadow rounded-lg p-6" style={{ backgroundColor: 'rgba(42, 109, 143, 0.15)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-700 text-sm font-medium">Total Usuarios</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalUsers}</h3>
              </div>
              <div className="p-2 rounded-full bg-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={colors.primaryBlue.light}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="shadow rounded-lg p-6" style={{ backgroundColor: 'rgba(95, 179, 161, 0.15)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-700 text-sm font-medium">Total Empresas</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</h3>
              </div>
              <div className="p-2 rounded-full bg-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={colors.primaryTeal.light}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="shadow rounded-lg p-6" style={{ backgroundColor: 'rgba(245, 146, 62, 0.15)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-700 text-sm font-medium">Total Candidatos</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalCandidates}</h3>
              </div>
              <div className="p-2 rounded-full bg-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={colors.primaryOrange.light}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="shadow rounded-lg p-6" style={{ background: 'linear-gradient(135deg, rgba(42, 109, 143, 0.1) 0%, rgba(95, 179, 161, 0.1) 100%)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-700 text-sm font-medium">Administradores</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalAdmins}</h3>
              </div>
              <div className="p-2 rounded-full bg-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={colors.primaryBlue.dark}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.primaryBlue.dark }}>Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link 
              to="/admin/companies/create"
              className="shadow rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
              style={{ backgroundColor: 'rgba(42, 109, 143, 0.1)', color: colors.primaryBlue.dark }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-medium">Crear Empresa</span>
            </Link>
            <Link 
              to="/admin/users/create-admin"
              className="shadow rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
              style={{ backgroundColor: 'rgba(245, 146, 62, 0.1)', color: colors.primaryOrange.light }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="font-medium">Crear Admin</span>
            </Link>
            <Link 
              to="/admin/users"
              className="shadow rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
              style={{ backgroundColor: 'rgba(95, 179, 161, 0.1)', color: colors.primaryTeal.light }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">Gestionar Usuarios</span>
            </Link>
            <Link 
              to="/admin/companies"
              className="shadow rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
              style={{ backgroundColor: 'rgba(42, 109, 143, 0.1)', color: colors.primaryBlue.dark }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <span className="font-medium">Gestionar Empresas</span>
            </Link>
          </div>
        </div>
        
        {/* Recent Users */}
        <div className="shadow rounded-lg p-6 mb-6" style={{ background: 'linear-gradient(to right, rgba(42, 109, 143, 0.05), rgba(95, 179, 161, 0.05))' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{ color: colors.primaryBlue.dark }}>Usuarios Recientes</h2>
            <Link 
              to="/admin/users"
              className="font-medium hover:underline"
              style={{ color: colors.primaryTeal.light }}
            >
              Ver Todos
            </Link>
          </div>
          
          {sortedUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Acceso
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedUsers.slice(0, 5).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getUserTypeColor(user.userType)}`}>
                          {formatUserType(user.userType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Nunca'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron usuarios</p>
            </div>
          )}
        </div>
        
        {/* Recent Companies */}
        <div className="shadow rounded-lg p-6" style={{ background: 'linear-gradient(to right, rgba(95, 179, 161, 0.05), rgba(245, 146, 62, 0.05))' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{ color: colors.primaryBlue.dark }}>Empresas Recientes</h2>
            <Link 
              to="/admin/companies"
              className="font-medium hover:underline"
              style={{ color: colors.primaryTeal.light }}
            >
              Ver Todas
            </Link>
          </div>
          
          {sortedCompanies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creada
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCompanies.slice(0, 5).map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                            {company.name ? company.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {company.industry || 'No especificada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron empresas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions - updated with the new color scheme
function getUserTypeColor(userType) {
  switch (userType) {
    case 'admin':
      return 'bg-orange-100 text-orange-800';
    case 'company':
      return 'bg-teal-100 text-teal-800';
    case 'candidate':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
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
      return userType.charAt(0).toUpperCase() + userType.slice(1);
  }
}

export default Dashboard;