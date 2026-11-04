window.BK_CONFIG={"url": "https://mckfgjafnvgufancnlok.supabase.co", "anonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ja2ZnamFmbnZndWZhbmNubG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNDYzNDMsImV4cCI6MjEwODcyMjM0M30.ZnEKShSfqfz7wMK-giZ1UX-7dMA_9juYMy_OmUBGqco"};window.BK_OCR_SRC="assets/ocr.ac31c791dc.js";window.BK_TRACK_SRC="assets/track.45300c5391.js";
/* 러닝 BK 소리: 효과음과 배경음악을 브라우저 안에서 직접 합성해요.
   음원 파일을 하나도 쓰지 않아서 저작권·라이선스 걱정이 없고, 앱 용량도 거의 늘지 않아요(약 9KB).
   BKSound.play('levelup') 처럼 부르고, 설정은 기기마다 localStorage 'bk:sound'에 저장돼요. */
(function(){
'use strict';
const KEY='bk:sound';
const st={sfx:true,bgm:false};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'){if(typeof s.sfx==='boolean')st.sfx=s.sfx;if(typeof s.bgm==='boolean')st.bgm=s.bgm;}}catch(_){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st));}catch(_){}};

let ctx=null,out,sfxBus,bgmBus,noise;
const BGM_VOL=.26;
function ac(){
 if(ctx){if(ctx.state==='suspended'&&document.visibilityState==='visible')ctx.resume().catch(()=>{});return ctx;}
 const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
 // 아이폰: 무음 스위치를 켜면 소리가 나지 않고, 사용자가 듣던 음악도 끊지 않고 함께 들려요.
 try{if(navigator.audioSession)navigator.audioSession.type='ambient';}catch(_){}
 try{ctx=new C();}catch(_){return null;}
 const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=.004;comp.release.value=.2;
 out=ctx.createGain();out.gain.value=.9;comp.connect(out);out.connect(ctx.destination);
 sfxBus=ctx.createGain();sfxBus.gain.value=.85;sfxBus.connect(comp);
 bgmBus=ctx.createGain();bgmBus.gain.value=0;bgmBus.connect(comp);
 noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 return ctx;}
const mtof=m=>440*Math.pow(2,(m-69)/12);

/* ---- 악기 ---- */
// 실로폰 같은 맑은 종소리(FM 합성: 소리 하나가 다른 소리를 살짝 흔들어 쇳소리 결을 만들어요)
function bell(f,t,{dur=.9,g=.18,ratio=3.5,idx=1.6,to=sfxBus}={}){
 const c=ctx.createOscillator(),m=ctx.createOscillator(),mg=ctx.createGain(),a=ctx.createGain();
 c.type='sine';m.type='sine';c.frequency.value=f;m.frequency.value=f*ratio;
 mg.gain.setValueAtTime(f*idx,t);mg.gain.exponentialRampToValueAtTime(f*.02,t+dur*.6);
 a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(g,t+.004);a.gain.exponentialRampToValueAtTime(.0005,t+dur);
 m.connect(mg);mg.connect(c.frequency);c.connect(a);a.connect(to);
 c.start(t);m.start(t);c.stop(t+dur+.05);m.stop(t+dur+.05);}
// 부드러운 전자 피아노(배경음악 멜로디)
function keys(f,t,{dur=.6,g=.06,to=bgmBus}={}){bell(f,t,{dur,g,ratio:1,idx:2.2,to});bell(f*2,t,{dur:dur*.5,g:g*.18,ratio:7,idx:.6,to});}
// 둥근 소리(사인·세모 파형) 한 음
function tone(f,t,{dur=.2,g=.12,type='sine',a=.005,to=sfxBus,f2=null,lp=null}={}){
 const o=ctx.createOscillator(),v=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
 v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g,t+a);v.gain.exponentialRampToValueAtTime(.0005,t+dur);
 let n=o;if(lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);n=fl;}
 n.connect(v);v.connect(to);o.start(t);o.stop(t+dur+.05);}
// 바람·박수·찰랑이 같은 소리(잡음을 필터로 깎아서 만들어요)
function hiss(t,{dur=.1,g=.2,type='bandpass',f=1500,f2=null,q=1,a=.002,to=sfxBus}={}){
 const s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),v=ctx.createGain();s.buffer=noise;s.loop=true;
 fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;
 v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g,t+a);v.gain.exponentialRampToValueAtTime(.0005,t+dur);
 s.connect(fl);fl.connect(v);v.connect(to);s.start(t,Math.random()*.5);s.stop(t+dur+.05);}
// 금관 느낌의 화음(레벨업 팡파르)
function brass(ms,t,{dur=1.1,g=.07}={}){
 const fl=ctx.createBiquadFilter(),v=ctx.createGain();fl.type='lowpass';fl.Q.value=1.5;
 fl.frequency.setValueAtTime(500,t);fl.frequency.exponentialRampToValueAtTime(3200,t+.08);fl.frequency.exponentialRampToValueAtTime(1300,t+dur*.7);
 v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g,t+.03);v.gain.setValueAtTime(g,t+dur*.55);v.gain.exponentialRampToValueAtTime(.0005,t+dur);
 fl.connect(v);v.connect(sfxBus);
 for(const m of ms)for(const dt of [-7,7]){const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=dt;o.connect(fl);o.start(t);o.stop(t+dur+.05);}}
const clap=(t,g=.32)=>{for(let i=0;i<3;i++)hiss(t+i*.011,{dur:.02,g:g*.7,f:1300,q:1.2});hiss(t+.033,{dur:.16,g,f:1150,q:.9});};
const shimmer=(t,g=.05,dur=.5)=>hiss(t,{dur,g,type:'highpass',f:7000,a:.04});

/* ---- 효과음 목록 ---- */
const N=mtof;
const SFX={
 tap:t=>tone(1100,t,{dur:.05,g:.09,f2:760}),
 on:t=>{tone(N(79),t,{dur:.07,g:.07});tone(N(84),t+.06,{dur:.1,g:.07});},
 // 인증 요청 완료: "딩-동↑" (확인 대기라 조금 차분하게)
 submit:t=>{bell(N(79),t,{g:.16});bell(N(84),t+.13,{g:.18,dur:1.2});},
 // 사진과 같아 바로 반영: 밝은 세 음 + 반짝
 approved:t=>{[84,88,91].forEach((m,i)=>bell(N(m),t+i*.085,{g:.16,dur:1}));bell(N(96),t+.26,{g:.1,dur:1.4});shimmer(t+.2,.035,.7);},
 // 퀘스트 보상 받기: 짧게 반짝
 claim:t=>{[88,91,95,100].forEach((m,i)=>bell(N(m),t+i*.045,{g:.11,dur:.7,idx:1.1}));shimmer(t+.05,.05,.45);},
 // 하이파이브: "짝!" 박수 + 맑은 한 음
 cheer:t=>{clap(t);bell(N(93),t+.06,{g:.12,dur:.6});bell(N(100),t+.1,{g:.06,dur:.5});},
 // 배지 획득: 위로 훑는 반짝 소리
 badge:t=>{[86,88,90,93,95,98].forEach((m,i)=>bell(N(m),t+i*.04,{g:.09,dur:1.3,idx:1.2}));shimmer(t,.04,1.1);tone(N(62),t,{dur:1.2,g:.05,type:'triangle',a:.08});},
 // 빙고 한 줄: "빙-고!"
 bingo:t=>{bell(N(79),t,{g:.17});bell(N(84),t+.14,{g:.2,dur:1.3});[88,91,96].forEach((m,i)=>bell(N(m),t+.3+i*.06,{g:.1,dur:1.2}));clap(t+.14,.18);},
 // 레벨업: 짧은 팡파르
 levelup:t=>{[67,72,76].forEach((m,i)=>brass([m],t+i*.1,{dur:.14,g:.06}));brass([60,64,67,72],t+.3,{dur:1.5,g:.055});tone(N(48),t+.3,{dur:1.4,g:.12,type:'triangle',a:.02});
  [84,88,91,96].forEach((m,i)=>bell(N(m),t+.32+i*.09,{g:.1,dur:1.4}));hiss(t,{dur:.32,g:.06,f:600,f2:5000,q:.7,a:.25});shimmer(t+.32,.05,1.2);},
 // 반 레이스 다시 보기 시작: 출발 신호
 start:t=>{[0,.16,.32].forEach(d=>tone(N(81),t+d,{dur:.09,g:.1,type:'triangle'}));tone(N(93),t+.48,{dur:.32,g:.12,type:'triangle'});},
 // 추월!
 pass:t=>{hiss(t,{dur:.28,g:.09,f:500,f2:4000,q:1.4,a:.2});bell(N(88),t+.2,{g:.13,dur:.6});bell(N(95),t+.27,{g:.12,dur:.8});},
 // 추월당했어요(작고 아쉽게)
 passed:t=>{tone(N(76),t,{dur:.18,g:.09,type:'triangle'});tone(N(72),t+.15,{dur:.32,g:.09,type:'triangle'});},
};
const DUCK={levelup:2,badge:1.2,bingo:1.4,approved:1};

/* ---- 배경음악: 가벼운 조깅 템포(100bpm) 곡을 실시간으로 연주해요 ---- */
// 8마디가 한 바퀴. 화음은 D장조 계열로 밝고 편안하게, 멜로디는 바퀴마다 조금씩 달라져요.
const BPM=100,SPB=60/BPM,S16=SPB/4;
const CH=[[38,[57,61,64,66]],[47,[57,62,64,66]],[43,[57,59,62,66]],[45,[57,59,64,66]],[38,[57,61,64,66]],[42,[57,61,64,69]],[43,[57,59,62,66]],[45,[55,57,62,64]]];
const SCALE=[69,71,74,76,78,81,83,86];
let bgmOn=false,timer=0,next=0,step=0,cycle=0,mel=null,stopAt=0;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296;};}
function makeMelody(c){const r=rng(1234+(c%4)*97),m=[];let i=3;
 for(let b=0;b<8;b++){const row=[];for(let s=0;s<16;s+=2){const hit=(b%4===3&&s>8)?0:(s%4===0?.5:.32)>r();if(!hit){row.push(null);continue;}i=Math.max(0,Math.min(SCALE.length-1,i+[-2,-1,-1,0,1,1,2][Math.floor(r()*7)]));row.push(SCALE[i]);}m.push(row);}
 if(c%2)for(let b=0;b<4;b++)m[b+4]=m[b].slice();// 뒤 4마디는 앞 4마디를 되풀이해서 귀에 붙게
 return m;}
function playStep(t){const bar=Math.floor(step/16)%8,s=step%16,beat=s%4===0,[bass,pad]=CH[bar],intro=cycle===0&&step<32;
 if(s===0){for(const m of pad)for(const dt of [-6,6]){const o=ctx.createOscillator(),v=ctx.createGain(),fl=ctx.createBiquadFilter();o.type='triangle';o.frequency.value=mtof(m);o.detune.value=dt;fl.type='lowpass';fl.frequency.value=1500;
   v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(.022,t+.35);v.gain.setValueAtTime(.022,t+SPB*3.6);v.gain.linearRampToValueAtTime(0,t+SPB*4.3);o.connect(fl);fl.connect(v);v.connect(bgmBus);o.start(t);o.stop(t+SPB*4.4);}}
 // 베이스
 if(s===0||s===6||s===8||(s===14&&bar%2))tone(mtof(s===8?bass+7:bass),t,{dur:s===0?SPB*1.4:SPB*.7,g:.16,type:'triangle',a:.01,to:bgmBus,lp:700});
 if(!intro){
  if(s===0||s===8||(s===10&&bar%4===3))tone(110,t,{dur:.22,g:.32,f2:42,to:bgmBus});// 킥
  if(s===4||s===12)hiss(t,{dur:.12,g:.07,f:1900,q:.8,to:bgmBus});// 손뼉 같은 스네어
  hiss(t,{dur:s%2?.03:.05,g:s%4===2?.035:.018,type:'highpass',f:7500,to:bgmBus});// 찰랑이
 }
 if(s%2===0&&cycle+step/128>=.25){const n=mel[bar][s/2];if(n)keys(mtof(n),t,{dur:beat?.8:.5,g:beat?.055:.042});}
 step++;if(step%128===0){cycle++;mel=makeMelody(cycle);}}
function sched(){if(!ctx)return;const now=ctx.currentTime;if(next<now)next=now+.05;while(next<now+.25){playStep(next);next+=S16;}
 if(stopAt&&now>stopAt){clearInterval(timer);timer=0;stopAt=0;}}
function bgmStart(){if(!ac())return;stopAt=0;bgmBus.gain.cancelScheduledValues(ctx.currentTime);bgmBus.gain.setTargetAtTime(BGM_VOL,ctx.currentTime,.6);
 if(!timer){if(!mel){mel=makeMelody(0);step=0;cycle=0;}next=ctx.currentTime+.1;timer=setInterval(sched,40);}bgmOn=true;}
function bgmStop(){bgmOn=false;if(!ctx)return;bgmBus.gain.cancelScheduledValues(ctx.currentTime);bgmBus.gain.setTargetAtTime(0,ctx.currentTime,.25);stopAt=ctx.currentTime+1.2;}
function duck(sec){if(!bgmOn)return;const t=ctx.currentTime,g=bgmBus.gain;g.cancelScheduledValues(t);g.setTargetAtTime(BGM_VOL*.25,t,.05);g.setTargetAtTime(BGM_VOL,t+sec,.5);}

/* ---- 밖에서 쓰는 함수 ---- */
let unlocked=false;
function unlock(){if(unlocked)return;const c=ac();if(!c)return;unlocked=true;
 const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);// 아이폰 소리 잠금 풀기
 if(st.bgm)bgmStart();}
['pointerdown','touchend','keydown'].forEach(e=>addEventListener(e,unlock,{capture:true,passive:true}));
// 다른 앱으로 가거나 화면이 꺼지면 소리를 멈춰서 배터리를 아껴요
document.addEventListener('visibilitychange',()=>{if(!ctx)return;if(document.visibilityState==='visible'){ctx.resume().catch(()=>{});}else ctx.suspend().catch(()=>{});});

function play(name){if(!st.sfx||!SFX[name])return;const c=ac();if(!c||c.state!=='running'&&!unlocked)return;
 try{SFX[name](c.currentTime+.01);if(DUCK[name])duck(DUCK[name]);}catch(_){}}
function set(p){if(typeof p.sfx==='boolean')st.sfx=p.sfx;if(typeof p.bgm==='boolean'){st.bgm=p.bgm;if(p.bgm)bgmStart();else bgmStop();}save();}
window.BKSound={play,set,get:()=>({...st}),supported:!!(window.AudioContext||window.webkitAudioContext),list:Object.keys(SFX)};
})();

;/* ===== 러너 캐릭터(프로필) =====
 * 온라인 트랙의 3D 러너와 같은 모습을 2D SVG로 그려요. 순위표·반 소식처럼 여러 개가 한꺼번에 떠도 가벼워요.
 *
 *   BKAvatar.normalize(look)                → 빈칸을 채운 올바른 look
 *   BKAvatar.svg(look, color, size=40)      → SVG 문자열(color = 반 색 '#rrggbb', 티셔츠·'반 색' 액세서리에 써요)
 *   BKAvatar.editor(el, look, color, onChange) → 미리보기+칩 편집기, {destroy()} 를 돌려줘요
 *   BKAvatar.OPTIONS, BKAvatar.hex(kind, name) → 이름 → 색(hex)
 *
 * look(서버 profiles.look, jsonb): {"v":1,"hat":"러닝캡","hatC":"","face":"기본","hair":"앞머리","hairC":"갈색","skin":"보통"}
 * hatC가 빈 문자열이면 반 색이에요. 모르는 값은 기본값으로 바꿔요. */
(function(){
'use strict';
const OPTIONS={
 hat:['없음','러닝캡','선캡','헤어밴드','비니','고글'],
 hatC:[['','반 색'],['흰색','#ffffff'],['검정','#1b2333'],['라임','#cdf564'],['하늘','#8fd3ff'],['분홍','#ff9fc0'],['노랑','#ffd166']],
 face:['기본','웃음','신남','힘듦','땀뻘뻘','화남','멍'],
 hair:['짧은','앞머리','묶음','앞머리묶음'],
 hairC:[['검정','#1e1a19'],['갈색','#4a3226'],['밝은갈색','#8a5a3c'],['회색','#a3a3ab']],
 skin:[['밝은','#fde0c8'],['보통','#f8d3b0'],['구릿빛','#d9a27a']]};
const DEF={v:1,hat:'러닝캡',hatC:'',face:'기본',hair:'앞머리',hairC:'갈색',skin:'보통'};
const pairs=k=>OPTIONS[k].map(x=>x[0]);
function normalize(l){const o=l&&typeof l==='object'?l:{},r={v:1};
 const hat=o.hat==='선글라스'?'고글':o.hat;// 예전 이름
 r.hat=OPTIONS.hat.includes(hat)?hat:DEF.hat;
 r.hatC=pairs('hatC').includes(o.hatC)?o.hatC:DEF.hatC;
 r.face=OPTIONS.face.includes(o.face)?o.face:DEF.face;
 r.hair=OPTIONS.hair.includes(o.hair)?o.hair:DEF.hair;
 r.hairC=pairs('hairC').includes(o.hairC)?o.hairC:DEF.hairC;
 r.skin=pairs('skin').includes(o.skin)?o.skin:DEF.skin;
 return r;}
const hexOf=(k,n)=>{const f=OPTIONS[k].find(x=>x[0]===n);return f?f[1]:'';};
const okCol=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:'#8a94a6';
function shade(hex,t){const n=parseInt(hex.slice(1),16),f=s=>Math.max(0,Math.min(255,Math.round(((n>>s)&255)*(1+t))));return '#'+[16,8,0].map(s=>f(s).toString(16).padStart(2,'0')).join('');}

// 얼굴 부품(100×100 기준, 머리 중심 50,50 반지름 30)
const INK='#231a17',MOUTH='#7a3a2e';
function faceSvg(f){const eye=x=>`<ellipse cx="${x}" cy="53" rx="3.6" ry="4.8" fill="${INK}"/><circle cx="${x+1.3}" cy="51.2" r="1.3" fill="#fff"/>`;
 const happy=x=>`<path d="M${x-4} 54q4-5 8 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
 const blush=`<ellipse cx="34" cy="62" rx="5" ry="2.8" fill="#ff8fa3" opacity=".55"/><ellipse cx="66" cy="62" rx="5" ry="2.8" fill="#ff8fa3" opacity=".55"/>`;
 const smile=`<path d="M45 63q5 5 10 0" stroke="${MOUTH}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
 const grin=`<path d="M43.5 61.5h13q-1 8-6.5 8t-6.5-8z" fill="${MOUTH}"/><ellipse cx="50" cy="67" rx="3.4" ry="1.8" fill="#ff7a8a"/>`;
 const open=`<ellipse cx="50" cy="65" rx="3.6" ry="4.2" fill="${MOUTH}"/>`;
 const drop=(x,y,s)=>`<path d="M${x} ${y-5*s}q${4*s} ${6*s} 0 ${9*s}q${-4*s} ${-3*s} 0 ${-9*s}z" fill="#5cc6ff"/>`;
 switch(f){
  case '웃음':return happy(41)+happy(59)+blush+smile;
  case '신남':return happy(41)+happy(59)+blush+grin;
  case '힘듦':return `<path d="M38 50l5 3.5-5 3.5M62 50l-5 3.5 5 3.5" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`+open+drop(78,44,1.1)+drop(22,52,.8);
  case '땀뻘뻘':return eye(41)+eye(59)+blush+open+drop(79,40,1.3)+drop(21,50,1)+drop(70,30,.8);
  case '화남':return eye(41)+eye(59)+`<path d="M35 44l10 4M65 44l-10 4" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M45 66q5-5 10 0" stroke="${MOUTH}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  case '멍':return `<circle cx="41" cy="53" r="2.2" fill="${INK}"/><circle cx="59" cy="53" r="2.2" fill="${INK}"/><path d="M46 64h8" stroke="${MOUTH}" stroke-width="2" stroke-linecap="round"/>`;
  default:return eye(41)+eye(59)+blush+smile;}}
function hairBack(h,c){return h==='묶음'||h==='앞머리묶음'?`<circle cx="76" cy="30" r="9" fill="${c}"/><circle cx="71" cy="34" r="3" fill="${shade(c,-.25)}"/>`:'';}
function hairTop(h,c){let s=`<path d="M20.5 46a29.5 29.5 0 0 1 59 0q-6-12-29.5-12t-29.5 12z" fill="${c}"/>`;
 if(h==='앞머리'||h==='앞머리묶음')s+=`<path d="M27 40q10-12 23-12t23 12q-8-3-14-1q-4 4-9 4t-9-4q-6-2-14 1z" fill="${c}"/>`;return s;}
function hatSvg(k,c){const d=shade(c,-.18);
 switch(k){
  case '러닝캡':return `<path d="M20 42a30 28 0 0 1 60 0z" fill="${c}"/><path d="M20 42h60" stroke="${d}" stroke-width="2"/><ellipse cx="50" cy="44" rx="26" ry="5" fill="${d}"/><circle cx="50" cy="15" r="2.6" fill="${d}"/>`;
  case '선캡':return `<path d="M20 36h60v7H20z" fill="${c}"/><ellipse cx="50" cy="45" rx="29" ry="6" fill="${d}"/>`;
  case '헤어밴드':return `<path d="M21 37q29-9 58 0v6q-29-9-58 0z" fill="${c}"/>`;
  case '비니':return `<path d="M19 40a31 30 0 0 1 62 0z" fill="${c}"/><rect x="18" y="36" width="64" height="8" rx="4" fill="${d}"/><circle cx="50" cy="10" r="5" fill="#fff"/>`;
  case '고글':return `<path d="M20 52q30-5 60 0" stroke="${d}" stroke-width="5" fill="none"/>`+
   `<path d="M29 46q21-6 42 0q2 8-3 13q-6 3-12-1q-3-2-6-2t-6 2q-6 4-12 1q-5-5-3-13z" fill="${c}"/>`+
   `<path d="M32 48.5q18-5 36 0q1.5 6-2.5 9.5q-4.5 2-9-1q-3-2.5-6.5-2.5t-6.5 2.5q-4.5 3-9 1q-4-3.5-2.5-9.5z" fill="url(#g${c.slice(1)})"/>`+
   `<defs><linearGradient id="g${c.slice(1)}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fd6ff"/><stop offset=".45" stop-color="#3a4fd0"/><stop offset="1" stop-color="#b44fd6"/></linearGradient></defs>`+
   `<path d="M36 50.5l7-1.5M38 54l3-.6" stroke="#fff" stroke-width="1.6" opacity=".75" stroke-linecap="round"/>`;
  default:return '';}}
let uid=0;
function svg(look,color,size){const id='bkc'+(++uid),l=normalize(look),cc=okCol(color),sz=+size||40;
 const skin=hexOf('skin',l.skin),hair=hexOf('hairC',l.hairC),hatC=l.hatC?hexOf('hatC',l.hatC):cc;
 return `<svg class="bk-av" width="${sz}" height="${sz}" viewBox="0 0 100 100" aria-hidden="true">`+
  `<circle cx="50" cy="50" r="50" fill="${shade(cc,.82)}"/>`+
  `<clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath><g clip-path="url(#${id})">`+
  `<path d="M16 104q2-24 34-24t34 24z" fill="${cc}"/>`+
  hairBack(l.hair,hair)+
  `<ellipse cx="20.5" cy="54" rx="4" ry="6" fill="${skin}"/><ellipse cx="79.5" cy="54" rx="4" ry="6" fill="${skin}"/>`+
  `<circle cx="50" cy="50" r="30" fill="${skin}"/>`+hairTop(l.hair,hair)+faceSvg(l.face)+hatSvg(l.hat,hatC)+`</g></svg>`;}

// 편집기: 라이트(앱)·다크(트랙) 어디서나 보이게 반투명 칩
const CSS=`.bka{color:inherit}.bka-pv{display:flex;justify-content:center;margin:4px 0 6px}
.bka-cat{font-size:13px;font-weight:700;opacity:.7;margin:12px 0 6px}
.bka-row{display:flex;flex-wrap:wrap;gap:6px}
.bka-row button{font:inherit;font-size:15px;font-weight:600;color:inherit;border:0;border-radius:999px;padding:9px 13px;background:rgba(127,127,127,.16);cursor:pointer}
.bka-row button[aria-pressed=true]{background:#cdf564;color:#1c2a05}
.bka-row.bka-sw button{width:36px;height:36px;padding:0;border:2px solid rgba(127,127,127,.35)}
.bka-row.bka-sw button[aria-pressed=true]{outline:3px solid #cdf564;outline-offset:2px}`;
function ensureCss(){if(document.getElementById('bka-css'))return;const s=document.createElement('style');s.id='bka-css';s.textContent=CSS;document.head.appendChild(s);}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function editor(el,look,color,onChange){ensureCss();let l=normalize(look);const cc=okCol(color);
 const chips=(k,list)=>`<div class="bka-row">${list.map(v=>`<button type="button" data-k="${k}" data-v="${esc(v)}" aria-pressed="${l[k]===v}">${esc(v)}</button>`).join('')}</div>`;
 const sw=(k)=>`<div class="bka-row bka-sw">${OPTIONS[k].map(([n,h])=>`<button type="button" data-k="${k}" data-v="${esc(n)}" aria-label="${esc(n||'반 색')}" aria-pressed="${l[k]===n}" style="background:${n?h:cc}"></button>`).join('')}</div>`;
 const draw=()=>{el.innerHTML=`<div class="bka"><div class="bka-pv">${svg(l,cc,96)}</div>
  <div class="bka-cat">머리 액세서리</div>${chips('hat',OPTIONS.hat)}
  <div class="bka-cat">액세서리 색</div>${sw('hatC')}
  <div class="bka-cat">표정</div>${chips('face',OPTIONS.face)}
  <div class="bka-cat">머리 모양</div>${chips('hair',OPTIONS.hair)}
  <div class="bka-cat">머리색</div>${sw('hairC')}
  <div class="bka-cat">피부</div>${sw('skin')}</div>`;};
 const onClick=e=>{const b=e.target.closest('button[data-k]');if(!b||!el.contains(b))return;e.stopPropagation();
  l=normalize({...l,[b.dataset.k]:b.dataset.v});draw();if(typeof onChange==='function')onChange({...l});};
 el.addEventListener('click',onClick);draw();
 return {destroy(){el.removeEventListener('click',onClick);el.innerHTML='';},get look(){return {...l};}};}

window.BKAvatar={OPTIONS,DEFAULT:{...DEF},normalize,svg,editor,hex:hexOf};
})();

;'use strict';
/* ===== 러닝 BK 챌린지 =====
 * window.BK_CONFIG({url, anonKey})와 supabase-js가 있으면 실제 서버(Supabase)에 연결하고,
 * 없으면 서버와 같은 모양의 시연 데이터로 움직여요(단일 HTML 미리보기). */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(Number(n).toFixed(2)).toLocaleString('en-US',{maximumFractionDigits:2});
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const CFG=window.BK_CONFIG||null;
const LIVE=!!(CFG&&CFG.url&&CFG.anonKey&&window.supabase&&window.supabase.createClient);
const sb=LIVE?window.supabase.createClient(CFG.url,CFG.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'bk-auth'}}):null;

/* ===== 날짜 (모든 날짜는 한국 시간 기준 'YYYY-MM-DD') ===== */
const addDays=(d,n)=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);};
const dow=d=>new Date(d+'T00:00:00Z').getUTCDay();
const monday=d=>addDays(d,-((dow(d)+6)%7));
const between=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/864e5);
const kst=iso=>{const s=new Date(Date.parse(iso)+9*3600e3).toISOString();return {date:s.slice(0,10),time:s.slice(11,16)};};
const md=d=>`${+d.slice(5,7)}월 ${+d.slice(8,10)}일`;
const mds=d=>`${+d.slice(5,7)}.${+d.slice(8,10)}`;
const WD='일월화수목금토';
const dur=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return [h?h+'시간':'',m?m+'분':'',x?x+'초':''].filter(Boolean).join(' ')||'0분';};
const clock=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60,p=n=>String(n).padStart(2,'0');return h?`${h}:${p(m)}:${p(x)}`:`${m}:${p(x)}`;};
// 사진에 적힌 페이스(저장된 값)가 있으면 그대로, 없으면 시간÷거리로 보여 줘요.
const pace=(s,km,stored)=>{if(!(stored>0)&&(!(km>0)||!(s>0)))return '';const p=stored>0?stored:Math.round(s/km);return `${Math.floor(p/60)}'${String(p%60).padStart(2,'0')}"/km`;};
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
const ini=(s,n=1)=>Array.from(String(s||'').replace(/\s+/g,'')).slice(0,n).join('')||'?';
const col=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:'#8a94a6';
function mix(hex,to,t){const a=parseInt(col(hex).slice(1),16),b=parseInt(to.slice(1),16),ch=s=>Math.round(((a>>s)&255)*(1-t)+((b>>s)&255)*t);return '#'+[16,8,0].map(s=>ch(s).toString(16).padStart(2,'0')).join('');}

