/* ===== ZORO 3D — rendu 3e personne (three.js r128). La logique du jeu (Firebase, positions, tâches) reste dans game.html ===== */
(function(){
"use strict";
if(!window.THREE)return;
var PI=Math.PI,H=9.5,U=1/22;
var scene=null,camera=null,renderer=null,T=null,M='',KEY='',blocks=[],bRects=[],walls=[],fires=[],spin=[],parts=null,lamp=null,CAP=null,CB=null,RM=[],STM=[],CH={},arrow=null,ringMe=null;
var yaw=0,pitch=.42,camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),ray=new THREE.Raycaster(),first=true,last=0,clock=new THREE.Clock();
/* hasard reproductible : même décor pour tous les joueurs */
var SEED=1;function srand(s){SEED=s>>>0||1}function rand01(){SEED=(SEED*1664525+1013904223)>>>0;return SEED/4294967296}
var TH={
 ete:{sky:0x0b1626,hemi:[0x7f9fd0,0x1a2a14,.85],sun:[0xb4c8ff,.55],ground:0x0f2416,path:0x5f4b31,pathE:0x2a2014,
  z:{def:0x305c30,water:0x6f6648,feu:0x5e4a2b,cave:0x3a3a42,ruin:0x4f4c3c,glow:0x245446,lava:0x4a2418,sand:0x9a8a5a,snow:0xdfe8f2},tree:'pine',tc:[0x1d4a2a,0x16402a,0x24553a,0x2c5a2c],headlamp:1,gc:0x3f7a3a,bc:[0x1f4a26,0x2a5a2e,0x34603a],part:{n:240,c:0xd8ff7a,s:.22,m:'float'}},
 paq:{sky:0xcfeaff,hemi:[0xffffff,0x5a7a3a,.95],sun:[0xfff1d6,.8],ground:0x4a8a3a,path:0x9a7f5a,pathE:0x6a5236,
  z:{def:0x6cad50,water:0xc9b783,feu:0x7a6038,cave:0x5c4d3e,ruin:0x7a7258,glow:0x86c06e,lava:0x7a3a20,sand:0xd8c890,snow:0xf0f5fa},tree:'blossom',tc:[0xf7b6d2,0xffffff,0xf9d0e2,0x9ad47a,0xffe3ef],gc:0x8acd5a,bc:[0x5fa040,0x78b850,0xf4a6c6],part:{n:200,c:0xffc2dc,s:.2,m:'fall'}},
 noel:{sky:0x0d0705,hemi:[0xffdcb4,0x3a1c0c,.8],sun:[0xffe0c0,.4],ground:0x0d0705,path:0x7a1d22,pathE:0x4a0f12,indoor:1,wall:0xe8dcc4,
  z:{def:0x8f6240,feu:0x96693f,glow:0x6e6e86,cave:0x5a4430,ruin:0x62584a,snow:0xf0f5fa,water:0x8f6240,lava:0x8f6240,sand:0x8f6240},part:{n:140,c:0xffe2b0,s:.12,m:'float'}},
 av:{sky:0x9cd0b8,hemi:[0xfff0d0,0x3a5a2a,.95],sun:[0xffd9a0,.85],ground:0x24502a,path:0xa3814d,pathE:0x6a5230,
  z:{def:0xa88e5a,water:0xdcc993,feu:0x7a5a30,cave:0x3a4050,ruin:0x80795c,glow:0x958350,lava:0x4a2418,sand:0xdcbe7e,snow:0xf0f5fa},tree:'palm',tc:[0x2f7a34,0x3d8c3a,0x276a2e,0x4a9a3e],gc:0x6a8a3a,bc:[0x2f7a34,0x4a9a3e,0x6aa83a],part:{n:160,c:0xfff3a0,s:.16,m:'float'}}};

var MC={};
function mat(c,e,o){var k=c+'_'+(e||0)+'_'+(o||1);if(!MC[k]){MC[k]=new THREE.MeshLambertMaterial({color:c,emissive:e?c:0,emissiveIntensity:e||0,transparent:o<1,opacity:o||1})}return MC[k]}
function rnd(a,b){return a+Math.random()*(b-a)}
function add(m){scene.add(m);return m}
function mesh(g,c,x,y,z,e){var m=new THREE.Mesh(g,mat(c,e));m.position.set(x,y,z);return add(m)}
function box(w,h,d,c,x,y,z,ry,e){var m=mesh(new THREE.BoxGeometry(w,h,d),c,x,y,z,e);m.rotation.y=ry||0;return m}
function cyl(rt,rb,h,c,x,y,z,sg,e){return mesh(new THREE.CylinderGeometry(rt,rb,h,sg||8),c,x,y,z,e)}
function cone(r,h,c,x,y,z,sg,ry,e){var m=mesh(new THREE.ConeGeometry(r,h,sg||8),c,x,y,z,e);m.rotation.y=ry||0;return m}
function ico(r,c,x,y,z,e){return mesh(new THREE.IcosahedronGeometry(r,0),c,x,y,z,e)}
function blk(x,z,r){blocks.push([x,z,r])}

/* ---------- étiquettes ---------- */
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function label(txt,h,bg,fg){var c=document.createElement('canvas'),x=c.getContext('2d'),fs=56;x.font='900 '+fs+'px Nunito,system-ui,sans-serif';var w=Math.ceil(x.measureText(txt).width)+fs*.9;c.width=w;c.height=Math.round(fs*1.55);x.font='900 '+fs+'px Nunito,system-ui,sans-serif';if(bg){x.fillStyle=bg;rr(x,2,2,w-4,c.height-4,c.height/2-2);x.fill()}x.fillStyle=fg||'#fff';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,w/2,c.height/2+3);var t=new THREE.CanvasTexture(c);t.minFilter=THREE.LinearFilter;var s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(h*w/c.height,h,1);return s}

/* ---------- personnage scout (original) ---------- */
function scout(col,name){
 var g=new THREE.Group(),skin=0xe2b08a,khaki=0xc9b07a,navy=0x22314f,hat=0x7a5a35;
 function p(geo,c,x,y,z,par){var m=new THREE.Mesh(geo,mat(c));m.position.set(x,y,z);(par||g).add(m);return m}
 function limb(x,y){var q=new THREE.Group();q.position.set(x,y,0);g.add(q);return q}
 var lL=limb(-.16,.82),lR=limb(.16,.82);
 [lL,lR].forEach(function(l){p(new THREE.BoxGeometry(.24,.5,.26),khaki,0,-.2,0,l);p(new THREE.BoxGeometry(.22,.36,.24),skin,0,-.6,0,l);p(new THREE.BoxGeometry(.26,.14,.36),0x3a2a1a,0,-.79,.04,l)});
 p(new THREE.BoxGeometry(.6,.3,.34),navy,0,.86,0);
 p(new THREE.CylinderGeometry(.33,.3,.62,10),khaki,0,1.28,0);
 p(new THREE.CylinderGeometry(.31,.31,.07,10),0x4a3420,0,1.0,0);
 var aL=limb(-.44,1.52),aR=limb(.44,1.52);
 [aL,aR].forEach(function(a){p(new THREE.BoxGeometry(.18,.42,.2),khaki,0,-.18,0,a);p(new THREE.BoxGeometry(.15,.3,.17),skin,0,-.52,0,a);p(new THREE.SphereGeometry(.1,8,6),skin,0,-.7,0,a)});
 p(new THREE.CylinderGeometry(.33,.36,.12,10),col,0,1.6,0);
 var tri=p(new THREE.ConeGeometry(.2,.46,3),col,0,1.38,-.3);tri.rotation.x=PI;
 p(new THREE.SphereGeometry(.07,8,6),0xd4a017,0,1.47,.31);
 p(new THREE.BoxGeometry(.07,.26,.05),col,-.06,1.3,.31);p(new THREE.BoxGeometry(.07,.26,.05),col,.06,1.3,.31);
 p(new THREE.BoxGeometry(.5,.58,.26),col,0,1.25,-.38);p(new THREE.BoxGeometry(.4,.2,.08),0x2a2a2a,0,1.1,-.52);
 p(new THREE.SphereGeometry(.3,14,12),skin,0,1.9,0);
 p(new THREE.SphereGeometry(.045,6,6),0x1a1a1a,-.1,1.93,.27);p(new THREE.SphereGeometry(.045,6,6),0x1a1a1a,.1,1.93,.27);
 p(new THREE.CylinderGeometry(.56,.56,.05,18),hat,0,2.1,0);var cr=p(new THREE.CylinderGeometry(.2,.3,.32,4),hat,0,2.28,0);cr.rotation.y=PI/4;
 var sh=new THREE.Mesh(new THREE.CircleGeometry(.5,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false}));sh.rotation.x=-PI/2;sh.position.y=.03;g.add(sh);
 var lb=label(name,.36,'rgba(8,14,26,.55)');lb.position.y=2.75;g.add(lb);
 g.userData={lL:lL,lR:lR,aL:aL,aR:aR,ph:0,fz:false,col:col,name:name,lb:lb};
 return g}
var ICE=new THREE.MeshLambertMaterial({color:0xa8e4ff,emissive:0x2a6aa0,emissiveIntensity:.55});
function freeze(ch){var u=ch.userData;if(u.fz)return;u.fz=true;ch.traverse(function(o){if(o.isMesh&&o.material!==ICE&&!o.material.transparent){o.userData.m0=o.material;o.material=ICE}});
 var ib=new THREE.Mesh(new THREE.BoxGeometry(1.3,2.6,1.1),new THREE.MeshLambertMaterial({color:0x9fe0ff,transparent:true,opacity:.28,depthWrite:false}));ib.position.y=1.25;ch.add(ib);
 var s=label('❄ figé',.38,'rgba(40,110,170,.8)');s.position.y=3.2;ch.add(s);[u.lL,u.lR,u.aL,u.aR].forEach(function(l){l.rotation.x=0})}

