import React from "react";
import { X } from "lucide-react";

const EmbeddingModal = ({
  isOpen,
  onClose,
  embedding,
  chunkId,
  embeddingType,
}) => {
  if (!isOpen) return null;

  const formatEmbedding = (emb) => {
    if (!emb || !Array.isArray(emb)) return "No embedding data";

    return emb.map((val, idx) => ({
      index: idx,
      value: typeof val === "number" ? val.toFixed(6) : val,
    }));
  };

  const embeddingData = formatEmbedding(embedding);
  const dimensions = Array.isArray(embedding) ? embedding.length : 0;

  // Determine badge color and label based on embeddingType
  const getBadgeStyle = () => {
    if (embeddingType === "question") {
      return {
        bg: "bg-blue-100 dark:bg-blue-900",
        text: "text-blue-800 dark:text-blue-200",
        label: "Question",
      };
    } else if (embeddingType === "answer") {
      return {
        bg: "bg-green-100 dark:bg-green-900",
        text: "text-green-800 dark:text-green-200",
        label: "Answer",
      };
    }
    return {
      bg: "bg-gray-100 dark:bg-gray-700",
      text: "text-gray-800 dark:text-gray-200",
      label: "Combined",
    };
  };

  const badgeStyle = getBadgeStyle();

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Embedding Vector
            </h2>
            {embeddingType && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeStyle.bg} ${badgeStyle.text}`}
              >
                {badgeStyle.label}
              </span>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Chunk ID: {chunkId} • Dimensions: {dimensions}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {embeddingData === "No embedding data" ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {embeddingData}
            </p>
          ) : (
            <div className="space-y-2">
              {embeddingData.map((item) => (
                <div
                  key={item.index}
                  className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    [{item.index}]
                  </span>
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbeddingModal;