/* ===== 아이콘 (선 아이콘, 24px 격자) ===== */
const I={
 track:'<rect x="3" y="6.5" width="18" height="11" rx="5.5"/><rect x="7" y="10" width="10" height="4" rx="2"/>',
 sound:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/>',
 music:'<path d="M9 17.5V6.2l10-2.2v11.5"/><circle cx="6.6" cy="17.6" r="2.4"/><circle cx="16.6" cy="15.6" r="2.4"/>',
 home:'<path d="M4 10.4 12 4l8 6.4V19a1 1 0 0 1-1 1h-4.6v-5.6H9.6V20H5a1 1 0 0 1-1-1Z"/>',
 flag:'<path d="M5.5 21V4"/><path d="M5.5 4.6h11.4l-2.4 4.3 2.4 4.3H5.5"/>',
 trophy:'<path d="M7.5 4h9v5.2a4.5 4.5 0 0 1-9 0Z"/><path d="M16.5 5.8h2.8v1a3.4 3.4 0 0 1-3.2 3.4M7.5 5.8H4.7v1a3.4 3.4 0 0 0 3.2 3.4M12 13.7v3.3M8.5 20.3h7"/>',
 user:'<circle cx="12" cy="8.4" r="3.7"/><path d="M4.9 20a7.1 7.1 0 0 1 14.2 0"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 bell:'<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.6H5Z"/><path d="M10.2 20.5a2 2 0 0 0 3.6 0"/>',
 check:'<path d="m5 12.6 4.6 4.6L19 7.8"/>',
 chev:'<path d="m9.5 6 6 6-6 6"/>',
 left:'<path d="m14.5 6-6 6 6 6"/>',
 play:'<path d="M8 5.8v12.4a.6.6 0 0 0 .9.5l10-6.2a.6.6 0 0 0 0-1l-10-6.2a.6.6 0 0 0-.9.5Z" fill="currentColor" stroke="none"/>',
 down:'<path d="M12 4v11.5M7 11l5 5 5-5M5 20h14"/>',
 x:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
 crown:'<path d="M3.5 8.5 8 12.2 12 6l4 6.2 4.5-3.7-1.8 9.5H5.3Z" fill="currentColor" stroke="none"/>',
 flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>',
 sunrise:'<path d="M12 3.5v3.5M5.6 8.6l1.8 1.8M18.4 8.6l-1.8 1.8M3.5 16h2.2M18.3 16h2.2M7.2 16a4.8 4.8 0 0 1 9.6 0M3.5 19.8h17"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
 camera:'<path d="M4 8.6A1.6 1.6 0 0 1 5.6 7h2.1l1.6-2.3h5.4L16.3 7h2.1A1.6 1.6 0 0 1 20 8.6v9a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.6Z"/><circle cx="12" cy="12.9" r="3.3"/>',
 image:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.6"/><circle cx="9" cy="9.6" r="1.7"/><path d="m20.5 15.2-4.6-4.4-8.6 8.7"/>',
 hand:'<path d="M18 11V6a2 2 0 0 0-4 0"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
 trend:'<path d="m3.5 17 6-6 4 4 7-7.5"/><path d="M15.2 7.5h5.3v5.3"/>',
 cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.6"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
 up:'<path d="m6 17.5 6-6 6 6M6 11.5l6-6 6 6"/>',
 medal:'<circle cx="12" cy="15" r="5.2"/><path d="M8.6 10.9 6.2 3.8h3.9L12 8.5l1.9-4.7h3.9l-2.4 7.1"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.6V12l3 2"/>',
 star:'<path d="m12 3.8 2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.6-5 2.6 1-5.6-4.1-4 5.6-.8Z"/>',
 shield:'<path d="M12 3.5 19 6v5.6c0 4.3-2.9 7.6-7 8.9-4.1-1.3-7-4.6-7-8.9V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
 logout:'<path d="M14.5 4.5H18a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-3.5"/><path d="M10 8l-4 4 4 4M6 12h9.5"/>',
 copy:'<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
 key:'<circle cx="8" cy="15" r="3.6"/><path d="m10.6 12.4 8.4-8.4M16 7l2.5 2.5M13.8 9.2l2 2"/>',
 alert:'<path d="M12 4 21 19.5H3Z"/><path d="M12 10v4.2M12 17.2v.1"/>',
 refresh:'<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>'
};
const icon=(n,c='')=>`<svg class="i${c?' '+c:''}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const tg=t=>`<span class="tg">${t}</span>`;

/* ===== 상태 =====
 * D: 서버(app_bootstrap)에서 받은 데이터를 화면용으로 정리한 것. S: 화면 상태. */
const S={view:'loading',page:'home',rank:'distance',meTab:'log',calMonth:null,files:[],submitKey:null,busy:false,seen:null,gate:'',err:'',
 admin:{tab:'queue',queue:null,recent:null,members:null,settings:null,loading:false,at:0},photo:{},authMode:'login',classes:null,loadedAt:0,stale:false};
let D=null,_g=null;
const touch=()=>{_g=null;};
function normRun(r){const k=kst(r.started_at);return {id:r.id,key:r.submit_key,date:r.run_date||k.date,time:k.time,m:r.distance_m,distance:r.distance_m/1000,duration:r.duration_s,pace:r.pace_s||null,type:r.kind,memo:r.memo||'',photos:r.photos||[],status:r.status,note:r.review_note||'',reviewedAt:r.reviewed_at||'',createdAt:r.created_at||''};}
function applyBoot(j){
 const st=j.settings||{},meta={};(j.classes||[]).forEach(c=>meta[c.id]=c);
 D={me:j.profile,today:st.today,time:st.race_metric==='time',season:{name:st.season_name||'러닝BK 챌린지',start:st.season_start,end:st.season_end,window:st.submit_window_days||7,grace:st.grace_days||0},
  classMeta:meta,classList:(j.classes||[]).slice().sort((a,b)=>a.sort-b.sort),
  classes:(j.standings||[]).map(s=>({id:s.class_id,name:s.name,color:col(s.color),sort:(meta[s.class_id]||{}).sort||0,members:+s.members||0,m:+s.total_m||0,runnersToday:+s.runners_today||0,todayM:+s.today_m||0,mine:!!j.profile&&s.class_id===j.profile.class_id})),
  players:(j.leaderboard||[]).map(p=>({id:p.user_id,name:p.nickname,cls:p.class_id,distance:st.race_metric==='time'?p.total_m/3600:p.total_m/1000,days:p.cert_days,streak:p.best_streak,cur:p.current_streak,runs:p.run_count,me:!!p.is_me})),
  feed:(j.feed||[]).map(f=>({id:f.run_id,user:f.user_id,name:f.nickname,date:f.run_date,km:f.distance_m/1000,cheers:+f.cheer_count||0,on:!!f.cheered_by_me,mine:!!f.is_mine})),
  runs:(j.my_runs||[]).map(normRun),
  cheers:(j.my_cheers||[]).map(c=>({run:c.run_id,date:c.cheer_date})),
  claims:(j.my_claims||[]).map(c=>({q:c.quest_id,p:c.period_key,xp:+c.xp||0})),
  daily:(j.class_daily||[]).map(x=>({cls:x.class_id,date:x.run_date,m:+x.meters||0}))};
 touch();S.loadedAt=Date.now();
 if(D.me){const c=ccol(D.me.class_id),r=document.documentElement.style;r.setProperty('--mc',c);r.setProperty('--mc-soft',mix(c,'#ffffff',.86));r.setProperty('--mc-ink',mix(c,'#000000',.38));}
}
const cname=id=>(D&&D.classMeta[id]||{}).name||'';
// 캐릭터 얼굴(avatar.js). 없거나 그리기 실패하면 이니셜을 그대로 써요.
const lookOf=uid=>(S.looks||{})[uid]||null;
const AV=()=>window.BKAvatar&&typeof window.BKAvatar.svg==='function';
function faceSvg(uid,cls,size){if(!AV())return '';try{return window.BKAvatar.svg(lookOf(uid),ccol(cls),size)||'';}catch(_){return '';}}
const faceIn=(uid,cls,txt,size=40)=>faceSvg(uid,cls,size)||txt;
const ccol=id=>col((D&&D.classMeta[id]||{}).color);
const avStyle=id=>{const c=ccol(id);return `background:${mix(c,'#ffffff',.86)};color:${mix(c,'#000000',.38)}`;};
const isStaff=()=>!!(D&&D.me&&D.me.status==='active'&&(D.me.role==='admin'||D.me.role==='reviewer'));
const isAdmin=()=>!!(D&&D.me&&D.me.status==='active'&&D.me.role==='admin');
const inSeason=d=>d>=D.season.start&&d<=D.season.end;
const seasonState=()=>D.today<D.season.start?'before':D.today>D.season.end?'after':'on';
const canSubmit=()=>D.today>=D.season.start&&D.today<=addDays(D.season.end,D.season.grace);
const submitMin=()=>{const a=addDays(D.today,-D.season.window);return a>D.season.start?a:D.season.start;};
const submitMax=()=>D.today<D.season.end?D.today:D.season.end;

/* ===== 서버 연결 =====
 * 실제 서버와 시연 데이터가 같은 함수 이름·같은 응답 모양을 쓰도록 맞춰 두었어요. */
function liveApi(){
 const rpc=async(fn,args)=>{const {data,error}=await sb.rpc(fn,args||{});if(error)throw error;return data;};
 const isDup=e=>String(e&&e.statusCode)==='409'||(e&&e.status)===409||/already exists|duplicate/i.test(e&&e.message||'');
 async function fnErr(error){let body=null;try{body=await error.context.json();}catch(_){}const e=new Error(body&&body.message||'서버와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');e.hint=body&&body.code;return e;}
 function authErr(error){const m=error&&error.message||'';const e=new Error(/invalid login credentials/i.test(m)?'이메일 또는 비밀번호가 맞지 않아요.':/email not confirmed/i.test(m)?'이메일 확인이 끝나지 않은 계정이에요. 운영진에게 문의해 주세요.':/rate limit|too many/i.test(m)||error.status===429?'시도가 너무 많아요. 잠시 후 다시 시도해 주세요.':/should be different/i.test(m)?'지금 쓰는 비밀번호와 다른 비밀번호를 입력해 주세요.':/password/i.test(m)?'비밀번호가 너무 단순해요. 더 길고 복잡하게 입력해 주세요.':m||'로그인하지 못했어요.');e.hint=error&&error.code;return e;}
 return {
  async session(){const {data}=await sb.auth.getSession();return data.session;},
  boot:()=>rpc('app_bootstrap'),
  claim:(q,p)=>rpc('claim_quest',{p_quest_id:q,p_period:p}),
  cheer:id=>rpc('toggle_cheer',{p_run_id:id}),
  memberRuns:id=>rpc('member_runs',{p_user_id:id}),
  looks:()=>rpc('member_looks'),
  trackXp:k=>rpc('claim_track_xp',{p_kind:k}),
  setLook:l=>rpc('set_my_look',{p_look:l}),
  withdraw:id=>rpc('withdraw_run',{p_run_id:id}),
  async submit({key,date,time,distance_m,duration_s,kind,memo,files,fromPhoto,pace_s,progress}){
   const paths=[];
   for(let i=0;i<files.length;i++){
    progress(`사진 올리는 중 ${i+1}/${files.length}`);
    const path=`${D.me.id}/${key}/${i+1}.jpg`,blob=await toJpeg(files[i]);
    const {error}=await sb.storage.from('evidence').upload(path,blob,{contentType:'image/jpeg',upsert:false});
    if(error&&!isDup(error))throw error;
    paths.push(path);
   }
   progress('기록 보내는 중');
   return rpc('submit_run',{p_submit_key:key,p_started_at:`${date}T${time}:00+09:00`,p_distance_m:distance_m,p_duration_s:duration_s,p_kind:kind,p_memo:memo||null,p_photos:paths,p_from_photo:!!fromPhoto,p_pace_s:pace_s||null});
  },
  async photoUrls(paths){const {data,error}=await sb.storage.from('evidence').createSignedUrls(paths,3600);if(error)throw error;return data.map(x=>({path:x.path,url:x.signedUrl}));},
  review:(id,dec,note,exp)=>rpc('review_run',{p_run_id:id,p_decision:dec,p_note:note||null,p_expected_status:exp||null}),
  queue:()=>rpc('admin_review_queue'),
  recent:()=>rpc('admin_recent_reviewed',{p_limit:30}),
  paces:ids=>rpc('admin_run_paces',{p_ids:ids}),
  members:()=>rpc('admin_members'),
  setMember:(id,p)=>rpc('admin_set_member',{p_user_id:id,p_status:p.status??null,p_class_id:p.class_id??null,p_role:p.role??null,p_is_runner:p.is_runner??null}),
  getSettings:()=>rpc('admin_get_settings'),
  saveSettings:s=>rpc('admin_update_settings',{p_invite_code:s.invite_code,p_season_name:s.season_name,p_season_start:s.season_start,p_season_end:s.season_end,p_submit_window_days:s.submit_window_days,p_grace_days:s.grace_days,p_auto_approve:!!s.auto_approve}),
  exportRuns:()=>rpc('admin_export_runs'),
  async resetPassword(id,pw){const {data,error}=await sb.functions.invoke('admin-tools',{body:{action:'reset_password',user_id:id,new_password:pw}});if(error)throw await fnErr(error);return data;},
  async login(email,password){const {error}=await sb.auth.signInWithPassword({email,password});if(error)throw authErr(error);},
  async signup(body){const {data,error}=await sb.functions.invoke('signup',{body});if(error)throw await fnErr(error);return data;},
  async logout(){await sb.auth.signOut();},
  async changePassword(pw){const {error}=await sb.auth.updateUser({password:pw});if(error)throw authErr(error);},
  async classes(){const {data,error}=await sb.from('classes').select('id,name,sort,color').order('sort');if(error)throw error;return data;}
 };
}
async function toJpeg(file){const url=URL.createObjectURL(file),img=new Image();try{await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=url;});const r=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*r));c.height=Math.max(1,Math.round(img.naturalHeight*r));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);return await new Promise((ok,no)=>c.toBlob(b=>b?ok(b):no(new Error('사진을 변환하지 못했어요. 다른 사진으로 시도해 주세요.')),'image/jpeg',.82));}finally{URL.revokeObjectURL(url);}}

/* ===== 시연 데이터 (서버 응답과 같은 모양) ===== */
let DB=null;
function demoShot(o){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="390" height="700" viewBox="0 0 390 700"><rect width="390" height="700" fill="#101418"/><text x="28" y="64" fill="#8f9aa6" font-size="19" font-family="sans-serif">${o.date} ${o.start}</text><text x="28" y="100" fill="#fff" font-size="24" font-weight="700" font-family="sans-serif">${o.title}</text><text x="28" y="250" fill="#d4ff3f" font-size="96" font-weight="800" font-family="sans-serif">${o.km}</text><text x="30" y="290" fill="#8f9aa6" font-size="22" font-family="sans-serif">킬로미터</text><text x="28" y="380" fill="#fff" font-size="36" font-weight="700" font-family="sans-serif">${o.time}</text><text x="30" y="412" fill="#8f9aa6" font-size="18" font-family="sans-serif">시간</text><text x="210" y="380" fill="#fff" font-size="36" font-weight="700" font-family="sans-serif">${o.pace}</text><text x="212" y="412" fill="#8f9aa6" font-size="18" font-family="sans-serif">평균 페이스</text><path d="M40 600 C 110 470, 170 640, 240 520 S 330 470, 350 560" stroke="#d4ff3f" stroke-width="6" fill="none" stroke-linecap="round"/><text x="28" y="676" fill="#5f6b77" font-size="15" font-family="sans-serif">시연용 예시 캡처</text></svg>`;return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
function demoDB(){
 const T='2026-10-15',at=(d,t)=>`${d}T${t}:00+09:00`,day=n=>`2026-10-${String(n).padStart(2,'0')}`;
 const classes=[['hanam','하남','#F2734B'],['saebyeok','새벽','#1FA37A'],['jamsil','잠실','#D9488F'],['yeouido','여의도','#7B61FF']].map(([id,name,color],i)=>({id,name,sort:i+1,color}));
 const tot={hanam:884000,saebyeok:862000,jamsil:816000,yeouido:789000},last2={hanam:[20000,14000],saebyeok:[33000,24000],jamsil:[4000,3000],yeouido:[3000,2000]};
 // 10.01~10.13은 요일별 가중치로 나누고, 10.14에 새벽반이 잠실반을 추월하도록 만든 시연용 일별 거리
 const W=[1,1.15,.9,1.2,1,.85,1.1,1,.95,1.2,1.05,1.1,.9],rot={hanam:0,saebyeok:5,jamsil:5,yeouido:9},class_daily=[];
 for(const c of classes){const rest=tot[c.id]-last2[c.id][0]-last2[c.id][1],w=W.map((_,i)=>W[(i+rot[c.id])%13]),sw=w.reduce((a,b)=>a+b,0);let acc=0;
  for(let i=0;i<13;i++){const m=i<12?Math.round(rest*w[i]/sw):rest-acc;acc+=m;class_daily.push({class_id:c.id,run_date:day(i+1),meters:m});}
  class_daily.push({class_id:c.id,run_date:day(14),meters:last2[c.id][0]},{class_id:c.id,run_date:day(15),meters:last2[c.id][1]});}
 class_daily.sort((a,b)=>a.run_date.localeCompare(b.run_date)||a.class_id.localeCompare(b.class_id));
 const runners_today={hanam:3,saebyeok:4,jamsil:1,yeouido:1};
 const standings=classes.map(c=>({class_id:c.id,name:c.name,color:c.color,members:10,total_m:tot[c.id],avg_m:tot[c.id]/10,rank:0,runners_today:runners_today[c.id],today_m:last2[c.id][1]}));
 const run=(id,d,t,m,s,o={})=>({id,user_id:'me',submit_key:'k-'+id,started_at:at(d,t),run_date:d,distance_m:m,duration_s:s,kind:'실외 러닝',memo:null,photos:[],status:'approved',review_note:null,reviewed_by:'u2',reviewed_at:at(d,'09:10'),created_at:at(d,'07:05'),updated_at:at(d,'09:10'),...o});
 const my_runs=[['15',7500,45],['14',19500,121],['13',14000,86],['11',15000,93],['09',12500,76],['08',16000,99],['07',8300,51],['05',14000,85],['04',18000,110],['03',10000,60],['02',15200,92],['01',12100,74]].map(([d,m,min],i)=>run('a'+i,`2026-10-${d}`,'06:30',m,min*60));
 my_runs.splice(1,0,run('p1','2026-10-14','19:20',6200,2280,{status:'pending',reviewed_by:null,reviewed_at:null,created_at:at('2026-10-14','20:00'),photos:['demo/p1/1.jpg']}));
 const P=[['u1','도윤','hanam',231200,15,9,9],['u2','민지','saebyeok',218400,14,8,8],['u3','서연','hanam',205700,13,6,4],['u4','준호','saebyeok',198100,13,6,6],['u5','수아','saebyeok',187400,12,5,5],['u6','지호','jamsil',176300,12,7,2],['u7','유나','yeouido',169800,11,4,4],['me','BK 러너','saebyeok',162100,12,5,3],['u8','하은','jamsil',150900,10,4,1],['u9','시우','yeouido',142500,9,3,0],['u10','현우','saebyeok',96000,9,4,2]];
 const leaderboard=P.map(([user_id,nickname,class_id,total_m,cert_days,best_streak,current_streak])=>({user_id,nickname,class_id,total_m,cert_days,best_streak,current_streak,run_count:cert_days,last_run_date:T,is_me:user_id==='me'}));
 const F=[['f1','u2','민지',T,6000,1],['f2','u4','준호',T,5500,0],['f3','u5','수아',T,5000,2],['a0','me','BK 러너',T,7500,2],['a1','me','BK 러너','2026-10-14',19500,3],['f4','u2','민지','2026-10-14',7500,2],['f5','u10','현우','2026-10-14',6000,1],['f6','u4','준호','2026-10-13',10200,2]];
 const feed=F.map(([run_id,user_id,nickname,run_date,distance_m,cheer_count])=>({run_id,user_id,nickname,run_date,distance_m,cheer_count,cheered_by_me:false,is_mine:user_id==='me'}));
 const q=(id,user_id,nickname,class_id,d,t,m,s,o={})=>({id,user_id,nickname,class_id,submit_key:'k-'+id,started_at:at(d,t),run_date:d,distance_m:m,duration_s:s,kind:'실외 러닝',memo:null,photos:[`demo/${id}/1.jpg`],status:'pending',review_note:null,reviewed_by:null,reviewed_at:null,created_at:at(d,t),updated_at:at(d,t),dup_suspect:false,user_approved_count:12,is_mine:false,...o});
 const queue=[q('p1','me','BK 러너','saebyeok','2026-10-14','19:20',6200,2280,{created_at:at('2026-10-14','20:00'),is_mine:true}),
  q('q3','u11','태오','hanam','2026-10-14','20:05',5100,1850,{kind:'트레드밀 러닝',memo:'헬스장 트레드밀이라 지도 기록이 없어요.',created_at:at('2026-10-14','20:50'),user_approved_count:0}),
  q('q1','u2','민지','saebyeok',T,'05:58',8400,2830,{created_at:at(T,'06:55'),user_approved_count:14}),
  q('q2','u1','도윤','hanam',T,'06:10',12000,3900,{memo:'한강 반포 코스',photos:['demo/q2/1.jpg','demo/q2/2.jpg'],created_at:at(T,'07:20'),dup_suspect:true,user_approved_count:15})];
 const recent=[q('r1','u4','준호','saebyeok',T,'06:05',5500,1980,{status:'approved',reviewed_at:at(T,'08:40'),reviewer_nickname:'BK 러너'}),
  q('r2','u5','수아','saebyeok',T,'06:20',5000,1830,{status:'approved',reviewed_at:at(T,'08:35'),reviewer_nickname:'BK 러너'}),
  q('r3','u9','시우','yeouido','2026-10-13','19:00',3200,1260,{status:'rejected',review_note:'사진 속 날짜가 10월 12일이에요. 그 날짜로 다시 올려 주세요.',reviewed_at:at('2026-10-14','09:00'),reviewer_nickname:'민지'})];
 const photos={};
 for(const r of [...queue,...recent])r.photos.forEach((p,i)=>{const k=kst(r.started_at);photos[p]=demoShot({date:k.date.replace(/-/g,'.'),start:k.time,title:i?'구간 기록':r.kind,km:(r.distance_m/1000).toFixed(2),time:clock(r.duration_s),pace:pace(r.duration_s,r.distance_m/1000,r.pace_s).replace('/km','')});});
 const mem=(id,nickname,email,class_id,role,status,n,c)=>({id,nickname,email,class_id,role,status,is_runner:true,created_at:at(c,'10:00'),approved_at:status==='active'?at(c,'12:00'):null,approved_by:status==='active'?'me':null,approved_run_count:n});
 const members=[mem('n1','지훈','jihoon@example.com','hanam','member','pending',0,'2026-10-15'),mem('n2','소윤','soyoon@example.com','jamsil','member','pending',0,'2026-10-14'),
  mem('me','BK 러너','bk@example.com','saebyeok','admin','active',12,'2026-09-28'),mem('u2','민지','minji@example.com','saebyeok','reviewer','active',14,'2026-09-28'),mem('u1','도윤','doyun@example.com','hanam','member','active',15,'2026-09-29'),
  mem('u11','태오','taeo@example.com','hanam','member','active',0,'2026-10-13'),mem('u6','지호','jiho@example.com','jamsil','member','active',12,'2026-09-29'),mem('u7','유나','yuna@example.com','yeouido','member','active',11,'2026-09-30'),mem('u9','시우','siwoo@example.com','yeouido','member','active',9,'2026-09-30')];
 return {profile:{id:'me',nickname:'BK 러너',class_id:'saebyeok',role:'admin',status:'active',is_runner:true},
  settings:{race_metric:'time',season_name:'10월 시즌',season_start:'2026-10-01',season_end:'2026-10-31',submit_window_days:7,grace_days:3,today:T},
  classes,standings,class_daily,leaderboard,feed,my_runs,my_cheers:[],my_claims:[],queue,recent,members,photos,
  admin_settings:{id:1,invite_code:'BK2026',season_name:'10월 시즌',season_start:'2026-10-01',season_end:'2026-10-31',submit_window_days:7,grace_days:3,auto_approve:true}};
}
function demoApi(){
 const wait=(v,ms=120)=>new Promise(r=>setTimeout(()=>r(JSON.parse(JSON.stringify(v))),ms));
 const fail=(hint,message)=>new Promise((_,no)=>setTimeout(()=>no(Object.assign(new Error(message),{hint})),120));
 const XP={d_5k:60,d_submit:30,d_cheer2:40,w_30k:150,w_dawn3:100,w_cert4:120};
 return {
  session:async()=>({demo:true}),
  boot:()=>{const k=['profile','settings','classes','standings','class_daily','leaderboard','feed','my_runs','my_cheers','my_claims'],o={};k.forEach(x=>o[x]=DB[x]);
   // 시연 데이터는 거리로 만들어 두었어요. 시간 대결이면 6분/k로 바꿔 초 단위로 보내요(서버와 같은 모양).
   if(DB.settings.race_metric==='time'){const t=v=>Math.round(v*.36);o.standings=o.standings.map(x=>({...x,total_m:t(x.total_m),today_m:t(x.today_m)}));o.class_daily=o.class_daily.map(x=>({...x,meters:t(x.meters)}));o.leaderboard=o.leaderboard.map(x=>({...x,total_m:t(x.total_m)}));}
   return wait(o,60);},
  claim(q,p){if(DB.my_claims.some(c=>c.quest_id===q&&c.period_key===p))return fail('already_claimed','이미 받은 보상이에요.');const r={quest_id:q,period_key:p,xp:XP[q]};DB.my_claims.push(r);return wait(r);},
  cheer(id){const f=DB.feed.find(x=>x.run_id===id)||(DB.mruns||[]).find(x=>x.run_id===id);if(!f)return fail('not_found','기록을 찾을 수 없습니다.');f.cheered_by_me=!f.cheered_by_me;f.cheer_count+=f.cheered_by_me?1:-1;
   DB.my_cheers=DB.my_cheers.filter(c=>c.run_id!==id);if(f.cheered_by_me)DB.my_cheers.unshift({run_id:id,cheer_date:DB.settings.today});return wait({cheered:f.cheered_by_me,count:f.cheer_count});},
  trackXp(k){const q=k==='enter'?'t_enter':'t_five',p=D.today;let c=DB.my_claims.find(x=>x.quest_id===q&&x.period_key===p);const cur=c?c.xp:0;
   const due=k==='enter'?(cur?0:3):(cur<5?1:0);if(!due)return wait({quest_id:q,period_key:p,xp:0,total:cur});
   if(!c){c={quest_id:q,period_key:p,xp:0};DB.my_claims.push(c);}c.xp=cur+due;return wait({quest_id:q,period_key:p,xp:due,total:c.xp});},
  looks:()=>wait(Object.entries(DB.looks||{}).map(([user_id,look])=>({user_id,look}))),
  setLook(l){DB.looks=DB.looks||{};if(l)DB.looks.me=l;else delete DB.looks.me;return wait(l);},
  memberRuns(uid){const p=DB.leaderboard.find(x=>x.user_id===uid);if(!p)return wait([]);DB.mruns=DB.mruns||[];
   if(!DB.mruns.some(x=>x.user_id===uid)){const own=DB.feed.filter(f=>f.user_id===uid),n=Math.max(0,Math.min(6,(p.cert_days||0)-own.length));
    own.forEach(f=>DB.mruns.push({...f,class_id:p.class_id,duration_s:Math.round(f.distance_m*.36),pace_s:null,kind:'실외 러닝'}));
    for(let i=0;i<n;i++){const m=5000+((i*1700+uid.length*900)%4000);DB.mruns.push({run_id:`m-${uid}-${i}`,user_id:uid,nickname:p.nickname,class_id:p.class_id,run_date:addDays(DB.settings.today,-2-i*2),distance_m:m,duration_s:Math.round(m*.34),pace_s:null,kind:'실외 러닝',cheer_count:i%3,cheered_by_me:false,is_mine:uid==='me'});}}
   return wait(DB.mruns.filter(x=>x.user_id===uid).sort((a,b)=>b.run_date.localeCompare(a.run_date)));},
  withdraw(id){const r=DB.my_runs.find(x=>x.id===id);if(!r)return fail('not_found','기록을 찾을 수 없습니다.');if(r.status!=='pending')return fail('conflict','확인 대기 중인 기록만 취소할 수 있습니다.');r.status='withdrawn';DB.queue=DB.queue.filter(x=>x.id!==id);return wait(r);},
  submit({key,date,time,distance_m,duration_s,kind,memo,files,fromPhoto,pace_s}){const ex=DB.my_runs.find(x=>x.submit_key===key);if(ex)return wait(ex);if(duration_s*1000>510*distance_m||pace_s>510)return fail('too_slow','평균 페이스가 8분 30초보다 느린 기록은 등록할 수 없어요.');
   const now=new Date().toISOString(),r={id:'n'+Date.now(),user_id:'me',submit_key:key,started_at:`${date}T${time}:00+09:00`,run_date:date,distance_m,duration_s,pace_s:pace_s||null,kind,memo:memo||null,photos:files.map((f,i)=>`demo/${key}/${i+1}.jpg`),status:'pending',review_note:null,reviewed_by:null,reviewed_at:null,created_at:now,updated_at:now};
   r.photos.forEach((p,i)=>DB.photos[p]=URL.createObjectURL(files[i]));DB.my_runs.unshift(r);
   if(DB.admin_settings.auto_approve){Object.assign(r,{status:'approved',reviewed_at:now});return wait(r,500);}
   DB.queue.push({...r,nickname:DB.profile.nickname,class_id:DB.profile.class_id,dup_suspect:false,user_approved_count:12,is_mine:true});return wait(r,500);},
  photoUrls:paths=>wait(paths.map(p=>({path:p,url:DB.photos[p]||null}))),
  review(id,dec,note,exp){const r=DB.queue.find(x=>x.id===id)||DB.recent.find(x=>x.id===id);if(!r)return fail('not_found','기록을 찾을 수 없습니다.');
   if(r.user_id==='me')return fail('own_run','본인 기록은 직접 검토할 수 없습니다. 다른 운영진에게 요청해 주세요.');
   const ok=r.status==='pending'||(r.status==='approved'&&dec==='rejected')||(r.status==='rejected'&&dec==='approved');
   if((exp&&r.status!==exp)||!ok)return fail('conflict','이미 처리되었거나 상태가 바뀐 기록입니다. 새로고침 후 다시 확인해 주세요.');
   if(r.status==='approved'&&!(note||'').trim())return fail('note_required','승인된 기록을 집계에서 제외하려면 사유를 입력해 주세요.');
   Object.assign(r,{status:dec,review_note:(note||'').trim()||null,reviewed_at:new Date().toISOString(),reviewer_nickname:DB.profile.nickname});DB.queue=DB.queue.filter(x=>x!==r);DB.recent=[r,...DB.recent.filter(x=>x!==r)];return wait(r);},
  queue:()=>wait(DB.queue),
  recent:()=>wait(DB.recent),
  members:()=>wait(DB.members),
  setMember(id,p){const m=DB.members.find(x=>x.id===id);if(!m)return fail('not_found','회원을 찾을 수 없습니다.');const next={...m};for(const k of ['status','class_id','role','is_runner'])if(p[k]!==undefined&&p[k]!==null)next[k]=p[k];
   const admins=DB.members.filter(x=>x.status==='active'&&x.role==='admin'&&x.id!==id).length+(next.status==='active'&&next.role==='admin'?1:0);if(!admins)return fail('last_admin','활성 관리자가 최소 1명은 있어야 합니다.');
   if(next.status==='active'&&m.status!=='active')next.approved_at=new Date().toISOString();Object.assign(m,next);if(id==='me')Object.assign(DB.profile,{class_id:m.class_id,role:m.role,status:m.status,is_runner:m.is_runner});return wait(m);},
  getSettings:()=>wait(DB.admin_settings),
  saveSettings(s){const code=String(s.invite_code||'').trim().toUpperCase();if(!/^[A-Z0-9]{4,20}$/.test(code))return fail('invalid_settings','초대코드는 영문·숫자 4~20자로 입력해 주세요.');if(s.season_start>s.season_end)return fail('invalid_settings','시즌 시작일은 종료일보다 늦을 수 없습니다.');
   Object.assign(DB.admin_settings,{...s,invite_code:code});Object.assign(DB.settings,{season_name:s.season_name,season_start:s.season_start,season_end:s.season_end,submit_window_days:s.submit_window_days,grace_days:s.grace_days});return wait(DB.admin_settings);},
  exportRuns:()=>wait([...DB.my_runs.map(r=>({...r,nickname:DB.profile.nickname,class_id:DB.profile.class_id,reviewer_nickname:r.reviewed_at?'민지':null})),...DB.queue.filter(r=>r.user_id!=='me'),...DB.recent].sort((a,b)=>a.started_at.localeCompare(b.started_at))),
  resetPassword:()=>wait({ok:true},300),
  login:()=>fail('demo','시연 화면에서는 로그인할 수 없어요.'),
  signup:()=>fail('demo','시연 화면에서는 가입할 수 없어요.'),
  logout:async()=>{},
  changePassword:()=>fail('demo','시연 화면에서는 비밀번호를 바꿀 수 없어요.'),
  classes:()=>wait(DB.classes)
 };
}
const API=LIVE?liveApi():demoApi();
function errMsg(e){const m=e&&(e.message||String(e))||'';
 if(/failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(m))return '인터넷 연결을 확인해 주세요.';
 if(/jwt expired|invalid jwt|not_signed_in/i.test(m)||(e&&e.hint==='not_signed_in'))return '로그인이 만료됐어요. 다시 로그인해 주세요.';
 if(/permission denied/i.test(m))return '이 작업을 할 권한이 없어요.';
 return m||'문제가 생겼어요. 잠시 후 다시 시도해 주세요.';}
