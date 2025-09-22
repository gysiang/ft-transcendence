import { Game } from "./Pong";
import type { Player } from "./types";
import { advanceToNextMatchOrRound } from "./Tournament/TournamentUtils";
import type { Match } from "./Tournament/singleElim";
import { matchUI} from "./matchUI";
import { createMatch } from "./Tournament/backendutils";
import { checkAuthentication } from "./registration/auth";
import { clearGameStorage } from "./Tournament/TournamentUtils";
import { openWs,type MatchHandlers, type StartMsg,type StateMsg, type EndMsg } from "./Tournament/wsClient";
import { lockCanvasAtCurrent, unlockCanvas,lockCanvasWorld } from "./Renderer";
import { getLoggedInUserName } from "./registration/registrationForm";
import { renderTournamentVictoryScreen } from "./ui/victoryScreen";

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

	const rawMode = localStorage.getItem("mode");
	const goalLimit = parseInt(localStorage.getItem("goalLimit") || "5", 10);
	const mode = (rawMode === "online-quickmatch") ? "online" : rawMode;
  	console.log("[startGame] mode =", rawMode, "→", mode, "goalLimit =", goalLimit);
	  if (mode === 'online') {
		let game: Game | null = null;
	  
		const handlers: MatchHandlers = {
		  onStart: (msg: StartMsg) => {
			const { goalLimit: gl, side, world } = msg;
			const W = world?.w ?? 800;
			const H = world?.h ?? 600;
			lockCanvasWorld(canvas, world?.w ?? 800, world?.h ?? 600);
	  
			const players: Player[] = side === 'left'
			  ? [{ name: 'You', side: 'left' }, { name: 'Opponent', side: 'right' }]
			  : [{ name: 'Opponent', side: 'left' }, { name: 'You', side: 'right' }];
	  
			game = new Game(canvas, ctx, players, gl);
			game.enableNetMode();
			game.startCountdown();
		  },
		  onState: (s: StateMsg) => game?.applyNetState(s as any),
		  onEnd:   (e: EndMsg)   => {
			unlockCanvas(canvas);
			alert(`${e.winnerSide === 'left' ? 'Left' : 'Right'} wins ${e.score[0]}–${e.score[1]}`);
			setTimeout(() => { localStorage.removeItem('mode'); window.location.href = '/play'; }, 1000);
		  }
		};
	  
		const api = openWs(handlers);
		api.queue(goalLimit);
		return;
	  }
	if (mode === "quickplay") {
		const players = JSON.parse(localStorage.getItem("players") || "[]");
		lockCanvasAtCurrent(canvas);
		await launchGame(canvas, ctx, players, goalLimit, () => {
			clearGameStorage();
			unlockCanvas(canvas);
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
				localStorage.setItem("tournamentData", JSON.stringify(result.updatedData));
				({ rounds, currentRoundIndex, currentMatchIndex } = result.updatedData as any);
				startGame(canvas); 
			}
			return;
		}

		const players: Player[] = [
			{ ...match.contestant1, side: "left" },
			{ ...match.contestant2, side: "right"},
		];
		lockCanvasAtCurrent(canvas);
		await launchGame(canvas, ctx, players, goalLimit, async (winner, score) => {
			match.winner = winner;
			unlockCanvas(canvas);
			const finalMatch =
			  currentRoundIndex === rounds.length - 1 &&
			  currentMatchIndex === rounds[currentRoundIndex].length - 1;
		  
			const persist = (async () => {
			  try {
				const authed = await checkAuthentication();
				if (!authed) return; // localonly tournament
		  
				const snapshot = JSON.parse(localStorage.getItem('tournamentSnapshot') || 'null');
				const tournamentId = snapshot?.id;
				const currentUserIdRaw = localStorage.getItem('id');
				const currentUserId = currentUserIdRaw ? Number(currentUserIdRaw) : NaN;
				const loggedInAlias = await getLoggedInUserName().catch(() => null);
				const p1Alias = players[0].name;
				const p2Alias = players[1].name;

				const p1Id = currentUserId && loggedInAlias === p1Alias ? currentUserId : null;
        		const p2Id = currentUserId && loggedInAlias === p2Alias ? currentUserId : null;
				const wName = winner.name;
        		const wId   = currentUserId && loggedInAlias === wName ? currentUserId : null;

				if (tournamentId == null) return;
		  
				await createMatch({
					tournament_id: tournamentId,
          			player1_alias: p1Alias,
          			player2_alias: p2Alias,
          			player1_id: p1Id,
          			player2_id: p2Id,
          			player1_score: score[0],
          			player2_score: score[1],
          			winner_id: wId,                       // number or null
          			winner_alias: wName
				});
			  } catch (e) {
				console.error('Failed to save match result:', e);
			  }
			})();
		  
			if (finalMatch) {
			  await persist;
			}
			const result = advanceToNextMatchOrRound(
			  match, rounds, currentRoundIndex, currentMatchIndex, goalLimit
			);
		  
			if (!result.done && result.updatedData) {
			  localStorage.setItem("tournamentData", JSON.stringify(result.updatedData));
			  startGame(canvas);
			} else {
			unlockCanvas(canvas);
		  
			const app = document.getElementById("app")!;
			const winnerAlias = result.tournamentWinner?.name ?? winner.name;
			renderTournamentVictoryScreen(app, winnerAlias);	}		
		  }, rounds);
		
	}
}
