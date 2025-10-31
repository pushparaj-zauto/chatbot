import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../services/api/axiosInstance';
import API_ENDPOINTS from '../../services/api/endpoints';

const TeamMemberOffCanvas = ({ isOpen, onClose, selectedUser, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    whatsapp: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});

  const roleOptions = ['admin', 'user'];

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name,
        email: selectedUser.email,
        mobile: selectedUser.mobile || '',
        whatsapp: selectedUser.whatsapp || '',
        role: selectedUser.role,
        password: '',
      });
    } else {
      resetForm();
    }
  }, [selectedUser, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      mobile: '',
      whatsapp: '',
      role: 'user',
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!selectedUser) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile must be 10 digits';
    }
    if (formData.whatsapp && !/^\d{10}$/.test(formData.whatsapp)) {
      newErrors.whatsapp = 'WhatsApp must be 10 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    try {
      let response;
      if (selectedUser) {
        const { password, email, ...updateData } = formData;
        response = await axiosInstance.put(
          API_ENDPOINTS.TEAM.UPDATE(selectedUser.id),
          updateData,
        );
      } else {
        response = await axiosInstance.post(
          API_ENDPOINTS.TEAM.CREATE,
          formData,
        );
      }

      if (response.data.message) {
        toast.success(response.data.message);
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred.');
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`fixed top-0 right-0 h-full bg-bgColor w-full max-w-md transform transition-transform duration-300 z-60 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <div className="bg-navBgColor px-6 py-4 border-b border-borderColor flex items-center justify-between">
            <h3 className="text-lg font-semibold text-textPrimary flex items-center gap-2">
              {selectedUser ? (
                <User className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
              {selectedUser ? 'Edit User' : 'Add New User'}
            </h3>
            <button
              onClick={onClose}
              className="text-textSecondary hover:text-textPrimary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-4 overflow-y-auto flex-1"
          >
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                Name{' '}
                <span className="text-red-700 dark:text-red-500 mx-1">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                placeholder="Enter name"
              />
              {errors.name && (
                <p className="text-danger text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                Email{' '}
                <span className="text-red-700 dark:text-red-500 mx-1">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!!selectedUser}
                className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Enter email"
              />
              {errors.email && (
                <p className="text-danger text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {!selectedUser && (
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  Password{' '}
                  <span className="text-red-700 dark:text-red-500 mx-1">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                  placeholder="Enter password (min 6 chars)"
                />
                {errors.password && (
                  <p className="text-danger text-xs mt-1">{errors.password}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                Mobile
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                placeholder="10 digit mobile number"
              />
              {errors.mobile && (
                <p className="text-danger text-xs mt-1">{errors.mobile}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                placeholder="10 digit WhatsApp number"
              />
              {errors.whatsapp && (
                <p className="text-danger text-xs mt-1">{errors.whatsapp}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                Role{' '}
                <span className="text-red-700 dark:text-red-500 mx-1">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </form>

          <div className="bg-navBgColor px-6 py-4 border-t border-borderColor">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-borderColor text-textPrimary rounded-lg hover:bg-hoverBg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-brandColor text-white rounded-lg hover:bg-brandHover transition-colors"
              >
                {selectedUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberOffCanvas;
