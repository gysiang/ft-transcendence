import {Ball} from "./Ball.js"
import { Paddle } from "./Paddle.js";
import type { Vector2D } from "./types.js";
import { Renderer } from "./Renderer.js";
import type { Player } from "./types.js";

export class Game {

    private ball: Ball;
    private leftPaddle: Paddle;
    private rightPaddle: Paddle;
    private keys: Record<string, boolean>;
    private renderer: Renderer;
    private canvas: HTMLCanvasElement;
    private players: Player[];
    private goalLimit: number;
    private gameFinished: boolean;
    leftScore: number = 0;
    rightScore: number = 0;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, players: Player[], goalLimit: number)
    {
        this.canvas = canvas;
        this.players = JSON.parse(localStorage.getItem("players") || "[]");
        this.goalLimit = parseInt(localStorage.getItem("goalLimit") || "5", 10);
        this.renderer = new Renderer(canvas, ctx,players);
        this.gameFinished = false;
        const center: Vector2D = {
          x: canvas.width / 2,
          y: canvas.height / 2,
        };
        
        const leftPlayer =players.find((p: any) => p.side === "left");
        const rightPlayer=players.find((p: any) => p.side === "right"); 
        this.ball = new Ball(center);
        this.leftPaddle = new Paddle(center.y - 50, canvas.width, "left",);
        this.rightPaddle = new Paddle(center.y - 50, canvas.width, "right");
        this.leftPaddle.name = leftPlayer?.name || "Left";
        this.rightPaddle.name = rightPlayer?.name || "Right";
    
        this.keys = {};
    
        this.setupInput();
      }
      private setupInput(): void {
        window.addEventListener("keydown", (e) => {
          this.keys[e.key] = true;
        });
    
        window.addEventListener("keyup", (e) => {
          this.keys[e.key] = false;
        });
      }
      resetRound(): void{
        this.ball.reset({ x: this.canvas.width / 2, y: this.canvas.height / 2 });
        this.leftPaddle.reset(this.canvas.height / 2 - this.leftPaddle.height / 2);
        this.rightPaddle.reset(this.canvas.height / 2 - this.rightPaddle.height / 2);
      }

      update(): void {
        this.ball.update();

        if (this.ball.position.x + this.ball.radius < 0)
        {
            this.rightScore++;
            if (this.rightScore >= this.goalLimit) {
              alert(`${this.rightPaddle.name} wins!`);
              this.gameFinished = true;
              return;
            }
            this.resetRound();
        }

        if (this.ball.position.x - this.ball.radius > this.canvas.width)
        {
            this.leftScore++;
            if (this.leftScore >= this.goalLimit) {
              alert(`${this.leftPaddle.name} wins!`);
              this.gameFinished = true;
              return;
            }
            this.resetRound();
        }
        
        if (this.ball.position.y <= 0 || this.ball.position.y + this.ball.radius >= this.canvas.height)
        {
          this.ball.bounceY();
        }
    
        if (
          this.ball.position.x <= this.leftPaddle.position.x + this.leftPaddle.width &&
          this.ball.position.y + this.ball.radius >= this.leftPaddle.position.y &&
          this.ball.position.y <= this.leftPaddle.position.y + this.leftPaddle.height
        ) {
          this.ball.bounceX();
        }
    
        if (
          this.ball.position.x + this.ball.radius >= this.rightPaddle.position.x &&
          this.ball.position.y + this.ball.radius >= this.rightPaddle.position.y &&
          this.ball.position.y <= this.rightPaddle.position.y + this.rightPaddle.height
        ) {
          this.ball.bounceX();
        }

        if (this.keys["w"]) this.leftPaddle.moveUp();
        if (this.keys["s"]) this.leftPaddle.moveDown(this.canvas.height);
        if (this.keys["ArrowUp"]) this.rightPaddle.moveUp();
        if (this.keys["ArrowDown"]) this.rightPaddle.moveDown(this.canvas.height);
      }
    
      draw(): void {
        this.renderer.clear();
        this.renderer.drawBoard();
        this.renderer.drawBall(this.ball);
        this.renderer.drawPaddle(this.leftPaddle);
        this.renderer.drawPaddle(this.rightPaddle);
        this.renderer.drawScore(this.leftScore,this.rightScore);
      }
      start(): void {
        this.loop();
      }
    
      loop(): void {
        if (this.gameFinished)
          {
            setTimeout(() => window.location.href = "/play", 2000);
            const mode =localStorage.getItem("mode");
            if (mode === "quickplay")
              {
                localStorage.clear();
              }
            return;
          }
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
      }
      startCountdown(): void{
        const countdown = ["3","2","1", "GO!"];
        let index = 0;
        const showCountdown = () => {

        this.renderer.drawCountdown(countdown[index]);
        index++;
        if (index <= countdown.length) {
            setTimeout(showCountdown, 1000); 
          } else {
            this.start();
          }
        };
        showCountdown();

    }
}