/* ---------- monde ---------- */
function dWalk(x,z){var m=1e9;for(var i=0;i<rects.length;i++){var a=rects[i],dx=Math.max(a[0]-x,0,x-a[1]),dz=Math.max(a[2]-z,0,z-a[3]),d=Math.sqrt(dx*dx+dz*dz);if(d<m)m=d}return m}
function walk(x,z,r){var ok=false,i,a;for(i=0;i<rects.length;i++){a=rects[i];if(x>a[0]+r&&x<a[1]-r&&z>a[2]+r&&z<a[3]-r){ok=true;break}}if(!ok)return false;for(i=0;i<blocks.length;i++){var b=blocks[i],dx=x-b[0],dz=z-b[1];if(dx*dx+dz*dz<(b[2]+r)*(b[2]+r))return false}for(i=0;i<bRects.length;i++){a=bRects[i];if(x>a[0]-r&&x<a[1]+r&&z>a[2]-r&&z<a[3]+r)return false}return true}
function roomAt(x,z){var c=Math.round(x/S),r=Math.round(z/S);if(c<0||c>3||r<0||r>3)return null;var q=rooms[r*4+c];return Math.abs(x-q.x)<=H&&Math.abs(z-q.z)<=H?q:null}
function door(q,s){return s==='n'?q.r>0:s==='s'?q.r<3:s==='w'?q.c>0:q.c<3}
function floorMat(c){return new THREE.MeshPhongMaterial({color:c,shininess:0,flatShading:true})}

function inst(geo,list,fn){var m=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({color:0xffffff}),list.length),o=new THREE.Object3D(),c=new THREE.Color();list.forEach(function(p,i){fn(o,p,c);o.updateMatrix();m.setMatrixAt(i,o.matrix);m.setColorAt(i,c)});if(m.instanceColor)m.instanceColor.needsUpdate=true;return add(m)}

function forest(){
 var pts=[],b0=-34,b1=3*S+34,step=T.tree==='palm'?3.4:3.0;
 for(var x=b0;x<=b1;x+=step)for(var z=b0;z<=b1;z+=step){var px=x+rnd(-1.1,1.1),pz=z+rnd(-1.1,1.1),d=dWalk(px,pz);if(d>1.9)pts.push([px,pz,rnd(.75,1.35),d])}
 var tc=T.tc;
 if(T.tree==='pine'){
  inst(new THREE.CylinderGeometry(.22,.32,1.6,5),pts,function(o,p,c){o.position.set(p[0],.8*p[2],p[1]);o.scale.set(p[2],p[2],p[2]);c.setHex(0x3a2a1a)});
  inst(new THREE.ConeGeometry(1.7,3.4,7),pts,function(o,p,c){o.position.set(p[0],2.9*p[2],p[1]);o.rotation.y=p[0];o.scale.set(p[2],p[2],p[2]);c.setHex(tc[(Math.abs(p[0]*7+p[1]*3)|0)%tc.length])});
  inst(new THREE.ConeGeometry(1.2,2.6,7),pts,function(o,p,c){o.position.set(p[0],4.5*p[2],p[1]);o.scale.set(p[2],p[2],p[2]);c.setHex(tc[(Math.abs(p[0]*3+p[1]*5)|0)%tc.length])});
 }else if(T.tree==='blossom'){
  inst(new THREE.CylinderGeometry(.2,.3,2.4,5),pts,function(o,p,c){o.position.set(p[0],1.2*p[2],p[1]);o.scale.set(p[2],p[2],p[2]);c.setHex(0x6a4a30)});
  inst(new THREE.IcosahedronGeometry(1.8,0),pts,function(o,p,c){o.position.set(p[0],3.1*p[2],p[1]);o.rotation.set(p[0],p[1],0);o.scale.set(p[2],p[2]*.9,p[2]);c.setHex(tc[(Math.abs(p[0]*7+p[1]*3)|0)%tc.length])});
 }else{
  inst(new THREE.CylinderGeometry(.16,.28,5,6),pts,function(o,p,c){o.position.set(p[0],2.5*p[2],p[1]);o.rotation.set(Math.sin(p[0])*.12,0,Math.cos(p[1])*.12);o.scale.set(p[2],p[2],p[2]);c.setHex(0x7a5a38)});
  inst(new THREE.ConeGeometry(2.8,1.3,7),pts,function(o,p,c){o.position.set(p[0]+Math.cos(p[1])*.6*p[2],5*p[2],p[1]-Math.sin(p[0])*.6*p[2]);o.rotation.y=p[1];o.scale.set(p[2],p[2],p[2]);c.setHex(tc[(Math.abs(p[0]*7+p[1]*3)|0)%tc.length])});
 }
 var gt=[];rooms.forEach(function(q){for(var k=0;k<46;k++){var x=q.x+rnd(-H+.6,H-.6),z=q.z+rnd(-H+.6,H-.6);if(q.k==='water'||q.k==='lava'||q.id==='feu'||q.k==='cave')continue;gt.push([x,z,rnd(.5,1)])}});var gc=T.tree==='pine'?0x3f7a3a:T.tree==='palm'?0x6a8a3a:0x8acd5a;inst(new THREE.ConeGeometry(.12,.55,3),gt,function(o,p,c){o.position.set(p[0],.25*p[2],p[1]);o.rotation.set(Math.sin(p[0])*.3,p[1],Math.cos(p[1])*.3);o.scale.set(p[2],p[2],p[2]);c.setHex(gc)});
 var bu=[];for(var i=0;i<rects.length;i++){var a=rects[i];for(var k=0;k<22;k++){var bx=rnd(a[0]-2.6,a[1]+2.6),bz=rnd(a[2]-2.6,a[3]+2.6),d=dWalk(bx,bz);if(d>.9&&d<2.6)bu.push([bx,bz,rnd(.5,1.1)])}}
 var bc=T.tree==='blossom'?[0x5fa040,0x78b850,0xf4a6c6]:T.tree==='palm'?[0x2f7a34,0x4a9a3e,0x6aa83a]:[0x1f4a26,0x2a5a2e,0x34603a];
 inst(new THREE.IcosahedronGeometry(.9,0),bu,function(o,p,c){o.position.set(p[0],.45*p[2],p[1]);o.rotation.set(p[0],p[1],0);o.scale.set(p[2]*1.2,p[2],p[2]*1.2);c.setHex(bc[(Math.abs(p[0]*13+p[1]*7)|0)%bc.length])});
}

/* ---------- objets ---------- */
function P(q,dx,dz){return [q.x+dx,q.z+dz]}
function tent(x,z,c,ry){var t=cone(2.1,2.4,c,x,1.2,z,4,(ry||0)+PI/4);box(.7,1.1,.1,0x1a1a1a,x+Math.sin(ry||0)*1.45,.55,z+Math.cos(ry||0)*1.45,ry);blk(x,z,1.9);return t}
function logH(x,z,ry,c){var m=cyl(.28,.28,2.2,c||0x6b4a2a,x,.28,z,7);m.rotation.z=PI/2;m.rotation.y=ry||0;return m}
function rock(x,z,s,c){var m=ico(s,c||0x6e6e74,x,s*.45,z);m.rotation.set(x,z,0);return m}
function fire(x,z,big){var s=big?1.25:1;for(var i=0;i<9;i++){var a=i/9*2*PI;rock(x+Math.cos(a)*1.25*s,z+Math.sin(a)*1.25*s,.32*s,0x5c5c62)}
 logH(x,z,.4,0x4a3220).scale.set(1,.8*s,1);logH(x,z,-.8,0x4a3220).scale.set(1,.8*s,1);
 var f1=cone(.5*s,1.3*s,0xff7a1a,x,.75*s,z,6,0,1),f2=cone(.3*s,.95*s,0xffd84a,x,.62*s,z,6,0,1);
 var L=new THREE.PointLight(0xff8a3a,2.4,26,1.6);L.position.set(x,2.2,z);add(L);fires.push({f1:f1,f2:f2,L:L,b:2.4});blk(x,z,1.6*s)}
function water(x0,x1,z0,z1,c,solid){var m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),new THREE.MeshPhongMaterial({color:c||0x2b6f96,emissive:0x0a2a40,shininess:90,specular:0x88ccff,transparent:true,opacity:.92}));m.rotation.x=-PI/2;m.position.set((x0+x1)/2,.06,(z0+z1)/2);add(m);if(solid)bRects.push([x0,x1,z0,z1]);return m}
function pond(q,c){var sides=['e','w','n','s'].filter(function(s){return !door(q,s)}),d=7.5,x=q.x,z=q.z;
 if(!sides.length){water(x-H,x+H,z-1.6,z+1.6,c);for(var i=-2;i<=2;i++)if(i)rock(x+i*3.2,z+(i%2)*.4,.45,0x7a7a80);return null}
 var s=sides[0],R=s==='e'?[x+H-d,x+H,z-H,z+H]:s==='w'?[x-H,x-H+d,z-H,z+H]:s==='n'?[x-H,x+H,z-H,z-H+d]:[x-H,x+H,z+H-d,z+H];water(R[0],R[1],R[2],R[3],c,true);
 for(var k=0;k<5;k++){var e=s==='e'||s==='w',t=-H+2+k*(2*H-4)/4;rock(e?(s==='e'?R[0]:R[1]):x+t,e?z+t:(s==='n'?R[3]:R[2]),.5,0x77777d)}
 return [(R[0]+R[1])/2,(R[2]+R[3])/2]}
