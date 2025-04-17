import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { companyService } from "../../services/api";
import NavBar from "../layout/NavBar";

function CreateVacancy() {
  // Define the color scheme from HomePage
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
      return setError("Por favor, complete todos los campos requeridos");
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
      console.error("Error creando vacante:", err);
      setError(
        err.response?.data?.message || "Error al crear la vacante. Por favor, inténtelo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.primaryTeal.veryLight }}>
      <NavBar userType="company" />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold" style={{ color: colors.primaryTeal.dark }}>Publicar Nueva Vacante</h1>
          <Link
            to="/company/vacancies"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ 
              backgroundColor: colors.primaryTeal.veryLight, 
              color: colors.primaryTeal.dark,
              border: `1px solid ${colors.primaryTeal.light}`
            }}
          >
            Cancelar
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
              <label className="block text-sm font-medium text-gray-700">Título del Trabajo *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full mt-2 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                style={{ borderColor: colors.primaryTeal.light }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción del Trabajo *</label>
              <textarea
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="w-full mt-2 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                style={{ borderColor: colors.primaryTeal.light }}
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Habilidades Requeridas</label>
              <input
                type="text"
                name="requiredSkills"
                value={formData.requiredSkills}
                onChange={handleChange}
                className="w-full mt-2 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                style={{ borderColor: colors.primaryTeal.light }}
                placeholder="ej. JavaScript, React, Node.js"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Años de Experiencia</label>
              <input
                type="number"
                name="experienceRequired"
                value={formData.experienceRequired}
                onChange={handleChange}
                className="w-full mt-2 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                style={{ borderColor: colors.primaryTeal.light }}
                min="0"
                max="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Límite de Solicitud</label>
              <input
                type="date"
                name="closingDate"
                value={formData.closingDate}
                onChange={handleChange}
                className="w-full mt-2 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                style={{ borderColor: colors.primaryTeal.light }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full mt-2 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                style={{ borderColor: colors.primaryTeal.light }}
              >
                <option value="open">Activa - Publicar Inmediatamente</option>
                <option value="draft">Borrador - Guardar sin Publicar</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Link
                to="/company/vacancies"
                className="px-4 py-2 text-gray-800 rounded-md"
                style={{ 
                  backgroundColor: colors.primaryTeal.veryLight, 
                  color: colors.primaryTeal.dark,
                  border: `1px solid ${colors.primaryTeal.light}`
                }}
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-white rounded-md"
                style={{ 
                  backgroundColor: colors.primaryTeal.light,
                  hover: colors.primaryTeal.dark
                }}
              >
                {loading ? "Publicando..." : "Publicar Vacante"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateVacancy;