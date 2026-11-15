'use strict';
/* =================== CITY LANDMARKS (one signature building per city) =================== */
/* Each builder returns a Group roughly 1–1.6 units tall, centred on x/z, standing on y=0. */
const LM={stone:0xe8e2d2,glass:0x8fc7e8,gold:0xffc94a,red:0xc62d2d,copper:0x5fa58a,brick:0xa0522d,white:0xf4f4f4,dark:0x3a3f46,wood:0x8b5a2b,cream:0xf3e9d2,teal:0x3aa39a};
const LMM=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.6,...o});
function lmHelpers(g){
  const add=(m,x,y,z)=>{m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
  return{
    box:(w,h,d,c,x=0,y=0,z=0,o)=>add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),LMM(c,o)),x,y+h/2,z),
    cyl:(rt,rb,h,c,x=0,y=0,z=0,seg=16,o)=>add(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),LMM(c,o)),x,y+h/2,z),
    cone:(r,h,c,x=0,y=0,z=0,seg=16,o)=>add(new THREE.Mesh(new THREE.ConeGeometry(r,h,seg),LMM(c,o)),x,y+h/2,z),
    dome:(r,c,x=0,y=0,z=0,o)=>add(new THREE.Mesh(new THREE.SphereGeometry(r,20,12,0,Math.PI*2,0,Math.PI/2),LMM(c,o)),x,y,z),
    sphere:(r,c,x=0,y=0,z=0,o)=>add(new THREE.Mesh(new THREE.SphereGeometry(r,14,10),LMM(c,o)),x,y,z),
    add,
  };
}
/* window-grid facade material for landmark towers */
const lmWinCache={};
function lmWin(base,lit,cols,rows,o={}){
  const key=base+lit+cols+'x'+rows;let t=lmWinCache[key];
  if(!t){const cv=document.createElement('canvas');cv.width=128;cv.height=Math.max(32,Math.round(128*rows/cols));const g=cv.getContext('2d');g.fillStyle=base;g.fillRect(0,0,cv.width,cv.height);const cw=cv.width/cols,ch=cv.height/rows;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){g.fillStyle=Math.random()<.7?lit:'rgba(0,0,0,.35)';g.fillRect(x*cw+cw*.18,y*ch+ch*.2,cw*.64,ch*.55);}
    t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;lmWinCache[key]=t;}
  return new THREE.MeshStandardMaterial({color:0xffffff,map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:o.glow??.25,roughness:o.rough??.45,metalness:o.metal??.1});
}
function lmHelpers2(g){
  const base=lmHelpers(g);const add=base.add;
  return Object.assign(base,{
    mbox:(w,h,d,mat,x=0,y=0,z=0)=>add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat),x,y+h/2,z),
    mcyl:(rt,rb,h,mat,x=0,y=0,z=0,seg=20)=>add(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat),x,y+h/2,z),
    lathe:(pts,c,x=0,y=0,z=0,o)=>add(new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a,b])=>new THREE.Vector2(a,b)),24),LMM(c,o)),x,y,z),
    torus:(r,t,c,x=0,y=0,z=0,o)=>{const m=add(new THREE.Mesh(new THREE.TorusGeometry(r,t,8,32),LMM(c,o)),x,y,z);m.rotation.x=Math.PI/2;return m;},
    arch:(w,h,d,c,x=0,y=0,z=0,o)=>{const m=add(new THREE.Mesh(new THREE.CylinderGeometry(w/2,w/2,d,16,1,false,0,Math.PI),LMM(c,o)),x,y+h,z);m.rotation.z=Math.PI/2;m.rotation.y=Math.PI/2;return m;},
    prism:(w,h,d,c,x=0,y=0,z=0,o)=>{const sh=new THREE.Shape([new THREE.Vector2(-w/2,0),new THREE.Vector2(w/2,0),new THREE.Vector2(0,h)]);const geo=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false});geo.translate(0,0,-d/2);return add(new THREE.Mesh(geo,LMM(c,o)),x,y,z);},
    beam:(a,b,t,mat)=>{const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const m=new THREE.Mesh(new THREE.BoxGeometry(t,v.length(),t),mat);m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());m.castShadow=true;g.add(m);return m;},
    ring:(n,r,fn)=>{for(let k=0;k<n;k++){const a=k/n*Math.PI*2;fn(Math.cos(a)*r,Math.sin(a)*r,a,k);}},
  });
}
const LANDMARKS={
  // Taipei 101: eight flared stacked segments, ruyi discs, glass, spire
  '타이베이':g=>{const h=lmHelpers2(g);const glass=lmWin('#1f6f6a','#bff3ea',4,3,{metal:.35});
    h.box(.62,.06,.62,0x5a6a70);h.mbox(.44,.24,.44,glass,0,.06,0);h.box(.5,.03,.5,LM.gold,0,.3,0,{metalness:.7});
    for(let k=0;k<8;k++){const y=.33+k*.13;const seg=h.add(new THREE.Mesh(new THREE.CylinderGeometry(.21,.16,.13,4),glass),0,y+.065,0);seg.rotation.y=Math.PI/4;h.box(.33,.012,.33,0x9ad8cc,0,y+.125,0,{metalness:.6});}
    h.ring(4,.19,(x,z)=>h.cyl(.035,.035,.01,LM.gold,x,.6,z,12));
    h.mbox(.2,.12,.2,glass,0,1.37,0);h.cyl(.06,.08,.08,0x9ad8cc,0,1.49,0,8);h.cyl(.008,.02,.32,0xcccccc,0,1.57,0,6);h.sphere(.018,0xff4040,0,1.9,0,{emissive:0xff2020,emissiveIntensity:3});},
  // Manila Cathedral: romanesque façade, rose window, green dome, bell tower
  '마닐라':g=>{const h=lmHelpers2(g);const st=LMM(0xe3d8bf);
    h.box(.72,.05,.5,0xb0a690);h.mbox(.56,.5,.4,st,0,.05,0);h.box(.6,.05,.44,0xcbbf9f,0,.55,0);
    h.prism(.6,.16,.06,0xe3d8bf,0,.6,.17);h.cyl(.012,.012,.08,LM.gold,0,.76,.17,6);h.box(.05,.01,.01,LM.gold,0,.81,.17);
    h.cyl(.07,.07,.02,0x3a6a9a,0,.36,.205,16,{emissive:0x2a5a8a,emissiveIntensity:.6}).rotation.x=Math.PI/2;
    h.box(.12,.2,.02,0x5a3a2a,0,.05,.205);[-.17,.17].forEach(x=>h.box(.06,.12,.02,0x3a5a7a,x,.22,.205));
    h.cyl(.14,.16,.12,0xe3d8bf,0,.55,-.05,16);h.dome(.15,0x4f9a7a,0,.67,-.05,{metalness:.3});h.cyl(.02,.02,.08,LM.gold,0,.82,-.05,6);h.box(.04,.01,.01,LM.gold,0,.88,-.05);
    h.mbox(.16,.75,.16,st,.32,.05,-.12);h.box(.18,.04,.18,0xcbbf9f,.32,.8,-.12);h.cyl(.07,.08,.12,0xe3d8bf,.32,.84,-.12,8);h.dome(.08,0x4f9a7a,.32,.96,-.12);},
  // Hanoi: One Pillar Pagoda on a lotus pond
  '하노이':g=>{const h=lmHelpers2(g);
    h.cyl(.46,.48,.05,0x4f8f7a,0,0,0,28);h.cyl(.42,.42,.01,0x6fb6c8,0,.05,0,28,{metalness:.3,roughness:.15});
    h.ring(6,.32,(x,z)=>h.cyl(.05,.05,.01,0x5fae4a,x,.06,z,10));h.ring(3,.28,(x,z)=>h.sphere(.025,0xff8ab0,x,.08,z));
    h.cyl(.06,.07,.38,0x9a8f84,0,.06,0,12);
    h.box(.36,.03,.36,0x8b4a2b,0,.44,0);h.mbox(.26,.18,.26,LMM(0x9b2f2a),0,.47,0);[[0,.135],[0,-.135],[.135,0],[-.135,0]].forEach(([x,z])=>h.box(z?.08:.01,.1,z?.01:.08,0x3a2010,x,.5,z));
    const r1=h.cone(.32,.16,0x6a3a20,0,.65,0,4);r1.rotation.y=Math.PI/4;h.ring(4,.23,(x,z,a)=>{const c=h.cone(.03,.08,0x6a3a20,x,.66,z,6);c.rotation.z=.6;c.rotation.y=-a;});
    h.cyl(.025,.03,.06,LM.gold,0,.8,0,8);h.sphere(.03,LM.gold,0,.89,0,{metalness:.7});},
  // Bangkok: Wat Arun central prang with four satellites, tiered and gilded
  '방콕':g=>{const h=lmHelpers2(g);const porc=0xe8dcc6,gold=0xd9a441;
    h.box(.78,.06,.78,0xb9ae96);h.box(.66,.06,.66,0xcfc3a8,0,.06,0);
    h.lathe([[0,0],[.26,0],[.26,.12],[.22,.14],[.22,.3],[.17,.33],[.17,.48],[.13,.52],[.12,.68],[.085,.72],[.08,.86],[.05,.9],[.03,1.02],[.015,1.1],[0,1.2]],porc,0,.12,0);
    [.26,.42,.56,.7,.84].forEach((y,k)=>h.torus(.2-k*.033,.012,gold,0,.12+y,0,{metalness:.6}));
    h.cyl(.004,.006,.12,gold,0,1.3,0,6);
    h.ring(4,.3,(x,z)=>{h.lathe([[0,0],[.08,0],[.08,.06],[.06,.08],[.055,.2],[.035,.24],[.02,.34],[0,.42]],porc,x,.12,z);h.torus(.05,.008,gold,x,.24,z);});
    h.ring(8,.37,(x,z)=>h.cyl(.012,.012,.08,0xa0522d,x,.12,z,6));},
  // Marina Bay Sands: three curved towers with the SkyPark ship on top
  '싱가포르':g=>{const h=lmHelpers2(g);const glass=lmWin('#4a6f8a','#d6eeff',2,12,{metal:.4,glow:.3});
    h.box(.96,.04,.5,0x9aa3ad);h.box(.96,.012,.14,0x3f7fa8,0,.04,.2,{metalness:.3,roughness:.1});
    [-.3,0,.3].forEach(x=>{h.mbox(.07,.98,.16,glass,x-.04,.04,-.04);const lean=h.mbox(.07,.98,.16,glass,x+.06,.04,-.04);lean.rotation.z=.05;});
    h.box(1.0,.05,.2,0xf4f4f4,.07,1.02,-.04,{roughness:.4});
    h.box(.62,.02,.12,0x3aa6c8,-.12,1.07,-.04,{metalness:.4,roughness:.1,emissive:0x1a5a7a,emissiveIntensity:.4});
    [.25,.38,.48].forEach(x=>h.sphere(.03,0x3f8f3a,x,1.09,-.04));},
  // Cairo: Great Pyramid, smaller pyramid, Sphinx in sand
  '카이로':g=>{const h=lmHelpers2(g);const sand=0xdcc08a;
    h.box(.9,.03,.7,0xe6cf98);
    const p=h.cone(.46,.66,0xd9b77a,-.12,.03,-.1,4);p.rotation.y=Math.PI/4;const cap=h.cone(.07,.1,LM.gold,-.12,.59,-.1,4,{metalness:.7});cap.rotation.y=Math.PI/4;
    for(let k=1;k<6;k++){const r=h.add(new THREE.Mesh(new THREE.TorusGeometry(.46*(1-k/6)*1.414*.71,.004,4,4),LMM(0xc4a066)),-.12,.03+k*.11,-.1);r.rotation.x=Math.PI/2;r.rotation.z=Math.PI/4;}
    const p2=h.cone(.24,.34,0xcfa868,.3,.03,.22,4);p2.rotation.y=Math.PI/4;
    h.box(.36,.1,.12,sand,-.1,.03,.38);h.box(.1,.08,.12,sand,.03,.13,.38);h.box(.08,.1,.1,sand,.1,.13,.38);h.box(.06,.04,.05,0x3a6a9a,.1,.23,.38);h.box(.12,.03,.03,sand,.12,.05,.45);h.box(.12,.03,.03,sand,.12,.05,.31);
    h.cyl(.012,.012,.3,0x6b8e3a,.38,.03,-.26,6);h.ring(5,.04,(x,z,a)=>{const l=h.cone(.02,.14,0x4f8f3a,.38+x,.32,-.26+z,4);l.rotation.z=Math.cos(a)*1.1;l.rotation.x=Math.sin(a)*1.1;});},
  // Istanbul: Blue Mosque — cascading domes, six minarets with balconies
  '이스탄불':g=>{const h=lmHelpers2(g);const stn=0xd6dae2,lead=0x8a9cb4;
    h.box(.86,.05,.86,0xb9b2a5);h.box(.56,.26,.56,stn,0,.05,0);
    h.cyl(.2,.22,.08,stn,0,.31,0,24);h.dome(.22,lead,0,.39,0,{metalness:.4});h.cyl(.012,.012,.12,LM.gold,0,.6,0,6);h.sphere(.02,LM.gold,0,.73,0,{metalness:.7});
    h.ring(4,.25,(x,z)=>{h.cyl(.1,.1,.06,stn,x,.31,z,16);h.dome(.1,lead,x,.37,z,{metalness:.4});});
    h.ring(4,.25,(x,z)=>h.dome(.07,lead,x*1.35,.31,z*1.35,{metalness:.4}),Math.PI/4);
    [[.4,.4],[-.4,.4],[.4,-.4],[-.4,-.4],[.4,0],[-.4,0]].forEach(([x,z])=>{h.cyl(.022,.03,.95,0xe6e9ef,x,.05,z,12);h.cyl(.04,.04,.015,0xb9bfca,x,.6,z,12);h.cyl(.04,.04,.015,0xb9bfca,x,.8,z,12);h.cone(.032,.16,lead,x,1.0,z,12);});
    h.box(.2,.14,.02,0x3a5a7a,0,.08,.285);},
  // Athens: Parthenon on the Acropolis rock — stylobate steps, 8x17 columns read as 8x6, frieze, pediments
  '아테네':g=>{const h=lmHelpers2(g);const m=0xece6d6;
    h.lathe([[0,0],[.5,0],[.48,.08],[.4,.12],[0,.12]],0xb3a58a,0,0,0);
    [.0,.02,.04].forEach((y,k)=>h.box(.88-k*.03,.02,.52-k*.03,m,0,.12+y,0));
    const col=(x,z)=>{h.cyl(.019,.024,.34,m,x,.18,z,10);h.box(.05,.014,.05,m,x,.52,z);};
    for(let k=0;k<13;k++){const x=-.38+k*.0633;col(x,.21);col(x,-.21);}
    for(let k=1;k<7;k++){const z=-.21+k*.06;col(.38,z);col(-.38,z);}
    h.box(.82,.035,.48,m,0,.534,0);h.box(.82,.03,.48,0xd8cfba,0,.569,0);
    [.395,-.395].forEach(x=>{const p=h.prism(.48,.1,.03,m,x,.599,0);p.rotation.y=Math.PI/2;});
    h.box(.06,.26,.18,0xd9cfb8,0,.18,0);},
  // Copenhagen: Nyhavn — colourful gabled houses on a canal, sailboat and the Little Mermaid
  '코펜하겐':g=>{const h=lmHelpers2(g);
    h.box(.9,.03,.7,0x7a8a94);h.box(.9,.012,.28,0x3f7fa8,0,.03,.2,{metalness:.3,roughness:.1});
    [0xe0613a,0xf2c14e,0x4f8fc0,0xd9534f,0x6fb6a0,0xf4e6c8].forEach((c,k)=>{const x=-.38+k*.152,hh=.36+(k%3)*.08;const win=lmWin('#'+c.toString(16).padStart(6,'0'),'#fff6d6',2,3,{glow:.15,rough:.7});h.mbox(.14,hh,.26,win,x,.03,-.14);
      h.prism(.14,.1,.24,0x8b3a2a,x,.03+hh,-.15);h.prism(.12,.085,.012,c,x,.03+hh,-.02);h.box(.03,.06,.03,0x6a5a50,x+.03,.03+hh+.08,-.2);});
    const boat=h.box(.32,.05,.09,0x8b4a2b,.05,.04,.2);h.cyl(.006,.006,.38,0xdddddd,.05,.09,.2,4);const sail=h.add(new THREE.Mesh(new THREE.PlaneGeometry(.16,.28),LMM(0xffffff,{side:THREE.DoubleSide})),.12,.26,.2);
    h.cyl(.05,.06,.06,0x7a7f86,.38,.03,.28,8);h.add(new THREE.Mesh(new THREE.CapsuleGeometry(.025,.06,4,8),LMM(0x5fa58a,{metalness:.4})),.38,.15,.28);h.sphere(.022,0x5fa58a,.38,.21,.28,{metalness:.4});},
  // Stockholm City Hall: red brick block, slim tower with gilded three crowns, waterfront
  '스톡홀름':g=>{const h=lmHelpers2(g);const brick=lmWin('#9a3b25','#ffd9a0',6,3,{glow:.12,rough:.85});
    h.box(.9,.03,.7,0x7a8a94);h.box(.9,.012,.2,0x3f7fa8,0,.03,.25,{metalness:.3,roughness:.1});
    h.mbox(.62,.3,.36,brick,-.08,.03,-.08);h.box(.64,.03,.38,0x2f6a5a,-.08,.33,-.08);for(let k=0;k<7;k++)h.box(.04,.05,.04,0x9a3b25,-.36+k*.09,.33,.1);
    [-.25,.0].forEach(x=>{h.cyl(.04,.04,.1,0x2f6a5a,x,.36,-.18,8);h.dome(.045,0x2f6a5a,x,.46,-.18);});
    h.mbox(.18,.95,.18,brick,.28,.03,-.02);h.box(.2,.04,.2,0x2f6a5a,.28,.98,-.02);for(let k=0;k<4;k++){const a=k*Math.PI/2;h.box(.05,.08,.01,0x2a2a2a,.28+Math.sin(a)*.1,.82,-.02+Math.cos(a)*.1).rotation.y=a;}
    h.cyl(.06,.08,.14,0x2f6a5a,.28,1.02,-.02,8);h.cyl(.012,.012,.16,LM.gold,.28,1.16,-.02,6);[0,1,2].forEach(k=>{h.torus(.025,.008,LM.gold,.28,1.22+k*.05,-.02,{metalness:.8});});
    h.ring(3,.06,(x,z)=>h.cyl(.012,.012,.1,0x6b5a4a,-.08+x*2,.03,.27+z*.3,6));},
  // Berlin: Brandenburg Gate with the Quadriga
  '베를린':g=>{const h=lmHelpers2(g);const sst=0xe5dcc5;
    h.box(.96,.04,.46,0xa9a191);h.box(.92,.04,.36,sst,0,.04,0);
    for(let k=0;k<6;k++){const x=-.4+k*.16;[.12,-.12].forEach(z=>{h.cyl(.03,.034,.46,sst,x,.08,z,14);h.box(.07,.02,.07,sst,x,.54,z);});}
    [-.48,.48].forEach(x=>h.box(.12,.42,.34,sst,x,.08,0));
    h.box(1.0,.06,.38,sst,0,.56,0);h.box(.98,.04,.36,0xd8cdb0,0,.62,0);for(let k=0;k<10;k++)h.box(.05,.03,.01,0xb9ae96,-.45+k*.1,.6,.19);
    h.box(.5,.1,.3,sst,0,.66,0);h.box(.46,.02,.28,0xd8cdb0,0,.76,0);
    const cop=0x5fa58a;[-.12,-.04,.04,.12].forEach((x,k)=>{h.add(new THREE.Mesh(new THREE.CapsuleGeometry(.022,.08,4,8),LMM(cop,{metalness:.5})),x,.84,.03).rotation.x=Math.PI/2;h.box(.02,.06,.02,cop,x,.78,.07,{metalness:.5});h.box(.02,.06,.02,cop,x,.78,-.01,{metalness:.5});h.sphere(.018,cop,x,.88,.09,{metalness:.5});});
    h.box(.18,.06,.06,cop,0,.78,-.08,{metalness:.5});h.cyl(.01,.01,.22,cop,0,.84,-.08,6,{metalness:.5});h.add(new THREE.Mesh(new THREE.CapsuleGeometry(.02,.08,4,8),LMM(cop,{metalness:.5})),0,.96,-.08);h.box(.12,.04,.01,cop,0,1.06,-.08,{metalness:.5});},
  // Ottawa: Parliament Centre Block with the Peace Tower
  '오타와':g=>{const h=lmHelpers2(g);const sand=lmWin('#b8ad98','#ffe9b0',8,3,{glow:.1,rough:.85});const copper=0x5fa58a;
    h.box(.96,.04,.6,0x6f9a5a);h.box(.08,.02,.4,0xa9a191,0,.04,.3);
    h.mbox(.86,.3,.3,sand,0,.04,-.05);h.box(.88,.025,.32,0x8a8070,0,.34,-.05);
    [-.38,.38].forEach(x=>{h.mbox(.12,.34,.12,sand,x,.04,-.05);const r=h.cone(.1,.18,copper,x,.38,-.05,4,{metalness:.4});r.rotation.y=Math.PI/4;});
    const roofL=h.add(new THREE.Mesh(new THREE.CylinderGeometry(0,.16,.84,4,1),LMM(copper,{metalness:.4})),0,.42,-.05);roofL.rotation.z=Math.PI/2;roofL.rotation.x=Math.PI/4;roofL.scale.set(1,1,.5);
    h.mbox(.2,.82,.2,sand,0,.04,.1);for(let k=0;k<4;k++){const a=k*Math.PI/2;const f=h.add(new THREE.Mesh(new THREE.CircleGeometry(.05,20),LMM(0xfff7e0,{emissive:0xffe9b0,emissiveIntensity:.6})),Math.sin(a)*.101,.72,.1+Math.cos(a)*.101);f.rotation.y=a;}
    h.box(.24,.03,.24,0x8a8070,0,.86,.1);const sp=h.cone(.13,.3,copper,0,.89,.1,4,{metalness:.4});sp.rotation.y=Math.PI/4;h.cyl(.006,.006,.14,0xdddddd,0,1.19,.1,4);h.box(.07,.04,.004,0xd8333c,.035,1.3,.1);},
  // Zurich: Grossmünster twin towers by the Limmat
  '취리히':g=>{const h=lmHelpers2(g);const stn=lmWin('#d8cfbc','#ffe9b0',2,5,{glow:.08,rough:.85});
    h.box(.9,.03,.7,0x9aa3ad);h.box(.9,.012,.22,0x4f8fb0,0,.03,.24,{metalness:.3,roughness:.1});
    h.mbox(.52,.34,.36,stn,0,.03,-.1);const roof=h.add(new THREE.Mesh(new THREE.CylinderGeometry(0,.22,.5,3,1),LMM(0x7a4a3a)),0,.44,-.1);roof.rotation.z=Math.PI/2;roof.rotation.y=Math.PI/2;roof.scale.set(1,.6,1.2);
    [-.16,.16].forEach(x=>{h.mbox(.16,.72,.16,stn,x,.03,.06);h.box(.18,.03,.18,0xb9ae96,x,.75,.06);h.cyl(.07,.08,.08,0x6a7f8a,x,.78,.06,8);h.dome(.075,0x6a7f8a,x,.86,.06,{metalness:.3});h.cyl(.006,.01,.1,LM.gold,x,.93,.06,6);
      h.cyl(.03,.03,.01,0x2a2a2a,x,.62,.141,16).rotation.x=Math.PI/2;});
    h.arch(.12,.1,.02,0x5a3a2a,0,.03,.08);},
  // Sydney Opera House: interlocking shell sails on a podium by the harbour
  '시드니':g=>{const h=lmHelpers2(g);const tile=LMM(0xf8f6f0,{roughness:.35,side:THREE.DoubleSide});
    h.box(.96,.02,.7,0x3f7fa8,0,0,0,{metalness:.3,roughness:.1});h.box(.86,.1,.44,0xc9b48a,0,.02,-.02);for(let k=0;k<8;k++)h.box(.08,.012,.02,0xb09a70,-.36+k*.1,.1,.2);
    const shell=(x,z,s,dir)=>{const m=h.add(new THREE.Mesh(new THREE.ConeGeometry(.16*s,.52*s,16,1,true,0,Math.PI),tile),x,.12+.24*s,z);m.rotation.set(0,dir>0?-Math.PI/2:Math.PI/2,dir*-.5);
      const gl=h.add(new THREE.Mesh(new THREE.CircleGeometry(.1*s,12,0,Math.PI),LMM(0x8fd3ff,{emissive:0x3a8ad0,emissiveIntensity:.4,side:THREE.DoubleSide})),x+dir*.06*s,.12,z);gl.rotation.y=Math.PI/2;return m;};
    [[-.13,1],[.15,.85]].forEach(([z,k])=>{shell(-.3,z,.55*k,-1);shell(-.16,z,.8*k,1);shell(.0,z,1*k,1);shell(.17,z,1.15*k,1);});},
  // São Paulo: Metropolitan Cathedral — neo-gothic spires around a green dome
  '상파울루':g=>{const h=lmHelpers2(g);const stn=lmWin('#a39a8c','#ffe9b0',3,5,{glow:.08,rough:.9});const cop=0x4f7f7a;
    h.box(.9,.04,.7,0x8f8a80);h.mbox(.56,.38,.42,stn,0,.04,-.04);
    h.cyl(.16,.18,.16,0xa39a8c,0,.42,-.06,16);h.dome(.17,cop,0,.58,-.06,{metalness:.4});h.cyl(.03,.04,.1,cop,0,.74,-.06,8);h.cyl(.006,.006,.1,LM.gold,0,.84,-.06,4);
    [-.24,.24].forEach(x=>{h.mbox(.15,.66,.15,stn,x,.04,.14);h.box(.17,.03,.17,0x8a8070,x,.7,.14);h.cone(.09,.42,cop,x,.73,.14,8,{metalness:.4});h.ring(4,.075,(dx,dz)=>h.cone(.018,.12,cop,x+dx,.7,.14+dz,6));h.cyl(.004,.004,.08,LM.gold,x,1.15,.14,4);});
    h.add(new THREE.Mesh(new THREE.CircleGeometry(.07,20),LMM(0x3a5a8a,{emissive:0x2a4a8a,emissiveIntensity:.6})),0,.32,.172);h.arch(.14,.12,.02,0x3a2a1a,0,.04,.17);},
  // London: Elizabeth Tower (Big Ben) with clock faces, beside the Palace roofline
  '런던':g=>{const h=lmHelpers2(g);const gold=0xc9b48a,dark=0x3a4a3a;const fac=lmWin('#c9b48a','#ffe9b0',2,8,{glow:.08,rough:.8});
    h.box(.96,.04,.5,0x8f8a80);h.mbox(.62,.26,.3,lmWin('#c9b48a','#ffe9b0',8,2,{glow:.08,rough:.8}),-.2,.04,0);for(let k=0;k<7;k++)h.cone(.02,.08,0xc9b48a,-.48+k*.093,.3,.15,4);
    h.mbox(.2,.72,.2,fac,.3,.04,0);h.box(.24,.04,.24,0xb9a47a,.3,.76,0);h.mbox(.22,.16,.22,LMM(gold),.3,.8,0);
    for(let k=0;k<4;k++){const a=k*Math.PI/2;const cx=.3+Math.sin(a)*.112,cz=Math.cos(a)*.112;const f=h.add(new THREE.Mesh(new THREE.CircleGeometry(.07,24),LMM(0xfffbe6,{emissive:0xffefb0,emissiveIntensity:.7})),cx,.88,cz);f.rotation.y=a;
      const ring=h.add(new THREE.Mesh(new THREE.TorusGeometry(.07,.008,6,24),LMM(LM.gold,{metalness:.7})),cx,.88,cz);ring.rotation.y=a;
      const hand=h.add(new THREE.Mesh(new THREE.BoxGeometry(.006,.05,.004),LMM(0x111)),cx+Math.sin(a)*.003,.9,cz+Math.cos(a)*.003);hand.rotation.y=a;hand.rotation.z=.6;}
    h.box(.2,.06,.2,0x9a8a6a,.3,.96,0);h.box(.14,.1,.14,dark,.3,1.02,0);const sp=h.cone(.11,.32,dark,.3,1.12,0,4,{metalness:.3});sp.rotation.y=Math.PI/4;h.ring(4,.09,(x,z)=>h.cone(.015,.1,LM.gold,.3+x,1.08,z,4,{metalness:.7}));h.cyl(.005,.005,.08,LM.gold,.3,1.44,0,4);},
  // Paris: Eiffel Tower — lattice legs, two platforms, tapering mast, beacon
  '파리':g=>{const h=lmHelpers2(g);const iron=0x6b4a33,im=LMM(iron,{metalness:.45,roughness:.55});
    h.box(.9,.02,.9,0x6f9a5a);h.box(.2,.005,.9,0xc9b48a,0,.02,0);h.box(.9,.005,.2,0xc9b48a,0,.02,0);
    const P=[[.02,.34],[.12,.25],[.25,.17],[.38,.125],[.52,.09],[.75,.06],[1.0,.04],[1.2,.026],[1.32,.014]]; // [y, half-width at the corner]
    const C=[[1,1],[1,-1],[-1,-1],[-1,1]];
    for(let k=0;k<P.length-1;k++){const[y0,w0]=P[k],[y1,w1]=P[k+1];const t=y1<=.52?.05-k*.006:.018;
      C.forEach(([sx,sz])=>h.beam([sx*w0,y0,sz*w0],[sx*w1,y1,sz*w1],t,im));
      C.forEach(([sx,sz],c)=>{const[nx,nz]=C[(c+1)%4];h.beam([sx*w0,y0,sz*w0],[nx*w1,y1,nz*w1],.006,im);h.beam([nx*w0,y0,nz*w0],[sx*w1,y1,sz*w1],.006,im);});}
    for(let a=0;a<4;a++){const arc=h.add(new THREE.Mesh(new THREE.TorusGeometry(.2,.012,6,24,Math.PI),im),0,.04,0);arc.rotation.y=a*Math.PI/2;arc.position.set(Math.sin(a*Math.PI/2)*.27,.04,Math.cos(a*Math.PI/2)*.27);arc.scale.set(1,.85,1);}
    h.box(.44,.035,.44,iron,0,.25,0,{metalness:.45});h.box(.46,.012,.46,0xd9b77a,0,.285,0);
    h.box(.24,.03,.24,iron,0,.52,0,{metalness:.45});h.box(.25,.01,.25,0xd9b77a,0,.55,0);
    h.box(.07,.04,.07,iron,0,1.2,0,{metalness:.45});h.cyl(.004,.008,.1,iron,0,1.32,0,4);h.sphere(.018,0xffe0a0,0,1.43,0,{emissive:0xffcc40,emissiveIntensity:2.5});},
  // New York: Statue of Liberty on its star fort and pedestal
  '뉴욕':g=>{const h=lmHelpers2(g);const cop=0x6fb6a0,cm=LMM(cop,{metalness:.35,roughness:.5});
    const star=new THREE.Shape();for(let k=0;k<22;k++){const a=k/22*Math.PI*2,r=k%2?.3:.42;k?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
    const fort=h.add(new THREE.Mesh(new THREE.ExtrudeGeometry(star,{depth:.08,bevelEnabled:false}),LMM(0x9a917f)),0,.08,0);fort.rotation.x=-Math.PI/2;
    h.lathe([[0,0],[.2,0],[.2,.06],[.16,.08],[.15,.3],[.17,.32],[.17,.36],[.12,.38],[0,.38]],0xb8ae9a,0,.08,0);
    h.add(new THREE.Mesh(new THREE.CylinderGeometry(.06,.11,.42,10),cm),0,.67,0);h.add(new THREE.Mesh(new THREE.ConeGeometry(.13,.2,10,1,true),cm),0,.56,0).rotation.x=Math.PI;
    h.sphere(.055,cop,0,.93,0,{metalness:.35});h.ring(7,.06,(x,z,a)=>{if(z>.02)return;const sp=h.cone(.01,.07,cop,x,.97,z,4,{metalness:.35});sp.rotation.z=-x*6;sp.rotation.x=z*6;});
    const arm=h.add(new THREE.Mesh(new THREE.CylinderGeometry(.018,.022,.3,8),cm),.07,1.0,0);arm.rotation.z=-.2;
    h.cyl(.03,.02,.05,LM.gold,.1,1.15,0,8,{metalness:.7});h.sphere(.04,0xffd050,.1,1.22,0,{emissive:0xffa020,emissiveIntensity:2.5});
    const tab=h.box(.06,.09,.02,cop,-.07,.74,.05,{metalness:.35});tab.rotation.z=.3;},
  // Seoul: N Seoul Tower on Namsan with trees and the observatory ring
  '서울':g=>{const h=lmHelpers2(g);
    h.lathe([[0,0],[.48,0],[.4,.12],[.26,.24],[.12,.3],[0,.32]],0x4f8f3a,0,0,0);h.ring(9,.32,(x,z)=>h.cone(.05,.14,0x2f6f2a,x,.12,z,6));h.ring(6,.18,(x,z)=>h.cone(.04,.1,0x3f7f3a,x,.24,z,6));
    h.box(.22,.06,.14,0xe6e0d0,0,.3,0);
    h.lathe([[0,0],[.06,0],[.05,.3],[.035,.6],[0,.6]],0xf4f4f4,0,.32,0);
    h.cyl(.12,.07,.06,0xf4f4f4,0,.84,0,20);h.mcyl(.16,.16,.1,lmWin('#5aaad8','#e6f6ff',12,1,{metal:.3,glow:.6}),0,.9,0,24);h.cyl(.17,.14,.04,0xf4f4f4,0,1.0,0,20);
    h.cyl(.08,.1,.04,0xd8d8d8,0,1.04,0,16);h.cyl(.012,.02,.32,0xd8333c,0,1.08,0,8);for(let k=0;k<4;k++)h.box(.03,.01,.03,0xffffff,0,1.12+k*.07,0);h.sphere(.02,0xff4040,0,1.42,0,{emissive:0xff2020,emissiveIntensity:3});},
};
function landmarkMesh(name){const g=new THREE.Group();const f=LANDMARKS[name];if(f)f(g);else{const h=lmHelpers(g);h.box(.4,.9,.4,LM.glass);}return g;}
/* render a landmark to a small transparent thumbnail canvas (used as the tile's background art) */
const thumbCache={};
let thumbScene=null,thumbCam=null,thumbRT=null;
function landmarkThumb(name){
  if(thumbCache[name])return thumbCache[name];
  if(!thumbScene){thumbScene=new THREE.Scene();thumbScene.add(new THREE.HemisphereLight(0xffffff,0x667788,1.6));const dl=new THREE.DirectionalLight(0xffffff,2.2);dl.position.set(2,4,3);thumbScene.add(dl);thumbCam=new THREE.OrthographicCamera(-.75,.75,1.25,-.25,.1,20);thumbCam.position.set(2.2,1.8,3.2);thumbCam.lookAt(0,.55,0);thumbRT=new THREE.WebGLRenderTarget(192,192,{format:THREE.RGBAFormat});}
  const m=landmarkMesh(name);thumbScene.add(m);
  const prevRT=renderer.getRenderTarget(),prevTM=renderer.toneMapping;renderer.toneMapping=THREE.NoToneMapping;renderer.setRenderTarget(thumbRT);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(thumbScene,thumbCam);
  const px=new Uint8Array(192*192*4);renderer.readRenderTargetPixels(thumbRT,0,0,192,192,px);renderer.setRenderTarget(prevRT);renderer.toneMapping=prevTM;thumbScene.remove(m);disposeObj(m);
  const cv=document.createElement('canvas');cv.width=cv.height=192;const g=cv.getContext('2d');const img=g.createImageData(192,192);
  for(let y=0;y<192;y++){const src=(191-y)*192*4,dst=y*192*4;for(let x=0;x<192*4;x++)img.data[dst+x]=px[src+x];}
  g.putImageData(img,0,0);thumbCache[name]=cv;return cv;
}

function makeLabel(i){
  const t=T(i),r=rect(i),s=G?S(i):{owner:null,level:0};
  const Wc=256,Hc=Math.round(256*r.d/r.w);
  const cv=document.createElement('canvas');cv.width=Wc;cv.height=Hc;const g=cv.getContext('2d');
  g.textAlign='center';g.textBaseline='middle';
  const corner=i%8===0;
  const emo=corner?'116px':'74px',nm=corner?'600 42px':'600 36px',pr=corner?'600 26px':'600 30px';
  const KF0='"Gothic A1","Malgun Gothic","Apple SD Gothic Neo",sans-serif';
  const fit=(txt,maxW,size,weight=600)=>{let sz=size;g.font=weight+' '+sz+'px '+KF0;while(sz>14&&g.measureText(txt).width>maxW){sz-=1;g.font=weight+' '+sz+'px '+KF0;}};
  const EF='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',KF='"Gothic A1","Malgun Gothic","Apple SD Gothic Neo",sans-serif';
  // for side tiles rotate text 0 (reads from front). Layout stacked.
  const mid=Hc/2;
  const sd=SIDE_OF(i);
  if((t.type==='city'||t.type==='tour')&&(sd==='l'||sd==='r')){
    // left/right columns: wide, shallow tiles — picture and info side by side, info away from the building edge
    const bandW=Wc*0.6,bandX=sd==='l'?Wc-bandW-6:6,artSz=Math.min(Hc*0.92,Wc-bandW-16),artX=sd==='l'?8:Wc-artSz-8;
    if(t.type==='city')g.drawImage(landmarkThumb(t.name),artX,mid-artSz/2,artSz,artSz);else{g.font=Math.round(artSz*.7)+'px '+EF;g.fillText(t.ico||'',artX+artSz/2,mid);}
    g.fillStyle='rgba(14,24,36,.88)';g.beginPath();g.roundRect(bandX,8,bandW,Hc-16,14);g.fill();
    if(s.owner!=null){g.fillStyle=G.players[s.owner].color;g.beginPath();g.roundRect(bandX,8,10,Hc-16,[14,0,0,14]);g.fill();}
    const cx=bandX+bandW/2+(s.owner!=null?4:0);
    if(t.type==='tour'){g.font='600 18px '+KF0;g.fillStyle='#7fd8e0';g.fillText('관광지',cx,Hc*0.2);}
    fit(t.name,bandW-22,40);{const gw=g.measureText(t.name).width,ny=Hc*(t.type==='tour'?0.45:0.37),ph=Math.min(50,Hc*0.3);g.fillStyle=t.type==='tour'?'#2a8fa0':GCOLORS[t.g];g.beginPath();g.roundRect(cx-Math.min(gw/2+12,bandW/2-6),ny-ph/2,Math.min(gw+24,bandW-12),ph,10);g.fill();
      g.lineWidth=4;g.strokeStyle='rgba(0,0,0,.45)';g.strokeText(t.name,cx,ny);g.fillStyle='#ffffff';g.fillText(t.name,cx,ny);}
    let sub,col;if(s.owner!=null){sub='통행 '+fmt(toll(i));col=G.players[s.owner].color;}else{sub=fmt(t.price);col='#ffd166';}
    fit(sub,bandW-22,34);const py=Hc*0.73;g.lineWidth=5;g.strokeStyle='rgba(0,0,0,.6)';g.strokeText(sub,cx,py);g.fillStyle=col;g.fillText(sub,cx,py);
  }else if(t.type==='city'||t.type==='tour'){
    // bottom-row tiles have their building and colour stripe on the near (canvas-bottom) edge, so their info band sits higher up
    const flip=false;const bandH=Hc*0.42,bandY=SIDE_OF(i)==='b'?mid+Hc*0.03:mid+Hc*0.05;
    const artSz=flip?Math.min(Wc*0.6,Hc*0.36):Math.min(Wc*0.72,Hc*0.5),artY=flip?bandY+bandH+Hc*0.01:mid-Hc*0.48;
    if(t.type==='city'){g.globalAlpha=.96;g.drawImage(landmarkThumb(t.name),Wc/2-artSz/2,artY,artSz,artSz);g.globalAlpha=1;}
    else{g.font=`${Math.round(artSz*.7)}px ${EF}`;g.fillText(t.ico||'',Wc/2,artY+artSz/2);}
    g.fillStyle='rgba(14,24,36,.88)';g.beginPath();g.roundRect(6,bandY,Wc-12,bandH,14);g.fill();
    if(s.owner!=null){g.fillStyle=G.players[s.owner].color;g.beginPath();g.roundRect(6,bandY,Wc-12,12,[14,14,0,0]);g.fill();}
    g.fillStyle='#ffffff';
    if(t.type==='tour'){g.font=`600 22px ${KF}`;g.fillStyle='#7fd8e0';g.fillText('관 광 지',Wc/2,bandY+bandH*0.2);g.fillStyle='#ffffff';}
    fit(t.name,Wc-28,36);{const gw=g.measureText(t.name).width,ny=bandY+bandH*(t.type==='tour'?0.45:0.36),ph=Math.min(46,bandH*0.42);g.fillStyle=t.type==='tour'?'#2a8fa0':GCOLORS[t.g];g.beginPath();g.roundRect(Wc/2-gw/2-12,ny-ph/2,gw+24,ph,10);g.fill();
      g.lineWidth=4;g.strokeStyle='rgba(0,0,0,.45)';g.strokeText(t.name,Wc/2,ny);g.fillStyle='#ffffff';g.fillText(t.name,Wc/2,ny);}
    let sub,col;if(s.owner!=null){sub='통행 '+fmt(toll(i));col=G.players[s.owner].color;}else{sub=fmt(t.price);col='#ffd166';}
    fit(sub,Wc-28,30);const py=bandY+bandH*0.76;g.lineWidth=6;g.strokeStyle='rgba(0,0,0,.6)';g.strokeText(sub,Wc/2,py);g.fillStyle=col;g.fillText(sub,Wc/2,py);
  }else{
    g.font=`${emo} ${EF}`;g.fillText(t.ico||'',Wc/2,mid-Hc*0.24);
    const darkT=t.type==='casino';
    g.fillStyle=darkT?'#fff7d6':'#15202b';g.font=`${nm} ${KF}`;g.fillText(t.name,Wc/2,mid+Hc*0.2);
    g.font=`${pr} ${KF}`;g.fillStyle=darkT?'#ffd166':'#3a4652';g.fillText(SUBS[t.type]||'',Wc/2,mid+Hc*0.39);
  }
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
}
const hexc=h=>new THREE.Color(h);
function buildTiles(){
  TILES.forEach((t,i)=>{
    const r=rect(i),grp=new THREE.Group();grp.position.set(r.x,0,r.z);
    const topM=new THREE.MeshStandardMaterial({color:BASE[t.type],roughness:.85}),sideM=new THREE.MeshStandardMaterial({color:new THREE.Color(BASE[t.type]).multiplyScalar(.62),roughness:.9});
    const base=new THREE.Mesh(new THREE.BoxGeometry(r.w-0.08,0.22,r.d-0.08),[sideM,sideM,topM,sideM,sideM,sideM]);
    base.position.y=0.11;base.castShadow=true;base.receiveShadow=true;grp.add(base);
    const rim=new THREE.Mesh(new THREE.BoxGeometry(r.w-0.02,0.2,r.d-0.02),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x000000,roughness:.5}));
    rim.position.y=0.09;rim.visible=false;grp.add(rim);
    const frame=new THREE.Group(),frM=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x000000,roughness:.4,metalness:.2}),FT=.085,fw=r.w-0.1,fd=r.d-0.1;
    [[fw,FT,0,(fd-FT)/2],[fw,FT,0,-(fd-FT)/2],[FT,fd,(fw-FT)/2,0],[FT,fd,-(fw-FT)/2,0]].forEach(([w,d,x,z])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.045,d),frM);m.position.set(x,.248,z);frame.add(m);});
    frame.visible=false;frame.userData.mat=frM;grp.add(frame);
    const lab=new THREE.Mesh(new THREE.PlaneGeometry(r.w-0.12,r.d-0.12),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false}));
    lab.rotation.x=-Math.PI/2;lab.position.y=0.225;grp.add(lab);
    let band=null;
    if(t.type==='city'||t.type==='tour'){
      const side=SIDE_OF(i),col=t.type==='tour'?0x2a8fa0:GCOLORS[t.g];
      const horiz=side==='b'||side==='t';
      band=new THREE.Mesh(new THREE.BoxGeometry(horiz?r.w-0.08:0.2,0.04,horiz?0.2:r.d-0.08),new THREE.MeshStandardMaterial({color:col,roughness:.5,emissive:hexc(col).multiplyScalar(.15)}));
      band.position.y=0.24;
      if(side==='b')band.position.z=-(r.d/2-0.14);if(side==='t')band.position.z=-(r.d/2-0.14);if(side==='l')band.position.x=-(r.w/2-0.14);if(side==='r')band.position.x=r.w/2-0.14;
      grp.add(band);
    }
    const bgrp=new THREE.Group();grp.add(bgrp);
    const fest=makeSprite('🎉',0.6);fest.position.set(0,0.95,0);fest.visible=false;grp.add(fest);
    const prop=tileProp(t,i);if(prop)grp.add(prop);grp.userData.prop=prop;
    base.userData.tile=i;lab.userData.tile=i;
    scene.add(grp);tiles.push({grp,base,rim,lab,band,bgrp,fest,prop,frame,key:null});
  });
}
function spriteTex(text,size=128,bg=null,ring=null){
  const cv=document.createElement('canvas');cv.width=cv.height=size;const g=cv.getContext('2d');
  if(bg){g.fillStyle=bg;g.beginPath();g.arc(size/2,size/2,size/2-4,0,Math.PI*2);g.fill();if(ring){g.lineWidth=size*.07;g.strokeStyle=ring;g.stroke();}}
  g.font=`${size*0.62}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(text,size/2,size/2+size*.04);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function makeSprite(text,scale,bg,ring){
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:spriteTex(text,128,bg,ring),transparent:true,depthTest:true}));sp.scale.set(scale,scale,1);return sp;
}
/* small 3D props that give each special tile a silhouette; city tiles get a flag in their group colour */
function tileProp(t,i){
  const r=rect(i),g=new THREE.Group();const add=(m,x,y,z)=>{m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;};
  const [ox,oz]=nearFirst(i)?outerOffset(i,-(Math.min(r.w,r.d)/2-0.3)):outerOffset(i,Math.min(r.w,r.d)/2-0.3),[tx,tz]=tangent(i);
  if(t.type==='city')return null; // the colour group now shows behind the city name
  const cx=ox*.5,cz=oz*.5;
  switch(t.type){
    case 'start':{const post=M(0xf4f4f4),chk=new THREE.MeshStandardMaterial({map:stripeTex('#111','#fff',8),roughness:.8});
      add(new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,.9,8),post),cx-.5,.22+.45,cz);add(new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,.9,8),post),cx+.5,.22+.45,cz);
      add(new THREE.Mesh(new THREE.BoxGeometry(1.15,.14,.1),chk),cx,.22+.92,cz);
      [-.35,0,.35].forEach((x,k)=>{const f=add(new THREE.Mesh(new THREE.PlaneGeometry(.16,.1),new THREE.MeshStandardMaterial({color:PCOLORS[k+1]||0xffd166,side:THREE.DoubleSide})),cx+x,.22+1.06,cz);hubFx.spinners.push({obj:f,speed:0,y:f.position.y,phase:k});});break;}
    case 'island':{add(new THREE.Mesh(new THREE.DodecahedronGeometry(.22,0),M(0x7a7f86)),cx+.35,.22+.15,cz+.2);add(new THREE.Mesh(new THREE.DodecahedronGeometry(.13,0),M(0x9a9fa6)),cx+.1,.22+.1,cz+.42);
      const trunk=add(new THREE.Mesh(new THREE.CylinderGeometry(.03,.05,.7,6),M(0x8b5a2b)),cx-.3,.22+.35,cz-.1);trunk.rotation.z=.25;for(let q=0;q<5;q++){const l=add(new THREE.Mesh(new THREE.ConeGeometry(.05,.42,4),M(0x2e8b3d)),cx-.38,.22+.75,cz-.1);l.rotation.set(1.1,q*1.26,0);}break;}
    case 'festival':{const tent=add(new THREE.Mesh(new THREE.ConeGeometry(.32,.42,12),new THREE.MeshStandardMaterial({map:stripeTex('#ff5a5a','#ffffff',12),roughness:.9})),cx+.25,.22+.45,cz+.1);add(new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.22,12),M(0xf0e6d2)),cx+.25,.22+.11,cz+.1);
      for(let k=0;k<4;k++){const lan=add(new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),M([0xff5a5a,0xffd166,0x7cf29a,0x4fc3f7][k],{emissive:[0xff5a5a,0xffd166,0x7cf29a,0x4fc3f7][k],emissiveIntensity:1.2})),cx-.45+k*.2,.22+.6+Math.sin(k)*.05,cz-.35);hubFx.spinners.push({obj:lan,speed:0,y:lan.position.y,phase:k*2});}break;}
    case 'travel':{const pl=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.45,6,10),M(0xf4f4f4,{roughness:.4}));body.rotation.z=Math.PI/2;pl.add(body);const wing=new THREE.Mesh(new THREE.BoxGeometry(.16,.02,.7),M(0xdddddd));pl.add(wing);const tail=new THREE.Mesh(new THREE.BoxGeometry(.1,.18,.02),M(0xd8333c));tail.position.set(-.26,.1,0);pl.add(tail);
      pl.position.set(cx,.22+.55,cz);pl.rotation.z=.15;g.add(pl);add(new THREE.Mesh(new THREE.CylinderGeometry(.02,.04,.45,6),M(0x888)),cx,.22+.22,cz);hubFx.spinners.push({obj:pl,speed:.6,y:pl.position.y,phase:0});break;}
    case 'chance':{const cv=document.createElement('canvas');cv.width=128;cv.height=180;const gg=cv.getContext('2d');const gr=gg.createLinearGradient(0,0,128,180);gr.addColorStop(0,'#ffb347');gr.addColorStop(1,'#ff5a5a');gg.fillStyle=gr;gg.fillRect(0,0,128,180);gg.strokeStyle='#fff';gg.lineWidth=8;gg.strokeRect(8,8,112,164);gg.fillStyle='#fff';gg.font='bold 100px sans-serif';gg.textAlign='center';gg.textBaseline='middle';gg.fillText('?',64,92);
      const tx2=new THREE.CanvasTexture(cv);tx2.colorSpace=THREE.SRGBColorSpace;const card=add(new THREE.Mesh(new THREE.BoxGeometry(.3,.42,.02),[M(0xffffff),M(0xffffff),M(0xffffff),M(0xffffff),new THREE.MeshStandardMaterial({map:tx2,roughness:.5}),new THREE.MeshStandardMaterial({map:tx2,roughness:.5})]),cx,.22+.5,cz);hubFx.spinners.push({obj:card,speed:1.4,y:card.position.y,phase:i});break;}
    case 'casino':{add(new THREE.Mesh(new THREE.BoxGeometry(.28,.34,.2),M(0xd8333c,{metalness:.3})),ox,.22+.17,oz);const scr=add(new THREE.Mesh(new THREE.BoxGeometry(.22,.11,.02),M(0xfff0a0,{emissive:0xffcc40,emissiveIntensity:1.2})),ox,.22+.25,oz+.11);
      add(new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.2,6),M(0xcccccc)),ox+.17,.22+.34,oz);add(new THREE.Mesh(new THREE.SphereGeometry(.03,8,8),M(0xd8333c)),ox+.17,.22+.45,oz);hubFx.beacons.push(scr);break;} // small, on the icon side so the name stays readable
    case 'auction':{add(new THREE.Mesh(new THREE.BoxGeometry(.4,.3,.25),M(0x8b5a2b)),cx,.22+.15,cz);const head=add(new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.18,10),M(0x5a3a1a)),cx+.05,.22+.42,cz);head.rotation.z=Math.PI/2;const hd=add(new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.26,6),M(0x8b5a2b)),cx+.05,.22+.33,cz);hd.rotation.x=.4;break;}
    default:return null;
  }
  return g;
}
/* buildings: window-grid textures, doors, roof details, glowing hotel sign, blinking landmark beacon */
function buildingMesh(level,color,name){
  const g=new THREE.Group();const c=new THREE.Color(color);
  const wallC=c.clone().lerp(new THREE.Color(0xffffff),0.55);
  const wallOf=(cols,rows)=>{const wt=windowTex(cols,rows);const m=new THREE.MeshStandardMaterial({color:wallC,roughness:.6,map:wt,emissiveMap:wt,emissive:0xffffff,emissiveIntensity:.35});const plain=new THREE.MeshStandardMaterial({color:wallC,roughness:.6});return[m,m,plain,plain,m,m];};
  const roofM=new THREE.MeshStandardMaterial({color:c,roughness:.5});
  const add=(m,x,y,z)=>{m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
  const door=(x,y,z,w=.1,h=.14)=>add(new THREE.Mesh(new THREE.BoxGeometry(w,h,.02),M(0x5a3a1a)),x,y,z);
  const ac=(x,y,z)=>add(new THREE.Mesh(new THREE.BoxGeometry(.08,.06,.08),M(0xb0b8c0)),x,y,z);
  if(level===1){
    add(new THREE.Mesh(new THREE.BoxGeometry(.3,.22,.3),wallOf(2,1)),0,.11,0);door(0,.07,.155,.08,.12);
    const roof=add(new THREE.Mesh(new THREE.ConeGeometry(.26,.2,4),roofM),0,.32,0);roof.rotation.y=Math.PI/4;
    add(new THREE.Mesh(new THREE.BoxGeometry(.05,.14,.05),M(0x8a6a5a)),.08,.4,-.06);
  }else if(level===2){
    add(new THREE.Mesh(new THREE.BoxGeometry(.32,.6,.32),wallOf(3,5)),0,.3,0);door(0,.08,.165);
    add(new THREE.Mesh(new THREE.BoxGeometry(.34,.05,.34),roofM),0,.62,0);ac(-.08,.675,.06);ac(.09,.675,-.07);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.22,4),M(0x666)),.05,.75,.05);
  }else if(level===3){
    add(new THREE.Mesh(new THREE.BoxGeometry(.42,.85,.36),wallOf(4,7)),0,.425,0);door(0,.09,.185,.16,.16);
    add(new THREE.Mesh(new THREE.BoxGeometry(.5,.05,.44),M(0xd9d2c0)),0,.12,0);
    add(new THREE.Mesh(new THREE.BoxGeometry(.46,.06,.4),roofM),0,.88,0);ac(-.12,.94,.08);ac(.1,.94,-.1);
    const sign=textPlane('HOTEL',.36,.11,'#fff7d6','#b8222a','bold 110px "Gothic A1",sans-serif');sign.position.set(0,.98,.0);sign.material.emissive&&0;const glow=new THREE.Mesh(new THREE.BoxGeometry(.38,.13,.03),M(0xffd166,{emissive:0xffaa33,emissiveIntensity:.9}));glow.position.set(0,.98,-.02);g.add(glow);g.add(sign);
    add(new THREE.Mesh(new THREE.BoxGeometry(.42,.03,.08),new THREE.MeshStandardMaterial({color:0xd8333c})),0,.2,.2);
  }else if(level===4){
    const gold=new THREE.MeshStandardMaterial({color:0xffc94a,metalness:.7,roughness:.25,emissive:0x5a3a00,emissiveIntensity:.35});
    add(new THREE.Mesh(new THREE.CylinderGeometry(.36,.4,.07,28),gold),0,.035,0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.3,.34,.05,28),new THREE.MeshStandardMaterial({color:0xf3e9d2,roughness:.7})),0,.095,0);
    const lm=landmarkMesh(name);const bb=new THREE.Box3().setFromObject(lm);const size=bb.getSize(new THREE.Vector3());
    const sc=Math.min(.66/Math.max(size.x,size.z,.01),1.25/Math.max(size.y,.01));lm.scale.setScalar(sc);lm.position.y=.12;lm.rotation.y=-Math.PI/8;g.add(lm);
    const bc=add(new THREE.Mesh(new THREE.SphereGeometry(.05,12,12),new THREE.MeshStandardMaterial({color:0xfff0a0,emissive:0xffcc40,emissiveIntensity:2.5})),0,.12+size.y*sc+.1,0);hubFx.beacons.push(bc);
    for(let k=0;k<6;k++){const a=k*Math.PI/3;add(new THREE.Mesh(new THREE.SphereGeometry(.025,8,8),gold),Math.cos(a)*.37,.09,Math.sin(a)*.37);}
  }
  return g;
}
function outerOffset(i,dist){ // vector from tile center toward its outer edge
  const s=SIDE_OF(i);return s==='b'?[0,dist]:s==='t'?[0,-dist]:s==='l'?[-dist,0]:[dist,0];
}
function tangent(i){const s=SIDE_OF(i);return(s==='b'||s==='t')?[1,0]:[0,1];}
