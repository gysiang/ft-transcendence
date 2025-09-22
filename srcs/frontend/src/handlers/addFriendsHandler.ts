import { API_BASE } from '../variable.ts'

export async function addFriendsHandler(form: HTMLFormElement) {
	const errorDiv = form.querySelector("#error") as HTMLDivElement;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		try {
			const friend_email = (form.querySelector("#friend-email") as HTMLInputElement)?.value;
			const user_id = localStorage.getItem("id");
			const res = await fetch(`${API_BASE}/api/friend`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ user_id, friend_email }),
			});

			const data = await res.json().catch(() => {
				return {};
			});

			if (!res.ok) {
				errorDiv.textContent = data.message || "Unknown error";
			} else {
				errorDiv.textContent = data.message || "Success!";
				if (user_id)
					fetchFriends(user_id);
			}
		} catch (err: any) {
			errorDiv.textContent = "Network error. Try again.";
		}
	});
}

export async function fetchFriends(userId: string) {
	try {
		const res = await fetch(`${API_BASE}/api/friend/${userId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error("Failed to fetch friends");
		}
		const data = await res.json();
		renderFriendsList(data.friendlist);
		} catch (err: any) {
		console.error("[fetchFriends] ❌", err);
		const ul = document.getElementById("friends-ul");
		if (ul)
			ul.innerHTML = `<li class="text-red-500">Error loading friends</li>`;
	}
}

export function renderFriendsList(friends: any[]) {
	const ul = document.getElementById("friends-ul");
	if (!ul) return;

	ul.innerHTML = "";

	if (friends.length === 0) {
		ul.innerHTML = `<li class="text-gray-500">No friends yet</li>`;
		return;
	}

	for (const f of friends) {
		const li = document.createElement("li");
		li.className = "flex items-center justify-between";
		li.innerHTML = `
			<span>${f.name} (${f.email}) ${f.isLoggedIn ? "🟢" : "⚪"}</span>
			<button class="delete-friend bg-red-500 text-white px-3 py-1 rounded ml-3" data-id="${f.id}">Delete</button>
		`;
		ul.appendChild(li);
	}

	const buttons = ul.querySelectorAll<HTMLButtonElement>(".delete-friend");
	buttons.forEach(button => {
		button.addEventListener("click", () => {
			const friendId = button.dataset.id;
			const userId = localStorage.getItem("id");
		if (friendId && userId)
			deleteFriend(userId, friendId);
		});
	});
}

async function deleteFriend(userId: string, friendId: string) {
	try {
		const res = await fetch(`${API_BASE}/api/friend`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ user_id: userId, friend_id: friendId }),
		});
		const data = await res.json();

		if (res.ok) {
			console.log("[deleteFriend] ✅", data.message);
			fetchFriends(userId);
		} else {
			console.error("[deleteFriend] ❌", data.message);
			alert(data.message || "Failed to delete friend");
		}
	} catch (err: any) {
		console.error("[deleteFriend] ❌", err);
		alert("Error deleting friend");
	}
}
