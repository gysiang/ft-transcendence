export async function signupHandler(formId: string) {

const form = document.getElementById(formId) as HTMLFormElement;
const errorDiv = document.getElementById("error");

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const username = (document.getElementById("username") as HTMLInputElement).value;
		const email = (document.getElementById("email") as HTMLInputElement).value;
		const password = (document.getElementById("password") as HTMLInputElement).value;

		try {
			const res = await fetch("http://localhost:3000/api/signup",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ username, email, password }),
			});

		if (!res.ok) {
			const err = await res.json();
			errorDiv!.textContent = err.message;
		} else {
			window.location.href = "/";
		}} catch (err) {
			errorDiv!.textContent = "Network error. Try again.";
		}
	});
}

export async function googleHandler(buttonId: string) {
	const googleButton = document.getElementById(buttonId);
	if (!googleButton) return;

	googleButton.addEventListener('click', () => {
		window.location.href = 'http://localhost:3000/auth/google';
	});
}
