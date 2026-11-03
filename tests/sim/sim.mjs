// Mô phỏng vòng lặp thế giới (world.js) với three.js GIẢ: ngồi, thiền, lạy, đứng dậy. Chạy bởi tests/worldsim.test.mjs.
const mkEl=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='getContext'?()=>new Proxy({}, {get:()=>()=>({addColorStop(){}})}):k==='appendChild'?()=>{}:k==='addEventListener'?()=>{}:k==='setAttribute'?()=>{}:k==='getBoundingClientRect'?()=>({left:0,top:0,width:1,height:1}):k==='width'||k==='height'?0:undefined,set:()=>true,apply:()=>undefined});
globalThis.document={createElement:mkEl,head:{appendChild(){}},body:{appendChild(){}}};
globalThis.localStorage={getItem:()=>null,setItem(){}};
globalThis.addEventListener=()=>{}; globalThis.innerWidth=1280; globalThis.innerHeight=720;
globalThis.performance=globalThis.performance||{now:()=>Date.now()};
const { createWorld } = await import('../../js/world/world.js');
const { SEATS, SEAT_Y } = await import('../../js/world/seats.js');
const { HALL } = await import('../../js/world/layout.js');
const LGT={ panelOpen:false };
const canvas=Object.assign(mkEl(),{addEventListener(){}});
const camera={position:{set(){}},lookAt(){}};
const w=createWorld({scene:{add(){},remove(){}},camera,canvas,coarse:false,LGT});
const run=(sec)=>{for(let i=0;i<sec*60;i++) w.update(1/60)};
const log=()=>{};
const out={};
// 1. lạy khi đang ở sân → 'outside'
out.bowOutside=w.bow(); log('bow ngoài sân');
// 2. đi vào chánh điện rồi lạy
w.walkTo(2.1,-20.8); run(40); log('vào chánh điện');
out.bowIn=w.bow(); run(1); out.modeBowing=LGT.world.mode; run(4); out.afterBow=LGT.world.mode; log('sau lạy');
// 3. ngồi vào bồ đoàn bd10
out.sit=w.sit('bd10'); run(12); out.seated=LGT.world.mode; log('đã ngồi bd10'); const s=SEATS.find(q=>q.id==='bd10'); out.seatPosOK=Math.hypot(LGT.world.pos.x-s.x,LGT.world.pos.z-s.z)<0.05; out.yOK=Math.abs(LGT.world.pos.y-SEAT_Y)<0.05;
// 4. thiền (đang ngồi)
out.med=w.meditate(); out.medMode=LGT.world.mode;
// 5. đứng dậy
w.stand(); run(1); out.afterStand=LGT.world.mode; log('sau đứng dậy'); out.standY=+LGT.world.pos.y.toFixed(2);
// 6. thiền khi đang đứng trong hall → tự tìm bồ đoàn
out.med2=w.meditate(); run(15); out.med2mode=LGT.world.mode; log('thiền tự chọn chỗ');
// 7. đi chỗ khác khi đang ngồi → đứng dậy
w.walkTo(0,-18); run(10); out.afterWalk=LGT.world.mode; log('đi chỗ khác');
// 8. bấm Chánh điện (goTo) khi đang ngồi lần nữa
w.meditate(); run(15); const seatedAgain=LGT.world.mode; w.goTo('temple'); out.goToStands=[seatedAgain, LGT.world.mode];
// 9. tụng kinh / tràng hạt (Phiên 14b)
w.stand(); run(1); w.walkTo(3.2,-1); run(60); out.chantOutside=w.chant();
w.walkTo(2.1,-20.8); run(40); out.chantGo=w.chant(); run(15); out.chantMode=LGT.world.mode; out.chantState=w.avatar&&1;
out.toBeads=w.beads(); out.beadsMode=LGT.world.mode; out.rest=w.rest(); out.restMode=LGT.world.mode;
w.chant(); out.chant2=LGT.world.mode; w.stand(); run(1); out.chantStand=LGT.world.mode;
console.log(JSON.stringify(out));
