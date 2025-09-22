import { API_BASE } from "../../variable"


export type World = { w: number; h: number };
export type Geom  = { padX: number; padW: number; padH: number; speed: number };

export type HelloMsg  = { type: 'hello'; ts: number };
export type PongMsg   = { type: 'pong'; ts: number };
export type QueuedMsg = { type: 'queued' };

export type StartMsg = {
  type: 'match.start';
  room: string;
  side: 'left'|'right';
  goalLimit: number;
  world?: World;
  ballR?: number;
  geom?: Geom;
};

export type StateMsg = {
  type: 'state';
  ball:  { x:number; y:number; vx:number; vy:number; r?: number };
  left:  { y:number; score:number };
  right: { y:number; score:number };
  world?: World;
  ballR?: number;
  geom?: Geom;
};

export type EndMsg = {
  type: 'match.end';
  winnerSide: 'left'|'right';
  score: [number, number];
};

export type ServerMsg =
  | HelloMsg | PongMsg | QueuedMsg
  | StartMsg | StateMsg | EndMsg
  | Record<string, unknown>;

export type MatchHandlers = {
  beforeStart?: (msg: StartMsg) => Promise<void>;
  onStart?: (payload: StartMsg) => void;
  onState?: (payload: StateMsg) => void;
  onEnd?: (payload: EndMsg) => void;
  onRaw?: (msg: any) => void;
  onOpen?: (ev: Event) => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
};

export function wsURL(path = '/ws'): string {
  const base = new URL(API_BASE || '/', window.location.href);
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  return new URL(path, base).toString();
}

export type Intent = -1 | 0 | 1;

export type OpenWsApi = {
  ws: WebSocket;
  send: (msg: any) => void;
  queue: (goalLimit?: number) => void;
  input: (intent: Intent) => void;
  close: () => void;
};

export function openWs(handlers: MatchHandlers = {}): OpenWsApi {
  const ws = new WebSocket(wsURL('/ws'));
  const pending: unknown[] = [];
  let isOpen = false;

  let unbindInputs: (() => void) | null = null;
  let started = false;                  
  const stateBuffer: StateMsg[] = []; 

  ws.addEventListener('open', (ev) => {
    isOpen = true;
    try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
    while (pending.length) {
      const p = pending.shift()!;
      try { ws.send(JSON.stringify(p)); } catch {}
    }
    handlers.onOpen?.(ev); // optional
  }, { once: true });

  const sendJson = (payload: unknown) => {
    if (isOpen && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify(payload)); } catch {}
    } else {
      pending.push(payload);
    }
  };

  ws.addEventListener('message', async (ev) => {
    let msg: any;
    try { msg = JSON.parse(ev.data); } catch { return; }
    handlers.onRaw?.(msg);

    switch (msg?.type) {
      case 'hello':
      case 'pong':
      case 'queued':
        return;

      case 'match.start': {
        const startMsg = msg as StartMsg;
        started = false;
        stateBuffer.length = 0
        if (handlers.beforeStart) {
          try { await handlers.beforeStart(startMsg); } catch {}
        }
        unbindInputs?.();
        unbindInputs = bindKeyboard((intent) => sendJson({ type: 'input', intent }));
        started = true; // ★
        handlers.onStart?.(startMsg);
        while (stateBuffer.length) {
          handlers.onState?.(stateBuffer.shift()!);
        }
        return;
      }

      case 'state': {
        const s = msg as StateMsg;
        if (!started) {
          stateBuffer.push(s);
          return;
        }
        handlers.onState?.(s);
        return;
      }

      case 'match.end': {
        started = false;
        stateBuffer.length = 0;
        unbindInputs?.(); unbindInputs = null;
        handlers.onEnd?.(msg as EndMsg);
        return;
      }

      default:
        return;
    }
  });

  ws.addEventListener('close', (ev) => {
    unbindInputs?.(); unbindInputs = null;
    handlers.onClose?.(ev);
  });

  ws.addEventListener('error', (ev) => {
    handlers.onError?.(ev);
  });

  return {
    ws,
    send:  (msg: any) => sendJson(msg),
    queue: (goalLimit?: number) =>
      sendJson({ type: 'queue', ...(typeof goalLimit === 'number' ? { goalLimit } : {}) }),
    input: (intent: Intent) => sendJson({ type: 'input', intent }),
    close: () => ws.close(),
  };
}

function bindKeyboard(send: (intent: -1|0|1) => void) {
  let upPressed = false;
  let downPressed = false;
  let lastIntent: -1|0|1 = 0;

  const compute = (): -1|0|1 => (upPressed ? -1 : downPressed ? 1 : 0);

  const onKey = (e: KeyboardEvent) => {
    const isDown = e.type === 'keydown';
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      upPressed = isDown;
      if (e.key.startsWith('Arrow')) e.preventDefault();
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      downPressed = isDown;
      if (e.key.startsWith('Arrow')) e.preventDefault();
    } else {
      return;
    }

    const intent = compute();
    if (intent !== lastIntent) {
      lastIntent = intent;
      try { send(intent); } catch {}
    }
  };

  window.addEventListener('keydown', onKey, { passive: false });
  window.addEventListener('keyup',   onKey, { passive: false });

  return () => {
    window.removeEventListener('keydown', onKey as any);
    window.removeEventListener('keyup',   onKey as any);
  };
}