const authLost=e=>!!e&&(e.hint==='not_signed_in'||/jwt expired|invalid jwt|refresh token/i.test(e.message||'')||e.code==='PGRST301');

/* ===== 게임 계산 (승인된 시즌 기록 기준) ===== */
function g(){if(_g)return _g;
 const runs=D.me&&D.me.is_runner?D.runs.filter(r=>r.status==='approved'&&inSeason(r.date)):[];
 // 시간 대결이면 dayM·weekM·totalM은 초, 거리 대결이면 미터예요(서버 _user_stats·claim_quest와 같음).
 const T=TIME(),val=r=>T?r.duration:r.m,dayM={},weekM={};for(const r of runs){dayM[r.date]=(dayM[r.date]||0)+val(r);const w=monday(r.date);weekM[w]=(weekM[w]||0)+val(r);}
 const cert=Object.keys(dayM).filter(d=>dayM[d]>=(T?1800:5000)).sort(),certSet=new Set(cert);
 let best=0,run=0,prev=null;for(const d of cert){run=prev&&addDays(prev,1)===d?run+1:1;if(run>best)best=run;prev=d;}
 let cur=0;if(D.today<=D.season.end){let d=certSet.has(D.today)?D.today:addDays(D.today,-1);while(certSet.has(d)){cur++;d=addDays(d,-1);}}
 return _g={runs,dayM,weekM,cert,certSet,best,cur,totalM:runs.reduce((s,r)=>s+val(r),0),maxDay:Math.max(0,...Object.values(dayM)),maxWeek:Math.max(0,...Object.values(weekM)),
  dawn:runs.filter(r=>r.time<'07:00').length,weekend:runs.some(r=>{const w=dow(r.date);return w===0||w===6;}),cheersN:D.cheers.filter(c=>inSeason(c.date)).length};}
const lvStart=n=>25*(n-1)*(n+2);
const levelOf=x=>{let n=1;while(lvStart(n+1)<=x)n++;return n;};
const TIERS=[[1,'루키','#9aa7b8'],[4,'브론즈','#c48a5c'],[7,'실버','#b7c2d1'],[10,'골드','#e0b03c'],[13,'플래티넘','#5fc2aa'],[16,'다이아','#79a4ff']];
const tierOf=lv=>TIERS.filter(t=>lv>=t[0]).pop();
const CERT=()=>TIME()?'30분':'5k',mins=s=>Math.floor(s/60),hrs1=s=>Math.floor(s/360)/10;
const hm=s=>{s=Math.floor(s/60)*60;return s>=3600?dur(s).replace(/ 0분$/,''):`${s/60}분`;};
// 퀘스트 조건과 XP는 서버(claim_quest)와 똑같아요. 서버가 조건을 다시 확인한 뒤에만 보상이 저장돼요.
const QUESTS=[
 {id:'d_5k',kind:'d',get ic(){return TIME()?'30M':'5K';},qc:'#1557d4',qb:'#e8f0ff',get title(){return TIME()?'오늘 30분 달리기':'오늘 5k 달리기';},get short(){return TIME()?'30분 달리기':'5k 달리기';},get goal(){return TIME()?30:5;},get unit(){return TIME()?'분':'k';},xp:60,val:p=>TIME()?mins(g().dayM[p]||0):(g().dayM[p]||0)/1000},
 {id:'d_submit',kind:'d',ic:'camera',qc:'#0d6f52',qb:'#e2f4ee',title:'오늘 기록 인증하기',short:'기록 인증',goal:1,unit:'회',xp:30,val:p=>D.runs.some(r=>r.date===p&&(r.status==='pending'||r.status==='approved'))?1:0},
 {id:'d_cheer2',kind:'d',ic:'hand',qc:'#a8306b',qb:'#fbe8f1',title:'하이파이브 2번 보내기',short:'하이파이브 2번',goal:2,unit:'번',xp:40,val:p=>D.cheers.filter(c=>c.date===p).length},
 {id:'w_30k',kind:'w',get ic(){return TIME()?'3H':'30K';},qc:'#1557d4',qb:'#e8f0ff',get title(){return TIME()?'이번 주 3시간 달리기':'이번 주 30k 돌파';},get short(){return TIME()?'주간 3시간':'주간 30k';},get goal(){return TIME()?3:30;},get unit(){return TIME()?'시간':'k';},txt:p=>TIME()?`${hm(Math.min(g().weekM[p]||0,10800))}/3시간`:'',xp:150,val:p=>TIME()?hrs1(g().weekM[p]||0):(g().weekM[p]||0)/1000},
 {id:'w_dawn3',kind:'w',ic:'sunrise',qc:'#b4541f',qb:'#fdece6',title:'오전 7시 전 새벽런 3회',short:'새벽런 3회',goal:3,unit:'회',xp:100,val:p=>g().runs.filter(r=>r.time<'07:00'&&r.date>=p&&r.date<=addDays(p,6)).length},
 {id:'w_cert4',kind:'w',ic:'flame',qc:'#5a3fe0',qb:'#eeebff',get title(){return `${CERT()} 인증일 4일 채우기`;},get short(){return `${CERT()} 인증일 4일`;},goal:4,unit:'일',xp:120,val:p=>g().cert.filter(d=>d>=p&&d<=addDays(p,6)).length}];
const qIcon=q=>/^\d/.test(q.ic)?tg(q.ic):icon(q.ic);
const claimed=(q,p)=>D.claims.some(c=>c.q===q&&c.p===p);
function quests(kind){const p=kind==='d'?D.today:monday(D.today);return QUESTS.filter(q=>q.kind===kind).map(q=>{const now=q.val(p);return {...q,p,now,done:now>=q.goal-1e-9,got:claimed(q.id,p)};});}
// 승인이 늦게 나도 보상을 잃지 않게, 지난 기간의 받지 않은 보상을 모아 보여 줘요.
function pastRewards(){if(!D.me.is_runner)return [];const out=[],end=D.today<=D.season.end?addDays(D.today,-1):D.season.end,thisMon=monday(D.today),over=D.today>D.season.end;
 for(let d=D.season.start;d<=end;d=addDays(d,1))for(const q of QUESTS)if(q.kind==='d'&&!claimed(q.id,d)&&q.val(d)>=q.goal-1e-9)out.push({q,p:d});
 for(let m=monday(D.season.start);m<=D.season.end&&(m<thisMon||over);m=addDays(m,7))for(const q of QUESTS)if(q.kind==='w'&&!claimed(q.id,m)&&m<=D.today&&q.val(m)>=q.goal-1e-9)out.push({q,p:m});
 return out;}
function bingoCells(){const G=g();if(TIME())return [
 [tg('30M'),'30분 인증',G.cert.length>=1,'하루 30분'],[tg('1H'),'1시간 런',G.maxDay>=3600,'하루 1시간'],[icon('sunrise'),'새벽 러닝',G.dawn>=1,'7시 전 출발'],
 [icon('flame'),'3일 연속',G.best>=3,'30분 3일 연속'],[icon('hand'),'하이파이브',G.cheersN>=3,`응원 ${Math.min(3,G.cheersN)}/3`],[icon('sun'),'주말 러닝',G.weekend,'토·일 달리기'],
 [tg('2H'),'2시간 런',G.maxDay>=7200,`최고 ${hm(G.maxDay)}`],[icon('trend'),'주간 3시간',G.maxWeek>=10800,`최고 ${hm(G.maxWeek)}`],[icon('cal'),'7일 연속',G.best>=7,`최장 ${G.best}/7`]];
 const max=G.maxDay/1000,wk=G.maxWeek/1000;return [
 [tg('5K'),'5k 인증',G.cert.length>=1,'하루 5k'],[tg('10K'),'10k 런',G.maxDay>=10000,'하루 10k'],[icon('sunrise'),'새벽 러닝',G.dawn>=1,'7시 전 출발'],
 [icon('flame'),'3일 연속',G.best>=3,'5k 3일 연속'],[icon('hand'),'하이파이브',G.cheersN>=3,`응원 ${Math.min(3,G.cheersN)}/3`],[icon('sun'),'주말 러닝',G.weekend,'토·일 달리기'],
 [tg('21K'),'하프 21.1k',G.maxDay>=21100,`최고 ${fmt(max)}k`],[icon('trend'),'주간 30k',G.maxWeek>=30000,`최고 ${fmt(wk)}k`],[icon('cal'),'7일 연속',G.best>=7,`최장 ${G.best}/7`]];}
const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const bingoCount=()=>{const c=bingoCells();return LINES.filter(l=>l.every(i=>c[i][2])).length;};
function badges(){const G=g(),me=standings().find(r=>r.mine),won=D.today>D.season.end&&me&&me.rank===1&&avg(me)>0;return (TIME()?[
 [icon('flag'),'첫 발걸음','첫 승인 기록',G.runs.length,1],[tg('1H'),'1시간 클럽','하루 60분',mins(G.maxDay),60],[icon('sunrise'),'얼리버드','새벽런 10회',G.dawn,10],
 [tg('10H'),'10시간 클럽','누적 10시간',hrs1(G.totalM),10,`${hm(Math.min(G.totalM,36000))}/10시간`],[icon('star'),'꾸준왕','30분 인증일 15일',G.cert.length,15],[icon('flame'),'불꽃 7일','7일 연속 30분',G.best,7],
 [tg('2H'),'2시간 러너','하루 120분',mins(G.maxDay),120],[icon('trophy'),'우승 반','시즌 1위 반',won?1:0,1],[icon('hand'),'응원단장','하이파이브 10번',G.cheersN,10]
]:[
 [icon('flag'),'첫 발걸음','첫 승인 기록',G.runs.length,1],[tg('10K'),'10k 클럽','하루 10k',G.maxDay/1000,10],[icon('sunrise'),'얼리버드','새벽런 10회',G.dawn,10],
 [tg('100K'),'100k 클럽','누적 100k',G.totalM/1000,100],[icon('star'),'꾸준왕','5k 인증일 15일',G.cert.length,15],[icon('flame'),'불꽃 7일','7일 연속 5k',G.best,7],
 [tg('21K'),'하프 마라토너','하루 21.1k',G.maxDay/1000,21.1],[icon('trophy'),'우승 반','시즌 1위 반',won?1:0,1],[icon('hand'),'응원단장','하이파이브 10번',G.cheersN,10]
]).map(([e,t,c,n,gl,tx])=>({e,t,c,n,g:gl,tx,got:n>=gl-1e-9}));}
const xpTotal=()=>Math.round(g().totalM/(TIME()?30:100))+g().cert.length*20+D.claims.reduce((s,c)=>s+c.xp,0)+bingoCount()*100;
function lvInfo(){const x=xpTotal(),lv=levelOf(x),a=lvStart(lv),b=lvStart(lv+1);return {x,lv,into:x-a,need:b-a,pct:Math.round((x-a)/(b-a)*100),left:b-x,tier:tierOf(lv)};}
// 대결 기준(11-03): race_metric이 time이면 반·개인 순위 값은 승인된 러닝 시간(초)이에요. 화면은 시간 단위, 아니면 k 단위예요.
const TIME=()=>!!(D&&D.time),RDIV=()=>TIME()?3600:1000,RU=()=>TIME()?'시간':'k';
// 시간 대결 화면은 "1시간 30분"처럼 시간·분으로 보여 줘요(11-03 은진님 요청). v는 시간 단위예요.
const hmv=(v,sp=' ')=>{const t=Math.round(+v*60),H=Math.floor(t/60),M=t%60;return H?(M?`${H}시간${sp}${M}분`:`${H}시간`):`${M}분`;};
const rv=v=>TIME()?hmv(v):`${fmt((+v).toFixed(1))}${RU()}`;
const kv=(key,v,unit)=>TIME()&&key==='distance'?hmv(v):`${fmt(v)}${unit}`;
// 따라잡는 데 필요한 반 합계: 시간이면 분, 거리면 k
const gapText=gp=>TIME()?hmv(Math.max(1,Math.ceil(gp.raw/60))/60):`${fmt(gp.km)}k`;
const avg=c=>c.members?c.m/c.members/RDIV():0;
function standings(abs){const rows=D.classes.map(c=>({...c,m:abs?(abs[c.id]||0):c.m}));rows.sort((a,b)=>avg(b)-avg(a)||a.sort-b.sort);return rows.map(r=>({...r,rank:1+rows.filter(o=>avg(o)>avg(r)+1e-9).length}));}
function gapAhead(rows){const me=rows.find(r=>r.mine);if(!me||!me.members)return null;const ahead=rows.filter(r=>avg(r)>avg(me)+1e-9).sort((a,b)=>avg(a)-avg(b))[0];const raw=ahead?ahead.m/ahead.members*me.members-me.m:0;return ahead?{ahead,raw,km:Math.max(.1,Math.ceil(raw/100-1e-9)/10)}:null;}
function ddayText(){const s=seasonState();if(s==='before')return `시작 D-${between(D.today,D.season.start)}`;if(s==='after')return '시즌 종료';const n=between(D.today,D.season.end);return n?`D-${n}`:'D-DAY';}

