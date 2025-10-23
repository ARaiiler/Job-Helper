import React, { useState, useEffect } from 'react';
import { Award, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { Skill, SkillCategory } from '@shared/types';

const Skills = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Skill>({
    name: '',
    category: 'technical',
    proficiency_level: 3
  });

  const skillCategories: { value: SkillCategory; label: string; color: string }[] = [
    { value: 'technical', label: 'Technical', color: 'bg-blue-100 text-blue-800' },
    { value: 'soft', label: 'Soft Skills', color: 'bg-green-100 text-green-800' },
    { value: 'languages', label: 'Languages', color: 'bg-purple-100 text-purple-800' }
  ];

  const proficiencyLevels = [
    { value: 1, label: 'Beginner' },
    { value: 2, label: 'Novice' },
    { value: 3, label: 'Intermediate' },
    { value: 4, label: 'Advanced' },
    { value: 5, label: 'Expert' }
  ];

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const data = await window.electronAPI.getAllSkills();
      setSkills(data);
    } catch (error) {
      console.error('Failed to load skills:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Skill name is required';
    }

    // Check for duplicate skill names
    const existingSkill = skills.find(skill => 
      skill.name.toLowerCase() === formData.name.toLowerCase() && 
      skill.id !== editingId
    );
    if (existingSkill) {
      newErrors.name = 'This skill already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const updated = await window.electronAPI.saveSkill({ ...formData, id: editingId });
        setSkills(prev => prev.map(skill => skill.id === editingId ? updated : skill));
        setEditingId(null);
      } else {
        const newSkill = await window.electronAPI.saveSkill(formData);
        setSkills(prev => [...prev, newSkill]);
        setIsAdding(false);
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save skill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this skill?')) {
      return;
    }

    try {
      await window.electronAPI.deleteSkill(id);
      setSkills(prev => prev.filter(skill => skill.id !== id));
    } catch (error) {
      console.error('Failed to delete skill:', error);
    }
  };

  const handleEdit = (skill: Skill) => {
    setFormData(skill);
    setEditingId(skill.id!);
    setIsAdding(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'technical',
      proficiency_level: 3
    });
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'proficiency_level' ? parseInt(value) : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getSkillsByCategory = (category: SkillCategory) => {
    return skills.filter(skill => skill.category === category);
  };

  const getProficiencyStars = (level: number) => {
    return '★'.repeat(level) + '☆'.repeat(5 - level);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Award className="w-6 h-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setIsAdding(true);
              resetForm();
            }}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Skill
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Skill Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder="JavaScript, Leadership, Spanish"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
              >
                {skillCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Proficiency Level</label>
              <select
                name="proficiency_level"
                value={formData.proficiency_level}
                onChange={handleChange}
                className="input-field"
              >
                {proficiencyLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label} ({level.value}/5)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Saving...' : 'Save Skill'}
            </button>
          </div>
        </form>
      )}

      {/* Skills by Category */}
      <div className="space-y-6">
        {skillCategories.map(category => {
          const categorySkills = getSkillsByCategory(category.value);
          
          if (categorySkills.length === 0) return null;

          return (
            <div key={category.value}>
              <div className="flex items-center mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                  {category.label}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  {categorySkills.length} skill{categorySkills.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categorySkills.map(skill => (
                  <div key={skill.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{skill.name}</h4>
                        <div className="flex items-center mt-1">
                          <span className="text-yellow-500 text-sm">
                            {getProficiencyStars(skill.proficiency_level)}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {proficiencyLevels.find(l => l.value === skill.proficiency_level)?.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => handleEdit(skill)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(skill.id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {skills.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No skills added yet</p>
            <p className="text-sm">Click "Add Skill" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Skills;
