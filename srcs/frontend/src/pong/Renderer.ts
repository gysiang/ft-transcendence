import { Paddle } from "./Paddle.js";
import { Ball } from "./Ball.js";
import type { Player } from "./types.js";

//device pixel ratio
function dpr() {
  return Math.max(1, window.devicePixelRatio || 1);
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private players: Player[];
  private worldW: number;
  private worldH: number;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, players: Player[]) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.players = players;

    const lockedW = Number(canvas.dataset.worldW);
    const lockedH = Number(canvas.dataset.worldH);
    if (lockedW && lockedH) {
      this.worldW = lockedW;
      this.worldH = lockedH;
    } else {
      this.worldW = Math.round(canvas.width / dpr());
      this.worldH = Math.round(canvas.height / dpr());
    }
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.worldW, this.worldH);
  }

  drawBoard(): void {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.worldW, this.worldH);
  }

  drawPaddle(paddle: Paddle): void {
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(paddle.position.x, paddle.position.y, paddle.width, paddle.height);
  }

  drawBall(ball: Ball): void {
    this.ctx.beginPath();
    this.ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "white";
    this.ctx.fill();
    this.ctx.closePath();
  }

  drawScore(leftScore: number, rightScore: number): void {
    const leftPlayer = this.players.find(p => p.side === "left");
    const rightPlayer = this.players.find(p => p.side === "right");
    const leftName = leftPlayer?.name || "Left";
    const rightName = rightPlayer?.name || "Right";

    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.font = "40px Arial";
    this.ctx.fillText(`${leftName}: ${leftScore}   ${rightName}: ${rightScore}`, this.worldW / 2, 50);
  }

  drawCountdown(text: string): void {
    this.drawBoard();
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.font = "80px Arial";
    this.ctx.fillText(text, this.worldW / 2, this.worldH / 2);
  }
}


export function createGameCanvas(): { canvas: HTMLCanvasElement; container: HTMLElement } {
  const container = document.createElement("div");
  container.id = "game-container";
  container.className = "relative w-full max-w-screen-md mx-auto";

  const canvas = document.createElement("canvas");
  canvas.id = "game";
  canvas.className = "block mx-auto mt-10 border border-white";

  canvas.dataset.locked = "";
  canvas.style.width = "";
  canvas.style.height = "";
  resizeCanvas(canvas);
  window.addEventListener("resize", () => resizeCanvas(canvas));

  container.appendChild(canvas);

  const popup = document.createElement("div");
  popup.id = "match-announcement";
  popup.className = "fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40 backdrop-blur-sm";
  popup.style.display = "none";
  popup.innerHTML = `
    <div class="bg-white text-black p-6 rounded-md shadow-lg max-w-2xl w-full space-y-6">
      <h2 id="match-heading" class="text-2xl mb-4 text-center"></h2>
      <div id="bracket" class="space-y-4 text-sm"></div>
      <div class="text-center">
        <button id="start-match-btn" type="button" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-white">
          Start Match
        </button>
      </div>
    </div>
  `;
  container.appendChild(popup);

  return { canvas, container };
}

/* responsive sizing:
  unlock -> update buffer + CSS + DPR transform
    lock->   update CSS only buffer /transform stay fixed */

export function resizeCanvas(canvas: HTMLCanvasElement) {
  const aspect = 4 / 3;
  const parent = canvas.parentElement as HTMLElement | null;

  const availW = Math.floor(parent?.clientWidth ?? window.innerWidth);
  const availH = Math.floor(window.innerHeight * 0.85);

  let cssW = availW;
  let cssH = Math.floor(cssW / aspect);
  if (cssH > availH) {
    cssH = availH;
    cssW = Math.floor(cssH * aspect);
  }

  canvas.style.width  = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  if (canvas.dataset.locked !== "1") {
    const ratio = dpr();
    canvas.width  = Math.round(cssW * ratio);
    canvas.height = Math.round(cssH * ratio);
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}

export function lockCanvasWorld(canvas: HTMLCanvasElement, w: number, h: number) {
  canvas.dataset.locked = "1";
  canvas.dataset.worldW = String(w);
  canvas.dataset.worldH = String(h);

  const ratio = dpr();
  canvas.width  = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  resizeCanvas(canvas);
}

export function lockCanvasAtCurrent(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const ratio = dpr();

  canvas.dataset.locked = "1";
  canvas.dataset.worldW = String(Math.round(rect.width));
  canvas.dataset.worldH = String(Math.round(rect.height));

  canvas.width  = Math.round(rect.width  * ratio);
  canvas.height = Math.round(rect.height * ratio);

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  canvas.style.width  = `${Math.round(rect.width)}px`;
  canvas.style.height = `${Math.round(rect.height)}px`;
}

export function unlockCanvas(canvas: HTMLCanvasElement) {
  canvas.dataset.locked = "";
  delete canvas.dataset.worldW;
  delete canvas.dataset.worldH;

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  canvas.style.width  = "";
  canvas.style.height = "";
  resizeCanvas(canvas);
}
