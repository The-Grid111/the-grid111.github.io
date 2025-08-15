// Helpers
const $ = (q, el=document)=>el.querySelector(q);
const $$ = (q, el=document)=>[...el.querySelectorAll(q)];
const state = {
  heroMode: localStorage.getItem('heroMode') || 'auto',
  reelSet: localStorage.getItem('reelSet') || 'auto',
  theme: JSON.parse(localStorage.getItem('theme')||'{}')
};

function greet(){
  const h = new Date().getHours();
  const t = h<12 ? 'Good morning' : h<18 ? 'Good afternoon' : 'Good evening';
  $('#greet').textContent = `${t} — THEGRID`;
  $('#year').textContent = new Date().getFullYear();
}
greet();

// Confetti (no freeze)
const confettiCanvas = $('#confetti');
const ctx = confettiCanvas.getContext('2d');
let confettiBits = [], confettiTimer = null;
function sizeCanvas(){
  confettiCanvas.width = innerWidth * devicePixelRatio;
  confettiCanvas.height = innerHeight * devicePixelRatio;
}
addEventListener('resize', sizeCanvas); sizeCanvas();

function shootConfetti({count=160, spread=60, power=9}={}){
  const w = confettiCanvas.width, h = confettiCanvas.height;
  for(let i=0;i<count;i++){
    confettiBits.push({
      x: w/2, y: h*0.18,
      vx: (Math.random()-0.5)*spread,
      vy: -Math.random()*power - 6,
      r: Math.random()*6+2,
      life: Math.random()*90+60,
      color: i%3 ? '#e6c26e' : '#f6e3a4'
    });
  }
  if(!confettiTimer){
    confettiTimer = setInterval(()=> {
      ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
      confettiBits.forEach(p=>{
        p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.life--;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      });
      confettiBits = confettiBits.filter(p=>p.life>0 && p.y<confettiCanvas.height+12);
      if(confettiBits.length===0){ clearInterval(confettiTimer); confettiTimer=null; }
    }, 16);
  }
}

// Buttons press + confetti hooks
function press(btn, makeConfetti=false){
  btn.addEventListener('click', ()=>{
    btn.style.filter = 'brightness(1.1)';
    setTimeout(()=>btn.style.filter='',120);
    if(makeConfetti) shootConfetti({});
  });
}
press($('#joinBtn'), true);
press($('#btnNiches'), false);
press($('#btnReels'), false);
press($('#btnMonetise'), true);
press($('#saveView'), true);

// Customize panel open/close
const customPanel = $('#customPanel');
$('#openCustomizer').onclick = ()=> customPanel.hidden=false;
$('#closeCustomizer').onclick = ()=> customPanel.hidden=true;

// Library panel
const libPanel = $('#libPanel');
$('#openLib').onclick = ()=> { renderLibrary(); libPanel.hidden=false; };
$('#closeLib').onclick = ()=> libPanel.hidden=true;

// Hero media handling
const heroFrame = $('#heroFrame');
const heroVideoDefault = 'assets/video/gc_spin.mp4';
const heroImageDefault = 'assets/images/gc_logo.png';

function setHero(mode){
  state.heroMode = mode || $('#heroSel').value || 'auto';
  localStorage.setItem('heroMode', state.heroMode);
  heroFrame.innerHTML = '';
  const vPath = ($('#heroVideoPath')?.value || heroVideoDefault);
  const iPath = ($('#heroImagePath')?.value || heroImageDefault);

  if(state.heroMode==='off'){ return; }

  if(state.heroMode==='image'){
    const img = new Image();
    img.src = iPath;
    heroFrame.append(img);
    return;
  }
  // video or auto -> try video, then fallback image
  const v = document.createElement('video');
  v.src = vPath; v.autoplay=true; v.muted=true; v.loop=true; v.playsInline=true;
  v.onerror = ()=>{ const img=new Image(); img.src=iPath; heroFrame.innerHTML=''; heroFrame.append(img); };
  v.oncanplay = ()=> v.play().catch(()=>{ /* iOS might block; already muted */ });
  heroFrame.append(v);
}
setHero(state.heroMode);

// Controls save
$('#heroSel').value = state.heroMode;
$('#reelsSel').value = state.reelSet;
$('#heroSel').onchange = e=> setHero(e.target.value);
$('#reelsSel').onchange = e=> { state.reelSet = e.target.value; localStorage.setItem('reelSet', state.reelSet); };
$('#saveView').onclick = ()=> shootConfetti({count:200,power:10});

