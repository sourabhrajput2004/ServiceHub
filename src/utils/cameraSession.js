export function stopCameraTracks(stream) {stream?.getTracks().forEach(track=>track.stop());}
export function createCameraSession() {
 let generation=0,current=null;
 return {
  getStream:()=>current,
  stop(){generation++;stopCameraTracks(current);current=null;},
  async start(request){
   const attempt=++generation;stopCameraTracks(current);current=null;
   try {const stream=await request();if(attempt!==generation){stopCameraTracks(stream);return null;}current=stream;return stream;}
   catch(error){if(attempt!==generation)return null;throw error;}
  }
 };
}
export async function requestCameraStream(mediaDevices,deviceId='') {
 try {return await mediaDevices.getUserMedia({video:{width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30},...(deviceId?{deviceId:{exact:deviceId}}:{facingMode:{ideal:'user'}})},audio:false});}
 catch(error){if(deviceId||error.name!=='OverconstrainedError')throw error;return mediaDevices.getUserMedia({video:true,audio:false});}
}
export function cameraErrorMessage(error) {
 switch(error?.name){
  case 'NotAllowedError':case 'PermissionDeniedError':return 'Camera permission is blocked. Allow camera access in your browser site settings, then try again.';
  case 'NotFoundError':case 'DevicesNotFoundError':return 'No camera was found. Connect a camera and try again.';
  case 'NotReadableError':case 'TrackStartError':return 'Your camera is busy or unavailable. Close other apps using it, then try again.';
  case 'OverconstrainedError':return 'The camera could not use these settings. Try another camera or browser.';
  case 'SecurityError':return 'Camera access is restricted by your browser or device settings.';
  default:return 'The camera could not start. Check camera access and try again.';
 }
}

export function cameraStreamReady(stream) { return Boolean(stream?.getVideoTracks().some(track=>track.readyState==='live'&&track.enabled&&!track.muted)); }
