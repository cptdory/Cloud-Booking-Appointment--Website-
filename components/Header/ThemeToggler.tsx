import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const ThemeToggler = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      aria-label="theme toggler"
      onClick={toggleTheme}
      className="flex items-center justify-center rounded-full bg-gray-2 dark:bg-dark-bg text-white h-9 w-9 md:h-14 md:w-14"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 md:h-6 md:w-6" />
      ) : (
        <Moon className="h-5 w-5 md:h-6 md:w-6" />
      )}
    </button>
  );
};

export default ThemeToggler;
