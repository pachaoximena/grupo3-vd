/*═══════════════════════════════════════════════════════════════
  MAPA MUNDIAL

  Este archivo construye el mapa interactivo que compara el
  porcentaje de obesidad entre distintos países.

  Tecnologías utilizadas:

  • D3.js → dibuja el mapa y las burbujas.
  • TopoJSON → contiene la geometría del mapa mundial.
  • GSAP + ScrollTrigger → animaciones al hacer scroll.

  Flujo general:

  1. Se cargan los datos de obesidad.
  2. Se descarga el mapa mundial.
  3. Se dibujan los países.
  4. Se generan las burbujas.
  5. Se agregan etiquetas y tooltip.
  6. Se animan todos los elementos al entrar en pantalla.
═══════════════════════════════════════════════════════════════*/

/* Esta función se ejecuta automáticamente apenas se carga
   el archivo.

   También evita que las variables de este mapa interfieran
   con otros archivos JavaScript del proyecto. */
(async function() {
/*═══════════════════════════════════════════════════════════════
  DATOS

  Cada entrada representa un país y su porcentaje de obesidad.

  IMPORTANTE

  Si queremos agregar o quitar un país del mapa,
  debemos modificar este objeto.
═══════════════════════════════════════════════════════════════*/
  const datos = {
    // América del Norte
    "United States": 41.64,
    "Canada": 28.16,
    "Mexico": 32.22,

    // América del Sur
    "Argentina": 35.53,
    "Chile": 34.10,
    "Brazil": 25.05,

    // Europa
    "United Kingdom": 26.94,
    "Germany": 23.08,
    "France": 10.18,
    "Greece": 30.06,
    "Romania": 38.34,

    // Medio Oriente
    "Qatar": 40.79,
    "Saudi Arabia": 38.13,

    // Asia Oriental
    "Japan": 8.16,
    "South Korea": 7.78,
    "China": 7.15,

    // Sudeste Asiático
    "Singapore": 16.09,

    // Oceanía
    "Australia": 32.05,
    "New Zealand": 32.99
  };

    /* ── Mapeo nombre → código ISO numérico ── */
  const nombreAIso = {
    "United States":"840",
    "Canada":"124",
    "Mexico":"484",

    "Argentina":"032",
    "Chile":"152",
    "Brazil":"076",

    "United Kingdom":"826",
    "Germany":"276",
    "France":"250",
    "Greece":"300",
    "Romania":"642",

    "Qatar":"634",
    "Saudi Arabia":"682",

    "Japan":"392",
    "South Korea":"410",
    "China":"156",

    "Singapore":"702",

    "Australia":"036",
    "New Zealand":"554"
  };
  const isoANombre = Object.fromEntries(Object.entries(nombreAIso).map(([n,c]) => [c,n]));

  /* ── cargar geometría del mundo ── */
  let world;
  try {
    world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
  } catch(e) { console.warn("No se pudo cargar el mapa base:", e); return; }

  const svg    = d3.select("#mapaSvg");
  const width  = 960, height = 560;

  const projection = d3.geoNaturalEarth1()
    .scale(190)
    .translate([width / 2, height / 2 + 20]);

  const path = d3.geoPath().projection(projection);
  const countries = topojson.feature(world, world.objects.countries);

  /* dibujar países de fondo */
  svg.append("g")
    .selectAll("path")
    .data(countries.features)
    .join("path")
    .attr("class", "pais-path")
    .attr("d", path);

  /* radio proporcional al % (escala potencia para exagerar diferencia visual) */
  const escalaR = d3.scalePow().exponent(0.85)
    .domain([0, 42])
    .range([0, 34]);

/*═══════════════════════════════════════════════════════════════
  NODOS

  Cada burbuja del mapa se almacena como un objeto con:

  • nombre
  • porcentaje
  • radio
  • posición

  Más adelante estos nodos serán utilizados por D3 para
  dibujar las burbujas y aplicar las animaciones.
═══════════════════════════════════════════════════════════════*/
  /* construir nodos en sus posiciones geográficas reales */
  const nodos = [];
  countries.features.forEach(f => {
    const iso    = String(f.id).padStart(3, "0");
    const nombre = isoANombre[iso];
    if (!nombre) return;
    const pct = datos[nombre];
    if (!pct) return;

    let centroide;
    try { centroide = path.centroid(f); } catch(e) { return; }
    if (!centroide || isNaN(centroide[0])) return;

    nodos.push({
      nombre, pct,
      r: escalaR(pct),
      x: centroide[0], y: centroide[1],
      xFijo: centroide[0], yFijo: centroide[1], // posición geográfica original (ancla)
    });
  });

/*═══════════════════════════════════════════════════════════════
  SIMULACIÓN DE FUERZAS

  Algunos países están muy cerca entre sí.

  Para evitar que las burbujas se superpongan, D3 aplica una
  simulación física que las separa ligeramente.

  Cada burbuja intenta mantenerse cerca de su posición real,
  pero sin chocar con las demás.
═══════════════════════════════════════════════════════════════*/
  const simulation = d3.forceSimulation(nodos)
    .force("x", d3.forceX(d => d.xFijo).strength(0.25))
    .force("y", d3.forceY(d => d.yFijo).strength(0.25))
    .force("collide", d3.forceCollide(d => d.r + 2).iterations(6))
    .stop();

  for (let i = 0; i < 250; i++) simulation.tick();

  /* clamp dentro del viewBox */
  nodos.forEach(d => {
    d.x = Math.max(d.r + 4, Math.min(width  - d.r - 4, d.x));
    d.y = Math.max(d.r + 4, Math.min(height - d.r - 4, d.y));
  });

  const tooltip        = document.getElementById("mapaTooltip");
  const contenedorMapa = document.getElementById("mapaContenedor");

  /* línea fina que conecta la posición real con la burbuja reubicada (solo si se movió bastante) */
  const lineas = svg.append("g")
    .selectAll("line")
    .data(nodos.filter(d => Math.hypot(d.x - d.xFijo, d.y - d.yFijo) > 6))
    .join("line")
    .attr("x1", d => d.xFijo).attr("y1", d => d.yFijo)
    .attr("x2", d => d.x).attr("y2", d => d.y)
    .attr("stroke", "#666")
    .attr("stroke-width", 0.6)
    .attr("opacity", 0);

  const grupos = svg.selectAll("g.burbuja-grupo")
    .data(nodos)
    .join("g")
    .attr("class", "burbuja-grupo")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  grupos.append("circle")
    .attr("class", d => "burbuja" + (d.nombre === "United States" ? " burbuja-usa" : ""))
    .attr("r", d => d.r)
    .style("opacity", 0)
    .on("mouseenter", function(event, d) {
      tooltip.style.display = "block";
      tooltip.innerHTML = `<strong>${d.nombre}</strong><br/>${d.pct}% de obesidad`;
      d3.select(this).style("opacity", "1");
    })
    .on("mousemove", function(event) {
      const rect = contenedorMapa.getBoundingClientRect();
      tooltip.style.left = (event.clientX - rect.left + 12) + "px";
      tooltip.style.top  = (event.clientY - rect.top  - 36) + "px";
    })
    .on("mouseleave", function(event, d) {
      tooltip.style.display = "none";
      d3.select(this).style("opacity", d.nombre === "United States" ? "0.92" : "0.55");
    });

  /* etiqueta de % dentro de los círculos más grandes */
  /* Tipografia dentro de las burbujas */

  grupos.filter(d => d.r > 20).append("text")
    .attr("class", "burbuja-label")
    .attr("text-anchor", "middle")
    .attr("dy", "0.32em")
    .attr("font-family", "'Inter', sans-serif")
    .attr("font-weight", 600)
    .attr("font-size", d => Math.max(11, d.r * 0.45) + "px")
    .attr("fill", "#0a0a0a")
    .attr("opacity", 0)
    .text(d => d.pct + "%");

 /* etiqueta destacada para EE.UU. con flecha apuntando al círculo */
  const usaNodo = nodos.find(d => d.nombre === "United States");

  if (usaNodo) {

    /* definir punta de flecha reutilizable */
    let defs = svg.select("defs");
    if (defs.empty()) defs = svg.append("defs");

    defs.append("marker")
      .attr("id", "puntaFlechaUSA")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 8)
      .attr("refY", 5)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "var(--acento)");

    const grupoUSA = svg.append("g")
      .attr("id", "labelUSA")
      .attr("opacity", 0);

    /* punto de origen: a la izquierda del círculo de EE.UU. */
    const destinoX = usaNodo.x - usaNodo.r - 6;
    const destinoY = usaNodo.y;
    const origenX  = usaNodo.x - usaNodo.r - 95;
    const origenY  = usaNodo.y - 48;

    /* línea curva (path) con punta de flecha en el extremo que toca el círculo */
    grupoUSA.append("path")
      .attr("d", `M ${origenX} ${origenY} Q ${origenX + 25} ${destinoY - 10}, ${destinoX} ${destinoY}`)
      .attr("fill", "none")
      .attr("stroke", "var(--acento)")
      .attr("stroke-width", 1.6)
      .attr("marker-end", "url(#puntaFlechaUSA)");

    /* texto explicativo, alineado a la derecha (terminando antes del inicio de la flecha) */
    grupoUSA.append("text")
      .attr("x", origenX)
      .attr("y", origenY - 16)
      .attr("text-anchor", "start")
      .attr("font-family", "'Inter', sans-serif")
      .attr("font-weight", 800)
      .attr("font-size", "13px")
      .attr("letter-spacing", "0.04em")
      .attr("fill", "var(--acento)")
      .text("EE.UU.");

    grupoUSA.append("text")
      .attr("x", origenX)
      .attr("y", origenY - 2)
      .attr("text-anchor", "start")
      .attr("font-family", "'Inter', sans-serif")
      .attr("font-size", "10px")
      .attr("fill", "#cccccc")
      .text("Mayor tasa de obesidad");
  }

  /* ── animación al entrar en viewport ── */
  let animado = false;

  ScrollTrigger.create({
    trigger: "#p-mapa",
    start: "top 60%",
    onEnter: () => {
      if (animado) return;
      animado = true;

      gsap.to(".mapa-tag", {
          opacity:1,
          y:0,
          duration:1,
          ease:"power2.out"
      });

      gsap.to(".mapa-leyenda", {
          opacity:1,
          duration:1,
          delay:0.5
      });

      lineas.transition().delay(300).duration(500).attr("opacity", 0.5);

      /* burbujas aparecen ordenadas de menor a mayor */
      const ordenadas = [...nodos].sort((a, b) => a.pct - b.pct);

      ordenadas.forEach((d, i) => {
        const delay = i * 60;
        const esUSA = d.nombre === "United States";
        setTimeout(() => {
          svg.selectAll("g.burbuja-grupo")
            .filter(n => n === d)
            .select("circle")
            .transition().duration(450).ease(d3.easeBackOut)
            .style("opacity", esUSA ? 0.92 : 0.55);

          svg.selectAll("g.burbuja-grupo")
            .filter(n => n === d)
            .select("text.burbuja-label")
            .transition().delay(200).duration(300)
            .attr("opacity", 1);
        }, delay);
      });

      setTimeout(() => {
        d3.select("#labelUSA").transition().duration(700).attr("opacity", 1);
      }, nodos.length * 60 + 500);
    },
    onLeaveBack: () => {
      animado = false;
      svg.selectAll("circle.burbuja").style("opacity", 0);
      svg.selectAll("text.burbuja-label").attr("opacity", 0);
      lineas.attr("opacity", 0);
      d3.select("#labelUSA").attr("opacity", 0);
      gsap.to(".mapa-tag", {
          opacity:0,
          y:12,
          duration:0.4
      });

      gsap.to(".mapa-leyenda", {
          opacity:0,
          duration:0.4
      });
    }
  });

})();