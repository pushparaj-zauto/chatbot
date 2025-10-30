import React, { useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

const CustomDropdown = ({
  label,
  value,
  options,
  onChange,
  placeholder = "All",
  isOpen,
  onToggle,
  className = "",
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  const displayText = value || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => onToggle(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white dark:bg-[#1a1f2e] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {label}:
          </span>
          <span
            className={
              value ? "text-gray-900 dark:text-white" : "text-gray-400"
            }
          >
            {displayText}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1a1f2e] border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <button
            onClick={() => {
              onChange("");
              onToggle(false);
            }}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-[#0f1419] flex items-center justify-between transition-colors"
          >
            <span
              className={
                !value ? "text-gray-900 dark:text-white" : "text-gray-500"
              }
            >
              {placeholder}
            </span>
            {!value && <Check size={16} className="text-blue-500" />}
          </button>
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                onToggle(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-[#0f1419] flex items-center justify-between border-t border-gray-200 dark:border-gray-700 transition-colors"
            >
              <span
                className={
                  value === option
                    ? "text-gray-900 dark:text-white capitalize"
                    : "text-gray-500 dark:text-gray-300 capitalize"
                }
              >
                {option}
              </span>
              {value === option && (
                <Check size={16} className="text-blue-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