/* ===== 공통 조각 ===== */
function tierBadge(lv,size=64){const [,,c]=tierOf(lv);return `<svg class="tier" width="${size}" height="${Math.round(size*1.08)}" viewBox="0 0 50 54" aria-hidden="true"><path d="M25 2 47 14.5v25L25 52 3 39.5v-25Z" fill="${c}"/><path d="M25 6.6 43 16.9v20.2L25 47.4 7 37.1V16.9Z" fill="#0e1b30"/><path d="M25 6.6 43 16.9v3.2L25 9.8 7 20.1v-3.2Z" fill="#ffffff1c"/><text x="25" y="33.2" text-anchor="middle" fill="#fff" font-family="'BK Sans',Pretendard,sans-serif" font-weight="800" font-size="17">${lv}</text></svg>`;}
const brandMark=(size=72)=>`<svg class="tier" width="${size}" height="${Math.round(size*1.08)}" viewBox="0 0 50 54" aria-hidden="true"><path d="M25 2 47 14.5v25L25 52 3 39.5v-25Z" fill="#1d6cff"/><path d="M25 6.6 43 16.9v20.2L25 47.4 7 37.1V16.9Z" fill="#0e1b30"/><text x="25" y="32.4" text-anchor="middle" fill="#cdf564" font-family="'BK Sans',Pretendard,sans-serif" font-weight="800" font-size="14" letter-spacing="-.5">BK</text></svg>`;
const lastReviewAt=()=>D.runs.reduce((m,r)=>r.reviewedAt&&r.reviewedAt>m?r.reviewedAt:m,'');
const staffQueueN=()=>S.admin.queue?S.admin.queue.filter(r=>!r.is_mine).length:0;
// 운영진이 할 일: 검토할 기록 + (관리자면) 가입 승인 대기 회원
const joinN=()=>isAdmin()&&S.admin.members?S.admin.members.filter(m=>m.status==='pending').length:0;
const todoN=()=>isStaff()?staffQueueN()+joinN():0;
const unread=()=>!!S.seen&&(lastReviewAt()>(S.seen.notice||'')||todoN()>0);
function topbar(){const L=lvInfo(),u=unread();return `<header class="top"><div class="top-text"><small>${md(D.today)} ${WD[dow(D.today)]}요일 · ${esc(cname(D.me.class_id))}반</small><strong>안녕하세요, ${esc(D.me.nickname)}님</strong></div><button class="icon-btn" data-act="notice" aria-label="알림${u?', 새 소식 있음':''}">${icon('bell')}${u?'<span class="dot"></span>':''}</button><button class="avatar${AV()?' av':''}" data-go="me" aria-label="내 프로필, 레벨 ${L.lv}">${faceIn(D.me.id,D.me.class_id,esc(ini(D.me.nickname,2)),44)}<span class="lv">${L.lv}</span></button></header>`;}
function playerCard(){const L=lvInfo(),G=g(),wk=monday(D.today);return `<section class="player" aria-label="나의 레벨"><div class="player-row">${tierBadge(L.lv,58)}<div class="player-info"><div class="tierline">${L.tier[1]} 티어</div><h2>Lv.${L.lv} ${esc(D.me.nickname)}</h2></div></div><div class="xp" role="progressbar" aria-label="다음 레벨까지 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${L.pct}"><i style="width:${L.pct}%"></i></div><div class="xp-text"><span class="num-s">${L.into.toLocaleString()} / ${L.need.toLocaleString()} XP</span><span>다음 레벨까지 <span class="num-s">${L.left.toLocaleString()}</span></span></div><div class="streak"><div class="streak-top"><strong>${icon('flame')}${G.cur}일 연속 러닝 중</strong><span>최장 ${G.best}일</span></div><div class="week">${Array.from({length:7},(_,i)=>{const d=addDays(wk,i),on=G.certSet.has(d);return `<span class="day${on?' on':''}${d===D.today?' today':''}${d>D.today||!inSeason(d)?' future':''}"><b>${on?icon('check'):''}</b>${'월화수목금토일'[i]}</span>`;}).join('')}</div></div></section>`;}
function questRow(q){const pct=Math.min(100,q.now/q.goal*100),h=qHint(q);return `<div class="quest${q.done?' done':''}${q.got?' claimed':''}"><span class="quest-ico" style="--qc:${q.qc};--qb:${q.qb}">${qIcon(q)}</span><div class="quest-body"><strong>${q.title}</strong><div class="qbar"><i style="width:${pct}%"></i></div><small><span class="num-s">${q.txt&&q.txt(q.p)||`${fmt(Math.min(q.now,q.goal))}/${q.goal}${q.unit}`}</span>${h?' · '+h:''}</small></div>${q.got?`<span class="qbtn got">${icon('check')}완료</span>`:q.done?`<button class="qbtn claim" data-claim="${q.id}|${q.p}" aria-label="보상 ${q.xp} XP 받기">받기 +${q.xp}</button>`:`<span class="qbtn wait">+${q.xp} XP</span>`}</div>`;}
function qSum(kind,name,qs){const ready=qs.filter(q=>q.done&&!q.got),xp=ready.reduce((t,q)=>t+q.xp,0);
 return `<div class="qsum-row"><div class="qsum-t"><strong>${name} <span class="num">${qs.filter(q=>q.done).length}/${qs.length}</span></strong><div class="qdots">${qs.map(q=>`<span class="${q.done?'ok':''}" style="--qc:${q.qc};--qb:${q.qb}" title="${esc(q.short)}" aria-label="${esc(q.short)} ${q.done?'완료':'진행 중'}">${qIcon(q)}</span>`).join('')}</div></div>${xp?`<button class="qbtn claim" data-act="claim-kind" data-kind="${kind}" aria-label="보상 ${xp} XP 받기">받기 +${xp}</button>`:qs.every(q=>q.got)?`<span class="qbtn got">${icon('check')}완료</span>`:`<span class="qbtn wait">+${qs.filter(q=>!q.got).reduce((t,q)=>t+q.xp,0)} XP</span>`}</div>`;}
function qHint(q){if(q.done)return '';if(q.id==='d_5k'){const pm=D.runs.filter(r=>r.date===q.p&&r.status==='pending').reduce((s,r)=>s+(TIME()?r.duration:r.m),0);if(pm)return `확인 대기 ${TIME()?hm(pm):fmt(pm/1000)+'k'}`;}if(q.id==='d_cheer2')return '순위에서 이름을 눌러요';if(q.id==='w_cert4'&&q.goal-q.now===1&&dow(D.today)!==0)return `하루만 더 ${CERT()}${TIME()?'이면':'면'} 완료`;return '';}
function miniRace(rows){const a=rows.map(avg),lo=Math.min(...a),hi=Math.max(...a);return `<span class="minirace" aria-hidden="true">${rows.slice().sort((x,y)=>(x.mine?1:0)-(y.mine?1:0)).map(r=>`<span class="${r.mine?'me':''}" style="--c:${col(r.color)};left:${hi>lo?6+(avg(r)-lo)/(hi-lo)*88:50}%">${esc(ini(r.name))}</span>`).join('')}</span>`;}
function infoCard(ic,t,d,act){return `<section class="infocard"><span class="crew-av blue">${icon(ic)}</span><div><strong>${t}</strong><small>${d}</small></div>${act||''}</section>`;}
const emptyCard=(ic,t,d)=>`<section class="card empty"><span class="crew-av blue">${icon(ic)}</span><strong>${t}</strong>${d?`<small>${d}</small>`:''}</section>`;
const loadingCard=()=>`<section class="card empty"><span class="spin"></span><small>불러오는 중이에요</small></section>`;
const ST={approved:'승인',pending:'확인 대기',rejected:'반려',withdrawn:'취소'};
const stChip=(s,big)=>`<span class="st ${({approved:'ok',pending:'wait',rejected:'bad',withdrawn:'off'})[s]||'off'}"${big?' style="font-size:14px;padding:8px 14px"':''}>${big?({approved:'승인 · 순위 반영됨',pending:'확인 대기 · 아직 미반영',rejected:'반려 · 집계 제외',withdrawn:'인증 취소됨'})[s]:ST[s]||s}</span>`;
const crownSvg=`<svg class="i crown" viewBox="0 0 24 24" role="img" aria-label="1위">${I.crown}</svg>`;

/* ===== 홈: 오늘의 나 (레벨·연속·퀘스트·빙고) ===== */
function home(){
 const rows=standings(),me=rows.find(r=>r.mine),gp=gapAhead(rows),st=seasonState(),past=pastRewards();
 let h=topbar()+playerCard();
 if(me)h+=`<button class="teaser" data-go="league" aria-label="반 대항전 보기, 우리 반 ${me.rank}위"><span class="teaser-top"><span class="rk"><b>${me.rank}</b>위</span><span class="tt"><small>반 대항전 · 우리 ${esc(me.name)}반</small><strong>${avg(me)===0&&rows.every(r=>avg(r)===0)?'아직 모든 반이 출발선에 있어요':gp?`${esc(gp.ahead.name)}반까지 반 합계 ${gapText(gp)}`:rows.filter(r=>r.rank===1).length>1?'지금 공동 1위예요':'지금 단독 1위예요'}</strong></span><span class="go">${icon('chev')}</span></span>${miniRace(rows)}<span class="teaser-foot"><span>1인 평균 ${rv(avg(me))}</span><span class="nw">${st==='on'?'시즌 종료 ':''}${ddayText()}</span></span></button>`;
 h+=trackCard();
 if(st==='before')h+=infoCard('flag',`시즌 시작까지 ${between(D.today,D.season.start)}일 남았어요`,`${md(D.season.start)} ~ ${md(D.season.end)} · 시즌이 시작되면 퀘스트가 열려요.`);
 if(st==='after')h+=infoCard('trophy','시즌이 끝났어요',canSubmit()?`${md(addDays(D.season.end,D.season.grace))}까지 남은 기록을 인증할 수 있어요.`:'최종 순위는 대항전·개인전 탭에서 볼 수 있어요.');
 if(!D.me.is_runner)h+=infoCard('user','레이스 미참가 계정이에요','운영진 설정에 따라 이 계정의 기록은 순위와 퀘스트에 들어가지 않아요.');
 if(past.length){const xp=past.reduce((s,x)=>s+x.q.xp,0);h+=`<section class="past"><span class="quest-ico" style="--qc:#1557d4;--qb:#e8f0ff">${icon('star')}</span><div><strong>받지 않은 보상 ${past.length}개</strong><small>${past.slice(0,2).map(x=>`${mds(x.p)} ${x.q.short}`).join(', ')}${past.length>2?` 외 ${past.length-2}개`:''}</small></div><button class="qbtn claim" data-act="claim-all">모두 받기 +${xp}</button></section>`;}
 if(st==='on'&&D.me.is_runner){const daily=quests('d'),weekly=quests('w'),wk=monday(D.today);
  // 퀘스트는 한 장으로 요약해 빙고가 첫 화면 가까이 오게 해요. 자세히 보기를 누르면 목록이 펼쳐져요.
  h+=`<div class="sec-head"><h2>퀘스트</h2><span class="chip">오늘은 자정, 주간은 월요일 초기화</span></div><section class="card qsum">${qSum('d','오늘의 퀘스트',daily)}${qSum('w',`주간 퀘스트 <small class="qwk">${mds(wk)} – ${mds(addDays(wk,6))}</small>`,weekly)}
  ${S.qOpen?`<div class="qlist">${daily.concat(weekly).map(questRow).join('')}</div>`:''}<button class="qmore" data-act="quests-more" aria-expanded="${!!S.qOpen}">${S.qOpen?'접기':'자세히 보기'}${icon('chev')}</button></section>`;}
 h+=`<div class="sec-head"><h2>미션 빙고<span class="num">${bingoCount()}줄</span></h2></div>${bingoCard()}`;
 h+=`<p class="note">레벨 XP는 ${TIME()?'승인 1분당 2 XP, 30분 인증일마다 20 XP':'승인 1k당 10 XP, 5k 인증일마다 20 XP'}, 퀘스트·빙고 보너스로 쌓여요. 온라인 트랙에서도 인증한 날 첫 입장 3 XP, 하이파이브 1번에 1 XP(하루 5까지)를 받아요.${LIVE?'':'<br>시연 화면이라 수치는 가상 데이터예요.'}</p>`;
 return h;
}
function bingoCard(){const c=bingoCells(),lines=LINES.filter(l=>l.every(i=>c[i][2])),inl=new Set(lines.flat());return `<section class="card"><p class="bingo-note">승인된 기록으로 자동 체크돼요. 한 줄을 완성할 때마다 +100 XP</p><div class="bingo">${c.map(([e,t,on,sub],i)=>`<div class="cell${on?' on':''}${inl.has(i)?' line':''}"><span class="ce">${e}</span>${on?`<span class="stamp">${icon('check')}</span>`:''}<strong>${t}</strong><small>${sub}</small></div>`).join('')}</div>${c[4][2]||seasonState()!=='on'?'':`<button class="btn ghost" style="margin-top:14px" data-go="league">${icon('hand')}반 친구에게 하이파이브 보내기</button>`}</section>`;}

/* ===== 대항전: 4개 반 레이스 ===== */
const COURSE=[['l',20,30,300,30],['a',300,64,34,1],['l',300,98,20,98],['a',20,132,34,-1],['l',20,166,300,166]];
const CLEN=280*3+Math.PI*34*2;
function cpt(f){let d=Math.max(0,Math.min(1,f))*CLEN;for(const s of COURSE){if(s[0]==='l'){const len=Math.abs(s[3]-s[1]);if(d<=len)return [s[1]+Math.sign(s[3]-s[1])*d,s[2]];d-=len;}else{const len=Math.PI*s[3];if(d<=len){const t=d/len*Math.PI;return [s[1]+s[4]*s[3]*Math.sin(t),s[2]-s[3]*Math.cos(t)];}d-=len;}}return [300,166];}
const PATH='M20 30H300A34 34 0 0 1 300 98H20A34 34 0 0 0 20 166H300';
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x)));for(const m of [1,2,2.5,5,10])if(m*p>=x-1e-12)return m*p;return 10*p;}
// 트랙은 지금 반들이 모여 있는 구간을 확대해서 보여 줘요(앞뒤로 차이의 k배, 최소 2k 여유).
function raceRange(vals,k=.5){const lo0=Math.min(...vals),hi0=Math.max(...vals),pad=Math.max(TIME()?.5:2,(hi0-lo0)*k),step=niceStep((hi0-lo0+2*pad)/5);return {lo:Math.max(0,Math.floor((lo0-pad)/step+1e-9)*step),hi:Math.ceil((hi0+pad)/step-1e-9)*step,step};}
function marks(R){let h='';const n=Math.round((R.hi-R.lo)/R.step);for(let i=1;i<n;i++){const v=Math.round((R.lo+i*R.step)*1000)/1000,[x,y]=cpt(i/n);const lab=x>292?`x="-12" y="4" text-anchor="end"`:x<28?`x="12" y="4" text-anchor="start"`:`y="${y>140?24:-19}" text-anchor="middle"`;h+=`<g class="km-mark" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="4"/><text ${lab}>${TIME()?hmv(v,''):fmt(v)+'k'}</text></g>`;}
 return h+`<g class="km-mark" transform="translate(20 30)"><circle r="4"/><text y="-19" text-anchor="middle">${TIME()?hmv(R.lo,''):fmt(R.lo)+'k'}</text></g><text class="fin-l" x="306" y="193" text-anchor="middle">${TIME()?hmv(R.hi,''):fmt(R.hi)+'k'}</text>`;}
function runners(rows,R,spread){const span=R.hi-R.lo||1;let L=rows.map(r=>({r,f:Math.max(0,Math.min(1,(avg(r)-R.lo)/span))}));
 if(spread){L.sort((a,b)=>a.f-b.f||b.r.sort-a.r.sort);const gp=26/CLEN;for(let i=1;i<L.length;i++)if(L[i].f<L[i-1].f+gp)L[i].f=L[i-1].f+gp;const o=L.length?L[L.length-1].f-1:0;if(o>0)L.forEach(x=>x.f-=o);}
 return L.sort((a,b)=>(a.r.mine?1:0)-(b.r.mine?1:0)).map(({r,f})=>{const [x,y]=cpt(f),c=col(r.color);return `<g class="runner" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${r.mine?`<circle class="halo" r="15" fill="${c}"/>`:''}<circle r="15" fill="${c}" stroke="#0e1b30" stroke-width="3"/><text class="l" y="5" text-anchor="middle">${esc(ini(r.name))}</text>${r.rank===1&&avg(r)>0?`<path transform="translate(-9 -36) scale(.75)" d="M3.5 8.5 8 12.2 12 6l4 6.2 4.5-3.7-1.8 9.5H5.3Z" fill="#e0b03c"/>`:''}</g>`;}).join('');}
// 순위는 언제나 1인 평균 기준이에요. 합계 보기는 큰 숫자만 반 합계로 바꿔 보여 줘요.
function boardRows(rows){const sum=S.boardView==='sum';return rows.map(r=>`<div class="brow${r.mine?' mine':''}" style="--c:${col(r.color)}"><span class="pos">${r.rank}</span><div class="nm"><strong>${esc(r.name)}반${r.rank===1&&avg(r)>0?crownSvg:''}${r.mine?'<span class="mine-tag">우리 반</span>':''}</strong><small>${sum?`1인 평균 ${rv(avg(r))}`:`합계 ${rv(r.m/RDIV())}`} · ${r.members}명</small></div><div class="avg"><b${TIME()?' class="hm"':''}>${TIME()?hmv(sum?r.m/RDIV():avg(r)):sum?fmt((r.m/RDIV()).toFixed(1)):fmt(avg(r).toFixed(1))}</b><small>${TIME()?(sum?'반 합계':'1인 평균'):sum?`${RU()} 합계`:`${RU()} / 인`}</small></div></div>`).join('')+(sum?'<p class="board-note">순위는 지금도 1인 평균 기준이에요. 반마다 인원이 달라서요.</p>':'');}
const boardSeg=()=>`<div class="seg-sm" role="group" aria-label="반 순위 보기">${[['avg','1인 평균'],['sum','반 합계']].map(([v,t])=>`<button data-act="board-view" data-view="${v}" aria-pressed="${(S.boardView||'avg')===v}">${t}</button>`).join('')}</div>`;
function raceMsg(rows,gp){const me=rows.find(r=>r.mine);if(rows.every(r=>avg(r)===0))return seasonState()==='before'?'시즌이 시작되면 주자들이 출발해요.':'첫 기록이 승인되면 주자들이 출발해요.';if(!me)return '';if(gp)return `${esc(gp.ahead.name)}반까지 반 합계 ${gapText(gp)}, 충분히 따라잡을 수 있어요.`;return rows.filter(r=>r.rank===1).length>1?'지금 공동 선두예요. 한 걸음만 더 앞서 볼까요?':'우리 반이 선두예요. 격차를 더 벌려 볼까요?';}
// 다시 보기: 최근 7일(시즌 안)의 반별 일일 거리로 누적 평균이 어떻게 바뀌었는지 보여 줘요.
function replayData(){const end=D.today<D.season.end?D.today:D.season.end;let first=addDays(end,-6);if(first<D.season.start)first=D.season.start;if(end<first||!D.classes.length)return null;
 const win={};let moved=false;for(const x of D.daily)if(x.date>=first&&x.date<=end&&x.m){(win[x.date]=win[x.date]||{})[x.cls]=(win[x.date][x.cls]||0)+x.m;moved=true;}
 if(!moved)return null;const start={};D.classes.forEach(c=>start[c.id]=c.m);Object.values(win).forEach(o=>Object.entries(o).forEach(([c,m])=>start[c]-=m));
 const frames=[];let cur={...start};for(let d=first;d<=end;d=addDays(d,1)){cur={...cur};Object.entries(win[d]||{}).forEach(([c,m])=>cur[c]=(cur[c]||0)+m);frames.push({d,abs:cur});}
 return {start,frames};}
