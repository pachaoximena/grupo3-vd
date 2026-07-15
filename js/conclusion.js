/* ══════════════════════════════════════
   ACTO VII — CONCLUSIÓN
   ---------------------------------------------------------------
   Controla la escena negra pineada del final:

   1) Tres frases que aparecen y desaparecen, una por vez,
      a medida que se hace scroll (no es un autoplay: el usuario
      controla el ritmo scrolleando, igual que el resto del sitio).

   2) Después de la tercera frase, vuelve el 42% (esta vez chico)
      junto con el texto de cierre de la escena.

   Requiere GSAP + ScrollTrigger (ya están cargados en el <head>).
═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    gsap.registerPlugin(ScrollTrigger);

    const section    = document.getElementById('p-conclusion');
    const stickyWrap = document.getElementById('conclusionStickyWrap');
    const frases      = gsap.utils.toArray('.conclusion-frase');
    const numeroWrap  = document.getElementById('conclusionNumeroWrap');
    const numeroEl    = document.getElementById('conclusionNumero');

    if (!section || !stickyWrap || !frases.length || !numeroWrap) return;

    /*
      Franjas de progreso (0 a 1) del scroll total de la sección.
      Cada frase tiene un tramo para aparecer y otro para desaparecer.
      Dejamos un silencio inicial en negro (0 → 0.06) antes de que
      aparezca la primera frase, tal como se pidió: "la pantalla
      queda completamente negra, muy lentamente aparece una frase".
    */
    const franjas = [
        { in: 0.06, out: 0.24 },
        { in: 0.32, out: 0.48 },
        { in: 0.56, out: 0.72 },
    ];

    const inicioNumero = 0.80;
    let numeroAnimado = false;

    ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=400%',
        pin: stickyWrap,
        scrub: 0.4,
        onUpdate(self) {
            const p = self.progress;

            frases.forEach((frase, i) => {
                const { in: inicio, out: fin } = franjas[i];
                const medio = inicio + (fin - inicio) / 2;
                let opacity = 0;

                if (p >= inicio && p < medio) {
                    opacity = (p - inicio) / (medio - inicio);
                } else if (p >= medio && p < fin) {
                    opacity = 1 - (p - medio) / (fin - medio);
                }

                frase.style.opacity = Math.max(0, Math.min(1, opacity));
            });

            if (p >= inicioNumero) {
                const t = (p - inicioNumero) / (1 - inicioNumero);
                numeroWrap.style.opacity = Math.min(1, t);
                numeroWrap.classList.toggle('visible', t > 0.05);

                /* el 42% cuenta de 0 a 42 una sola vez, la primera vez que se ve */
                if (!numeroAnimado) {
                    numeroAnimado = true;
                    const contador = { valor: 0 };
                    gsap.to(contador, {
                        valor: 42,
                        duration: 1.3,
                        ease: 'power1.out',
                        onUpdate() {
                            numeroEl.innerHTML = Math.round(contador.valor) + '<sup>%</sup>';
                        },
                    });
                }
            } else {
                numeroWrap.style.opacity = 0;
                numeroWrap.classList.remove('visible');
            }
        },
    });

});
