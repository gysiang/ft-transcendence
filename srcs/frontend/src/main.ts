import { renderApp } from './router';

window.addEventListener("DOMContentLoaded", renderApp);
window.addEventListener("popstate", renderApp);

//change the color of the box + text here
// window.addEventListener('mouseover', () => {
// 	console.log("Changing colour!");
// });

//Also change the Box and text colour
window.addEventListener('click', (e: Event) => {
	const target = e.target as HTMLElement;

	const anchor = target.closest('a');
	if (anchor && anchor.href.startsWith(window.location.origin)) {
		e.preventDefault();

		const href = anchor?.getAttribute('href');
		if (href) {
			history.pushState({}, '', href);
			renderApp(); //renderpages
		}
	}
	e.preventDefault();
	// console.log("Hey you did it!");
});

//updating npm: sudo npm install -g npm@11.5.2
