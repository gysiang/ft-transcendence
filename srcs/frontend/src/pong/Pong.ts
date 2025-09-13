import {Ball} from "./Ball.js"
import { Paddle } from "./Paddle.js";
import type { NetState } from "./types.js";
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
  private gameFinished = false;

  // 👇 world (logic) dimensions — NOT canvas backing buffer
  private worldW: number;
  private worldH: number;

  // 👇 online authoritative mode flag
  private netAuthoritative = false;

  leftScore = 0;
  rightScore = 0;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    players: Player[],
    goalLimit: number,
    private onFinish?: (winner: Player, score: [number, number]) => void
  ) {
    this.canvas = canvas;
    this.goalLimit = goalLimit;
    this.onFinish = onFinish;

    // Resolve world size:
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    this.worldW = Number(canvas.dataset.worldW) || Math.round(canvas.width / ratio);
    this.worldH = Number(canvas.dataset.worldH) || Math.round(canvas.height / ratio);

    this.leftPlayer  = players.find(p => p.side === "left")!;
    this.rightPlayer = players.find(p => p.side === "right")!;
    if (!this.leftPlayer || !this.rightPlayer) {
      throw new Error("Both left and right players must be provided.");
    }

    const paddleWidth  = 10;
    const paddleHeight = 100;
    const paddleSpeed  = 8;
    const centerY      = this.worldH / 2 - paddleHeight / 2;

    // Place paddles using world coordinates
    this.leftPaddle  = new Paddle({ x: 10, y: centerY }, paddleWidth, paddleHeight, paddleSpeed);
    this.rightPaddle = new Paddle({ x: this.worldW - paddleWidth - 10, y: centerY }, paddleWidth, paddleHeight, paddleSpeed);

    this.renderer = new Renderer(canvas, ctx, [this.leftPlayer, this.rightPlayer]);

    // Ball at world center
    this.ball = new Ball({ x: this.worldW / 2, y: this.worldH / 2 });

    this.setupInput();
  }

  /** Call this in online mode AFTER constructing Game (e.g., in onStart). */
  enableNetMode(): void {
    this.netAuthoritative = true;
  }

  /** Apply server snapshot (online authoritative). */
  applyNetState(s: NetState): void {
    if (!this.netAuthoritative) return;

    // Positions & scores come from the server
    this.ball.position.x = s.ball.x;
    this.ball.position.y = s.ball.y;
    if (typeof s.ball.r === "number") {
      // If your Ball.radius is writable; otherwise remove this line
      (this.ball as any).radius = s.ball.r;
    }

    this.leftPaddle.position.y  = s.left.y;
    this.rightPaddle.position.y = s.right.y;

    this.leftScore  = s.left.score;
    this.rightScore = s.right.score;

    // Draw immediately so UI feels responsive between ticks
    this.draw();
  }

  private setupInput(): void {
    window.addEventListener("keydown", (e) => { this.keys[e.key] = true; });
    window.addEventListener("keyup",   (e) => { this.keys[e.key] = false; });
  }

  private handleWin(side: "left" | "right") {
    const winner = side === "left" ? this.leftPlayer : this.rightPlayer;
    alert(`${winner.name} wins!`);
    this.gameFinished = true;
    this.onFinish?.(winner, [this.leftScore, this.rightScore]);
  }

  private checkCollision(paddle: Paddle): boolean {
    return (
      this.ball.position.x + this.ball.radius >= paddle.position.x &&
      this.ball.position.x - this.ball.radius <= paddle.position.x + paddle.width &&
      this.ball.position.y + this.ball.radius >= paddle.position.y &&
      this.ball.position.y <= paddle.position.y + paddle.height
    );
  }

  private trackScore(side: "left" | "right"): boolean {
    if (side === "left") {
      this.leftScore++;
      if (this.leftScore >= this.goalLimit) { this.handleWin("left"); return true; }
    } else {
      this.rightScore++;
      if (this.rightScore >= this.goalLimit) { this.handleWin("right"); return true; }
    }
    return false;
  }

  resetRound(): void {
    this.ball.reset({ x: this.worldW / 2, y: this.worldH / 2 });
    this.leftPaddle.reset(this.worldH / 2 - this.leftPaddle.height / 2);
    this.rightPaddle.reset(this.worldH / 2 - this.rightPaddle.height / 2);
  }

  update(): void {
    if (this.gameFinished) return;

    // In online authoritative mode, local physics are disabled.
    if (this.netAuthoritative) {
      // Input is still captured elsewhere and sent to server; drawing happens via applyNetState.
      return;
    }

    // Local controls & physics
    if (this.keys["w"]) this.leftPaddle.moveUp();
    if (this.keys["s"]) this.leftPaddle.moveDown(this.worldH);
    if (this.keys["ArrowUp"]) this.rightPaddle.moveUp();
    if (this.keys["ArrowDown"]) this.rightPaddle.moveDown(this.worldH);

    this.ball.update();

    if (this.checkCollision(this.leftPaddle) || this.checkCollision(this.rightPaddle)) {
      this.ball.bounceX();
    }

    // Top/bottom walls in world space
    if (
      this.ball.position.y - this.ball.radius <= 0 ||
      this.ball.position.y + this.ball.radius >= this.worldH
    ) {
      this.ball.bounceY();
    }

    // Goals in world space
    if (this.ball.position.x + this.ball.radius < 0) {
      if (this.trackScore("right")) return;
      this.resetRound();
    }
    if (this.ball.position.x - this.ball.radius > this.worldW) {
      if (this.trackScore("left")) return;
      this.resetRound();
    }

    this.draw();
  }

  draw(): void {
    this.renderer.clear();
    this.renderer.drawBoard();
    this.renderer.drawBall(this.ball);
    this.renderer.drawPaddle(this.leftPaddle);
    this.renderer.drawPaddle(this.rightPaddle);
    this.renderer.drawScore(this.leftScore, this.rightScore);
  }

  start(): void { this.loop(); }

  private loop(): void {
    if (this.gameFinished) return;

    // Only update physics locally when not in net mode
    if (!this.netAuthoritative) {
      this.update();
      this.draw();
    }
    requestAnimationFrame(() => this.loop());
  }

  startCountdown(): void {
    const countdown = ["3", "2", "1", "GO!"];
    let i = 0;
    const step = () => {
      if (i < countdown.length) {
        this.renderer.drawCountdown(countdown[i++]);
        setTimeout(step, 1000);
      } else {
        this.start();
      }
    };
    step();
  }
}
/*
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
    private netAuthoritative = false;
    private worldW: number;
    private worldH: number;
    leftScore: number = 0;
    rightScore: number = 0;

    constructor(canvas: HTMLCanvasElement,ctx: CanvasRenderingContext2D,players: Player[],
      goalLimit: number,private onFinish?: (winner: Player, score: [number, number]) => void)
    {
      this.canvas = canvas;
      this.goalLimit = goalLimit;
      this.onFinish = onFinish;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      this.worldW = Number(canvas.dataset.worldW) || Math.round(canvas.width / dpr);
      this.worldH = Number(canvas.dataset.worldH) || Math.round(canvas.height / dpr);

      this.leftPlayer = players.find(p => p.side === "left")!;
      this.rightPlayer = players.find(p => p.side === "right")!;

      if (!this.leftPlayer || !this.rightPlayer)
        throw new Error("Both left and right players must be provided.");

      const paddleWidth = 10;
      const paddleHeight = 100;
      const paddleSpeed = 8;
      const centerY = this.worldH / 2 - paddleHeight / 2;
      //const centerY = canvas.height / 2 - paddleHeight / 2;

      this.leftPaddle = new Paddle({ x: 10, y: centerY },paddleWidth,paddleHeight,paddleSpeed);
      this.rightPaddle = new Paddle({ x: canvas.width - paddleWidth - 10, y: centerY },paddleWidth,paddleHeight,paddleSpeed);
      this.renderer = new Renderer(canvas, ctx, players);
      this.ball = new Ball({x: this.worldW / 2,y: this.worldH / 2,});

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
        this.ball.reset({ x: this.worldW / 2, y: this.worldH / 2 });
        this.leftPaddle.reset(this.worldH / 2 - this.leftPaddle.height / 2);
        this.rightPaddle.reset(this.worldH / 2 - this.rightPaddle.height / 2);
    }
    private handleWin(side: "left" | "right")
    {
      const winner = side === "left" ? this.leftPlayer : this.rightPlayer;
      alert(`${winner.name} wins!`);
      this.gameFinished = true;
      if (this.onFinish) {
        this.onFinish(winner, [this.leftScore, this.rightScore]);
      }

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
      if (this.netAuthoritative) {
        return;
      }
      if (this.keys["w"]) this.leftPaddle.moveUp();
      if (this.keys["s"]) this.leftPaddle.moveDown(this.worldH);
      if (this.keys["ArrowUp"]) this.rightPaddle.moveUp();
      if (this.keys["ArrowDown"]) this.rightPaddle.moveDown(this.worldH);

      this.ball.update();

      if (this.checkCollision(this.leftPaddle) || this.checkCollision(this.rightPaddle))
        this.ball.bounceX();

      if (this.ball.position.y - this.ball.radius <= 0
        || this.ball.position.y + this.ball.radius >= this.worldH)
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
            //localStorage.clear();
          }
          return;
        }
      
        this.update();
        //this.draw();
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

    public enableNetMode() { this.netAuthoritative = true; }
    public disableNetMode() { this.netAuthoritative = false; }
    public applyNetState(s: NetState) {
      if (!this.netAuthoritative) return;
    
      // positions
      this.ball.position.x = s.ball.x;
      this.ball.position.y = s.ball.y;
    
      this.leftPaddle.position.y  = s.left.y;
      this.rightPaddle.position.y = s.right.y;
    
      // scores
      this.leftScore  = s.left.score;
      this.rightScore = s.right.score;
    
      // render the snapshot immediately
      this.draw();
    }
}*/
