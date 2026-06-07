/* ============================================================
   DAMAS — shared state, skins, helpers
   ============================================================ */
(function (global) {
  const LS = {
    owned:  'damas.owned',
    active: 'damas.activeSkin',
    stats:  'damas.stats',
    games:  'damas.games',
    user:   'damas.user',
  };

  /* ---- skins (board + piece themes) ---- */
  const SKINS = [
    {
      id: 'emerald', name: 'Emerald Classic', tag: 'Default', price: 0,
      blurb: 'Deep emerald & cream — the house style.',
      vars: {
        '--sq-light': '#E9E2CC', '--sq-dark': '#41614A', '--frame': '#14140F',
        '--edge': 'rgba(227,178,60,0.30)',
        '--h1': '#F4CB5E', '--h2': '#C8901F', '--hk': '#7A5410',
        '--a1': '#3C3C46', '--a2': '#15151B', '--ak': '#000',
      },
    },
    {
      id: 'wood', name: 'Classic Wood', tag: 'Warm', price: 2.99,
      blurb: 'Hand-finished walnut board with carved timber pieces.',
      vars: {
        '--sq-light': '#E3C79A', '--sq-dark': '#6B4A2E', '--frame': '#2B1B10',
        '--edge': 'rgba(227,178,60,0.35)',
        '--h1': '#E9C083', '--h2': '#9C6B36', '--hk': '#5E3D18',
        '--a1': '#5A3A22', '--a2': '#2C1B0E', '--ak': '#160c05',
      },
    },
    {
      id: 'neon', name: 'Neon Glow', tag: 'Cyberpunk', price: 2.99,
      blurb: 'Carbon grid, electric magenta vs cyan with bloom.',
      vars: {
        '--sq-light': '#1B2330', '--sq-dark': '#0C1018', '--frame': '#05070C',
        '--edge': 'rgba(95,225,255,0.45)',
        '--h1': '#5FF2FF', '--h2': '#1597C9', '--hk': '#0a5a78',
        '--a1': '#FF5CC8', '--a2': '#9A1E78', '--ak': '#5a0d44',
      },
    },
    {
      id: 'marble', name: 'Marble Board', tag: 'Elegant', price: 3.99,
      blurb: 'Carrara & onyx marble with polished stone discs.',
      vars: {
        '--sq-light': '#EDE9E3', '--sq-dark': '#3A3A40', '--frame': '#1A1A1E',
        '--edge': 'rgba(227,178,60,0.40)',
        '--h1': '#FBF7F0', '--h2': '#C9BFA8', '--hk': '#8a7d5e',
        '--a1': '#4A4A52', '--a2': '#1C1C20', '--ak': '#0c0c0e',
      },
    },
    {
      id: 'vector', name: 'Vector Classic', tag: 'Minimal', price: 1.99,
      blurb: 'Flat, clean, high-contrast vector minimalism.',
      vars: {
        '--sq-light': '#F2F0EB', '--sq-dark': '#2E7D6B', '--frame': '#10302A',
        '--edge': 'rgba(255,255,255,0.30)',
        '--h1': '#F4B63C', '--h2': '#D9981F', '--hk': '#9c6c10',
        '--a1': '#33333B', '--a2': '#1A1A20', '--ak': '#0c0c10',
      },
    },
    {
      id: 'pixel', name: 'Retro Pixel', tag: '8-bit', price: 0.99,
      blurb: 'Chunky 8-bit arcade vibe, no anti-aliasing.',
      vars: {
        '--sq-light': '#D8C088', '--sq-dark': '#6C4A8C', '--frame': '#241634',
        '--edge': 'rgba(255,213,74,0.45)',
        '--h1': '#FFE15A', '--h2': '#E0851C', '--hk': '#a35a0c',
        '--a1': '#46D0C0', '--a2': '#1C7A78', '--ak': '#0c4a48',
      },
    },
  ];
  const skinById = (id) => SKINS.find(s => s.id === id) || SKINS[0];

  /* ---- low-level ls helpers ---- */
  function read(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  /* ---- user (mock Clerk) ---- */
  function user() {
    return read(LS.user, { name: 'Alex Mercer', initials: 'AM', signedIn: true });
  }
  function setUser(u) { write(LS.user, u); }

  /* ---- skins ownership / active ---- */
  function owned() {
    const o = read(LS.owned, ['emerald']);
    return o.includes('emerald') ? o : ['emerald', ...o];
  }
  function buy(id) { const o = owned(); if (!o.includes(id)) { o.push(id); write(LS.owned, o); } }
  function isOwned(id) { return owned().includes(id); }
  function activeSkin() { return read(LS.active, 'emerald'); }
  function setActiveSkin(id) { write(LS.active, id); }

  function applySkin(el, id) {
    const s = skinById(id);
    el.setAttribute('data-skin', s.id);
    for (const [k, v] of Object.entries(s.vars)) el.style.setProperty(k, v);
  }

  /* ---- stats ---- */
  function stats() { return read(LS.stats, { played: 47, wins: 28, losses: 17, draws: 2 }); }
  function setStats(s) { write(LS.stats, s); }
  function recordResult(result) { // 'win' | 'loss' | 'draw'
    const s = stats(); s.played++;
    if (result === 'win') s.wins++; else if (result === 'loss') s.losses++; else s.draws++;
    setStats(s);
  }

  /* ---- games ---- */
  function games() { return read(LS.games, {}); }
  function saveGames(g) { write(LS.games, g); }
  function getGame(id) { return games()[id] || null; }
  function newId() { return 'g' + Math.random().toString(36).slice(2, 8); }
  function createGame(difficulty) {
    const g = games();
    const id = newId();
    g[id] = {
      id, difficulty, status: 'in_progress', toMove: 'human',
      board: global.Damas.initialBoard(), history: [],
      createdAt: Date.now(), updatedAt: Date.now(), moveCount: 0,
    };
    saveGames(g);
    return id;
  }
  function updateGame(id, patch) {
    const g = games(); if (!g[id]) return;
    g[id] = { ...g[id], ...patch, updatedAt: Date.now() };
    saveGames(g);
  }
  function deleteGame(id) { const g = games(); delete g[id]; saveGames(g); }
  function activeGames() {
    return Object.values(games())
      .filter(g => g.status === 'in_progress')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /* ---- format helpers ---- */
  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
    const d = Math.floor(h / 24); return d + 'd ago';
  }
  function price(p) { return p === 0 ? 'Free' : '$' + p.toFixed(2); }

  /* ---- navbar injector (chrome; keeps pages DRY) ---- */
  function navbar(active) {
    const u = user();
    const link = (href, label, key) =>
      `<a class="nav-link ${active === key ? 'active' : ''}" href="${href}">${label}</a>`;
    return `
    <nav class="nav">
      <div class="nav-inner">
        <a class="brand" href="index.html" aria-label="Damas home">
          <span class="brand-mark"></span>
          <span class="brand-name">Da<b>mas</b></span>
        </a>
        <div class="nav-links">
          ${link('play.html', 'Play', 'play')}
          ${link('leaderboard.html', 'Leaderboard', 'leaderboard')}
          ${link('shop.html', 'Shop', 'shop')}
        </div>
        <div class="nav-right">
          <a class="btn btn-gold btn-sm" href="play.html">New game</a>
          <a class="avatar" href="me.html" title="${u.name}">${u.initials}</a>
        </div>
      </div>
    </nav>`;
  }
  function mountNav(active) {
    const slot = document.getElementById('nav-slot');
    if (slot) slot.innerHTML = navbar(active);
  }

  /* ---- static (non-interactive) board renderer for previews ---- */
  function renderStaticBoard(el, opts) {
    opts = opts || {};
    const skin = opts.skin || 'emerald';
    const finish = opts.finish || 'glossy';
    const board = opts.board || global.Damas.initialBoard();
    el.classList.add('board');
    if (opts.mini) el.classList.add('mini');
    el.innerHTML = '';
    const sq = document.createElement('div'); sq.className = 'squares';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const d = document.createElement('div');
      d.className = 'sq ' + (global.Damas.isDark(r, c) ? 'dark' : 'light');
      sq.appendChild(d);
    }
    el.appendChild(sq);
    const pl = document.createElement('div'); pl.className = 'pieces';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = board[r][c]; if (!p) continue;
      const pc = document.createElement('div');
      pc.className = 'piece ' + p.player + (p.king ? ' king' : '');
      pc.dataset.finish = finish;
      pc.style.top = (r / 8 * 100) + '%'; pc.style.left = (c / 8 * 100) + '%';
      const disc = document.createElement('span'); disc.className = 'disc';
      if (p.king) { const cr = document.createElement('span'); cr.className = 'crown'; cr.textContent = '♔'; disc.appendChild(cr); }
      pc.appendChild(disc); pl.appendChild(pc);
    }
    el.appendChild(pl);
    applySkin(el, skin);
  }

  global.Store = {
    SKINS, skinById, user, setUser, renderStaticBoard,
    owned, buy, isOwned, activeSkin, setActiveSkin, applySkin,
    stats, setStats, recordResult,
    games, saveGames, getGame, createGame, updateGame, deleteGame, activeGames,
    timeAgo, price, navbar, mountNav,
  };
})(window);