function flag(x,z,c){cyl(.08,.1,6.5,0xd8d8d8,x,3.25,z,6);box(1.6,1,.06,c,x+.85,5.8,z);blk(x,z,.4)}
function tower(x,z){[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(o){cyl(.13,.16,5,0x6b4a2a,x+o[0]*1.2,2.5,z+o[1]*1.2,6)});box(3,.25,3,0x7a5632,x,5,z);cone(2.4,1.6,0x5a3a22,x,6.6,z,4,PI/4);for(var i=0;i<6;i++)box(.9,.08,.12,0x8a6642,x+1.3,.6+i*.8,z,PI/2);blk(x,z,1.8)}
function table(x,z,ry,c){box(2.6,.12,1.2,c||0x8a6642,x,.9,z,ry);box(.12,.9,1,c||0x6b4a2a,x-1.1*Math.cos(ry||0),.45,z+1.1*Math.sin(ry||0),ry);box(.12,.9,1,c||0x6b4a2a,x+1.1*Math.cos(ry||0),.45,z-1.1*Math.sin(ry||0),ry);blk(x,z,1.3)}
function crate(x,z,s){box(s||1,s||1,s||1,0x9a7040,x,(s||1)/2,z,rnd(0,1));blk(x,z,(s||1)*.7)}
function pillar(x,z,h){cyl(.55,.65,h,0xb8b09a,x,h/2,z,8);box(1.5,.3,1.5,0xa8a08a,x,.15,z);if(h>3)box(1.4,.3,1.4,0xa8a08a,x,h+.15,z);blk(x,z,.8)}
function crystal(x,z,c){for(var i=0;i<4;i++){var m=cone(.35,rnd(1.2,2.4),c,x+rnd(-.6,.6),.6,z+rnd(-.6,.6),5,0,.7);m.rotation.z=rnd(-.4,.4);spin.push({m:m,y:m.position.y,a:rnd(0,6),k:'pulse'})}blk(x,z,1)}
function lantern(x,z,c){cyl(.05,.05,2.2,0x3a3a3a,x,1.1,z,5);var m=box(.36,.46,.36,c||0xffd060,x,2.3,z,0,1);spin.push({m:m,y:2.3,a:rnd(0,6),k:'bob'});blk(x,z,.3)}
function hut(x,z,c,ry){box(4,2.8,3.4,c||0x7a5632,x,1.4,z,ry);cone(3.3,1.9,0x5a3a22,x,3.75,z,4,(ry||0)+PI/4);box(.9,1.7,.1,0x2a1a10,x+Math.sin(ry||0)*1.71,.85,z+Math.cos(ry||0)*1.71,ry);blk(x,z,2.4)}
function chapel(x,z,ry){box(4.2,3.4,5,0xeee6d6,x,1.7,z,ry);cone(3.9,2.4,0x8a3a2a,x,4.6,z,4,(ry||0)+PI/4);box(.18,1.4,.18,0xd4a017,x,6.4,z,ry,.4);box(.8,.18,.18,0xd4a017,x,6.6,z,ry,.4);box(1.2,2,.1,0x5a3a22,x+Math.sin(ry||0)*2.52,1,z+Math.cos(ry||0)*2.52,ry);blk(x,z,2.9)}
function bunny(x,z,ry){var g=new THREE.Group();function p(geo,c,a,b,d){var m=new THREE.Mesh(geo,mat(c));m.position.set(a,b,d);g.add(m);return m}p(new THREE.SphereGeometry(.4,10,8),0xf4f0ea,0,.4,0).scale.set(1,.9,1.25);p(new THREE.SphereGeometry(.26,10,8),0xf4f0ea,0,.75,.38);p(new THREE.BoxGeometry(.09,.42,.05),0xffd0dc,-.09,1.12,.36);p(new THREE.BoxGeometry(.09,.42,.05),0xffd0dc,.09,1.12,.36);p(new THREE.SphereGeometry(.12,8,6),0xffffff,0,.45,-.5);g.position.set(x,0,z);g.rotation.y=ry||0;add(g);spin.push({m:g,y:0,a:rnd(0,6),k:'hop'});return g}
function egg(x,z,c){var m=mesh(new THREE.SphereGeometry(.3,10,8),c,x,.36,z);m.scale.y=1.3;return m}
function flowers(q,n,cs){for(var i=0;i<n;i++){var x=q.x+rnd(-H+1,H-1),z=q.z+rnd(-H+1,H-1);if(Math.abs(x-q.x)<4&&Math.abs(z-q.z)<4)continue;cyl(.03,.03,.4,0x3a7a2a,x,.2,z,4);ico(.13,cs[i%cs.length],x,.42,z)}}
function mush(x,z){cyl(.12,.15,.4,0xf0e6d0,x,.2,z,6);var m=mesh(new THREE.SphereGeometry(.34,10,6,0,2*PI,0,PI/2),0xd93a2a,x,.38,z)}
function xtree(x,z,s){s=s||1;cyl(.25*s,.3*s,.8*s,0x5a3a22,x,.4*s,z,6);[[2*s,2.4*s,1.6*s],[1.6*s,2*s,2.9*s],[1.1*s,1.6*s,4*s]].forEach(function(a){cone(a[0],a[1],0x1f6a3a,x,a[2],z,9)});var st=ico(.35*s,0xffd84a,x,5*s,z,1);spin.push({m:st,y:5*s,a:0,k:'spin'});
 var bc=[0xe23a3a,0xffd84a,0x3b82f6,0xffffff];for(var i=0;i<16;i++){var a=i*2.4,h=1.2*s+(i/16)*3.2*s,rad=(2-(i/16)*1.5)*s;mesh(new THREE.SphereGeometry(.14*s,8,6),bc[i%4],x+Math.cos(a)*rad*.8,h,z+Math.sin(a)*rad*.8,.8)}blk(x,z,2*s)}
function present(x,z,c){var s=rnd(.5,.9);box(s,s,s,c,x,s/2,z,rnd(0,1));box(s+.02,s+.02,.12,0xffd84a,x,s/2,z);blk(x,z,s*.6)}
function snowman(x,z){mesh(new THREE.SphereGeometry(.8,12,10),0xffffff,x,.75,z);mesh(new THREE.SphereGeometry(.55,12,10),0xffffff,x,1.9,z);mesh(new THREE.SphereGeometry(.38,12,10),0xffffff,x,2.75,z);cone(.08,.5,0xff7a1a,x,2.75,z+.55,6).rotation.x=PI/2;cyl(.4,.4,.08,0x1a1a1a,x,3.1,z,12);cyl(.26,.26,.5,0x1a1a1a,x,3.35,z,12);blk(x,z,.9)}
function shelf(x,z,ry){box(3,2.6,.6,0x6b4a2a,x,1.3,z,ry);var bc=[0xc0392b,0x2e86c1,0x27ae60,0xf1c40f,0x8e44ad];for(var r=0;r<3;r++)for(var i=0;i<7;i++){var dx=-1.2+i*.4;box(.3,.6,.4,bc[(r*7+i)%5],x+dx*Math.cos(ry||0),.5+r*.8,z-dx*Math.sin(ry||0),ry)}blk(x,z,1.6)}
function fireplace(x,z,ry){box(3.4,2.6,1,0x8a3a2a,x,1.3,z,ry);box(1.8,1.3,.2,0x1a0d08,x+Math.sin(ry)*.45,.75,z+Math.cos(ry)*.45,ry);box(3.8,.25,1.3,0x5a3a22,x,2.7,z,ry);var fx=x+Math.sin(ry)*.3,fz=z+Math.cos(ry)*.3;var f1=cone(.45,.9,0xff7a1a,fx,.55,fz,6,0,1),f2=cone(.28,.6,0xffd84a,fx,.45,fz,6,0,1);var L=new THREE.PointLight(0xff9a4a,2.2,24,1.6);L.position.set(x+Math.sin(ry)*2,1.6,z+Math.cos(ry)*2);add(L);fires.push({f1:f1,f2:f2,L:L,b:2.2});[0xe23a3a,0x3b82f6,0x22c55e].forEach(function(c,i){box(.3,.5,.1,c,x+(-.9+i*.9)*Math.cos(ry),2.3,z-(-.9+i*.9)*Math.sin(ry)+Math.cos(ry)*.55,ry)});blk(x,z,1.9)}
function bed(x,z,ry,c){box(1.2,.5,2.4,0x6b4a2a,x,.25,z,ry);box(1.1,.2,2.2,c||0x3b82f6,x,.6,z,ry);box(.9,.2,.5,0xffffff,x-Math.sin(ry||0)*.8,.75,z-Math.cos(ry||0)*.8,ry);blk(x,z,1.3)}
function chair(x,z,ry){box(.7,.08,.7,0x8a6642,x,.6,z,ry);box(.7,.8,.08,0x8a6642,x-Math.sin(ry||0)*.32,1,z-Math.cos(ry||0)*.32,ry);blk(x,z,.45)}
function volcano(x,z){var v=cone(9,8,0x4a2c1e,x,4,z,9);cone(3,2.2,0xff5a1a,x,7.2,z,9,0,1);var L=new THREE.PointLight(0xff5a1a,2,30,1.5);L.position.set(x,9,z);add(L);fires.push({L:L,b:2})}
function boat(x,z,ry){var g=box(5,1.4,2,0x6b4a2a,x,.5,z,ry);g.rotation.z=.25;cyl(.12,.12,5,0x5a3a22,x,2.6,z,6).rotation.z=-.3;box(1.8,1.4,.05,0xeee6d6,x+.6,3,z,ry).rotation.z=-.3;blk(x,z,2.4)}
function totem(x,z){var cs=[0xc0392b,0x2e86c1,0xf1c40f,0x27ae60];for(var i=0;i<4;i++){box(1,1,1,cs[i],x,.5+i,z,i*.2);box(.2,.2,.05,0x111111,x-.2,.6+i,z+.52);box(.2,.2,.05,0x111111,x+.2,.6+i,z+.52)}box(2.6,.25,.4,0x8a6642,x,3.3,z);blk(x,z,.9)}
function rails(x0,z,x1){box(x1-x0,.08,.1,0x7a7a80,(x0+x1)/2,.05,z-.5);box(x1-x0,.08,.1,0x7a7a80,(x0+x1)/2,.05,z+.5);for(var x=x0;x<x1;x+=.9)box(.25,.06,1.4,0x5a3a22,x,.03,z)}
function cart(x,z){box(1.4,.8,1.1,0x5a5a62,x,.75,z);ico(.5,0x3a3a3a,x,1.2,z);blk(x,z,.9)}
function mill(x,z){cyl(1.6,2,6,0xd8cfc0,x,3,z,8);cone(2.2,1.8,0x8a3a2a,x,6.9,z,8);var g=new THREE.Group();g.position.set(x,5.6,z+2.1);for(var i=0;i<4;i++){var b=new THREE.Mesh(new THREE.BoxGeometry(.5,3.6,.08),mat(0xeee6d6));b.position.y=1.8;var h=new THREE.Group();h.rotation.z=i*PI/2;h.add(b);g.add(h)}add(g);spin.push({m:g,k:'rot'});blk(x,z,2.2)}
function bridge(q){var x=q.x,z=q.z;for(var i=-8;i<=8;i++)box(2.6,.12,.5,0x8a6642,x,.1,z+i*.95);[-1.4,1.4].forEach(function(o){box(.06,.06,17,0xc8b080,x+o,1.1,z);for(var k=-8;k<=8;k+=4)cyl(.08,.08,1.2,0x6b4a2a,x+o,.6,z+k,5)});
 [[-H,-2],[2,H]].forEach(function(a){var m=new THREE.Mesh(new THREE.PlaneGeometry(a[1]-a[0]-1.4,2*H-4),new THREE.MeshLambertMaterial({color:0x0c1a1e}));m.rotation.x=-PI/2;m.position.set(x+(a[0]+a[1])/2,.04,z);add(m);for(var k=0;k<5;k++)rock(x+(a[0]<0?-1.8:1.8),z-7+k*3.5,.45,0x6a6a70)})}
