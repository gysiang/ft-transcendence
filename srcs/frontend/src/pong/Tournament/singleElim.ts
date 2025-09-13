import type { Player } from "../types";
import { shuffle } from "./TournamentUtils";

export type Match ={
    contestant1: Player;
    contestant2?: Player | null;
    winner?: Player | null; //Player's ID
}
export type Round = Match[];
export type Tournament = Round[];

export function generateFirstRound(players: Player[]): Round {

    const shuffled = shuffle([...players]);
    const matches: Round =[ ];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
        matches.push({
          contestant1: shuffled[i],
          contestant2: shuffled[i + 1]
        });
      }
      if (shuffled.length % 2 === 1) {
        matches.push({
          contestant1: shuffled[shuffled.length - 1],
          contestant2: null
        });
      }
      return matches;
}

export function generateRound(players: Player[]): Match[] {
	const matches: Match[] = [];

	for (let i = 0; i < players.length - 1; i += 2) {
		const left: Player = { ...players[i], side: "left"};
		const right: Player = { ...players[i + 1], side: "right"};
		matches.push({
			contestant1: left,
			contestant2: right,
		});
	}

	if (players.length % 2 === 1) {
		const bye: Player = { ...players[players.length - 1], side: "left" as "left" };
		matches.push({
			contestant1: bye,
			contestant2: null,
		});
	}

	return matches;
}

export function getWinners(round: Round): Player[] {
  const winners: Player[] = [];

  for (const match of round) {
    if (match.contestant2 === null) {
      winners.push(match.contestant1);
    } else if (match.winner) {
      winners.push(match.winner);
    } else {
      console.warn("Match has no winner yet:", match);
    }
  }

  return winners;
}

export function runTournament(players: Player[]): Tournament{
    const tournament: Tournament = [];
    let currentRound = generateFirstRound(players);
    tournament.push(currentRound);

    while (true)
        {
            const winners = getWinners(currentRound);
            if (winners.length <= 1)
                break;
            currentRound = generateRound(winners);
            tournament.push(currentRound);
        }
    return tournament;

}