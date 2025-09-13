
import type { WebSocket as WSSocket } from 'ws';
import { joinRoom, broadcast } from './rooms';

type Intent = -1 | 0 | 1;

type MatchState = {
  w: number;
  h: number;
  ball: { x: number; y: number; vx: number; vy: number; r: number };
  left:  { y: number; score: number; intent: Intent };
  right: { y: number; score: number; intent: Intent };
  goalLimit: number;
  geom: { padX: number; padW: number; padH: number; speed: number };
};

function clampI(i: unknown): Intent {
  return typeof i === 'number' ? (i < 0 ? -1 : i > 0 ? 1 : 0) : 0;
}
function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
function clampVY(vy: number) {
  const max = 7;
  if (vy >  max) return max;
  if (vy < -max) return -max;
  return vy;
}
function sendSafe(ws: WSSocket, payload: unknown) {
  try { ws.send(JSON.stringify(payload)); } catch {}
}

const queue: WSSocket[] = [];

export function enqueue(ws: WSSocket, goalLimit = 5) {
  if (ws.readyState !== ws.OPEN) return;
  queue.push(ws);
  tryMatch(goalLimit);
}

function tryMatch(goalLimit: number) {
  while (queue.length >= 2) {
    const left = queue.shift()!;
    const right = queue.shift()!;
    const room = `m:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`;
    startAuthoritativeMatch(room, left, right, goalLimit);
  }
}

export type MatchEndPayload = {
  winnerSide: 'left' | 'right';
  score: [number, number];
};
export type OnMatchEnd = (payload: MatchEndPayload) => void;

export function startAuthoritativeMatch(
  room: string,
  left: WSSocket,
  right: WSSocket,
  goalLimit: number,
  onEnd?: OnMatchEnd
) {

  joinRoom(left, room);
  joinRoom(right, room);

  const state: MatchState = {
    w: 800,
    h: 600,
    ball: { x: 400, y: 300, vx: 4, vy: 3, r: 8 },
    left:  { y: 250, score: 0, intent: 0 },
    right: { y: 250, score: 0, intent: 0 },
    goalLimit,
    geom: { padX: 10, padW: 10, padH: 100, speed: 9 },
  };

  const world = { w: state.w, h: state.h };
  const ballR = state.ball.r;
  const geom  = state.geom;

  sendSafe(left,  { type: 'match.start', room, side: 'left',  goalLimit, world, ballR, geom });
  sendSafe(right, { type: 'match.start', room, side: 'right', goalLimit, world, ballR, geom });

  const leftMsgHandler = (buf: any) => {
    try {
      const m = JSON.parse(typeof buf === 'string' ? buf : buf.toString());
      if (m?.type === 'input') state.left.intent = clampI(m.intent);
    } catch {}
  };
  const rightMsgHandler = (buf: any) => {
    try {
      const m = JSON.parse(typeof buf === 'string' ? buf : buf.toString());
      if (m?.type === 'input') state.right.intent = clampI(m.intent);
    } catch {}
  };
  left.on('message', leftMsgHandler);
  right.on('message', rightMsgHandler);

  const tick = setInterval(() => {
    integrate(state);

    broadcast(room, {
      type: 'state',
      ball:  state.ball,
      left:  { y: state.left.y,  score: state.left.score  },
      right: { y: state.right.y, score: state.right.score },
    });

    if (state.left.score >= state.goalLimit || state.right.score >= state.goalLimit) {
      clearInterval(tick);
      const winnerSide: 'left' | 'right' =
        state.left.score > state.right.score ? 'left' : 'right';

      const payload: MatchEndPayload = {
        winnerSide,
        score: [state.left.score, state.right.score],
      };

      broadcast(room, { type: 'match.end', ...payload });
      try { onEnd?.(payload); } catch {}
      cleanup();
    }
  }, 16);

  const onCloseLeft  = () => endByForfeit('right');
  const onCloseRight = () => endByForfeit('left');
  left.once('close', onCloseLeft);
  right.once('close', onCloseRight);

  function endByForfeit(winnerSide: 'left' | 'right') {
    try { clearInterval(tick); } catch {}

    const payload: MatchEndPayload = {
      winnerSide,
      score: [state.left.score, state.right.score],
    };

    broadcast(room, { type: 'match.end', ...payload });
    try { onEnd?.(payload); } catch {}
    cleanup();
  }

  function cleanup() {
    try { left.off('message', leftMsgHandler); } catch {}
    try { right.off('message', rightMsgHandler); } catch {}
    try { left.off('close', onCloseLeft); } catch {}
    try { right.off('close', onCloseRight); } catch {}
  }
}

// ---------- Physics (swept collisions) ----------
function integrate(s: MatchState) {
  const { padX, padW, padH, speed } = s.geom;
  const r = s.ball.r;

  // Move paddles from intents (server authoritative)
  s.left.y  = clamp(s.left.y  + s.left.intent  * speed, 0, s.h - padH);
  s.right.y = clamp(s.right.y + s.right.intent * speed, 0, s.h - padH);

  const x0 = s.ball.x, y0 = s.ball.y;
  let   x1 = x0 + s.ball.vx;
  let   y1 = y0 + s.ball.vy;

  if (y1 - r <= 0)   { y1 = r;       s.ball.vy = Math.abs(s.ball.vy);   }
  if (y1 + r >= s.h) { y1 = s.h - r; s.ball.vy = -Math.abs(s.ball.vy);  }

  // LEFT paddle (right edge plane pr = padX + padW), check crossing of (x - r)
  if (s.ball.vx < 0) {
    const pr = padX + padW;
    if (x0 - r >= pr && x1 - r <= pr) {
      const t = (x0 - r - pr) / Math.abs(s.ball.vx || 1e-6);
      const yAtPlane = y0 + t * s.ball.vy;
      if (yAtPlane >= s.left.y && yAtPlane <= s.left.y + padH) {
        x1 = pr + r + 0.1;  // center just outside after bounce
        y1 = yAtPlane;
        s.ball.vx = Math.abs(s.ball.vx);
        const off = (yAtPlane - (s.left.y + padH / 2)) / (padH / 2);
        s.ball.vy = clampVY(s.ball.vy + off * 1.5);
      }
    }
  }

  // RIGHT paddle (left edge plane pl = s.w - padX - padW), check crossing of (x + r)
  if (s.ball.vx > 0) {
    const pl = s.w - padX - padW;
    if (x0 + r <= pl && x1 + r >= pl) {
      const t = (pl - (x0 + r)) / Math.abs(s.ball.vx || 1e-6);
      const yAtPlane = y0 + t * s.ball.vy;
      if (yAtPlane >= s.right.y && yAtPlane <= s.right.y + padH) {
        x1 = pl - r - 0.1;
        y1 = yAtPlane;
        s.ball.vx = -Math.abs(s.ball.vx);
        const off = (yAtPlane - (s.right.y + padH / 2)) / (padH / 2);
        s.ball.vy = clampVY(s.ball.vy + off * 1.5);
      }
    }
  }

  s.ball.x = x1;
  s.ball.y = y1;

  if (s.ball.x + r < 0) {
    s.right.score++;
    resetAfterGoal(s, +1);
  } else if (s.ball.x - r > s.w) {
    s.left.score++;
    resetAfterGoal(s, -1);
  }
}

function resetAfterGoal(s: MatchState, dir: -1 | 1) {
  s.ball.x = s.w / 2;
  s.ball.y = s.h / 2;
  s.ball.vx = 4 * dir;
  s.ball.vy = Math.random() > 0.5 ? 3 : -3;
}
