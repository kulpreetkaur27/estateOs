// ThemeContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

const themeMapping = {
  purple: {
    primaryBg: "bg-purple-600",
    primaryHover: "hover:bg-purple-500",
    focusRing: "focus:ring-purple-500",
    // Hex for charts, etc.
    fill: "#8B5CF6",
  },
  pink: {
    primaryBg: "bg-pink-600",
    primaryHover: "hover:bg-pink-500",
    focusRing: "focus:ring-pink-500",
    fill: "#DB2777",
  },
  black: {
    primaryBg: "bg-black",
    primaryHover: "hover:bg-gray-800",
    focusRing: "focus:ring-gray-800",
    fill: "#1F2937",
  },
  navy: {
    primaryBg: "bg-blue-900",
    primaryHover: "hover:bg-blue-800",
    focusRing: "focus:ring-blue-800",
    fill: "#1E40AF",
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("purple");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme && themeMapping[storedTheme]) {
      setTheme(storedTheme);
    }
  }, []);

  const changeTheme = (newTheme) => {
    if (themeMapping[newTheme]) {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, themeClasses: themeMapping[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};
