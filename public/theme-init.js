(function () {
  try {
    var key = "stableroute.theme";
    var stored = localStorage.getItem(key);
    var theme =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    var dark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch (_) {
    /* ignore */
  }
})();
