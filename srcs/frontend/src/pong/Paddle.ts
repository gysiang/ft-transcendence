import type { Vector2D, PlayerSide } from "./types.js";

export class Paddle{
    position: Vector2D;
    height: number = 100;
    width: number = 10;
    speed: number = 6;
    side: PlayerSide;

    constructor(y: number, canvasWidth: number, side: PlayerSide)
    {
        this.side = side;
        this.position = {
            x: side == 'left' ? 10 :canvasWidth - 20,
            y: y
        };
    }

    moveUp()
    {
        this.position.y -= this.speed;
        if (this.position.y < 0) {
            this.position.y = 0;
          }

    }
    moveDown(canvasHeight: number)
    {
        if (this.position.y + this.height < canvasHeight)
            this.position.y += this.speed;
    }

    reset(startY: number):void {
        this.position.y = startY;
    }
}