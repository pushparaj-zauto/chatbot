import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../common/Logo";
import axiosInstance from "../../services/api/axiosInstance"; 
import API_ENDPOINTS from "../../services/api/endpoints";
import { getErrorMessage } from "../../utils/errorHandler";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      navigate("/login");
    }
  }, [token, navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = "New password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    const toastPromise = axiosInstance.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      password: formData.password,
    });

    toast
      .promise(toastPromise, {
        loading: "Resetting your password...",
        success: () => {
          setTimeout(() => navigate("/login"), 1000); // Slight delay before redirect
          return "Password reset successfully! You can now log in.";
        },
        error: (err) => {
          const message = getErrorMessage(err);
          setErrors({ submit: message });
          if (err.response?.status === 400 || err.response?.status === 404) {
            navigate("/forgot-password");
          }
          return message;
        },
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear specific field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <Logo />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mt-6">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Reset Password
            </h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-2.5 text-sm border ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                  } rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-2.5 text-sm border ${
                    errors.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                  } rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all`}
                  placeholder="Confirm new password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.submit}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-102 active:scale-98"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resetting...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
