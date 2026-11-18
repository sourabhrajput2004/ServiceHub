// Landmark-based movement prompts are a frontend check, not identity matching or certified liveness.
export function faceObservation(result) {
 const faces=(result.faceLandmarks||[]).map((points,faceIndex)=>{
  if(points.length<455)return null;
  const xs=points.map(point=>point.x),ys=points.map(point=>point.y);
  const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
  const centerX=(Math.max(...xs)+Math.min(...xs))/2,centerY=(Math.max(...ys)+Math.min(...ys))/2;
  const a=points[234],b=points[454],nose=points[1];const dx=b.x-a.x,dy=b.y-a.y;
  const denominator=dx*dx+dy*dy;
  const yaw=denominator?((nose.x-(a.x+b.x)/2)*dx+(nose.y-(a.y+b.y)/2)*dy)/denominator:NaN;
  return {faceIndex,width,height,centerX,centerY,yaw,roll:Math.atan2(dy,dx)*180/Math.PI};
 }).filter(face=>face&&face.width>=.16&&face.height>=.2);
 if(faces.length!==1)return {valid:false,count:faces.length,message:faces.length?'Only one person should be in view.':'Move your face into the guide.'};
 const face=faces[0];
 if(face.width>.8||face.height>.94)return {...face,count:1,valid:false,message:'Move a little farther from the camera.'};
 if(face.centerX<.16||face.centerX>.84||face.centerY<.15||face.centerY>.85)return {...face,count:1,valid:false,message:'Keep your face inside the guide.'};
 if(!Number.isFinite(face.yaw)||Math.abs(face.roll)>18)return {...face,count:1,valid:false,message:'Keep your head upright.'};
 const blend=result.faceBlendshapes?.[face.faceIndex]?.categories||[];
 const left=blend.find(item=>item.categoryName==='eyeBlinkLeft')?.score,right=blend.find(item=>item.categoryName==='eyeBlinkRight')?.score;
 return {...face,count:1,valid:true,eyesClosed:left>.5&&right>.5,eyesOpen:left<.3&&right<.3};
}
export function createMovementChallenge(first='left',{blink=false}={}) {
 const steps=['center',...(blink?['blink','blink']:[]),first,first==='left'?'right':'left','center'];
 let index=0,held=0,samples=0,lastTime=null,lastValid=null,blinkAt=null,baseline=0,calibration=[];
 const restart=()=>{index=0;held=0;samples=0;blinkAt=null;baseline=0;calibration=[];};
 return {steps,update(observation,now){
  const delta=lastTime===null?0:now-lastTime;lastTime=now;
  if(!observation.valid){held=0;samples=0;blinkAt=null;if(observation.count>1||(lastValid!==null&&now-lastValid>1500))restart();return {steps,index,complete:index===steps.length,faceReady:false,progress:0,message:observation.message};}
  lastValid=now;
  const target=steps[index]||'center';const yaw=observation.yaw-(index===0?0:baseline);
  if(target==='blink'){
   if(Math.abs(yaw)>.1){blinkAt=null;return {steps,index,complete:false,faceReady:false,progress:0,message:'Look straight at the camera'};}
   if(observation.eyesClosed&&blinkAt===null)blinkAt=now;
   if(blinkAt!==null&&now-blinkAt>1400)blinkAt=null;
   if(observation.eyesOpen&&blinkAt!==null&&now-blinkAt>=60){index++;blinkAt=null;}
   return {steps,index,complete:false,faceReady:false,progress:blinkAt===null?0:.5,message:null};
  }
  const matches=target==='center'?Math.abs(yaw)<.075:target==='left'?yaw>.13&&yaw<.5:yaw<-.13&&yaw>-.5;
  if(index===steps.length)return {steps,index,complete:true,faceReady:matches,progress:1,message:matches?'Movement check complete. Hold your ID card beside your face.':'Face the camera before capturing.'};
  if(matches&&delta>=0&&delta<=500){held+=delta;samples++;if(index===0)calibration.push(observation.yaw);}else{held=0;samples=0;if(index===0)calibration=[];}
  const progress=Math.min(held/600,1);
  if(held>=600&&samples>=4){if(index===0)baseline=calibration.reduce((sum,value)=>sum+value,0)/calibration.length;index++;held=0;samples=0;}
  return {steps,index,complete:index===steps.length,faceReady:index===steps.length&&matches,progress:held?progress:0,message:null};
 }};
}
