import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = root.classList.contains("light") ? "light" : "dark";
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const newTheme = theme === "dark" ? "light" : "dark";
    
    root.classList.remove("light", "dark");
    if (newTheme === "light") {
      root.classList.add("light");
    }
    
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
