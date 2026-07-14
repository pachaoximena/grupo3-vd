/*═══════════════════════════════════════════════════════════════
  EXPANSIÓN DE LOCALES

  Este archivo controla la visualización del crecimiento de
  McDonald's en Estados Unidos.

  La expansión está sincronizada con el scroll del usuario.

  Tecnologías utilizadas:

  • D3.js → dibuja el mapa y los puntos.
  • TopoJSON → contiene el mapa de EE.UU.
  • GSAP + ScrollTrigger → sincronizan la animación con el scroll.

  Flujo general:

  1. Se cargan los locales reales.
  2. Se generan miles de locales adicionales para representar
    la expansión.
  3. Se dibuja el mapa.
  4. Se dibujan todos los puntos (inicialmente ocultos).
  5. El scroll controla cuántos puntos se vuelven visibles,
    qué tarjeta aparece y qué número muestra el contador.
═══════════════════════════════════════════════════════════════*/
/*═══════════════════════════════════════════════════════════════
  ANTES DE MODIFICAR ESTE ARCHIVO

  • Las coordenadas están expresadas como:
        [latitud, longitud]

  • Para agregar una nueva etapa de expansión,
    modificar el arreglo ETAPAS.

  • Para cambiar la cantidad total de puntos,
    modificar CANTIDAD_OBJETIVO.

  • Los ids del HTML (#localesSvg, #expansionContador, etc.)
    deben conservar el mismo nombre para que la animación funcione.

  • Este archivo solo controla el mapa de expansión.
    No modificar aquí otras animaciones del proyecto.
═══════════════════════════════════════════════════════════════*/
(async function() {

/*═══════════════════════════════════════════════════════════════
  LOCALES REALES

  Estas coordenadas corresponden a locales reales de McDonald's.

  Se utilizan como punto de partida para que la expansión
  comience desde ubicaciones existentes.

  Los demás puntos del mapa serán generados automáticamente.
═══════════════════════════════════════════════════════════════*/
  const localesReales = [
    [24.571897,-81.756906],[24.716418,-81.073326],[25.004612,-80.522609],
    [25.108703,-80.427325],[25.442581,-80.474594],[25.499222,-80.411901],
    [25.519399,-80.426093],[25.550276,-80.371613],[25.477004,-80.434625],
    [25.485196,-80.459808],[25.579132,-80.36734],[25.457704,-80.473083],
    [25.670286,-80.443349],[25.625854,-80.415527],[25.684779,-80.446643],
    [25.627942,-80.376025],[25.65558,-80.383886],[25.600886,-80.352328],
    [25.592569,-80.379254],[25.636053,-80.336198],[25.598176,-80.414039],
    [25.664239,-80.407332],[25.652864,-80.329566],[25.578119,-80.336189],
    [25.685984,-80.382764],[25.686063,-80.403456],[25.702003,-80.349437],
    [25.744692,-80.39174],[25.76053,-80.390492],[25.732613,-80.378134],
    [25.768213,-80.366668],[25.761217,-80.354963],[25.748622,-80.336076],
    [25.716621,-80.345713],[25.770176,-80.326046],[25.733566,-80.323661],
    [25.783395,-80.332566],[25.714164,-80.415976],[25.760479,-80.43208],
    [25.729033,-80.431431],[25.763141,-80.313],[25.796169,-80.336426],
    [25.811162,-80.381169],[25.812111,-80.351324],[25.733056,-80.303266],
    [25.712198,-80.447512],[25.809995,-80.31739],[25.790433,-80.132081],
    [25.789141,-80.140924],
  ];
/*═══════════════════════════════════════════════════════════════
  GENERADOR ALEATORIO

  En lugar de utilizar Math.random(), usamos un generador con
  semilla (seed).

  Esto hace que siempre se obtenga exactamente la misma
  distribución de puntos, incluso si la página se vuelve a cargar.

  Así evitamos que el mapa cambie en cada ejecución.
═══════════════════════════════════════════════════════════════*/
  function seededRand(seed) {
    let s = seed;
    return function() {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }
  const rand = seededRand(42);

  /* Generación aleatoria uniforme: en vez de concentrar puntos en zonas
      de alta densidad real, se distribuyen parejo por todo el territorio.
      Se generan de más (sobre el rectángulo que cubre EE.UU. continental)
      y luego se filtran los que caen fuera del país usando geoContains,
      así ningún punto queda en el océano o en otro país. La generación
      real ocurre más abajo, una vez que el mapa base ya está cargado. */
  const RECT_USA = { latMin: 24.5, latMax: 49.5, lngMin: -124.7, lngMax: -67.0 };
  const CANTIDAD_OBJETIVO = 4250; // misma cantidad total que el proyecto ya usaba

  /*═══════════════════════════════════════════════════════════════
  ── 5 ETAPAS DE EXPANSIÓN ──
  Cada etapa representa un momento histórico.

  Se define:

  • qué porcentaje de puntos debe verse
  • qué cantidad de locales muestra el contador

  El scroll interpolará automáticamente entre una etapa y otra,
  haciendo que el crecimiento sea continuo.
═══════════════════════════════════════════════════════════════*/

  const ETAPAS = [
    { pct: 0.02,  cifraNum: 200    }, // 1950s   — un puñado de locales
    { pct: 0.08,  cifraNum: 3500   }, // 1960-70s — expansión regional
    { pct: 0.28,  cifraNum: 13000  }, // 1980-90s — crecimiento acelerado
    { pct: 0.62,  cifraNum: 29000  }, // 2000s    — cobertura nacional amplia
    { pct: 1.0,   cifraNum: 200000 }, // hoy      — máxima expansión
  ];

  /* ── cargar mapa base de EE.UU. ── */
  let usaTopo;
  try {
    usaTopo = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
  } catch(e) { console.warn("No se pudo cargar mapa EE.UU.", e); return; }

  const svg = d3.select("#localesSvg");
  const width = 900, height = 560;

  const projection = d3.geoAlbersUsa().scale(1100).translate([width/2, height/2]);
  const path = d3.geoPath().projection(projection);
  const states = topojson.feature(usaTopo, usaTopo.objects.states);

  svg.append("g")
    .selectAll("path")
    .data(states.features)
    .join("path")
    .attr("class","pais-usa")
    .attr("d", path);

  /* ── generación aleatoria filtrada por territorio real ──
      se sortean coordenadas dentro del rectángulo que cubre EE.UU.,
      y se descartan las que no caen dentro de ningún estado (mar, México, Canadá) */
  const localesGenerados = [];
  let intentos = 0;
  const maxIntentos = CANTIDAD_OBJETIVO * 25; // margen de seguridad para no loopear infinito

  while (localesGenerados.length < CANTIDAD_OBJETIVO && intentos < maxIntentos) {
    intentos++;
    const lat = RECT_USA.latMin + rand() * (RECT_USA.latMax - RECT_USA.latMin);
    const lng = RECT_USA.lngMin + rand() * (RECT_USA.lngMax - RECT_USA.lngMin);
    const punto = [lng, lat];

    const dentroDeAlgunEstado = states.features.some(f => d3.geoContains(f, punto));
    if (dentroDeAlgunEstado) {
      localesGenerados.push([lat, lng]);
    }
  }

  /* todos los locales disponibles, en orden: reales primero, luego generados.
      Este orden define qué puntos "ya existen" en cada etapa de expansión. */
  const todosLosLocales = [...localesReales, ...localesGenerados];
  const totalLocales = todosLosLocales.length;

  const puntosProyectados = todosLosLocales
    .map(([lat,lng]) => projection([lng,lat]))
    .filter(p => p !== null);

  /* todos los círculos existen desde el principio, ocultos.
      el scroll solo controla CUÁNTOS están visibles (opacity), no los crea/destruye. */
  const circulosSel = svg.append("g")
    .selectAll("circle")
    .data(puntosProyectados)
    .join("circle")
    .attr("class","punto-local")
    .attr("cx", d => d[0])
    .attr("cy", d => d[1])
    .attr("r", 2.8)
    .style("opacity", 0);

  const circulosNodos = circulosSel.nodes();
  const contadorEl   = document.getElementById("expansionContador");
  const tarjetas      = document.querySelectorAll(".expansion-tarjeta");
  const dots           = document.querySelectorAll(".expansion-paso-dot");

  let pasoVisible = -1; // último paso renderizado, para no repetir trabajo en cada frame

/*═══════════════════════════════════════════════════════════════
  FUNCIÓN PRINCIPAL

  Esta función recibe el progreso del scroll (0 → 1) y actualiza toda la visualización.

  Se encarga de:
  • mostrar más puntos
  • actualizar el contador
  • cambiar las tarjetas
  • actualizar los indicadores inferiores

  Cada vez que el usuario mueve el scroll,
  esta función vuelve a ejecutarse.
═══════════════════════════════════════════════════════════════*/
  function aplicarProgreso(progresoGlobal) {
    // progresoGlobal va de 0 a 1 a lo largo de TODO el espaciador de scroll.
    // lo dividimos en 5 etapas iguales para decidir cuál tarjeta mostrar,
    // pero la cantidad de puntos visibles interpola siempre de forma continua
    // entre la etapa anterior y la actual (sin saltos brutos).

    const totalEtapas = ETAPAS.length;
    const posicion = Math.min(progresoGlobal, 0.999) * totalEtapas; // 0..5
    const pasoActual = Math.min(Math.floor(posicion), totalEtapas - 1); // 0..4
    const fraccionDentroDelPaso = posicion - pasoActual; // 0..1 dentro de la etapa

    const pctAnterior = pasoActual === 0 ? 0 : ETAPAS[pasoActual - 1].pct;
    const pctActual    = ETAPAS[pasoActual].pct;
    const pctInterpolado = pctAnterior + (pctActual - pctAnterior) * fraccionDentroDelPaso;

    const cantidadVisible = Math.round(pctInterpolado * totalLocales);

    /* actualizar opacidad de los círculos según corresponda */
    for (let i = 0; i < circulosNodos.length; i++) {
      const debeEstarVisible = i < cantidadVisible;
      const elActual = circulosNodos[i];
      const opacidadActual = elActual.style.opacity;
      if (debeEstarVisible && opacidadActual !== "0.6") {
        elActual.style.opacity = "0.9";
      } else if (!debeEstarVisible && opacidadActual !== "0") {
        elActual.style.opacity = "0";
      }
    }

    /* contador numérico: interpola de forma continua entre la cifra "real"
        de la etapa anterior y la de la etapa actual (igual lógica que los
        puntos del mapa, pero en su propia escala de hasta 200.000) —
        así el número sube progresivamente con el scroll, no salta de golpe */
    const cifraAnterior = pasoActual === 0 ? 0 : ETAPAS[pasoActual - 1].cifraNum;
    const cifraActual    = ETAPAS[pasoActual].cifraNum;
    const cifraInterpolada = Math.round(
      cifraAnterior + (cifraActual - cifraAnterior) * fraccionDentroDelPaso
    );
    contadorEl.textContent = cifraInterpolada.toLocaleString('es-AR') + " locales";

    /* actualizar tarjeta visible con 4 estados según en qué momento
        de la etapa estamos (fraccionDentroDelPaso, de 0 a 1):
        - 0.00–0.30 → la tarjeta del paso anterior termina de subir y desaparece
        - 0.30–0.70 → zona "muerta": ninguna tarjeta visible, pero el contador
                      y los puntos del mapa siguen avanzando (la expansión ocurre
                      "fuera de cámara" antes de mostrar el siguiente dato)
        - 0.70–1.00 → la tarjeta del paso actual sube desde abajo hasta el centro */
    const UMBRAL_SALIDA  = 0.30;
    const UMBRAL_ENTRADA = 0.40;

    tarjetas.forEach(t => {
      const numeroPaso = parseInt(t.dataset.paso, 10) - 1; // 0-indexado
      t.classList.remove('pendiente', 'activa', 'salida');

      if (numeroPaso < pasoActual) {
        // pasos ya completamente superados → siempre arriba, fuera de pantalla
        t.classList.add('salida');
      } else if (numeroPaso > pasoActual) {
        // pasos futuros → siempre abajo, esperando
        t.classList.add('pendiente');
      } else {
        // numeroPaso === pasoActual: depende de en qué momento de la etapa estamos
        if (fraccionDentroDelPaso < UMBRAL_SALIDA) {
          t.classList.add('salida'); // la propia tarjeta del paso recién está saliendo
        } else if (fraccionDentroDelPaso > UMBRAL_ENTRADA) {
          t.classList.add('activa'); // ya llegó a su lugar
        } else {
          // zona muerta intermedia: aplicamos un estado intermedio invisible
          t.classList.add('pendiente');
        }
      }
    });

    dots.forEach(d => {
      const esEsta = parseInt(d.dataset.paso, 10) === pasoActual + 1;
      d.classList.toggle('activo', esEsta);
    });
  }

  /* ── ScrollTrigger con scrub: el progreso del scroll controla todo,
      sin animaciones automáticas de ningún tipo ── */
  ScrollTrigger.create({
    trigger: "#p-locales",
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      aplicarProgreso(self.progress);
    },
    onEnter: () => {
      // asegura que la primera tarjeta y el primer dot ya estén marcados
      // apenas se entra a la sección, aunque el progreso sea casi 0
      aplicarProgreso(0.001);
    },
    onLeaveBack: () => {
      pasoVisible = -1;
      circulosNodos.forEach(el => el.style.opacity = "0");
      tarjetas.forEach(t => t.classList.remove('activa', 'salida', 'pendiente'));
      dots.forEach(d => d.classList.remove('activo'));
      contadorEl.textContent = "0 locales";
    }
  });

  /* ── transición final (Acto IV.5) — aparece al llegar, independiente del mapa ── */
  gsap.to("#expansionCierreTexto", {
    opacity: 1,
    y: 0,
    duration: 1.1,
    ease: "power2.out",
    scrollTrigger: {
      trigger: "#p-expansion-cierre",
      start: "top 65%",
      toggleActions: "play none none reverse",
    }
  });

})();