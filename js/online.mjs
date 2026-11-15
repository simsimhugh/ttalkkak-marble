// Online accounts + rankings (Firebase Auth + Firestore). The game works without it:
// if the SDK can't load, the account row just says so.
// Login is a nickname + 4-digit PIN. Firebase wants an email and a 6+ char password, so the
// nickname is hex-encoded into a fake address and the PIN is padded. ponytail: a 4-digit PIN is
// guessable (Firebase throttles repeated failures) — fine for a game ranking, nothing more.
// a web app's config is public by design; access is controlled by firestore.rules
const CFG = { apiKey: 'AIzaSyCxtVobxJmrsc3wS03E1KYWCplF9KxhJIo', authDomain: 'ttalkkak-marble.firebaseapp.com', projectId: 'ttalkkak-marble', appId: '1:747965029872:web:656ccf06088972a90b9135' };
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const box = document.getElementById('acct');
let fb = null, user = null, me = null, creating = null; // me: this account's players/{uid} doc

const hex = s => [...new TextEncoder().encode(s)].map(b => b.toString(16).padStart(2, '0')).join('');
const emailOf = id => `${hex(id.toLowerCase())}@ttalkkak.game`;
const passOf = pin => `${pin}#ttm`;
const ID_RE = /^[0-9A-Za-z가-힣_]{2,10}$/;

function render(msg = '') {
  if (!fb) { box.innerHTML = `<span class="muted">${msg || '온라인 기록을 불러오는 중…'}</span>`; return; }
  if (user) {
    const s = me || { games: 0, wins: 0 };
    box.innerHTML = `<span>👤 <b>${esc(me?.id || '')}</b> · ${s.games}판 ${s.wins}승</span><button type="button" class="btn" data-a="out">로그아웃</button>`;
  } else {
    box.innerHTML = `<input id="acct-id" placeholder="아이디" maxlength="10" autocomplete="username" aria-label="아이디">
      <input id="acct-pin" placeholder="비번 4자리" maxlength="4" inputmode="numeric" type="password" autocomplete="current-password" aria-label="비밀번호 숫자 4자리">
      <button type="button" class="btn primary" data-a="in">로그인</button><button type="button" class="btn" data-a="new">가입</button>
      <span class="muted">${msg || '로그인하면 판 결과가 랭킹에 올라가요'}</span>`;
  }
}

box.addEventListener('click', async e => {
  const a = e.target.closest('button[data-a]')?.dataset.a; if (!a || !fb) return;
  if (a === 'out') { await fb.signOut(fb.auth); return; }
  const id = document.getElementById('acct-id').value.trim(), pin = document.getElementById('acct-pin').value;
  if (!ID_RE.test(id)) return render('아이디는 한글·영문·숫자 2~10자예요');
  if (!/^\d{4}$/.test(pin)) return render('비번은 숫자 4자리예요');
  try {
    if (a === 'new') {
      me = { id, games: 0, wins: 0 }; // shown as soon as the auth state flips, before the profile write lands
      const c = await fb.createUserWithEmailAndPassword(fb.auth, emailOf(id), passOf(pin));
      await (creating = fb.setDoc(fb.doc(fb.db, 'players', c.user.uid), { id, games: 0, wins: 0, winRate: 0, bestAssets: 0, landmarks: 0, bestRun: 0, runClears: 0, updatedAt: fb.serverTimestamp() }));
      me = { id, games: 0, wins: 0 }; render();
    } else await fb.signInWithEmailAndPassword(fb.auth, emailOf(id), passOf(pin));
  } catch (err) {
    if (!user) me = null;
    const c = err.code || '';
    render(c.includes('email-already') ? '이미 있는 아이디예요' : c.includes('too-many') ? '시도가 너무 많아요. 잠시 뒤에 다시' : c.includes('invalid') || c.includes('wrong') || c.includes('not-found') ? '아이디나 비번이 맞지 않아요' : '연결에 실패했어요');
  }
});