function league(){
 const rows=standings(),me=rows.find(r=>r.mine),gp=gapAhead(rows),R=raceRange(rows.map(avg)),rp=replayData();
 const crew=D.players.filter(p=>p.cls===D.me.class_id).sort((a,b)=>b.distance-a.distance||a.name.localeCompare(b.name,'ko'));
 const feed=D.feed.slice().sort((a,b)=>b.date.localeCompare(a.date)||(a.mine?1:0)-(b.mine?1:0));
 return `<div class="page-title"><small>${esc(D.season.name)} · 반 대항전</small><h1>4개 반 대항전</h1><div class="season"><span class="dday">${ddayText()}</span><span class="chip">${TIME()?'1인 평균 러닝 시간으로 승부':'1인 평균거리로 승부'}</span></div></div>
 <section class="race" data-race><div class="race-head"><h2>레이스 현황</h2>${me?`<span class="chip" data-race-rank>우리 반 ${me.rank}위</span>`:''}</div><p class="race-sub">${TIME()?'주자는 반원 1인당 평균 러닝 시간만큼 달려요':'주자는 반원 1인당 평균거리만큼 달려요'}</p>
 <svg class="race-svg" viewBox="-16 0 352 196" role="img" aria-label="4개 반 레이스 트랙, ${fmt(R.lo)}k부터 ${fmt(R.hi)}k까지 확대"><path class="track-bed" d="${PATH}"/><path class="track-in" d="${PATH}"/><path class="track-lane" d="${PATH}"/><g data-marks>${marks(R)}</g><g class="finish" transform="translate(300 166)"><rect x="-3" y="-17" width="4" height="27" rx="2"/><path d="M1 -17h16v11H1z" fill="url(#chk)"/></g><defs><pattern id="chk" width="5.5" height="5.5" patternUnits="userSpaceOnUse"><rect width="5.5" height="5.5" fill="#fff"/><rect width="2.75" height="2.75" fill="#0e1b30"/><rect x="2.75" y="2.75" width="2.75" height="2.75" fill="#0e1b30"/></pattern></defs><g class="race-day" data-day transform="translate(160 132)"><rect x="-44" y="-12" width="88" height="24" rx="12"/><text y="4.5" text-anchor="middle"></text></g><g data-runners>${runners(rows,R,true)}</g></svg><span class="race-pop" data-pop></span>
 <p class="race-msg" data-race-msg aria-live="polite">${raceMsg(rows,gp)}</p>${rp?`<button class="btn lime" data-act="replay">${icon('play')}최근 ${rp.frames.length}일 레이스 다시 보기</button>`:''}</section>
 <div class="sec-head"><h2>반 순위</h2>${boardSeg()}</div><div class="board" data-board>${boardRows(rows)}</div>
 ${me&&me.members?`<div class="sec-head"><h2>내가 달리면?</h2></div><div class="gapcard">${TIME()?`<span class="big">+${fmt((30/me.members).toFixed(1))}분</span><p>내 30분 러닝이 승인되면 우리 반 평균이 <b class="nw">${fmt((30/me.members).toFixed(1))}분/인</b> 올라가요.<small>반 평균은 승인된 러닝 시간 합계를`:`<span class="big">+${fmt((5/me.members).toFixed(2))}</span><p>내 5k가 승인되면 우리 반 평균이 <b class="nw">${fmt((5/me.members).toFixed(2))}k/인</b> 올라가요.<small>반 평균은 승인 거리 합계를`} 레이스에 참가한 반원 수(${me.members}명)로 나눠요. 안 뛴 반원도 포함돼요.</small></p></div>`:''}
 ${me?`<div class="sec-head"><h2>우리 ${esc(me.name)}반 소식</h2><span class="chip">오늘 ${me.runnersToday}명 달림</span></div>${feed.length?`<section class="card list">${feed.map(f=>feedRow(f,me)).join('')}</section>`:emptyCard('hand','최근 3일 동안 승인된 기록이 아직 없어요','반 친구 기록이 승인되면 여기서 하이파이브를 보낼 수 있어요.')}`:''}
 ${crew.length?`<div class="sec-head"><h2>우리 반 기여 랭킹</h2></div><section class="card list">${crew.map((p,i)=>`<button class="crew-row" data-member="${esc(p.id)}"><span class="crew-av${p.me?' me':''}${AV()?' av':''}">${faceIn(p.id,p.cls,p.me?'나':esc(ini(p.name)),42)}</span><div><strong>${i+1}. ${esc(p.name)}${p.me?' (나)':''}${i===0&&p.distance>0?`<svg class="gold" viewBox="0 0 24 24" role="img" aria-label="반 기여 1위" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round">${I.medal}</svg>`:''}</strong><div class="contrib"><i style="width:${crew[0].distance?p.distance/crew[0].distance*100:0}%;${p.me?'background:var(--primary)':''}"></i></div></div><span class="cval">${rv(p.distance)}</span></button>`).join('')}</section>`:''}
 <p class="note">순위는 운영진이 승인한 시즌 기록만 반영해요.${LIVE?'':' 반 이름·인원·거리는 시연용 가상 데이터예요.'}</p>`;
}
function feedRow(f,me){return `<div class="crew-row"><button class="crew-av${f.mine?' me':''}" data-member="${esc(f.user)}" aria-label="${esc(f.name)}님 기록 보기">${faceIn(f.user,(D.players.find(x=>x.id===f.user)||{}).cls||D.me.class_id,f.mine?'나':esc(ini(f.name)),42)}</button><div><strong>${esc(f.name)}${f.mine?' (나)':''} · ${fmt(f.km)}k</strong><small>${mds(f.date)} 승인${me.members?` · ${TIME()?'반 평균에 반영':`우리 반 <span class="nw">+${fmt(f.km/me.members)}k/인</span>`}`:''}${f.cheers?` <span class="hf" aria-label="하이파이브 ${f.cheers}개">${icon('hand')}${f.cheers}</span>`:''}</small></div>${f.mine?'':`<button class="cheer${f.on?' on':''}" data-cheer="${esc(f.id)}" aria-pressed="${f.on}">${f.on?icon('check')+'응원함':icon('hand')+'하이파이브'}</button>`}</div>`;}
/* ===== 캐릭터 꾸미기 ===== */
async function saveLook(l,quiet){S.looks=S.looks||{};const prev=S.looks[D.me.id];S.looks[D.me.id]=l;
 try{await API.setLook(l);if(!quiet)toast('캐릭터를 저장했어요');}
 catch(e){S.looks[D.me.id]=prev;if(!quiet)toast(errMsg(e));if(authLost(e))sessionLost();}}
let lookEd=null;
function lookSheet(){if(!AV()||typeof window.BKAvatar.editor!=='function')return toast('꾸미기를 불러오지 못했어요');
 let cur=lookOf(D.me.id);sheet(`<h2>캐릭터 꾸미기</h2><p class="note" style="margin:4px 0 12px">순위와 기록, 온라인 트랙에서 이 모습으로 보여요.</p><div data-look-ed></div><button class="btn" data-act="look-save" style="margin-top:16px">저장하기</button>`);
 try{lookEd&&lookEd.destroy&&lookEd.destroy();}catch(_){}
 lookEd=window.BKAvatar.editor($('#sheet [data-look-ed]'),cur,ccol(D.me.class_id),l=>{cur=l;});
 S.lookDraft=()=>cur;}
async function lookSave(b){await busy(b,async()=>{await saveLook(window.BKAvatar.normalize?window.BKAvatar.normalize(S.lookDraft()):S.lookDraft());closeSheet();render(true);});}
/* ===== 다른 러너 기록 보기 + 하이파이브 ===== */
function memberList(){const M=S.mem;if(!M.rows.length)return `<p class="note">이번 시즌 승인된 기록이 아직 없어요.</p>`;
 return M.rows.map(r=>`<div class="crew-row mrun"><span class="dt"><b>${+r.date.slice(8)}</b>${+r.date.slice(5,7)}월</span><div><strong>${TIME()?`${hm(r.duration)} · ${fmt(r.km)}k`:`${fmt(r.km)}k · ${hm(r.duration)}`}</strong><small>${(pc=>pc?pc+' · ':'')(pace(r.duration,r.km,r.pace))}${esc(r.kind||'')}${r.cheers?` <span class="hf" aria-label="하이파이브 ${r.cheers}개">${icon('hand')}${r.cheers}</span>`:''}</small></div>${r.mine?'':`<button class="cheer${r.on?' on':''}" data-cheer="${esc(r.id)}" aria-pressed="${r.on}">${r.on?icon('check')+'응원함':icon('hand')+'하이파이브'}</button>`}</div>`).join('');}
async function openMember(uid){const p=D.players.find(x=>x.id===uid);if(!p)return;
 const head=`<div class="mhead"><span class="face${AV()?' av':''}" style="--c:${ccol(p.cls)}">${faceIn(p.id,p.cls,p.me?'나':esc(ini(p.name)),56)}</span><div><h2>${esc(p.name)}${p.me?' (나)':''}</h2><small>${esc(cname(p.cls))}반 · 누적 ${rv(p.distance)} · 인증일 ${p.days}일</small></div></div>`;
 S.mem={uid,name:p.name,rows:[]};sheet(`${head}<div class="mlist" data-mlist><p class="note">기록을 불러오는 중이에요.</p></div>`);
 try{const rows=await API.memberRuns(uid);if(!S.mem||S.mem.uid!==uid)return;
  S.mem.rows=rows.map(r=>({id:r.run_id,user:r.user_id,name:r.nickname,date:r.run_date,km:r.distance_m/1000,duration:r.duration_s,pace:r.pace_s||null,kind:r.kind,cheers:+r.cheer_count||0,on:!!r.cheered_by_me,mine:!!r.is_mine}));
  const el=$('#sheet.on [data-mlist]');if(el)el.innerHTML=memberList();}
 catch(e){const el=$('#sheet.on [data-mlist]');if(el)el.innerHTML=`<p class="note">${esc(errMsg(e))}</p>`;if(authLost(e))sessionLost();}}
let raceRaf=0;
function replay(){
 const card=$('[data-race]'),rp=replayData();if(!card||!rp)return;cancelAnimationFrame(raceRaf);
 const rn=card.querySelector('[data-runners]'),mk=card.querySelector('[data-marks]'),msg=card.querySelector('[data-race-msg]'),pop=card.querySelector('[data-pop]'),rk=card.querySelector('[data-race-rank]'),btn=card.querySelector('[data-act=replay]'),dt=card.querySelector('[data-day]'),dtx=dt.querySelector('text');
 const R=raceRange(standings().map(avg)),vals=[];[rp.start,...rp.frames.map(f=>f.abs)].forEach(a=>D.classes.forEach(c=>vals.push(c.members?(a[c.id]||0)/c.members/1000:0)));const R0=raceRange(vals,.12);
 const paint=(rows,Rg)=>{rn.innerHTML=runners(rows,Rg,false);const m=rows.find(r=>r.mine);if(rk&&m)rk.textContent=`우리 반 ${m.rank}위`;const b=$('[data-board]');if(b)b.innerHTML=boardRows(rows);};
 const passed=[];
 const end=()=>{raceRaf=0;const rows=standings();rn.innerHTML=runners(rows,R,true);mk.innerHTML=marks(R);const m=rows.find(r=>r.mine);if(rk&&m)rk.textContent=`우리 반 ${m.rank}위`;const b=$('[data-board]');if(b)b.innerHTML=boardRows(rows);dtx.textContent='';dt.classList.remove('on');
  const s0=standings(rp.start).find(r=>r.mine);msg.textContent=!m?'':passed.length?`최근 ${rp.frames.length}일 동안 ${[...new Set(passed)].map(n=>n+'반').join('·')}을 추월하고 지금 ${m.rank}위예요.`:`최근 ${rp.frames.length}일 동안 우리 반은 1인 평균 ${rv(avg(m)-avg(s0))}를 달렸고 지금 ${m.rank}위예요.`;
  btn.disabled=false;if(S.stale){S.stale=false;render(true);}};
 if(reduce.matches){end();return;}
 btn.disabled=true;mk.innerHTML=marks(R0);dt.classList.add('on');const per=reduce.matches?0:700,n=rp.frames.length,t0=performance.now();
 let prev=standings(rp.start),prevRank=(prev.find(r=>r.mine)||{}).rank;
 snd('start');msg.textContent=`${md(rp.frames[0].d)} 직전, 우리 반은 ${prevRank}위였어요.`;
 const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
 const step=now=>{if(!card.isConnected){raceRaf=0;return;}const t=Math.max(0,(now-t0)/per),i=Math.min(n-1,Math.floor(t)),e=ease(Math.min(1,t-i));
  const from=i?rp.frames[i-1].abs:rp.start,to=rp.frames[i].abs,abs={};D.classes.forEach(c=>abs[c.id]=(from[c.id]||0)+((to[c.id]||0)-(from[c.id]||0))*e);
  const rows=standings(abs),m=rows.find(r=>r.mine);paint(rows,R0);dtx.textContent=md(rp.frames[i].d);
  if(m&&prevRank&&m.rank!==prevRank){const day=md(rp.frames[i].d);if(m.rank<prevRank){const beat=prev.filter(r=>!r.mine&&avg(r)>=avg(prev.find(x=>x.mine))-1e-9&&rows.find(x=>x.id===r.id).rank>m.rank).map(r=>r.name);passed.push(...beat);const [x,y]=cpt(Math.max(0,Math.min(1,(avg(m)-R0.lo)/(R0.hi-R0.lo||1))));const sv=card.querySelector('.race-svg').getBoundingClientRect(),cr=card.getBoundingClientRect();pop.style.left=Math.max(44,Math.min(cr.width-44,sv.left-cr.left+(x+16)/352*sv.width))+'px';pop.style.top=sv.top-cr.top+y/196*sv.height+'px';pop.textContent='추월!';pop.classList.remove('show');void pop.offsetWidth;pop.classList.add('show');msg.textContent=`${day}, ${beat.length?beat.map(n=>n+'반').join('·')+'을':'앞 반을'} 추월했어요.`;snd('pass');burstAt(card.querySelector('.race-svg'));if(navigator.vibrate)navigator.vibrate(30);}else{snd('passed');const by=rows.filter(r=>!r.mine&&r.rank<m.rank&&prev.find(x=>x.id===r.id).rank>prevRank).map(r=>r.name);msg.textContent=`${day}, ${by.length?by.map(n=>n+'반').join('·')+'에게':'뒤 반에게'} 추월당했어요.`;}}
  if(m)prevRank=m.rank;prev=rows;
  if(t<n){raceRaf=requestAnimationFrame(step);return;}
  // 마지막으로 다시 보기 구간에서 지금 순위 구간으로 부드럽게 확대
  const z0=performance.now(),zoom=nw=>{if(!card.isConnected){raceRaf=0;return;}const u=Math.max(0,Math.min(1,(nw-z0)/650)),k=ease(u),Rz={lo:R0.lo+(R.lo-R0.lo)*k,hi:R0.hi+(R.hi-R0.hi)*k,step:R.step};paint(standings(),Rz);mk.innerHTML=u<1?'':marks(R);if(u<1)raceRaf=requestAnimationFrame(zoom);else setTimeout(()=>{if(card.isConnected)end();},250);};
  setTimeout(()=>{if(card.isConnected)raceRaf=requestAnimationFrame(zoom);},500);};
 raceRaf=requestAnimationFrame(step);
}

/* ===== 개인전 ===== */
const EVENTS_D=[['distance','누적 거리','k'],['days','5k 인증일','일'],['streak','최장 연속','일']];
// 시간 대결이면 첫 종목이 누적 러닝 시간이에요(값은 players.distance에 시간 단위로 들어 있어요).
const events=()=>TIME()?[['distance','누적 시간','시간'],['days','30분 인증일','일'],EVENTS_D[2]]:EVENTS_D;
const MEDAL=['var(--gold)','var(--silver)','var(--bronze)'];
function ranking(){
 const [key,label,unit]=events().find(e=>e[0]===S.rank);let prev,rank=0;
 const head=`<div class="page-title"><small>${esc(D.season.name)} · 반 대항전과 동시 진행</small><h1>개인전</h1><p>반과 상관없이 모든 러너가 함께 겨뤄요.</p></div><div class="tabs" role="tablist">${events().map(([id,l])=>`<button role="tab" aria-selected="${S.rank===id}" class="${S.rank===id?'on':''}" data-rank="${id}">${l}</button>`).join('')}</div>`;
 const rows=[...D.players].sort((a,b)=>b[key]-a[key]||a.name.localeCompare(b.name,'ko')).map((p,i)=>{if(p[key]!==prev)rank=i+1;prev=p[key];return {...p,rank};});
 if(!rows.length)return head+emptyCard('trophy','아직 레이스에 참가한 러너가 없어요','가입이 승인되면 여기에 함께 보여요.');
 const me=rows.find(r=>r.me),above=me?rows.filter(r=>r[key]>me[key]).sort((a,b)=>a[key]-b[key])[0]:null,top=rows.slice(0,3);
 const face=p=>`<span class="face${AV()?' av':''}" style="--c:${ccol(p.cls)}">${faceIn(p.id,p.cls,p.me?'나':esc(ini(p.name)),p.rank===1?68:56)}<span class="medal" style="--m:${MEDAL[p.rank-1]||'var(--silver)'}">${p.rank}</span></span>`;
 return `${head}<div class="podium">${[top[1],top[0],top[2]].map(p=>p?`<button class="pod p${Math.min(3,p.rank)}" data-member="${esc(p.id)}">${face(p)}<strong>${esc(p.name)}</strong><small><span class="class-dot" style="--c:${ccol(p.cls)}"></span>${esc(cname(p.cls))}반</small><div class="block${TIME()&&key==='distance'?' hm':''}">${TIME()&&key==='distance'?hmv(p[key],'<br>'):`${fmt(p[key])}<span>${unit}</span>`}</div></button>`:'<div class="pod"></div>').join('')}</div>
 ${rows.length>3?`<section class="card" style="padding:8px">${rows.slice(3).map(p=>`<button class="rrow${p.me?' me':''}" data-member="${esc(p.id)}" aria-label="${esc(p.name)}님 기록 보기"><span class="rk">${p.rank}</span><span class="face${AV()?' av':''}" style="--c:${ccol(p.cls)}">${faceIn(p.id,p.cls,p.me?'나':esc(ini(p.name)),40)}</span><div><strong>${esc(p.name)}${p.me?' (나)':''}</strong><small><span class="class-dot" style="--c:${ccol(p.cls)}"></span>${esc(cname(p.cls))}반</small></div><span class="val">${TIME()&&key==='distance'?hmv(p[key]):`${fmt(p[key])}<small>${unit}</small>`}</span></button>`).join('')}</section>`:''}
 ${me?`<div class="mybar"><b>${me.rank}위</b><p>${label} ${kv(key,me[key],unit)}<small>${above?`${esc(above.name)}님까지 ${kv(key,above[key]-me[key],unit)} 남았어요`:rows.filter(r=>r.rank===1).length>1?'공동 1위예요':'1위를 지키고 있어요'}</small></p>${icon('up')}</div>`:''}
 <p class="note">이름을 누르면 그 러너의 기록을 보고 하이파이브를 보낼 수 있어요. 공동 기록은 같은 순위예요.</p>`;
}

/* ===== 나: 프로필·기록·컬렉션 ===== */
function me(){
 const L=lvInfo(),G=g(),b=badges();
 return `<div class="page-title"><small>마이 페이지</small><h1>나의 러닝</h1></div>
 <section class="profile">${tierBadge(L.lv,72)}<h2>${esc(D.me.nickname)}</h2><p class="sub">${L.tier[1]} 티어 · Lv.${L.lv} · ${esc(cname(D.me.class_id))}반</p><div class="stats4"><div><b${TIME()?' class="hm"':''}>${TIME()?hmv(G.totalM/3600,'<br>'):fmt(G.totalM/1000)}</b><small>${TIME()?'누적 시간':'누적 k'}</small></div><div><b>${G.cert.length}</b><small>인증일</small></div><div><b>${G.best}</b><small>최장 연속</small></div><div><b>${b.filter(x=>x.got).length}</b><small>배지</small></div></div></section>
 ${AV()?`<button class="look-card" data-act="look"><span class="lk-face">${faceSvg(D.me.id,D.me.class_id,48)}</span><span class="sc-t"><strong>캐릭터 꾸미기</strong><small>${lookOf(D.me.id)?'순위와 트랙에 이 모습으로 보여요':'모자·머리·표정을 골라 나만의 러너를 만들어요'}</small></span>${icon('chev')}</button>`:''}
 ${isStaff()?staffCard():''}
 <div class="tabs" role="tablist">${[['log','나의 기록'],['badge','배지 컬렉션']].map(([id,l])=>`<button role="tab" aria-selected="${S.meTab===id}" class="${S.meTab===id?'on':''}" data-metab="${id}">${l}</button>`).join('')}</div>
 ${S.meTab==='log'?logTab():badgeTab(b)}
 ${soundCard()}
 ${LIVE?`<div class="acct"><button class="btn ghost" data-act="pw">${icon('key')}비밀번호 바꾸기</button><button class="btn ghost" data-act="logout">${icon('logout')}로그아웃</button></div>`:''}`;
}
function soundCard(){if(!window.BKSound||!BKSound.supported)return '';const s=BKSound.get(),row=(k,ic,t,d)=>`<div class="snd-row"><span class="snd-ico">${icon(ic)}</span><span class="snd-t"><strong>${t}</strong><small>${d}</small></span><button class="sw" data-act="snd" data-k="${k}" role="switch" aria-checked="${s[k]}" aria-label="${t}"></button></div>`;
 return `<section class="card snd"><h3 class="snd-h">소리</h3>${row('sfx','sound','효과음','인증·보상·하이파이브·레벨업 때 짧게 울려요')}${row('bgm','music','배경음악','앱을 보는 동안 잔잔하게 흘러요')}<p class="snd-note">휴대폰이 무음이면 소리가 나지 않아요. 이 기기에만 저장돼요.</p></section>`;}
function staffCard(){const q=S.admin.queue?staffQueueN():null,j=joinN(),n=(q||0)+j,t=[j?`가입 신청 ${j}명`:'',q?`검토할 기록 ${q}건`:''].filter(Boolean).join(' · ');return `<button class="staff-card${n?' todo':''}" data-go="admin"${j&&!q?' data-tab="members"':''}><span class="crew-av blue">${icon('shield')}</span><span class="sc-t"><strong>운영 도구</strong><small>${q===null?'기록 검토 · 회원 승인 · 시즌 설정':n?`${t}이 기다려요`:'지금은 처리할 일이 없어요'}</small></span>${n?`<span class="sc-n">${n}</span>`:''}${icon('chev')}</button>`;}
function seasonMonths(){const out=[];let ym=D.season.start.slice(0,7);const last=(D.today>D.season.end?D.season.end:D.today<D.season.start?D.season.start:D.today).slice(0,7)>D.season.end.slice(0,7)?D.season.end.slice(0,7):D.season.end.slice(0,7);while(ym<=last&&out.length<13){out.push(ym);const [y,m]=ym.split('-').map(Number);ym=m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,'0')}`;}return out;}
function logTab(){
 const months=seasonMonths(),def=(D.today<D.season.start?D.season.start:D.today>D.season.end?D.season.end:D.today).slice(0,7),ym=months.includes(S.calMonth)?S.calMonth:def,idx=months.indexOf(ym);
 const [y,m]=ym.split('-').map(Number),nd=new Date(Date.UTC(y,m,0)).getUTCDate(),lead=(dow(`${ym}-01`)+6)%7,tot=g().dayM,pend=new Set(D.runs.filter(r=>r.status==='pending').map(r=>r.date));
 const cells=['월','화','수','목','금','토','일'].map(w=>`<span class="w">${w}</span>`).join('')+Array.from({length:lead},()=>'<span class="e"></span>').join('')+Array.from({length:nd},(_,i)=>{const d=`${ym}-${String(i+1).padStart(2,'0')}`,k=(tot[d]||0)/(TIME()?360:1000);const lv=k>=15?'l3':k>=10?'l2':k>0?'l1':'';return `<span class="${lv}${pend.has(d)?' p':''}${d===D.today?' t':''}${inSeason(d)?'':' o'}" title="${d}">${i+1}</span>`;}).join('');
 const monthRuns=g().runs.filter(r=>r.date.startsWith(ym)).length,recs=D.runs.slice().sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
 const nav=months.length>1?`<span class="cal-nav"><button data-act="cal" data-m="${months[idx-1]||''}" ${idx>0?'':'disabled'} aria-label="이전 달">${icon('left')}</button><button data-act="cal" data-m="${months[idx+1]||''}" ${idx<months.length-1?'':'disabled'} aria-label="다음 달">${icon('chev')}</button></span>`:'';
 return `<section class="card"><div class="cal-head"><strong>${y}년 ${m}월</strong>${nav}<span class="chip">${monthRuns}회 달림</span></div><div class="cal">${cells}</div><div class="legend"><span><i style="background:#dbe7ff"></i>${TIME()?'1시간':'10k'} 미만</span><span><i style="background:#9ebfff"></i>${TIME()?'1시간':'10k'} 이상</span><span><i style="background:var(--primary)"></i>${TIME()?'1시간 30분':'15k'} 이상</span><span><i style="box-shadow:inset 0 0 0 2px var(--warn)"></i>확인 대기</span></div></section>
 ${recs.length?`<section class="card list">${recs.map(r=>`<button class="rec${r.status==='withdrawn'?' off':''}" data-rec="${esc(r.id)}"><span class="dt"><b>${+r.date.slice(8)}</b>${+r.date.slice(5,7)}월</span><div><strong>${fmt(r.distance)}k${(pc=>pc?` <span class="pc">${pc}</span>`:'')(pace(r.duration,r.distance,r.pace))}</strong><small>${r.time} · ${dur(r.duration)} · ${esc(r.type)}</small></div>${stChip(r.status)}</button>`).join('')}</section><button class="btn ghost" data-act="export">${icon('down')}기록 CSV로 내보내기</button>`:emptyCard('camera','아직 인증한 기록이 없어요','아래 가운데 + 버튼으로 첫 기록을 올려 보세요.')}`;
}
function badgeTab(b){return `<section class="card"><div class="badges">${b.map(x=>`<div class="badge${x.got?' got':''}"><span class="bi">${x.e}</span><strong>${x.t}</strong><small>${x.c}</small>${x.got?'<small class="gotl">획득</small>':`<span class="bbar"><i style="width:${Math.min(100,x.n/x.g*100)}%"></i></span><small class="num-s">${x.tx||`${fmt(Math.min(x.n,x.g))}/${fmt(x.g)}`}</small>`}</div>`).join('')}</div></section><p class="note">배지는 승인된 시즌 기록으로 자동으로 모여요.</p>`;}

/* ===== 운영 도구 (검토자·관리자) ===== */
function admin(){
 const A=S.admin,tabs=isAdmin()?[['queue','기록 검토'],['members','회원'],['settings','설정']]:[['queue','기록 검토']];if(!tabs.some(t=>t[0]===A.tab))A.tab='queue';
 const pendM=A.members?A.members.filter(m=>m.status==='pending').length:0,qn=staffQueueN();
 return `<div class="page-title"><button class="back" data-go="me">${icon('left')}나의 러닝</button><small>운영진 전용</small><h1>운영 도구</h1></div>
 ${tabs.length>1?`<div class="tabs" role="tablist">${tabs.map(([id,l])=>`<button role="tab" aria-selected="${A.tab===id}" class="${A.tab===id?'on':''}" data-atab="${id}">${l}${id==='queue'&&qn?` ${qn}`:id==='members'&&pendM?` ${pendM}`:''}</button>`).join('')}</div>`:''}
 ${A.tab==='queue'?adminQueue():A.tab==='members'?adminMembers():adminSettings()}`;
}
function photoThumb(p){const u=S.photo[p];return `<button class="ph" data-act="photo" data-path="${esc(p)}" aria-label="인증 사진 크게 보기"><img data-photo="${esc(p)}" alt="인증 사진"${u?` src="${esc(u.url)}"`:''}></button>`;}
function adminQueue(){const A=S.admin;if(!A.queue)return loadingCard();
 return `<div class="sec-head"><h2>검토 대기<span class="num">${A.queue.length}</span></h2><button class="chip" data-act="admin-refresh">${icon('refresh')}새로고침</button></div>
 ${A.queue.length?A.queue.map(reviewCard).join(''):emptyCard('check','검토할 기록이 없어요','새 인증이 올라오면 여기에 보여요.')}
 <div class="sec-head"><h2>최근 처리</h2></div>${A.recent&&A.recent.length?`<section class="card list">${A.recent.map(recentRow).join('')}</section>`:'<p class="note">아직 처리한 기록이 없어요.</p>'}
 <p class="note">승인하면 바로 순위에 반영돼요. 본인 기록은 다른 운영진이 검토해요.</p>`;}
function reviewCard(r){const k=kst(r.started_at),c=kst(r.created_at),kmv=r.distance_m/1000;
 return `<article class="card review"><div class="rv-top"><span class="crew-av" style="${avStyle(r.class_id)}">${esc(ini(r.nickname))}</span><div><strong>${esc(r.nickname)} · ${esc(cname(r.class_id))}반</strong><small>${r.user_approved_count?`승인 기록 ${r.user_approved_count}회`:'첫 기록'} · ${mds(c.date)} ${c.time} 제출</small></div></div>
 <div class="rv-main"><b>${fmt(kmv)}<small>k</small></b><span>${md(k.date)} ${k.time} 시작<br>${dur(r.duration_s)} · ${pace(r.duration_s,kmv,r.pace_s)} · ${esc(r.kind)}</span></div>
 ${r.dup_suspect?`<p class="warn-line">${icon('alert')}앞뒤 5분 안에 시작한 다른 기록이 있어요. 중복인지 확인해 주세요.</p>`:''}${!r.user_approved_count&&!r.is_mine?`<p class="warn-line info">${icon('star')}이 회원의 첫 기록이에요. 사진을 꼼꼼히 봐 주세요.</p>`:''}
 ${r.memo?`<p class="memo">${esc(r.memo)}</p>`:''}<div class="photos">${(r.photos||[]).map(photoThumb).join('')}</div>
 ${r.is_mine?'<p class="rv-mine">내 기록은 다른 운영진이 검토해요.</p>':`<div class="btn-row"><button class="sbtn bad" data-act="rv-reject" data-id="${esc(r.id)}">반려</button><button class="sbtn pri" data-act="rv-approve" data-id="${esc(r.id)}">${icon('check')}승인</button></div>`}</article>`;}
function recentRow(r){const k=kst(r.started_at);return `<button class="rec" data-act="rv-open" data-id="${esc(r.id)}"><span class="dt"><b>${+k.date.slice(8)}</b>${+k.date.slice(5,7)}월</span><div><strong>${esc(r.nickname)} · ${fmt(r.distance_m/1000)}k</strong><small>${esc(cname(r.class_id))}반 · ${r.status==='approved'&&!r.reviewer_nickname?'사진과 같아 자동 반영':`검토 ${esc(r.reviewer_nickname||'-')}`}${r.review_note?` · ${esc(r.review_note)}`:''}</small></div>${stChip(r.status)}</button>`;}
function adminMembers(){const A=S.admin;if(!A.members)return loadingCard();
 const ms=A.members,pend=ms.filter(m=>m.status==='pending'),act=ms.filter(m=>m.status==='active'),rest=ms.filter(m=>m.status!=='pending'&&m.status!=='active');
 const counts=D.classList.map(c=>`${esc(c.name)} ${act.filter(m=>m.class_id===c.id&&m.is_runner).length}`).join(' · ');
 return `${pend.length?`<div class="sec-head"><h2>가입 대기<span class="num">${pend.length}</span></h2></div><section class="card list">${pend.map(memberRow).join('')}</section>`:''}
 <div class="sec-head"><h2>활동 중<span class="num">${act.length}</span></h2></div><p class="help" style="margin:-4px 2px 10px">레이스 참가 인원 · ${counts}</p><section class="card list">${act.map(memberRow).join('')}</section>
 ${rest.length?`<div class="sec-head"><h2>거절·탈퇴</h2></div><section class="card list">${rest.map(memberRow).join('')}</section>`:''}
 <p class="note">반 평균은 레이스에 참가한 활동 회원 수로 나눠요. 운영만 하는 분은 '관리'에서 레이스 참가를 끌 수 있어요.</p>`;}
function memberRow(m){const role=m.role==='admin'?'관리자':m.role==='reviewer'?'검토자':'',id=esc(m.id);
 const acts=m.status==='pending'?`<button class="sbtn" data-act="m-set" data-id="${id}" data-v="rejected">거절</button><button class="sbtn pri" data-act="m-set" data-id="${id}" data-v="active">승인</button>`:m.status==='active'?`<button class="sbtn" data-act="m-manage" data-id="${id}">관리</button>`:`<button class="sbtn" data-act="m-set" data-id="${id}" data-v="active">${m.status==='left'?'복구':'다시 승인'}</button>`;
 return `<div class="mrow"><span class="crew-av" style="${avStyle(m.class_id)}">${esc(ini(m.nickname))}</span><div><strong>${esc(m.nickname)}${role?`<span class="role">${role}</span>`:''}${m.status==='active'&&!m.is_runner?'<span class="role off">레이스 미참가</span>':''}</strong><small>${esc(cname(m.class_id))}반 · ${esc(m.email||'')}</small><small>${m.status==='pending'?`${mds(kst(m.created_at).date)} 가입 신청`:m.status==='active'?`승인 기록 ${m.approved_run_count}회`:m.status==='left'?'탈퇴':'가입 거절'}</small></div><div class="acts">${acts}</div></div>`;}
function adminSettings(){const s=S.admin.settings;if(!s)return loadingCard();
 return `<form id="sf" class="card" novalidate><div class="field"><label for="s-code">초대코드</label><div class="inline"><input id="s-code" name="invite_code" value="${esc(s.invite_code)}" maxlength="20" autocapitalize="characters" autocomplete="off" spellcheck="false"><button type="button" class="sbtn" data-act="copy-invite">${icon('copy')}복사</button></div><small class="help">영문·숫자 4~20자예요. 바꾸면 이전 코드로는 가입할 수 없어요.</small></div>
 <div class="field"><label for="s-name">시즌 이름</label><input id="s-name" name="season_name" value="${esc(s.season_name)}" maxlength="40"></div>
 <div class="row2"><div class="field"><label for="s-start">시작일</label><input id="s-start" type="date" name="season_start" value="${esc(s.season_start)}"></div><div class="field"><label for="s-end">종료일</label><input id="s-end" type="date" name="season_end" value="${esc(s.season_end)}"></div></div>
 <div class="row2"><div class="field"><label for="s-win">제출 기한(일)</label><input id="s-win" type="number" inputmode="numeric" name="submit_window_days" min="1" max="31" value="${esc(s.submit_window_days)}"></div><div class="field"><label for="s-grace">마감 유예(일)</label><input id="s-grace" type="number" inputmode="numeric" name="grace_days" min="0" max="31" value="${esc(s.grace_days)}"></div></div>
 <p class="help">제출 기한은 달린 날로부터 며칠 안에 인증해야 하는지, 마감 유예는 시즌이 끝난 뒤 며칠까지 인증을 받을지예요.</p>
 <label class="check" style="margin-top:14px"><input type="checkbox" name="auto_approve" ${s.auto_approve===false?'':'checked'}> 사진과 같은 기록은 바로 반영하기</label><p class="help">사진에서 읽은 날짜·시각·거리·시간을 고치지 않고 올린 기록은 승인 없이 바로 순위에 들어가요. 5분 안에 겹치는 기록과 직접 고친 기록만 확인 대기로 와요. 바로 반영된 기록도 최근 처리에서 집계 제외할 수 있어요.</p><p class="err-msg" id="serr"></p><button class="btn" type="submit">저장하기</button></form>
 <div class="sec-head"><h2>참가자 초대</h2></div><section class="card"><p class="help">가입 주소와 초대코드를 한 번에 복사해서 단톡방에 보내 주세요.</p><button class="btn ghost" style="margin-top:12px" data-act="copy-share">${icon('copy')}가입 안내 문구 복사</button></section>
 <div class="sec-head"><h2>기록 백업</h2></div><section class="card"><p class="help">무료 서버는 자동 백업이 없어요. 시즌 중에 가끔 전체 기록을 내려받아 두세요.</p><button class="btn ghost" style="margin-top:12px" data-act="admin-export">${icon('down')}전체 기록 CSV 내려받기</button></section>`;}
// 운영 화면 목록은 모양이 정해져 있어 페이스는 따로 받아 붙여요. 실패해도 시간÷거리로 보여 주면 돼서 조용히 넘어가요.
async function addPaces(rows){if(!rows.length||!API.paces)return;try{const m=new Map((await API.paces(rows.map(r=>r.id))).map(x=>[x.id,x.pace_s]));rows.forEach(r=>{if(m.has(r.id))r.pace_s=m.get(r.id);});}catch(e){}}
async function adminLoad(quiet){const A=S.admin;if(!isStaff())return;const tab=A.tab;if(!quiet){A.loading=true;}
 try{if(tab==='queue'){const [q,r]=await Promise.all([API.queue(),API.recent()]);A.queue=q;A.recent=r;await addPaces(q.concat(r));A.at=Date.now();}else if(tab==='members')A.members=await API.members();else A.settings=await API.getSettings();}
 catch(e){toast(errMsg(e));if(authLost(e))return sessionLost();}
 A.loading=false;if(S.view==='app'&&(S.page==='admin'||S.page==='me'||S.page==='home'))render(true);}
async function refreshQueue(){if(!isStaff())return;try{const [q,m]=await Promise.all([API.queue(),isAdmin()?API.members():null]);S.admin.queue=q;if(m)S.admin.members=m;S.admin.at=Date.now();if(S.view==='app')render(true);}catch(_){}}
async function fillPhotos(){const imgs=$$('img[data-photo]'),need=[...new Set(imgs.map(i=>i.dataset.photo))].filter(p=>!S.photo[p]||Date.now()-S.photo[p].at>50*60e3);
 if(need.length){try{for(const x of await API.photoUrls(need))if(x.url)S.photo[x.path]={url:x.url,at:Date.now()};}catch(_){}}
 $$('img[data-photo]').forEach(i=>{const p=S.photo[i.dataset.photo];if(p&&i.getAttribute('src')!==p.url)i.src=p.url;});}

/* ===== 로그인·가입·대기 화면 ===== */
const FALLBACK_CLASSES=[{id:'hanam',name:'하남',sort:1,color:'#F2734B'},{id:'saebyeok',name:'새벽',sort:2,color:'#1FA37A'},{id:'jamsil',name:'잠실',sort:3,color:'#D9488F'},{id:'yeouido',name:'여의도',sort:4,color:'#7B61FF'}];
function viewAuth(){const sign=S.authMode==='signup';return `<div class="auth"><div class="brand">${brandMark(68)}<h1>러닝 BK 챌린지</h1><p>4개 반 마일리지 대항전 · 개인전</p></div>${sign?signupForm():loginForm()}</div>`;}
function loginForm(){return `<form id="login" class="card" novalidate><h2>로그인</h2><div class="field"><label for="l-email">이메일</label><input id="l-email" name="email" type="email" autocomplete="email" inputmode="email" required></div><div class="field"><label for="l-pw">비밀번호</label><input id="l-pw" name="password" type="password" autocomplete="current-password" required></div><p class="err-msg" id="aerr"></p><button class="btn" type="submit">로그인</button></form>
 <p class="auth-alt">처음이신가요? <button type="button" data-act="to-signup">초대코드로 가입하기</button></p><p class="note">비밀번호를 잊었다면 운영진에게 임시 비밀번호를 요청해 주세요.</p>`;}
function signupForm(){const cl=S.classes||FALLBACK_CLASSES;return `<form id="signup" class="card" novalidate><h2>가입하기</h2><p class="sheet-sub">운영진에게 받은 초대코드가 필요해요.</p>
 <div class="field"><label for="s-inv">초대코드</label><input id="s-inv" name="invite_code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" required></div>
 <div class="field"><label for="s-nick">닉네임 <span class="opt">2~12자 · 순위표에 보여요</span></label><input id="s-nick" name="nickname" autocomplete="nickname" maxlength="12" required></div>
 <div class="field"><span class="lbl">우리 반</span><div class="classpick" role="radiogroup" aria-label="우리 반">${cl.map(c=>`<label style="--c:${col(c.color)}"><input type="radio" name="class_id" value="${esc(c.id)}" required><i></i>${esc(c.name)}반</label>`).join('')}</div></div>
 <div class="field"><label for="s-email">이메일 <span class="opt">로그인 아이디로 써요</span></label><input id="s-email" name="email" type="email" autocomplete="email" inputmode="email" required></div>
 <div class="field"><label for="s-pw">비밀번호 <span class="opt">8자 이상</span></label><input id="s-pw" name="password" type="password" autocomplete="new-password" minlength="8" required></div>
 <div class="field"><label for="s-pw2">비밀번호 확인</label><input id="s-pw2" name="password2" type="password" autocomplete="new-password" required></div>
 <p class="err-msg" id="aerr"></p><button class="btn" type="submit">가입 신청하기</button></form>
 <p class="auth-alt">이미 계정이 있나요? <button type="button" data-act="to-login">로그인</button></p>`;}
function viewGate(){const p=D&&D.me,M={pending:['clock','가입 승인을 기다리고 있어요','운영진이 확인하면 바로 시작할 수 있어요. 승인되면 이 화면에서 바로 넘어가요.'],rejected:['x','가입이 승인되지 않았어요','궁금한 점은 운영진에게 문의해 주세요.'],left:['user','탈퇴 처리된 계정이에요','다시 참여하려면 운영진에게 문의해 주세요.'],noprofile:['alert','가입 정보를 찾지 못했어요','운영진에게 문의해 주세요.']}[S.gate]||['alert','',''];
 return `<div class="gate"><div class="gate-ico">${icon(M[0])}</div><h1>${M[1]}</h1><p>${M[2]}</p>${p?`<p class="gate-who">${esc(p.nickname)} · ${esc(cname(p.class_id))}반</p>`:''}${S.gate==='pending'?`<button class="btn" data-act="recheck">${icon('refresh')}승인 확인하기</button>`:''}<button class="btn ghost" data-act="logout">로그아웃</button></div>`;}
const viewLoading=()=>`<div class="loading"><span class="spin"></span><p>불러오는 중이에요</p></div>`;
const viewError=()=>`<div class="gate"><div class="gate-ico">${icon('alert')}</div><h1>연결이 원활하지 않아요</h1><p>${esc(S.err)}</p><button class="btn" data-act="retry">${icon('refresh')}다시 시도</button>${LIVE?'<button class="btn ghost" data-act="logout">로그아웃</button>':''}</div>`;

/* ===== 온라인 트랙: 3D 트랙은 누를 때만 받아요(three.js 포함 약 0.7MB) ===== */
let trackLoad=null;
// 오늘 기록을 인증한 우리 반 친구들(나 빼고, 사람마다 가장 최근 기록 하나). 트랙에서 하이파이브하면 기존 응원으로 들어가요.
function trackGhosts(){const seen=new Set(),pc={};D.players.forEach(p=>pc[p.id]=p.cls);
 return D.feed.filter(f=>f.date===D.today&&!f.mine).filter(f=>!seen.has(f.user)&&seen.add(f.user)).map(f=>({runId:f.id,id:f.user,name:f.name,cls:pc[f.user]||D.me.class_id,km:f.km,cheered:f.on,look:lookOf(f.user)}));}
function trackCard(){const g=trackGhosts(),left=g.filter(x=>!x.cheered).length;
 const t=g.length?(left?`오늘 우리 반 ${g.length}명이 달렸어요 · 하이파이브 ${left}명 남음`:`오늘 달린 ${g.length}명 모두에게 하이파이브했어요`):'오늘은 아직 아무도 안 달렸어요. 첫 주자가 되어 볼까요?';
 return `<button class="infocard trackcard" data-act="track" aria-label="온라인 트랙 들어가기"><span class="crew-av blue">${icon('track')}</span><div><strong>온라인 트랙</strong><small>${t}</small></div><span class="go">${icon('chev')}</span></button>`;}
function ensureTrack(){if(window.BKTrack&&window.THREE)return Promise.resolve(true);if(!window.BK_TRACK_SRC)return Promise.resolve(false);
 if(!trackLoad)trackLoad=new Promise(ok=>{const s=document.createElement('script');s.src=window.BK_TRACK_SRC;s.async=true;s.onload=()=>ok(!!window.BKTrack);s.onerror=()=>{trackLoad=null;ok(false);};document.head.appendChild(s);});return trackLoad;}
// 온라인 트랙 보너스 XP(0011): quest_claims 줄(t_enter, t_five)로 저장돼 my_claims로 합산돼요. t_five는 하루 한 줄이라 같은 줄을 갱신해요.
function addTrackXp(r){if(!r||!(r.xp>0))return false;const c=D.claims.find(x=>x.q===r.quest_id&&x.p===r.period_key);
 if(c)c.xp=+r.total||c.xp+r.xp;else D.claims.push({q:r.quest_id,p:r.period_key,xp:+r.total||r.xp});touch();return true;}
const ranToday=()=>D.runs.some(r=>r.date===D.today&&(r.status==='pending'||r.status==='approved'));
const tToast=(t,hi)=>{try{window.BKTrack.toast&&window.BKTrack.toast(t,hi);}catch(_){}};
// 트랙 안 하이파이브 = 응원(toggle_cheer). 이미 응원한 기록은 취소되지 않게 다시 보내지 않아요.
async function trackCheer(runId){const f=D.feed.find(x=>x.id===runId);if(!f)throw new Error('기록을 찾을 수 없어요');if(f.on)return {already:true};
 const r=await API.cheer(runId);f.on=!!r.cheered;f.cheers=+r.count||0;D.cheers=D.cheers.filter(c=>c.run!==runId);if(r.cheered)D.cheers.unshift({run:runId,date:D.today});touch();
 if(!r.cheered){const r2=await API.cheer(runId);f.on=!!r2.cheered;f.cheers=+r2.count||0;if(r2.cheered)D.cheers.unshift({run:runId,date:D.today});touch();}
 return {cheered:f.on};}
async function openTrack(b){if(S.trackOpen)return;b.disabled=true;const ok=await ensureTrack();if(b.isConnected)b.disabled=false;
 if(!ok)return toast('온라인 트랙을 불러오지 못했어요. 잠시 뒤 다시 해 주세요');
 closeSheet();
 try{S.trackOpen=true;window.BKTrack.open({me:{id:D.me.id,name:D.me.nickname,cls:D.me.class_id,look:lookOf(D.me.id)},onLook:l=>saveLook(l,true),classes:D.classList.map(c=>({id:c.id,name:c.name,color:col(c.color)})),sb:LIVE?sb:null,
  ghosts:trackGhosts(),onFive:id=>trackCheer(id).then(r=>{if(r&&r.cheered){snd('cheer');
    if(D.me.is_runner)API.trackXp('five').then(x=>{if(addTrackXp(x))tToast(`하이파이브 +1 XP · 오늘 ${x.total}/5`,true);}).catch(()=>{});}
   return r;}).catch(e=>{if(authLost(e))sessionLost();throw new Error(errMsg(e));}),
  onClose(){S.trackOpen=false;if(S.view==='app'){render(true);progress();}}});
  if(D.me.is_runner&&ranToday())API.trackXp('enter').then(r=>{if(addTrackXp(r))tToast(`오늘 인증하고 트랙에 왔어요 · +${r.xp} XP`,true);}).catch(()=>{});}
 catch(_){S.trackOpen=false;toast('이 기기에서는 3D 화면을 열 수 없어요');}}

/* ===== 렌더·네비 ===== */
const NAV=[['home','홈','home'],['league','대항전','flag'],null,['ranking','개인전','trophy'],['me','나','user']];
function render(keep){const y=scrollY;
 const html=S.view==='app'?({home,league,ranking,me,admin})[S.page]():({loading:viewLoading,auth:viewAuth,gate:viewGate,error:viewError})[S.view]();
 $('#screen').innerHTML=`<div class="screen${S.view==='app'?'':' bare'}">${html}</div>`;
 const nav=$('#nav');nav.hidden=S.view!=='app';nav.innerHTML=S.view!=='app'?'':NAV.map(n=>n?`<button class="${S.page===n[0]||(n[0]==='me'&&S.page==='admin')?'on':''}" data-go="${n[0]}" ${S.page===n[0]?'aria-current="page"':''}${n[0]==='me'&&todoN()?' aria-label="나, 운영 도구에 할 일 있음"':''}>${icon(n[2])}${n[1]}${n[0]==='me'&&todoN()?'<span class="ndot"></span>':''}</button>`:`<button class="plus" data-act="submit" aria-label="러닝 기록 인증하기">${icon('plus')}</button>`).join('');
 window.scrollTo(0,keep?y:0);if($('img[data-photo]'))fillPhotos();}
function go(p){if(p==='admin'&&!isStaff())p='me';if(raceRaf){cancelAnimationFrame(raceRaf);raceRaf=0;}S.page=p;if(location.hash!=='#'+p)history.replaceState(null,'','#'+p);render();
 if(p==='admin')adminLoad();else if(isStaff()&&(p==='me'||p==='home')&&Date.now()-S.admin.at>60e3)refreshQueue();}
const snd=n=>{try{window.BKSound&&window.BKSound.play(n);}catch(_){}};
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2800);}
function burstAt(el,colors=['#1d6cff','#6fa3ff','#cdf564','#0e1b30','#e0b03c','#9db8e8']){if(reduce.matches||!el)return;const r=el.getBoundingClientRect(),b=document.createElement('div');b.className='burst';b.style.left=r.left+r.width/2+'px';b.style.top=r.top+r.height/2+'px';for(let i=0;i<22;i++){const p=document.createElement('i'),a=Math.random()*6.28,d=40+Math.random()*80;p.style.cssText=`--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-30}px;background:${colors[i%colors.length]}`;b.appendChild(p);}document.body.appendChild(b);setTimeout(()=>b.remove(),1100);}
function xpFloat(el,t){const r=el.getBoundingClientRect(),f=document.createElement('div');f.className='xpfloat';f.textContent=t;f.style.left=r.left+r.width/2+'px';f.style.top=r.top-6+'px';document.body.appendChild(f);setTimeout(()=>f.remove(),1150);}
function sheet(html){$('#toast').hidden=true;$('#sheet').innerHTML=`<div class="grab"></div><button class="x" data-act="close" aria-label="닫기">${icon('x')}</button>${html}`;$('#sheet').classList.add('on');$('#scrim').classList.add('on');$('#sheet').scrollTop=0;if($('#sheet img[data-photo]'))fillPhotos();}
function closeSheet(){$('#sheet').classList.remove('on');$('#scrim').classList.remove('on');stopOcr();}
function armed(btn,label){if(btn.dataset.armed==='1')return true;const old=btn.innerHTML;btn.dataset.armed='1';btn.classList.add('armed');btn.textContent=label;setTimeout(()=>{if(btn.isConnected&&btn.dataset.armed==='1'){btn.dataset.armed='';btn.classList.remove('armed');btn.innerHTML=old;}},4000);return false;}
async function busy(btn,fn){if(S.busy)return;S.busy=true;const old=btn&&btn.innerHTML;if(btn)btn.disabled=true;try{return await fn();}finally{S.busy=false;if(btn&&btn.isConnected){btn.disabled=false;if(old!==undefined&&btn.dataset.keep!=='1')btn.innerHTML=old;}}}
async function copyText(t,done='복사했어요'){try{await navigator.clipboard.writeText(t);toast(done);}catch(_){const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy');}catch(_){}a.remove();toast(ok?done:'복사하지 못했어요. 길게 눌러 직접 복사해 주세요.');}}
function download(name,rows){const cell=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return `"${s.replace(/"/g,'""')}"`;};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
function initSeen(){if(!LIVE){S.seen={lv:lvInfo().lv,bingo:bingoCount(),notice:'',bd:gotBadges()};return;}const k=`bk:seen:${D.me.id}`;let s=null;try{s=JSON.parse(localStorage.getItem(k)||'null');}catch(_){}
 S.seen=s&&typeof s==='object'?{lv:+s.lv||1,bingo:+s.bingo||0,notice:String(s.notice||''),bd:s.bd==null?gotBadges():+s.bd||0}:{lv:lvInfo().lv,bingo:bingoCount(),notice:lastReviewAt(),bd:gotBadges()};saveSeen();}
function gotBadges(){return badges().filter(x=>x.got).length;}
function saveSeen(){if(!LIVE||!D||!D.me||!S.seen)return;try{localStorage.setItem(`bk:seen:${D.me.id}`,JSON.stringify(S.seen));}catch(_){}}
// 레벨이 오르거나 빙고 줄이 늘면 축하해요. 자리를 비운 사이 승인된 기록도 다음에 열 때 축하해요.
function progress(){if(!S.seen||S.view!=='app')return false;const L=lvInfo(),b=bingoCount(),nb=b-S.seen.bingo,up=L.lv>S.seen.lv?L.lv:0,bl=badges().filter(x=>x.got),nbd=bl.length-(S.seen.bd||0);
 S.seen.bingo=Math.max(S.seen.bingo,b);S.seen.lv=Math.max(S.seen.lv,L.lv);S.seen.bd=Math.max(S.seen.bd||0,bl.length);saveSeen();
 if(up){levelUp(up);return true;}if(nb>0){snd('bingo');toast(nb===2?'더블 빙고 · +200 XP':nb>2?`빙고 ${nb}줄 완성 · +${nb*100} XP`:'빙고 한 줄 완성 · +100 XP');return true;}if(nbd>0){snd('badge');toast(nbd>1?`새 배지 ${nbd}개를 모았어요`:`새 배지 · ${bl[bl.length-1].t}`);return true;}return false;}
function levelUp(lv){const t=tierOf(lv);snd('levelup');sheet(`<div class="lvup"><div class="glow"></div>${tierBadge(lv,100)}<div style="margin-top:16px;position:relative"><span class="chip">LEVEL UP</span></div><h2>Lv.${lv} 달성</h2><p class="muted">${t[1]} 티어 러너로 한 단계 성장했어요.<br>꾸준히 쌓은 발걸음 덕분이에요.</p><button class="btn" style="margin-top:22px;position:relative" data-act="close">계속 달리기</button></div>`);setTimeout(()=>burstAt($('.lvup .tier')),150);}

/* ===== 행동: 보상·응원·기록 ===== */
async function claim(qid,p,el){if(S.busy)return;S.busy=true;el.disabled=true;
 try{const r=await API.claim(qid,p);if(!claimed(r.quest_id,r.period_key))D.claims.push({q:r.quest_id,p:r.period_key,xp:+r.xp||0});touch();snd('claim');burstAt(el);xpFloat(el,`+${r.xp} XP`);if(navigator.vibrate)navigator.vibrate(20);
  setTimeout(()=>{render(true);if(!progress())toast(`퀘스트 완료 · +${r.xp} XP`);},reduce.matches?0:450);}
 catch(e){toast(errMsg(e));if(authLost(e))return sessionLost();if(e.hint==='already_claimed'||e.hint==='quest_unmet')loadQuiet();else if(el.isConnected)el.disabled=false;}
 finally{S.busy=false;}}
async function claimAll(el,kind){const list=kind?quests(kind).filter(q=>q.done&&!q.got).map(q=>({q,p:q.p})):pastRewards();if(!list.length||S.busy)return;S.busy=true;el.disabled=true;el.textContent='받는 중…';let xp=0,n=0;
 try{for(const {q,p} of list){try{const r=await API.claim(q.id,p);if(!claimed(r.quest_id,r.period_key))D.claims.push({q:r.quest_id,p:r.period_key,xp:+r.xp||0});xp+=+r.xp||0;n++;}catch(e){if(e.hint!=='already_claimed'&&e.hint!=='quest_unmet')throw e;}}}
 catch(e){toast(errMsg(e));}finally{S.busy=false;touch();}
 if(n){snd('claim');burstAt(el);xpFloat(el,`+${xp} XP`);setTimeout(()=>{render(true);if(!progress())toast(kind?`퀘스트 ${n}개 완료 · +${xp} XP`:`지난 보상 ${n}개 · +${xp} XP`);},reduce.matches?0:450);}else{render(true);loadQuiet();}}
async function cheer(id,el){if(S.busy)return;S.busy=true;el.disabled=true;
 try{const r=await API.cheer(id),m=S.mem&&S.mem.rows.find(x=>x.id===id),f=D.feed.find(x=>x.id===id)||m;[D.feed.find(x=>x.id===id),m].forEach(x=>{if(x){x.on=!!r.cheered;x.cheers=+r.count||0;}});if(m&&$('#sheet.on [data-mlist]'))$('[data-mlist]').innerHTML=memberList();D.cheers=D.cheers.filter(c=>c.run!==id);if(r.cheered){D.cheers.unshift({run:id,date:D.today});snd('cheer');}touch();render(true);
  if(!progress()&&r.cheered&&f)toast(`${f.name}님에게 하이파이브를 보냈어요`);}
 catch(e){toast(errMsg(e));if(authLost(e))return sessionLost();render(true);}finally{S.busy=false;}}
function noticeList(){const out=[],rows=standings(),mine=rows.find(r=>r.mine),gp=gapAhead(rows);
 if(joinN())out.push({ic:'user',t:`가입 신청 ${joinN()}명`,d:'운영 도구 > 회원에서 승인해 주세요.',go:'admin',tab:'members'});
 if(isStaff()&&staffQueueN())out.push({ic:'shield',t:`검토할 기록 ${staffQueueN()}건`,d:'운영 도구에서 확인해 주세요.',go:'admin',tab:'queue'});
 D.runs.filter(r=>r.status==='pending').forEach(r=>out.push({ic:'clock',t:`${md(r.date)} ${fmt(r.distance)}k 확인 중`,d:'승인되면 순위에 반영돼요.'}));
 D.runs.filter(r=>r.reviewedAt&&(r.status==='approved'||r.status==='rejected')).sort((a,b)=>b.reviewedAt.localeCompare(a.reviewedAt)).slice(0,6).forEach(r=>out.push(r.status==='approved'?{ic:'check',t:`${md(r.date)} ${fmt(r.distance)}k 승인`,d:'레벨 XP와 우리 반 평균에 반영됐어요.',fresh:r.reviewedAt>(S.seen.notice||'')}:{ic:'x',t:`${md(r.date)} ${fmt(r.distance)}k 반려`,d:r.note?`사유: ${r.note}`:'자세한 사유는 운영진에게 물어봐 주세요.',fresh:r.reviewedAt>(S.seen.notice||''),bad:true}));
 if(mine&&gp)out.push({ic:'flag',t:`${gp.ahead.name}반까지 반 합계 ${gapText(gp)}`,d:`우리 ${mine.name}반은 지금 ${mine.rank}위예요.`});
 return out;}
function notice(){const list=noticeList();sheet(`<h2>알림</h2><div style="margin-top:12px">${list.length?list.map(n=>`<div class="crew-row${n.fresh?' fresh':''}"><span class="crew-av ${n.bad?'bad':'blue'}">${icon(n.ic)}</span><div><strong>${esc(n.t)}</strong><small>${esc(n.d)}</small></div>${n.go?`<button class="sbtn" data-go="${n.go}"${n.tab?` data-tab="${n.tab}"`:''}>보기</button>`:''}</div>`).join(''):'<p class="note">새 알림이 없어요.</p>'}</div>${LIVE?'':'<p class="note">시연 알림이에요.</p>'}`);
 S.seen.notice=lastReviewAt()>(S.seen.notice||'')?lastReviewAt():S.seen.notice;saveSeen();const d=$('.icon-btn .dot');if(d&&!todoN())d.remove();}
function showRec(id){const r=D.runs.find(x=>x.id===id);if(!r)return;const p=pace(r.duration,r.distance,r.pace);
 sheet(`<h2>러닝 기록</h2><div class="center" style="margin:22px 0 6px"><span class="bignum">${fmt(r.distance)}</span><span class="muted" style="font-size:20px;font-weight:700"> k</span><p>${md(r.date)} ${r.time} · ${dur(r.duration)}${p?` · ${p}`:''}</p><p>${esc(r.type)}</p></div><div class="rewards">${stChip(r.status,true)}</div>
 ${r.status==='rejected'?`<p class="warn-line">${icon('alert')}${r.note?`반려 사유: ${esc(r.note)}`:'운영진에게 반려 사유를 확인해 주세요.'}</p>`:''}${r.memo?`<p class="memo">${esc(r.memo)}</p>`:''}
 ${r.photos.length?`<div class="photos">${r.photos.map(photoThumb).join('')}</div>`:''}${r.status==='pending'?`<button class="btn ghost danger" style="margin-top:16px" data-act="withdraw" data-id="${esc(r.id)}">인증 요청 취소</button>`:''}`);}
async function withdraw(id,btn){await busy(btn,async()=>{try{const r=await API.withdraw(id),i=D.runs.findIndex(x=>x.id===id);if(i>=0)D.runs[i]=normRun(r);if(S.admin.queue)S.admin.queue=S.admin.queue.filter(x=>x.id!==id);touch();closeSheet();render(true);toast('인증 요청을 취소했어요');}catch(e){toast(errMsg(e));if(e.hint==='conflict')loadQuiet();}});}
function openPhoto(path){const u=S.photo[path];if(!u)return toast('사진을 불러오는 중이에요');const d=document.createElement('div');d.className='lightbox';d.setAttribute('role','dialog');d.setAttribute('aria-label','인증 사진');d.innerHTML=`<img alt="인증 사진" src="${esc(u.url)}"><button class="x" aria-label="닫기">${icon('x')}</button>`;d.addEventListener('click',()=>d.remove());document.body.appendChild(d);}
function exportCsv(){download('RUNNING_BK_내기록.csv',[['날짜','시작','거리(km)','시간','종류','상태','메모'],...D.runs.map(r=>[r.date,r.time,r.distance,dur(r.duration),r.type,ST[r.status]||r.status,r.memo])]);toast('기록을 CSV로 내보냈어요');}

/* ===== 기록 인증 (사진 자동 인식) ===== */
let ocrJob=0,ocrWorker=null,ocrLoad=null;
function ensureOcr(){if(typeof createRunningOcrEngine==='function'&&typeof parseRunningOcr==='function')return Promise.resolve(true);if(!window.BK_OCR_SRC)return Promise.resolve(false);
 if(!ocrLoad)ocrLoad=new Promise(ok=>{const s=document.createElement('script');s.src=window.BK_OCR_SRC;s.async=true;s.onload=()=>ok(typeof createRunningOcrEngine==='function');s.onerror=()=>{ocrLoad=null;ok(false);};document.head.appendChild(s);});return ocrLoad;}
function openSubmit(){
 if(!canSubmit())return toast(D.today<D.season.start?`시즌은 ${md(D.season.start)}부터 시작해요.`:'이번 시즌 기록 제출 기간이 끝났어요.');
 S.files=[];S.submitKey=uuid();const min=submitMin(),max=submitMax();ensureOcr();
 sheet(`<h2>러닝 기록 인증</h2><p class="sheet-sub">기록 캡처를 올리면 날짜·시작 시각·거리·시간·페이스를 자동으로 채워 드려요.</p>
 <form id="rf" novalidate><label class="drop" for="cap"><span class="ico">${icon('image')}</span><b>기록 캡처 올리기</b><small>JPEG·PNG·WebP · 최대 3장 · 장당 10MB</small></label><input id="cap" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden><div class="thumbs" id="thumbs"></div><p class="ocr" id="ocrmsg" aria-live="polite"></p>
 <div class="row2"><div class="field"><label for="f-date">러닝 날짜</label><input id="f-date" name="date" type="date" min="${min}" max="${max}" value=""></div><div class="field"><label for="f-time">시작 시각</label><input id="f-time" name="time" type="time" value=""></div></div>
 <div class="field"><label for="f-dist">거리</label><span class="unit-in"><input id="f-dist" name="distance" type="number" inputmode="decimal" step="0.001" min="0" placeholder="예: 5.2"><span class="unit" aria-hidden="true">km</span></span></div>
 <div class="field"><label>경과 시간</label><div class="row3"><span class="unit-in"><input name="h" type="number" inputmode="numeric" min="0" placeholder="0" aria-label="시간"><span class="unit" aria-hidden="true">시간</span></span><span class="unit-in"><input name="m" type="number" inputmode="numeric" min="0" max="59" placeholder="0" aria-label="분"><span class="unit" aria-hidden="true">분</span></span><span class="unit-in"><input name="s" type="number" inputmode="numeric" min="0" max="59" placeholder="0" aria-label="초"><span class="unit" aria-hidden="true">초</span></span></div></div>
 <div class="field"><label>평균 페이스 <span class="opt">1k당 · 거리와 시간으로 자동 계산돼요</span></label><div class="row2"><span class="unit-in"><input name="pm" type="number" inputmode="numeric" min="0" max="59" placeholder="0" aria-label="페이스 분"><span class="unit" aria-hidden="true">분</span></span><span class="unit-in"><input name="ps" type="number" inputmode="numeric" min="0" max="59" placeholder="0" aria-label="페이스 초"><span class="unit" aria-hidden="true">초</span></span></div></div>
 <div class="field"><label for="f-type">러닝 종류</label><select id="f-type" name="type"><option>실외 러닝</option><option>트레드밀 러닝</option><option>트레일 러닝</option></select></div>
 <div class="field"><label for="f-memo">메모 <span class="opt">선택 · 운영진에게 보여요</span></label><textarea id="f-memo" name="memo" maxlength="200" rows="2" placeholder="예: 트레드밀이라 지도 기록이 없어요"></textarea></div>
 <label class="check"><input type="checkbox" id="ok"> 사진과 입력한 기록이 같은지 확인했어요. 자동 인식 값도 꼭 확인해 주세요.</label><p class="err-msg" id="ferr"></p><button class="btn" type="submit" id="fsub">인증 요청하기</button>
 <p class="note" style="margin-top:12px">${md(min)} ~ ${md(max)}에 달린 기록을 올릴 수 있어요.</p></form>`);
}
// pace in seconds per km from the form, and the form's elapsed seconds
const fPace=f=>(+f.elements.pm.value||0)*60+(+f.elements.ps.value||0);
const fSecs=f=>(+f.elements.h.value||0)*3600+(+f.elements.m.value||0)*60+(+f.elements.s.value||0);
function setDur(f,secs){[['h',Math.floor(secs/3600)],['m',Math.floor(secs%3600/60)],['s',secs%60]].forEach(([n,v])=>{f.elements[n].value=v;f.elements[n].classList.add('calc');});}
// Keep pace, distance and time in step: pace follows distance and time unless the runner typed it
// (or it came from the photo); a typed pace fills an empty time.
function syncPace(f,src){const dist=Number(f.elements.distance.value),secs=fSecs(f),pace=fPace(f),pm=f.elements.pm,ps=f.elements.ps;
 if(src==='pm'||src==='ps')f.dataset.paceSet=pace?'1':'';
 if(f.dataset.paceSet){if(!secs&&pace&&dist>0)setDur(f,Math.round(pace*dist));return;}
 if(dist>0&&secs){const p=Math.round(secs/dist);pm.value=Math.floor(p/60);ps.value=p%60;pm.classList.add('auto');ps.classList.add('auto');}
 else{pm.value='';ps.value='';}}
// Small modal over the sheet (e.g. a photo whose date is outside the challenge)
function alertBox(title,body){$('#dlg')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="dlg-scrim" id="dlg"><div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t"><div class="gate-ico">${icon('alert')}</div><h3 id="dlg-t">${esc(title)}</h3><p>${body}</p><button class="btn" data-act="dlg-ok">확인</button></div></div>`);$('#dlg .btn').focus();}
// A photo dated outside what can be submitted now: drop the photo and what was filled from it.
function rejectPhoto(f,date){const min=submitMin(),max=submitMax(),inSeason=date>=D.season.start&&date<=D.season.end;
 S.files=[];S.submitKey=uuid();const cap=$('#cap');if(cap)cap.value='';$('#thumbs').innerHTML='';$('#ocrmsg').textContent='';
 f.querySelectorAll('input.auto,input.calc').forEach(el=>{el.value='';el.classList.remove('auto','calc');});delete f.dataset.paceSet;
 alertBox(date>D.today?'날짜를 다시 확인해 주세요':inSeason?'제출 기한이 지난 기록이에요':'챌린지 기간의 기록이 아니에요',
  `사진 속 날짜는 <b>${date.slice(0,4)===D.today.slice(0,4)?'':`${date.slice(0,4)}년 `}${md(date)}</b>이에요.<br>${inSeason&&date<=D.today?`달린 날로부터 ${D.season.window}일 안에만 올릴 수 있어요.<br>`:`챌린지 기간은 ${md(D.season.start)} ~ ${md(D.season.end)}이에요.<br>`}지금은 <b>${md(min)} ~ ${md(max)}</b>에 달린 기록을 올릴 수 있어요.`);}
function stopOcr(){ocrJob++;if(ocrWorker){Promise.resolve(ocrWorker.terminate()).catch(()=>{});ocrWorker=null;}}
// average brightness of the whole photo (small copy), so a crop's margin matches its background
const mean=(img)=>{const c=document.createElement('canvas');c.width=40;c.height=80;const x=c.getContext('2d');x.drawImage(img,0,0,40,80);const d=x.getImageData(0,0,40,80).data;let s=0;for(let i=0;i<d.length;i+=4)s+=.299*d[i]+.587*d[i+1]+.114*d[i+2];return s/(d.length/4);};
// crop: a box in the k=1 reading's pixels; only that part is drawn, k times larger, on a white margin.
async function prep(file,k=1,mode=0,crop=null){const url=URL.createObjectURL(file),img=new Image();try{await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=url;});const r0=Math.min(2,1500/img.naturalWidth,2600/img.naturalHeight),r1=img.naturalWidth*r0<450?r0*1.4:r0,r=crop?r1*k:img.naturalWidth*r0*k<450?r0*1.4:r0*k,c=document.createElement('canvas');const x=c.getContext('2d');
 if(crop){const sx=Math.max(0,crop.x0/r1),sy=Math.max(0,crop.y0/r1),sw=Math.min(img.naturalWidth-sx,(crop.x1-crop.x0)/r1),sh=Math.min(img.naturalHeight-sy,(crop.y1-crop.y0)/r1),m=24;c.width=Math.round(sw*r)+2*m;c.height=Math.round(sh*r)+2*m;x.fillStyle=mean(img,x)<110?'#000':'#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,sx,sy,sw,sh,m,m,c.width-2*m,c.height-2*m);}
 else{c.width=Math.max(1,Math.round(img.naturalWidth*r));c.height=Math.max(1,Math.round(img.naturalHeight*r));x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);}
 // grayscale, and dark-mode screenshots inverted to dark text on light: OCR reads that far better
 const d=x.getImageData(0,0,c.width,c.height),px=d.data,n=px.length/4,colored=new Uint8Array(n);let sum=0;for(let i=0;i<px.length;i+=4){const g=.299*px[i]+.587*px[i+1]+.114*px[i+2];colored[i/4]=Math.max(px[i],px[i+1],px[i+2])-Math.min(px[i],px[i+1],px[i+2])>60;px[i]=px[i+1]=px[i+2]=g;sum+=g;}
 const dark=sum/n<110;
 // mode 1: light gray labels ("킬로미터", "평균 페이스") turn dark and pale backgrounds white, or OCR drops them.
 // mode 3: pure black and white, read 1.5x larger. Garmin's gray "11월 2일 @ 20:31" on black came out as "12 22" otherwise.
 // mode 2: also coloured shapes (Garmin's rings, map routes) become background; they hid "1.84 km" inside a ring.
 for(let i=0;i<px.length;i+=4){let g=dark?255-px[i]:px[i];if(mode===2&&colored[i/4])g=255;if(mode===3)g=g>=150?255:0;else if(mode)g=g>=205?255:Math.round(g*.45);px[i]=px[i+1]=px[i+2]=g;}
 x.putImageData(d,0,0);return c;}finally{URL.revokeObjectURL(url);}}
// Read the photo; while something is missing, read it again with gray text darkened, without coloured
// shapes, then smaller (big bold digits such as Garmin's "5:51 /km" read better there), taking only the
// missing values from each extra reading.
// Values are matched to labels by position, so a row of values over a row of labels pairs up correctly.
// One progress bar for all readings: the first reading fills 0–60%, each extra reading the next 10%.
let ocrStage=0;const ocrPct=p=>Math.min(99,Math.round(ocrStage?60+(ocrStage-1+p)*10:p*60));
const PACE_FLOOR=510;
const OCR_KEYS=['date','time','distance','durationSeconds','paceSeconds'];
async function readPhoto(w,file,stale){ocrStage=0;
 let first=null;const parse=async(k,mode)=>{const {data}=await w.recognize(await prep(file,k,mode),{},{blocks:true,text:true}),o={today:D.today},lines=[];
  (data.blocks||[]).forEach(b=>(b.paragraphs||[]).forEach(p=>(p.lines||[]).forEach(l=>lines.push({text:l.text,...l.bbox}))));
  if(!first&&k===1)first=lines;
  return lines.length?parseRunningOcr.layout(lines,o):parseRunningOcr(data.text||'',o);};
 const p=await parse(1,0);if(stale())return null;
 for(const [k,mode] of [[1,1],[1,2],[1.5,3],[.6,0],[.8,0]]){if(p.date&&p.time&&p.distance&&(p.durationSeconds!=null||p.paceSeconds!=null))break;
  ocrStage++;const q=await parse(k,mode);if(stale())return null;OCR_KEYS.forEach(key=>{if(p[key]==null&&q[key]!=null)p[key]=q[key];});}
 // Still no date: read the line that holds the start clock (or "@ 20:31") on its own, 3x larger in black and white,
 // as a single line. Garmin's small gray "11월 2일 @ 20:31" on black reads reliably that way (11-03).
 if(!p.date&&first){const H=Math.max(...first.map(l=>l.y1),1),cand=first.filter(l=>l.y0>H*.04&&l.y0<H*.6&&/\d{1,2}\s*[:;]\s*\d{2}/.test(l.text)&&!/:\d{2}:/.test(l.text)&&(/@|월|일|요일|\d\s*[./]\s*\d|오전|오후|am|pm/i.test(l.text)||(p.time&&l.text.replace(/\s/g,'').includes(p.time.replace(/^0/,''))))).slice(0,2);
  try{await w.setParameters({tessedit_pageseg_mode:'7'});
   for(const l of cand){const h=l.y1-l.y0,box={x0:l.x0-h,y0:l.y0-h*.4,x1:l.x1+h,y1:l.y1+h*.4};
    for(const [k,mode] of [[3,3],[3,1],[2.2,3]]){const {data}=await w.recognize(await prep(file,k,mode,box));if(stale())return null;const q=parseRunningOcr(data.text||'',{today:D.today});
     if(q.date){p.date=q.date;if(!p.time&&q.time)p.time=q.time;break;}}
    if(p.date)break;}}
  finally{await w.setParameters({tessedit_pageseg_mode:'11'});}}
 return p;}
async function runOcr(file){
 stopOcr();const job=ocrJob,msg=$('#ocrmsg'),f=$('#rf');msg.className='ocr';msg.textContent='사진 인식을 준비하는 중이에요…';
 if(!(await ensureOcr())){if(job===ocrJob&&$('#rf'))msg.textContent='이 화면에서는 자동 인식을 쓸 수 없어요. 직접 입력해 주세요.';return;}
 if(job!==ocrJob||!$('#rf'))return;msg.textContent='사진을 읽는 중이에요…';
 try{const w=await createRunningOcrEngine({logger:m=>{if(job===ocrJob&&m.status==='recognizing text')msg.textContent=`사진을 읽는 중이에요… ${ocrPct(m.progress)}%`;}});if(job!==ocrJob){w.terminate();return;}ocrWorker=w;
  const p=await readPhoto(w,file,()=>job!==ocrJob||!$('#rf'));if(!p)return;let n=0;
  if(p.date&&(p.date<submitMin()||p.date>submitMax()))return rejectPhoto(f,p.date);
  const put=(name,v)=>{const el=f.elements[name];if(v!==null&&v!==undefined&&el&&!el.value){el.value=v;el.classList.add('auto');n++;}};
  put('date',p.date);put('time',p.time);put('distance',p.distance&&!/\./.test(p.distance)?Number(p.distance).toFixed(2):p.distance);if(p.durationSeconds!==null&&p.durationSeconds!==undefined){put('h',Math.floor(p.durationSeconds/3600));put('m',Math.floor(p.durationSeconds%3600/60));put('s',p.durationSeconds%60);}
  if(p.paceSeconds&&!fPace(f)){put('pm',Math.floor(p.paceSeconds/60));put('ps',p.paceSeconds%60);f.dataset.paceSet='1';}
  // share images (e.g. Garmin) show distance and pace but no elapsed time: derive it from the photo's own values
  const pd=Number(f.elements.distance.value);if(p.paceSeconds&&p.durationSeconds==null&&pd>0&&!fSecs(f)){const t=Math.round(p.paceSeconds*pd);put('h',Math.floor(t/3600));put('m',Math.floor(t%3600/60));put('s',t%60);}
  if(!f.dataset.paceSet)syncPace(f);
  msg.textContent=n?`${n}개 칸을 자동으로 채웠어요. 파란색 칸을 사진과 비교해 주세요.${['date','time','distance','m'].every(k=>f.elements[k].classList.contains('auto'))?' 고치지 않고 올리면 바로 반영될 수 있어요.':''}`:'숫자를 확실히 읽지 못했어요. 직접 입력해 주세요.';
 }catch(e){if(job===ocrJob){msg.className='ocr err';msg.textContent='사진을 읽지 못했어요. 직접 입력해 주세요.';}}
 finally{if(job===ocrJob&&ocrWorker){Promise.resolve(ocrWorker.terminate()).catch(()=>{});ocrWorker=null;}}
}
// 올린 사진을 크게 띄우고, 아래에 지금 칸에 들어간 값을 붙여 보여 줘요. 사진을 누르면 두 배로 키워 밀어 볼 수 있어요.
function photoCmp(i){const f=S.files[i],form=$('#rf');if(!f||!form)return;const v=n=>form.elements[n].value,auto=n=>form.elements[n].classList.contains('auto')||form.elements[n].classList.contains('calc');
 const t=['h','m','s'].map(v),dur=t.some(x=>x!=='')?`${+t[0]||0}시간 ${+t[1]||0}분 ${+t[2]||0}초`:'',pace=v('pm')!==''||v('ps')!==''?`${+v('pm')||0}분 ${String(+v('ps')||0).padStart(2,'0')}초 /km`:'';
 const rows=[['날짜',v('date')?v('date').replace(/-/g,'.'):'',auto('date')],['시작 시각',v('time'),auto('time')],['거리',v('distance')?`${v('distance')} km`:'',auto('distance')],['경과 시간',dur,auto('m')],['평균 페이스',pace,auto('pm')]];
 const d=document.createElement('div');d.className='lightbox cmp';d.setAttribute('role','dialog');d.setAttribute('aria-label','사진과 입력값 비교');
 d.innerHTML=`<div class="cmp-img"><img alt="올린 기록 캡처" src="${URL.createObjectURL(f)}"></div><section class="cmp-vals"><div class="cmp-head"><strong>칸에 들어간 값</strong><small>파란 글씨는 사진에서 읽은 값 · 사진을 누르면 확대</small></div><dl>${rows.map(([k,x,a])=>`<div><dt>${k}</dt><dd class="${x&&a?'auto':''}">${x?esc(x):'비어 있음'}</dd></div>`).join('')}</dl><button class="btn" data-x>닫고 칸 확인하기</button></section><button class="x" data-x aria-label="닫기">${icon('x')}</button>`;
 const box=d.querySelector('.cmp-img');box.addEventListener('click',()=>box.classList.toggle('big'));d.querySelectorAll('[data-x]').forEach(x=>x.addEventListener('click',()=>d.remove()));document.body.appendChild(d);d.querySelector('.x').focus();}
function onFiles(input){const files=[...input.files],err=$('#ferr');if(files.length>3||files.some(f=>f.size>10*1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type))){err.textContent='JPEG·PNG·WebP 이미지를 최대 3장, 장당 10MB 이하로 골라 주세요.';input.value='';S.files=[];$('#thumbs').innerHTML='';return;}
 err.textContent='';S.files=files;S.submitKey=uuid();$('#thumbs').innerHTML=files.map((f,i)=>`<button type="button" class="thumb" data-act="photo-cmp" data-i="${i}" aria-label="${i+1}번째 사진 크게 보기"><img alt="" src="${URL.createObjectURL(f)}"><span>크게 보기</span></button>`).join('');if(files.length)runOcr(files[0]);}
