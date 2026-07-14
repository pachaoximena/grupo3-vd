/*═══════════════════════════════════════════════════════════════
  DATOS NUTRICIONALES

  Este archivo controla toda la narrativa del combo de comida.

  A medida que el usuario hace scroll, se van mostrando
  distintas escenas que analizan el contenido nutricional del
  combo.

  Tecnologías utilizadas:

  • GSAP + ScrollTrigger → sincronizan las escenas con el scroll.
  • JavaScript → cambia imágenes, flechas, textos y animaciones.

  Flujo general:

  1. Se identifica qué escena está visible.
  2. Se actualiza la imagen principal.
  3. Se resaltan los ingredientes correspondientes.
  4. Se realiza la transición hacia el combo completo.
  5. Se anima la equivalencia en kilómetros caminados.
═══════════════════════════════════════════════════════════════*/
/*═══════════════════════════════════════════════════════════════
  ELEMENTOS DEL HTML

  Se obtienen las imágenes, flechas y demás elementos que serán
  modificados durante las distintas escenas.

  IMPORTANTE

  Si se cambia alguno de estos ids en el HTML,
  también deberá actualizarse aquí.
═══════════════════════════════════════════════════════════════*/
(function() {

  const escenas = document.querySelectorAll('.combo-escena');

  const imgHamburguesa = document.getElementById('imgHamburguesa');
  const imgPapas        = document.getElementById('imgPapas');
  const imgBebida        = document.getElementById('imgBebida');
  const imgComboUnificado = document.getElementById('imgComboUnificado');

  const flechaHamburguesa = document.getElementById('flechaHamburguesa');
  const flechaPapas         = document.getElementById('flechaPapas');
  const flechaBebida         = document.getElementById('flechaBebida');

  /* equivalencia: km caminados para quemar las calorías del combo.
      ~60 kcal por km caminado es la referencia estándar usada para
      una persona adulta promedio a paso normal. */
  const CALORIAS_COMBO = 1066;
  const KCAL_POR_KM = 60;
  const TOTAL_KM = Math.round((CALORIAS_COMBO / KCAL_POR_KM) * 10) / 10; // 17.8 km

  const kmRutaProgreso = document.getElementById('kmRutaProgreso');
  const kmRutaIcono     = document.getElementById('kmRutaIcono');
  const cantKmEl         = document.getElementById('cantKm');

/*═══════════════════════════════════════════════════════════════
  ACTUALIZAR ESCENA

  Según la escena actual, esta función decide:

  • qué imágenes se muestran
  • cuál queda destacada
  • cuáles se atenúan
  • qué flecha aparece

  La escena 5 es una excepción, ya que posee una transición
  continua controlada por otra función.
═══════════════════════════════════════════════════════════════*/
  /* aplica el estado visual de las imágenes según la escena activa.
      La escena 5 (total) se maneja aparte, frame a frame, en
      actualizarTransicionUnificado() — acá solo se cubren los demás casos. */
  function actualizarVisual(numEscena) {
    // resetear clases de estado en las 3 imágenes sueltas
    [imgHamburguesa, imgPapas, imgBebida].forEach(img => {
      img.classList.remove('combo-visible', 'combo-destacado', 'combo-atenuado', 'combo-juntandose', 'combo-oculta');
    });
    [flechaHamburguesa, flechaPapas, flechaBebida].forEach(f => f.classList.remove('visible'));

    switch (numEscena) {
      case 1: // intro: las 3 visibles, nada destacado
        imgHamburguesa.classList.add('combo-visible');
        imgPapas.classList.add('combo-visible');
        imgBebida.classList.add('combo-visible');
        imgComboUnificado.classList.remove('combo-unificado-visible');
        break;
      case 2: // hamburguesa protagonista
        imgHamburguesa.classList.add('combo-destacado');
        imgPapas.classList.add('combo-atenuado');
        imgBebida.classList.add('combo-atenuado');
        flechaHamburguesa.classList.add('visible');
        imgComboUnificado.classList.remove('combo-unificado-visible');
        break;
      case 3: // papas protagonistas
        imgHamburguesa.classList.add('combo-atenuado');
        imgPapas.classList.add('combo-destacado');
        imgBebida.classList.add('combo-atenuado');
        flechaPapas.classList.add('visible');
        imgComboUnificado.classList.remove('combo-unificado-visible');
        break;
      case 4: // bebida protagonista
        imgHamburguesa.classList.add('combo-atenuado');
        imgPapas.classList.add('combo-atenuado');
        imgBebida.classList.add('combo-destacado');
        flechaBebida.classList.add('visible');
        imgComboUnificado.classList.remove('combo-unificado-visible');
        break;
      // case 5 (total) ya no se inicializa acá: lo maneja
      // actualizarTransicionUnificado() en cada frame de scroll
      case 6: // contexto: se mantiene la foto unificada de fondo
      case 7: // equivalencia: idem
        imgHamburguesa.classList.add('combo-oculta');
        imgPapas.classList.add('combo-oculta');
        imgBebida.classList.add('combo-oculta');
        imgComboUnificado.classList.add('combo-unificado-visible');
        break;
    }
  }

  /* ── transición de la escena 5: las 3 fotos sueltas se acercan al
      centro (mitad inicial de la escena) y luego se desvanecen mientras
      aparece la foto del combo ya unificado (mitad final) ── */
  const UMBRAL_UNION = 0.5; // a partir de qué % de la escena 5 ya se ve la foto unificada

  function actualizarTransicionUnificado(fraccion) {
    [imgHamburguesa, imgPapas, imgBebida].forEach(img => {
      img.classList.remove('combo-visible', 'combo-destacado', 'combo-atenuado');
    });
    [flechaHamburguesa, flechaPapas, flechaBebida].forEach(f => f.classList.remove('visible'));

    if (fraccion < UMBRAL_UNION) {
      // primera mitad: las 3 fotos sueltas se van acercando entre sí
      imgHamburguesa.classList.add('combo-juntandose');
      imgPapas.classList.add('combo-juntandose');
      imgBebida.classList.add('combo-juntandose');
      imgHamburguesa.classList.remove('combo-oculta');
      imgPapas.classList.remove('combo-oculta');
      imgBebida.classList.remove('combo-oculta');
      imgComboUnificado.classList.remove('combo-unificado-visible');
    } else {
      // segunda mitad: las sueltas se esconden, aparece la foto unificada
      imgHamburguesa.classList.add('combo-oculta');
      imgPapas.classList.add('combo-oculta');
      imgBebida.classList.add('combo-oculta');
      imgComboUnificado.classList.add('combo-unificado-visible');
    }
  }


  /* anima la ruta de km caminados: el número y la barra avanzan
      progresivamente según cuánto se recorrió dentro de la escena 7 */
  function actualizarKm(fraccion) {
    const kmActual = Math.round(fraccion * TOTAL_KM * 10) / 10;
    cantKmEl.textContent = kmActual.toFixed(1);
    const porcentajeBarra = fraccion * 100;
    kmRutaProgreso.style.width = porcentajeBarra + '%';
    kmRutaIcono.style.left = porcentajeBarra + '%';
  }

  let escenaVisible = -1;
/*═══════════════════════════════════════════════════════════════
  CONTROL DEL SCROLL

  Todo el funcionamiento de esta sección depende de la posición
  del scroll.

  Cada vez que el usuario avanza:

  • se determina la escena actual
  • se activan los textos correspondientes
  • se actualizan las imágenes
  • se ejecutan las transiciones necesarias

  No existen botones ni temporizadores:
  todo está sincronizado con el desplazamiento del usuario.
═══════════════════════════════════════════════════════════════*/
  ScrollTrigger.create({
    trigger: '#p-combo',
    start: 'top 80%',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const totalEscenas = escenas.length; // 7
      const posicion = Math.min(self.progress, 0.999) * totalEscenas; // 0..7
      const numEscena = Math.min(Math.floor(posicion) + 1, totalEscenas); // 1..7
      const fraccionDentro = posicion - Math.floor(posicion); // 0..1 dentro de la escena

      if (numEscena !== escenaVisible) {
        escenaVisible = numEscena;
        escenas.forEach(e => {
          const esEsta = parseInt(e.dataset.escena, 10) === numEscena;
          e.classList.toggle('activa', esEsta);
        });
        actualizarVisual(numEscena);
      }

      // la ruta de km avanza en vivo mientras se recorre la escena 7
      if (numEscena === 7) {
        actualizarKm(fraccionDentro);
      }

      // escena 5: las fotos sueltas se acercan y dan paso a la foto unificada
      if (numEscena === 5) {
        actualizarTransicionUnificado(fraccionDentro);
      }
    },
    onEnter: () => {
      escenaVisible = 1;
    
      escenas.forEach(e => {
        e.classList.toggle(
          "activa",
          parseInt(e.dataset.escena, 10) === 1
        );
      });
    
      actualizarVisual(1);
    },
    onLeaveBack: () => {
      escenaVisible = -1;
      escenas.forEach(e => e.classList.remove('activa'));
      [imgHamburguesa, imgPapas, imgBebida].forEach(img => {
        img.classList.remove('combo-visible', 'combo-destacado', 'combo-atenuado', 'combo-juntandose', 'combo-oculta');
      });
      imgComboUnificado.classList.remove('combo-unificado-visible');
      [flechaHamburguesa, flechaPapas, flechaBebida].forEach(f => f.classList.remove('visible'));
      actualizarKm(0);
    }
  });

})();
