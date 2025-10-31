import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorHandler';
import toast from 'react-hot-toast';
import axiosInstance from '../../services/api/axiosInstance';
import API_ENDPOINTS from '../../services/api/endpoints';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // clear field specific errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // clear submit error
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResendVerification = async (email) => {
    try {
      await toast.promise(
        axiosInstance.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email }),
        {
          loading: 'Sending verification email...',
          success: 'Verification email sent! Check your inbox.',
          error: 'Failed to send verification email',
        },
      );
    } catch (error) {
      console.error('Resend verification error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    toast
      .promise(login(formData.email, formData.password), {
        loading: 'Logging in...',
        success: (data) => {
          navigate('/chat');
          return `Welcome back, ${data.user?.name || 'User'}!`;
        },
        error: (error) => {
          // Handle EMAIL_NOT_VERIFIED error
          if (error.response?.data?.error === 'EMAIL_NOT_VERIFIED') {
            const tokenExpired = error.response.data.tokenExpired;
            const userEmail = error.response.data.email;
            const errorMessage = error.response.data.message;

            setErrors({ submit: errorMessage });

            if (tokenExpired) {
              // Show custom toast with resend button after a brief delay
              setTimeout(() => {
                toast(
                  (t) => (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Your verification link has expired
                      </p>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          handleResendVerification(userEmail);
                        }}
                        className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                      >
                        Resend Verification Email
                      </button>
                    </div>
                  ),
                  {
                    duration: 3000,
                    icon: '⚠️',
                  },
                );
              }, 500);
            }

            return errorMessage;
          }
          const errorMessage = getErrorMessage(error);
          setErrors({ submit: errorMessage });
          return errorMessage;
        },
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo component */}
        <Logo />

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Welcome Back
            </h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Sign in to continue to your personal assistant
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm border ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                  } rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                {/* <Link
                  to="/forgot-password"
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
                >
                  Forgot?
                </Link> */}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-2.5 text-sm border ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                  } rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all`}
                  placeholder="Enter your password"
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
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin align-middle" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* <p className="mt-6 text-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors"
            >
              Sign Up
            </Link>
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
