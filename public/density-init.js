(function () {
  try {
    var key = 'stableroute.density';
    var stored = localStorage.getItem(key);
    var density = stored === 'compact' ? 'compact' : 'comfortable';
    document.documentElement.setAttribute('data-density', density);
  } catch (_) {
    /* ignore */
  }
})();
