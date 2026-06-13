/* ============================================================
   DAMAS — shared state, skins, helpers
   ============================================================ */
(function (global) {
  const LS = {
    owned:      'damas.owned',
    active:     'damas.activeSkin',
    stats:      'damas.stats',
    games:      'damas.games',
    user:       'damas.user',
    skinAssets: 'damas.skinAssets',
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
    /* ── PNG clan skins — tiles/pieces/frame loaded from assets/skins/{id}/*.png ── */
    { id: 'templo', name: 'Templo del Tiempo', tag: 'Fantasy', price: 3.99,
      blurb: 'Ancient stone tiles, bronze-clad warriors — timeless relics on every square.',
      vars: { '--sq-light': '#C4B89A', '--sq-dark': '#2E3D28', '--frame': '#1A150E',
              '--edge': 'rgba(193,152,80,0.50)', '--h1': '#C4A24A', '--h2': '#7A6228', '--hk': '#3e2f0e',
              '--a1': '#4A3040', '--a2': '#1E1018', '--ak': '#0e0008' } },
    { id: 'desierto', name: 'Clan del Desierto', tag: 'Dorado', price: 3.99,
      blurb: 'Golden sand and crescent steel — warriors of sun and moon clash at dusk.',
      vars: { '--sq-light': '#D4A831', '--sq-dark': '#3A1850', '--frame': '#1E0E02',
              '--edge': 'rgba(220,180,60,0.55)', '--h1': '#E8C040', '--h2': '#9A7018', '--hk': '#4a3008',
              '--a1': '#8A1E28', '--a2': '#3A0A10', '--ak': '#1a0408' } },
    { id: 'bosque', name: 'Clan del Bosque', tag: 'Natural', price: 3.99,
      blurb: 'Tangled roots, emerald canopy — ancient spirits guard the living board.',
      vars: { '--sq-light': '#A8C470', '--sq-dark': '#1E3A18', '--frame': '#0E1C08',
              '--edge': 'rgba(80,180,80,0.50)', '--h1': '#70C050', '--h2': '#2E6018', '--hk': '#0e3008',
              '--a1': '#3A5010', '--a2': '#1A2808', '--ak': '#081404' } },
    { id: 'hada', name: 'Clan de las Hadas', tag: 'Mágico', price: 3.99,
      blurb: 'Crystal petals and luminous orbs — magic blooms across every square.',
      vars: { '--sq-light': '#C8B8F0', '--sq-dark': '#1A1458', '--frame': '#0A0828',
              '--edge': 'rgba(120,140,255,0.60)', '--h1': '#80A8F8', '--h2': '#3050C0', '--hk': '#102060',
              '--a1': '#D040A8', '--a2': '#601848', '--ak': '#300824' } },
    { id: 'fuego', name: 'Clan del Fuego', tag: 'Volcánico', price: 3.99,
      blurb: 'Molten obsidian and flame elementals — every move scorches the board.',
      vars: { '--sq-light': '#C07040', '--sq-dark': '#1A0802', '--frame': '#0A0400',
              '--edge': 'rgba(255,120,40,0.60)', '--h1': '#E08030', '--h2': '#803010', '--hk': '#401808',
              '--a1': '#D04820', '--a2': '#600C04', '--ak': '#300402' } },
    { id: 'agua', name: 'Clan del Agua', tag: 'Marino', price: 3.99,
      blurb: 'Translucent ice and deep-sea creatures — the tide decides every battle.',
      vars: { '--sq-light': '#80C8D8', '--sq-dark': '#0A2840', '--frame': '#04121C',
              '--edge': 'rgba(40,180,220,0.55)', '--h1': '#40C0D0', '--h2': '#106878', '--hk': '#043040',
              '--a1': '#2040A8', '--a2': '#081848', '--ak': '#040824' } },
    { id: 'sombra', name: 'Clan de las Sombras', tag: 'Oscuro', price: 3.99,
      blurb: 'Runic obsidian and spectral chains — shadow and silence consume the board.',
      vars: { '--sq-light': '#686868', '--sq-dark': '#0C0C0C', '--frame': '#060406',
              '--edge': 'rgba(140,60,200,0.55)', '--h1': '#A8A8C0', '--h2': '#505070', '--hk': '#202030',
              '--a1': '#40A040', '--a2': '#184818', '--ak': '#0a200a' } },
  ];
  const skinById = (id) => SKINS.find(s => s.id === id) || SKINS[0];

  /* ── clan skins that ship with PNG art ── */
  const CLAN_SKINS = new Set(['templo','desierto','bosque','hada','fuego','agua','sombra']);
  const CLAN_FILES = {
    frame: 'frame.png', tileL: 'tile-light.png', tileD: 'tile-dark.png',
    manH: 'hero.png', kingH: 'hero-king.png', manF: 'foe.png', kingF: 'foe-king.png',
  };
  const SLOT_PROP = {
    frame: '--frame-img', tileL: '--tile-l-img', tileD: '--tile-d-img',
    manH: '--piece-man-h', kingH: '--piece-king-h', manF: '--piece-man-f', kingF: '--piece-king-f',
  };

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

  /* ── asset API: Forja overrides + repo file paths ── */
  function getAsset(skinId, slot) {
    const all = read(LS.skinAssets, {});
    return (all[skinId] && all[skinId][slot]) || null;
  }
  function setAsset(skinId, slot, dataURL) {
    const all = read(LS.skinAssets, {});
    if (!all[skinId]) all[skinId] = {};
    all[skinId][slot] = dataURL;
    write(LS.skinAssets, all);
  }
  function clearAssets(skinId) {
    const all = read(LS.skinAssets, {});
    delete all[skinId];
    write(LS.skinAssets, all);
  }
  function clearAllAssets() {
    write(LS.skinAssets, {});
  }
  // Priority: Forja dataURL > repo file path > null (CSS medallón fallback)
  function spriteMap(skinId) {
    const empty = { frame: null, tileL: null, tileD: null, manH: null, kingH: null, manF: null, kingF: null };
    if (!CLAN_SKINS.has(skinId)) return empty;
    const overrides = read(LS.skinAssets, {})[skinId] || {};
    const result = {};
    for (const slot of Object.keys(CLAN_FILES)) {
      result[slot] = overrides[slot] || ('assets/skins/' + skinId + '/' + CLAN_FILES[slot]);
    }
    return result;
  }
  // Sets CSS custom props on board element so board.css var() references pick them up.
  // For CSS-only skins: clears all vars so static medallón rules take over.
  function applySkinAssets(el, skinId) {
    if (!CLAN_SKINS.has(skinId)) {
      for (const prop of Object.values(SLOT_PROP)) el.style.removeProperty(prop);
      return;
    }
    const map = spriteMap(skinId);
    for (const [slot, prop] of Object.entries(SLOT_PROP)) {
      const val = map[slot];
      if (val) {
        // Wrap file paths and dataURLs uniformly in url(...)
        const urlVal = val.startsWith('data:') ? 'url(' + val + ')' : 'url(' + val + ')';
        el.style.setProperty(prop, urlVal);
      } else {
        el.style.removeProperty(prop);
      }
    }
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
  function createGame(difficulty, rulesKey) {
    const g = games();
    const id = newId();
    const rk    = rulesKey || 'english';
    const rules = global.Damas.RULES[rk] || global.Damas.RULES.english;
    g[id] = {
      id, difficulty, rulesKey: rk, status: 'in_progress', toMove: 'human',
      board: global.Damas.initialBoard(rules), history: [],
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
    const skin   = opts.skin   || 'emerald';
    const finish = opts.finish || 'glossy';
    const rules  = opts.rules  || global.Damas.RULES.english;
    const S      = rules.boardSize;
    const board  = opts.board  || global.Damas.initialBoard(rules);
    el.classList.add('board');
    if (opts.mini) el.classList.add('mini');
    el.setAttribute('data-size', S);
    el.innerHTML = '';
    const sq = document.createElement('div'); sq.className = 'squares';
    for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
      const d = document.createElement('div');
      d.className = 'sq ' + (global.Damas.isDark(r, c) ? 'dark' : 'light');
      sq.appendChild(d);
    }
    el.appendChild(sq);
    const pl = document.createElement('div'); pl.className = 'pieces';
    for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
      const p = board[r][c]; if (!p) continue;
      const pc = document.createElement('div');
      pc.className = 'piece ' + p.player + (p.king ? ' king' : '');
      pc.dataset.finish = finish;
      pc.style.top = (r / S * 100) + '%'; pc.style.left = (c / S * 100) + '%';
      const disc = document.createElement('span'); disc.className = 'disc';
      if (p.king) { const cr = document.createElement('span'); cr.className = 'crown'; cr.textContent = '♔'; disc.appendChild(cr); }
      pc.appendChild(disc); pl.appendChild(pc);
    }
    el.appendChild(pl);
    applySkin(el, skin);
    applySkinAssets(el, skin);
  }

  global.Store = {
    SKINS, skinById, user, setUser, renderStaticBoard,
    owned, buy, isOwned, activeSkin, setActiveSkin, applySkin,
    getAsset, setAsset, clearAssets, clearAllAssets, spriteMap, applySkinAssets, CLAN_SKINS,
    stats, setStats, recordResult,
    games, saveGames, getGame, createGame, updateGame, deleteGame, activeGames,
    timeAgo, price, navbar, mountNav,
  };
})(window);
