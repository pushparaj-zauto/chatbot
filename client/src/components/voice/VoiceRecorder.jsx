import React, { useState, useRef, useEffect } from "react";
import { Mic, SendIcon} from "lucide-react";
import "./voiceRecorder.css";
import API_ENDPOINTS from "../../services/api/endpoints";
import axiosInstance from "../../services/api/axiosInstance";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const VoiceRecorder = ({ isOpen, onClose, onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const shouldTranscribeRef = useRef(false);

  // Format timer helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Auto-start recording when modal opens
  useEffect(() => {
    if (isOpen) {
      startRecording();
    }
  }, [isOpen]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Only transcribe if shouldTranscribeRef is true
        if (shouldTranscribeRef.current) {
          await sendAudioToBackend(audioBlob);
        }

        // Cleanup
        audioChunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        shouldTranscribeRef.current = false;
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
      onClose();
    }
  };

  // Stop recording and transcribe
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      shouldTranscribeRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  // Cancel recording - close modal
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      shouldTranscribeRef.current = false;

      // Get the stream before stopping
      const stream = mediaRecorderRef.current.stream;

      // Stop the media recorder
      mediaRecorderRef.current.stop();

      // Stop all tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Clear chunks
      audioChunksRef.current = [];
    }

    // Reset state and close
    resetState();
    onClose();
  };

  // Send audio to backend for transcription
  const sendAudioToBackend = async (audioBlob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.CHAT.TRANSCRIBE,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const transcription = response.data.transcription;

      // Automatically send the transcription
      if (transcription && transcription.trim()) {
        onTranscriptionComplete(transcription);
        onClose();
        resetState();
      } else {
        toast.error("No transcription received");
        onClose();
        resetState();
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio. Please try again.");
      onClose();
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setRecordingTime(0);
    setIsRecording(false);
    setIsProcessing(false);
    shouldTranscribeRef.current = false;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="voice-modal"
          className="fixed inset-0 bg-modalBackdrop backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isRecording && !isProcessing) {
              cancelRecording();
            }
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="bg-modalBg rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-borderColor relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
          >
            <div className="flex flex-col items-center gap-6">
              {/* Mic Animation */}
              <div
                className={`mic-animation ${isRecording ? "recording" : ""} ${
                  isProcessing ? "processing" : ""
                }`}
              >
                {isProcessing ? (
                  <div className="soundwave">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </div>

              {/* Status Text */}
              <div className="text-center">
                <p className="text-lg sm:text-xl font-semibold text-textPrimary mb-1">
                  {isProcessing
                    ? "Transcribing..."
                    : isRecording
                    ? "Recording"
                    : "Voice Message"}
                </p>
                {isRecording && (
                  <p className="text-2xl sm:text-3xl font-mono font-bold text-red-600 dark:text-red-500">
                    {formatTime(recordingTime)}
                  </p>
                )}
                {isProcessing && (
                  <p className="text-sm text-textSecondary mt-2">
                    Converting your voice to text
                  </p>
                )}
              </div>

              {/* Control Buttons - Only show during recording */}
              {isRecording && (
                <div className="flex gap-3 w-full flex-wrap justify-center">
                  <button
                    onClick={stopRecording}
                    className="px-6 py-3 bg-brandColor hover:bg-brandHover text-white rounded-lg font-semibold flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <SendIcon className="w-4 h-4 align-middle" />
                    Send
                  </button>
                  <button
                    onClick={cancelRecording}
                    className="px-4 py-3 bg-transparent text-textSecondary border-2 border-borderColor hover:border-danger hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceRecorder;
