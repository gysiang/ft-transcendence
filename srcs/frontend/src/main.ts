import { renderApp } from './router';

window.addEventListener("DOMContentLoaded", renderApp);
window.addEventListener("popstate", renderApp);


window.addEventListener('click', (e: Event) => {
	const target = e.target as HTMLElement;
	const anchor = target.closest('a');

	if (anchor && anchor.href.startsWith(window.location.origin)) {
		e.preventDefault();

		const href = anchor?.getAttribute('href');
		if (href) {
			history.pushState({}, '', href);
			renderApp();
		}
	}
});

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");

  if (userId) {
    localStorage.setItem("id", userId);
    window.history.replaceState({}, document.title, "/");
	renderApp();
  }
});