// Theme customization
function applyThemeToDocument(t){
  if(t.bg) document.documentElement.style.setProperty('--bg', t.bg);
  if(t.gold) document.documentElement.style.setProperty('--gold', t.gold);
  document.body.style.background = (t.pattern==='off')
    ? '#0b0d0f'
    : 'radial-gradient(1000px 500px at 20% -10%, rgba(246,203,92,.08), transparent 50%) ,#0b0d0f';
  $$('.card').forEach(c=>{
    c.style.borderRadius = (t.radius ?? 20)+'px';
    c.style.borderColor = (t.borderStyle==='hard') ? '#313743' : '#232833';
  });
}
function loadTheme(){
  if(Object.keys(state.theme).length){
    applyThemeToDocument(state.theme);
    // also hydrate inputs if present
    $('#bgColor')?.setAttribute('value', state.theme.bg || '#0b0d0f');
    $('#goldColor')?.setAttribute('value', state.theme.gold || '#e6c26e');
    $('#patternSel')?.value = state.theme.pattern || 'on';
    $('#radius')?.setAttribute('value', state.theme.radius ?? 20);
    $('#borderStyle')?.value = state.theme.borderStyle || 'soft';
    $('#heroVideoPath')?.setAttribute('value', state.theme.heroVideo || heroVideoDefault);
    $('#heroImagePath')?.setAttribute('value', state.theme.heroImage || heroImageDefault);
  }
}
loadTheme();

$('#applyTheme').onclick = ()=>{
  const t = {
    bg: $('#bgColor').value,
    gold: $('#goldColor').value,
    pattern: $('#patternSel').value,
    radius: +$('#radius').value,
    borderStyle: $('#borderStyle').value,
    heroVideo: $('#heroVideoPath').value.trim(),
    heroImage: $('#heroImagePath').value.trim()
  };
  state.theme = t; applyThemeToDocument(t); setHero(state.heroMode);
  shootConfetti({count:120});
};
$('#saveTheme').onclick = ()=>{
  localStorage.setItem('theme', JSON.stringify(state.theme));
  shootConfetti({count:160, power:8});
};

// Library (attempt to load known names; missing ones are filtered)
const imageCandidates = [
  'assets/images/gc_logo.png',
  'assets/images/hero_1.jpg','assets/images/hero_2.jpg','assets/images/hero_3.jpg',
  'assets/images/grid_interaction_1.jpg','assets/images/grid_natural_1.jpg',
  'assets/images/grid_pour_1.jpg','assets/images/grid_spread_1.jpg','assets/images/grid_transform_1.jpg'
];
const videoCandidates = [
  'assets/video/gc_spin.mp4','assets/video/hero_1.mp4',
  'assets/video/interaction_1.mp4','assets/video/natural_1.mp4',
  'assets/video/pour_1.mp4','assets/video/spread_1.mp4','assets/video/transform_1.mp4'
];

async function urlExists(url){
  try{
    const res = await fetch(url, {method:'HEAD', cache:'no-store'});
    return res.ok;
  }catch{ return false; }
}

async function renderLibrary(){
  const grid = $('#libGrid'); grid.innerHTML='';
  const addThumb = (el, path, kind)=>{
    const wrap = document.createElement('button');
    wrap.className='thumb'; wrap.title=path; wrap.style.aspectRatio='1/1';
    wrap.appendChild(el);
    wrap.onclick = ()=>{
      if(kind==='video'){ $('#heroVideoPath').value = path; $('#heroSel').value='video'; }
      else { $('#heroImagePath').value = path; $('#heroSel').value='image'; }
      setHero($('#heroSel').value);
      shootConfetti({count:90,power:7});
    };
    grid.appendChild(wrap);
  };
  // videos
  for(const v of videoCandidates){
    if(await urlExists(v)){
      const vid = document.createElement('video');
      vid.src=v; vid.muted=true; vid.loop=true; vid.playsInline=true; vid.autoplay=true;
      addThumb(vid, v, 'video');
    }
  }
  // images
  for(const i of imageCandidates){
    if(await urlExists(i)){
      const img = new Image(); img.src=i; addThumb(img, i, 'image');
    }
  }
}