/* one finished game for the logged-in account (the first human seat) */
async function record(r) {
  if (!fb || !user) return;
  await creating?.catch(() => {});
  const ref = fb.doc(fb.db, 'players', user.uid);
  try {
    me = await fb.runTransaction(fb.db, async tx => {
      const d = (await tx.get(ref)).data() || { id: me?.id || '?', games: 0, wins: 0, bestAssets: 0, landmarks: 0, bestRun: 0, runClears: 0 };
      const n = { ...d, games: d.games + 1, wins: d.wins + (r.win ? 1 : 0), bestAssets: Math.max(d.bestAssets, r.assets), landmarks: d.landmarks + r.landmarks,
        bestRun: Math.max(d.bestRun, r.run ?? 0), runClears: d.runClears + (r.run === 3 ? 1 : 0), updatedAt: fb.serverTimestamp() };
      n.winRate = Math.round(n.wins / n.games * 1000) / 10;
      tx.set(ref, n); return n;
    });
    toast(`🏆 기록 저장 · ${me.games}판 ${me.wins}승`, 'good', 3000); render();
  } catch (e) { toast('랭킹 기록 저장에 실패했어요', 'danger', 3000); }
}

const BOARDS = {
  wins: { name: '🏆 승리', f: 'wins', v: d => `${d.wins}승 / ${d.games}판` },
  winRate: { name: '📈 승률', f: 'winRate', v: d => `${d.winRate}% (${d.games}판)`, min: d => d.games >= 5, note: '5판 이상' },
  bestAssets: { name: '💰 최고 자산', f: 'bestAssets', v: d => fmt(d.bestAssets) },
  landmarks: { name: '🏰 랜드마크', f: 'landmarks', v: d => `${d.landmarks}개` },
  bestRun: { name: '🌏 세계 일주', f: 'bestRun', v: d => d.runClears ? `완주 ${d.runClears}회` : `${d.bestRun}/3 스테이지` },
};
async function showRanking() {
  if (!fb) { toast('온라인 기록을 쓸 수 없어요', 'danger', 3000); return; }
  let tab = 'wins';
  while (true) {
    const b = BOARDS[tab]; let html;
    try {
      const snap = await fb.getDocs(fb.query(fb.collection(fb.db, 'players'), fb.orderBy(b.f, 'desc'), fb.limit(50)));
      const rows = snap.docs.map(s => ({ uid: s.id, ...s.data() })).filter(d => d.games > 0 && (!b.min || b.min(d))).slice(0, 20);
      html = rows.length ? `<ol class="rank">${rows.map((d, k) => `<li class="${d.uid === user?.uid ? 'me' : ''}"><span><span class="stamp">${k + 1}위</span> ${esc(d.id)}</span><b>${b.v(d)}</b></li>`).join('')}</ol>`
        : '<p class="muted">아직 기록이 없어요. 첫 번째로 올라가 보세요!</p>';
    } catch (e) { html = '<p class="muted">랭킹을 불러오지 못했어요.</p>'; }
    if (b.note) html += `<p class="muted">${b.note}</p>`;
    const v = await modal({ title: b.name + ' 랭킹', html, noTimer: true,
      options: Object.entries(BOARDS).filter(([k]) => k !== tab).map(([k, x]) => ({ label: x.name, value: k })).concat([{ label: '닫기', value: 0, primary: true }]) });
    if (!v) return; tab = v;
  }
}

window.Online = { record, showRanking };
document.getElementById('btn-rank').addEventListener('click', showRanking);

(async () => {
  if (!CFG) { render('온라인 랭킹 준비 중'); return; }
  try {
    const [app, auth, fs] = await Promise.all(['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(f => import(SDK + f)));
    const a = app.initializeApp(CFG);
    fb = { ...auth, ...fs, auth: auth.getAuth(a), db: fs.getFirestore(a) };
    auth.onAuthStateChanged(fb.auth, async u => {
      user = u; if (!u) me = null; render();
      if (u) { try { me = (await fs.getDoc(fs.doc(fb.db, 'players', u.uid))).data() || me; } catch (e) {} render(); } // signup may have filled me already
    });
  } catch (e) { render('온라인 기록을 불러오지 못했어요'); }
})();
