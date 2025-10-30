import React, { useState, useEffect } from "react";
import { Edit, Save, X } from "lucide-react";
import axiosInstance from "../../services/api/axiosInstance";
import API_ENDPOINTS from "../../services/api/endpoints";

const PromptEditor = () => {
  const [prompt, setPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Store original values for cancel
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [originalDescription, setOriginalDescription] = useState("");

  useEffect(() => {
    fetchSystemPrompt();
  }, []);

  const fetchSystemPrompt = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PROMPT.GET, {
        params: { type: "default" },
      });
      setPrompt(response.data.systemPrompt);
      setDescription(response.data.description || "");
      setOriginalPrompt(response.data.systemPrompt);
      setOriginalDescription(response.data.description || "");
    } catch (error) {
      console.error("Error fetching system prompt:", error);
      setSaveStatus("Failed to load system prompt");
    }
  };

  const handleEdit = () => {
    setOriginalPrompt(prompt);
    setOriginalDescription(description);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setPrompt(originalPrompt);
    setDescription(originalDescription);
    setIsEditing(false);
    setSaveStatus("");
  };

  const savePrompt = async () => {
    setIsSaving(true);
    setSaveStatus("");
    try {
      await axiosInstance.post(API_ENDPOINTS.PROMPT.UPDATE, {
        systemPrompt: prompt,
        type: "default",
        description: description || undefined,
      });
      setSaveStatus("Saved successfully!");
      setOriginalPrompt(prompt);
      setOriginalDescription(description);
      setIsEditing(false);
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error saving system prompt:", error);
      setSaveStatus("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header with Edit/Save/Cancel buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-2xl font-bold text-headingColor">
          System Prompt Editor
        </h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-4 md:px-6 py-2 bg-brandColor hover:bg-brandHover text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm md:text-base"
            >
              <Edit className="w-4 h-4 md:w-5 md:h-5" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 md:px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm md:text-base"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
                Cancel
              </button>
              <button
                onClick={savePrompt}
                disabled={isSaving}
                className="px-4 md:px-6 py-2 bg-brandColor hover:bg-brandHover text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base"
              >
                <Save className="w-4 h-4 md:w-5 md:h-5" />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status message */}
      {saveStatus && (
        <div
          className={`p-3 md:p-4 rounded-lg text-sm md:text-base ${
            saveStatus.includes("success")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {saveStatus}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm md:text-base font-medium text-contentTextColor mb-2">
          Description (Optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isEditing}
          className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-inputBgColor text-textColor border border-inputBorderColor rounded-lg focus:outline-none focus:border-inputFocusColor disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Brief description..."
        />
      </div>

      {/* System Prompt */}
      <div>
        <label className="block text-sm md:text-base font-medium text-contentTextColor mb-2">
          System Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={!isEditing}
          rows={15}
          className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-inputBgColor text-textColor border border-inputBorderColor rounded-lg focus:outline-none focus:border-inputFocusColor disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          placeholder="Enter system prompt..."
        />
      </div>
    </div>
  );
};

export default PromptEditor;
