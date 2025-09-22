let mounted = false;
let root: HTMLDivElement | null = null;

export function mountMatchAnnouncer(scope: Document | HTMLElement = document) {
  if (mounted) return;
  const host = ('documentElement' in scope) ? scope.body : scope;

  const el = document.createElement('div');
  el.id = 'matchAnnouncer';
  el.className = [
    'fixed inset-0 z-[10000] hidden',
    'bg-black/70 backdrop-blur-sm',
    'flex items-center justify-center',
  ].join(' ');

  el.innerHTML = `
    <div
      class="pointer-events-auto w-[min(40rem,92vw)] origin-center rounded-2xl
             bg-white text-slate-900 dark:bg-neutral-900 dark:text-white
             p-6 text-center shadow-2xl opacity-0 scale-95 transition-all duration-300"
      data-announce-card
    >
      <div class="text-xs uppercase tracking-widest text-slate-500" id="announceRound">Round</div>
      <div class="mt-1 text-sm text-slate-500" id="announceMatch">Match</div>

      <div class="mt-4 grid grid-cols-3 items-center gap-3">
        <div class="truncate text-left text-xl font-semibold" id="announceLeft">Left</div>
        <div class="text-sm text-slate-400">vs</div>
        <div class="truncate text-right text-xl font-semibold" id="announceRight">Right</div>
      </div>

      <div class="mt-3 text-sm text-slate-500" id="announceMeta">Goal limit</div>

      <div class="mt-5 text-6xl font-extrabold tabular-nums leading-none" id="announceCountdown">3</div>
    </div>
  `;

  host.appendChild(el);
  root = el;
  mounted = true;
}

type AnnounceOpts = {
  left: string;
  right: string;
  roundLabel?: string;
  matchLabel?: string;
  goalLimit?: number;
  countdown?: number;   
  maxWaitMs?: number;   
  scope?: Document | HTMLElement;
};

export async function showMatchAnnouncement(opts: AnnounceOpts): Promise<void> {
  mountMatchAnnouncer(opts.scope ?? document);
  if (!root) return;

  const card = root.querySelector('[data-announce-card]') as HTMLDivElement;
  const el = (id: string) => root!.querySelector<HTMLElement>('#' + id)!;
  el('announceLeft').textContent   = opts.left;
  el('announceRight').textContent  = opts.right;
  el('announceRound').textContent  = opts.roundLabel || 'Round';
  el('announceMatch').textContent  = opts.matchLabel || '';
  el('announceMeta').textContent   = `Goal limit: ${opts.goalLimit ?? 5}`;

 
  root.classList.remove('hidden');

  requestAnimationFrame(() => {
    card.style.opacity = '1';
    card.style.transform = 'scale(1)';
  });

  const countdownEl = el('announceCountdown');
  const start = Math.max(1, Math.floor(opts.countdown ?? 3));
  const stepMs = 800;

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const timerP = (async () => {
    for (let i = start; i >= 1; i--) {
      countdownEl.textContent = String(i);
      await sleep(stepMs);
    }
    countdownEl.textContent = 'Go!';
    await sleep(500);
  })();
  const guard = (typeof opts.maxWaitMs === 'number' && opts.maxWaitMs > 0)
    ? new Promise<void>(res => setTimeout(res, opts.maxWaitMs))
    : null;

  await (guard ? Promise.race([timerP, guard]) : timerP);

  card.style.opacity = '0';
  card.style.transform = 'scale(0.95)';
  await sleep(250);
  root.classList.add('hidden');
}