async function onSubmit(form){
 const v=Object.fromEntries(new FormData(form)),err=$('#ferr'),dist=Number(v.distance),pace=fPace(form),secs=fSecs(form)||(pace&&dist>0?Math.round(pace*dist):0),min=submitMin(),max=submitMax(),memo=String(v.memo||'').trim();
 if(!S.files.length)return err.textContent='기록 캡처를 올려 주세요.';
 if(!v.date||v.date<min||v.date>max)return err.textContent=`${md(min)} ~ ${md(max)} 사이 날짜를 입력해 주세요.`;
 if(!v.time)return err.textContent='시작 시각을 입력해 주세요.';
 if(Date.parse(`${v.date}T${v.time}:00+09:00`)>Date.now()+12e4)return err.textContent='아직 오지 않은 시각이에요. 시작 시각을 확인해 주세요.';
 if(!(dist>0)||dist>100||Math.abs(dist*1000-Math.round(dist*1000))>1e-6)return err.textContent='거리는 0보다 크고 100k 이하로, 소수점 셋째 자리까지 입력해 주세요.';
 if(!secs||secs>86399||+v.m>59||+v.s>59)return err.textContent='경과 시간을 다시 확인해 주세요.';
 if(!pace||+v.ps>59)return err.textContent='평균 페이스를 입력해 주세요.';
 // 운영 규칙(11-03): 평균 페이스 8'30"/km보다 느린 기록은 올릴 수 없어요. 8'30" 정각은 괜찮아요. 서버도 같은 기준으로 막아요.
 if(secs/dist>PACE_FLOOR||pace>PACE_FLOOR)return alertBox('기록을 올릴 수 없어요',`평균 페이스가 8분 30초보다 느린 기록은 등록할 수 없어요.<br>이 기록의 페이스는 ${(t=>`${Math.floor(t/60)}분 ${String(t%60).padStart(2,'0')}초`)(Math.max(Math.round(secs/dist),pace))}예요.`);
 // the app's pace may use moving time, so only a clear mismatch (a misread digit) is refused
 if(Math.abs(pace-secs/dist)>secs/dist*.2)return err.textContent='평균 페이스가 거리·경과 시간과 맞지 않아요. 사진과 다시 비교해 주세요.';
 if(memo.length>200)return err.textContent='메모는 200자 이내로 입력해 주세요.';
 if(!$('#ok').checked)return err.textContent='사진과 기록이 같은지 확인해 주세요.';
 const btn=$('#fsub');if(S.busy)return;S.busy=true;btn.disabled=true;err.textContent='';
 // every value the server checks came from the photo unchanged (blue fields) -> may be counted at once
 const fromPhoto=['date','time','distance','h','m','s'].every(n=>form.elements[n].classList.contains('auto'));
 try{const run=await API.submit({key:S.submitKey,date:v.date,time:v.time,distance_m:Math.round(dist*1000),duration_s:secs,kind:v.type,memo,files:S.files,fromPhoto,pace_s:pace,progress:t=>{btn.textContent=t;}});
  const n=normRun(run);if(!D.runs.some(r=>r.id===n.id))D.runs.unshift(n);touch();S.files=[];S.submitKey=null;stopOcr();
  const mine=D.classes.find(c=>c.mine),exp=Math.round(dist*10)+(dist>=5?20:0);
  snd(n.status==='approved'?'approved':'submit');sheet(`<div class="center"><div class="done-art">${icon('check')}</div>${n.status==='approved'?`<h2>바로 반영됐어요</h2><p>사진 기록과 같아서 순위에 바로 들어갔어요.</p>`:`<h2>인증 요청 완료</h2><p>운영진이 확인하면 바로 반영돼요.</p>`}</div><div class="rewards"><span>${icon('star')}${n.status==='approved'?'':'승인 시 '}+${exp} XP</span>${mine&&mine.members&&D.me.is_runner?`<span class="cls">${icon('flag')}${esc(mine.name)}반 +${fmt(dist/mine.members)}k/인</span>`:''}</div><button class="btn" data-act="track">${icon('track')}트랙에서 한 바퀴 돌기</button><button class="btn ghost" data-act="close" style="margin-top:8px">확인</button>${LIVE?'':'<p class="note">시연 화면이라 실제로 전송되지 않고, 새로고침하면 사라져요.</p>'}`);
  setTimeout(()=>burstAt($('.done-art')),120);render(true);if(isStaff())refreshQueue();if(n.status==='approved')loadQuiet();}
 catch(e){if(btn.isConnected){btn.disabled=false;btn.textContent='인증 요청하기';}err.textContent=errMsg(e);if(authLost(e))sessionLost();}
 finally{S.busy=false;}
}