function zip(x,z){cyl(.16,.2,6,0x6b4a2a,x,3,z,6);cyl(.16,.2,3,0x6b4a2a,x+12,1.5,z,6);var l=box(12.2,.04,.04,0x222222,x+6,4.5,z);l.rotation.z=.25;blk(x,z,.4)}
function garland(q){var c=[0xff3a3a,0xffd84a,0x3bff6a,0x4aa0ff],k=0;for(var t=-H+.5;t<=H-.5;t+=1.4){[[q.x+t,q.z-H+.25],[q.x+t,q.z+H-.25],[q.x-H+.25,q.z+t],[q.x+H-.25,q.z+t]].forEach(function(p){if(Math.abs(t)<3.2)return;mesh(new THREE.SphereGeometry(.08,6,4),c[k++%4],p[0],2.9,p[1],1)})}}

/* ---------- décor par salle ---------- */
var DEC={
 'ete:tp':function(q){tent.apply(null,P(q,-6.5,-6.5).concat([0x2e5aa8,PI*.25]));tent.apply(null,P(q,6.5,-6.5).concat([0xc23a2a,-PI*.25]));logH.apply(null,P(q,-7,6));rock.apply(null,P(q,7.5,7,.7))},
 'ete:mat':function(q){flag(q.x,q.z-7,0xf5c542);for(var i=0;i<10;i++){var a=i/10*2*PI;rock(q.x+Math.cos(a)*1.4,q.z-7+Math.sin(a)*1.4,.3)}logH.apply(null,P(q,-6,6,0));logH.apply(null,P(q,6,6,0))},
 'ete:tr':function(q){tent.apply(null,P(q,-6.5,-6.5).concat([0x2a8a4a,PI*.25]));tent.apply(null,P(q,6.5,-6.5).concat([0xd87a1a,-PI*.25]));tent.apply(null,P(q,6.5,6.5).concat([0x7a4ab0,-PI*.75]))},
 'ete:tg':function(q){tower(q.x+6,q.z-6);rock.apply(null,P(q,-7,7,.8));logH.apply(null,P(q,-6,-7,.3))},
 'nd':function(q){[-1,1].forEach(function(s){cyl(.12,.12,3,0x6b4a2a,q.x+s*2-6,1.5,q.z-7,6)});box(4.2,.1,.1,0x6b4a2a,q.x-6,2.9,q.z-7);for(var i=0;i<4;i++)box(.05,1.2,.05,0xd8c080,q.x-7.4+i*.9,2.2,q.z-7);table(q.x+6,q.z-7,0);table(q.x+6,q.z+7,0)},
 'feu':function(q){fire(q.x,q.z,1);for(var i=0;i<4;i++){var a=i/4*2*PI+PI/4;logH(q.x+Math.cos(a)*5.5,q.z+Math.sin(a)*5.5,-a+PI/2)}},
 'ete:int':function(q){table(q.x-6,q.z-7,0);cyl(.5,.45,.7,0x3a3a3a,q.x-6.6,1.3,q.z-7,10);crate(q.x+7,q.z-7,1.2);crate(q.x+7.8,q.z-5.6,.9);crate(q.x+7,q.z+7,1)},
 'water':function(q){var c=pond(q);if(c){var b=box(3,.5,1,0xb0502a,c[0],.25,c[1]);b.rotation.y=.4}},
 'ete:for':function(q){[[-7,-7],[7,-7],[-7,7],[7,7],[-8,0],[0,-8]].forEach(function(o,i){if(Math.abs(o[0])<1||Math.abs(o[1])<1)return;var x=q.x+o[0],z=q.z+o[1];cyl(.3,.4,2,0x3a2a1a,x,1,z,6);cone(1.9,3.8,0x1d4a2a,x,3.6,z,7);cone(1.3,2.8,0x24553a,x,5.4,z,7);blk(x,z,.8)});for(var i=0;i<8;i++)mush(q.x+rnd(-9,9),q.z+rnd(-9,9))},
 'ins':function(q){var x=q.x-6,z=q.z-6;for(var i=0;i<3;i++){var a=i/3*2*PI,m=cyl(.12,.12,4,0x8a6642,x+Math.cos(a)*.8,1.9,z+Math.sin(a)*.8,6);m.rotation.set(Math.sin(a)*.25,0,-Math.cos(a)*.25)}blk(x,z,1.2);table(q.x+6,q.z+6,PI/2);logH(q.x+6,q.z-7,0);logH(q.x+6,q.z-6.3,0)},
 'ete:cl':function(q){[[-7,-7],[7,-7],[-7,7],[7,7]].forEach(function(o){lantern(q.x+o[0],q.z+o[1])});flowers(q,30,[0xfff4a0,0xffffff,0xb0e0ff])},
 'cave':function(q){for(var i=0;i<14;i++){var a=i/14*2*PI,r=H-1.3,x=q.x+Math.cos(a)*r,z=q.z+Math.sin(a)*r;if(Math.abs(x-q.x)<3.6||Math.abs(z-q.z)<3.6)continue;rock(x,z,rnd(1,1.6),0x45454d);blk(x,z,1)}crystal(q.x-6,q.z+6,0x7ad8ff);crystal(q.x+6,q.z-6,0xc08aff)},
 'ruin':function(q){pillar(q.x-7,q.z-7,4.5);pillar(q.x+7,q.z-7,2.2);pillar(q.x-7,q.z+7,3.2);var f=cyl(.55,.55,3.5,0xb8b09a,q.x+6.5,.55,q.z+6.5,8);f.rotation.z=PI/2;f.rotation.y=.6;blk(q.x+6.5,q.z+6.5,1.6);box(1.4,1,1.4,0xa8a08a,q.x-2,.5,q.z-8.5,.4)},
 'ete:pt':function(q){bridge(q)},'paq:pt':function(q){bridge(q)},
 'ete:cg':function(q){hut(q.x-6,q.z-6,0x6b4a2a,PI*.25);cyl(.15,.15,1.5,0x333333,q.x-5,4.4,q.z-6.5,6);crate(q.x+7,q.z+7)},
 /* Pâques */
 'paq:tp':function(q){tent(q.x-6.5,q.z-6.5,0xf4a6c6,PI*.25);tent(q.x+6.5,q.z-6.5,0x9ad0ff,-PI*.25);egg(q.x-7,q.z+6,0xff7aa8);egg(q.x-6.2,q.z+6.8,0x7ad0ff);egg(q.x+7,q.z+7,0xffe066)},
 'paq:ch':function(q){chapel(q.x,q.z-6.5,0);flowers(q,24,[0xffe066,0xffffff,0xff9ac0])},
 'paq:lp':function(q){for(var i=0;i<6;i++)bunny(q.x+rnd(-8,8),q.z+rnd(-8,8),rnd(0,6));flowers(q,20,[0xffe066,0xffffff])},
 'paq:vg':function(q){[[-7,-7],[7,-7],[-7,7],[7,7],[0,-8.5],[-8.5,0]].forEach(function(o){var x=q.x+o[0],z=q.z+o[1];cyl(.22,.3,2.2,0x6a4a30,x,1.1,z,6);ico(1.7,0xffd0e2,x,3,z);blk(x,z,.6)});flowers(q,18,[0xff9ac0,0xffffff])},
 'paq:pe':function(q){table(q.x-6,q.z-7,0,0xf0e0c0);table(q.x+6,q.z-7,0,0xf0e0c0);var cs=[0xff7aa8,0x7ad0ff,0xffe066,0x9aff8a,0xc89aff];for(var i=0;i<10;i++)egg(q.x+(i<5?-7:5)+(i%5)*.5,q.z-7+(i%2)*.4,cs[i%5]).position.y=1.2},
 'paq:jq':function(q){flowers(q,60,[0xffe066,0xfff4a0,0xffd030]);[[-7,-7],[7,7]].forEach(function(o){var x=q.x+o[0],z=q.z+o[1];cyl(.22,.3,2.2,0x6a4a30,x,1.1,z,6);ico(1.8,0x8ad46a,x,3,z);blk(x,z,.6)})},
 'paq:cr':function(q){var h=cone(6,3,0x78b850,q.x+5,1.5,q.z-5,9);blk(q.x+5,q.z-5,4.6);for(var i=0;i<5;i++)cone(.2,1.4,0x3a8a2a,q.x-7+i*.6,.7,q.z+7,4);flowers(q,16,[0xffffff,0xff9ac0])},
 'paq:tr':function(q){for(var i=0;i<4;i++){var x=q.x+(i%2?6:-6),z=q.z+(i<2?-6:6),m=mesh(new THREE.SphereGeometry(1.6,10,6,0,2*PI,0,PI/2),0x6a4a2a,x,0,z);mesh(new THREE.CircleGeometry(.6,10),0x1a0d06,x,.7,z+1.45);blk(x,z,1.6)}bunny(q.x+2,q.z+3,1);bunny(q.x-3,q.z-2,3)},
 'paq:ml':function(q){mill(q.x-6,q.z-6);crate(q.x+7,q.z+7);crate(q.x+7.6,q.z+5.8,.8)},
 'paq:cb':function(q){hut(q.x-6,q.z-6,0x8a6642,PI*.25);flowers(q,14,[0xffe066,0xff9ac0]);bunny(q.x+6,q.z+6,2)},
 /* Noël */
 'noel:pb':function(q){bed(q.x-8,q.z-6,0,0xd8a02a);bed(q.x-5.5,q.z-6,0,0x2a8a4a);bed(q.x+8,q.z-6,0,0xd8a02a);present(q.x+7,q.z+7,0xe23a3a)},
 'noel:sc':function(q){flag(q.x-6,q.z-8,0xe23a3a);flag(q.x+6,q.z-8,0x3b82f6);xtree(q.x+7,q.z+7,.6);chair(q.x-6,q.z+6,PI)},
 'noel:rc':function(q){bed(q.x-8,q.z-6,0,0x3b82f6);bed(q.x+8,q.z-6,0,0x8a5a2a);bed(q.x+5.5,q.z-6,0,0x3b82f6);present(q.x-7,q.z+7,0x22c55e)},
 'noel:bd':function(q){table(q.x,q.z-7.5,0);for(var i=0;i<6;i++)mesh(new THREE.CylinderGeometry(.25,.25,.05,12),[0xffd84a,0xc0c0c0,0xcd7f32][i%3],q.x-1+i*.4,1,q.z-7.5,.4);chair(q.x-6,q.z+6);chair(q.x+6,q.z+6)},
 'noel:feu':function(q){fireplace(q.x,q.z-H+.6,0);[[-4,1,PI],[4,1,PI],[0,4,PI]].forEach(function(o){var x=q.x+o[0],z=q.z+o[1];box(2.6,.7,1.1,0x7a1d22,x,.35,z,o[2]);box(2.6,.7,.3,0x7a1d22,x,.9,z+.45,o[2]);blk(x,z,1.3)})},
 'noel:cu':function(q){box(6,1,1.2,0xd8d0c0,q.x,.5,q.z-H+.7);box(1.4,1.1,1.2,0x3a3a3a,q.x+3.5,.55,q.z-H+.7);blk(q.x,q.z-H+.7,3.2);table(q.x-6,q.z+6,0);table(q.x+6,q.z+6,0)},
 'noel:cp':function(q){var x=q.x+6,z=q.z-6;box(3,.2,2,0x6b4a2a,x,2.2,z);cyl(.1,.1,2.2,0x6b4a2a,x-1.4,1.1,z-.9,5);cyl(.1,.1,2.2,0x6b4a2a,x+1.4,1.1,z-.9,5);box(1,.4,.6,0xd8c080,x,.2,z);mesh(new THREE.SphereGeometry(.3,8,6),0xf0e0c0,x,.55,z,.3);ico(.5,0xffffff,x-1.6,.5,z+1);ico(.5,0x6b4a2a,x+1.6,.5,z+1);blk(x,z,2);for(var i=0;i<6;i++)cyl(.08,.08,.5,0xfff4e0,q.x-7+i*.6,1.2,q.z-8,6,.6);box(4,1,.6,0x6b4a2a,q.x-5.5,.5,q.z-8);blk(q.x-5.5,q.z-8,2)},
 'noel:jx':function(q){table(q.x-6,q.z-6,0,0x2a6a3a);for(var i=0;i<4;i++)box(.2,.2,.2,[0xe23a3a,0xffd84a,0x3b82f6,0xffffff][i],q.x-6.8+i*.5,1.05,q.z-6);table(q.x+6,q.z+6,0,0x2a3a6a);ico(.5,0xe23a3a,q.x+6,.5,q.z-6)},
 'noel:bt':function(q){table(q.x-6,q.z-7,0);table(q.x+6,q.z-7,0);for(var i=0;i<4;i++)box(2,.15,.3,0xb08050,q.x+6,1.05+i*.15,q.z+7);crate(q.x-7,q.z+7)},
 'noel:sp':function(q){xtree(q.x,q.z,1.15);for(var i=0;i<8;i++){var a=i/8*2*PI;present(q.x+Math.cos(a)*3.4,q.z+Math.sin(a)*3.4,[0xe23a3a,0x22c55e,0x3b82f6,0xffd84a][i%4])}var L=new THREE.PointLight(0xffd8a0,1.4,18,1.6);L.position.set(q.x,4,q.z+3);add(L)},
 'noel:bi':function(q){shelf(q.x-6,q.z-H+.5,0);shelf(q.x+6,q.z-H+.5,0);chair(q.x-6,q.z+6);chair(q.x+6,q.z+6);table(q.x,q.z+7.5,0)},
 'noel:gn':function(q){for(var i=0;i<9;i++){var x=q.x+(i%3-1)*6.5,z=q.z+(i<3?-7:i<6?7:0);if(i>=6&&i!==6&&i!==8)continue;if(Math.abs(x-q.x)<3.4&&Math.abs(z-q.z)<3.4)continue;crate(x,z,rnd(.9,1.4))}},
 'noel:rm':function(q){tent(q.x-6.5,q.z-6.5,0x2a6a3a,PI/4);crate(q.x+7,q.z-7,1.3);crate(q.x+7,q.z-5.5,1);crate(q.x+7,q.z+7,1.2);box(3,.3,.3,0x8a6642,q.x-6,.15,q.z+7)},
 'noel:pn':function(q){table(q.x-6,q.z-7,0);table(q.x+6,q.z-7,0);for(var i=0;i<10;i++)present(q.x+rnd(-8,8),q.z+rnd(4,8.5),[0xe23a3a,0x22c55e,0x3b82f6,0xffd84a][i%4])},
 'noel:en':function(q){snowman(q.x+6,q.z+6);xtree(q.x-7,q.z+7,.55);xtree(q.x+7,q.z-7,.5);for(var i=0;i<10;i++)ico(rnd(.3,.6),0xffffff,q.x+rnd(-9,9),.1,q.z+rnd(-9,9))},
 /* Aventure */
 'av:cb':function(q){tent(q.x-6.5,q.z-6.5,0xd87a1a,PI/4);tent(q.x+6.5,q.z-6.5,0x2a8a4a,-PI/4);crate(q.x+7,q.z+7);box(1.4,.05,1,0xe8d8a8,q.x+7,1.02,q.z+7)},
 'av:tp':function(q){var x=q.x,z=q.z-7;for(var i=0;i<4;i++)box(8-i*1.8,1,3.4-i*.5,0x9a9078,x,.5+i,z);bRects.push([x-4,x+4,z-1.7,z+1.7]);pillar(q.x-7,q.z+6,3.5);pillar(q.x+7,q.z+6,2.4);ico(.6,0x2ad88a,x,4.6,z,.7)},
 'av:vo':function(q){volcano(q.x+H+6,q.z-H-6);for(var i=0;i<6;i++)rock(q.x+rnd(-9,9),q.z+rnd(-9,9),rnd(.4,.8),0x3a2a22);mesh(new THREE.PlaneGeometry(2,8),0xff5a1a,q.x+7,.05,q.z,1).rotation.x=-PI/2;bRects.push([q.x+6,q.x+8,q.z-4,q.z+4])},
 'av:ps':function(q){bridge(q)},
 'av:jg':function(q){[[-7,-7],[7,-7],[-7,7],[7,7]].forEach(function(o){var x=q.x+o[0],z=q.z+o[1];cyl(.2,.3,5,0x7a5a38,x,2.5,z,6);cone(2.6,1.2,0x2f7a34,x,5,z,7);blk(x,z,.5)});for(var i=0;i<10;i++){var x=q.x+rnd(-9,9),z=q.z+rnd(-9,9);if(Math.abs(x-q.x)<3.5||Math.abs(z-q.z)<3.5)continue;ico(rnd(.6,1),0x3d8c3a,x,.4,z)}},
 'av:ty':function(q){zip(q.x-9,q.z-6);rock(q.x+7,q.z+7,.8);crate(q.x-7,q.z+7)},
 'av:ct':function(q){table(q.x,q.z-7.5,0);box(2.2,.02,1,0xe8d8a8,q.x,.97,q.z-7.5);lantern(q.x-7,q.z+7,0xffb040);lantern(q.x+7,q.z+7,0xffb040);crate(q.x+7,q.z-7)},
 'av:cy':function(q){for(var i=0;i<4;i++){var x=q.x+(i%2?7.5:-7.5),z=q.z+(i<2?-7.5:7.5);box(3.2,rnd(3,6),3.2,0xb8865a,x,1.5,z,rnd(0,1));blk(x,z,2.2)}for(var k=0;k<3;k++)cone(.2,rnd(1,2),0x4a8a3a,q.x+rnd(-8,8),.6,q.z+rnd(-8,8),5)},
 'av:oa':function(q){var c=pond(q,0x2ab0c0);[[-7,-7],[-7,7]].forEach(function(o){var x=q.x+o[0],z=q.z+o[1];cyl(.2,.3,5,0x7a5a38,x,2.5,z,6);cone(2.6,1.2,0x3d8c3a,x,5,z,7);blk(x,z,.5)})},
 'av:mi':function(q){rails(q.x-H,q.z+6,q.x+H);cart(q.x+4,q.z+6);box(4,3.4,.6,0x5a3a22,q.x,1.7,q.z-H+.3);box(2.6,2.6,.2,0x0a0806,q.x,1.3,q.z-H+.65);blk(q.x,q.z-H+.4,2.2);crate(q.x-7,q.z-7)},
 'av:ep':function(q){boat(q.x+5,q.z-6,.4);crate(q.x-7,q.z+7);rock(q.x-7,q.z-7,.7);mesh(new THREE.TorusGeometry(.6,.12,6,12),0x7a7a80,q.x+7,.15,q.z+7).rotation.x=-PI/2},
 'av:to':function(q){totem(q.x,q.z-7);fire(q.x+6.5,q.z+6.5);logH(q.x+4,q.z+6.5,PI/2)}
};


