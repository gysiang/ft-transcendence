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
export function advanceToNextMatchOrRound(_match: Match,rounds: Match[][],
  currentRoundIndex: number,currentMatchIndex: number, goalLimit: number
): { done: boolean; updatedData?: {
      rounds: Match[][],
      goalLimit: number,
      currentRoundIndex: number,
      currentMatchIndex: number
    },
    tournamentWinner?: Player}
    {

  const isLastMatchOfRound =
    currentMatchIndex + 1 >= rounds[currentRoundIndex].length;

  if (isLastMatchOfRound) {
    const roundWinners = rounds[currentRoundIndex]
      .map((m) => m.winner)
      .filter((p: Player | null | undefined): p is Player => !!p);

    if (roundWinners.length === 1) {
      return { done: true, tournamentWinner: roundWinners[0] };
    }

    const newRound = generateRound(roundWinners);
    const newRounds = [...rounds, newRound];

    const updatedData = {
      rounds: sanitizeRounds(newRounds),
      goalLimit,
      currentRoundIndex: currentRoundIndex + 1,
      currentMatchIndex: 0
    };
    return { done: false, updatedData };
  } else {
    const updatedData = {
      rounds: sanitizeRounds(rounds),
      goalLimit,
      currentRoundIndex,
      currentMatchIndex: currentMatchIndex + 1
    };
    return { done: false, updatedData };
  }
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

export function clearGameStorage() {
  const gameKeys = [
    "mode",
    "goalLimit",
    "players",
    "tournamentData",
    "tournamentSnapshot"
  ];

  for (const key of gameKeys) {
    localStorage.removeItem(key);
  }
}
