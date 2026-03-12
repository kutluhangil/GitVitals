import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = 'dark' | 'light';
type Lang = 'en' | 'tr';

interface AppContextType {
  theme: Theme;
  lang: Lang;
  toggleTheme: () => void;
  setLang: (l: Lang) => void;
}

const AppContext = createContext<AppContextType>({
  theme: 'dark',
  lang: 'en',
  toggleTheme: () => {},
  setLang: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('gv-theme') as Theme;
    return stored || 'dark';
  });
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('gv-lang') as Lang;
    return stored || 'en';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('gv-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('gv-lang', l);
  };

  return (
    <AppContext.Provider value={{ theme, lang, toggleTheme, setLang }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
