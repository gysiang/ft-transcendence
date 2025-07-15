
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="h-screen flex items-center justify-center flex-col
 bg-gray-100">
	<h1 class="text-2xl font-bold">Login</h1>
	<form id="login-form" class="space-y-1">
		<input
			id="username"
			type="text"
			placeholder="Username"
			class="w-2xs text-center border-neutral-900 border-2 border-solid rounded p-1"
			required />
			<br>
		<input
			id="password"
			type="password"
			placeholder="Password"
			class="w-2xs text-center border-neutral-900 border-2 border-solid rounded p-1"
			required />
		<br>
		<button class="w-2xs bg-sky-500 text-neutral-950 p-2 rounded-md">Login</button>
	</form>
  </div>
`
