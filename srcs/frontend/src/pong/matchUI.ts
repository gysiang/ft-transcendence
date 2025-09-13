import type { Player } from "./types";
import type { Match } from "./Tournament/singleElim";

export function matchUI(players: Player[],rounds?: Match[][]): Promise<void> {
    return new Promise((resolve) => {
      const popup = document.getElementById("match-announcement")!;
      const heading = document.getElementById("match-heading")!;
      const button = document.getElementById("start-match-btn")!;
  
      const left = players.find((p) => p.side === "left")?.name || "Left";
      const right = players.find((p) => p.side === "right")?.name || "Right";
  
      heading.textContent = `${left} vs ${right}`;
      popup.style.display = "flex";
      if (rounds) {
        renderTournamentBracket(rounds);
    }
      button.onclick = () => {
        popup.style.display = "none";
        resolve();
      };
    });

  }

  export function renderTournamentBracket(rounds: Match[][]) {
	const bracket = document.getElementById("bracket");
	if (!bracket) return;

	bracket.innerHTML = ""; 

	rounds.forEach((round, roundIndex) => {
		const roundDiv = document.createElement("div");
		roundDiv.className = "border-t border-white pt-4";

		const heading = document.createElement("h2");
		heading.textContent = `Round ${roundIndex + 1}`;
		heading.className = "text-xl font-bold mb-2";
		roundDiv.appendChild(heading);

		round.forEach((match, matchIndex) => {
			const p1 = match.contestant1?.name || "TBD";
			const p2 = match.contestant2?.name || "BYE";
			const winner = match.winner?.name;

			const matchDiv = document.createElement("div");
			matchDiv.className = "flex justify-between items-center bg-white bg-opacity-10 p-2 rounded";

			matchDiv.innerHTML = `
				<span>${p1} vs ${p2}</span>
				<span class="text-sm text-green-400">${winner ? `Winner: ${winner}` : ""}</span>
			`;

			roundDiv.appendChild(matchDiv);
		});

		bracket.appendChild(roundDiv);
	});
}

import type { TRounds, TPlayer} from '../onlineClient'

// Map TRounds to Match[][]
export function adaptTRoundsToLocal(trounds: TRounds, players: TPlayer[]): Match[][] {
  const nameById = new Map(players.map(p => [p.id, p.name]));

  return trounds.map(round =>
    round.map(tm => {
      const contestant1 = tm.p1
        ? ({ name: nameById.get(tm.p1) ?? '???', side: 'left' } as Player)
        : undefined;

      const contestant2 = tm.p2
        ? ({ name: nameById.get(tm.p2) ?? '???', side: 'right' } as Player)
        : undefined;

      const winner = tm.winner
        ? ({
            name: nameById.get(tm.winner) ?? '???',
            side: tm.winner === tm.p1 ? 'left' : 'right',
          } as Player)
        : null;

      return { contestant1, contestant2, winner } as Match;
    })
  );
}