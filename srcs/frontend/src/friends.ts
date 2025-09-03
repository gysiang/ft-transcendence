import { renderHeader } from "./components/header";
import { addFriendsHandler, fetchFriends, renderFriendsList } from "./handlers/addFriendsHandler";

export function renderFriendsPage(container: HTMLElement) {

	renderHeader(container);

	const friendWrapper = document.createElement("div");
	friendWrapper.innerHTML = `
	<div class="h-screen flex items-center justify-center flex-col bg-gray-100">
	<h1 class="text-2xl font-bold mb-4">Add Friends</h1>
			<form id="addfriends-form" class="space-y-3">
				<div class="flex flex-row items-center">
					<p class="pr-4">Email:</p>
					<input
						id="friend-email"
						type="email"
						class="w-40 text-center border-grey-500 border rounded p-1"
						required
					/>
				</div>
				<button type="submit" id ="friend-submit" class="bg-sky-500 text-white p-2 rounded-md w-full">Submit</button>
				<div id="error" class="text-red-500 mt-2"></div>
			</form>
			<div id="friends-list" class="mt-6 space-y-2">
				<h2 class="text-xl font-semibold">Your Friends</h2>
				<ul id="friends-ul" class="list-disc pl-5"></ul>
			</div>
	</div>
	`
	container.append(friendWrapper);

	const form = friendWrapper.querySelector("form") as HTMLFormElement;
	if (form) {
		addFriendsHandler(form);
		console.log("[renderFriend] ✅ Handler attached");
	} else {
		console.log("[renderFriend] ❌ Could not find form inside container");
	}
	const userId = localStorage.getItem("id");
	if (userId)
		fetchFriends(userId);

}
