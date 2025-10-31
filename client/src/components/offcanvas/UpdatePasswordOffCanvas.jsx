import React, { useState, useEffect } from 'react';
import { X, EyeOff, Lock, Loader2, Eye } from 'lucide-react';
import axiosInstance from '../../services/api/axiosInstance';
import API_ENDPOINTS from '../../services/api/endpoints';
import toast from 'react-hot-toast';

const UpdatePasswordOffCanvas = ({ isOpen, onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm the password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await axiosInstance.patch(
        API_ENDPOINTS.TEAM.UPDATE_PASSWORD(user.id),
        { newPassword: formData.newPassword },
      );

      toast.success(response.data.message || 'Password updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
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
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-borderColor bg-navBgColor">
            <div>
              <h2 className="text-xl font-semibold text-textPrimary flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Update Password
              </h2>
              <p className="text-sm text-textSecondary mt-1">
                Update password for {user?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hoverBg rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-textSecondary" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {/* User Info */}
            <div className="bg-bgColor p-4 rounded-lg border border-borderColor">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-textSecondary">Name:</span>
                  <span className="text-sm text-textPrimary font-medium">
                    {user?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-textSecondary">Email:</span>
                  <span className="text-sm text-textPrimary font-medium">
                    {user?.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-textSecondary">Role:</span>
                  <span className="text-sm text-textPrimary font-medium capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                New Password <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textTertiary" />
                <input
                  type="text"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 bg-inputBgColor border ${
                    errors.newPassword
                      ? 'border-danger focus:border-danger'
                      : 'border-inputBorderColor focus:border-inputFocusColor'
                  } rounded-lg text-textColor placeholder-textTertiary focus:outline-none transition-colors`}
                  placeholder="Enter new password"
                />
              </div>
              {errors.newPassword && (
                <p className="text-danger text-sm mt-1">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Confirm Password <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textTertiary" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-2.5 bg-inputBgColor border ${
                    errors.confirmPassword
                      ? 'border-danger focus:border-danger'
                      : 'border-inputBorderColor focus:border-inputFocusColor'
                  } rounded-lg text-textColor placeholder-textTertiary focus:outline-none transition-colors`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textTertiary hover:text-textPrimary transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-danger text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-300 font-medium mb-2">
                Password Requirements:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>Minimum 6 characters</li>
                <li>Both passwords must match</li>
              </ul>
            </div>
          </form>

          {/* Actions */}
          <div className="bg-navBgColor px-6 py-4 border-t border-borderColor">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 border border-borderColor text-textPrimary rounded-lg hover:bg-hoverBg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-brandColor text-white rounded-lg hover:bg-brandHover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordOffCanvas;
