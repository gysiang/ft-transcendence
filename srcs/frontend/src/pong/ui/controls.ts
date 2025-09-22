type Side = 'left' | 'right';
type Mode = 'tournament' | 'quickplay' | 'online';

type PlayerView = {
  alias: string;
  side: Side;
};

function badge(html: string) {
  return `<span class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
    ${html}
  </span>`;
}

function k(label: string) {
  return `<kbd class="px-1 border rounded">${label}</kbd>`;
}

function controlsForDisplay(mode: Mode, side: Side) {
  if (mode === 'online') {
    return `${badge(`${k('W')}/${k('S')}`)} or ${badge(`${k('↑')}/${k('↓')}`)}`;
  }
  return side === 'left'
    ? badge(`${k('W')}/${k('S')}`)
    : badge(`${k('↑')}/${k('↓')}`);
}

export function renderControlsBanner(
  mountInto: HTMLElement,
  mode: Mode,
  players: PlayerView[]
) {
  mountInto.querySelector('#controlsBanner')?.remove();

  const wrap = document.createElement('div');
  wrap.id = 'controlsBanner';
  wrap.className =
    'mb-4 rounded-xl border border-gray-300 bg-white p-4 shadow-sm';

  const title =
    mode === 'online'
      ? 'Controls (online)'
      : 'Controls (local)';

  const rows = players
    .sort((a, b) =>a.side === b.side ? 0 : a.side === 'left' ? -1 : 1)
    .map(
      (p) => `
      <div class="flex items-center justify-between gap-4">
        <div class="text-sm">
          <span class="font-medium">${p.side.toUpperCase()}</span>
          <span class="mx-2 text-gray-400">•</span>
          <span class="font-semibold">${p.alias || 'Player'}</span>
        </div>
        <div class="text-sm">${controlsForDisplay(mode, p.side)}</div>
      </div>`
    )
    .join('<hr class="my-2 border-gray-200" />');

  wrap.innerHTML = `
    <div class="flex items-start justify-between">
      <div>
        <h3 class="text-base font-semibold">${title}</h3>
        <p class="mt-1 text-xs text-gray-500">
          Left paddle uses ${badge(`${k('W')}/${k('S')}`)}; Right paddle uses ${badge(`${k('↑')}/${k('↓')}`)}.
          Online mode allows either set for both players.
        </p>
      </div>
    </div>
    <div class="mt-3 space-y-1">${rows}</div>
  `;

  mountInto.prepend(wrap);
}