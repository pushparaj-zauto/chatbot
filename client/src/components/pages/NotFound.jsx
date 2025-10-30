import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgColor px-4">
      <div className="text-center max-w-md w-full">
        {/* 404 Icon */}
        <div className="flex justify-center mb-6">
          <AlertCircle className="w-24 h-24 text-danger" strokeWidth={1.5} />
        </div>

        {/* 404 Heading */}
        <h1 className="text-8xl font-bold text-textPrimary mb-4">404</h1>

        {/* Error Message */}
        <h2 className="text-2xl font-semibold text-textColor mb-3">
          Page Not Found
        </h2>

        <p className="text-textSecondary text-base mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get
          you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brandColor hover:bg-brandHover text-white rounded-lg font-medium transition-all shadow-custom hover:shadow-custom-lg"
          >
            <Home size={18} />
            Go to Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
