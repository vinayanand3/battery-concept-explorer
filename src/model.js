import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import inventory from './inventory.json';

// All values below are authored demonstration parameters in meters.
// No STL geometry, original bounds, positions, weights, or materials are read.
export const MODULES=[[-.65,.30],[-.15,.30],[.35,.30],[.85,.30],[-.65,-.30],[-.15,-.30],[.35,-.30],[.85,-.30],[-1.15,0]];
const palette={Structure:0x94a38b,Modules:0x608155,Cells:0xb9cbc8,Thermal:0x579cab,Electrical:0xd2934f};
const cube=(size,position=[0,0,0])=>new T.BoxGeometry(...size).translate(...position);
function tray(w,h,d){return mergeGeometries([cube([w,.008,d],[0,-h/2,0]),cube([w,h,.008],[0,0,-d/2]),cube([w,h,.008],[0,0,d/2]),cube([.008,h,d],[-w/2,0,0]),cube([.008,h,d],[w/2,0,0])]);}
// Broad stamped-panel features, authored from simple profiles rather than source meshes.
function panel(w,d,thickness){
 const outline=new T.Shape();const points=[[-w/2+.10,-d/2], [w/2-.08,-d/2],[w/2,-d/2+.08],[w/2,d/2-.10],[w/2-.08,d/2],[-w/2+.10,d/2],[-w/2,d/2-.16],[-w/2,-d/2+.16]];
 points.forEach(([x,z],i)=>i?outline.lineTo(x,z):outline.moveTo(x,z));outline.closePath();
 return new T.ExtrudeGeometry(outline,{depth:thickness,bevelEnabled:false}).rotateX(Math.PI/2).toNonIndexed();
}
// The lid underside and enclosure rim share one authored mating height.
const RIM_Y=.245, LID_THICKNESS=.012;
function pressedPad(w,d,h){
 const r=Math.min(.025,w/4,d/4);const shape=new T.Shape();shape.moveTo(-w/2+r,-d/2);shape.lineTo(w/2-r,-d/2);shape.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);shape.lineTo(w/2,d/2-r);shape.quadraticCurveTo(w/2,d/2,w/2-r,d/2);shape.lineTo(-w/2+r,d/2);shape.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);shape.lineTo(-w/2,-d/2+r);shape.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
 return new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelThickness:.006,bevelSize:.014,bevelSegments:3,steps:1,curveSegments:5}).rotateX(-Math.PI/2);
}
function packLid(){
 const shapes=[panel(2.74,1.20,LID_THICKNESS)];
 for(const z of [-.34,.34])for(const x of [-.77,-.16,.45,.99]){
  shapes.push(pressedPad(.42,.30,.008).translate(x,0,z));
  shapes.push(pressedPad(.34,.025,.009).translate(x,.012,z+.075));
 }
 shapes.push(pressedPad(2.38,.085,.014).translate(.01,0,0));
 for(const z of [-.57,.57]){shapes.push(cube([2.48,.006,.022],[0,0,z]));for(let i=0;i<12;i++)shapes.push(new T.CylinderGeometry(.009,.009,.004,10).translate(-1.2+i*.218,.003,z));}
 for(const z of [-.30,.30])for(const angle of [-.6,.6])shapes.push(pressedPad(.30,.025,.006).rotateY(angle).translate(-1.08,.005,z));
 return mergeGeometries(shapes.map(g=>g.index?g.toNonIndexed():g));
}
function packTray(){
 const height=RIM_Y+.025;
 const shapes=[panel(2.74,1.20,.012),tray(2.60,height,1.12).translate(0,height/2,0)];
 for(let i=0;i<10;i++)for(const z of [-.60,.60])shapes.push(cube([.085,.012,.065],[-1.14+i*.25,0,z]));
 return mergeGeometries(shapes.map(g=>g.index?g.toNonIndexed():g));
}
function harness(){
 const tube=points=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal'),48,.006,8,false);
 const shapes=[tube([[-1.23,0,-.12],[-1.1,0,0],[-.8,0,.04],[.65,0,.04],[1.05,0,0],[1.19,0,-.13]])];
 for(const x of [-.78,-.28,.22,.72]){shapes.push(tube([[x,0,.04],[x+.02,0,.10],[x+.02,.014,.20]]));shapes.push(cube([.025,.018,.035],[x+.02,.014,.21]));}
 return mergeGeometries(shapes.map(g=>g.index?g.toNonIndexed():g));
}
function bracket(){return mergeGeometries([cube([.055,.008,.03]),cube([.008,.04,.03],[-.024,.02,0])]);}
function pipe(length,radius=.007){return new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-length/2,0,0),new T.Vector3(0,.02,.035),new T.Vector3(length/2,0,0)]),18,radius,8,false);}
function fan(){const ring=new T.TorusGeometry(.025,.004,8,24);ring.rotateX(Math.PI/2);const blades=[ring,new T.CylinderGeometry(.008,.008,.015,12)];for(let i=0;i<4;i++)blades.push(cube([.038,.006,.009],[.01,0,0]).rotateY(i*Math.PI/2));return mergeGeometries(blades)}
export function buildModel(scene){
 const parts=[],counters=new Map();
 for(const item of inventory){
  const n=item.name.toLowerCase(),path=item.path.join('/').toLowerCase();
  const assembly=n.startsWith('cell module large assembly'),detail=item.group==='Modules'&&!assembly;
  let size=[.035,.018,.025],pos=[0,0,0],geometry,group=item.group,material='Mixed materials, illustrative',role='Represents a small support or interface in this conceptual assembly.',cover=false;
  const family= n==='cell'?'cell':n.includes('interconnect support')?'interconnect support':n.includes('interconnect')?'interconnect':n.includes('terminal')?'terminal':n.includes('flex pcb')?'flex pcb':n.includes('insulation sheet')?'insulation sheet':null;
  const countKey=detail&&family?'detail/'+family:detail?'detail/'+item.path.join('/'):n.includes('pressure relief')?'all relief valves':n.includes('connector')?'all connectors':item.path.slice(0,2).join('/');
  const k=counters.get(countKey)||0;counters.set(countKey,k+1);
  if(assembly){const m=Number(n.match(/(\d+)$/)[1]);const [x,z]=MODULES[m];pos=[x,.076,z];geometry=tray(.455,.16,.46);cover=true;role='Simplified module shell. Cells are separate, selectable layers.';material='Aluminum, illustrative';}
  else if(detail){
   const [x,z]=MODULES[0];pos=[x,.08,z];
   if(n==='cell'){geometry=new T.CylinderGeometry(.007,.007,.07,20);pos=[x-.18,.23,z+.24];role='Standalone conceptual cell reference, shown separately from the instanced cell layers. Illustrative 14 × 70 mm, not measured source geometry.';material='Mixed cell materials, unspecified chemistry';cover=true;}
   else if(n.includes('separator')){size=[.40,.064,.004];pos=[x,k<5?.12:.04,z+(k%5-2)*.058];material='Insulating polymer, illustrative';role='Keeps adjacent cell groups separated.';}
   else if(n.includes('interconnect support')){size=[.41,.005,.29];pos=[x,k%2?.161:.002,z];material='Insulating polymer, illustrative';cover=true;role='Supports the current collector without conducting current.';}
   else if(n.includes('interconnect')){size=[.38,.003,.01];pos=[x,k<8?.16:.002,z+((k%8)-3.5)*.037];material='Copper, illustrative';role='Symbolic cell current collector; circuit topology is not specified.';}
   else if(n.includes('cooling')){size=[.435,.006,.34];pos=[x,.081,z];group='Thermal';material='Aluminum, illustrative';role='Represents heat transfer to a central cooling interface.';}
   else if(n.includes('side cover')){size=[.008,.15,.075];pos=[x+(path.includes('side cover 2')?.223:-.223),.08,z+(k-1.5)*.09];cover=true;material='Insulating polymer, illustrative';role='Protective side covering.';}
   else if(n.startsWith('top')||n.includes('insulation sheet')){size=[.43,.004,.34];pos=[x,n.includes('insulation')?(k%2?.177:-.017):(k%2?.166:-.008),z];cover=true;material='Insulating sheet, illustrative';role='Illustrates electrical insulation around the cell layers.';}
   else if(n.includes('end plate')){size=[.44,.17,.012];pos=[x,.08,z+(k%2?.225:-.225)];material='Aluminum, illustrative';role='Constrains the ends of the module.';}
   else if(n.includes('flex pcb')){size=[.018,.002,.29];pos=[x+(k%2?.2:-.2),.163,z];material='Flexible circuit, illustrative';role='Represents cell voltage-sensing connections.';}
   else if(path.includes('module control')){size=n==='cover'?[.07,.006,.045]:[.065,.004,.04];pos=[x+.17,n==='cover'?.194:.181,z+.2];cover=n==='cover';material='Circuit board / polymer, illustrative';role='Represents local monitoring electronics.';}
   else if(n.includes('terminal')){size=[.04,.012,.027];pos=[x+(k%2?.17:-.17),.165,z-.20];material='Copper, illustrative';role='Module electrical terminal.';}
   else if(n.includes('harness')){geometry=pipe(.3,.003);pos=[x,.17,z-.19];material='Insulated conductors, illustrative';role='Symbolic signal wiring.';}
   else if(n.includes('thermal paste')){size=[.04,.001,.04];pos=[x,.175,z+.19];material='Thermal interface, illustrative';role='Represents a thermal interface pad.';}
   else if(n.includes('sensor')){size=[.018,.008,.018];pos=[x,.165,z];role='Symbolic module temperature sensor.';}
   else {geometry=bracket();pos=[x,.17,z+.18];role='Module mechanical support.';}
  } else if(item.group==='Structure'){
   if(n==='enclosure bottom'){geometry=packTray();pos=[-.12,-.025,0];material='Aluminum, illustrative';role='Protective pack enclosure with perimeter walls.';}
   else if(n==='enclosure top'||n.includes('insulator-shield')){geometry=n==='enclosure top'?packLid():panel(2.67,1.12,.004);pos=[-.12,n==='enclosure top'?RIM_Y+LID_THICKNESS:RIM_Y-.006,0];cover=true;role='Upper pack protection and insulation.';}
   else if(n==='second enclosure bottom'){geometry=tray(.4,.06,.4);pos=[-1.15,-.005,0];role='Secondary module support pan.';}
   else if(n.includes('hose')){geometry=pipe(2.25,.01);pos=[-.05,.02,k%2?.53:-.53];group='Thermal';role='Conceptual coolant manifold route.';material='Elastomer hose, illustrative';}
   else if(n.includes('quick disconnect')){geometry=bracket();pos=[-.85+k*.5,.04,.53];group='Thermal';role='Supports a coolant connection.';}
   else if(n.includes('pressure')){geometry=new T.CylinderGeometry(.017,.017,.012,16);geometry.rotateX(Math.PI/2);pos=[-.95+k*.18,.07,path.includes('relief')?-.601:.601];role='Illustrates a pressure vent or relief device.';}
   else if(n.includes('center')){size=[.018,.14,1.05];pos=[-.4+k*.5,.045,0];role='Internal structural cross-member.';}
   else if(n.includes('shield')){size=[.85,.006,1.15];pos=[-1+k*.87,-.045,0];role='Underbody protective shield.';}
   else if(n.includes('insulation')){size=[.40,.003,.44];pos=[-.65+(k%4)*.5,-.02-Math.floor(k/4)*.006,k%2?.3:-.3];material='Insulating sheet, illustrative';role='Separates conductive enclosure surfaces from components.';}
   else if(n.includes('access panel')){size=[.12,.008,.11];pos=[-1.24+k*.15,RIM_Y+LID_THICKNESS+.009,.45];cover=true;role='Conceptual access opening cover.';}
   else{geometry=bracket();pos=[-.9+k*.55,.03,k%2?.58:-.58];role='Pack mounting bracket.';}
  } else {
   const relay=path.includes('relay box'),secondary=path.includes('2nd relay'),bms=path.includes('bms master'),fuse=path.startsWith('electrical parts/fuse');
   const anchor=relay?[secondary?.35:-.45,0]:bms?[.9,0]:fuse?[-1.2,.43]:null;
   if(anchor){const [x,z]=anchor;pos=[x+(k%5-2)*.042,.06+Math.floor(k/5)*.018,z+(k%3-1)*.035];
    if(n.includes('housing')||n.includes('box cover')){geometry=tray(bms?.18:.29,.075,.18);pos=[x,n.includes('box cover')?.21:n.includes('top')||n.includes('cover')?.19:.045,z];cover=n.includes('top')||n.includes('cover');role='Electrical enclosure.';material='Polymer, illustrative';}
    else if(n.includes('protection')){size=[.06,.008,.026];material='Insulating polymer, illustrative';role='Insulating protection over a conductor.';}
    else if(n.includes('support')||n.includes('bracket')){geometry=bracket();role='Mechanical support within the electrical assembly.';}
    else if(n.includes('harness')||n.includes('cable')||n.includes('to precharge')){geometry=pipe(.09,.0025);role='Symbolic local wiring connection.';}
    else if(n.includes('busbar')){size=[.055,.004,.015];role='Short electrical distribution bar.';material='Copper, illustrative';}
    else if(n.includes('pcb')||n.includes('circuit board')){size=[.07,.003,.055];role='Represents monitoring or control circuitry.';material='Circuit board, illustrative';}
    else if(n.includes('fan')){geometry=fan();role='Symbolic electronics ventilation fan.';}
    else if(n.includes('harness')||n.includes('cable')||n.includes('to precharge')){geometry=pipe(.09,.0025);role='Symbolic local wiring connection.';}
    else if(n.includes('support')||n.includes('bracket')){geometry=bracket();role='Mechanical support within the electrical assembly.';}
    else if(n.includes('relay')||n.includes('contactor')){size=[.035,.038,.035];role='Symbolic controlled switching device, not a functioning circuit.';}
    else if(n.includes('fuse')||n.includes('resistor')){geometry=new T.CylinderGeometry(.007,.007,.037,12);geometry.rotateZ(Math.PI/2);role='Symbolic protection or precharge component.';}
    else if(n.includes('pad')||n.includes('paste')){size=[.04,.002,.035];role='Thermal interface pad.';}
    else if(n.includes('cover')){size=[.06,.004,.05];cover=true;role='Electrical protection cover.';}
    else if(n.includes('sensor')){size=[.015,.014,.018];role='Symbolic sensing element.';}
   }else if(path.includes('hv busbars')){pos=[-.95+k*.085,.17,0];if(n.includes('bracket')){geometry=bracket();role='HV busbar mounting support.';}else{geometry=mergeGeometries([cube([.07,.004,.025]),cube([.025,.004,.08],[.025,0,.045])]);role='Symbolic pack-level current distribution link.';material='Copper, illustrative';}}
   else if(n.includes('harness')){geometry=harness();pos=[-.1,.178+Math.floor(k/2)*.025,k%2?.32:-.49];role='Branched pack monitoring harness with a perimeter trunk, module drops, and connector ends.';}
   else if(n.includes('connector')){pos=[1.265,.055+Math.floor(k/10)*.05,-.44+(k%10)*.085];geometry=n.includes('support')?bracket():new T.CylinderGeometry(.015,.015,.04,12).rotateZ(Math.PI/2);role='Conceptual HV connection interface.';material='Polymer and conductor, illustrative';}
  }
  if(role==='Represents a small support or interface in this conceptual assembly.')throw new Error('Missing conceptual definition: '+item.key+' '+item.name);
  geometry=geometry||cube(size);geometry.computeBoundingBox();
  const dimensions=geometry.boundingBox.getSize(new T.Vector3()).toArray();
  const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:palette[group],metalness:group==='Electrical'?.35:.15,roughness:.5}));mesh.position.set(...pos);scene.add(mesh);
  const p={...item,group,hierarchy:[item.group,...item.path],mesh,dimensions,base:mesh.position.clone(),offset:new T.Vector3(pos[0]*.22,cover?.75:detail?.3+((k%4)*.07):group==='Electrical'?.5:group==='Thermal'?-.18:-.25,pos[2]*.4),description:role,material,cover,detail,assembly,visible:!cover};mesh.userData.part=p;mesh.visible=p.visible;parts.push(p);
 }
 const cellGeometry=new T.CylinderGeometry(.007,.007,.07,12);
 MODULES.forEach(([x,z],m)=>{for(let layer=0;layer<2;layer++){const mesh=new T.InstancedMesh(cellGeometry,new T.MeshStandardMaterial({color:palette.Cells,roughness:.4,metalness:.4}),432);const dummy=new T.Object3D();let i=0;for(let r=0;r<18;r++)for(let c=0;c<24;c++){dummy.position.set((c-11.5)*.015+(r%2)*.0075,layer?.121:.043,(r-8.5)*.013);dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix)}mesh.position.set(x,0,z);mesh.computeBoundingBox();mesh.computeBoundingSphere();scene.add(mesh);const p={key:`cells-${m}-${layer}`,name:`Module ${m+1} ${layer?'upper':'lower'} cells`,group:'Cells',hierarchy:['Cells',`Module ${m+1}`],mesh,dimensions:[.367,.07,.235],base:mesh.position.clone(),offset:new T.Vector3(x*.22,layer?.62:-.10,z*.4),description:'432 generic cylinders in a 24 × 18 staggered layer. Authored 14 × 70 mm envelope; no source cell geometry.',material:'Mixed cell materials, unspecified chemistry',detail:m===0,visible:true};mesh.userData.part=p;parts.push(p)}});
 // Assign ordered vertical bands using geometry bounds. Related parts keep their
 // assembly X/Z positions; a gap separates every band at full explosion.
 const bands=new Map();
 for(const p of parts){
  const n=p.name.toLowerCase();let band;
  if(n==='enclosure top')band=100;
  else if(n.includes('insulator-shield'))band=95;
  else if(n.includes('access panel'))band=105;
  else if(n==='enclosure bottom')band=0;
  else if(p.group==='Structure')band=n.includes('shield')?-20:n.includes('insulation')?-10:5;
  else if(p.group==='Thermal')band=10;
  else if(p.group==='Cells')band=p.name.includes('upper')?40:20;
  else if(p.assembly)band=30;
  else if(p.detail){band= p.base.y<.08?25:45; if(p.cover)band=60;}
  else if(n.includes('harness'))band=70;
  else band=p.cover?85:75;
  if(!bands.has(band))bands.set(band,[]);bands.get(band).push(p);
 }
 let bottom=-.45;
 for(const [band,items] of [...bands].sort((a,b)=>a[0]-b[0])){
  const bounds=items.map(p=>new T.Box3().setFromObject(p.mesh));
  const min=Math.min(...bounds.map(b=>b.min.y)),max=Math.max(...bounds.map(b=>b.max.y));
  for(const p of items)p.offset.set(p.base.x*.18,bottom-min,p.base.z*.35);
  bottom+=max-min+.12;
 }
 return parts;
}
