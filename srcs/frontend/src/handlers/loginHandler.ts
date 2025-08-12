export async function loginHandler(formId: string) {

	const form = document.getElementById(formId) as HTMLFormElement;
	const errorDiv = document.getElementById("error");
	if (!form) return; // if no form, stop here

	form.addEventListener("submit", async (e) => {
		e.preventDefault(); //prevent reload

		const email = (document.getElementById("email") as HTMLInputElement).value;
		const password = (document.getElementById("password") as HTMLInputElement).value;

		try {
			const res = await fetch("http://localhost:3000/api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ email, password }),
			});

		if (!res.ok) {
			const err = await res.json();
			errorDiv!.textContent = err.message;
		} else {
			const data = await res.json();
			localStorage.setItem("id", data.id);
			console.log("Logged in! Is your id in local storage?");
			window.location.href = "/";
		}} catch (err) {
			errorDiv!.textContent = "Network error. Try again.";
		}
	});
}
