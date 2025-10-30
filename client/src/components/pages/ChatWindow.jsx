import React, { useEffect, useRef, useState } from "react";
import { Loader2, Bot, Mic } from "lucide-react";
import axiosInstance from "../../services/api/axiosInstance";
import API_ENDPOINTS from "../../services/api/endpoints";
import VoiceRecorder from "../voice/VoiceRecorder";

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // refs to auto-scroll and input focus
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // refocus input after loading completes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Load session history on mount
  useEffect(() => {
    const loadSessionHistory = async () => {
      const storedSessionId = localStorage.getItem("activeSessionId");

      if (!storedSessionId) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        const response = await axiosInstance.get(
          `${API_ENDPOINTS.CHAT.SESSION}/${storedSessionId}`
        );

        if (response.data.isActive && response.data.messages.length > 0) {
          // Restore session
          setSessionId(storedSessionId);
          const restoredMessages = response.data.messages.map((msg) => ({
            from: msg.role === "user" ? "user" : "bot",
            text: msg.content,
          }));
          setMessages(restoredMessages);
        } else {
          // Session inactive, clear localStorage
          localStorage.removeItem("activeSessionId");
        }
      } catch (error) {
        console.error("Error loading session history:", error);
        localStorage.removeItem("activeSessionId");
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadSessionHistory();
  }, []);

  const sendChatMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = messageText;
    setMessages([...messages, { from: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.CHAT.SEND, {
        userMessage: userMessage,
        sessionId: sessionId,
      });

      // Store or update sessionId
      if (!sessionId && response.data.sessionId) {
        setSessionId(response.data.sessionId);
        localStorage.setItem("activeSessionId", response.data.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: response.data.aiResponse },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Sorry, I couldn't process your message. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput("");
    await sendChatMessage(userMessage);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-full bg-chatWindowBg rounded-lg border border-borderColor shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brandColor" />
          <p className="text-sm text-contentTextColor">Loading chat...</p>
        </div>
      </div>
    );
  }

  const handleVoiceTranscription = async (transcription) => {
    await sendChatMessage(transcription);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen bg-chatWindowBg rounded-lg border border-borderColor shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-borderColor bg-gradient-to-r from-brandColor to-brandHover">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-white font-semibold text-lg">Groot Assistant</h2>
          <p className="text-white/80 text-xs">
            Your AI-powered personal assistant
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-white/90 text-xs font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.from === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`inline-block max-w-[70%] rounded-lg p-3 ${
                msg.from === "user"
                  ? "bg-gradient-to-r from-brandColor to-brandHover text-userTextColor"
                  : "bg-aiBgColor text-contentTextColor border border-aiBorderColor"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="inline-block max-w-[70%] rounded-lg p-3 bg-aiBgColor text-contentTextColor border border-aiBorderColor">
              <div className="flex gap-1">
                <span>Thinking</span>
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          </div>
        )}
        {/* scroll to bottom anchor  */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-borderColor bg-inputBgColor">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-inputBgColor text-textColor border border-inputBorderColor focus:outline-none focus:border-inputFocusColor transition-colors"
            autoFocus
          />
          {/* Mic button - Beautiful version */}
          <button
            onClick={() => setShowVoiceModal(true)}
            disabled={isLoading}
            title="Voice message"
            className="group relative p-3 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
          >
            <Mic
              size={20}
              className="relative z-10 group-hover:scale-110 transition-transform duration-200"
            />
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
          </button>
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="px-6 py-2 bg-brandColor hover:bg-brandHover text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send
          </button>
        </div>
      </div>

      {/* Voice Recorder Modal */}
      <VoiceRecorder
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onTranscriptionComplete={handleVoiceTranscription}
      />
    </div>
  );
};

export default ChatWindow;
