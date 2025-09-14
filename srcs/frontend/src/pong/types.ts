export type Vector2D = {
    x: number;
    y: number;
};
export type Player = {
    name: string;
    side: PlayerSide;
}
export type PlayerSide = "left" | "right";

export type NetState = {
    ball:  { x: number; y: number; r?: number; vx?: number; vy?: number };
    left:  { y: number; score: number };
    right: { y: number; score: number };
  };