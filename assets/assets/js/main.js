
// Simple hero carousel (auto-rotate)
const slides = Array.from(document.querySelectorAll('.hero-slide'));
let idx = 0;
function showSlide(i){
  slides.forEach((s,j)=> s.classList.toggle('active', j===i));
  const v = slides[i].querySelector('video');
  if(v){ try{ v.play(); }catch(e){} }
}
showSlide(0);
setInterval(()=>{ idx = (idx+1) % slides.length; showSlide(idx); }, 4000);

// Simple scroll arrows for carousels
for(const car of document.querySelectorAll('.carousel')){
  const track = car.querySelector('.carousel-track');
  const prev = car.querySelector('.prev');
  const next = car.querySelector('.next');
  prev?.addEventListener('click', ()=> track.scrollBy({left:-300, behavior:'smooth'}));
  next?.addEventListener('click', ()=> track.scrollBy({left:300, behavior:'smooth'}));
}
