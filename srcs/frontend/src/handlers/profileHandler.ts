export async function profileHandler(formId: string) {

const form = document.getElementById(formId) as HTMLFormElement;
const errorDiv = document.getElementById("error");

if (!form) return;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const name = (document.getElementById("name") as HTMLInputElement).value;
		const email = (document.getElementById("email") as HTMLInputElement).value;

		try {
			const userId = localStorage.getItem("id"); // same as in profile.ts
			const res = await fetch(`http://localhost:3000/api/profile/${userId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ name, email }),
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
