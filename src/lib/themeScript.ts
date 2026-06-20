import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Builds the tiny inline script that applies the stored theme before React hydrates.
 */
export function buildThemeInitScript() {
  return `(function(){try{var key=${JSON.stringify(
    THEME_STORAGE_KEY,
  )};var stored;try{stored=window.localStorage.getItem(key);}catch(e){}var theme=stored==="light"||stored==="dark"||stored==="system"?stored:"system";var prefersDark=false;try{prefersDark=!!(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);}catch(e){}document.documentElement.classList.toggle("dark",theme==="dark"||(theme==="system"&&prefersDark));}catch(e){}})();`;
}
