import { Paddle } from "./Paddle.js";
import { Ball } from "./Ball.js";
import type { Player } from "./types.js";

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private players: Player[];

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, players: Player[])
    {
        this.canvas = canvas;
        this.ctx = ctx;
        this.players=players;
    }
    clear(): void
    {
        this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    }
    drawBoard(): void
    {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPaddle(paddle: Paddle): void{
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(paddle.position.x,paddle.position.y,paddle.width,paddle.height);
    }
    drawBall(ball: Ball): void
    {
        this.ctx.beginPath();
        this.ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = "white";
        this.ctx.fill();
        this.ctx.closePath();
    }
    drawScore(leftScore: number, rightScore: number): void
    {
        const leftPlayer = this.players.find(p => p.side === "left");
        const rightPlayer = this.players.find(p => p.side === "right");

        const leftName = leftPlayer?.name || "Left";
        const rightName = rightPlayer?.name || "Right";

        this.ctx.fillStyle = "white";
        this.ctx.font = "40px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(`${leftName}: ${leftScore}   ${rightName}: ${rightScore}`,this.canvas.width / 2,50);
    }
    drawCountdown(text: string): void
    {
        this.clear();
        this.ctx.fillStyle = "Black";
        this.ctx.font = "80px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    }
}

export function createGameCanvas(): HTMLCanvasElement 
{
	const canvas = document.createElement("canvas");
	canvas.id = "game";
	canvas.className = "block mx-auto mt-10 border border-white";
    resizeCanvas(canvas);
    window.addEventListener("resize", () => resizeCanvas(canvas));
	return canvas;
}

function resizeCanvas(canvas: HTMLCanvasElement)
{
    const aspectRatio = 4 / 3;
	const maxWidth = window.innerWidth * 0.95;
	const maxHeight = window.innerHeight * 0.85;

	let width = maxWidth;
	let height = width / aspectRatio;

	if (height > maxHeight)
    {
		height = maxHeight;
		width = height * aspectRatio;
	}
	canvas.width = width;
	canvas.height = height;

}