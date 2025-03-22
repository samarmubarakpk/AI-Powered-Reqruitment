import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { companyService } from "../../services/api";
import NavBar from "../layout/NavBar";

function CreateVacancy() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    experienceRequired: "",
    closingDate: "",
    status: "open",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      return setError("Please fill in all required fields");
    }

    try {
      setLoading(true);
      setError("");
      const skills = formData.requiredSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      await companyService.createVacancy({
        title: formData.title,
        description: formData.description,
        requiredSkills: skills,
        experienceRequired: parseInt(formData.experienceRequired) || 0,
        closingDate: formData.closingDate || null,
        status: formData.status,
      });

      navigate("/company/vacancies");
    } catch (err) {
      console.error("Error creating vacancy:", err);
      setError(
        err.response?.data?.message || "Error creating vacancy. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar userType="company" />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">Post a New Vacancy</h1>
          <Link
            to="/company/vacancies"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
          >
            Cancel
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white p-8 shadow-lg rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium">Job Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Job Description *</label>
              <textarea
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium">Required Skills</label>
              <input
                type="text"
                name="requiredSkills"
                value={formData.requiredSkills}
                onChange={handleChange}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. JavaScript, React, Node.js"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Years of Experience</label>
              <input
                type="number"
                name="experienceRequired"
                value={formData.experienceRequired}
                onChange={handleChange}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                max="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Application Deadline</label>
              <input
                type="date"
                name="closingDate"
                value={formData.closingDate}
                onChange={handleChange}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="open">Active - Publish Immediately</option>
                <option value="draft">Draft - Save but Don't Publish</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Link
                to="/company/vacancies"
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              >
                {loading ? "Posting..." : "Post Vacancy"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateVacancy;
