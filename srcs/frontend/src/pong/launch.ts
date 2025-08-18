import { Game } from "./Pong";
import type { Player } from "./types";
import { advanceToNextMatchOrRound } from "./Tournament/TournamentUtils";
import type { Match } from "./Tournament/singleElim";
import { matchUI} from "./matchUI";
import { createMatch } from "./Tournament/backendutils";
import { checkAuthentication } from "./registration/auth";

async function launchGame(
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	players: Player[],
	goalLimit: number,
	onFinish: (winner: Player, score: [number, number]) => void,
	rounds?: Match[][]
  ): Promise<void> {
	await matchUI(players, rounds);
	const game = new Game(canvas, ctx, players, goalLimit, (winner, score) => {
	  onFinish(winner, score); 
	});
	game.startCountdown();
  }

export async function startGame(canvas: HTMLCanvasElement) {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Canvas not supported");
	}

	const mode = localStorage.getItem("mode");
	const goalLimit = parseInt(localStorage.getItem("goalLimit") || "5", 10);

	if (mode === "quickplay") {
		const players = JSON.parse(localStorage.getItem("players") || "[]");
		await launchGame(canvas, ctx, players, goalLimit, () => {
			localStorage.clear();
			setTimeout(() => {
				window.location.href = "/play";
			}, 2000);
		});
	}
	else if (mode === "tournament")
	{

		const tournamentData = JSON.parse(localStorage.getItem("tournamentData") || "{}");
		let { rounds, currentRoundIndex, currentMatchIndex } = tournamentData;
		const match: Match = rounds[currentRoundIndex][currentMatchIndex];

		if (!match.contestant1 || !match.contestant2) {
			match.winner = match.contestant1 || match.contestant2 || null;
			const result = advanceToNextMatchOrRound(match, rounds, currentRoundIndex, currentMatchIndex, goalLimit);
			if (!result.done && result.updatedData) {
				startGame(canvas); 
			}
			return;
		}

		const players: Player[] = [
			{ ...match.contestant1, side: "left" },
			{ ...match.contestant2, side: "right"},
		];
		await launchGame(canvas, ctx, players, goalLimit,
			async (winner, score) => {
			if (await checkAuthentication()) {
					try {
			 
				const snapshot = JSON.parse(localStorage.getItem('tournamentSnapshot') || 'null');
				const tournamentId = snapshot?.id;
		  
				if (tournamentId != null) {
				  await createMatch({
					player1_alias: players[0].name,      
					player2_alias: players[1].name,
					player1_score: score[0],
					player2_score: score[1],
					winner: winner.name,                 
					tournament_id: tournamentId,
				  });
				} else {
				  console.warn('Tournament id missing');
				}
			  } catch (e) {
				console.error('Failed to save match result:', e);
			  }
		  
			  match.winner = winner;
			  const result = advanceToNextMatchOrRound(
				match, rounds, currentRoundIndex, currentMatchIndex, goalLimit
			  );
		  
			  if (!result.done) {
				startGame(canvas); 
			  } else {
				const snapshot = JSON.parse(localStorage.getItem('tournamentSnapshot') || 'null');
				if (snapshot) {
				  snapshot.finished = true;
				  localStorage.setItem('tournamentSnapshot', JSON.stringify(snapshot));
				}
			  }
			}
			},
			rounds
		  );
	}
}
