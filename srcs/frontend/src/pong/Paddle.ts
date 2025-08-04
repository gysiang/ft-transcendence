import type { Vector2D } from "./types.js";

export class Paddle
{
    position: Vector2D;
    height: number = 100;
    width: number = 10;
    speed: number = 8;

    constructor(position: Vector2D, width: number, height:number, speed: number)
    {
        this.position = position;
        this.width = width;
        this.height = height;
        this.speed = speed;
    }

    moveUp()
    {
        this.position.y -= this.speed;
        if (this.position.y < 0)
            this.position.y = 0;

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