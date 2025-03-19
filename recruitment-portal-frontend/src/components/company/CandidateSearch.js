// // src/components/company/CandidateSearch.js
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { companyService } from '../../services/api';
// import NavBar from '../layout/NavBar';

// function CandidateSearch() {
//   const [candidates, setCandidates] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [searchPerformed, setSearchPerformed] = useState(false);
//   const [error, setError] = useState('');
  
//   // Search parameters
//   const [searchParams, setSearchParams] = useState({
//     skills: [],
//     experienceMin: '',
//     experienceMax: '',
//     education: '',
//     location: '',
//     sortBy: 'experience'
//   });
  
//   // New skill input
//   const [newSkill, setNewSkill] = useState('');
  
//   const handleSearch = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       // Convert experienceMin and experienceMax to numbers if provided
//       const params = {
//         ...searchParams,
//         experienceMin: searchParams.experienceMin ? parseInt(searchParams.experienceMin) : undefined,
//         experienceMax: searchParams.experienceMax ? parseInt(searchParams.experienceMax) : undefined
//       };
      
//       const response = await companyService.searchCandidates(params);
//       setCandidates(response.data.candidates);
//       setSearchPerformed(true);
//       setLoading(false);
//     } catch (err) {
//       console.error('Error searching candidates:', err);
//       setError('Failed to search candidates. Please try again.');
//       setLoading(false);
//     }
//   };
  
//   const handleAddSkill = () => {
//     if (newSkill.trim() && !searchParams.skills.includes(newSkill.trim())) {
//       setSearchParams({
//         ...searchParams,
//         skills: [...searchParams.skills, newSkill.trim()]
//       });
//       setNewSkill('');
//     }
//   };
  