/* ===== 운영 행동 ===== */
async function rvDecide(id,dec,note,btn,expected){await busy(btn,async()=>{try{await API.review(id,dec,note,expected||'pending');const A=S.admin;if(A.queue)A.queue=A.queue.filter(r=>r.id!==id);closeSheet();toast(dec==='approved'?'승인했어요. 순위에 바로 반영돼요':'반려했어요');render(true);adminLoad(true);loadQuiet();}
 catch(e){toast(errMsg(e));if(e.hint==='conflict'||e.hint==='not_found'){closeSheet();adminLoad(true);}}});}
function rejectSheet(id,excl){const r=(S.admin.queue||[]).concat(S.admin.recent||[]).find(x=>x.id===id);if(!r)return;
 sheet(`<h2>${excl?'집계에서 제외':'기록 반려'}</h2><p class="sheet-sub">${esc(r.nickname)} · ${md(r.run_date)} ${fmt(r.distance_m/1000)}k</p><form id="rjf" data-id="${esc(id)}" data-exp="${esc(r.status)}" novalidate><div class="field"><label for="rj-note">사유 <span class="opt">${excl?'꼭 적어 주세요 · ':'선택 · '}회원에게 보여요</span></label><textarea id="rj-note" name="note" maxlength="500" rows="3" placeholder="예: 사진 속 날짜와 입력한 날짜가 달라요"></textarea></div><div class="chips">${['사진 속 날짜가 달라요','거리가 사진과 달라요','이미 올린 기록이에요','러닝 기록이 아니에요'].map(t=>`<button type="button" class="chip" data-act="note" data-v="${esc(t)}">${t}</button>`).join('')}</div><p class="err-msg" id="rjerr"></p><button class="btn" type="submit" style="background:var(--danger)">${excl?'집계에서 제외하기':'반려하기'}</button></form>`);}
