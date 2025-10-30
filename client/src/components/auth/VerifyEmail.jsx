import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, MailWarning, Loader2 } from "lucide-react";
import Logo from "../common/Logo";
import axiosInstance from "../../services/api/axiosInstance";
import API_ENDPOINTS from "../../services/api/endpoints";
import { getErrorMessage } from "../../utils/errorHandler";
import toast from "react-hot-toast";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [tokenExpired, setTokenExpired] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        const response = await axiosInstance.get(
          API_ENDPOINTS.AUTH.VERIFY_EMAIL,
          {
            params: { token },
          }
        );
        setStatus("success");
        setMessage(response.data.message || "Email verified successfully!");
        if (response.data.alreadyVerified) {
          setAlreadyVerified(true);
        } else {
          // Auto redirect to login after 3 seconds if newly verified
          setTimeout(() => navigate("/login"), 3000);
        }
      } catch (error) {
        setStatus("error");
        const errorData = error.response?.data;

        if (errorData?.error === "ALREADY_VERIFIED") {
          setAlreadyVerified(true);
          setMessage(
            errorData.message || "This email has already been verified."
          );
        } else if (errorData?.tokenExpired) {
          setTokenExpired(true);
          setUserEmail(errorData.email);
          setMessage(
            "Your verification link has expired. Please request a new one."
          );
        } else {
          setMessage(getErrorMessage(error));
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error("Could not resend email. User email not found.");
      return;
    }
    setIsResending(true);

    const toastPromise = axiosInstance.post(
      API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
      { email: userEmail }
    );

    toast
      .promise(toastPromise, {
        loading: "Sending new verification email...",
        success: "A new verification email has been sent to your inbox!",
        error: (err) => getErrorMessage(err),
      })
      .finally(() => {
        setIsResending(false);
      });
  };

  const StatusDisplay = () => {
    if (status === "loading") {
      return (
        <>
          <Loader2 className="w-14 h-14 text-purple-500 dark:text-purple-400 animate-spin" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Verifying your email...
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please wait a moment.
          </p>
        </>
      );
    }

    if (status === "success" || alreadyVerified) {
      return (
        <>
          <CheckCircle className="w-14 h-14 text-green-500 dark:text-green-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {alreadyVerified ? "Email Already Verified" : "Email Verified!"}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 px-4">
            {message}
          </p>
          {!alreadyVerified && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Redirecting to login...
            </p>
          )}
          <Link
            to="/login"
            className="mt-4 w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200"
          >
            Go to Login
          </Link>
        </>
      );
    }

    if (status === "error") {
      return (
        <>
          {tokenExpired ? (
            <MailWarning className="w-14 h-14 text-red-500 dark:text-red-400" />
          ) : (
            <XCircle className="w-14 h-14 text-red-500 dark:text-red-400" />
          )}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Verification Failed
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 px-4">
            {message}
          </p>

          {tokenExpired ? (
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="mt-4 w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {isResending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resending...
                </span>
              ) : (
                "Resend Verification Email"
              )}
            </button>
          ) : (
            <Link
              to="/signup"
              className="mt-4 w-full text-center py-2.5 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-semibold rounded-lg transition-all duration-200"
            >
              Sign Up Again
            </Link>
          )}
          <Link
            to="/login"
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline mt-4"
          >
            Back to Login
          </Link>
        </>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <Logo />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mt-6">
          <div className="text-center">
            <div className="flex flex-col items-center gap-4">
              <StatusDisplay />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
