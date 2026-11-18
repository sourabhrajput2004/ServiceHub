export const validAttachment=a=>!a||typeof a.image==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(a.image)&&a.image.length<=2400000;
export async function prepareChatImage(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('Choose a JPG, PNG or WebP image up to 5 MB.');
 const url=URL.createObjectURL(file);
 try{const img=new Image();img.src=url;await img.decode();const scale=Math.min(1,1400/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);const result={image:canvas.toDataURL('image/jpeg',0.8),imageName:file.name.slice(0,200)};if(!validAttachment(result))throw Error('Image is too large. Choose a smaller image.');return result;}finally{URL.revokeObjectURL(url);}
}
