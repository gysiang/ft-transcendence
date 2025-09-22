/*import { tournamentForm, quickplayForm } from "./registrationForm";
import { renderTournamentScreen } from "../../TournamentLobby";
import { checkAuthentication } from "./auth";
import { getLoggedInUserName } from "./registrationForm";

export function renderModes(app: HTMLElement): void {

    app.innerHTML = `
    <div class="text-center pt-10 space-y-8">
      <h1 class="text-3xl text-black">Choose Game Mode</h1>
      <div class="flex justify-center gap-6">
        <button id="quickplayBtn" class="bg-indigo-800 w-56 px-10 py-5 text-xl uppercase tracking-widest text-white hover:bg-white hover:text-black rounded-full transition">
            Quickplay
        </button>
        <button id="TournamentBtn" class="bg-indigo-800 w-56 px-10 py-5 text-xl uppercase tracking-widest text-white hover:bg-white hover:text-black rounded-full transition">
            Tournament
        </button>
        <button id="OnlineTournamentBtn" class="bg-purple-700 w-56 px-10 py-5 text-xl uppercase tracking-widest text-white hover:bg-white hover:text-black rounded-full transition">
          Online Tournament
        </button>
        </div>
    </div>
  `;
  setTimeout(() => {
    document.getElementById("quickplayBtn")?.addEventListener("click", () => {
      quickplayForm(app);
    });

    document.getElementById("TournamentBtn")?.addEventListener("click", () => {
      tournamentForm(app);
    });
    document.getElementById("OnlineTournamentBtn")?.addEventListener("click", async() => {
      const authed = await checkAuthentication();
      if (!authed) {
        alert("You must be logged in to use Online Tournament.");
          window.location.href = "/login";
        return;
      }
      const alias = (await getLoggedInUserName()) ?? '';
      app.innerHTML = '';
    renderTournamentScreen(app, { alias, lockAlias: true });});
  }, 0);
}
*/