/* --- remplacements pour la version en ligne --- */
rnd=function(a,b){return a+rand01()*(b-a)};
add=function(m){scene.add(m);if(CAP)CAP.push(m);return m};
blk=function(x,z,r,force){(CB||blocks).push([x,z,r,force?1:0])};
var _fire=fire;fire=function(x,z,big){var n=(CB||blocks).length;_fire(x,z,big);var L=CB||blocks;for(var i=n;i<L.length;i++)L[i][3]=1};
bridge=function(q){var x=q.x,z=q.z;for(var i=-8;i<=8;i++)box(2.6,.12,.5,0x8a6642,x,.1,z+i*.95);[-1.4,1.4].forEach(function(o){box(.06,.06,17,0xc8b080,x+o,1.1,z);for(var k=-8;k<=8;k+=4)cyl(.08,.08,1.2,0x6b4a2a,x+o,.6,z+k,5)})};
DEC.water=function(q){var b=box(3,.5,1,0xb0502a,q.x+3,.12,q.z-2);b.rotation.y=.4};
DEC['av:oa']=function(q){[[-7,-7],[-7,7]].forEach(function(o){var x=q.x+o[0],z=q.z+o[1];cyl(.2,.3,5,0x7a5a38,x,2.5,z,6);cone(2.6,1.2,0x3d8c3a,x,5,z,7);blk(x,z,.5)})};
DEC['av:vo']=function(q){volcano(q.x+H+4,q.z-H-4);for(var i=0;i<6;i++)rock(q.x+rnd(-9,9),q.z+rnd(-9,9),rnd(.4,.8),0x3a2a22)};
DEC['ete:pt']=DEC['paq:pt']=DEC['av:ps']=function(q){bridge(q);for(var k=0;k<4;k++){rock(q.x-6,q.z-6+k*4,.45,0x6a6a70);rock(q.x+6,q.z-6+k*4,.45,0x6a6a70)}};

