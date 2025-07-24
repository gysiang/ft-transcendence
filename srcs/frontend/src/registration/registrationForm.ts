
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
                <label class="block mb-2"> Player 2 Alias </label>
                <input id ="player2" type ="text" class="w-full px-4 py-2 text-black rounded-md"/>
            </div>
            <div class="flex items-center">
            <p class="mr-4 text-sm font-medium text-gray-900 dark:text-black"> Player 1 side</p>
            <label class="relative cursor-pointer">
            <input type="checkbox" class="sr-only peer" />
            <div class="w-[53px] h-7 flex items-center bg-gray-300 rounded-full text-[9px] peer-checked:text-[#007bff] text-gray-300 font-extrabold after:flex after:items-center after:justify-center peer after:content-['left'] peer-checked:after:content-['Right'] peer-checked:after:translate-x-full after:absolute after:left-[2px] peer-checked:after:border-white after:bg-white after:border after:border-gray-300 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#007bff]">
            </div>
            </label>
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
                    const sideToggle = document.querySelector("input[type='checkbox'].peer") as HTMLInputElement;
                    const players: { name: string; side: "left" | "right" }[] = [];
                    const name1 = (document.getElementById("player1") as HTMLInputElement).value || "Player 1";
                    const name2 = (document.getElementById("player2") as HTMLInputElement).value || "Player 2";
                    const side1: "left" | "right" = sideToggle?.checked ? "right" : "left";
                    const side2: "left" | "right" = side1 === "left" ? "right" : "left";
                    players.push({ name: name1, side: side1 });
                    players.push({ name: name2, side: side2 });
                    const goals = parseInt((document.getElementById("goalLimit") as HTMLInputElement).value, 10) || 5;
                    localStorage.setItem("players", JSON.stringify(players));
                    localStorage.setItem("goalLimit", goals.toString());
                    localStorage.setItem("mode", "quickplay");
                    window.history.pushState({}, "", "/game");
                    window.dispatchEvent(new Event("popstate"));
                });
            }, 0);
}

export function tournamentForm(app: HTMLElement): void{
    app.innerHTML=
    `
    <div class = "max-w-md mx-auto mt-12 text-whitw space-y-6">
    <h2 class="text-3xl text-center"> Tournament Setup </h2>

    <div>
    <label class="block mb-2">Tournament Name</label>
    <input id="tournamentName" type="text" class="w-full px-4 py-2 text-black rounded-md" />
    </div>

    <div>
        <label class="block mb-2">Number of Players (2-8)</label>
        <input id="numPlayers" type="number" min="2" max="8" value="4" class="w-full px-4 py-2 text-black rounded-md" />
    </div>

    <div id="playerInputs" class="space-y-4"></div>

    <div>
        <label class="block mb-2">Goals to Win</label>
        <input id="goalLimit" type="number" min="1" max="20" value="5" class="w-full px-4 py-2 text-black rounded-md" />
    </div>

    <button id="startTournament" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md text-xl">
        Start Tournament
    </button>
</div>
`;
const numPlayersInput = document.getElementById("numPlayers") as HTMLInputElement;
  const playerInputsContainer = document.getElementById("playerInputs")!;

  function renderPlayerInputs(count: number) {
    playerInputsContainer.innerHTML = "";
    for (let i = 1; i <= count; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = `Player ${i} Alias`;
      input.id = `player${i}`;
      input.className = "w-full px-4 py-2 text-black rounded-md";
      playerInputsContainer.appendChild(input);
    }
  }
  renderPlayerInputs(parseInt(numPlayersInput.value, 10));

  numPlayersInput.addEventListener("input", () => {
    const count = Math.max(2, Math.min(8, parseInt(numPlayersInput.value, 10)));
    renderPlayerInputs(count);
  });
}