//   const handleRemoveSkill = (skill) => {
//     setSearchParams({
//       ...searchParams,
//       skills: searchParams.skills.filter(s => s !== skill)
//     });
//   };
  
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setSearchParams({
//       ...searchParams,
//       [name]: value
//     });
//   };
  
//   return (
//     <div>
//       <NavBar userType="company" />
      
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <h1 className="text-2xl font-bold mb-6">Candidate Search</h1>
        
//         {error && (
//           <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6" role="alert">
//             <div className="flex">
//               <div className="flex-shrink-0">
//                 <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                 </svg>
//               </div>
//               <div className="ml-3">
//                 <p className="text-sm text-red-700">{error}</p>
//               </div>
//             </div>
//           </div>
//         )}
        
//         {/* Search Form */}
//         <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
//           <div className="p-6 border-b border-gray-200">
//             <h2 className="text-lg font-medium text-gray-900 mb-4">Search Parameters</h2>
            
//             <div className="space-y-6">
//               {/* Skills Search */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Required Skills
//                 </label>
//                 <div className="flex space-x-2">
//                   <input
//                     type="text"
//                     value={newSkill}
//                     onChange={(e) => setNewSkill(e.target.value)}
//                     className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                     placeholder="Enter a skill"
//                     onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
//                   />
//                   <button
//                     type="button"
//                     onClick={handleAddSkill}
//                     className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
//                   >
//                     Add
//                   </button>
//                 </div>
                
//                 {searchParams.skills.length > 0 && (
//                   <div className="mt-2 flex flex-wrap gap-2">
//                     {searchParams.skills.map((skill, index) => (
//                       <span
//                         key={index}
//                         className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
//                       >
//                         {skill}
//                         <button
//                           type="button"
//                           onClick={() => handleRemoveSkill(skill)}
//                           className="ml-1.5 inline-flex flex-shrink-0 h-4 w-4 rounded-full text-indigo-400 hover:text-indigo-600 focus:outline-none focus:text-indigo-500"
//                         >
//                           <span className="sr-only">Remove {skill}</span>
//                           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                           </svg>
//                         </button>
//                       </span>
//                     ))}
//                   </div>
//                 )}
//               </div>
              
//               {/* Experience Range */}
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label htmlFor="experienceMin" className="block text-sm font-medium text-gray-700">
//                     Minimum Experience (years)
//                   </label>
//                   <input
//                     type="number"
//                     id="experienceMin"
//                     name="experienceMin"
//                     min="0"
//                     value={searchParams.experienceMin}
//                     onChange={handleInputChange}
//                     className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                   />
//                 </div>
                
//                 <div>
//                   <label htmlFor="experienceMax" className="block text-sm font-medium text-gray-700">
//                     Maximum Experience (years)
//                   </label>
//                   <input
//                     type="number"
//                     id="experienceMax"
//                     name="experienceMax"
//                     min="0"
//                     value={searchParams.experienceMax}
//                     onChange={handleInputChange}
//                     className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                   />
//                 </div>
//               </div>
              
//               {/* Education */}
//               <div>
//                 <label htmlFor="education" className="block text-sm font-medium text-gray-700">
//                   Education
//                 </label>
//                 <select
//                   id="education"
//                   name="education"
//                   value={searchParams.education}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                 >
//                   <option value="">Any Education Level</option>
//                   <option value="Bachelor">Bachelor's Degree</option>
//                   <option value="Master">Master's Degree</option>
//                   <option value="PhD">PhD / Doctorate</option>
//                 </select>
//               </div>
              
//               {/* Location */}
//               <div>
//                 <label htmlFor="location" className="block text-sm font-medium text-gray-700">
//                   Location
//                 </label>
//                 <input
//                   type="text"
//                   id="location"
//                   name="location"
//                   value={searchParams.location}
//                   onChange={handleInputChange}
//                   className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                   placeholder="City, State, or Country"
//                 />
//               </div>
              
//               {/* Sort By */}
//               <div>
//                 <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
//                   Sort Results By
//                 </label>
//                 <select
//                   id="sortBy"
//                   name="sortBy"
//                   value={searchParams.sortBy}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                 >
//                   <option value="experience">Experience (Most to Least)</option>
//                   <option value="recentActivity">Recent Activity</option>
//                 </select>
//               </div>
              
//               <div className="flex justify-end">
//                 <button
//                   type="button"
//                   onClick={handleSearch}
//                   disabled={loading}
//                   className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                 >
//                   {loading ? (
//                     <>
//                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       Searching...
//                     </>
//                   ) : "Search Candidates"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
        
//         {/* Search Results */}
//         {searchPerformed && (
//           <div className="bg-white shadow rounded-lg overflow-hidden">
//             <div className="p-6 border-b border-gray-200">
//               <div className="flex justify-between items-center">
//                 <h2 className="text-lg font-medium text-gray-900">Search Results</h2>
//                 <span className="text-sm text-gray-500">
//                   {candidates.length} candidates found
//                 </span>
//               </div>
//             </div>
            
//             {candidates.length > 0 ? (
//               <div className="divide-y divide-gray-200">
//                 {candidates.map((candidate) => (
//                   <div key={candidate.id} className="p-6">
//                     <div className="flex items-start">
//                       <div className="flex-shrink-0">
//                         <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-semibold">
//                           {candidate.firstName.charAt(0)}
//                         </div>
//                       </div>
//                       <div className="ml-4 flex-1">
//                         <h3 className="text-lg font-medium text-gray-900">{candidate.firstName} {candidate.lastName}</h3>
                        
//                         {/* Skills */}
//                         {candidate.skills && candidate.skills.length > 0 && (
//                           <div className="mt-2">
//                             <p className="text-sm font-medium text-gray-700">Skills:</p>
//                             <div className="mt-1 flex flex-wrap gap-1">
//                               {candidate.skills.map((skill, index) => (
//                                 <span
//                                   key={index}
//                                   className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
//                                     ${searchParams.skills.includes(skill) 
//                                       ? 'bg-green-100 text-green-800' 
//                                       : 'bg-gray-100 text-gray-800'}`}
//                                 >
//                                   {skill}
//                                   {searchParams.skills.includes(skill) && (
//                                     <svg className="inline-block ml-1 h-3 w-3 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                                     </svg>
//                                   )}
//                                 </span>
//                               ))}
//                             </div>
//                           </div>
//                         )}
                        
//                         {/* Experience */}
//                         {candidate.totalExperience !== undefined && (
//                           <p className="mt-2 text-sm text-gray-500">
//                             Experience: {candidate.totalExperience} years
//                           </p>
//                         )}
                        
//                         {/* Education */}
//                         {candidate.education && candidate.education.length > 0 && (
//                           <p className="mt-1 text-sm text-gray-500">
//                             Education: {candidate.education[0].degree} {candidate.education[0].field && `in ${candidate.education[0].field}`}, {candidate.education[0].institution}
//                           </p>
//                         )}
//                       </div>
                      
//                       <div className="ml-4 flex-shrink-0 space-y-2">
//                         {candidate.cvUrl && (
                          
//                             href={candidate.cvUrl}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                           >
//                             View CV
//                           </a>
//                         )}
                        
//                         <Link
//                           to={`/company/candidates/${candidate.id}`}
//                           className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                         >
//                           View Profile
//                         </Link>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="p-10 text-center">
//                 <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
//                 </svg>
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
//                 <p className="mt-1 text-sm text-gray-500">
//                   Try adjusting your search criteria to find more candidates.
//                 </p>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default CandidateSearch;