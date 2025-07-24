import {Game} from "./Pong";

export function startGame(canvas : HTMLCanvasElement)
{
    const ctx = canvas.getContext("2d");
    if (!ctx)
        {
            throw new Error("Canvas not supported");
        }
    const mode =localStorage.getItem("mode");
    if (mode === "quickplay")
        {
            const players = JSON.parse(localStorage.getItem("players") || "[]");
            const goalLimit = parseInt(localStorage.getItem("goalLimit") || "5", 10);
            console.log("Quickplay starting with players:", players);
            console.log("Goals to win:", goalLimit);
            const game = new Game(canvas, ctx, players, goalLimit);
            game.startCountdown();
        }
    //const game = new Game(canvas, ctx);
    //game.startCountdown();
}