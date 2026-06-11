/* ============================================================
   DAMAS — Multi-ruleset draughts engine
   Supports: English (8×8), Spanish (8×8), International (10×10)
   Human = bottom (moves toward row 0), AI = top (moves toward row MAX).
   ============================================================ */
(function (global) {

  /* ── Rule presets ─────────────────────────────────────────── */
  const RULES = {
    english: {
      key: 'english', label: 'Damas Inglesas',
      boardSize: 8, menCaptureBackward: false,
      flyingKings: false, forceMaximumCapture: false, promoteDuringCapture: false,
    },
    spanish: {
      key: 'spanish', label: 'Damas Españolas',
      boardSize: 8, menCaptureBackward: true,
      flyingKings: true, forceMaximumCapture: true, promoteDuringCapture: true,
    },
    international: {
      key: 'international', label: 'Damas Internacionales',
      boardSize: 10, menCaptureBackward: true,
      flyingKings: true, forceMaximumCapture: true, promoteDuringCapture: false,
    },
  };

  /* ── Helpers ──────────────────────────────────────────────── */
  const inB    = (r, c, S) => r >= 0 && r < S && c >= 0 && c < S;
  const isDark = (r, c)    => (r + c) % 2 === 1;
  const clone  = (b)       => b.map(row => row.map(c => (c ? { ...c } : null)));

  function promotes(piece, r, rules) {
    return !piece.king && (
      (piece.player === 'human' && r === 0) ||
      (piece.player === 'ai'    && r === rules.boardSize - 1)
    );
  }

  const ALL_DIRS = [[-1,-1],[-1,1],[1,-1],[1,1]];

  function moveDirs(piece) {
    if (piece.king) return ALL_DIRS;
    return piece.player === 'human' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  }

  function captureDirs(piece, rules) {
    if (piece.king || rules.menCaptureBackward) return ALL_DIRS;
    return piece.player === 'human' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  }

  /* ── Board initialisation ─────────────────────────────────── */
  function initialBoard(rules = RULES.english) {
    const S    = rules.boardSize;
    const rows = Math.floor((S - 2) / 2); // 3 for 8×8, 4 for 10×10
    const b    = Array.from({ length: S }, () => Array(S).fill(null));
    for (let r = 0; r < S; r++) {
      for (let c = 0; c < S; c++) {
        if (!isDark(r, c)) continue;
        if (r < rows)           b[r][c] = { player: 'ai',    king: false };
        else if (r >= S - rows) b[r][c] = { player: 'human', king: false };
      }
    }
    return b;
  }

  /* ── Capture enumeration (mutate + restore, capturedSet) ──── */
  /*
   * `captured` tracks pieces already taken in this chain (Set of "r,c" keys).
   * The board is mutated in-place during recursion and restored after each
   * branch — no cloning at each recursive step.
   * Captured pieces stay physically in `b` (FMJD: removed only at end of move)
   * but are treated as absent when deciding capture targets and blocking passage.
   */
  function _capturesHelper(b, r, c, rules, captured) {
    const piece = b[r][c];
    const S     = rules.boardSize;
    const out   = [];
    const dirs  = captureDirs(piece, rules);

    if (rules.flyingKings && piece.king) {
      /* Flying king: scan each diagonal for the first capturable enemy */
      for (const [dr, dc] of dirs) {
        let er = -1, ec = -1;
        for (let d = 1; inB(r + d*dr, c + d*dc, S); d++) {
          const sr = r + d*dr, sc = c + d*dc;
          if (captured.has(`${sr},${sc}`)) break;       // captured piece blocks
          if (!b[sr][sc]) continue;                      // empty square
          if (b[sr][sc].player === piece.player) break;  // own piece blocks
          er = sr; ec = sc; break;
        }
        if (er === -1) continue;

        const enemyKey    = `${er},${ec}`;
        const newCaptured = new Set(captured);
        newCaptured.add(enemyKey);

        /* Try every empty landing square beyond the enemy */
        for (let d = 1; ; d++) {
          const lr = er + d*dr, lc = ec + d*dc;
          if (!inB(lr, lc, S)) break;
          if (captured.has(`${lr},${lc}`)) break; // captured piece blocks passage
          if (b[lr][lc]) break;                    // live piece blocks

          const origFrom = b[r][c];
          b[r][c]   = null;
          b[lr][lc] = { ...piece };

          const tail = _capturesHelper(b, lr, lc, rules, newCaptured);

          b[r][c]   = origFrom;
          b[lr][lc] = null;

          if (tail.length === 0) {
            out.push({ from: [r,c], to: [lr,lc], captures: [[er,ec]], path: [[lr,lc]] });
          } else {
            for (const t of tail) {
              out.push({
                from: [r,c], to: t.to,
                captures: [[er,ec], ...t.captures],
                path: [[lr,lc], ...t.path],
                ...(t.promoted ? { promoted: true } : {}),
              });
            }
          }
        }
      }
    } else {
      /* Non-flying piece (or man under any rules): single-step jump */
      for (const [dr, dc] of dirs) {
        const mr = r + dr,   mc = c + dc;
        const tr = r + 2*dr, tc = c + 2*dc;
        if (!inB(tr, tc, S)) continue;

        const midKey = `${mr},${mc}`;
        if (captured.has(midKey)) continue;
        if (b[tr][tc]) continue;

        const mid = b[mr][mc];
        if (!mid || mid.player === piece.player) continue;

        const newCaptured = new Set(captured);
        newCaptured.add(midKey);

        let np       = { ...piece };
        let didPromo = false;
        if (promotes(np, tr, rules)) { np.king = true; didPromo = true; }

        /* promoteDuringCapture=true → promoted king may continue chain */
        const canContinue = !didPromo || rules.promoteDuringCapture;

        const origFrom = b[r][c];
        b[r][c]  = null;
        b[tr][tc] = np;

        const tail = canContinue ? _capturesHelper(b, tr, tc, rules, newCaptured) : [];

        b[r][c]  = origFrom;
        b[tr][tc] = null;

        if (tail.length === 0) {
          out.push({
            from: [r,c], to: [tr,tc], captures: [[mr,mc]], path: [[tr,tc]],
            ...(didPromo ? { promoted: true } : {}),
          });
        } else {
          for (const t of tail) {
            out.push({
              from: [r,c], to: t.to,
              captures: [[mr,mc], ...t.captures],
              path: [[tr,tc], ...t.path],
              ...(didPromo || t.promoted ? { promoted: true } : {}),
            });
          }
        }
      }
    }
    return out;
  }

  function capturesFrom(b, r, c, rules = RULES.english) {
    return _capturesHelper(b, r, c, rules, new Set());
  }

  /* ── Legal moves ──────────────────────────────────────────── */
  function legalMoves(b, player, rules = RULES.english) {
    const S    = rules.boardSize;
    const caps = [], simple = [];

    for (let r = 0; r < S; r++) {
      for (let c = 0; c < S; c++) {
        const p = b[r][c];
        if (!p || p.player !== player) continue;

        const cs = capturesFrom(b, r, c, rules);
        if (cs.length) { caps.push(...cs); continue; }

        const dirs = moveDirs(p);
        if (rules.flyingKings && p.king) {
          for (const [dr, dc] of dirs) {
            for (let d = 1; ; d++) {
              const nr = r + d*dr, nc = c + d*dc;
              if (!inB(nr, nc, S) || b[nr][nc]) break;
              simple.push({ from: [r,c], to: [nr,nc], captures: [], path: [[nr,nc]] });
            }
          }
        } else {
          for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (inB(nr, nc, S) && !b[nr][nc])
              simple.push({ from: [r,c], to: [nr,nc], captures: [], path: [[nr,nc]] });
          }
        }
      }
    }

    if (caps.length) {
      if (rules.forceMaximumCapture) {
        const maxLen = Math.max(...caps.map(m => m.captures.length));
        return caps.filter(m => m.captures.length === maxLen);
      }
      return caps;
    }
    return simple;
  }

  /* Moves available from a single source square (used by UI) */
  function movesForSquare(b, r, c, rules = RULES.english) {
    const p = b[r][c];
    if (!p) return [];
    return legalMoves(b, p.player, rules).filter(m => m.from[0] === r && m.from[1] === c);
  }

  /* Apply a move and return a new board */
  function applyMove(b, m, rules = RULES.english) {
    const nb       = clone(b);
    const [fr, fc] = m.from, [tr, tc] = m.to;
    const p        = { ...nb[fr][fc] };
    nb[fr][fc] = null;
    for (const [cr, cc] of m.captures) nb[cr][cc] = null;
    /* m.promoted covers mid-chain promotions where m.to is not the promotion row */
    if (m.promoted || promotes(p, tr, rules)) p.king = true;
    nb[tr][tc] = p;
    return nb;
  }

  /* ── Board inspection ─────────────────────────────────────── */
  function countPieces(b) {
    let human = 0, ai = 0;
    for (const row of b) for (const c of row) {
      if (!c) continue;
      if (c.player === 'human') human++; else ai++;
    }
    return { human, ai };
  }

  function winner(b, toMove, rules = RULES.english) {
    const { human, ai } = countPieces(b);
    if (human === 0) return 'ai';
    if (ai    === 0) return 'human';
    if (legalMoves(b, toMove, rules).length === 0)
      return toMove === 'human' ? 'ai' : 'human';
    return null;
  }

  /* ── Evaluation & AI ──────────────────────────────────────── */
  /* Positive score favors AI */
  function evaluate(b, rules = RULES.english) {
    const S = rules.boardSize;
    let s = 0;
    for (let r = 0; r < S; r++) {
      for (let c = 0; c < S; c++) {
        const p = b[r][c];
        if (!p) continue;
        let v = p.king ? 350 : 100;
        if (!p.king) v += (p.player === 'ai' ? r : (S - 1 - r)) * 6;
        if (c === 0 || c === S - 1) v += 4;
        s += p.player === 'ai' ? v : -v;
      }
    }
    return s;
  }

  function minimax(b, depth, alpha, beta, maximizing, rules) {
    const toMove = maximizing ? 'ai' : 'human';
    const w      = winner(b, toMove, rules);
    if (w) return w === 'ai' ? 100000 - (8 - depth) : -100000 + (8 - depth);
    if (depth === 0) return evaluate(b, rules);
    const moves = legalMoves(b, toMove, rules);
    if (maximizing) {
      let best = -Infinity;
      for (const m of moves) {
        best  = Math.max(best, minimax(applyMove(b, m, rules), depth - 1, alpha, beta, false, rules));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const m of moves) {
        best = Math.min(best, minimax(applyMove(b, m, rules), depth - 1, alpha, beta, true, rules));
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  /* 1-ply greedy best-first; random tiebreak */
  function aStarGreedy(b, rules) {
    const moves = legalMoves(b, 'ai', rules);
    if (!moves.length) return null;
    let best = -Infinity, pool = [];
    for (const m of moves) {
      const score = evaluate(applyMove(b, m, rules), rules);
      if (score > best) { best = score; pool = [m]; }
      else if (score === best) pool.push(m);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /*
   * Difficulty:
   *   easy   → random
   *   medium → 1-ply greedy (aStarGreedy)
   *   hard   → minimax depth 3
   *   expert → minimax depth 4
   */
  function aiMove(b, difficulty, rules = RULES.english) {
    const moves = legalMoves(b, 'ai', rules);
    if (!moves.length) return null;

    if (difficulty === 'easy')
      return moves[Math.floor(Math.random() * moves.length)];

    if (difficulty === 'medium')
      return aStarGreedy(b, rules);

    const depth = difficulty === 'expert' ? 4 : 3;
    let best = -Infinity, pool = [];
    for (const m of moves) {
      const score = minimax(applyMove(b, m, rules), depth - 1, -Infinity, Infinity, false, rules);
      if (score > best) { best = score; pool = [m]; }
      else if (score === best) pool.push(m);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ── Public API ───────────────────────────────────────────── */
  global.Damas = {
    RULES, isDark, initialBoard, clone,
    legalMoves, movesForSquare, applyMove,
    countPieces, winner, evaluate, aiMove,
  };

})(window);
