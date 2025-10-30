import React from "react";
import { AlertTriangle, X } from "lucide-react";

const ConfirmDeleteOptionModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-modalBackdrop flex items-center justify-center z-50 p-4">
      <div className="bg-modalBg rounded-lg shadow-custom-lg max-w-md w-full">
        <div className="bg-navBgColor px-6 py-4 border-b border-borderColor">
          <h3 className="text-lg font-semibold text-textPrimary flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            Confirm Deletion
          </h3>
        </div>

        <div className="p-6">
          <p className="text-textSecondary mb-4">
            Are you sure you want to delete this option? This action cannot be
            undone.
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border border-borderColor text-textPrimary rounded-lg hover:bg-hoverBg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-danger text-white rounded-lg hover:bg-dangerHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteOptionModal;
