// src/components/admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/api';
import NavBar from '../layout/NavBar';

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
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500" style={{ borderColor: '#5fb3a1' }}></div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f9fafb' }}>
      <NavBar userType="admin" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#2a6d8f' }}>Admin Dashboard</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Admin Information */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#2a6d8f' }}>Administrator</h2>
              <p className="text-gray-600">{currentUser?.email}</p>
              <p className="mt-2">Welcome to the admin dashboard, where you can manage users, companies, and system settings.</p>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="shadow rounded-lg p-6" style={{ backgroundColor: 'rgba(42, 109, 143, 0.15)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-700 text-sm font-medium">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalUsers}</h3>
              </div>
              <div className="p-2 rounded-full bg-white">
                {/* Icon would go here */}
              </div>
            </div>
          </div>
          
          <div className="shadow rounded-lg p-6" style={{ backgroundColor: 'rgba(95, 179, 161, 0.15)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-700 text-sm font-medium">Total Companies</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</h3>
              </div>
              <div className="p-2 rounded-full bg-white">
                {/* Icon would go here */}
              </div>
            </div>
          </div>
          
          <div className="shadow rounded-lg p-6" style={{ backgroundColor: 'rgba(245, 146, 62, 0.15)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-700 text-sm font-medium">Total Candidates</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalCandidates}</h3>
              </div>
              <div className="p-2 rounded-full bg-white">
                {/* Icon would go here */}
              </div>
            </div>
          </div>
          
          <div className="shadow rounded-lg p-6" style={{ background: 'linear-gradient(135deg, rgba(42, 109, 143, 0.1) 0%, rgba(95, 179, 161, 0.1) 100%)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-700 text-sm font-medium">Admin Users</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalAdmins}</h3>
              </div>
              <div className="p-2 rounded-full bg-white">
                {/* Icon would go here */}
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#2a6d8f' }}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link 
              to="/admin/companies/create"
              className="shadow rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
              style={{ backgroundColor: 'rgba(42, 109, 143, 0.1)', color: '#2a6d8f' }}
            >
              {/* Icon would go here */}
              <span className="font-medium">Create Company</span>
            </Link>
            <Link 
              to="/admin/users/create-admin"
              className="shadow rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
              style={{ backgroundColor: 'rgba(245, 146, 62, 0.1)', color: '#f5923e' }}
            >
              {/* Icon would go here */}
              <span className="font-medium">Create Admin</span>
            </Link>
            <Link 
              to="/admin/users"
              className="shadow rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
              style={{ backgroundColor: 'rgba(95, 179, 161, 0.1)', color: '#5fb3a1' }}
            >
              {/* Icon would go here */}
              <span className="font-medium">Manage Users</span>
            </Link>
            <Link 
              to="/admin/companies"
              className="shadow rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
              style={{ backgroundColor: 'rgba(42, 109, 143, 0.1)', color: '#2a6d8f' }}
            >
              {/* Icon would go here */}
              <span className="font-medium">Manage Companies</span>
            </Link>
          </div>
        </div>
        
        {/* Recent Users */}
        <div className="shadow rounded-lg p-6 mb-6" style={{ background: 'linear-gradient(to right, rgba(42, 109, 143, 0.05), rgba(95, 179, 161, 0.05))' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{ color: '#2a6d8f' }}>Recent Users</h2>
            <Link 
              to="/admin/users"
              className="font-medium hover:underline"
              style={{ color: '#5fb3a1' }}
            >
              View All
            </Link>
          </div>
          
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.slice(0, 5).map((user) => (
                    <tr key={user.id}>
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
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/admin/users/${user.id}`} style={{ color: '#5fb3a1' }} className="hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
        
        {/* Recent Companies */}
        <div className="shadow rounded-lg p-6" style={{ background: 'linear-gradient(to right, rgba(95, 179, 161, 0.05), rgba(245, 146, 62, 0.05))' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{ color: '#2a6d8f' }}>Recent Companies</h2>
            <Link 
              to="/admin/companies"
              className="font-medium hover:underline"
              style={{ color: '#5fb3a1' }}
            >
              View All
            </Link>
          </div>
          
          {companies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.slice(0, 5).map((company) => (
                    <tr key={company.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.industry}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/admin/companies/${company.id}`} style={{ color: '#5fb3a1' }} className="hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No companies found</p>
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
  return userType.charAt(0).toUpperCase() + userType.slice(1);
}

export default Dashboard;