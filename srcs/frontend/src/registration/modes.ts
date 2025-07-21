import { quickplayForm } from "./registrationForm";

export function renderModes(app: HTMLElement): void {

    app.innerHTML = `
    <div class="text-center pt-10 space-y-8">
      <h1 class="text-3xl text-black">Choose Game Mode</h1>
      <div class="flex justify-center gap-6">
        <button id="quickplayBtn" class="bg-indigo-800 w-56 px-10 py-5 text-xl uppercase tracking-widest text-white hover:bg-white hover:text-black rounded-full transition">
            Quickplay
        </button>
        <button class="bg-indigo-800 w-56 px-10 py-5 text-xl uppercase tracking-widest text-white hover:bg-white hover:text-black rounded-full transition">
            Tournament
        </button>
        </div>
    </div>
  `;
  setTimeout(() => {
    document.getElementById("quickplayBtn")?.addEventListener("click", () => {
        quickplayForm(app);
    });
  },0);
}
