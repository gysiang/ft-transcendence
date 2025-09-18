export type VictoryOverlayOptions = {
    winnerName: string;                 
    tournamentName: string;             
    onHome: () => void;                
    onNewTournament: () => void;        
  };
  
  export function showOnlineVictoryOverlay(opts: VictoryOverlayOptions): () => void {
    document.getElementById("onlineVictoryOverlay")?.remove();
  
    const overlay = document.createElement("div");
    overlay.id = "onlineVictoryOverlay";
    overlay.className =
      "fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-6";
  
    overlay.innerHTML = `
      <div class="w-full max-w-xl bg-white border border-slate-200 shadow-xl rounded-2xl p-6 text-center space-y-4">
        <div class="text-5xl">🏆</div>
        <h3 class="text-2xl font-bold">
          Champion: <span class="text-blue-700">${escapeHtml(opts.winnerName || "Champion")}</span>
        </h3>
        <p class="text-slate-600">“${escapeHtml(opts.tournamentName || "Tournament")}” has finished.</p>
  
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button id="ovHome"
            class="inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-medium bg-slate-100 hover:bg-slate-200">
            Home
          </button>
          <button id="ovNew"
            class="inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-medium bg-emerald-600 text-white hover:bg-emerald-700">
            New tournament
          </button>
        </div>
      </div>
    `;
  
    document.body.appendChild(overlay);
  
    const close = () => overlay.remove();
    overlay.querySelector<HTMLButtonElement>("#ovHome")!.onclick = () => { close(); opts.onHome(); };
    overlay.querySelector<HTMLButtonElement>("#ovNew")!.onclick  = () => { close(); opts.onNewTournament(); };
  
    return close;
  }
  
  export function extractTournamentNameFromState(state: any, fallback = "Tournament"): string {
    const n = (x: any) => (x == null ? "" : String(x)).trim();
    return n(state?.name) || fallback;
  }
  
  function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, c =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" } as any)[c]
    );
  }