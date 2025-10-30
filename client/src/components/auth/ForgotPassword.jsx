import React, { useState, useEffect } from "react";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../common/Logo";
import { getErrorMessage } from "../../utils/errorHandler";
import API_ENDPOINTS from "../../services/api/endpoints";
import axiosInstance from "../../services/api/axiosInstance";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canResend) {
      toast.error(
        `Please wait ${formatTime(countdown)} before requesting again.`
      );
      return;
    }

    // Email validation regex pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    if (!emailPattern.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    const toastPromise = axiosInstance.post(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email }
    );

    toast
      .promise(toastPromise, {
        loading: "Sending reset link...",
        success: (response) => {
          setCanResend(false);
          setCountdown(120);
          return (
            response.data.message ||
            "If an account exists, a reset link has been sent."
          );
        },
        error: (err) => {
          return getErrorMessage(err);
        },
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <Logo />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mt-6">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Forgot Password?
            </h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:ring-purple-500 rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !canResend}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-102 active:scale-98"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </span>
              ) : !canResend ? (
                `Resend in ${formatTime(countdown)}`
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
