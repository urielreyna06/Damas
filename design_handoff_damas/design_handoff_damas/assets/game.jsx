/* ============================================================
   DAMAS — Game board app (React)
   Multi-ruleset draughts vs AI, with skin theming + Tweaks.
   ============================================================ */
const { useState, useEffect, useRef, useCallback } = React;
const D = window.Damas;
const FILES = ['a','b','c','d','e','f','g','h','i','j'];
const sqName = ([r, c], S) => FILES[c] + (S - r);
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

let _pid = 0;
function piecesFromBoard(b) {
  const S = b.length;
  const out = [];
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
    const p = b[r][c];
    if (p) out.push({ id: 'p' + (_pid++), r, c, player: p.player, king: p.king });
  }
  return out;
}
function boardFromPieces(pieces, S) {
  S = S || 8;
  const b = Array.from({ length: S }, () => Array(S).fill(null));
  for (const p of pieces) { if (p.dying) continue; b[p.r][p.c] = { player: p.player, king: p.king }; }
  return b;
}

/* ----------------------------- robot mark ----------------------------- */
function RobotMark({ thinking }) {
  return (
    <span className={'bot' + (thinking ? ' thinking' : '')} aria-hidden="true">
      <svg viewBox="0 0 32 32" width="22" height="22">
        <rect x="6" y="9" width="20" height="16" rx="5" fill="currentColor" opacity="0.9" />
        <circle cx="12.5" cy="17" r="2.4" fill="#0E0E12" />
        <circle cx="19.5" cy="17" r="2.4" fill="#0E0E12" />
        <rect x="15" y="3" width="2" height="5" rx="1" fill="currentColor" />
        <circle cx="16" cy="3" r="2" fill="currentColor" />
      </svg>
    </span>
  );
}

/* ----------------------------- the piece ------------------------------ */
function Piece({ p, S, selected, selectable, shake, finish, onClick }) {
  const cls = ['piece', p.player, p.king ? 'king' : '', selected ? 'sel' : '',
    selectable ? 'selectable' : '', shake ? 'shake' : '', p.dying ? 'dying' : ''].join(' ');
  return (
    <div className={cls} data-finish={finish}
         style={{ top: (p.r / S * 100) + '%', left: (p.c / S * 100) + '%' }}
         onClick={selectable ? onClick : undefined}>
      <span className="disc">{p.king && <span className="crown">♔</span>}</span>
    </div>
  );
}

/* ----------------------------- the board ------------------------------ */
function Board({ boardRef, pieces, selected, targets, lastMove, shakeId,
                 toMove, status, theme, coords, hints, highlight, finish,
                 rules, onSquare, onPieceClick }) {
  const S = rules.boardSize;
  const targetSet = {};
  targets.forEach(m => { targetSet[m.to.join(',')] = m.captures.length > 0 ? 'cap' : 'move'; });
  const selPiece = pieces.find(p => p.id === selected);
  const selKey = selPiece ? selPiece.r + ',' + selPiece.c : null;
  const lf = lastMove ? lastMove.from.join(',') : null;
  const lt = lastMove ? lastMove.to.join(',') : null;
  const board = boardFromPieces(pieces, S);

  const squares = [];
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
    const key = r + ',' + c;
    const dark = D.isDark(r, c);
    const t = targetSet[key];
    const cls = ['sq', dark ? 'dark' : 'light',
      selKey === key ? 'selsq' : '',
      t === 'move' ? 'hint' : '', t === 'cap' ? 'hint-cap' : '',
      lf === key ? 'lastfrom' : '', lt === key ? 'lastto' : ''].join(' ');
    squares.push(
      <div key={key} className={cls} data-hint={hints ? '1' : '0'} data-hl={highlight}
           onClick={() => onSquare(r, c)} />
    );
  }

  const myTurn = toMove === 'human' && status === 'in_progress';
  const movableSet = {};
  if (myTurn) D.legalMoves(board, 'human', rules).forEach(m => { movableSet[m.from.join(',')] = true; });

  const fileLabels = FILES.slice(0, S);
  const rankLabels = Array.from({ length: S }, (_, i) => S - i);

  return (
    <div className="board" ref={boardRef} data-skin={theme} data-size={S} data-coords={coords ? '1' : '0'}>
      <div className="squares">{squares}</div>
      <div className="pieces">
        {pieces.map(p => (
          <Piece key={p.id} p={p} S={S} finish={finish}
                 selected={p.id === selected}
                 selectable={myTurn && p.player === 'human' && movableSet[p.r + ',' + p.c]}
                 shake={p.id === shakeId}
                 onClick={() => onPieceClick(p)} />
        ))}
      </div>
      {coords && (
        <>
          <div className="coords files">{fileLabels.map(f => <span key={f}>{f}</span>)}</div>
          <div className="coords ranks">{rankLabels.map(n => <span key={n}>{n}</span>)}</div>
        </>
      )}
    </div>
  );
}

