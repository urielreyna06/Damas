/* ============================================================
   DAMAS — English draughts engine (8x8)
   Rules: men move/capture diagonally forward; kings both ways
   (one square steps); capture is MANDATORY; multi-jumps chain;
   promotion on reaching the far row (ends a jump chain).
   Human = bottom (moves up / row-), AI = top (moves down / row+).
   ============================================================ */
(function (global) {
  const SIZE = 8;
  const inB = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  const isDark = (r, c) => (r + c) % 2 === 1;          // playable squares

  function initialBoard() {
    const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!isDark(r, c)) continue;
        if (r < 3) b[r][c] = { player: 'ai', king: false };
        else if (r > 4) b[r][c] = { player: 'human', king: false };
      }
    }
    return b;
  }

  const clone = (b) => b.map(row => row.map(c => (c ? { ...c } : null)));

  function dirsFor(piece) {
    if (piece.king) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    return piece.player === 'human' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  }

  function promotes(piece, r) {
    return !piece.king &&
      ((piece.player === 'human' && r === 0) || (piece.player === 'ai' && r === SIZE - 1));
  }

  // recursive capture sequences for the piece at r,c on board b
  function capturesFrom(b, r, c) {
    const piece = b[r][c];
    const out = [];
    for (const [dr, dc] of dirsFor(piece)) {
      const mr = r + dr, mc = c + dc, tr = r + 2 * dr, tc = c + 2 * dc;
      if (!inB(tr, tc) || b[tr][tc]) continue;
      const mid = b[mr][mc];
      if (!mid || mid.player === piece.player) continue;
      const nb = clone(b);
      nb[r][c] = null; nb[mr][mc] = null;
      let np = { ...piece }, didPromo = false;
      if (promotes(np, tr)) { np.king = true; didPromo = true; }
      nb[tr][tc] = np;
      const tail = didPromo ? [] : capturesFrom(nb, tr, tc);
      if (tail.length === 0) {
        out.push({ from: [r, c], to: [tr, tc], captures: [[mr, mc]], path: [[tr, tc]] });
      } else {
        for (const t of tail) {
          out.push({
            from: [r, c], to: t.to,
            captures: [[mr, mc], ...t.captures],
            path: [[tr, tc], ...t.path],
          });
        }
      }
    }
    return out;
  }

  // all legal moves for a player; forced-capture enforced
  function legalMoves(b, player) {
    const caps = [], simple = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const p = b[r][c];
        if (!p || p.player !== player) continue;
        const cs = capturesFrom(b, r, c);
        if (cs.length) { caps.push(...cs); continue; }
        for (const [dr, dc] of dirsFor(p)) {
          const nr = r + dr, nc = c + dc;
          if (inB(nr, nc) && !b[nr][nc]) {
            simple.push({ from: [r, c], to: [nr, nc], captures: [], path: [[nr, nc]] });
          }
        }
      }
    }
    return caps.length ? caps : simple;
  }

  // moves for a single source square (used by UI for highlighting)
  function movesForSquare(b, r, c) {
    const all = legalMoves(b, b[r][c] ? b[r][c].player : null);
    return all.filter(m => m.from[0] === r && m.from[1] === c);
  }

  function applyMove(b, m) {
    const nb = clone(b);
    const [fr, fc] = m.from, [tr, tc] = m.to;
    const p = { ...nb[fr][fc] };
    nb[fr][fc] = null;
    for (const [cr, cc] of m.captures) nb[cr][cc] = null;
    if (promotes(p, tr)) p.king = true;
    nb[tr][tc] = p;
    return nb;
  }

  function countPieces(b) {
    let human = 0, ai = 0;
    for (const row of b) for (const c of row) {
      if (!c) continue;
      if (c.player === 'human') human++; else ai++;
    }
    return { human, ai };
  }

  // returns 'human' | 'ai' | null (game over winner)
  function winner(b, toMove) {
    const { human, ai } = countPieces(b);
    if (human === 0) return 'ai';
    if (ai === 0) return 'human';
    if (legalMoves(b, toMove).length === 0) return toMove === 'human' ? 'ai' : 'human';
    return null;
  }

  /* ---------------------- AI ---------------------- */
  // positive score favors AI
  function evaluate(b) {
    let s = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const p = b[r][c];
        if (!p) continue;
        let v = p.king ? 350 : 100;
        // advancement bonus (encourage pushing toward promotion)
        if (!p.king) v += (p.player === 'ai' ? r : (SIZE - 1 - r)) * 6;
        // center & edge: edges are safe-ish
        if (c === 0 || c === SIZE - 1) v += 4;
        s += p.player === 'ai' ? v : -v;
      }
    }
    return s;
  }

  function minimax(b, depth, alpha, beta, maximizing) {
    const toMove = maximizing ? 'ai' : 'human';
    const w = winner(b, toMove);
    if (w) return w === 'ai' ? 100000 - (6 - depth) : -100000 + (6 - depth);
    if (depth === 0) return evaluate(b);
    const moves = legalMoves(b, toMove);
    if (maximizing) {
      let best = -Infinity;
      for (const m of moves) {
        best = Math.max(best, minimax(applyMove(b, m), depth - 1, alpha, beta, false));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const m of moves) {
        best = Math.min(best, minimax(applyMove(b, m), depth - 1, alpha, beta, true));
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  // pick AI move for difficulty: easy | medium | hard
  function aiMove(b, difficulty) {
    const moves = legalMoves(b, 'ai');
    if (moves.length === 0) return null;
    if (difficulty === 'easy') {
      // mostly random, but won't actively throw away a free multi-capture preference
      return moves[Math.floor(Math.random() * moves.length)];
    }
    const depth = difficulty === 'hard' ? 6 : 3;
    let best = -Infinity, bestMoves = [];
    for (const m of moves) {
      const score = minimax(applyMove(b, m), depth - 1, -Infinity, Infinity, false);
      if (score > best) { best = score; bestMoves = [m]; }
      else if (score === best) bestMoves.push(m);
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  global.Damas = {
    SIZE, isDark, initialBoard, clone, legalMoves, movesForSquare,
    applyMove, countPieces, winner, aiMove, evaluate,
  };
})(window);
