// Headless balance simulator. Usage: node tools/balance-sim.mjs index.html [games=300] [roundLimit=30]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const html = fs.readFileSync(process.argv[2], 'utf8');
let src = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];

// --- stub three.js imports ---
src = src.replace(/import \* as THREE from 'three';/, "const THREE=globalThis.__ANY;")
         .replace(/import \{ (\w+) \} from 'three\/addons\/[^']+';/g, "const $1=globalThis.__ANY;");
// --- make animations/sleeps instant ---
src = src.replace(/function tween\(obj,from,to,ms,arc=0\.5\)\{[\s\S]*?\n\}/, "function tween(){return Promise.resolve();}");
src = src.replace(/const sleep=ms=>\{[^\n]*\n/, "const sleep=ms=>new Promise(r=>setImmediate(r));\n");
src = src.replace(/requestAnimationFrame\(frame\);/g, "");
// cinematics resolve through the render loop, which never runs headlessly
src = src.replace(/function nukeCinematic\(i,rng,hits\)\{/, "function nukeCinematic(){return Promise.resolve();}\nfunction _nukeCinematicUnused(i,rng,hits){");
src = src.replace(/async function sail\(p,from,to,kind,ms,dest\)\{/, "async function sail(p){p.anim=false;}\nasync function _sailUnused(p,from,to,kind,ms,dest){");
// --- expose internals ---
src += "\nglobalThis.__sim={startGame,getG:()=>G,CHARS,newPlayer,TILES,assets,bump:()=>RUN++};\n";

// --- universal stub ---
const handler = {
  get(t, k) { if (k === Symbol.toPrimitive) return () => 0; if (k === 'then') return undefined; if (k === 'length') return 0; if (k === 'fonts') return undefined; if (k === 'hidden') return true; return ANY; },
  set() { return true; }, construct() { return ANY; }, apply() { return ANY; }, has() { return true; },
};
const ANY = new Proxy(function () {}, handler);
globalThis.__ANY = ANY;
globalThis.window = { AudioContext: undefined, webkitAudioContext: undefined };
globalThis.document = ANY;
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.ResizeObserver = class { observe() {} };
globalThis.requestAnimationFrame = () => 0;
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
globalThis.matchMedia = () => ({ matches: false });
globalThis.addEventListener = () => {};
globalThis.getComputedStyle = () => ({ transform: 'none' });
globalThis.screen = {};
globalThis.location = { hostname: 'sim' };
try { Object.defineProperty(globalThis, 'navigator', { value: { maxTouchPoints: 0 }, configurable: true }); } catch (e) {}
globalThis.DOMMatrix = class { inverse() { return this; } transformPoint(p) { return p; } };
globalThis.DOMPoint = class { constructor(x, y) { this.x = x; this.y = y; } };

const tmp = path.join(path.dirname(process.argv[2]), '_game_sim.mjs');
fs.writeFileSync(tmp, src);
await import(pathToFileURL(tmp).href);
const sim = globalThis.__sim;

const GAMES = +process.argv[3] || 300, LIMIT = +process.argv[4] || 30;
const ids = sim.CHARS.map(c => c.id);
const stat = Object.fromEntries(ids.map(id => [id, { games: 0, wins: 0, assets: 0, bankrupt: 0, first: 0 }]));
const reasons = {};
const origLog = console.log;
for (let g = 0; g < GAMES; g++) {
  const pool = [...ids].sort(() => Math.random() - 0.5).slice(0, 4);
  const G = {
    players: pool.map((ch, k) => sim.newPlayer(k, { name: ch, ai: true, ch })),
    ts: sim.TILES.map(() => ({ owner: null, level: 0 })), festival: null, round: 1, cur: 0, over: false, logs: [],
    limit: LIMIT, speed: 0.01, stable: null,
  };
  sim.bump();
  sim.startGame(G);
  let guard = 0;
  while (!G.over && guard++ < 200000) await new Promise(r => setImmediate(r));
  if (!G.over) { origLog('stalled game', g); continue; }
  const alive = G.players.filter(p => !p.bankrupt);
  const w = alive.reduce((a, b) => sim.assets(b) > sim.assets(a) ? b : a);
  // winner = the one endGame picked: last log line mentions 승리
  const winLine = G.logs.find(l => l[0].includes('승리!'));
  const winner = winLine && winLine[1] != null ? G.players[winLine[1]] : w;
  const reason = winLine ? winLine[0].replace(/<[^>]+>/g, '').split('🏆')[1]?.trim().slice(0, 30) : '?';
  reasons[reason] = (reasons[reason] || 0) + 1;
  G.players.forEach((p, k) => { const s = stat[p.ch]; s.games++; s.assets += sim.assets(p); if (p.bankrupt) s.bankrupt++; if (p === winner) s.wins++; if (k === 0) s.first++; });
  if (g % 50 === 49) origLog('...', g + 1);
}
origLog('\n=== ' + GAMES + ' games, limit ' + LIMIT + ' ===');
for (const id of ids) {
  const s = stat[id], c = sim.CHARS.find(c => c.id === id);
  origLog(`${c.emoji} ${c.name.padEnd(4)} games ${String(s.games).padStart(4)}  win ${(100 * s.wins / s.games).toFixed(1).padStart(5)}%  bankrupt ${(100 * s.bankrupt / s.games).toFixed(1).padStart(5)}%  avg assets ${(s.assets / s.games).toFixed(0).padStart(5)}`);
}
origLog('win reasons:', reasons);