/* ----------------------------- side panel ----------------------------- */
function SidePanel({ difficulty, rulesKey, toMove, aiThinking, status, history, counts, onAbandon }) {
  const diffMeta = ({
    easy:   { label: 'Aprendiz',           cls: 'badge-easy'   },
    medium: { label: 'Centinela',          cls: 'badge-medium' },
    hard:   { label: 'Maestro del Tiempo', cls: 'badge-hard'   },
    expert: { label: 'Guardián Ancestral', cls: 'badge-expert' },
  })[difficulty] || { label: difficulty, cls: 'badge-easy' };

  const rulesLabel = { english: 'Inglesas', spanish: 'Españolas', international: 'Internacional 10×10' };
  const u = window.Store.user();
  const last5 = history.slice(-5).reverse();

  function exportLog() {
    const lines = history.map((h, i) =>
      `${i + 1}. ${h.by}: ${h.from} → ${h.to}${h.caps > 0 ? ' ×' + h.caps : ''}`
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'damas-log.txt';
    a.click();
  }

  return (
    <aside className="panel">
      <div className="turn-card card" data-active={status === 'in_progress'}>
        <div className="players">
          <div className={'player' + (toMove === 'human' && status === 'in_progress' ? ' on' : '')}>
            <span className="pavatar">{u.initials}</span>
            <span className="pname">Tú</span>
          </div>
          <span className="vs">vs</span>
          <div className={'player ai' + (toMove === 'ai' && status === 'in_progress' ? ' on' : '')}>
            <span className="pavatar botavatar"><RobotMark thinking={aiThinking} /></span>
            <span className="pname">Damas IA</span>
          </div>
        </div>
        <div className="turn-status">
          {status !== 'in_progress'
            ? <span className="ts-done">Partida terminada</span>
            : aiThinking
              ? <span className="ts-think">La IA piensa<i className="dots"><i/><i/><i/></i></span>
              : toMove === 'human'
                ? <span className="ts-you">Tu turno</span>
                : <span className="ts-ai">Turno de la IA</span>}
        </div>
      </div>

      <div className="card meta-card">
        <div className="meta-row">
          <span className="muted">Dificultad</span>
          <span className={'badge ' + diffMeta.cls}><i className="dot" />{diffMeta.label}</span>
        </div>
        <div className="meta-row" style={{ marginTop: 8 }}>
          <span className="muted">Variante</span>
          <span className="muted-2" style={{ fontSize: 13 }}>{rulesLabel[rulesKey] || 'Inglesas'}</span>
        </div>
        <div className="divider" style={{ margin: '14px 0' }} />
        <div className="meta-row">
          <span className="muted">Tus piezas</span>
          <span className="mono pieces-count">{counts.human}</span>
        </div>
        <div className="meta-row" style={{ marginTop: 8 }}>
          <span className="muted">Piezas IA</span>
          <span className="mono pieces-count">{counts.ai}</span>
        </div>
      </div>

      <div className="card hist-card">
        <div className="hist-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Bitácora</span>
          {history.length > 0 && (
            <button onClick={exportLog}
              style={{ background: 'none', border: '1px solid var(--line)', color: 'var(--muted)', fontSize: 12,
                       padding: '3px 9px', borderRadius: 7, cursor: 'pointer' }}>
              Exportar
            </button>
          )}
        </div>
        {history.length === 0
          ? <div className="hist-empty muted-2">Sin movimientos — tú juegas primero.</div>
          : (
            <ul className="hist-list">
              {last5.map((h, i) => (
                <li key={history.length - i} className={'hist-item ' + (h.by === 'Tú' ? 'mine' : 'theirs')}>
                  <span className="hi-by">{h.by}</span>
                  <span className="hi-move mono">{h.from} → {h.to}</span>
                  {h.caps > 0 && <span className="hi-cap">×{h.caps}</span>}
                </li>
              ))}
            </ul>
          )}
      </div>

      <button className="abandon" onClick={onAbandon}>Abandonar partida</button>
    </aside>
  );
}

/* ----------------------------- end modal ------------------------------ */
function EndModal({ result, difficulty, rulesKey, onAgain }) {
  if (!result) return null;
  const meta = {
    win:  { t: 'Victoria', s: 'Superaste a la máquina. Bien hecho.', cls: 'win' },
    loss: { t: 'Derrota',  s: 'La IA se lleva esta. ¿Revancha?',    cls: 'loss' },
    draw: { t: 'Tablas',   s: 'Batalla equilibrada — sin vencedor.', cls: 'draw' },
  }[result];
  return (
    <div className="modal-scrim fade-in">
      <div className="modal card">
        <span className={'result-badge ' + meta.cls}>{result === 'win' ? '♔' : result === 'loss' ? '♚' : '½'}</span>
        <h2 className="result-title">{meta.t}</h2>
        <p className="result-sub muted">{meta.s}</p>
        <div className="modal-actions">
          <button className="btn btn-gold btn-lg btn-block" onClick={onAgain}>Jugar de nuevo</button>
          <a className="btn btn-ghost btn-block" href="leaderboard.html">Ver clasificación</a>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- main app ------------------------------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "emerald",
  "finish": "glossy",
  "highlight": "dots",
  "hints": true,
  "coords": true
}/*EDITMODE-END*/;

function App() {
  const params = new URLSearchParams(location.search);
  let gid = params.get('g');
  const initial = useRef(null);
  if (!initial.current) {
    let g = gid && window.Store.getGame(gid);
    if (!g) { gid = window.Store.createGame('medium', 'english'); g = window.Store.getGame(gid); }
    initial.current = g;
  }
  const game = initial.current;
  const rules = D.RULES[game.rulesKey] || D.RULES.english;
  const S = rules.boardSize;

  const [t, setTweak] = useTweaks({ ...TWEAK_DEFAULTS, theme: window.Store.activeSkin() });
  const [pieces, setPieces] = useState(() => piecesFromBoard(game.board));
  const piecesRef = useRef(pieces);
  const setPiecesBoth = useCallback((upd) => {
    setPieces(prev => {
      const next = typeof upd === 'function' ? upd(prev) : upd;
      piecesRef.current = next;
      return next;
    });
  }, []);
  const [toMove, setToMove] = useState(game.toMove);
  const [selected, setSelected] = useState(null);
  const [targets, setTargets] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [history, setHistory] = useState(game.history || []);
  const [status, setStatus] = useState(game.status);
  const [result, setResult] = useState(
    game.status === 'won' ? 'win' : game.status === 'lost' ? 'loss' : game.status === 'draw' ? 'draw' : null);
  const [aiThinking, setAiThinking] = useState(false);
  const [shakeId, setShakeId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const boardRef = useRef(null);
  const difficulty = game.difficulty;
  const endedRef = useRef(status !== 'in_progress');

  useEffect(() => {
    if (boardRef.current) window.Store.applySkin(boardRef.current, t.theme);
  }, [t.theme]);

  useEffect(() => { window.Store.mountNav('play'); }, []);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 1600); }

  const endGame = useCallback((winner) => {
    endedRef.current = true;
    const res = winner === 'human' ? 'win' : winner === 'ai' ? 'loss' : 'draw';
    const stat = res === 'win' ? 'won' : res === 'loss' ? 'lost' : 'draw';
    setStatus(stat); setBusy(true);
    window.Store.recordResult(res === 'win' ? 'win' : res === 'loss' ? 'loss' : 'draw');
    window.Store.updateGame(game.id, { status: stat, board: boardFromPieces(piecesRef.current, S) });
    setTimeout(() => setResult(res), 650);
  }, [game.id, S]);

  async function animateMove(move) {
    const moving = piecesRef.current.find(p => p.r === move.from[0] && p.c === move.from[1]);
    if (!moving) return;
    const id = moving.id;
    const capIds = move.captures.map(([cr, cc]) => {
      const cp = piecesRef.current.find(p => p.r === cr && p.c === cc && !p.dying);
      return cp ? cp.id : null;
    });
    for (let i = 0; i < move.path.length; i++) {
      const [tr, tc] = move.path[i];
      setPiecesBoth(ps => ps.map(p => p.id === id ? { ...p, r: tr, c: tc } : p));
      const capId = capIds[i];
      if (capId) {
        setTimeout(() => setPiecesBoth(ps => ps.map(p => p.id === capId ? { ...p, dying: true } : p)), 150);
        setTimeout(() => setPiecesBoth(ps => ps.filter(p => p.id !== capId)), 470);
      }
      await sleep(290);
    }
    const [fr] = move.to;
    setPiecesBoth(ps => ps.map(p => {
      if (p.id !== id) return p;
      const promo = !p.king && ((p.player === 'human' && fr === 0) || (p.player === 'ai' && fr === S - 1));
      return promo ? { ...p, king: true } : p;
    }));
    await sleep(40);
  }

  async function playMove(move, by) {
    await animateMove(move);
    const rec = { by: by === 'human' ? 'Tú' : 'Damas', from: sqName(move.from, S), to: sqName(move.to, S), caps: move.captures.length };
    setHistory(h => [...h, rec]);
    setLastMove({ from: move.from, to: move.to });
    const logicBoard = boardFromPieces(piecesRef.current, S);
    const next = by === 'human' ? 'ai' : 'human';
    window.Store.updateGame(game.id, { board: logicBoard, toMove: next, status });
    const w = D.winner(logicBoard, next, rules);
    if (w) { endGame(w); return; }
    setToMove(next);
    if (next === 'ai') { await aiThink(logicBoard); }
    else setBusy(false);
  }

  async function aiThink(board) {
    setAiThinking(true);
    await sleep(80);
    let mv = null;
    try { mv = D.aiMove(board, difficulty, rules); } catch (e) { mv = null; }
    await sleep(420);
    setAiThinking(false);
    if (!mv) { endGame('human'); return; }
    await playMove(mv, 'ai');
  }

  function onPieceClick(p) {
    if (busy || status !== 'in_progress' || toMove !== 'human') return;
    if (p.player !== 'human') return;
    if (selected === p.id) { setSelected(null); setTargets([]); return; }
    const board = boardFromPieces(piecesRef.current, S);
    const mv = D.movesForSquare(board, p.r, p.c, rules);
    if (mv.length === 0) {
      const all = D.legalMoves(board, 'human', rules);
      if (all.length && all[0].captures.length) showToast('Captura obligatoria');
      setShakeId(p.id); setTimeout(() => setShakeId(null), 420);
      setSelected(null); setTargets([]);
      return;
    }
    setSelected(p.id); setTargets(mv);
  }

  function onSquare(r, c) {
    if (busy || status !== 'in_progress' || toMove !== 'human') return;
    const hit = targets.find(m => m.to[0] === r && m.to[1] === c);
    if (hit) {
      setBusy(true); setSelected(null); setTargets([]);
      playMove(hit, 'human');
      return;
    }
    const board = boardFromPieces(piecesRef.current, S);
    if (board[r][c] && board[r][c].player === 'human') return;
    setSelected(null); setTargets([]);
  }

  function abandon() {
    if (!confirmAbandon) { setConfirmAbandon(true); setTimeout(() => setConfirmAbandon(false), 3000); return; }
    window.Store.recordResult('loss');
    window.Store.updateGame(game.id, { status: 'lost' });
    location.href = 'play.html';
  }

  function playAgain() {
    const id = window.Store.createGame(difficulty, game.rulesKey || 'english');
    location.href = 'game.html?g=' + id;
  }

  useEffect(() => {
    if (status === 'in_progress' && toMove === 'ai' && !endedRef.current) {
      setBusy(true);
      aiThink(boardFromPieces(piecesRef.current, S));
    }
    // eslint-disable-next-line
  }, []);

  const counts = D.countPieces(boardFromPieces(pieces, S));

  return (
    <div className="game-wrap wrap">
      <div className="game-top">
        <a className="back-link" href="play.html">← Todas las partidas</a>
        <div className="game-id mono muted-2">Partida #{game.id.slice(1)}</div>
      </div>

      <div className="game-layout">
        <div className="board-col">
          <div className="board-shell">
            <Board boardRef={boardRef} pieces={pieces} selected={selected} targets={targets}
                   lastMove={lastMove} shakeId={shakeId} toMove={toMove} status={status}
                   theme={t.theme} coords={t.coords} hints={t.hints} highlight={t.highlight}
                   finish={t.finish} rules={rules} onSquare={onSquare} onPieceClick={onPieceClick} />
            {toast && <div className="board-toast">{toast}</div>}
          </div>
        </div>

        <SidePanel difficulty={difficulty} rulesKey={game.rulesKey || 'english'}
                   toMove={toMove} aiThinking={aiThinking}
                   status={status} history={history} counts={counts}
                   onAbandon={abandon} />
      </div>

      {confirmAbandon && (
        <div className="confirm-bar fade-in">
          ¿Abandonar esta partida? Contará como derrota.
          <button className="btn btn-sm"
            style={{ background: 'var(--red-dim)', color: 'var(--red)', borderColor: 'rgba(229,99,77,.4)' }}
            onClick={abandon}>Sí, abandonar</button>
        </div>
      )}

      <EndModal result={result} difficulty={difficulty} rulesKey={game.rulesKey} onAgain={playAgain} />

      <TweaksPanel>
        <TweakSection label="Tema del tablero" />
        <TweakSelect label="Skin" value={t.theme}
                     options={window.Store.SKINS.map(s => ({ value: s.id, label: s.name }))}
                     onChange={v => setTweak('theme', v)} />
        <TweakRadio label="Acabado de piezas" value={t.finish}
                    options={['glossy', 'matte', 'flat']}
                    onChange={v => setTweak('finish', v)} />
        <TweakSection label="Asistencias" />
        <TweakRadio label="Resaltado" value={t.highlight}
                    options={['dots', 'ring', 'glow']}
                    onChange={v => setTweak('highlight', v)} />
        <TweakToggle label="Sugerencias de movimiento" value={t.hints} onChange={v => setTweak('hints', v)} />
        <TweakToggle label="Coordenadas" value={t.coords} onChange={v => setTweak('coords', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
