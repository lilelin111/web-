(function(){
"use strict";
/* ============================================================
   川峡四路 · 小火车之旅
   站点图片（用户提供，真实素材）
   ============================================================ */
const SITE_IMGS = {
  intro:      ["https://aka.doubaocdn.com/s/o0DUAdbkZP"],   // 开场：古道古柏
  sanxingdui: ["https://aka.doubaocdn.com/s/w2TIwsmb9E"],
  jiuzhaigou: ["https://aka.doubaocdn.com/s/TW1dRRbqnY"],
  emeishan:   ["https://aka.doubaocdn.com/s/9uBsiaKHNt"],   // 古亭飞瀑
  daocheng:   ["https://aka.doubaocdn.com/s/RGGxUU4rvK"]   // 雪山草甸溪流
};

/* ---- 场景时间轴（滚动进度 t ∈ 0~1）----
   0.00 开场卷轴（苏轼行书"川峡四路" + 长江万里图）
   0.07 背景变空白，小火车缓缓启程
   0.12→0.34 三星堆（黑底 + 小芽长成青铜树 + 顶部横屏轮播 + 描述）
   0.34→0.56 九寨沟（碧绿湖水倒映金树 + 树丛随火车动画 + 左侧描述）
   0.56→0.78 峨眉山（雪景背景 + 飘雪 + 左侧竖排诗句 + 顶部横屏轮播）
   0.78→0.98 稻城亚丁（草地浅河 + 苍白雪山 + 蓝天白云 + 顶部横屏轮播）
   0.98→1.00 落幕 */
const TIMELINE = [
  {type:'intro', s:0.000, e:0.070, idx:-1},
  {type:'blank', s:0.070, e:0.120, idx:-1},
  {type:'enter', s:0.120, e:0.150, idx:0}, {type:'stay', s:0.150, e:0.300, idx:0}, {type:'exit', s:0.300, e:0.340, idx:0},
  {type:'enter', s:0.340, e:0.370, idx:1}, {type:'stay', s:0.370, e:0.520, idx:1}, {type:'exit', s:0.520, e:0.560, idx:1},
  {type:'enter', s:0.560, e:0.590, idx:2}, {type:'stay', s:0.590, e:0.740, idx:2}, {type:'exit', s:0.740, e:0.780, idx:2},
  {type:'enter', s:0.780, e:0.810, idx:3}, {type:'stay', s:0.810, e:0.940, idx:3}, {type:'exit', s:0.940, e:0.980, idx:3},
  {type:'end',   s:0.980, e:1.000, idx:-1}
];
const STOPS = [
  { key:'sanxingdui', name:'三星堆', desc:'古蜀文明的青铜神树，纵目面具凝视千年。小芽破土、层层攀长，金光垂落——那是沉睡在川西平原下的神秘青铜之梦。' },
  { key:'jiuzhaigou', name:'九寨沟', desc:'碧绿的湖水如镜，倒映着金灿灿的山树；远处彩林一丛丛攀附在褐色的山峦上，随着小火车的行进轻轻流动。' },
  { key:'emeishan',   name:'峨眉山', desc:'冬雪覆满峨眉，一片一片的雪附着在枯枝上，金顶若隐若现。' },
  { key:'daocheng',   name:'稻城亚丁', desc:'碧绿的草地上一道浅浅的河水，远处是苍白的雪山与澄澈的蓝天，白云缓缓飘过。' }
];

const cv = document.getElementById("train-canvas");
const ctx = cv.getContext('2d');
const hud = document.getElementById("train-hud");
const prog = document.getElementById("train-progress");
const hint = document.getElementById("train-hint");
const btnPrev = document.getElementById("train-prev");
const btnNext = document.getElementById("train-next");
const section = document.getElementById("train");
let journeyT = 0;
section.addEventListener("wheel", (event) => {
  const atStart = journeyT <= 0;
  const atEnd = journeyT >= 1;
  if ((event.deltaY < 0 && atStart) || (event.deltaY > 0 && atEnd)) {
    return;
  }
  event.preventDefault();
  journeyT = clamp(journeyT + event.deltaY * 0.00045, 0, 1);
}, { passive: false });

let W=0,H=0,D=1;
function resize(){
  const rect = cv.getBoundingClientRect();
  W = cv.width = Math.round(rect.width || innerWidth);
  H = cv.height = Math.round(rect.height || innerHeight);
  D = Math.min(W,H)/720;
}
addEventListener('resize',resize); resize();

/* 缓动 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,k)=>a+(b-a)*k;
const easeInOut=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
const easeOut=k=>1-Math.pow(1-k,3);
/* 当前滚动进度 */
function scrollT(){
  return journeyT;
}
function segment(t){
  for(const seg of TIMELINE){
    if(t>=seg.s && t<seg.e) return {seg, local:(t-seg.s)/(seg.e-seg.s)};
  }
  const last=TIMELINE[TIMELINE.length-1];
  return {seg:last, local:1};
}

/* 站点图片加载 + 轮播状态 */
const imgs={}, loaded={};
Object.keys(SITE_IMGS).forEach(key=>{
  imgs[key]=[]; loaded[key]=[];
  SITE_IMGS[key].forEach((url,i)=>{
    const img=new Image(); img.src=url;
    imgs[key][i]=img; loaded[key][i]=false;
    img.onload=()=>loaded[key][i]=true;
  });
});
const carState={}; // key -> {slot, timer, alpha, prev, prevA}
function cs(key,n){
  if(!carState[key]) carState[key]={slot:0,timer:0,alpha:1,prev:-1,prevA:0};
  const s=carState[key];
  s.timer++;
  if(n>1 && s.timer>300){
    s.timer=0; s.prev=s.slot; s.prevA=1;
    s.slot=(s.slot+1)%n; s.alpha=0;
  }
  if(s.alpha<1)s.alpha=Math.min(s.alpha+.04,1);
  if(s.prevA>0)s.prevA=Math.max(s.prevA-.04,0);
  return s;
}
function switchImg(key,dir){
  const s=carState[key], n=SITE_IMGS[key].length;
  if(!n) return;
  s.prev=s.slot; s.prevA=1; s.slot=(s.slot+dir+n)%n; s.alpha=0; s.timer=0;
}
btnPrev.onclick=()=>{ if(curCar) switchImg(curCar,-1); };
btnNext.onclick=()=>{ if(curCar) switchImg(curCar,1); };
let curCar=null;

/* 绘制图片（cover裁剪居中） */
function drawCover(img, x,y,w,h, round){
  ctx.save();
  ctx.beginPath();
  if(round>0) ctx.roundRect(x,y,w,h,round); else ctx.rect(x,y,w,h);
  ctx.clip();
  const ir=img.width/img.height, r=w/h;
  let sw=w, sh=w/ir;
  if(sh<h){ sh=h; sw=h*ir; }
  ctx.drawImage(img, x-(sw-w)/2, y-(sh-h)/2, sw, sh);
  ctx.restore();
}
/* 从源图按比例裁一块(sx,sy,sw,sh 为 0~1)，再 cover 铺满目标区域 dx,dy,dw,dh。
   用于裁掉手机截图两侧的 UI 按钮/导航，只取中间风景。 */
function drawBgClip(img, sx,sy,sw,sh, dx,dy,dw,dh){
  const iw=img.width, ih=img.height;
  const sxp=sx*iw, syp=sy*ih, swp=sw*iw, shp=sh*ih;
  const sr=swp/shp, tr=dw/dh;
  let dw2,dh2;
  if(sr>tr){ dh2=dh; dw2=dh2*sr; } else { dw2=dw; dh2=dw2/sr; }
  ctx.drawImage(img, sxp,syp,swp,shp, dx-(dw2-dw)/2, dy-(dh2-dh)/2, dw2, dh2);
}

/* 小火车绘制（匀速缓慢行驶，居中纵向略靠下） */
function drawTrain(x,y,dir,phase){
  ctx.save(); ctx.translate(x,y);
  const sc=D*0.9; ctx.scale(sc,sc);
  if(dir<0) ctx.scale(-1,1);
  // 烟
  for(let i=0;i<4;i++){
    const p=(phase+i/4)%1;
    const sx=20+p*16, sy=-34-p*34, r=6+p*14, a=(1-p)*.26;
    const g=ctx.createRadialGradient(sx,sy,0,sx,sy,r);
    g.addColorStop(0,`rgba(220,210,190,${a})`); g.addColorStop(1,'rgba(220,210,190,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,sy,r,0,7); ctx.fill();
  }
  // 车轮
  [-22,0,22].forEach(wx=>{
    ctx.beginPath(); ctx.arc(wx,16,7,0,7);
    ctx.fillStyle='#1d1a15'; ctx.fill();
    ctx.beginPath(); ctx.arc(wx,16,3,0,7); ctx.fillStyle='#cdb98a'; ctx.fill();
  });
  // 底盘
  ctx.beginPath(); ctx.roundRect(-30,6,60,14,3); ctx.fillStyle='#2a251c'; ctx.fill();
  // 车身
  const bg=ctx.createLinearGradient(0,-22,0,6);
  bg.addColorStop(0,'#7a2e2e'); bg.addColorStop(.5,'#a03a2e'); bg.addColorStop(1,'#5f2418');
  ctx.beginPath(); ctx.roundRect(-32,-22,64,26,6); ctx.fillStyle=bg; ctx.fill();
  ctx.strokeStyle='#4d1b12'; ctx.lineWidth=1.5; ctx.stroke();
  // 烟囱
  ctx.beginPath(); ctx.roundRect(16,-32,10,14,2); ctx.fillStyle='#1d1a15'; ctx.fill();
  // 车窗
  ctx.beginPath(); ctx.roundRect(-20,-18,16,12,3); ctx.fillStyle='#f0dfae'; ctx.fill();
  ctx.strokeStyle='#5f2418'; ctx.lineWidth=1; ctx.stroke();
  ctx.beginPath(); ctx.roundRect(4,-18,16,12,3); ctx.fillStyle='#f0dfae'; ctx.fill(); ctx.stroke();
  // 车灯
  ctx.beginPath(); ctx.arc(-30,4,3,0,7); ctx.fillStyle='#ffd27a'; ctx.fill();
  ctx.restore();
}

/* 文字辅助 */
function drawDesc(x,y,maxW,title,text,alpha,color){
  if(alpha<=0) return;
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.textAlign='left'; ctx.textBaseline='top';
  ctx.font='bold '+Math.round(26*D)+'px KaiTi,serif'; ctx.fillStyle=color||'#e9d9b0';
  ctx.fillText(title,x,y);
  ctx.beginPath(); ctx.moveTo(x,y+34*D); ctx.lineTo(x+46*D,y+34*D);
  ctx.lineWidth=2; ctx.strokeStyle=color||'#c9a35a'; ctx.stroke();
  ctx.font=Math.round(16*D)+'px KaiTi,serif'; ctx.fillStyle='rgba(235,225,200,.92)';
  const charsPer=Math.max(6,Math.floor(maxW/(16*D)));
  let yy=y+48*D;
  for(let i=0;i<text.length;i+=charsPer){
    ctx.fillText(text.slice(i,i+charsPer),x,yy); yy+=26*D;
  }
  ctx.restore();
}

/* 顶部横屏轮播（装裱横框） */
function drawBanner(key,alpha,bannerAlpha){
  const n=SITE_IMGS[key].length; if(!n) return;
  const s=cs(key,n);
  const bw=Math.min(W*.72,980), bh=bw*.24;
  const bx=(W-bw)/2, by=26;
  ctx.save(); ctx.globalAlpha=bannerAlpha;
  // 装裱外框
  ctx.shadowColor='rgba(0,0,0,.5)'; ctx.shadowBlur=22*D; ctx.shadowOffsetY=6*D;
  ctx.fillStyle='#e8dcc0'; ctx.beginPath(); ctx.roundRect(bx-10,by-10,bw+20,bh+20,4); ctx.fill();
  ctx.shadowBlur=0; ctx.shadowOffsetY=0;
  ctx.strokeStyle='rgba(90,60,30,.5)'; ctx.lineWidth=1; ctx.strokeRect(bx-6,by-6,bw+12,bh+12);
  // 横屏框里也取干净风景段（手机截图裁掉 UI）
  const BAN_CROP={
    emeishan:[0.0,0.30,1.0,0.35],
    daocheng:[0.0,0.25,1.0,0.40]
  };
  function drawInBox(img){
    const c=BAN_CROP[key];
    if(c) drawBgClip(img,c[0],c[1],c[2],c[3],bx,by,bw,bh);
    else drawCover(img,bx,by,bw,bh,0);
  }
  // 图
  if(imgs[key][s.slot] && loaded[key][s.slot]){
    ctx.globalAlpha=bannerAlpha*s.alpha;
    drawInBox(imgs[key][s.slot]);
  }
  if(s.prev>=0 && loaded[key][s.prev]){
    ctx.globalAlpha=bannerAlpha*s.prevA;
    drawInBox(imgs[key][s.prev]);
  }
  ctx.globalAlpha=bannerAlpha;
  // 底部站名条
  const gr=ctx.createLinearGradient(0,by+bh-46,0,by+bh);
  gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(0,0,0,.65)');
  ctx.fillStyle=gr; ctx.fillRect(bx,by+bh-46,bw,46);
  ctx.font='bold '+Math.round(22*D)+'px KaiTi,serif'; ctx.fillStyle='#f6e8c4';
  ctx.textAlign='right'; ctx.textBaseline='bottom';
  ctx.fillText(STOPS.find(s=>s.key===key).name,bx+bw-16,by+bh-12);
  // 指示点
  if(n>1){
    const yy=by+bh+16*D, sx=W/2-(n-1)*9;
    for(let i=0;i<n;i++){
      ctx.beginPath(); ctx.arc(sx+i*18,yy,3,0,7);
      ctx.fillStyle=i===s.slot?'#7a2e2e':'rgba(120,90,50,.4)'; ctx.fill();
    }
  }
  ctx.restore();
}

/* ============ 场景 0：开场（古道古柏 + 川峡四路缓缓浮现） ============ */
function drawIntro(t,local){
  // local 0~1：从纯黑淡入到古道图，文字缓缓浮现
  const open=easeOut(clamp(local/.8,0,1));
  // 背景：古道古柏实拍（裁掉顶部状态栏、底部黑边）
  if(imgs.intro[0] && loaded.intro[0]){
    drawBgClip(imgs.intro[0], 0.0,0.10,1.0,0.78, 0,0,W,H);
  } else {
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#1a2e1e'); g.addColorStop(1,'#0a140c');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }
  // 开场先从纯黑淡入，营造"浮现"感
  ctx.fillStyle=`rgba(4,7,5,${1-open})`; ctx.fillRect(0,0,W,H);
  // 暗角
  const vg=ctx.createRadialGradient(W/2,H*.5,H*.2,W/2,H*.5,H*.78);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.55)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

  // 文字：川峡四路，缓缓浮现
  const ta=clamp((open-.25)/.6,0,1);
  if(ta>0){
    ctx.save(); ctx.globalAlpha=ta;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='bold '+Math.round(96*D)+'px KaiTi,"STXingkai","STKaiti",serif';
    ctx.fillStyle='#f3e6c0';
    ctx.shadowColor='rgba(0,0,0,.85)'; ctx.shadowBlur=24*D; ctx.shadowOffsetY=4*D;
    ctx.fillText('川峡四路',W/2,H*.46);
    ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    // 细金线
    ctx.strokeStyle='rgba(233,217,176,.55)'; ctx.lineWidth=1;
    const lw=Math.min(W*.3,360);
    ctx.beginPath();
    ctx.moveTo(W/2-lw/2, H*.46+64*D); ctx.lineTo(W/2+lw/2, H*.46+64*D);
    ctx.stroke();
    // 副标题
    ctx.font=Math.round(16*D)+'px KaiTi,serif'; ctx.fillStyle='rgba(243,230,192,.88)';
    ctx.fillText('—— 蜀道 · 小火车之旅 ——',W/2,H*.46+92*D);
    // 印章
    const sealX=W/2+Math.min(W*.22,150);
    ctx.beginPath(); ctx.arc(sealX, H*.46+92*D, 13*D, 0, 7);
    ctx.fillStyle='rgba(160,40,40,.9)'; ctx.fill();
    ctx.fillStyle='#f6e8c4'; ctx.font='bold '+Math.round(13*D)+'px KaiTi,serif';
    ctx.fillText('蜀', sealX, H*.46+92*D);
    ctx.restore();
  }
}

/* ============ 场景 1：三星堆（黑底 + 小芽长成青铜树） ============ */
function drawSanxingdui(t,alpha,grow){
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.fillStyle='#05070c'; ctx.fillRect(0,0,W,H);
  const tx=W*.5, tb=H*.85, th=H*.5*Math.max(0,grow);
  // 金色光晕
  if(grow>0){
    const r=W*.4*grow;
    const g=ctx.createRadialGradient(tx,tb,0,tx,tb,r);
    g.addColorStop(0,`rgba(210,160,70,${.22*grow})`); g.addColorStop(1,'rgba(210,160,70,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }
  drawBronzeTree(tx,tb,th,grow,t);
  // 生长到后半段，淡入用户提供的真实青铜神树图作为主体
  if(grow>.35 && imgs.sanxingdui[0] && loaded.sanxingdui[0]){
    const fa=clamp((grow-.35)/.45,0,1);
    ctx.save();
    ctx.globalAlpha=alpha*fa;
    // 神树图居中，高度撑满，黑底自然融入
    const img=imgs.sanxingdui[0];
    const iw=img.width, ih=img.height;
    let dw2=H*1.05*iw/ih, dh2=H*1.05;
    if(dw2<W*.6){ dw2=W*.6; dh2=dw2*ih/iw; }
    ctx.drawImage(img,(W-dw2)/2,H*.95-dh2,dw2,dh2);
    ctx.restore();
  }
  // 顶部横屏轮播
  if(grow>.5) drawBanner('sanxingdui',alpha,clamp((grow-.5)/.5,0,1));
  // 描述
  if(grow>.7) drawDesc(W*.06,H*.62,Math.min(360,W*.34),'三星堆',STOPS[0].desc,clamp((grow-.7)/.3,0,1)*alpha,'#c9a35a');
  ctx.restore();
}
function drawBronzeTree(cx,baseY,h,g,t){
  if(h<=0) return;
  ctx.save(); ctx.translate(cx,baseY);
  const grow=clamp(g/.62,0,1);
  // 主干（青铜金）
  const gd=ctx.createLinearGradient(0,-h,0,0);
  gd.addColorStop(0,'#c9a84a'); gd.addColorStop(.5,'#9c7c32'); gd.addColorStop(1,'#6d5418');
  ctx.beginPath();
  ctx.moveTo(-9*grow,0);
  ctx.quadraticCurveTo(-7*grow,-h*.5,-4*grow,-h);
  ctx.lineTo(4*grow,-h);
  ctx.quadraticCurveTo(7*grow,-h*.5,9*grow,0);
  ctx.closePath(); ctx.fillStyle=gd; ctx.fill();
  // 三层九枝
  const levels=[{y:-h*.3,len:h*.32,n:3},{y:-h*.58,len:h*.27,n:3},{y:-h*.84,len:h*.22,n:3}];
  levels.forEach((lv,li)=>{
    const lg=clamp((grow-li*.12)/.55,0,1); if(lg<=0) return;
    for(let i=0;i<lv.n;i++){
      const ang=-Math.PI/2+(i-1)*.72+(li%2? .36:0);
      const L=lv.len*lg, ex=Math.cos(ang)*L, ey=lv.y+Math.sin(ang)*L*.6;
      ctx.beginPath(); ctx.moveTo(0,lv.y); ctx.quadraticCurveTo(ex*.5,lv.y-L*.2,ex,ey);
      ctx.strokeStyle=`rgba(201,168,74,${.85*lg})`; ctx.lineWidth=4*grow; ctx.lineCap='round'; ctx.stroke();
      // 枝头金花/神鸟
      const fl=.55+Math.sin(t*.04+i+li)*.4;
      ctx.beginPath(); ctx.arc(ex,ey,4*lg,0,7);
      ctx.fillStyle=`rgba(255,214,120,${fl*lg})`;
      ctx.shadowColor='rgba(255,200,80,.9)'; ctx.shadowBlur=12; ctx.fill(); ctx.shadowBlur=0;
    }
  });
  // 树顶神鸟
  if(grow>.92){
    const tg=clamp((grow-.92)/.08,0,1);
    ctx.beginPath(); ctx.arc(0,-h,7*tg,0,7);
    ctx.fillStyle=`rgba(255,230,150,${tg})`; ctx.shadowColor='rgba(255,200,80,1)'; ctx.shadowBlur=20; ctx.fill(); ctx.shadowBlur=0;
  }
  ctx.restore();
}

/* ============ 场景 2：九寨沟 ============ */
function drawJiuzhaigou(t,alpha,px){
  ctx.save(); ctx.globalAlpha=alpha;
  // 背景：用户提供的九寨沟实景（碧绿湖水）作底
  if(imgs.jiuzhaigou[0] && loaded.jiuzhaigou[0]){
    drawCover(imgs.jiuzhaigou[0],0,0,W,H,0);
    ctx.fillStyle='rgba(20,40,30,.10)'; ctx.fillRect(0,0,W,H);
  } else {
    const sky=ctx.createLinearGradient(0,0,0,H*.7);
    sky.addColorStop(0,'#cfe4e8'); sky.addColorStop(1,'#eef0d8');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
  }
  // 前景：金色/绿色树丛，随小火车移动（视差）
  const off=px*W*.06;
  for(let i=0;i<26;i++){
    const sx=((i*137+7)%1000)/1000;
    const gx=(sx*(W+240)-120 - off*(.5+(i%3)*.25));
    const gy=H*(.66+(i%4)*.075);
    const col=i%3===0?'rgba(212,168,67,.75)':i%3===1?'rgba(120,150,70,.7)':'rgba(160,120,50,.7)';
    drawTreeCluster(gx,gy,14+(i%5)*4,col);
  }
  // 左侧中描述
  drawDesc(W*.05,H*.42,Math.min(340,W*.32),'九寨沟',STOPS[1].desc,alpha,'#3f5a2c');
  ctx.restore();
}
function drawTreeCluster(x,y,size,color){
  ctx.beginPath(); ctx.moveTo(x,y-size);
  ctx.lineTo(x-size*.5,y); ctx.lineTo(x+size*.5,y); ctx.closePath();
  ctx.fillStyle=color; ctx.fill();
}

/* ============ 场景 3：峨眉山（雪景） ============ */
const snow=[];
(function(){for(let i=0;i<90;i++)snow.push({x:Math.random(),y:Math.random(),r:Math.random()*2+1,s:Math.random()*.001+.0005,d:Math.random()*2-1});})();
function drawEmeishan(t,alpha,px){
  ctx.save(); ctx.globalAlpha=alpha;
  // 背景：古亭飞瀑（裁掉顶部"X 1/9"状态栏、底部黑边）
  if(imgs.emeishan[0] && loaded.emeishan[0]){
    drawBgClip(imgs.emeishan[0], 0.0,0.22,1.0,0.62, 0,0,W,H);
    // 轻微压暗，让左侧诗句清晰
    ctx.fillStyle='rgba(10,20,18,.28)'; ctx.fillRect(0,0,W,H);
  } else {
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#9fb4c8'); g.addColorStop(.6,'#d8e2ea'); g.addColorStop(1,'#eef2f4');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    drawSnowMountains(t);
    drawSnowTrees(t);
  }
  // 飘雪
  ctx.fillStyle='rgba(255,255,255,.85)';
  snow.forEach(f=>{
    const y=((f.y+t*f.s)%1)*H;
    const x=(f.x+Math.sin(t*.001+f.x*10)*.008+f.d*.01)*W;
    ctx.beginPath(); ctx.arc(x,y,f.r,0,7); ctx.fill();
  });
  // 左侧竖排诗句
  drawVerticalPoem('峨眉山月半轮秋','影入平羌江水流',alpha,px);
  // 顶部横屏轮播
  drawBanner('emeishan',alpha,1);
  ctx.restore();
}
function drawSnowMountains(t){
  const layers=[
    {y:.42,amp:.10,c1:'#d8e2ea',c2:'#a8b8c8'},
    {y:.54,amp:.09,c1:'#c0cdd8',c2:'#8fa0b0'},
    {y:.64,amp:.08,c1:'#a8b5c0',c2:'#788898'}
  ];
  layers.forEach((L,i)=>{
    const baseY=L.y*H, amp=L.amp*H;
    ctx.beginPath(); ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=15){
      const y=baseY-Math.sin(x*.005+i)*amp-Math.sin(x*.011+i*1.7)*amp*.5;
      ctx.lineTo(x,y);
    }
    ctx.lineTo(W,H); ctx.closePath();
    const gr=ctx.createLinearGradient(0,baseY-amp,0,baseY+amp*2);
    gr.addColorStop(0,L.c1); gr.addColorStop(1,L.c2);
    ctx.fillStyle=gr; ctx.fill();
  });
}
function drawSnowTrees(t){
  const pos=[.12,.30,.62,.84];
  pos.forEach((p,i)=>{ drawSnowTree(p*W,H*.8,60+i*12); });
}
function drawSnowTree(x,y,h){
  ctx.beginPath(); ctx.moveTo(x-4,y); ctx.lineTo(x+4,y);
  ctx.lineTo(x+2,y-h*.4); ctx.lineTo(x-2,y-h*.4); ctx.closePath();
  ctx.fillStyle='#5a4a38'; ctx.fill();
  const layers=[{y:y-h*.35,w:h*.5},{y:y-h*.62,w:h*.38},{y:y-h*.85,w:h*.26}];
  layers.forEach(L=>{
    ctx.beginPath(); ctx.moveTo(x,L.y-h*.12);
    ctx.lineTo(x-L.w/2,L.y); ctx.lineTo(x+L.w/2,L.y); ctx.closePath();
    ctx.fillStyle='#6a5a48'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x,L.y-h*.12);
    ctx.lineTo(x-L.w/2,L.y); ctx.lineTo(x-L.w/2+6,L.y+3);
    ctx.lineTo(x,L.y-h*.08); ctx.lineTo(x+L.w/2-6,L.y+3); ctx.lineTo(x+L.w/2,L.y); ctx.closePath();
    ctx.fillStyle='rgba(250,250,255,.92)'; ctx.fill();
  });
}
function drawVerticalPoem(l1,l2,alpha,px){
  const x=W*.09;
  const startY=H*.24;
  const fz=Math.round(32*D), gap=Math.round(58*D);
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.font=`bold ${fz}px KaiTi,serif`; ctx.fillStyle='#1e2935';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowColor='rgba(255,255,255,.7)'; ctx.shadowBlur=8;
  [...l1].forEach((c,i)=>ctx.fillText(c,x,startY+i*gap));
  [...l2].forEach((c,i)=>ctx.fillText(c,x+gap,startY+i*gap));
  ctx.shadowBlur=0;
  // 印章
  ctx.beginPath(); ctx.rect(x-12,startY+l1.length*gap+8,24,24);
  ctx.fillStyle='rgba(122,46,46,.85)'; ctx.fill();
  ctx.fillStyle='#f6e8c4'; ctx.font='13px KaiTi,serif';
  ctx.fillText('印',x,startY+l1.length*gap+20);
  ctx.restore();
}

/* ============ 场景 4：稻城亚丁 ============ */
function drawDaocheng(t,alpha,px){
  ctx.save(); ctx.globalAlpha=alpha;
  // 背景：雪山草甸溪流（裁掉顶部"X 实况 1/17"、底部黑边）
  if(imgs.daocheng[0] && loaded.daocheng[0]){
    drawBgClip(imgs.daocheng[0], 0.0,0.18,1.0,0.72, 0,0,W,H);
    // 轻微提亮，保持通透
    ctx.fillStyle='rgba(180,210,235,.06)'; ctx.fillRect(0,0,W,H);
  } else {
    const sky=ctx.createLinearGradient(0,0,0,H*.6);
    sky.addColorStop(0,'#4f9ed0'); sky.addColorStop(.6,'#94c4e0'); sky.addColorStop(1,'#d8e8f0');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
    const baseY=H*.56;
    ctx.beginPath(); ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=14){
      const y=baseY-Math.sin(x*.004)*H*.08-Math.sin(x*.009)*H*.05;
      ctx.lineTo(x,y);
    }
    ctx.lineTo(W,H); ctx.closePath();
    const mg=ctx.createLinearGradient(0,baseY-H*.1,0,baseY+H*.1);
    mg.addColorStop(0,'#f4f7fa'); mg.addColorStop(.5,'#d8e2e8'); mg.addColorStop(1,'#aec0c8');
    ctx.fillStyle=mg; ctx.fill();
    const grassY=H*.62;
    const gg=ctx.createLinearGradient(0,grassY,0,H);
    gg.addColorStop(0,'#8fc466'); gg.addColorStop(1,'#4f8a38');
    ctx.fillStyle=gg; ctx.fillRect(0,grassY,W,H-grassY);
  }
  // 白云缓缓飘过
  drawClouds(t);
  // 顶部横屏轮播
  drawBanner('daocheng',alpha,1);
  ctx.restore();
}
function drawClouds(t){
  const cs=[{x:.12,y:.12,s:1},{x:.55,y:.08,s:.85},{x:.82,y:.18,s:1.1}];
  cs.forEach(c=>{
    const cx=((c.x+t*.00006)%1.2-.1)*W, cy=c.y*H;
    ctx.save(); ctx.globalAlpha=.9; ctx.fillStyle='#fff';
    ctx.beginPath();
    ctx.arc(cx,cy,c.s*30,0,7); ctx.arc(cx+c.s*30,cy-c.s*9,c.s*36,0,7);
    ctx.arc(cx+c.s*60,cy,c.s*27,0,7); ctx.arc(cx+c.s*30,cy+c.s*9,c.s*33,0,7);
    ctx.fill(); ctx.restore();
  });
}
function drawRiver(t){
  const ry=H*.78, rh=H*.06;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0,ry);
  for(let x=0;x<=W;x+=20){ ctx.lineTo(x,ry+Math.sin(x*.006)*8); }
  for(let x=W;x>=0;x-=20){ ctx.lineTo(x,ry+rh+Math.sin(x*.006+1)*8); }
  ctx.closePath();
  const g=ctx.createLinearGradient(0,ry,0,ry+rh);
  g.addColorStop(0,'rgba(180,210,230,.85)'); g.addColorStop(1,'rgba(130,170,200,.85)');
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=1.5;
  for(let i=0;i<3;i++){
    ctx.beginPath(); const yy=ry+rh*(.3+i*.25), off=(t*(.5+i*.3)*W*4)%100;
    for(let x=-100;x<W+100;x+=25){ const wx=x+off, wave=Math.sin(wx*.03+i)*1.5;
      x===-100?ctx.moveTo(wx,yy+wave):ctx.lineTo(wx,yy+wave); }
    ctx.stroke();
  }
  ctx.restore();
}

/* ============ 主循环 ============ */
function drawScene(idx,t,alpha,px){
  switch(idx){
    case 0: drawSanxingdui(t,alpha,alpha); break;
    case 1: drawJiuzhaigou(t,alpha,px); break;
    case 2: drawEmeishan(t,alpha,px); break;
    case 3: drawDaocheng(t,alpha,px); break;
  }
}

let lastT=-1, curIdx=-1;
function render(){
  const t=scrollT();
  const {seg,local}=segment(t);
  ctx.clearRect(0,0,W,H);
  prog.style.width=(t*100)+'%';

  curCar=null;
  const stop = seg.idx>=0?STOPS[seg.idx]:null;

  if(seg.type==='intro'){
    hint.classList.remove('show');
    drawIntro(t,local);
    hud.textContent='川峡四路';
  } else if(seg.type==='blank'){
    // 背景变空白，火车启程
    ctx.fillStyle='#e8e0cc'; ctx.fillRect(0,0,W,H);
    hud.textContent='启程 · 沿江而行';
  } else if(seg.type==='enter'){
    const ep=local;
    // 淡入本站场景
    drawScene(seg.idx,t,ep,0);
    hud.textContent='前往 · '+stop.name;
    curCar=stop.key;
  } else if(seg.type==='stay'){
    drawScene(seg.idx,t,1,0);
    hud.textContent='停留 · '+stop.name;
    curCar=stop.key;
  } else if(seg.type==='exit'){
    drawScene(seg.idx,t,1-local,0);
    hud.textContent='离开 · '+stop.name;
  } else if(seg.type==='end'){
    drawScene(3,t,1,0);
    hud.textContent='旅程 · 圆满';
  }

  // 顶部按钮显示（横屏轮播站点时出现）
  const hasCar = ['enter','stay'].includes(seg.type) && seg.idx>=0 && SITE_IMGS[STOPS[seg.idx].key].length>0;
  btnPrev.style.display = hasCar?'flex':'none';
  btnNext.style.display = hasCar?'flex':'none';
  if(curIdx!==seg.idx){ if(hasCar) curCar=STOPS[seg.idx].key; curIdx=seg.idx; }

  // 小火车：匀速缓慢行驶，贯穿全程
  if(seg.type!=='intro'){
    const trainProg = seg.idx>=0 ? (seg.s + local*(seg.e-seg.s)) : t;
    const tx = lerp(W*.10, W*.92, clamp((t-.06)/.92,0,1));
    const ty = H*.86;
    drawTrain(tx,ty,1,lastT);
  }

  hud.classList.toggle('show', seg.type!=='intro');
  hint.style.display = t<0.02?'block':'none';
}
(function loop(){
  lastT+=0.016;
  render();
  requestAnimationFrame(loop);
})();
})();