function kindOf(q){return q.water?'water':q.id==='feu'?'feu':q.cave?'cave':q.ruin?'ruin':q.glow?'glow':q.lava?'lava':q.snow?'snow':q.sand?'sand':'def'}
function blobPts(q,sc){var p=[];for(var i=0;i<48;i++){var th=i/48*2*PI,r=(1+0.08*Math.sin(3*th+q.p1)+0.05*Math.sin(5*th+q.p2)+0.03*Math.sin(7*th+q.p1*2)-0.05)*sc;p.push([(q.cx+Math.cos(th)*q.rx*r)*U,(q.cy+Math.sin(th)*q.ry*r)*U])}return p}
function flat(pts,col,y,phong,em){var sh=new THREE.Shape();pts.forEach(function(p,i){i?sh.lineTo(p[0],-p[1]):sh.moveTo(p[0],-p[1])});var g=new THREE.ShapeGeometry(sh);var m=new THREE.Mesh(g,phong?new THREE.MeshPhongMaterial({color:col,shininess:phong,specular:0x88ccff,emissive:em||0,flatShading:true}):new THREE.MeshPhongMaterial({color:col,shininess:0,emissive:em||0,flatShading:true}));m.rotation.x=-PI/2;m.position.y=y;return add(m)}
function ribbon(list,col,y,wk){var pos=[],idx=[],o=0;list.forEach(function(r){var P=r.p,hw=r.hw*U*wk;for(var i=0;i<P.length;i++){var a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)],tx=b[0]-a[0],ty=b[1]-a[1],l=Math.hypot(tx,ty)||1,nx=-ty/l,ny=tx/l,x=P[i][0]*U,z=P[i][1]*U;pos.push(x+nx*hw,y,z+ny*hw,x-nx*hw,y,z-ny*hw);if(i){var k=o+(i-1)*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}}o+=P.length*2});
 var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();var m=new THREE.Mesh(g,new THREE.MeshPhongMaterial({color:col,shininess:0,side:THREE.DoubleSide}));return add(m)}
function segDist(x,z,W){var m=1e9;W.cor.forEach(function(r){for(var j=0;j<r.p.length-1;j++){var a=r.p[j],b=r.p[j+1],ax=a[0]*U,az=a[1]*U,dx=b[0]*U-ax,dz=b[1]*U-az,t=((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1);t=t<0?0:t>1?1:t;var d=Math.hypot(ax+dx*t-x,az+dz*t-z)-r.hw*U;if(d<m)m=d}});return m}

function build(W,map){
 M=map;T=TH[map]||TH.ete;srand(7+map.length*131+Math.round(W.w));
 scene=new THREE.Scene();scene.background=new THREE.Color(T.sky);scene.fog=new THREE.Fog(T.sky,10,40);
 add(new THREE.HemisphereLight(T.hemi[0],T.hemi[1],T.hemi[2]));var d=new THREE.DirectionalLight(T.sun[0],T.sun[1]);d.position.set(-40,80,-20);add(d);
 blocks=[];bRects=[];walls=[];fires=[];spin=[];RM=[];STM=[];CH={};CAP=null;CB=null;
 var g=new THREE.Mesh(new THREE.PlaneGeometry(W.w*U+160,W.h*U+160),new THREE.MeshPhongMaterial({color:T.ground,shininess:0}));g.rotation.x=-PI/2;g.position.set(W.w*U/2,0,W.h*U/2);add(g);
 /* sentiers */
 ribbon(W.cor,T.pathE,.025,1.12);ribbon(W.cor,T.path,.035,.92);
 /* lieux */
 W.z.forEach(function(q){var k=kindOf(q),c=T.indoor?(k==='snow'?T.z.snow:k==='feu'?T.z.feu:T.z.def):(T.z[k]||T.z.def),cx=q.cx*U,cz=q.cy*U,rx=q.rx*U,rz=q.ry*U;
  if(q.rect){var f=new THREE.Mesh(new THREE.PlaneGeometry(rx*2,rz*2,6,6),new THREE.MeshPhongMaterial({color:c,shininess:0}));f.rotation.x=-PI/2;f.position.set(cx,.045,cz);add(f);
   if(k!=='snow')for(var i=-rz+1;i<rz;i+=1.6)box(rx*2-.2,.005,.05,0x6b4428,cx,.05,cz+i)}
  else{var sh0=flat(blobPts(q,1.06),0x000000,.04);sh0.material.transparent=true;sh0.material.opacity=.28;sh0.material.depthWrite=false;flat(blobPts(q,1),c,.045);
   if(q.water)flat(blobPts(q,.62),map==='av'?0x1f9a88:0x2a6aa0,.06,80,0x0a2a40).material.transparent=false;
   if(q.lava){flat(blobPts(q,.45),0xc8380a,.06,0,0x6a1800);var L=new THREE.PointLight(0xff6a1a,1.6,22,1.6);L.position.set(cx,2,cz);add(L);fires.push({L:L,b:1.6})}
   if(q.id==='feu'){var cc=new THREE.Mesh(new THREE.CircleGeometry(Math.min(rx,rz)*.75,28),new THREE.MeshPhongMaterial({color:0x4a3a24,shininess:0}));cc.rotation.x=-PI/2;cc.position.set(cx,.05,cz);add(cc)}}
  /* décor : construit autour de (0,0) puis replacé dans la forme du lieu */
  var a=rx*.74/H,b=rz*.74/H,o={id:q.id,k:k,x:0,z:0,e:q.e,n:q.n};CAP=[];CB=[];bRects=[];
  var fn=DEC[map+':'+q.id]||DEC[q.id]||DEC[k];try{if(fn)fn(o);else{rock(-7,-7,.8);crate(7,7)}}catch(e){}
  bRects.forEach(function(r){CB.push([(r[0]+r[1])/2,(r[2]+r[3])/2,Math.min(r[1]-r[0],r[3]-r[2])/2,0])});
  CAP.forEach(function(m){m.position.x=cx+m.position.x*a;m.position.z=cz+m.position.z*b});
  CB.forEach(function(B){var x=cx+B[0]*a,z=cz+B[1]*b,ok=true;if(!B[3]){if(segDist(x,z,W)<B[2]+.6)ok=false;W.st.forEach(function(t){if(Math.hypot(t.x*U-x,t.y*U-z)<B[2]+1.6)ok=false})}if(ok)blocks.push([x,z,B[2]])});
  CAP=null;CB=null;
  var lb=label(q.e+' '+q.n,1.0,'rgba(8,14,26,.55)');lb.position.set(cx,T.indoor?4.3:6.2,cz);add(lb);RM.push({q:q,lb:lb})});
 /* murs du local (Noël) */
 if(T.indoor)indoorWalls(W);
 else trees(W);
 /* postes de tâche */
 var ringG=new THREE.RingGeometry(.75,1.0,28),colG=new THREE.CylinderGeometry(.9,.9,3,20,1,true),padG=new THREE.CylinderGeometry(.55,.65,.18,16);
 W.st.forEach(function(t){var x=t.x*U,z=t.y*U,pad=new THREE.Mesh(padG,mat(0x5a5f6a));pad.position.set(x,.09,z);add(pad);var ic=label(t.e,.7);ic.position.set(x,1.1,z);add(ic);
  var ring=new THREE.Mesh(ringG,new THREE.MeshBasicMaterial({color:0xf5c542,transparent:true,opacity:.95,side:THREE.DoubleSide}));ring.rotation.x=-PI/2;ring.position.set(x,.2,z);add(ring);
  var col=new THREE.Mesh(colG,new THREE.MeshBasicMaterial({color:0xf5c542,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));col.position.set(x,1.5,z);add(col);
  var ex=label('!',.8,'#f5c542','#10203a');ex.position.set(x,2.3,z);add(ex);var nm=label('★ '+t.t,.42,'rgba(8,14,26,.6)','#f5c542');nm.position.set(x,2.95,z);add(nm);
  STM.push({ring:ring,col:col,ex:ex,nm:nm,ic:ic})});
 /* particules */
 var ps=[];for(var i=0;i<T.part.n;i++)ps.push(rnd(-6,W.w*U+6),rnd(.3,T.part.m==='fall'?12:5),rnd(-6,W.h*U+6));var pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));parts=new THREE.Points(pg,new THREE.PointsMaterial({color:T.part.c,size:T.part.s,transparent:true,opacity:.9,depthWrite:false,blending:map==='paq'?THREE.NormalBlending:THREE.AdditiveBlending}));add(parts);
 lamp=T.headlamp?add(new THREE.PointLight(0xfff0d0,1.1,13,1.4)):null;
 arrow=new THREE.Mesh(new THREE.ConeGeometry(.32,.9,3),new THREE.MeshBasicMaterial({color:0xf5c542}));arrow.rotation.order='YXZ';add(arrow);
 ringMe=new THREE.Mesh(new THREE.RingGeometry(.55,.7,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5}));ringMe.rotation.x=-PI/2;add(ringMe);
 first=true}

