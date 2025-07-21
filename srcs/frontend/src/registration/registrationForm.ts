
export function quickplayForm(app: HTMLElement): void
{
    app.innerHTML = `
        <div class = "max-w-md mx-auto mt-12 text-whitw space-y-6">
            <h2 class="text-3xl text-center"> Quickplay Setup </h2>
            <div>
                <label class="block mb-2"> Player 1 Alias </label>
                <input id ="player1" type ="text" class="w-full px-4 py-2 text-black rounded-md "/>
            </div>
            <div>
                <label class="block mb-2"> Player 2 Alias </lable>
                <input id ="player2" type ="text" class="w-full px-4 py-2 text-black rounded-md"/>
            </div>
            <div>
                <label for="goalLimit" class="block mb-2"> Goals </label>
                <input id="goalLimit" type = "number" min="1" max="10" value="5" class="w-full px-4 py-2 text-black rounded-md" />
            <button id ="quickplayStart" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md text-xl">
                Start
            </button>
        </div>
            `;
            setTimeout(() => {
                const button = document.getElementById("quickplayStart");
                button?.addEventListener("click", () => {
                  const player1 = (document.getElementById("player1") as HTMLInputElement).value || "Player 1";
                  const player2 = (document.getElementById("player2") as HTMLInputElement).value || "Player 2";
                  const goals = parseInt((document.getElementById("goalLimit") as HTMLInputElement).value, 10) || 5;
            
                  console.log("Starting game with:", player1, player2, goals);
            
                  window.history.pushState({}, "", "/game");
                  window.dispatchEvent(new Event("popstate"));
                });
              }, 0);
}
