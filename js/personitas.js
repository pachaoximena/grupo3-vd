(function(){
  const TOTAL = 100;
  const TARGET = 42;

  const grid = document.getElementById('grid');
  const counter = document.getElementById('counter');
  const subtitulo = document.getElementById('subtitulo');
  const legend = document.getElementById('legend');
  const wrap = document.getElementById('pictogramWrap');
  
  if(!grid || !counter || !subtitulo || !legend || !wrap){
    console.warn("Pictograma no encontrado");
    return;
}

  // Construir las 100 figuras
  const icons = [];
  for(let i=0; i<TOTAL; i++){
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');
    const use = document.createElementNS('http://www.w3.org/2000/svg','use');
    use.setAttributeNS('http://www.w3.org/1999/xlink','href','#person-icon');
    use.setAttribute('href','#person-icon');
    svg.appendChild(use);
    grid.appendChild(svg);
    icons.push(svg);
  }

  let ticking = false;

  function update(){
    ticking = false;
    const rect = wrap.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    let progress = scrollable > 0 ? (-rect.top) / scrollable : 0;
    progress = Math.max(0, Math.min(1, progress));

    // Llega a 42 un poco antes del final del scroll, y se sostiene
    const eased = Math.min(1, progress * 1.2);
    const painted = Math.round(eased * TARGET);
    const percent = Math.round(eased * TARGET);

    counter.textContent = percent;

    for(let i=0; i<TOTAL; i++){
      icons[i].classList.toggle('on', i < painted);
    }

    const completo = eased >= 0.98;
    subtitulo.classList.toggle('visible', completo);
    legend.classList.toggle('oculto', completo);
  }

  function onScroll(){
    if(!ticking){
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  update();
})();
