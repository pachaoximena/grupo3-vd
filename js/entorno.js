/* ==========================================================
   ACTO IV — EL ENTORNO
   Motor de scrollytelling + 3 gráficos D3.
   Datos simulados — reemplazar el objeto DATA por datos reales.
   Requiere: D3 v7 cargado antes de este script.
   ========================================================== */

(function () {
  "use strict";

  const root = document.getElementById("p-entorno");
  if (!root) return; // esta sección no está en la página

  /* ----------------------------------------------------------
     1. DATOS SIMULADOS (reemplazar por datos reales)
  ---------------------------------------------------------- */
  const DATA = {
    tiempo: [
      { year: 1965, minutos: 68 },
      { year: 1975, minutos: 60 },
      { year: 1985, minutos: 52 },
      { year: 1995, minutos: 44 },
      { year: 2005, minutos: 36 },
      { year: 2015, minutos: 29 },
      { year: 2023, minutos: 24 }
    ],
    precio: [
      { id: "combo", emoji: "🍔", label: "Combo de hamburguesa", precio: 7.20 },
      { id: "ensalada", emoji: "🥗", label: "Ensalada + fruta", precio: 10.60 }
    ],
    proximidad: [
      { id: "alta", label: "Alta disponibilidad de comida rápida", valor: 64 },
      { id: "limitada", label: "Acceso limitado a alimentos frescos", valor: 36 }
    ]
  };

  const LABELS = [
    "Minutos promedio dedicados a cocinar por día"
  ];

  /* ----------------------------------------------------------
     2. MOTOR DE SCROLLYTELLING
  ---------------------------------------------------------- */
  const steps = Array.from(root.querySelectorAll(".entorno-step"));
  const infoCards = Array.from(root.querySelectorAll(".info-card"));
  const charts = {
    0: document.getElementById("entorno-chart-line"),
    1: document.getElementById("entorno-chart-bubble"),
    2: document.getElementById("entorno-chart-pie")
  };
  const chartLabel = document.getElementById("entorno-chart-label");
  const railDots = Array.from(root.querySelectorAll(".rail-dot"));
  const railFill = root.querySelector(".rail-fill");

  let activeScene = -1;

  function setActiveScene(index) {
    if (index === activeScene) return;
    activeScene = index;

    infoCards.forEach((el) => {
      el.classList.toggle("active", Number(el.dataset.scene) === index);
    });

    Object.entries(charts).forEach(([key, svg]) => {
      svg.classList.toggle("is-active", Number(key) === index);
    });

    railDots.forEach((dot) => {
      dot.classList.toggle("is-active", Number(dot.dataset.rail) <= index);
    });

    if (railFill) {
      const pct = steps.length > 1 ? (index / (steps.length - 1)) * 100 : 0;
      railFill.style.height = pct + "%";
    }

    if (chartLabel) {
      chartLabel.style.opacity = 0;
      window.setTimeout(() => {
        chartLabel.textContent = LABELS[index];
        chartLabel.style.opacity = 1;
      }, 200);
    }

    // dispara (o vuelve a disparar) la animación del gráfico correspondiente
    if (index === 0) renderLineChart();
    if (index === 1) renderBubbleChart();
    if (index === 2) renderPieChart();
  }

  // Determina qué "step" está más cerca del centro del viewport
  function updateActiveStepFromScroll() {
    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    steps.forEach((step, i) => {
      const rect = step.getBoundingClientRect();
      const stepCenter = rect.top + rect.height / 2;
      const distance = Math.abs(stepCenter - viewportCenter);
      if (rect.top < viewportCenter && rect.bottom > 0 && distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    });

    // Si el primer step todavía no llegó al viewport, no activar nada aún
    const firstRect = steps[0].getBoundingClientRect();
    if (firstRect.top > viewportCenter) {
      return;
    }

    setActiveScene(closestIndex);
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActiveStepFromScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  window.addEventListener("resize", () => {
    activeScene = -1;
    updateActiveStepFromScroll();
  });

  /* ----------------------------------------------------------
     3. ESCENA 1 — LINE CHART (tiempo dedicado a cocinar)
  ---------------------------------------------------------- */
  function renderLineChart() {
    const svg = d3.select("#entorno-chart-line");
    svg.selectAll("*").remove();

    const vb = svg.node().viewBox.baseVal;
    const width = vb.width || 640;
    const height = vb.height || 480;
    const margin = { top: 70, right: 30, bottom: 40, left: 46 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(DATA.tiempo, (d) => d.year))
      .range([0, innerW]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(DATA.tiempo, (d) => d.minutos) * 1.15])
      .range([innerH, 0]);

    // grid horizontal
    g.append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(y)
          .tickSize(-innerW)
          .tickFormat("")
          .ticks(5)
      )
      .call((sel) => sel.select(".domain").remove());

    // ejes
    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(DATA.tiempo.length).tickFormat(d3.format("d")));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(5));

    const line = d3.line()
      .x((d) => x(d.year))
      .y((d) => y(d.minutos))
      .curve(d3.curveMonotoneX);

    const path = g.append("path")
      .datum(DATA.tiempo)
      .attr("class", "line-path")
      .attr("d", line);

    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);

    g.selectAll(".line-dot")
      .data(DATA.tiempo)
      .join("circle")
      .attr("class", "line-dot")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y(d.minutos))
      .attr("r", 0)
      .transition()
      .delay((d, i) => 150 + i * (1000 / DATA.tiempo.length))
      .duration(400)
      .attr("r", 4);
  }

  /* ----------------------------------------------------------
     4. ESCENA 2 — BUBBLE COMPARATIVO (precio)
  ---------------------------------------------------------- */
  function renderBubbleChart() {
    const svg = d3.select("#entorno-chart-bubble");
    svg.selectAll("*").remove();

    const vb = svg.node().viewBox.baseVal;
    const width = vb.width || 640;
    const height = vb.height || 480;

    const maxR = 140;
    const minR = 90;
    const radius = d3.scaleSqrt()
      .domain([0, d3.max(DATA.precio, (d) => d.precio)])
      .range([minR * 0.6, maxR]);

    const cx = [width * 0.30, width * 0.70];
    const cy = height * 0.46;

    const g = svg.append("g");

    const groups = g.selectAll(".bubble")
      .data(DATA.precio)
      .join("g")
      .attr("class", "bubble")
      .attr("transform", (d, i) => `translate(${cx[i]},${cy})`);

    groups.append("circle")
      .attr("r", 0)
      .attr("fill", (d, i) => (i === 0 ? "#F4E4BC" : "#F2F2F2"))
      .attr("stroke", (d, i) => (i === 0 ? "#D89A00" : "#B9B9B9"))
      .attr("stroke-width", 1.5)
      .transition()
      .duration(900)
      .ease(d3.easeBackOut.overshoot(1.1))
      .attr("r", (d) => radius(d.precio));

     groups.append("text")
      .attr("class", "bubble-price")
      .attr("y", 8)
      .style("opacity", 0)
      .text((d) => "$" + d.precio.toFixed(2))
      .transition()
      .delay(450)
      .duration(500)
      .style("opacity", 1);

    g.selectAll(".bubble-label")
      .data(DATA.precio)
      .join("text")
      .attr("class", "bubble-label")
      .attr("x", (d, i) => cx[i])
      .attr("y", (d, i) => {
           if (d.id === "ensalada") {
             return cy + radius(d.precio) + 15;
           }
           return cy + radius(d.precio) + 28;
         })
      .style("opacity", 0)
      .transition()
      .delay(500)
      .duration(500)
      .style("opacity", 1);

     g.selectAll(".bubble-name")
        .data(DATA.precio)
        .join("text")
        .attr("class", "bubble-name")
        .attr("x", (d, i) => cx[i])
        .attr("y", (d, i) => cy + radius(d.precio) + 55)
        .attr("text-anchor", "middle")
        .style("opacity", 0)
        .style("font-family", "Inter, sans-serif")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .text((d) => d.label)
        .transition()
        .delay(600)
        .duration(500)
        .style("opacity", 1);

    // nota comparativa sutil
   svg.append("text")
     .attr("x", width / 2)
     .attr("y", height - 35)
     .attr("text-anchor", "middle")
     .attr("class", "pie-label")
     .style("opacity", 0)
     .style("font-size", "18px")
     .style("font-family", "Inter, sans-serif")
     .style("font-weight", "600")
     .style("fill", "#000000")
     .text("El tamaño representa el precio relativo de cada opción")
     .transition()
     .delay(650)
     .duration(500)
     .style("opacity", 1);
  }

  /* ----------------------------------------------------------
     5. ESCENA 3 — PIE / DONUT (proximidad)
  ---------------------------------------------------------- */
  function renderPieChart() {
    const svg = d3.select("#entorno-chart-pie");
    svg.selectAll("*").remove();

    const vb = svg.node().viewBox.baseVal;
    const width = vb.width || 640;
    const height = vb.height || 480;
    const radius = Math.min(width, height) / 2 - 45;

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2 - 30})`);

    const color = d3.scaleOrdinal()
      .domain(DATA.proximidad.map((d) => d.id))
      .range(["#D89A00", "#B8B8B8"]);

    const pie = d3.pie().value((d) => d.valor).sort(null).padAngle(0.015);
    const arcs = pie(DATA.proximidad);

    const arcGen = d3.arc()
      .innerRadius(radius * 0.62)
      .outerRadius(radius)
      .cornerRadius(3);

    const arcTween = (d) => {
      const i = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
      return (t) => arcGen(i(t));
    };

    g.selectAll("path")
      .data(arcs)
      .join("path")
      .attr("fill", (d) => color(d.data.id))
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attrTween("d", arcTween);
    // porcentajes dentro de cada segmento
     const labelArc = d3.arc()
        .innerRadius(radius * 0.78)
        .outerRadius(radius * 0.78);
      
     g.selectAll(".pie-percentage")
        .data(arcs)
        .join("text")
        .attr("class", "pie-value")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .style("opacity", 0)
        .text(d => `${d.data.valor}%`)
        .transition()
        .delay(600)
        .duration(500)
        .style("opacity", 1);
     
    // leyenda simple debajo
    const legend = svg.append("g")
      .attr("transform", `translate(${width / 2 - 180},${height - 40})`);

    const legendItems = legend.selectAll(".legend-item")
      .data(DATA.proximidad)
      .join("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0,${i * 26})`)
      .style("opacity", 0);

    legendItems.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("rx", 2)
      .attr("fill", (d) => color(d.id));

    legendItems.append("text")
      .attr("x", 18)
      .attr("y", 9)
      .attr("class", "pie-label")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#000")
      .text((d) => d.label);

    legendItems.transition().delay(700).duration(500).style("opacity", 1);
  }

  /* ----------------------------------------------------------
     6. INICIALIZACIÓN
  ---------------------------------------------------------- */
  function init() {
    setActiveScene(0);
    updateActiveStepFromScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
