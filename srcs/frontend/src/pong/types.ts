export type Vector2D = {
    x: number;
    y: number;
};
export interface Player{
    name: string;
    side: "left" | "right";
}
export type PlayerSide = 'left' | 'right';