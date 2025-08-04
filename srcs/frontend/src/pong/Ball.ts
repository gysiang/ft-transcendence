import type {Vector2D} from './types';

export class Ball{
    position: Vector2D;
    velocity: Vector2D;
    radius : number;

    constructor(startPos: Vector2D)
    {
        this.position = { ...startPos};
        this.velocity = {x: 6, y: 6};
        this.radius = 8;
    }

    update()
    {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }

    bounceY()
    {
        this.velocity.y *= -1;
    }
    bounceX() {
        this.velocity.x *= -1;
    }

    reset(center: Vector2D)
    {
        this.position = {...center};
        this.velocity.x *= -1;
    }
}