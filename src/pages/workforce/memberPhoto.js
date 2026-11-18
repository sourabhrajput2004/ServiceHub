export function readMemberPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this photo. Try another file.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('This image could not be opened. Try another photo.'));
      image.onload = () => {
        if(!image.width||!image.height){reject(new Error('Choose a valid image file.'));return;}
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 300;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Could not prepare this photo.'));
          return;
        }
        const scale = Math.max(240 / image.width, 300 / image.height);
        const width = image.width * scale,
          height = image.height * scale;
        context.drawImage(image, (240 - width) / 2, (300 - height) / 2, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
