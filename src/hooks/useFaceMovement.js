import {useEffect,useState} from 'react';
import {createMovementChallenge,faceObservation} from '../utils/faceMovement';
const idle={status:'idle',steps:[],index:0,progress:0,complete:false,faceReady:false,message:''};
export default function useFaceMovement(videoRef,active,retryKey,mode='basic') {
 const [state,setState]=useState(idle);
 useEffect(()=>{
  if(!active){setState(idle);return;}
  let cancelled=false,frame=0,detector=null,lastAnalysis=0,lastVideoTime=-1;
  const random=new Uint8Array(1);crypto.getRandomValues(random);
  const challenge=createMovementChallenge(mode==='liveness'?'left':random[0]%2?'left':'right',{blink:mode==='liveness'});
  setState({...idle,status:'loading',steps:challenge.steps});
  const base=import.meta.env.BASE_URL;
  (async()=>{
   const {FaceLandmarker,FilesetResolver}=await import('@mediapipe/tasks-vision');if(cancelled)return;
   const files=await FilesetResolver.forVisionTasks(base+'vision/wasm');if(cancelled)return;
   detector=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:base+'vision/face_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numFaces:2,outputFaceBlendshapes:mode==='liveness',minFaceDetectionConfidence:.65,minFacePresenceConfidence:.65,minTrackingConfidence:.65});
   if(cancelled){detector.close();detector=null;return;}
   const loop=now=>{
    if(cancelled)return;
    const video=videoRef.current;
    if(video&&video.readyState>=2&&video.currentTime!==lastVideoTime&&now-lastAnalysis>=100){
     lastAnalysis=now;lastVideoTime=video.currentTime;
     try{const result=detector.detectForVideo(video,now);const next=challenge.update(faceObservation(result),now);setState({...next,sampledAt:now,status:next.complete?'complete':'checking'});}
     catch{setState({...idle,status:'error',message:'Face detection stopped. Retry the movement check.'});return;}
    }
    frame=requestAnimationFrame(loop);
   };
   frame=requestAnimationFrame(loop);
  })().catch(()=>{if(!cancelled)setState({...idle,status:'error',message:'Face detection could not load. Retry the movement check.'});});
  return ()=>{cancelled=true;cancelAnimationFrame(frame);detector?.close();detector=null;};
 },[active,retryKey,videoRef,mode]);
 return state;
}
