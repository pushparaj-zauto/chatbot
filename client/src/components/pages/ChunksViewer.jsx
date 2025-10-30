import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import DeleteConfirmModal from "../modals/DeleteConfirmModal";
import axiosInstance from "../../services/api/axiosInstance";
import API_ENDPOINTS from "../../services/api/endpoints";

const ChunksViewer = () => {
  const [chunks, setChunks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingChunkId, setDeletingChunkId] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: "all", // 'all' or 'single'
    chunkId: null,
  });

  useEffect(() => {
    fetchChunks();
  }, []);

  const fetchChunks = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.CHUNKS.GET, {
        params: {
          limit: 50,
        },
      });
      setChunks(response.data.chunks);
    } catch (err) {
      console.error("Error fetching chunks:", err);
      setError("Failed to load conversation chunks");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (type, chunkId = null) => {
    setDeleteModal({
      isOpen: true,
      type,
      chunkId,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      type: "all",
      chunkId: null,
    });
  };

  const deleteChunk = async (chunkId) => {
    setDeletingChunkId(chunkId);
    setError("");
    try {
      const response = await axiosInstance.delete(
        API_ENDPOINTS.CHUNKS.DELETE_ONE(chunkId)
      );
      if (response.data.success) {
        setChunks((prevChunks) =>
          prevChunks.filter((chunk) => chunk.id !== chunkId)
        );
        closeDeleteModal();
      } else {
        setError(response.data.message || "Failed to delete chunk");
      }
    } catch (err) {
      console.error("Error deleting chunk:", err);
      setError("Failed to delete chunk");
    } finally {
      setDeletingChunkId(null);
    }
  };

  const deleteAllChunks = async () => {
    setIsDeletingAll(true);
    setError("");
    try {
      const response = await axiosInstance.delete(
        API_ENDPOINTS.CHUNKS.DELETE_ALL
      );
      if (response.data.success) {
        setChunks([]);
        closeDeleteModal();
      } else {
        setError(response.data.message || "Failed to delete all chunks");
      }
    } catch (err) {
      console.error("Error deleting all chunks:", err);
      setError("Failed to delete all chunks");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.type === "all") {
      deleteAllChunks();
    } else {
      deleteChunk(deleteModal.chunkId);
    }
  };

  const formatTimestamp = (timestamp) => {
    const ts = Number(timestamp);
    const date = new Date(ts);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-50px)] bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
            Conversation Chunks
          </h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
            {chunks.length} chunk{chunks.length !== 1 ? "s" : ""} stored
          </p>
        </div>
        {chunks.length > 0 && (
          <button
            onClick={() => openDeleteModal("all")}
            disabled={isDeletingAll}
            className="px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            {isDeletingAll ? "Deleting..." : "Delete All"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {error && (
          <div className="mb-4 p-3 md:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm md:text-base text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-violet-600 dark:border-violet-500"></div>
          </div>
        ) : chunks.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
              No chunks available yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chunks.map((chunk) => (
              <div
                key={chunk.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Chunk Header */}
                <div className="flex justify-between items-start px-4 md:px-5 py-2 md:py-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(chunk.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => openDeleteModal("single", chunk.id)}
                    disabled={deletingChunkId === chunk.id}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete chunk"
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>

                {/* Chunk Content */}
                <div className="px-4 md:px-5 py-3 md:py-4 space-y-4">
                  {/* User Message */}
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-violet-600 dark:text-violet-400 mb-2">
                      You:
                    </p>
                    <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {chunk.userMessage}
                    </p>
                  </div>

                  {/* AI Response */}
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      Assistant:
                    </p>
                    <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {chunk.aiResponse}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        isDeleting={
          deleteModal.type === "all"
            ? isDeletingAll
            : deletingChunkId === deleteModal.chunkId
        }
        type={deleteModal.type}
      />
    </div>
  );
};

export default ChunksViewer;
