import React from "react";
import { AlertTriangle, X } from "lucide-react";

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  type = "all",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-modalBackdrop flex items-center justify-center z-50 p-4">
      <div className="bg-modalBg rounded-lg shadow-custom-lg max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b border-borderColor">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-dangerLight rounded-full">
              <AlertTriangle className="text-danger" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-textPrimary">
                Confirm Deletion
              </h2>
              <p className="text-sm text-textSecondary mt-1">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-textSecondary hover:text-textPrimary transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-contentTextColor">
            {type === "all"
              ? "Are you sure you want to delete all conversation chunks? All your conversation history will be permanently removed."
              : "Are you sure you want to delete this conversation chunk? This action is permanent."}
          </p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-borderColor">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2 bg-hoverBg hover:bg-borderColor text-textPrimary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 py-2 bg-danger hover:bg-dangerHover text-userTextColor rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
