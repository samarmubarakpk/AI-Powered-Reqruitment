import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-red-600 mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-gray-700 mb-8">The page you are looking for does not exist.</p>
      
      <Link to="/" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
        Go Home
      </Link>
    </div>
  );
}

export default NotFound;