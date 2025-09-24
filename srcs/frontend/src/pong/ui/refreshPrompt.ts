
function onBeforeUnload(e: BeforeUnloadEvent) {
    e.preventDefault();     
    e.returnValue = '';     // needed for chrome
  }
let refreshGuard = false;

export function enableUnloadGuard() {
  if (refreshGuard) return;
  refreshGuard = true;
  window.addEventListener('beforeunload', onBeforeUnload, { capture: true });
}

export function disableUnloadGuard() {
  if (!refreshGuard) return;
  refreshGuard = false;
  window.removeEventListener('beforeunload', onBeforeUnload, { capture: true });
}