/* animaciones Acto V al entrar */
ScrollTrigger.create({
trigger: '#p-franquicias',
start: 'top 60%',
onEnter: () => {
    gsap.to('#franqIntro',    { opacity:1, y:0, duration:1, ease:'power2.out' });
    gsap.to('#franqSub',      { opacity:1, duration:0.8, delay:0.3 });
    gsap.to('#franqTarjetas', { opacity:1, y:0, duration:0.9, delay:0.5, ease:'power2.out' });
},
onLeaveBack: () => {
    gsap.to('#franqIntro',    { opacity:0, y:16, duration:0.3 });
    gsap.to('#franqSub',      { opacity:0, duration:0.3 });
    gsap.to('#franqTarjetas', { opacity:0, y:20, duration:0.3 });
}
});