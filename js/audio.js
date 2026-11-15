'use strict';
/* =================== SOUND (Web Audio synth, no files) =================== */
const SFX=(()=>{
  let ctx=null,master=null,muted=false,noiseBuf=null;
  try{muted=localStorage.getItem('el-mute')==='1';}catch(e){}
  function ensure(){
    if(ctx)return true;
    try{ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0.5;master.connect(ctx.destination);loadSamples();
      noiseBuf=ctx.createBuffer(1,ctx.sampleRate*1.5,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return true;}catch(e){return false;}
  }
  function unlock(){if(ensure()&&ctx.state==='suspended')ctx.resume();}
  const now=()=>ctx.currentTime;
  function tone({f=440,f2=null,type='sine',t=0,dur=.15,vol=.3,attack=.005,decay=null,slide=null}){
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;const t0=now()+t;
    o.frequency.setValueAtTime(f,t0);if(f2!=null)o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t0+(slide||dur));
    g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+attack);g.gain.exponentialRampToValueAtTime(0.0001,t0+(decay||dur));
    o.connect(g).connect(master);o.start(t0);o.stop(t0+(decay||dur)+.05);
  }
  function noise({t=0,dur=.2,vol=.3,hp=null,lp=null,q=1,slideLp=null}){
    const s=ctx.createBufferSource();s.buffer=noiseBuf;const g=ctx.createGain();const t0=now()+t;let node=s;
    if(hp){const h=ctx.createBiquadFilter();h.type='highpass';h.frequency.value=hp;node.connect(h);node=h;}
    if(lp){const l=ctx.createBiquadFilter();l.type='lowpass';l.frequency.setValueAtTime(lp,t0);l.Q.value=q;if(slideLp)l.frequency.exponentialRampToValueAtTime(slideLp,t0+dur);node.connect(l);node=l;}
    g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);node.connect(g).connect(master);s.start(t0);s.stop(t0+dur+.05);
  }
  /* recorded foley (Kenney, CC0) in sfx/: [file, gain, lead-in to skip]. Gains level each take to about -18 dBFS RMS (capped by its peak)
     and the lead trims the silence before the hit, so a hop sounds on the hop. Missing or undecodable files leave the synth voice. */
  const SAMP={"dice":[["dice1",1.45,0.028],["dice2",1.51,0.052],["dice3",1.46,0.073],["dice4",1.41,0.118]],"hop":[["hop1",0.76,0],["hop2",0.91,0],["hop3",0.89,0],["hop4",0.99,0]],"land":[["land1",0.87,0],["land2",0.92,0],["land3",0.88,0],["land4",0.88,0]],"coin":[["coin1",1.43,0.077],["coin2",1.48,0.026],["coin3",1.17,0.121],["coin4",1.38,0.042]],"pay":[["pay1",1.4,0.025],["pay2",1.5,0.054],["pay3",1.15,0.049]],"buy":[["buy1",1.4,0.007],["buy2",1.41,0.016],["buy3",1.64,0.032],["buy4",1.6,0.058]],"card":[["card1",1.01,0.131],["card2",0.98,0.011],["card3",1.14,0.132]],"hammer":[["hammer1",0.62,0],["hammer2",0.73,0],["hammer3",0.79,0],["hammer4",0.84,0]],"crash":[["crash1",1.29,0],["crash2",0.79,0],["crash3",1.23,0],["crash4",1.27,0]],"debris":[["debris1",0.93,0],["debris2",1.0,0],["debris3",1.19,0],["debris4",0.87,0]],"click":[["click1",0.9,0],["click2",0.76,0],["click3",0.8,0],["click4",0.58,0]],"tick":[["tick1",0.56,0],["tick2",0.74,0],["tick3",0.65,0.012]],"pop":[["pop1",0.95,0],["pop2",1.02,0]]};const sbuf={};let sLoading=false;
  function loadSamples(){if(sLoading)return;sLoading=true;Object.values(SAMP).flat().forEach(([n])=>fetch(`sfx/${n}.ogg`).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(a=>ctx.decodeAudioData(a)).then(b=>{sbuf[n]=b;}).catch(()=>{}));}
  function sample(g,{t=0,vol=1,rate=1}={}){const l=(SAMP[g]||[]).filter(([n])=>sbuf[n]);if(!l.length)return false;const [n,gain,lead]=l[Math.random()*l.length|0];
    const src=ctx.createBufferSource(),gn=ctx.createGain();src.buffer=sbuf[n];src.playbackRate.value=rate*(.96+Math.random()*.08);gn.gain.value=gain*vol;src.connect(gn).connect(master);src.start(now()+t,lead);return true;}
  const lib={
    meter(v){const st=[0,2,4,5,7,9,11,12,14,16,17][Math.max(0,Math.min(10,v-2))];tone({f:523*Math.pow(2,st/12),type:'sine',dur:.07,vol:.09,attack:.003});}, // pointer sweep: one clean note per number, rising with it
    tick(){if(sample('tick',{vol:.35}))return;tone({f:1800,type:'square',dur:.03,vol:.08});},
    stop(){tone({f:900,f2:300,type:'square',dur:.12,vol:.25});},
    dice(){if(sample('dice'))return;for(let k=0;k<6;k++)noise({t:k*.06,dur:.05,vol:.35,hp:1800});tone({f:600,f2:900,type:'triangle',t:.38,dur:.18,vol:.4});},
    dbl(){[0,.09,.18].forEach((t,k)=>tone({f:[660,880,1320][k],type:'square',t,dur:.14,vol:.2}));},
    hop(){if(sample('hop',{vol:.45}))return;tone({f:420,f2:760,type:'sine',dur:.09,vol:.18});},
    land(){if(sample('land',{vol:.7}))return;tone({f:300,f2:120,type:'triangle',dur:.16,vol:.3});noise({dur:.08,vol:.15,lp:800});},
    coin(){const s=sample('coin',{vol:.8});tone({f:1320,type:'sine',dur:.08,vol:s?.1:.35});tone({f:1760,type:'sine',t:.07,dur:.22,vol:s?.12:.35});},
    pay(){const s=sample('pay',{vol:.8});tone({f:520,f2:260,type:'sawtooth',dur:.28,vol:s?.1:.32});if(!s)noise({dur:.15,vol:.2,lp:1200});},
    buy(){sample('buy',{vol:.8});[0,.08,.16].forEach((t,k)=>tone({f:[523,659,784][k],type:'triangle',t,dur:.22,vol:.22}));},
    build(){for(let k=0;k<3;k++){noise({t:k*.11,dur:.06,vol:.3,lp:600});tone({f:200,f2:120,type:'square',t:k*.11,dur:.07,vol:.15});}tone({f:784,f2:1046,type:'triangle',t:.36,dur:.3,vol:.22});},
    landmark(){[0,.1,.2,.3,.45].forEach((t,k)=>tone({f:[523,659,784,1046,1318][k],type:'triangle',t,dur:.4,vol:.22}));noise({t:.45,dur:.6,vol:.1,hp:4000});},
    card(){noise({dur:.12,vol:.2,hp:1500,lp:6000});tone({f:1200,f2:1600,type:'sine',t:.1,dur:.12,vol:.15});},
    bad(){tone({f:330,f2:180,type:'sawtooth',dur:.35,vol:.2});tone({f:262,f2:140,type:'sawtooth',t:.15,dur:.4,vol:.18});},
    skill(){[0,.06,.12,.18,.24].forEach((t,k)=>tone({f:880*Math.pow(2,k/5),type:'sine',t,dur:.25,vol:.16}));noise({dur:.5,vol:.08,hp:5000});},
    pull(){noise({dur:.5,vol:.3,lp:400,slideLp:3000});tone({f:200,f2:900,type:'sawtooth',dur:.45,vol:.12});},
    siren(){for(let k=0;k<3;k++){tone({f:500,f2:900,type:'sawtooth',t:k*.7,dur:.35,vol:.12,slide:.35});tone({f:900,f2:500,type:'sawtooth',t:k*.7+.35,dur:.35,vol:.12,slide:.35});}tone({f:2400,f2:300,type:'sine',t:.2,dur:2,vol:.18,slide:2});},
    nuke(){noise({dur:2.2,vol:1,lp:4000,slideLp:60});tone({f:60,f2:25,type:'sine',dur:2,vol:.8});noise({t:.05,dur:.4,vol:.6,hp:2500});tone({f:120,f2:40,type:'square',t:.1,dur:1.2,vol:.25});},
    island(){tone({f:440,f2:220,type:'triangle',dur:.5,vol:.2});tone({f:330,f2:165,type:'triangle',t:.2,dur:.6,vol:.18});},
    travel(){tone({f:600,f2:1400,type:'sine',dur:.4,vol:.2});noise({dur:.5,vol:.12,hp:3000});},
    festival(){[0,.1,.2,.3].forEach((t,k)=>tone({f:[784,988,1175,1568][k],type:'square',t,dur:.2,vol:.12}));},
    bankrupt(){[0,.25,.5,.75].forEach((t,k)=>tone({f:[392,349,311,262][k],type:'sawtooth',t,dur:.35,vol:.18}));},
    win(){const m=[523,659,784,1046,784,1046,1318];m.forEach((f,k)=>tone({f,type:'triangle',t:k*.13,dur:.3,vol:.22}));tone({f:1568,type:'triangle',t:.95,dur:.9,vol:.25});noise({t:.95,dur:1,vol:.12,hp:4000});},
    click(){if(sample('click',{vol:.35}))return;tone({f:700,type:'square',dur:.04,vol:.08});},
    heart(){[0,.18,.75,.93].forEach((t,k)=>tone({f:k%2?55:70,f2:35,type:'sine',t,dur:.22,vol:k%2?.5:.7}));},
    alarm(){[0,.22,.44].forEach(t=>{tone({f:880,type:'square',t,dur:.1,vol:.12});tone({f:660,type:'square',t:t+.11,dur:.1,vol:.12});});},
    drum(){for(let k=0;k<14;k++)noise({t:k*k*.006+k*.03,dur:.04,vol:.3,lp:900});},
    laugh(){[0,.12,.24,.36].forEach((t,k)=>tone({f:520+k*40,f2:420,type:'triangle',t,dur:.11,vol:.18}));},
    cry(){tone({f:700,f2:300,type:'sine',dur:.5,vol:.18});tone({f:650,f2:280,type:'sine',t:.3,dur:.6,vol:.15});},
    angry(){tone({f:120,f2:90,type:'sawtooth',dur:.35,vol:.25});noise({dur:.3,vol:.15,lp:500});},
    shock(){tone({f:300,f2:1500,type:'square',dur:.18,vol:.15,slide:.18});},
    cool(){tone({f:440,type:'triangle',dur:.15,vol:.15});tone({f:660,type:'triangle',t:.14,dur:.3,vol:.15});},
    pop(){if(sample('pop',{vol:.7}))return;noise({dur:.08,vol:.35,hp:1200});tone({f:900,f2:200,type:'sine',dur:.25,vol:.2});},
    row(){for(let k=0;k<5;k++){noise({t:k*.45,dur:.18,vol:.18,lp:900});}},
    speed(){tone({f:90,f2:260,type:'sawtooth',dur:1.1,vol:.22});noise({dur:1.1,vol:.25,hp:600,lp:3000});},
    motor(){for(let k=0;k<12;k++)tone({f:110+(k%2)*20,type:'square',t:k*.12,dur:.1,vol:.08});noise({dur:1.4,vol:.12,lp:800});},
    rumble(){noise({dur:.9,vol:.35,lp:220});tone({f:45,f2:30,type:'sine',dur:.9,vol:.4});},
    crash(){sample('crash',{vol:.9});sample('debris',{t:.08,vol:.6});noise({dur:.35,vol:.6,lp:1400,slideLp:200});tone({f:120,f2:40,type:'square',dur:.3,vol:.25});},
    monopoly(){[0,.1,.2,.35,.5].forEach((t,k)=>tone({f:[659,784,988,1175,1568][k],type:'square',t,dur:.3,vol:.14}));},

    /* ---- v2 event sounds ---- */
    aimHit(){[0,.07,.14,.21].forEach((t,k)=>tone({f:[1047,1319,1568,2093][k],type:'triangle',t:.05+t,dur:.22,vol:.2}));tone({f:2637,type:'sine',t:.33,dur:.5,vol:.12});noise({t:.3,dur:.4,vol:.06,hp:7000});},
    aimMiss(){tone({f:420,f2:330,type:'triangle',t:.05,dur:.18,vol:.12});},
    pull(){ // magnet: wobbling electric hum that rises, plus a suction whoosh
      const t0=now(),o=ctx.createOscillator(),l=ctx.createOscillator(),lg=ctx.createGain(),g=ctx.createGain(),f=ctx.createBiquadFilter();
      o.type='sawtooth';o.frequency.setValueAtTime(70,t0);o.frequency.exponentialRampToValueAtTime(220,t0+1.1);
      l.frequency.setValueAtTime(7,t0);l.frequency.linearRampToValueAtTime(18,t0+1.1);lg.gain.value=25;l.connect(lg).connect(o.frequency);
      f.type='lowpass';f.frequency.setValueAtTime(400,t0);f.frequency.exponentialRampToValueAtTime(2400,t0+1.1);f.Q.value=6;
      g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.13,t0+.15);g.gain.setValueAtTime(.13,t0+.9);g.gain.exponentialRampToValueAtTime(.0001,t0+1.3);
      o.connect(f).connect(g).connect(master);o.start(t0);l.start(t0);o.stop(t0+1.35);l.stop(t0+1.35);
      noise({dur:1.1,vol:.16,lp:300,slideLp:4000,q:3});},
    magnetHit(){tone({f:1400,f2:700,type:'square',dur:.06,vol:.22});noise({dur:.1,vol:.45,hp:2500});tone({f:180,f2:90,type:'triangle',t:.02,dur:.18,vol:.5});},
    build(){ // hammer-hammer-ratchet, then a bright "ding"
      [0,.14,.28].forEach((t,k)=>{if(sample('hammer',{t,vol:.6}))return;noise({t,dur:.05,vol:.35,hp:900,lp:5000});tone({f:[260,300,340][k],f2:120,type:'square',t,dur:.06,vol:.14});});
      for(let k=0;k<6;k++)noise({t:.42+k*.035,dur:.025,vol:.15,hp:3000});
      tone({f:880,type:'triangle',t:.68,dur:.25,vol:.2});tone({f:1319,type:'triangle',t:.76,dur:.4,vol:.2});},
    landmark(){ // brass-like fanfare over a low chord + sparkle
      [[523,0],[659,.12],[784,.24],[1047,.4]].forEach(([f,t])=>{tone({f,type:'sawtooth',t,dur:.3,vol:.09});tone({f:f*1.005,type:'square',t,dur:.3,vol:.05});});
      [523,659,784,1047].forEach(f=>{tone({f,type:'sawtooth',t:.58,dur:1.3,vol:.06});tone({f:f/2,type:'triangle',t:.58,dur:1.4,vol:.08});});
      tone({f:65,f2:50,type:'sine',t:.58,dur:.8,vol:.35});noise({t:.58,dur:1.2,vol:.08,hp:6000});
      [0,.08,.16,.24,.32].forEach(t=>tone({f:2000+Math.random()*2000,type:'sine',t:.7+t,dur:.12,vol:.06}));},
    bankrupt(){ // boom, coins spilling, sad trombone
      tone({f:80,f2:30,type:'sine',dur:.9,vol:.45});noise({dur:.6,vol:.4,lp:900,slideLp:120});
      for(let k=0;k<9;k++)tone({f:2400+Math.random()*1800,type:'sine',t:.15+k*.07+Math.random()*.03,dur:.07,vol:.07});
      [[392,.7],[370,1.0],[349,1.3],[330,1.6]].forEach(([f,t],k)=>tone({f,f2:k===3?220:f*.98,type:'sawtooth',t,dur:k===3?.9:.28,vol:.13,slide:k===3?.9:null}));},
    card(){if(sample('card',{vol:.8}))return;noise({dur:.09,vol:.22,hp:2000,lp:7000});noise({t:.12,dur:.07,vol:.16,hp:3000});tone({f:700,f2:1400,type:'sine',t:.05,dur:.18,vol:.1});},
    cardGood(){[0,.08,.16,.3].forEach((t,k)=>tone({f:[784,988,1175,1568][k],type:'triangle',t,dur:.3,vol:.17}));noise({t:.3,dur:.5,vol:.05,hp:7000});},
    cardBad(){[[311,0],[294,.25],[277,.5]].forEach(([f,t])=>tone({f,type:'sawtooth',t,dur:.25,vol:.12}));tone({f:262,f2:180,type:'sawtooth',t:.75,dur:.8,vol:.12,slide:.8});},
    travel(){ // jet flyover: filtered noise sweeping up and down + engine whine
      noise({dur:1.3,vol:.28,hp:200,lp:600,slideLp:5000,q:2});tone({f:400,f2:1800,type:'sine',dur:.7,vol:.08});tone({f:1800,f2:500,type:'sine',t:.7,dur:.6,vol:.06});},
    chime(){[[659,0],[523,.32],[784,.64]].forEach(([f,t])=>{tone({f,type:'sine',t,dur:.6,vol:.18});tone({f:f*2,type:'sine',t,dur:.4,vol:.05});});}, // airport "ding-dong"
    festival(){ // party horn + claps + bells
      tone({f:300,f2:900,type:'sawtooth',dur:.35,vol:.12});tone({f:900,type:'sawtooth',t:.35,dur:.15,vol:.1});
      for(let k=0;k<8;k++)noise({t:.25+k*.09+Math.random()*.03,dur:.04,vol:.2,hp:1200,lp:6000});
      [0,.1,.2,.3].forEach((t,k)=>tone({f:[1568,1976,2349,3136][k],type:'triangle',t:.5+t,dur:.25,vol:.1}));},
    slot(){for(let k=0;k<14;k++)tone({f:900+(k%3)*200,type:'square',t:k*.07,dur:.03,vol:.06});tone({f:500,type:'square',t:1.0,dur:.06,vol:.12});},
    casinoWin(){for(let k=0;k<10;k++)tone({f:1600+(k%2)*400,type:'square',t:k*.06,dur:.05,vol:.08});[1047,1319,1568,2093].forEach((f,k)=>tone({f,type:'triangle',t:.6+k*.08,dur:.35,vol:.16}));},
    casinoLose(){tone({f:440,f2:110,type:'sawtooth',dur:.9,vol:.14,slide:.9});noise({t:.1,dur:.4,vol:.08,lp:700});},
    cash(){noise({dur:.05,vol:.2,hp:3000});tone({f:1568,type:'square',t:.05,dur:.08,vol:.1});tone({f:2093,type:'sine',t:.12,dur:.4,vol:.16});},
    relic(){[0,.06,.12,.18,.24,.3].forEach((t,k)=>tone({f:[659,831,988,1319,1661,1976][k],type:'sine',t,dur:.4,vol:.11}));tone({f:330,type:'triangle',dur:.9,vol:.08});noise({t:.2,dur:.8,vol:.05,hp:8000});},
    news(){[[784,0],[784,.15],[988,.3],[1175,.5]].forEach(([f,t])=>tone({f,type:'square',t,dur:.14,vol:.1}));tone({f:196,type:'triangle',t:.5,dur:.6,vol:.18});},
    stamp(){tone({f:110,f2:40,type:'square',dur:.2,vol:.25});noise({dur:.12,vol:.45,lp:1200});tone({f:880,type:'square',t:.25,dur:.08,vol:.08});tone({f:660,type:'square',t:.35,dur:.12,vol:.08});},
    /* ---- island ---- */
    exile(){ // gull cries over a foghorn
      [0,.35,.6].forEach((t,k)=>{tone({f:1400+k*120,f2:1900,type:'sine',t,dur:.18,vol:.07,slide:.08});tone({f:1900,f2:1300,type:'sine',t:t+.18,dur:.22,vol:.06});});
      tone({f:98,type:'sawtooth',t:.3,dur:1.4,vol:.12});tone({f:99,type:'sawtooth',t:.3,dur:1.4,vol:.08});noise({t:.3,dur:1.5,vol:.06,lp:400});},
    horn(){tone({f:110,type:'sawtooth',dur:1.1,vol:.16});tone({f:165,type:'sawtooth',dur:1.1,vol:.1});tone({f:220,type:'square',dur:1.1,vol:.04});noise({dur:1.2,vol:.05,lp:500});},
    row(){for(let k=0;k<5;k++){noise({t:k*.45,dur:.2,vol:.2,lp:1200,slideLp:300});tone({f:180,f2:140,type:'triangle',t:k*.45+.2,dur:.12,vol:.06});}},
    speed(){tone({f:70,f2:320,type:'sawtooth',dur:1.1,vol:.2});tone({f:140,f2:640,type:'square',dur:1.1,vol:.06});noise({dur:1.2,vol:.22,hp:800,lp:4000,slideLp:9000});},
    motor(){for(let k=0;k<14;k++)tone({f:95+(k%2)*18,type:'square',t:k*.11,dur:.09,vol:.08});noise({dur:1.5,vol:.1,lp:700});},
    taxi(){for(let k=0;k<14;k++)tone({f:95+(k%2)*18,type:'square',t:k*.11,dur:.09,vol:.08});noise({dur:1.5,vol:.1,lp:700});[0,.1,.2].forEach((t,k)=>tone({f:[1319,1568,2093][k],type:'sine',t:.1+t,dur:.2,vol:.1}));},
    /* ---- emotions: every call picks a slightly different take ---- */
    happy(){const v=Math.random()*3|0;if(v===0)[0,.08].forEach((t,k)=>tone({f:[988,1319][k],type:'sine',t,dur:.2,vol:.16}));else if(v===1)[0,.07,.14].forEach((t,k)=>tone({f:[784,988,1175][k],type:'triangle',t,dur:.18,vol:.15}));else tone({f:1047,f2:1319,type:'sine',dur:.25,vol:.15});},
    laugh(){const base=380+Math.random()*120,n=3+(Math.random()*3|0);for(let k=0;k<n;k++){tone({f:base+k*25,f2:base*.8,type:'triangle',t:k*.13,dur:.1,vol:.3});noise({t:k*.13,dur:.05,vol:.08,hp:1500,lp:4000});}},
    sad(){const d=Math.random()*.1;tone({f:520,f2:380,type:'sine',dur:.5+d,vol:.14});tone({f:390,f2:300,type:'sine',t:.45+d,dur:.6,vol:.12});},
    cry(){const t0=now(),o=ctx.createOscillator(),l=ctx.createOscillator(),lg=ctx.createGain(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(700+Math.random()*120,t0);o.frequency.exponentialRampToValueAtTime(320,t0+.9);
      l.frequency.value=8+Math.random()*3;lg.gain.value=30;l.connect(lg).connect(o.frequency);g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.16,t0+.05);g.gain.exponentialRampToValueAtTime(.0001,t0+1);
      o.connect(g).connect(master);o.start(t0);l.start(t0);o.stop(t0+1.05);l.stop(t0+1.05);noise({t:1.0,dur:.08,vol:.1,hp:2500});noise({t:1.12,dur:.06,vol:.08,hp:2500});},
    angry(){const t0=now(),o=ctx.createOscillator(),l=ctx.createOscillator(),lg=ctx.createGain(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(100+Math.random()*25,t0);o.frequency.linearRampToValueAtTime(80,t0+.5);
      l.frequency.value=28;lg.gain.value=40;l.connect(lg).connect(o.frequency);f.type='lowpass';f.frequency.value=700;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.3,t0+.03);g.gain.exponentialRampToValueAtTime(.0001,t0+.55);
      o.connect(f).connect(g).connect(master);o.start(t0);l.start(t0);o.stop(t0+.6);l.stop(t0+.6);noise({t:.5,dur:.1,vol:.3,lp:400});tone({f:70,f2:40,type:'sine',t:.5,dur:.2,vol:.4});},
    shock(){noise({dur:.25,vol:.25,hp:600,lp:1500,slideLp:6000});tone({f:600,f2:1900,type:'square',t:.05,dur:.2,vol:.1,slide:.2});tone({f:2500,type:'sine',t:.25,dur:.3,vol:.08});},
    cool(){noise({dur:.04,vol:.4,hp:2500,lp:7000});tone({f:1800,f2:900,type:'sine',dur:.05,vol:.12});tone({f:523,type:'triangle',t:.12,dur:.18,vol:.12});tone({f:784,type:'triangle',t:.24,dur:.3,vol:.12});},
  };
  /* ---------- background music ---------- */
  const SONGS={
    calm:{bpm:112,vol:.9,
      chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62],[60,64,67],[57,60,64],[50,53,57],[55,59,62]],
      bass:[48,45,41,43,48,45,38,43],
      lead:[[76,0,79,76,72,0,74,76],[72,0,69,0,72,74,76,0],[77,0,74,76,72,0,69,72],[74,0,0,71,74,0,79,0],
            [76,77,79,0,84,0,79,76],[81,0,79,76,72,0,76,0],[74,0,77,74,81,0,77,74],[79,0,74,71,67,0,0,0]],
      kick:[1,0,0,0,1,0,0,0],snare:[0,0,1,0,0,0,1,0],hat:[0,1,0,1,0,1,0,1],bassPat:[1,0,0,1,1,0,1,0],leadType:'triangle',hatVol:.05},
    tense:{bpm:134,vol:.85,
      chords:[[57,60,64],[53,57,60],[55,59,62],[52,56,59]],
      bass:[45,41,43,40],
      lead:[[69,0,72,69,76,0,72,69],[65,0,69,72,77,0,72,69],[67,0,71,74,79,0,74,71],[68,0,71,76,80,0,76,0]],
      kick:[1,0,0,1,1,0,0,0],snare:[0,0,1,0,0,0,1,1],hat:[1,1,1,1,1,1,1,1],bassPat:[1,1,1,1,1,1,1,1],leadType:'square',hatVol:.045},
    boss:{bpm:142,vol:.9,
      chords:[[50,53,57],[50,53,58],[55,58,62],[52,57,61]],
      bass:[38,34,43,45],
      lead:[[62,0,0,65,69,0,67,0],[70,0,72,0,65,0,62,0],[67,0,70,74,0,72,70,0],[69,0,0,0,73,0,76,0]],
      kick:[1,0,1,0,1,0,1,1],snare:[0,0,1,0,0,0,1,0],hat:[1,1,1,1,1,1,1,1],bassPat:[1,1,0,1,1,1,0,1],leadType:'sawtooth',hatVol:.04},
    island:{bpm:96,vol:.8, // lazy calypso while the human is stuck on the island
      chords:[[60,64,67],[65,69,72],[67,71,74],[60,64,67]],bass:[48,53,55,48],
      lead:[[72,0,76,0,79,76,0,74],[77,0,0,76,74,0,72,0],[74,0,79,0,74,0,71,0],[72,0,0,0,76,74,72,0]],
      kick:[1,0,0,1,0,0,1,0],snare:[0,0,1,0,0,0,1,0],hat:[0,1,1,0,1,1,0,1],bassPat:[1,0,0,1,0,0,1,0],leadType:'sine',hatVol:.035},
    blue:{bpm:80,vol:.75, // slow minor theme when the human is last and nearly broke
      chords:[[57,60,64],[53,57,60],[55,59,62],[52,56,59]],bass:[45,41,43,40],
      lead:[[76,0,0,0,72,0,0,0],[0,0,74,0,0,0,72,0],[0,0,0,0,71,0,74,0],[71,0,0,0,68,0,0,0]],
      kick:[1,0,0,0,0,0,1,0],snare:[0,0,0,0,1,0,0,0],hat:[0,0,1,0,0,0,1,0],bassPat:[1,0,0,0,1,0,0,0],leadType:'sine',hatVol:.025},
  };
  let music=true;try{music=localStorage.getItem('el-music')!=='0';}catch(e){}
  let mGain=null,mood=null,want=null,shift=0,wantShift=0,step=0,nextT=0,timer=null;
  const mf=m=>440*Math.pow(2,(m-69)/12);
  function mnote(m,type,t0,dur,vol,lp){
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=mf(m);let node=o;
    if(lp){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;o.connect(f);node=f;}
    g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+.012);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
    node.connect(g).connect(mGain);o.start(t0);o.stop(t0+dur+.05);
  }
  function mnoise(t0,dur,vol,hp){const s=ctx.createBufferSource();s.buffer=noiseBuf;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=hp;const g=ctx.createGain();
    g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(f).connect(g).connect(mGain);s.start(t0);s.stop(t0+dur+.05);}
  function kick(t0,vol){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(150,t0);o.frequency.exponentialRampToValueAtTime(45,t0+.12);
    g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+.18);o.connect(g).connect(mGain);o.start(t0);o.stop(t0+.2);}
  function schedule(){
    if(!ctx||!mood)return;
    while(nextT<ctx.currentTime+.15){
      const S=SONGS[mood],e=60/S.bpm/2,bars=S.chords.length,bar=Math.floor(step/8)%bars,k=step%8,t=nextT,v=S.vol,tr=mood==='calm'?shift:0;
      if(k===0){S.chords[bar].forEach(m=>mnote(m+tr,'triangle',t,e*8*.95,.035*v,1800));}
      if(S.bassPat[k])mnote(S.bass[bar]+tr+(mood!=='calm'&&k%2?12:0),mood==='calm'?'triangle':'sawtooth',t,e*.9,.11*v,mood==='calm'?900:600);
      const loop=Math.floor(step/(8*bars)),oct=(mood==='calm'||mood==='island')&&loop%2?-12:0,quiet=bar===0&&loop%4===3;
      const ln=S.lead[bar][k];if(ln)mnote(ln+tr+oct,S.leadType,t,e*(S.lead[bar][k+1]===0?1.8:.95),(S.leadType==='triangle'||S.leadType==='sine'?.075:.035)*v,S.leadType==='triangle'||S.leadType==='sine'?null:2400);
      if(S.kick[k]&&!quiet)kick(t,.32*v);
      if(S.snare[k]&&!quiet)mnoise(t,.12,.11*v,1800);
      if(S.hat[k])mnoise(t,.03,S.hatVol*v*.6,6000);
      if(k>=4&&bar===bars-1&&loop%2===1)mnoise(t+e/2,.05,.07*v,1800); // fill into the next loop
      nextT+=e;step++;
      // switch song / key only on a bar line
      if(step%8===0&&(want!==mood||wantShift!==shift)){
        if(want!==mood){mood=want;step=0;}shift=wantShift;
        if(!mood){clearInterval(timer);timer=null;return;}
      }
    }
  }
  function musicStart(){
    if(!music||muted||!want||!ensure())return;
    if(!mGain){mGain=ctx.createGain();mGain.gain.value=1.5;const warm=ctx.createBiquadFilter();warm.type='lowpass';warm.frequency.value=5200;warm.Q.value=.5;mGain.connect(warm).connect(master);}
    if(ctx.state==='suspended')ctx.resume();
    if(!timer){mood=want;shift=wantShift;step=0;nextT=ctx.currentTime+.08;mGain.gain.cancelScheduledValues(ctx.currentTime);mGain.gain.setValueAtTime(1.5,ctx.currentTime);timer=setInterval(schedule,25);}
  }
  function musicHalt(){if(timer){clearInterval(timer);timer=null;}if(mGain&&ctx){mGain.gain.setTargetAtTime(0,ctx.currentTime,.15);}mood=null;}
  function setMood(m,key=0){
    if(m===want&&key===wantShift&&(timer||!m))return;want=m;wantShift=key;
    if(!m){musicHalt();return;}
    if(!timer)musicStart();
  }
  function sting(kind){
    if(!music||muted||!ensure())return;if(!mGain){mGain=ctx.createGain();mGain.gain.value=1.5;const warm=ctx.createBiquadFilter();warm.type='lowpass';warm.frequency.value=5200;warm.Q.value=.5;mGain.connect(warm).connect(master);}
    const t0=ctx.currentTime+.02,seq=kind==='up'?[[67,0],[72,.1],[76,.2],[79,.3]]:kind==='down'?[[64,0],[63,.18],[62,.36],[59,.6]]:[[50,0],[56,.15],[50,.3],[49,.5]];
    seq.forEach(([m,t],k)=>mnote(m+12,kind==='up'?'triangle':'sawtooth',t0+t,kind==='up'?.35:(k===seq.length-1?.9:.4),kind==='up'?.07:.045,2000));
  }
  function setMusic(on){music=on;try{localStorage.setItem('el-music',on?'1':'0');}catch(e){}if(on){const w=want;want=null;setMood(w,wantShift);}else musicHalt();}
  function play(n,...a){if(muted)return;if(!ensure())return;if(ctx.state==='suspended'){ctx.resume();}try{lib[n]&&lib[n](...a);}catch(e){}}
  function setMuted(m){muted=m;try{localStorage.setItem('el-mute',m?'1':'0');}catch(e){}if(m)musicHalt();else{const w=want;want=null;setMood(w,wantShift);}}
  return{play,unlock:()=>{unlock();if(want&&!timer)musicStart();},setMuted,isMuted:()=>muted,setMood,setMusic,sting,isMusic:()=>music,mood:()=>mood,_lib:lib,_ctx:()=>ctx,_master:()=>master,_mgain:()=>mGain,_songs:SONGS};
})();
['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>SFX.unlock(),{once:false,passive:true}));
{const b=$('#btn-snd');const show=()=>{b.innerHTML=`<svg class="ic"><use href="#i-${SFX.isMuted()?'mute':'snd'}"/></svg>`;b.setAttribute('aria-pressed',String(!SFX.isMuted()));};show();
 b.addEventListener('click',()=>{SFX.setMuted(!SFX.isMuted());show();if(!SFX.isMuted())SFX.play('coin');});}
document.addEventListener('click',e=>{if(e.target.closest('.card .btn'))SFX.play('click');});
{const b=$('#btn-bgm');const show=()=>{b.title=SFX.isMusic()?'배경음악 끄기':'배경음악 켜기';b.setAttribute('aria-pressed',String(SFX.isMusic()));};show();
 b.addEventListener('click',()=>{SFX.setMusic(!SFX.isMusic());show();});}
/* pick the music for the current game state */
function nearWin(p){
  let groups=0,almost=false;for(let g=0;g<8;g++){const ix=groupIdx(g);const n=ix.filter(i=>S(i).owner===p.id).length;if(n===ix.length)groups++;else if(n===ix.length-1&&ix.every(i=>S(i).owner==null||S(i).owner===p.id))almost=true;}
  if(groups>=3||(groups===2&&almost))return true;
  for(let s=0;s<4;s++){const c=sideCities(s);if(c.filter(i=>S(i).owner===p.id).length>=c.length-1)return true;}
  return tourIdx.filter(i=>S(i).owner===p.id).length>=3;
}
function updateMusic(){
  if(!G||G.over){SFX.setMood(null);return;}
  if(G.run&&RUN_STAGES[G.run.stage].boss)return SFX.setMood('boss');
  const left=G.limit?G.limit-G.round+1:99;
  if(left<=3||alive().some(nearWin))return SFX.setMood('tense');
  const hum=G.players.filter(p=>!p.ai&&!p.bankrupt),cur=G.players[G.cur];
  if(cur&&!cur.ai&&cur.island>0)return SFX.setMood('island');
  if(hum.length===1){const rank=[...alive()].sort((a,b)=>assets(b)-assets(a));if(rank.length>2&&rank[rank.length-1]===hum[0]&&hum[0].cash<400)return SFX.setMood('blue');}
  SFX.setMood('calm',G.run?[0,2,5][G.run.stage]:0);
}
