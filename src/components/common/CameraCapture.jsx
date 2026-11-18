import React, { useEffect, useRef, useState } from 'react';
import {Camera, RefreshCw, CheckCircle2, ShieldAlert, Video, X, LoaderCircle} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { createCameraSession, requestCameraStream, cameraErrorMessage, cameraStreamReady } from '../../utils/cameraSession';
import '../../styles/camera-capture.css';
import useFaceMovement from '../../hooks/useFaceMovement';

export default function CameraCapture({onCapture,initialImage,movementMode='basic'}) {
 const {tr}=useLanguage();const videoRef=useRef(null);const sessionRef=useRef(null);
 if(!sessionRef.current)sessionRef.current=createCameraSession();
 const [image,setImage]=useState(initialImage||null);const [phase,setPhase]=useState(initialImage?'captured':'idle');const [error,setError]=useState('');
 const [resolution,setResolution]=useState({width:0,height:0});const [movementKey,setMovementKey]=useState(0);
 const movement=useFaceMovement(videoRef,phase==='ready'&&!image,movementKey,movementMode);
 const movementPrompts={blink:'Blink twice when prompted',center:'Look straight at the camera',left:'Slowly turn your face towards the left arrow',right:'Slowly turn your face towards the right arrow'};
 const captureAllowed=movement.complete&&movement.faceReady;
 const [cameras,setCameras]=useState([]);const [selectedCamera,setSelectedCamera]=useState('');
 useEffect(()=>()=>sessionRef.current.stop(),[]);
 const stopCamera=()=>{sessionRef.current.stop();if(videoRef.current)videoRef.current.srcObject=null;setPhase('idle');setError('');};
 const startCamera=async()=>{
  setError('');
  if(!window.isSecureContext){setError('Camera access needs HTTPS or localhost. Open this site using a secure connection.');setPhase('error');return;}
  if(!navigator.mediaDevices?.getUserMedia){setError('Camera access is not available in this browser. Try a browser with camera support.');setPhase('error');return;}
  setResolution({width:0,height:0});setPhase('starting');
  let activeStream;const session=sessionRef.current;
  try {
   const stream=await session.start(()=>requestCameraStream(navigator.mediaDevices,selectedCamera));
   if(!stream)return;activeStream=stream;
   const video=videoRef.current;if(!video){session.stop();return;}
   video.srcObject=stream;
   const track=stream.getVideoTracks()[0];
   try{if(track.getCapabilities?.().focusMode?.includes('continuous'))await track.applyConstraints({advanced:[{focusMode:'continuous'}]});}catch{/* Keep the camera's supported focus mode. */}
   if(session.getStream()!==stream)return;
   stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(session.getStream()!==stream)return;session.stop();setError('Camera disconnected. Reconnect it and try again.');setPhase('error');},{once:true}));
   stream.getVideoTracks().forEach(track=>{
    track.addEventListener('mute',()=>{if(session.getStream()===stream)setPhase('paused');});
    track.addEventListener('unmute',()=>{if(session.getStream()===stream&&video.readyState>=2&&cameraStreamReady(stream))setPhase('ready');});
   });
   navigator.mediaDevices.enumerateDevices?.().then(devices=>{if(session.getStream()!==stream)return;setCameras(devices.filter(device=>device.kind==='videoinput'));setSelectedCamera(stream.getVideoTracks()[0]?.getSettings?.().deviceId||selectedCamera);}).catch(()=>{});
   await video.play();
   if(session.getStream()===stream&&video.readyState>=2&&video.videoWidth>0)setPhase(cameraStreamReady(stream)?'ready':'paused');
  }catch(problem){if(activeStream&&session.getStream()!==activeStream)return;session.stop();setError(cameraErrorMessage(problem));setPhase('error');}
 };
 const capture=()=>{
  const video=videoRef.current;if(phase!=='ready'||!video||video.readyState<2||!video.videoWidth||!cameraStreamReady(sessionRef.current.getStream()))return;
  if(!captureAllowed){setError('Complete the face movement check before capturing.');return;}
  if(performance.now()-movement.sampledAt>500){setError('Wait for a fresh camera frame, then capture again.');return;}
  try {
   const scale=Math.min(1,1920/video.videoWidth);const canvas=document.createElement('canvas');canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
   const context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable');context.drawImage(video,0,0,canvas.width,canvas.height);
   const photo=canvas.toDataURL('image/jpeg',0.92);sessionRef.current.stop();setImage(photo);setPhase('captured');onCapture(photo);
  }catch{setError('The photo could not be captured. Try again.');}
 };
 const retake=()=>{sessionRef.current.stop();setImage(null);setError('');setPhase('idle');onCapture(null);};
 const ready=()=>{const video=videoRef.current;const stream=sessionRef.current.getStream();if(video&&stream&&stream===video.srcObject&&video.videoWidth>0){setResolution({width:video.videoWidth,height:video.videoHeight});setPhase(cameraStreamReady(stream)?'ready':'paused');}};
 return <div className="camera-capture">
  <header className="camera-capture-header"><div><Camera size={23}/><h3>{tr('Camera verification')}</h3></div><span className={'camera-status camera-status-'+phase}>{tr(phase==='captured'?'Photo captured':phase==='ready'?'Camera connected':phase==='paused'?'Camera paused':phase==='starting'?'Starting camera...':'Live camera')}</span></header>
  {cameras.length>1&&!image&&<label className="camera-device-select">{tr('Choose camera')}<select value={selectedCamera} onChange={event=>{stopCamera();setSelectedCamera(event.target.value);}}>{cameras.map((device,index)=><option key={device.deviceId} value={device.deviceId}>{device.label||tr('Camera')+' '+(index+1)}</option>)}</select></label>}
  {phase==='ready'&&<div className="camera-resolution">{tr('Camera resolution')}: {resolution.width} × {resolution.height}</div>}
  <div style={resolution.width?{aspectRatio:resolution.width/resolution.height}:undefined} className={'camera-preview '+(image?'has-photo':'')}>
   {image?<img style={resolution.width?{maxWidth:resolution.width}:undefined} src={image} alt={tr('Captured KYC Snapshot')}/>:<>
    <video ref={videoRef} autoPlay muted playsInline onLoadedData={ready} onCanPlay={ready} style={resolution.width?{maxWidth:resolution.width}:undefined} className={phase==='ready'?'is-ready':''} aria-label={tr('Live camera preview')}/>
    {phase==='ready'?<div className={'camera-guides '+(!movement.complete?'camera-movement-guide':'')} aria-hidden="true"><div className="camera-face-guide"><span>{!movement.complete&&movement.steps[movement.index]==='left'?'← ':!movement.complete&&movement.steps[movement.index]==='right'?'→ ':''}{tr('Your Face Here')}</span></div><div className="camera-card-guide"><span>{tr('Hold Aadhaar Card Here')}</span></div></div>:<div className="camera-empty-state">
     {phase==='starting'?<LoaderCircle className="camera-spinner" size={38}/>:phase==='error'?<ShieldAlert size={38}/>:<Video size={38}/>}
     <h4>{tr(phase==='starting'?'Waiting for camera access':phase==='paused'?'Camera is paused':phase==='error'?'Camera is unavailable':'Turn on your camera')}</h4>
     <p role={phase==='error'?'alert':undefined}>{tr(error||(phase==='paused'?'Check the privacy shutter or camera key on your device, then enable the camera.':phase==='starting'?'Choose Allow when your browser asks for camera access.':'Start your camera and allow access to take the verification photo.'))}</p>
    </div>}
   </>}
  </div>
  {phase==='ready'&&<section className="camera-movement-panel" aria-label={tr('Face movement check')}>
   <div className="camera-movement-instruction" role="status">{tr(movement.status==='loading'?'Loading face detection...':movement.status==='error'?movement.message:movement.message||(movement.complete?'Movement check complete. Hold your ID card beside your face.':movementPrompts[movement.steps[movement.index]]||'Look straight at the camera'))}</div>
   {movement.steps.length>0&&<ol className="camera-movement-steps">{movement.steps.map((step,index)=><li key={index} className={index<movement.index?'is-done':index===movement.index?'is-current':''}><span>{index<movement.index?'✓':index+1}</span>{tr(step==='blink'?'Blink':step==='center'?'Face forward':step==='left'?'Turn left':'Turn right')}</li>)}</ol>}
   {!movement.complete&&movement.status==='checking'&&<div className="camera-movement-progress" aria-hidden="true"><span style={{width:movement.progress*100+'%'}}/></div>}
   {movement.status==='error'&&<button type="button" onClick={()=>setMovementKey(value=>value+1)}>{tr('Retry movement check')}</button>}
   <p>{tr('Movement is checked on this device. This does not verify your identity or ID document.')}</p>
  </section>}
  <div className="camera-capture-footer"><p role="status">{tr(image?'Photo captured. It will be submitted for review.':phase==='ready'?'Ensure good lighting and card text is clearly readable':'Take a clear photo with your face and ID card visible.')}</p><div className="camera-actions">
   {image?<button type="button" onClick={retake}><RefreshCw size={21}/>{tr('Retake Photo')}</button>:phase==='ready'?<><button className="camera-secondary" type="button" onClick={stopCamera}><X size={20}/>{tr('Stop camera')}</button><button type="button" disabled={!captureAllowed} onClick={capture}><Camera size={21}/>{tr('Capture photo')}</button></>:phase==='paused'?<><button type="button" className="camera-secondary" onClick={stopCamera}>{tr('Stop camera')}</button><button type="button" onClick={startCamera}>{tr('Try camera again')}</button></>:phase==='starting'?<button type="button" className="camera-secondary" onClick={stopCamera}>{tr('Cancel')}</button>:<button type="button" onClick={startCamera}>{phase==='error'?<RefreshCw size={21}/>:<Camera size={21}/>} {tr(phase==='error'?'Try camera again':'Start camera')}</button>}
  </div></div>
  {error&&phase==='ready'&&<p className="camera-capture-error" role="alert">{tr(error)}</p>}
 </div>;
}
