import { renderApp } from './router';

window.addEventListener("DOMContentLoaded", renderApp);
window.addEventListener("popstate", renderApp);
