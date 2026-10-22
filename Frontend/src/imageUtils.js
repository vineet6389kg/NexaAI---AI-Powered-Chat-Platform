// Shrinks an image to max 1024px and turns it into a small JPEG (base64)
export function resizeImage(file, maxSize = 1024) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Please choose an image file."));
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve({ mimeType: "image/jpeg", data: dataUrl.split(",")[1] });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };

    img.src = url;
  });
}