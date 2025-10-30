import React from "react";
import { useTheme } from "../../context/ThemeContext"; 

const Logo = () => {
  const { theme } = useTheme();
  
  return (
    <div className="flex justify-center mb-1">
      <img
        src={theme === 'dark' ? "/logo_white.png" : "/logo_black.png"}
        alt="Logo"
        className="h-20 w-36 object-contain transition-opacity duration-300"
      />
    </div>
  );
};

export default Logo;
