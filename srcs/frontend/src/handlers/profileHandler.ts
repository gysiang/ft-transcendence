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
		}} catch (err: any) {
			errorDiv!.textContent = "Network error. Try again.";
		}
	});
}


export async function profilepicHandler(fileInputId: string) {
	const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
	const userId = localStorage.getItem("id");
	const profilepic = document.getElementById("profile-pic") as HTMLImageElement;

	fileInput.addEventListener("change", async() => {
		const file = fileInput.files?.[0];
		if (file) {
			const maxSize = 40 * 1024;
			if (file.size > maxSize) {
				alert("File size exceeds 40 KB limit.");
				fileInput.value = "";
				return;
			}
		const reader = new FileReader();
		reader.onload = (e) => {
			profilepic.src = e.target?.result as string;
		};
		reader.readAsDataURL(file);

		const formData = new FormData();
		formData.append("profile_picture", file);
		try {
			const res = await fetch(`http://localhost:3000/api/profile/${userId}/pic`, {
				method: "PATCH",
				body: formData,
				credentials: "include",
			});

			if (!res.ok) throw new Error("Upload failed");
				const data = await res.json();
				profilepic.src = data.image;
				} catch (err: any) {
				console.error("Error uploading image:", err);
				}
			}

	})
}
