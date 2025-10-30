import { useState } from "react";
import axiosInstance from "../../services/api/axiosInstance";
import API_ENDPOINTS from "../../services/api/endpoints";
import toast from "react-hot-toast";

const StatusToggle = ({ userId, currentStatus, onToggle }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const response = await axiosInstance.put(
        API_ENDPOINTS.TEAM.UPDATE(userId),
        { status: newStatus }
      );

      if (response.data.message) {
        toast.success(`User ${newStatus}`);
        onToggle();
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
        currentStatus === "active"
          ? "bg-green-500"
          : "bg-gray-300 dark:bg-gray-600"
      } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          currentStatus === "active" ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
};

export default StatusToggle;