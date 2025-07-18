import {Game} from "./Pong";

export function startGame(canvas : HTMLCanvasElement)
{
    const ctx = canvas.getContext("2d");
    if (!ctx)
        {
            throw new Error("Canvas not supported");
        }
    const game = new Game(canvas, ctx);
    game.startCountdown();
}
/*
window.addEventListener("load", () => {
    const canvas = document.getElementById("game") as HTMLCanvasElement;
    const context = canvas.getContext("2d");

    if (!context) {
        alert("Canvas not supported");
        return;
    }
    const game = new Game(canvas, context);
    game.startCountdown();
});*/