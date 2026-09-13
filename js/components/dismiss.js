// One delegated closer for all menus/popovers, installed once at boot.
export function installDismissers() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-wrap')) {
      document.querySelectorAll('.menu:not([hidden])').forEach((m) => { m.hidden = true; });
    }
    if (!e.target.closest('.icon-field-wrap')) {
      document.querySelectorAll('.popover:not([hidden])').forEach((p) => { p.hidden = true; });
    }
  });
}