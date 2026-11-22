function MapTerrain({ player }) {
  const host = React.useRef(null);
  React.useEffect(() => {
    const mount = host.current;
    if (!window.THREE) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({alpha:true, antialias:true}); }
    catch { return; }
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1,1,1,-1,.1,16);
    const geometry = new THREE.PlaneGeometry(2.32,2.8,90,80);
    const positions = geometry.attributes.position;
    const hill = (x,y,cx,cy,r,h) => h*Math.exp(-((x-cx)**2+(y-cy)**2)/(r*r));
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i), y=positions.getY(i);
      positions.setZ(i,hill(x,y,.88,.75,.32,.38)+hill(x,y,-.85,.52,.34,.22)+hill(x,y,.74,-.6,.45,.12));
    }
    geometry.computeVertexNormals();
    let dirty=true;
    const texture=new THREE.TextureLoader().load(window.mapTextureURL,()=>{dirty=true;});
    texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshLambertMaterial({map:texture});
    const streamTime={value:0};
    material.onBeforeCompile=shader=>{
      shader.uniforms.streamTime=streamTime;
      shader.fragmentShader='uniform float streamTime;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float river = smoothstep(.015,.09,diffuseColor.b-diffuseColor.r)*smoothstep(.01,.08,diffuseColor.g-diffuseColor.r)*(1.-smoothstep(.55,.72,vMapUv.y));
        diffuseColor.rgb += river*.055*pow(.5+.5*sin(vMapUv.y*420.+sin(vMapUv.x*80.)*2.-streamTime*2.5),5.);
      `);
    };
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    scene.add(new THREE.Mesh(geometry,material),new THREE.AmbientLight(0xffffff,1.75));
    const sun=new THREE.DirectionalLight(0xffefd4,1.5);
    sun.position.set(-1,1,2);
    scene.add(sun);
    const resize=new ResizeObserver(()=>{
      const {clientWidth:width,clientHeight:height}=mount;
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5,Math.sqrt(1000000/Math.max(1,width*height))));
      renderer.setSize(width,height,false);
      dirty=true;
    });
    resize.observe(mount);
    let frame, px, py;
    function draw(){
      const {x,y}=player.current;
      const time=Math.floor(performance.now()*.015)/15;
      if(texture.image && (dirty || px!==x || py!==y || (!reduced.matches && time!==streamTime.value))){
        streamTime.value=time;
        camera.position.set((x-50)*.002,-2+(y-50)*.001,3.4);
        camera.lookAt(0,0,0);
        renderer.render(scene,camera);
        px=x;py=y;dirty=false;
      }
      frame=requestAnimationFrame(draw);
    }
    draw();
    return ()=>{cancelAnimationFrame(frame);resize.disconnect();texture.dispose();geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();};
  },[player]);
  return React.createElement('div',{className:'map-terrain','aria-hidden':true,ref:host});
}
