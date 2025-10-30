import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Bot,
  MessageSquare,
  Database,
  Sun,
  Moon,
  LogOut,
  CalendarCheck,
  PersonStanding,
  Building,
  SettingsIcon,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ theme, toggleTheme, sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const tabs = [
    {
      label: "Chat",
      id: "chat",
      icon: MessageSquare,
      path: "/chat",
      roles: ["super_admin", "admin", "user"],
    },
    {
      label: "Events",
      id: "events",
      icon: CalendarCheck,
      path: "/events",
      roles: ["super_admin", "admin", "user"],
    },
    {
      label: "Persons",
      id: "persons",
      icon: PersonStanding,
      path: "/persons",
      roles: ["super_admin", "admin", "user"],
    },
    {
      label: "Companies",
      id: "companies",
      icon: Building,
      path: "/companies",
      roles: ["super_admin", "admin", "user"],
    },
    {
      label: "Prompt",
      id: "prompt",
      icon: Bot,
      path: "/prompt",
      roles: ["super_admin", "admin", "user"],
    },
    {
      label: "Chunks",
      id: "chunks",
      icon: Database,
      path: "/chunks",
      roles: ["super_admin", "admin", "user"],
    },
    {
      label: "Teams",
      id: "teams",
      icon: Users,
      path: "/teams",
      roles: ["super_admin"],
    },
    {
      label: "Configurables",
      id: "configurables",
      icon: SettingsIcon,
      path: "/configurables",
      roles: ["super_admin"],
    },
  ];

  const visibleTabs = tabs.filter((tab) =>
    tab.roles.includes(user?.role || "user")
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed 
          md:top-0 md:left-0 md:h-full 
          top-14 left-0 h-[calc(100vh-3.5rem)]
          w-56 bg-navBgColor border-r border-borderColor flex flex-col transition-transform z-40
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
      >
        {/* Logo - ONLY on desktop */}
        <div className="hidden md:block p-4 border-b border-borderColor">
          <img
            src={theme === "dark" ? "/logo_white.png" : "/logo_black.png"}
            alt="Logo"
            className="h-10 w-auto transition-opacity duration-300"
          />
        </div>

        {/* Navigation items */}
        <nav className="flex-1 mt-0 md:mt-4">
          {visibleTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                onClick={() => setSidebarOpen(false)}
                className={({
                  isActive,
                }) => `w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                ${
                  isActive
                    ? "bg-brandColor text-white"
                    : "text-textColor hover:bg-aiBgColor"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Theme toggle and logout */}
        <div className="p-4 border-t border-borderColor">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-aiBgColor transition-all"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            <span className="text-textColor">
              {theme === "light" ? "Dark" : "Light"}
            </span>
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
              theme === "dark"
                ? "text-red-400 hover:bg-red-900/20"
                : "text-red-600 hover:bg-red-50"
            }`}
          >
            <LogOut className="mr-3" size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
