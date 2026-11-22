function VillageLife({player}) {
  const root=React.useRef(null), h=React.createElement;
  React.useEffect(()=>{
    const buttons=[...root.current.querySelectorAll('button')];
    const pets=buttons.map((button,i)=>({button,t:i*2,until:0,near:false}));
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    function pet(p){
      if(!p.near)return;
      p.until=performance.now()+2300;
      p.button.classList.add('nuzzle');
      p.button.lastChild.textContent=p===pets[0]?'呼嚕…':'汪！蹭蹭你';
    }
    pets.forEach(p=>p.button.onclick=()=>pet(p));
    function key(e){if(e.code==='KeyE'&&!e.repeat)pets.filter(p=>p.near).sort((a,b)=>a.distance-b.distance).slice(0,1).forEach(pet);}
    window.addEventListener('keydown',key);
    let last=performance.now(),frame;
    function tick(now){
      frame=requestAnimationFrame(tick);
      if(now-last<30)return;
      const dt=Math.min(.05,(now-last)/1000);last=now;
      pets.forEach((p,i)=>{
        const stride=Math.sin(p.t);
        // The right-hand crop rows slope down toward the river.
        const x=i ? 80+stride*3.5 : 32+stride*7;
        const y=i ? 55+stride*2.8 : 48+Math.sin(p.t*2)*1.6;
        p.distance=Math.hypot(x-player.current.x,y-player.current.y);
        p.near=p.distance<10;
        const happy=p.until>now;
        if(!p.near&&!happy&&!reduced.matches)p.t+=dt*.55;
        const b=p.button;
        b.style.left=x+'%';b.style.top=y+'%';b.disabled=!p.near;
        b.classList.toggle('nuzzle',happy);
        b.firstChild.style.scale=Math.cos(p.t)<0?'-1 1':'1 1';
        b.firstChild.style.backgroundPositionX=((2*i+(!p.near&&!reduced.matches?Math.floor(p.t*12)%2:1))*100/3)+'%';
        const label=p.near?'摸摸 · E':'';
        if(!happy&&b.lastChild.textContent!==label)b.lastChild.textContent=label;
      });
    }
    tick(last);
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',key);};
  },[player]);
  return h('div',{className:'village-life',ref:root},
    h('i',{className:'v-cloud atlas'}),h('i',{className:'v-mill atlas'},h('i',{className:'v-sails atlas'})),
    ...[9,17,28,46,67,81,88].map((x,i)=>h('i',{key:x,className:'v-petal atlas',style:{left:x+'%',animationDelay:(-i*2.7)+'s'}})),
    ...['小貓','小狗'].map(name=>h('button',{key:name,className:'v-pet',disabled:true,'aria-label':'摸摸'+name},h('i',{className:'atlas'}),h('span'))));
}
