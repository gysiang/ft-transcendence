export type Vector2D = {
    x: number;
    y: number;
};
export type Player = {
    name: string;
    side: PlayerSide;
}
export type PlayerSide = "left" | "right";