function reviewedSheet(id){const r=(S.admin.recent||[]).find(x=>x.id===id);if(!r)return;const k=kst(r.started_at),kmv=r.distance_m/1000,own=r.user_id===D.me.id;
 sheet(`<h2>${esc(r.nickname)}님의 기록</h2><p class="sheet-sub">${esc(cname(r.class_id))}반 · ${r.status==='approved'&&!r.reviewer_nickname?'사진과 같아 자동 반영':`검토 ${esc(r.reviewer_nickname||'-')}`}</p><div class="rv-main" style="margin-top:14px"><b>${fmt(kmv)}<small>k</small></b><span>${md(k.date)} ${k.time} 시작<br>${dur(r.duration_s)} · ${pace(r.duration_s,kmv,r.pace_s)} · ${esc(r.kind)}</span></div><div class="rewards">${stChip(r.status,true)}</div>
 ${r.review_note?`<p class="warn-line">${icon('alert')}사유: ${esc(r.review_note)}</p>`:''}${r.memo?`<p class="memo">${esc(r.memo)}</p>`:''}<div class="photos">${(r.photos||[]).map(photoThumb).join('')}</div>
 ${own?'<p class="rv-mine">내 기록은 다른 운영진이 검토해요.</p>':r.status==='approved'?`<button class="btn ghost danger" style="margin-top:16px" data-act="rv-exclude" data-id="${esc(r.id)}">집계에서 제외하기</button>`:r.status==='rejected'?`<button class="btn" style="margin-top:16px" data-act="rv-reapprove" data-id="${esc(r.id)}">${icon('check')}다시 승인하기</button>`:''}`);}
function manageSheet(id){const m=(S.admin.members||[]).find(x=>x.id===id);if(!m)return;const self=m.id===D.me.id;
 sheet(`<h2>${esc(m.nickname)} 관리</h2><p class="sheet-sub">${esc(m.email||'')} · 승인 기록 ${m.approved_run_count}회</p><form id="mf" data-id="${esc(m.id)}" novalidate>
 <div class="field"><label for="m-cls">반</label><select id="m-cls" name="class_id">${D.classList.map(c=>`<option value="${esc(c.id)}"${c.id===m.class_id?' selected':''}>${esc(c.name)}반</option>`).join('')}</select><small class="help">반을 옮기면 지금까지 기록도 새 반으로 계산돼요.</small></div>
 <div class="field"><label for="m-role">역할</label><select id="m-role" name="role"><option value="member"${m.role==='member'?' selected':''}>회원</option><option value="reviewer"${m.role==='reviewer'?' selected':''}>검토자 · 기록 승인</option><option value="admin"${m.role==='admin'?' selected':''}>관리자 · 모든 권한</option></select></div>
 <label class="check"><input type="checkbox" name="is_runner"${m.is_runner?' checked':''}> 레이스 참가 (기록이 반·개인 순위와 반 평균 인원에 들어가요)</label><p class="err-msg" id="merr"></p><button class="btn" type="submit">저장하기</button></form>
 <div class="sheet-acts">${self?'':`<button class="btn ghost" data-act="m-reset" data-id="${esc(m.id)}">${icon('key')}임시 비밀번호 만들기</button>`}<button class="btn ghost danger" data-act="m-leave" data-id="${esc(m.id)}">${self?'내 계정 탈퇴 처리':'탈퇴 처리'}</button></div>`);}
async function memberSet(id,patch,btn,close){await busy(btn,async()=>{try{const row=await API.setMember(id,patch),A=S.admin;if(A.members){const i=A.members.findIndex(x=>x.id===id);if(i>=0)A.members[i]={...A.members[i],...row};}
  toast(patch.status==='active'?'승인했어요':patch.status==='rejected'?'가입을 거절했어요':patch.status==='left'?'탈퇴 처리했어요':'저장했어요');if(close)closeSheet();
  if(id===D.me.id){await loadData(true);return;}render(true);adminLoad(true);loadQuiet();}
 catch(e){const m=$('#merr');if(m)m.textContent=errMsg(e);else toast(errMsg(e));}});}
async function resetPw(id,btn){if(!armed(btn,'한 번 더 누르면 비밀번호가 바로 바뀌어요'))return;const m=(S.admin.members||[]).find(x=>x.id===id),pw='bk'+Array.from(crypto.getRandomValues(new Uint32Array(8)),x=>'abcdefghjkmnpqrstuvwxyz23456789'[x%31]).join('');
 await busy(btn,async()=>{try{await API.resetPassword(id,pw);sheet(`<h2>임시 비밀번호</h2><p class="sheet-sub">${esc(m?m.nickname:'')}님의 비밀번호를 바꿨어요.</p><div class="pwbox"><code>${esc(pw)}</code><button class="sbtn pri" data-act="copy-pw" data-v="${esc(pw)}">${icon('copy')}복사</button></div><p class="help">회원에게 이 비밀번호를 전해 주세요. 로그인한 뒤 '나 > 비밀번호 바꾸기'에서 새 비밀번호로 바꿀 수 있어요. 이 창을 닫으면 다시 볼 수 없어요.</p><button class="btn" style="margin-top:16px" data-act="close">확인</button>`);}
 catch(e){toast(errMsg(e));}});}
async function saveSettings(form){const v=Object.fromEntries(new FormData(form)),err=$('#serr'),s={invite_code:String(v.invite_code||'').trim().toUpperCase(),season_name:String(v.season_name||'').trim(),season_start:v.season_start,season_end:v.season_end,submit_window_days:+v.submit_window_days,grace_days:+v.grace_days,auto_approve:!!v.auto_approve};
 if(!/^[A-Z0-9]{4,20}$/.test(s.invite_code))return err.textContent='초대코드는 영문·숫자 4~20자로 입력해 주세요.';
 if(!s.season_name||s.season_name.length>40)return err.textContent='시즌 이름은 1~40자로 입력해 주세요.';
 if(!s.season_start||!s.season_end||s.season_start>s.season_end)return err.textContent='시즌 시작일과 종료일을 확인해 주세요.';
 if(!(s.submit_window_days>=1&&s.submit_window_days<=31))return err.textContent='제출 기한은 1~31일로 입력해 주세요.';
 if(!(s.grace_days>=0&&s.grace_days<=31))return err.textContent='마감 유예는 0~31일로 입력해 주세요.';
 err.textContent='';await busy(form.querySelector('[type=submit]'),async()=>{try{S.admin.settings=await API.saveSettings(s);toast('저장했어요');await loadData(true);}catch(e){err.textContent=errMsg(e);}});}
function shareText(){const s=S.admin.settings||{},url=location.origin&&location.origin!=='null'?location.origin+location.pathname:location.href.split('#')[0];return `러닝 BK 챌린지에 초대합니다!\n\n가입 주소: ${url}\n초대코드: ${s.invite_code||''}\n\n가입하면 운영진이 확인한 뒤 승인해 드려요.`;}
async function adminExport(btn){await busy(btn,async()=>{try{const rows=await API.exportRuns();download(`RUNNING_BK_전체기록_${D.today.replace(/-/g,'')}.csv`,[['날짜','시작','닉네임','반','거리(km)','시간','종류','상태','메모','검토자','검토 메모','제출 시각'],...rows.map(r=>{const k=kst(r.started_at),c=kst(r.created_at);return [r.run_date,k.time,r.nickname,cname(r.class_id),r.distance_m/1000,dur(r.duration_s),r.kind,ST[r.status]||r.status,r.memo||'',r.reviewer_nickname||'',r.review_note||'',`${c.date} ${c.time}`];})]);toast(`기록 ${rows.length}건을 내려받았어요`);}catch(e){toast(errMsg(e));}});}
function pwSheet(){sheet(`<h2>비밀번호 바꾸기</h2><form id="pwf" novalidate><div class="field"><label for="p1">새 비밀번호 <span class="opt">8자 이상</span></label><input id="p1" name="p1" type="password" autocomplete="new-password" minlength="8"></div><div class="field"><label for="p2">새 비밀번호 확인</label><input id="p2" name="p2" type="password" autocomplete="new-password"></div><p class="err-msg" id="pwerr"></p><button class="btn" type="submit">바꾸기</button></form>`);}

/* ===== 로그인·가입 행동 ===== */
async function loadClasses(){if(S.classes)return;try{const c=await API.classes();if(c&&c.length){S.classes=c;if(S.view==='auth'&&S.authMode==='signup'&&!$('#signup [name=class_id]:checked')){const keep=Object.fromEntries(new FormData($('#signup')));render();const f=$('#signup');if(f)for(const [k,v] of Object.entries(keep))if(f.elements[k]&&f.elements[k].type!=='radio')f.elements[k].value=v;}}}catch(_){}}
async function doLogin(form){const v=Object.fromEntries(new FormData(form)),err=$('#aerr'),email=String(v.email||'').trim();if(!email||!v.password)return err.textContent='이메일과 비밀번호를 입력해 주세요.';
 err.textContent='';await busy(form.querySelector('[type=submit]'),async()=>{try{await API.login(email,v.password);S.view='loading';render();await loadData();}catch(e){err.textContent=errMsg(e);}});}
async function doSignup(form){const v=Object.fromEntries(new FormData(form)),err=$('#aerr'),body={invite_code:String(v.invite_code||'').trim(),nickname:String(v.nickname||'').trim(),class_id:v.class_id||'',email:String(v.email||'').trim(),password:String(v.password||'')};
 if(!body.invite_code)return err.textContent='초대코드를 입력해 주세요.';
 if(Array.from(body.nickname).length<2||Array.from(body.nickname).length>12)return err.textContent='닉네임은 2~12자로 입력해 주세요.';
 if(!body.class_id)return err.textContent='우리 반을 골라 주세요.';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))return err.textContent='이메일 주소를 정확히 입력해 주세요.';
 if(body.password.length<8)return err.textContent='비밀번호는 8자 이상으로 입력해 주세요.';
 if(body.password!==v.password2)return err.textContent='비밀번호 확인이 맞지 않아요.';
 err.textContent='';const btn=form.querySelector('[type=submit]');btn.dataset.keep='1';btn.textContent='가입 신청 중…';
 await busy(btn,async()=>{try{const r=await API.signup(body);btn.textContent='로그인 중…';await API.login(body.email,body.password);S.view='loading';render();await loadData();if(r&&r.role==='admin')toast('첫 가입자라 관리자 권한이 생겼어요');}
 catch(e){err.textContent=errMsg(e);btn.textContent='가입 신청하기';}});}
async function logout(btn){try{await API.logout();}catch(_){}D=null;S.seen=null;S.page='home';S.admin={tab:'queue',queue:null,recent:null,members:null,settings:null,loading:false,at:0};S.photo={};S.authMode='login';closeSheet();if(LIVE){S.view='auth';render();}else location.reload();}
function sessionLost(){if(!LIVE)return;D=null;S.view='auth';S.authMode='login';closeSheet();render();toast('로그인이 만료됐어요. 다시 로그인해 주세요.');}
async function loadData(quiet){
 try{const [j,lk]=await Promise.all([API.boot(),API.looks?API.looks().catch(()=>null):null]);applyBoot(j);if(lk)S.looks=Object.fromEntries(lk.map(x=>[x.user_id,x.look]));
  if(!LIVE&&!DB.seeded){DB.seeded=true;for(const {q,p} of pastRewards())if(!(q.id==='d_5k'&&p==='2026-10-14'))DB.my_claims.push({quest_id:q.id,period_key:p,xp:q.xp});applyBoot(await API.boot());}
  if(!D.me){S.view='gate';S.gate='noprofile';}else if(D.me.status!=='active'){S.view='gate';S.gate=D.me.status;}
  else{const was=S.view;S.view='app';if(!S.seen)initSeen();if(S.page==='admin'&&!isStaff())S.page='me';if(was!=='app'&&isStaff())refreshQueue();}
  if(quiet&&S.view==='app'&&raceRaf){S.stale=true;return;}
  render(quiet&&S.view==='app');if(S.view==='app')setTimeout(progress,quiet?0:500);if(S.view==='app'&&S.page==='admin'&&!quiet)adminLoad();}
 catch(e){if(authLost(e)&&LIVE){sessionLost();return;}if(quiet){toast(errMsg(e));return;}S.view='error';S.err=errMsg(e);render();}}
async function loadQuiet(){if(!D||S.view!=='app')return;if(isStaff()&&S.page!=='admin'&&Date.now()-S.admin.at>60e3)refreshQueue();if(S.page==='admin'&&S.admin.tab==='settings'){try{applyBoot(await API.boot());}catch(_){}return;}await loadData(true);}
async function recheck(btn){await busy(btn,async()=>{await loadData();if(S.view==='gate'&&S.gate==='pending')toast('아직 승인 전이에요. 조금만 기다려 주세요.');});}
async function init(){
 const start=location.hash.slice(1);if(['home','league','ranking','me','admin'].includes(start))S.page=start;
 if(!LIVE){DB=demoDB();await loadData();return;}
 sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'&&S.view!=='auth'){D=null;S.view='auth';S.authMode='login';render();}});
 render();
 let s=null;try{s=await API.session();}catch(_){}
 if(!s){S.view='auth';render();return;}
 await loadData();
}

/* ===== 이벤트 ===== */
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;const id=b.dataset.id;
 if(b.closest('.lightbox'))return;
 if(b.dataset.go&&b.closest('#nav'))snd('tap');
 if(b.dataset.go){if(b.dataset.tab)S.admin.tab=b.dataset.tab;if(S.page!==b.dataset.go||$('#sheet.on'))closeSheet();go(b.dataset.go);return;}
 if(b.dataset.member)return openMember(b.dataset.member);
 if(b.dataset.claim){const [q,p]=b.dataset.claim.split('|');return claim(q,p,b);}
 if(b.dataset.cheer)return cheer(b.dataset.cheer,b);
 if(b.dataset.rank){S.rank=b.dataset.rank;return render(true);}
 if(b.dataset.metab){S.meTab=b.dataset.metab;return render(true);}
 if(b.dataset.atab){S.admin.tab=b.dataset.atab;render(true);return adminLoad();}
 if(b.dataset.rec)return showRec(b.dataset.rec);
 switch(b.dataset.act){
  case 'submit':return openSubmit();
  case 'close':return closeSheet();
  case 'dlg-ok':$('#dlg')?.remove();return;
  case 'notice':return notice();
  case 'track':return openTrack(b);
  case 'replay':return replay();
  case 'export':return exportCsv();
  case 'claim-all':return claimAll(b);
  case 'photo-cmp':return photoCmp(+b.dataset.i);
  case 'board-view':{S.boardView=b.dataset.view;const bd=$('[data-board]');if(bd)bd.innerHTML=boardRows(standings());document.querySelectorAll('[data-act=board-view]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.view===S.boardView));return;}
  case 'claim-kind':return claimAll(b,b.dataset.kind);
  case 'quests-more':S.qOpen=!S.qOpen;return render(true);
  case 'logout':return logout(b);
  case 'pw':return pwSheet();
  case 'look':return lookSheet();
  case 'look-save':return lookSave(b);
  case 'snd':{const k=b.dataset.k,v=!BKSound.get()[k];BKSound.set({[k]:v});b.setAttribute('aria-checked',v);if(v&&k==='sfx')snd('on');return;}
  case 'to-signup':S.authMode='signup';render();return loadClasses();
  case 'to-login':S.authMode='login';return render();
  case 'recheck':return recheck(b);
  case 'retry':S.view='loading';render();return LIVE?init():loadData();
  case 'admin-refresh':return adminLoad();
  case 'rv-approve':return rvDecide(id,'approved',null,b);
  case 'rv-reject':return rejectSheet(id);
  case 'rv-open':return reviewedSheet(id);
  case 'rv-exclude':return rejectSheet(id,true);
  case 'rv-reapprove':return rvDecide(id,'approved',null,b,'rejected');
  case 'note':{const t=$('#rj-note');if(t){t.value=t.value?t.value+' '+b.dataset.v:b.dataset.v;t.focus();}return;}
  case 'm-set':return memberSet(id,{status:b.dataset.v},b);
  case 'm-manage':return manageSheet(id);
  case 'm-reset':return resetPw(id,b);
  case 'm-leave':if(armed(b,'한 번 더 누르면 탈퇴 처리돼요'))memberSet(id,{status:'left'},b,true);return;
  case 'photo':return openPhoto(b.dataset.path);
  case 'withdraw':if(armed(b,'한 번 더 누르면 인증이 취소돼요'))withdraw(id,b);return;
  case 'copy-invite':{const i=$('#s-code');return copyText(i?i.value.trim().toUpperCase():'','초대코드를 복사했어요');}
  case 'copy-share':return copyText(shareText(),'가입 안내 문구를 복사했어요');
  case 'copy-pw':return copyText(b.dataset.v,'임시 비밀번호를 복사했어요');
  case 'admin-export':return adminExport(b);
  case 'cal':if(b.dataset.m){S.calMonth=b.dataset.m;render(true);}return;
 }
});
document.addEventListener('change',e=>{if(e.target.id==='cap')onFiles(e.target);if(e.target.name==='class_id'&&e.target.closest('.classpick'))$$('.classpick label').forEach(l=>l.classList.toggle('on',l.querySelector('input').checked));});
document.addEventListener('input',e=>{const f=e.target.closest('#rf');if(!f)return;e.target.classList.remove('auto','calc');if(['distance','h','m','s','pm','ps'].includes(e.target.name))syncPace(f,e.target.name);});
document.addEventListener('submit',e=>{const f=e.target,fn={rf:onSubmit,login:doLogin,signup:doSignup,sf:saveSettings}[f.id];
 if(fn){e.preventDefault();return fn(f);}
 if(f.id==='rjf'){e.preventDefault();const note=f.elements.note.value.trim(),exp=f.dataset.exp;if(exp==='approved'&&!note){$('#rjerr').textContent='집계에서 제외하려면 사유를 적어 주세요.';return;}return rvDecide(f.dataset.id,'rejected',note,f.querySelector('[type=submit]'),exp);}
 if(f.id==='mf'){e.preventDefault();return memberSet(f.dataset.id,{class_id:f.elements.class_id.value,role:f.elements.role.value,is_runner:f.elements.is_runner.checked},f.querySelector('[type=submit]'),true);}
 if(f.id==='pwf'){e.preventDefault();const a=f.elements.p1.value,b=f.elements.p2.value,er=$('#pwerr');if(a.length<8)return er.textContent='비밀번호는 8자 이상으로 입력해 주세요.';if(a!==b)return er.textContent='비밀번호 확인이 맞지 않아요.';
  busy(f.querySelector('[type=submit]'),async()=>{try{await API.changePassword(a);closeSheet();toast('비밀번호를 바꿨어요');}catch(err){er.textContent=errMsg(err);}});}
});
$('#scrim').addEventListener('click',closeSheet);
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('#dlg'))return $('#dlg').remove();const lb=$('.lightbox');if(lb)return lb.remove();if($('#sheet.on'))closeSheet();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible'||!LIVE)return;if(S.view==='app'&&Date.now()-S.loadedAt>60e3)loadQuiet();else if(S.view==='gate'&&S.gate==='pending')loadData();});
init();
