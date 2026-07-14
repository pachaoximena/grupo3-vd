/*═══════════════════════════════════════════════════════════════
      ANIMACIONES DEL PROYECTO
  ----------------------------------------------------------------
  Este archivo contiene las animaciones principales del
  scrollytelling.

  La mayoría de ellas utilizan GSAP y ScrollTrigger.

  Organización:

  • Intro
  • Acto I
  • Acto II
  • Acto III
  • ...

  Cada acto puede modificarse de forma independiente.

  IMPORTANTE:
  Muchos elementos se seleccionan mediante su id (#).
  Si se cambia el nombre de un id en el HTML, también deberá
  actualizarse aquí para que las animaciones sigan funcionando.
═══════════════════════════════════════════════════════════════*/

/*═══════════════════════════════════════════════════════════════
  ANTES DE MODIFICAR ESTE ARCHIVO

  1. Verificar que el id del elemento exista en el HTML.

  2. Si se cambia un id en el HTML, actualizar también este archivo.

  3. Si una animación deja de funcionar, revisar primero que el
  selector (#...) siga teniendo el mismo nombre.

  La mayoría de los errores en este archivo suelen deberse a que
  el selector ya no coincide con el HTML.
═══════════════════════════════════════════════════════════════*/

gsap.registerPlugin(ScrollTrigger);
/* Activa el plugin ScrollTrigger para poder disparar
   animaciones cuando el usuario hace scroll. */


/*═══════════════════════════════════════════════════════════════
  FUNCIÓN AUXILIAR

  Esta función evita repetir siempre el mismo código de GSAP.

  En lugar de escribir toda la configuración de ScrollTrigger
  cada vez, simplemente llamamos:

  alEntrar(
      selector,
      propiedades,
      trigger,
      posición
  );

  Ejemplo:

  alEntrar('#precioTitulo',
      { opacity:1, duration:0.8 },
      '#p9'
  );

  Esto hará que el elemento aparezca cuando la sección indicada
  entre en pantalla.
═══════════════════════════════════════════════════════════════*/
function alEntrar(sel, props, triggerSel, startPos = 'top 65%') {
  gsap.to(sel, {
    ...props,
    scrollTrigger: {
      trigger: triggerSel || sel,
      start: startPos,
      toggleActions: 'play none none reverse',
    }
  });
}
/*═══════════════════════════════════════
  ACTO I — INTRODUCCIÓN
═══════════════════════════════════════*/

alEntrar('.intro-tag',{
    opacity:1,
    y:0,
    duration:.8
},'.intro');

alEntrar('.intro h2',{
    opacity:1,
    y:0,
    duration:1
},'.intro');

alEntrar('.intro-destacado',{
    opacity:1,
    y:0,
    duration:1,
    delay:.2
},'.intro');

alEntrar('.intro-texto',{
    opacity:1,
    y:0,
    duration:1,
    delay:.4
},'.intro');

alEntrar('.intro-final',{
    opacity:1,
    y:0,
    duration:1,
    delay:.6
},'.intro');

/*═══════════════════════════════════════
  ACTO II — CONTADOR
═══════════════════════════════════════*/

ScrollTrigger.create({

    trigger:".problema",

    start:"top 60%",

    once:true,

    onEnter:()=>{

        let valor=0;

        const numero=document.getElementById("counter");

        const intervalo=setInterval(()=>{

              valor++;
      
              numero.innerHTML = `${valor}<sup>%</sup>`;
      
              if(valor>=42){
                 clearInterval(intervalo);
              }
      
              },40);

    }

});
alEntrar('.mapa-tag',{
    opacity:1,
    y:0,
    duration:.8
},'#p-mapa');

alEntrar('.mapa-titulo',{
    opacity:1,
    y:0,
    duration:1
},'#p-mapa');

alEntrar('.mapa-subtitulo',{
    opacity:1,
    y:0,
    duration:1,
    delay:.2
},'#p-mapa');

alEntrar('.mapa-leyenda',{
    opacity:1,
    y:0,
    duration:1,
    delay:.4
},'#p-mapa');

alEntrar('.entorno-tag',{
    opacity:1,
    y:0,
    duration:.8
},'#p-entorno');

alEntrar('.entorno-titulo',{
    opacity:1,
    y:0,
    duration:1
},'#p-entorno');

gsap.utils.toArray(".timeline-item").forEach((item,i)=>{

    gsap.to(item,{

        opacity:1,

        y:0,

        duration:.8,

        delay:i*.15,

        scrollTrigger:{

            trigger:"#p-entorno",

            start:"top 55%"

        }

    });

});

alEntrar('.entorno-final',{
    opacity:1,
    y:0,
    duration:1
},'#p-entorno');


/*═══════════════════════════════════════════════════════════════
      ACTO V — DECISIÓN INTERACTIVA
═══════════════════════════════════════════════════════════════*/
console.log("JS DE DECISION CARGADO");
(function(){

    const totalPasos = 3;

    const feedbacks = {

        1:{
            casera:"Elegiste cocinar. Tenías el tiempo y los recursos para hacerlo.",
            rapida:"Elegiste comida rápida, incluso cuando cocinar era posible."
        },

        2:{
            casera:"Elegiste cocinar nuevamente, aunque ahora la decisión requiere más esfuerzo.",
            rapida:"El precio vuelve más atractiva una opción rápida."
        },

        3:{
            casera:"Elegiste una alternativa diferente a pesar de las barreras.",
            rapida:"El entorno hizo que esta fuera la opción más fácil."
        }

    };


    window.elegirOpcion = function(paso, eleccion){

        console.log("click detectado", paso, eleccion);
        const tarjeta = document.getElementById(
            "situacion-" + paso
        );


        const feedback = document.getElementById(
            "feedback-" + paso
        );


        feedback.textContent = feedbacks[paso][eleccion];

        feedback.classList.add("visible");


        tarjeta.querySelectorAll(".decision-btn")
        .forEach(btn => {

            if(btn.dataset.eleccion === eleccion){
                btn.classList.add("seleccionado");
            }

        });

        tarjeta.querySelectorAll(".decision-btn")
        .forEach(btn => btn.disabled = true);


        setTimeout(()=>{


            // Si elige comida casera, termina directamente
            if(eleccion === "casera"){

                mostrarFinal();

                return;

            }


            // Si elige comida rápida, avanza a la siguiente situación
            if(eleccion === "rapida"){


                if(paso < totalPasos){

                    const siguiente = document.getElementById(
                        "situacion-" + (paso+1)
                    );


                    siguiente.classList.add("activa");


                    gsap.from(siguiente,{
                        opacity:0,
                        y:30,
                        duration:.8
                    });


                }

                else{

                    mostrarFinal();

                }

            }


        },1800);


    };


    function mostrarFinal(){

        const final =
        document.getElementById("decisionTransicion");


        final.classList.add("activa");


        gsap.from(final,{
            opacity:0,
            y:30,
            duration:1
        });

    }



    ScrollTrigger.create({

        trigger:"#p-decision",

        start:"top 55%",

        once:true,

        onEnter:()=>{

            document
            .getElementById("situacion-1")
            .classList.add("activa");

        }

    });


})();

/* ── ACTO VII: cierre — cada frase aparece al llegar a ella ── */
['#cf1','#cf2','#cf3','#cf4','#cf5','#cierreSep','#preguntaFinal','#reflexionFinal','#cierreFirma'].forEach(sel => {
  gsap.to(sel, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: sel,
      start: 'top 80%',
      toggleActions: 'play none none none',
    }
  });
});
/////////////////////////////////////////
