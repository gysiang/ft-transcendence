import {Ball} from "./Ball.js"
import { Paddle } from "./Paddle.js";
import type { Vector2D } from "./types.js";
import { Renderer } from "./Renderer.js";
import type { Player } from "./types.js";

export class Game {

    private ball: Ball;
    private leftPaddle: Paddle;
    private rightPaddle: Paddle;
    private keys: Record<string, boolean> = {};
    private renderer: Renderer;
    private canvas: HTMLCanvasElement;
    private leftPlayer: Player;
    private rightPlayer: Player;
    private goalLimit: number;
    private gameFinished: boolean = false;
    leftScore: number = 0;
    rightScore: number = 0;

    constructor(canvas: HTMLCanvasElement,ctx: CanvasRenderingContext2D,players: Player[],
      goalLimit: number,private onFinish?: (winner: Player) => void
    )
    {
      this.canvas = canvas;
      this.goalLimit = goalLimit;
      this.onFinish = onFinish;

      this.leftPlayer = players.find(p => p.side === "left")!;
      this.rightPlayer = players.find(p => p.side === "right")!;

      if (!this.leftPlayer || !this.rightPlayer)
        throw new Error("Both left and right players must be provided.");

      const paddleWidth = 10;
      const paddleHeight = 100;
      const paddleSpeed = 8;
      const centerY = canvas.height / 2 - paddleHeight / 2;

      this.leftPaddle = new Paddle({ x: 10, y: centerY },paddleWidth,paddleHeight,paddleSpeed);
      this.rightPaddle = new Paddle({ x: canvas.width - paddleWidth - 10, y: centerY },paddleWidth,paddleHeight,paddleSpeed);
      this.renderer = new Renderer(canvas, ctx, players);
      this.ball = new Ball({x: canvas.width / 2,y: canvas.height / 2,});

      this.renderer = new Renderer(canvas,ctx,[this.leftPlayer,this.rightPlayer]);
      this.setupInput();
    }
    private setupInput(): void
    {
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
    private handleWin(side: "left" | "right")
    {
      const winner = side === "left" ? this.leftPlayer : this.rightPlayer;
      alert(`${winner.name} wins!`);
      this.gameFinished = true;
      if (this.onFinish) this.onFinish(winner);

    }

    private checkCollision(paddle: Paddle) : boolean
    {
      return (
        this.ball.position.x + this.ball.radius >= paddle.position.x &&
        this.ball.position.x - this.ball.radius <= paddle.position.x + paddle.width &&
        this.ball.position.y + this.ball.radius >= paddle.position.y &&
        this.ball.position.y <= paddle.position.y + paddle.height

      );
    }
    private trackScore(side: "left" | "right"): boolean
    {
      if (side === "left")
        {
          this.leftScore++;
          if (this.leftScore >= this.goalLimit)
            {
              this.handleWin("left");
              return (true);
            }
        }
      else
      {
        this.rightScore++;
        if (this.rightScore >= this.goalLimit)
          {
            this.handleWin("right");
            return (true);
          }
      }
      return (false);
    }

    update(): void
    {
      if (this.gameFinished)
        return;
      if (this.keys["w"]) this.leftPaddle.moveUp();
      if (this.keys["s"]) this.leftPaddle.moveDown(this.canvas.height);
      if (this.keys["ArrowUp"]) this.rightPaddle.moveUp();
      if (this.keys["ArrowDown"]) this.rightPaddle.moveDown(this.canvas.height);

      this.ball.update();

      if (this.checkCollision(this.leftPaddle) || this.checkCollision(this.rightPaddle))
        this.ball.bounceX();

      if (this.ball.position.y - this.ball.radius <= 0
        || this.ball.position.y + this.ball.radius >= this.canvas.height)
      {
        this.ball.bounceY();
      }
      if (this.ball.position.x + this.ball.radius < 0) {
        if (this.trackScore("right")) return;
        this.resetRound();
      }
    
      if (this.ball.position.x - this.ball.radius > this.canvas.width) {
        if (this.trackScore("left")) return;
        this.resetRound();
      }
    
      this.draw();
        
      }
    
    draw(): void
    {
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
        if (this.gameFinished) {
          const mode = localStorage.getItem("mode");
      
          if (mode === "quickplay") {
            localStorage.clear();
            setTimeout(() => {
              window.location.href = "/play";}, 2000);
          }
          return;
        }
      
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
      }
      
    startCountdown(): void
    {
      const countdown = ["3","2","1", "GO!"];
      let index = 0;
      const showCountdown = () => {
        if (index < countdown.length) {
          this.renderer.drawCountdown(countdown[index]);
          index++;
          setTimeout(showCountdown, 1000);
        } else {
          this.start(); 
        }
      }
      showCountdown();

    }
}
