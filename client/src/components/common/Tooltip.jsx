import React, { useState } from 'react';

const Tooltip = ({ children, text, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2',
    bottom: 'bottom-full left-1/2 -translate-x-1/2',
    left: 'left-full top-1/2 -translate-y-1/2',
    right: 'right-full top-1/2 -translate-y-1/2',
  };

  const arrowBorderClasses = {
    top: 'border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-gray-100',
    bottom:
      'border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-gray-900 dark:border-b-gray-100',
    left: 'border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900 dark:border-l-gray-100',
    right:
      'border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900 dark:border-r-gray-100',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && text && (
        <div
          className={`absolute ${positionClasses[position]} z-50 pointer-events-none`}
        >
          <div className="relative">
            {/* Tooltip content */}
            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
              {text}
            </div>
            {/* Arrow */}
            <div
              className={`absolute ${arrowClasses[position]} w-0 h-0 ${arrowBorderClasses[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
