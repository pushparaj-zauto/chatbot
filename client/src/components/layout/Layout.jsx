import React, { useEffect, useState } from "react";
import Sidebar from "./SideBar";
import { useTheme } from "../../context/ThemeContext"; 
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // reset - sidebar open state when resizing to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    // cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
      <div className="flex h-screen bg-bgColor text-textColor">
        {/* Mobile header */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-navBgColor border-b border-borderColor flex items-center justify-between px-4 z-50">
          <img
            src={theme === "dark" ? "/logo_white.png" : "/logo_black.png"}
            alt="zauto.ai"
            className="h-8 w-auto"
          />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-textColor rounded-md hover:bg-aiBgColor"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Sidebar */}
        <Sidebar
          theme={theme}
          toggleTheme={toggleTheme}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main content*/}
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0 md:ml-56">
            <Outlet/>
        </main>
      </div>
  );
};

export default Layout;