function trees(W){var pts=W.tr.map(function(t){return [t.x*U,t.y*U,.75+t.s*.55]}),tc=T.tc;
 if(T.tree==='pine'){
  inst(new THREE.CylinderGeometry(.22,.32,1.6,5),pts,function(o,p,c){o.position.set(p[0],.8*p[2],p[1]);o.scale.set(p[2],p[2],p[2]);c.setHex(0x3a2a1a)});
  inst(new THREE.ConeGeometry(1.7,3.4,7),pts,function(o,p,c){o.position.set(p[0],2.9*p[2],p[1]);o.rotation.y=p[0];o.scale.set(p[2],p[2],p[2]);c.setHex(tc[(Math.abs(p[0]*7+p[1]*3)|0)%tc.length])});
  inst(new THREE.ConeGeometry(1.2,2.6,7),pts,function(o,p,c){o.position.set(p[0],4.5*p[2],p[1]);o.scale.set(p[2],p[2],p[2]);c.setHex(tc[(Math.abs(p[0]*3+p[1]*5)|0)%tc.length])});
 }else if(T.tree==='blossom'){
  inst(new THREE.CylinderGeometry(.2,.3,2.4,5),pts,function(o,p,c){o.position.set(p[0],1.2*p[2],p[1]);o.scale.set(p[2],p[2],p[2]);c.setHex(0x6a4a30)});
  inst(new THREE.IcosahedronGeometry(1.8,0),pts,function(o,p,c){o.position.set(p[0],3.1*p[2],p[1]);o.rotation.set(p[0],p[1],0);o.scale.set(p[2],p[2]*.9,p[2]);c.setHex(tc[(Math.abs(p[0]*7+p[1]*3)|0)%tc.length])});
 }else{
  inst(new THREE.CylinderGeometry(.16,.28,5,6),pts,function(o,p,c){o.position.set(p[0],2.5*p[2],p[1]);o.rotation.set(Math.sin(p[0])*.12,0,Math.cos(p[1])*.12);o.scale.set(p[2],p[2],p[2]);c.setHex(0x7a5a38)});
  inst(new THREE.ConeGeometry(2.8,1.3,7),pts,function(o,p,c){o.position.set(p[0]+Math.cos(p[1])*.6*p[2],5*p[2],p[1]-Math.sin(p[0])*.6*p[2]);o.rotation.y=p[1];o.scale.set(p[2],p[2],p[2]);c.setHex(tc[(Math.abs(p[0]*7+p[1]*3)|0)%tc.length])});
 }
 /* buissons en bordure des sentiers et lieux, herbe dans les lieux */
 var bu=[];W.tr.forEach(function(t,i){if(i%2)return;bu.push([t.x*U+rnd(-1.2,1.2),t.y*U+rnd(-1.2,1.2),rnd(.5,1.1)])});
 inst(new THREE.IcosahedronGeometry(.9,0),bu,function(o,p,c){o.position.set(p[0],.45*p[2],p[1]);o.rotation.set(p[0],p[1],0);o.scale.set(p[2]*1.2,p[2],p[2]*1.2);c.setHex(T.bc[(Math.abs(p[0]*13+p[1]*7)|0)%T.bc.length])});
 var gt=W.gt.map(function(g){return [g.x*U,g.y*U,.6+(g.c%3)*.2]});
 inst(new THREE.ConeGeometry(.12,.55,3),gt,function(o,p,c){o.position.set(p[0],.25*p[2],p[1]);o.rotation.set(Math.sin(p[0])*.3,p[1],Math.cos(p[1])*.3);o.scale.set(p[2],p[2],p[2]);c.setHex(T.gc)})}

function indoorWalls(W){var wm=new THREE.MeshLambertMaterial({color:T.wall}),bm=new THREE.MeshLambertMaterial({color:0x5a2a1a}),WH=3.2;
 function wall(x0,z0,x1,z1){var L=Math.hypot(x1-x0,z1-z0);if(L<.05)return;var m=new THREE.Mesh(new THREE.BoxGeometry(L,WH,.3),wm);m.position.set((x0+x1)/2,WH/2,(z0+z1)/2);m.rotation.y=-Math.atan2(z1-z0,x1-x0);add(m);walls.push(m);var b=new THREE.Mesh(new THREE.BoxGeometry(L,.35,.34),bm);b.position.set(m.position.x,.18,m.position.z);b.rotation.y=m.rotation.y;add(b)}
 function roomNear(px,py){var best=null,bd=1e9;W.z.forEach(function(q){var d=Math.hypot(q.cx-px,q.cy-py);if(d<bd){bd=d;best=q}});return best}
 var doors=new Map();function dr(q,s,hw){var k=q.id+s;doors.set(k,hw)}
 W.cor.forEach(function(r){var A=r.p[0],B=r.p[r.p.length-1],a=roomNear(A[0],A[1]),b=roomNear(B[0],B[1]),hw=r.hw*U;if(!a||!b)return;var hz=Math.abs(b.cx-a.cx)>Math.abs(b.cy-a.cy);
  if(hz){var L=b.cx>a.cx?a:b,R=L===a?b:a;dr(L,'e',hw);dr(R,'w',hw);var z=L.cy*U;wall((L.cx+L.rx)*U,z-hw,(R.cx-R.rx)*U,z-hw);wall((L.cx+L.rx)*U,z+hw,(R.cx-R.rx)*U,z+hw)}
  else{var Tq=b.cy>a.cy?a:b,Bq=Tq===a?b:a;dr(Tq,'s',hw);dr(Bq,'n',hw);var x=Tq.cx*U;wall(x-hw,(Tq.cy+Tq.ry)*U,x-hw,(Bq.cy-Bq.ry)*U);wall(x+hw,(Tq.cy+Tq.ry)*U,x+hw,(Bq.cy-Bq.ry)*U)}});
 W.z.forEach(function(q){var x0=(q.cx-q.rx)*U,x1=(q.cx+q.rx)*U,z0=(q.cy-q.ry)*U,z1=(q.cy+q.ry)*U,cx=q.cx*U,cz=q.cy*U;
  [['n',x0,z0,x1,z0],['s',x0,z1,x1,z1],['w',x0,z0,x0,z1],['e',x1,z0,x1,z1]].forEach(function(s){var hw=doors.get(q.id+s[0]);if(!hw){wall(s[1],s[2],s[3],s[4]);return}if(s[1]===s[3]){wall(s[1],s[2],s[1],cz-hw);wall(s[1],cz+hw,s[1],s[4])}else{wall(s[1],s[2],cx-hw,s[2]);wall(cx+hw,s[2],s[3],s[2])}});
  var gc=[0xff3a3a,0xffd84a,0x3bff6a,0x4aa0ff],k=0;for(var t=x0+.6;t<x1;t+=1.4){if(Math.abs(t-cx)<3.4)continue;mesh(new THREE.SphereGeometry(.08,6,4),gc[k++%4],t,2.9,z0+.25,1);mesh(new THREE.SphereGeometry(.08,6,4),gc[k++%4],t,2.9,z1-.25,1)}})}

/* ---- personnages ---- */
function getCh(p){var c=CH[p.id];if(c&&(c.userData.key!==p.col+'|'+p.name+'|'+(p.ice?1:0))){scene.remove(c);c=null}
 if(!c){c=scout(p.col,(p.ice?'🧊 ':'')+p.name);c.userData.key=p.col+'|'+p.name+'|'+(p.ice?1:0);if(p.me)c.userData.lb.visible=false;if(p.ice)freeze(c);c.position.set(p.x*U,0,p.y*U);c.userData.px=c.position.x;c.userData.pz=c.position.z;scene.add(c);CH[p.id]=c}return c}
function turn(o,a,k){var d=a-o.rotation.y;while(d>PI)d-=2*PI;while(d<-PI)d+=2*PI;o.rotation.y+=d*Math.min(1,k)}
function animWalk(ch,mv,dt){var u=ch.userData;if(u.fz)return;u.ph+=dt*(mv?11:0);var s=mv?Math.sin(u.ph)*.7:0,k=Math.min(1,dt*10);u.lL.rotation.x+=(s-u.lL.rotation.x)*k;u.lR.rotation.x+=(-s-u.lR.rotation.x)*k;u.aL.rotation.x+=(-s*.8-u.aL.rotation.x)*k;u.aR.rotation.x+=(s*.8-u.aR.rotation.x)*k;ch.position.y=mv?Math.abs(Math.sin(u.ph))*.06:0}

/* ---- danses ---- */
function resetPose(c,k){var u=c.userData;[u.aL,u.aR,u.lL,u.lR].forEach(function(l){l.rotation.z+=(0-l.rotation.z)*k});c.rotation.z+=(0-c.rotation.z)*k}
function danceAnim(c,d,s){var u=c.userData,L=u.lL,R=u.lR,A=u.aL,B=u.aR,b=s*2*PI*(d===1?1.87:2),y=0,ey=0;c.rotation.z=0;
 if(d===1){var k=Math.max(0,Math.sin(b));R.rotation.x=-1.05*k;L.rotation.x=.15*k;y=Math.abs(Math.sin(b))*.12;A.rotation.x=B.rotation.x=0;A.rotation.z=-1.25+Math.sin(b*2)*.12;B.rotation.z=1.25-Math.sin(b*2)*.12;ey=Math.sin(b/2)*.3}
 else if(d===2){var up=Math.sin(b)>0;B.rotation.z=up?2.6:.45;B.rotation.x=up?0:-.7;A.rotation.z=-.55;A.rotation.x=-.25;c.rotation.z=Math.sin(b)*.12;L.rotation.x=Math.sin(b)*.35;R.rotation.x=-Math.sin(b)*.35;y=Math.abs(Math.sin(b))*.05}
 else if(d===3){var q=Math.floor(s*4)%4;A.rotation.x=-1.57+(q%2?.55:0);B.rotation.x=-1.57+(q%2?0:.55);A.rotation.z=B.rotation.z=0;ey=[0,.5,0,-.5][q];L.rotation.x=q===1?-.55:0;R.rotation.x=q===3?-.55:0}
 else{ey=s*9;A.rotation.z=-1.5;B.rotation.z=1.5;A.rotation.x=B.rotation.x=0;y=Math.abs(Math.sin(s*6))*.25;L.rotation.x=R.rotation.x=0}
 c.position.y=y;c.rotation.y=(u.face||0)+ey}
