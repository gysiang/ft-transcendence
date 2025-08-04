import type { Match } from "./singleElim";
import type { Player } from "../types";
import { generateRound } from "./singleElim";

export function sanitizeRounds(rounds: Match[][]): Match[][] {
  return rounds.map((round) =>
    round.map((m) => ({
      contestant1: m.contestant1 ?? null,
      contestant2: m.contestant2 ?? null,
      winner: m.winner ?? null,
    }))
  );
}

export function advanceToNextMatchOrRound(match: Match, rounds: Match[][], currentRoundIndex: number, currentMatchIndex: number, goalLimit: number
): { done: boolean; updatedData?: object }
{
	const winners = rounds[currentRoundIndex]
		.map((m: Match) => m.winner)
		.filter((p: Player | null | undefined): p is Player => !!p);

    const isLastMatchOfRound = currentMatchIndex + 1 >= rounds[currentRoundIndex].length;

    if (isLastMatchOfRound)
      {
      const winners = rounds[currentRoundIndex]
        .map((m) => m.winner)
        .filter((p: Player | null | undefined): p is Player => !!p);
    
      if (winners.length === 1) {
        alert(`${winners[0].name} wins the tournament!`);
        localStorage.clear();
        setTimeout(() => {window.location.href = "/play";}, 2000);
        return { done: true };
      }
    
      const newRound = generateRound(winners);
      rounds.push(newRound);
      currentRoundIndex++;
      currentMatchIndex = 0;
    }
    else {
      currentMatchIndex++;
    }
	const updatedData = {rounds: sanitizeRounds(rounds),goalLimit,currentRoundIndex,currentMatchIndex};
	localStorage.setItem("tournamentData", JSON.stringify(updatedData));
	return { done: false, updatedData };
}


export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
};