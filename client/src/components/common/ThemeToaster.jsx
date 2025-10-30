import { Toaster } from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext"; 

const ThemeToaster = () => {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        // Base styles that work with both themes
        style: {
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
        },
        // Success toast styling
        success: {
          style: {
            background: theme === 'dark' ? '#065f46' : '#10B981',
            color: theme === 'dark' ? '#d1fae5' : '#ffffff',
          },
          iconTheme: {
            primary: theme === 'dark' ? '#34d399' : '#ffffff',
            secondary: theme === 'dark' ? '#065f46' : '#10B981',
          },
        },
        // Error toast styling
        error: {
          style: {
            background: theme === 'dark' ? '#7f1d1d' : '#EF4444',
            color: theme === 'dark' ? '#fecaca' : '#ffffff',
          },
          iconTheme: {
            primary: theme === 'dark' ? '#f87171' : '#ffffff',
            secondary: theme === 'dark' ? '#7f1d1d' : '#EF4444',
          },
        },
        // Loading toast styling
        loading: {
          style: {
            background: theme === 'dark' ? '#1e293b' : '#3B82F6',
            color: theme === 'dark' ? '#cbd5e1' : '#ffffff',
          },
        },
      }}
    />
  );
};

export default ThemeToaster;