var AC=null;function ac(){try{if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C()}if(AC.state==='suspended')AC.resume()}catch(e){return null}return AC}
document.addEventListener('pointerdown',function(){ac()},{passive:true});
function sfx(d,vol){var a=ac();if(!a||vol<=.02)return function(){};var out=a.createGain(),t0=a.currentTime+.03,end=t0+4,V=Math.min(1,vol)*.55;out.connect(a.destination);out.gain.setValueAtTime(.0001,t0);out.gain.exponentialRampToValueAtTime(V,t0+.05);out.gain.setValueAtTime(V,end-.35);out.gain.exponentialRampToValueAtTime(.0001,end);
 var lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1700;lp.connect(out);
 function tone(f,t,dur,type,g,f2,dst){var o=a.createOscillator(),gn=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(g||.5,t+.012);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn);gn.connect(dst||out);o.start(t);o.stop(t+dur+.05)}
 var nb=a.createBuffer(1,a.sampleRate*.4|0,a.sampleRate),nd=nb.getChannelData(0);for(var i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
 function noise(t,dur,g,hp){var s=a.createBufferSource();s.buffer=nb;var f=a.createBiquadFilter();f.type='highpass';f.frequency.value=hp||6000;var gn=a.createGain();gn.gain.setValueAtTime(g||.3,t);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(gn);gn.connect(out);s.start(t);s.stop(t+dur+.02)}
 function kick(t,g){tone(150,t,.28,'sine',g||.9,42)}
 var bt,t,i2;
 if(d===1){/* Dabké : darbouka doum-tak + mélodie */bt=60/112;var mel=[440,466,440,392,440,392,349,392,349,330,349,392,440,392,440,440];
  for(i2=0;(t=t0+i2*bt/2)<end-.15;i2++){var st=i2%8;if(st===0||st===3||st===4)tone(105,t,.32,'sine',.95,62);if(st===2||st===6)noise(t,.09,.4,2500),tone(820,t,.05,'triangle',.18);if(st===5||st===7)noise(t,.05,.18,4000);tone(mel[i2%16],t,bt/2*.9,'sawtooth',.13,0,lp)}}
 else if(d===2){/* Disco */bt=.5;var bass=[110,220,110,220,98,196,98,196];
  for(i2=0;(t=t0+i2*bt/2)<end-.15;i2++){if(i2%2===0)kick(t);else{noise(t,.05,.22,8000);[440,554,659].forEach(function(f){tone(f,t,.14,'triangle',.08)})}if(i2%4===2)noise(t,.14,.32,1500);tone(bass[i2%8],t,bt/2*.85,'sawtooth',.22,0,lp)}}
 else if(d===3){/* Robot */bt=.4;var ar=[523,659,784,1047,784,659,523,392];
  for(i2=0;(t=t0+i2*bt/4)<end-.15;i2++){if(i2%4===0)kick(t,.7);if(i2%8===4)noise(t,.06,.25,3000);tone(ar[i2%8]*(Math.floor(i2/16)%2?1.5:1),t,.07,'square',.09)}tone(900,t0+1.6,.4,'square',.12,200);tone(900,t0+3.2,.4,'square',.12,200)}
 else{/* Toupie */tone(180,t0,.4,'triangle',.4,520);for(var w=0;w<3;w++)tone(380,t0+.35+w*1.2,1.05,'sine',.28,1500);
  for(i2=0;(t=t0+i2*.125)<end-.15;i2++){noise(t,.05,i2%2?.1:.18,7000);if(i2%4===0)tone(120,t,.2,'sine',.6,60)}noise(end-.5,.45,.35,5000)}
 return function(){try{var n=a.currentTime;out.gain.cancelScheduledValues(n);out.gain.setValueAtTime(Math.max(.0001,out.gain.value),n);out.gain.exponentialRampToValueAtTime(.0001,n+.15);setTimeout(function(){try{out.disconnect()}catch(e){}},300)}catch(e){}}}

/* ---- API ---- */
var Z3={ok:false,yaw:0,sfx:sfx,
 canvas:function(){if(!renderer){try{renderer=new THREE.WebGLRenderer({antialias:(window.devicePixelRatio||1)<2,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));camera=new THREE.PerspectiveCamera(62,1,.1,300);bindLook(renderer.domElement);Z3.ok=true}catch(e){Z3.ok=false;return null}}return renderer.domElement},
 reset:function(){KEY='';first=true},
 /* bloque l'entrée dans un objet du décor (tentes, rochers…), coordonnées du jeu en pixels */
 block:function(ox,oy,nx,ny){var x=nx*U,z=ny*U,X=ox*U,Z=oy*U,r=.42;for(var i=0;i<blocks.length;i++){var b=blocks[i],d=Math.hypot(x-b[0],z-b[1]);if(d<b[2]+r&&d<Math.hypot(X-b[0],Z-b[1]))return true}return false},
 frame:function(o){if(!renderer)return;var el=renderer.domElement,w=el.clientWidth||innerWidth,h=el.clientHeight||innerHeight;
  if(o.key!==KEY){KEY=o.key;build(o.W,o.map)}
  var sz=renderer.getSize(new THREE.Vector2());if(sz.x!==w||sz.y!==h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?72:62;camera.updateProjectionMatrix()}
  var dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  /* joueurs */
  var seen={};o.players.forEach(function(p){var c=getCh(p);seen[p.id]=1;var u=c.userData,x=p.x*U,z=p.y*U,dx=x-u.px,dz=z-u.pz,mv=Math.hypot(dx,dz)>dt*.8;
   c.position.x=x;c.position.z=z;if(p.dance&&!mv&&!p.ice){danceAnim(c,p.dance.d,p.dance.s)}else{c.rotation.y=u.face||0;if(mv&&!p.ice)turn(c,Math.atan2(dx,dz),dt*12);u.face=c.rotation.y;resetPose(c,Math.min(1,dt*10));animWalk(c,mv,dt)}u.px=x;u.pz=z});
  Object.keys(CH).forEach(function(k){if(!seen[k]){scene.remove(CH[k]);delete CH[k]}});
  var mx=o.me.x*U,mz=o.me.y*U,meC=CH.me;
  /* premier cadre : caméra derrière le joueur, tournée vers le feu */
  if(first){var fz=o.W.z.filter(function(q){return q.id==='feu'})[0];if(fz){yaw=Math.atan2(mx-fz.cx*U,mz-fz.cy*U)}first=false;camPos.set(mx+Math.sin(yaw)*6,4,mz+Math.cos(yaw)*6);camLook.set(mx,1.7,mz)}
  Z3.yaw=yaw;
  /* brouillard = ce que tu vois autour de toi */
  var fr=o.fog?o.fog*U:0;scene.fog.near=fr?fr*.42:30;scene.fog.far=fr?fr*1.08:95;
  /* caméra épaule */
  var pt=o.me.show?pitch:Math.max(pitch,.8),port=w<h,dist=o.me.show?(port?7.2:5.8):(port?11:9),rx=Math.cos(yaw),rz=-Math.sin(yaw),cp=Math.cos(pt);
  var tgt=new THREE.Vector3(mx+(o.me.show?rx*.75:0),1.75,mz+(o.me.show?rz*.75:0)),want=new THREE.Vector3(tgt.x+Math.sin(yaw)*cp*dist,tgt.y+Math.sin(pt)*dist,tgt.z+Math.cos(yaw)*cp*dist);
  if(walls.length&&o.me.show){var dir=want.clone().sub(tgt),L=dir.length();dir.normalize();ray.set(tgt,dir);ray.far=L;var hit=ray.intersectObjects(walls,false);if(hit.length)want=tgt.clone().add(dir.multiplyScalar(Math.max(.8,hit[0].distance-.35)))}
  camPos.lerp(want,Math.min(1,dt*14));camera.position.copy(camPos);camLook.lerp(tgt,Math.min(1,dt*18));camera.lookAt(camLook);
  if(lamp)lamp.position.set(mx,2.6,mz);
  ringMe.visible=!!o.me.show;ringMe.position.set(mx,.07,mz);
  /* tâches */
  STM.forEach(function(s,i){var on=!!o.st[i];s.ring.visible=s.col.visible=s.ex.visible=s.nm.visible=on;if(on){s.ex.position.y=2.3+Math.sin(t*3)*.15;s.ring.material.opacity=.6+Math.sin(t*4)*.35}});
  /* flèche vers ta tâche la plus proche */
  var best=null,bd=1e9;if(o.arrow)o.W.st.forEach(function(s,i){if(!o.st[i])return;var d=Math.hypot(s.x*U-mx,s.y*U-mz);if(d<bd){bd=d;best=s}});
  arrow.visible=!!best&&bd>3.5;if(arrow.visible){var an=Math.atan2(best.x*U-mx,best.y*U-mz);arrow.position.set(mx+Math.sin(an)*1.6,.35+Math.sin(t*4)*.06,mz+Math.cos(an)*1.6);arrow.rotation.set(PI/2,an,0,'YXZ')}
  /* nom du lieu caché quand tu es dedans */
  RM.forEach(function(r){var q=r.q,dx=(o.me.x-q.cx)/q.rx,dy=(o.me.y-q.cy)/q.ry;r.lb.visible=dx*dx+dy*dy>1});
  /* effets */
  fires.forEach(function(f){var k=1+Math.sin(t*13+f.b)*.08+Math.sin(t*7.3)*.06;if(f.f1){f.f1.scale.set(k,k*1.1,k);f.f2.scale.set(1/k,k*1.2,1/k)}f.L.intensity=f.b*(.85+Math.random()*.25)});
  spin.forEach(function(s){if(s.k==='bob')s.m.position.y=s.y+Math.sin(t*2+s.a)*.08;else if(s.k==='spin'){s.m.rotation.y=t;s.m.rotation.x=t*.6}else if(s.k==='rot')s.m.rotation.z=t*.6;else if(s.k==='pulse')s.m.material.emissiveIntensity=.5+Math.sin(t*2+s.a)*.25;else if(s.k==='hop'){var hh=Math.max(0,Math.sin(t*3+s.a));s.m.position.y=hh*hh*.35}});
  var pa=parts.geometry.attributes.position;for(var i=0;i<pa.count;i++){var y=pa.getY(i);if(T.part.m==='fall'){y-=dt*.8;if(y<0)y=12;pa.setX(i,pa.getX(i)+Math.sin(t+i)*dt*.4)}else y+=Math.sin(t*1.3+i)*dt*.3;pa.setY(i,y)}pa.needsUpdate=true;
  renderer.render(scene,camera)}};
/* glisser sur l'écran = tourner la caméra */
function bindLook(el){var P={};el.style.touchAction='none';
 el.addEventListener('pointerdown',function(e){P[e.pointerId]=[e.clientX,e.clientY];try{el.setPointerCapture(e.pointerId)}catch(_){}});
 el.addEventListener('pointermove',function(e){var p=P[e.pointerId];if(!p)return;var k=e.pointerType==='mouse'?.006:.008;yaw-=(e.clientX-p[0])*k;pitch=Math.max(.08,Math.min(1.15,pitch+(e.clientY-p[1])*(k*.65)));P[e.pointerId]=[e.clientX,e.clientY]});
 function up(e){delete P[e.pointerId]}el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)}
window.Z3=Z3;
})();
