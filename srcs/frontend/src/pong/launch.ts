import { Game } from "./Pong";
import type { Player } from "./types";
import { advanceToNextMatchOrRound } from "./Tournament/TournamentUtils";
import type { Match } from "./Tournament/singleElim";
import { matchUI} from "./matchUI";

async function launchGame(  canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	players: Player[],
	goalLimit: number,
	onFinish: (winner: Player) => void, rounds?: Match[][]):Promise<void>
{
	await matchUI(players, rounds);
	const game = new Game(canvas, ctx, players, goalLimit, (winner) => {
		onFinish(winner);
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
			{ ...match.contestant1, side: "left" as "left" },
			{ ...match.contestant2, side: "right" as "right" },
		];
		await launchGame(canvas, ctx, players, goalLimit, (winner) => {
			match.winner = winner;
			const result = advanceToNextMatchOrRound(match, rounds, currentRoundIndex, currentMatchIndex, goalLimit);
			if (!result.done)
				startGame(canvas);
		}, rounds);
	}
}
