
export type World = { w: number; h: number };
export type Geom  = { padX: number; padW: number; padH: number; speed: number };
export type HelloMsg   = { type: 'hello'; ts: number };
export type PongMsg    = { type: 'pong'; ts: number };
export type QueuedMsg  = { type: 'queued' };
export type MatchHandlers = {
  onStart?: (payload: { type: 'match.start'; room: string; side: 'left'|'right'; goalLimit: number }) => void;
  onState?: (payload: any) => void;
  onEnd?: (payload: { type: 'match.end'; winnerSide: 'left'|'right'; score: [number, number] }) => void;
  onRaw?: (msg: any) => void;
};
export type StartMsg   = { type: 'match.start'; room: string; side: 'left'|'right'; goalLimit: number;world?: World;     // ← new
ballR?: number;    // ← optional
geom?: Geom;     };
export type StateMsg   = {
  type: 'state';
  ball: { x:number; y:number; vx:number; vy:number ; r?: number};
  left: { y:number; score:number };
  right:{ y:number; score:number };
  world?: World;     // ← new
  ballR?: number;    // ← optional
  geom?: Geom;       // ← optional
};
export type EndMsg     = { type: 'match.end'; winnerSide: 'left'|'right'; score:[number, number] };
export type ServerMsg  = HelloMsg | PongMsg | QueuedMsg | StartMsg | StateMsg | EndMsg | Record<string, unknown>;

function wsURL(): string {
  // direct to Fastify (no Vite proxy)
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://localhost:3000/ws`;
}

export type Intent = -1 | 0 | 1;

export type OpenWsApi = {
  ws: WebSocket;
  send: (msg: any) => void;          // ← add this
  queue: (goalLimit?: number) => void;
  input: (intent: Intent) => void;
  close: () => void;
};

export function openWs(handlers: MatchHandlers = {}): OpenWsApi {
  const ws = new WebSocket(wsURL());
  const pending: unknown[] = [];
  let isOpen = false;

  let unbindInputs: (() => void) | null = null;

  ws.addEventListener('open', () => {
    isOpen = true;
    try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
    while (pending.length) {
      const p = pending.shift()!;
      try { ws.send(JSON.stringify(p)); } catch {}
    }
  }, { once: true });

  const sendJson = (payload: unknown) => {
    if (isOpen && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify(payload)); } catch {}
    } else {
      pending.push(payload);
    }
  };

  ws.onmessage = (ev) => {
    let msg: any; try { msg = JSON.parse(ev.data); } catch { return; }
    switch (msg?.type) {
      case 'hello':  break;
      case 'pong':   break;
      case 'queued': break;

      case 'match.start':
        unbindInputs?.();
        unbindInputs = bindKeyboard((intent) => sendJson({ type: 'input', intent }));
        handlers.onStart?.(msg as StartMsg);
        break;

      case 'state':
        handlers.onState?.(msg as StateMsg);
        break;

      case 'match.end':
        unbindInputs?.(); unbindInputs = null;
        handlers.onEnd?.(msg as EndMsg);
        break;

      default:
        handlers.onRaw?.(msg);
        break;
    }
  };

  ws.onclose = () => { unbindInputs?.(); unbindInputs = null; };

  return {
    ws,
    send:  (msg: any) => sendJson(msg),                        // ← expose it
    queue: (goalLimit?: number) => sendJson({ type: 'queue', ...(typeof goalLimit === 'number' ? { goalLimit } : {}) }),
    input: (intent: Intent)   => sendJson({ type: 'input', intent }),
    close: () => ws.close(),
  };
}
function bindKeyboard(send: (intent: -1|0|1) => void) {
  // Track current intent to avoid spamming identical values
  let upPressed = false;
  let downPressed = false;
  let lastIntent: -1|0|1 = 0;

  const compute = (): -1|0|1 => (upPressed ? -1 : downPressed ? 1 : 0);

  const onKey = (e: KeyboardEvent) => {
    const isDown = e.type === 'keydown';
    // Map keys
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      upPressed = isDown;
      // prevent page from scrolling with arrows/space
      if (e.key.startsWith('Arrow')) e.preventDefault();
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      downPressed = isDown;
      if (e.key.startsWith('Arrow')) e.preventDefault();
    } else {
      return; // ignore other keys
    }

    const intent = compute();
    if (intent !== lastIntent) {
      lastIntent = intent;
      try { send(intent); } catch {}
    }
  };

  // capture on window, works even if canvas isn't focused
  window.addEventListener('keydown', onKey, { passive: false });
  window.addEventListener('keyup', onKey,   { passive: false });

  return () => {
    window.removeEventListener('keydown', onKey as any);
    window.removeEventListener('keyup', onKey as any);
  };
}
/*
export function openWs(handlers?: MatchHandlers) {
  const ws = new WebSocket(wsURL());
  console.log("[wsClient] openWs() created socket", ws.url);

  // --- buffer frames until open
  const pending: unknown[] = [];
  let isOpen = false;

  let unbindInputs: (() => void) | null = null; // <-- will hold unbinder for keys

  ws.addEventListener('open', () => {
    isOpen = true;
    console.log('[WS] open', ws.url);
    try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
    // flush buffer
    while (pending.length) {
      const p = pending.shift()!;
      try { ws.send(JSON.stringify(p)); } catch {}
    }
  }, { once: true });

  ws.onmessage = (ev) => {
    let msg: any; try { msg = JSON.parse(ev.data); } catch { return; }
    switch (msg?.type) {
      case 'hello': console.log('[WS] hello @', new Date(msg.ts).toLocaleTimeString()); break;
      case 'pong':  console.log('[WS] pong  @', new Date(msg.ts).toLocaleTimeString()); break;
      case 'queued': console.log('[WS] queued ack'); break;

      case 'match.start':
        console.log('[WS] match.start', msg);
        // bind keyboard for this match
        unbindInputs?.(); // just in case
        unbindInputs = bindKeyboard((intent) => sendJson({ type: 'input', intent }));
        handlers?.onStart?.(msg);
        break;

      case 'state':
        handlers?.onState?.(msg);
        break;

      case 'match.end':
        console.log('[WS] match.end', msg);
        // unbind keys at end
        unbindInputs?.(); unbindInputs = null;
        handlers?.onEnd?.(msg);
        break;
        default:
      handlers?.onRaw?.(msg);
      break;
    }
  };

  ws.onclose = () => { unbindInputs?.(); unbindInputs = null; };

  function sendJson(payload: unknown) {
    if (isOpen && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify(payload)); } catch {}
    } else {
      pending.push(payload);
    }
  }

  const api = {
    ws,
    queue: (goalLimit?: number) => {
      console.log('[wsClient] queue() called with', goalLimit);
      sendJson({ type: 'queue', ...(typeof goalLimit === 'number' ? { goalLimit } : {}) });
    },
    input: (intent: -1|0|1) => sendJson({ type: 'input', intent }), // optional manual call
    close: () => ws.close(),
  };

  (window as any).wsTest = api; // for quick console testing
  return api;
}*/
