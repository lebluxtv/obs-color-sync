const client = new StreamerbotClient({
  host: "localhost",
  port: 8080,
  autoReconnect: true
});

const video = document.getElementById("video");
const preview = document.getElementById("colorPreview");
const values = document.getElementById("colorValues");

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
canvas.width = 2;
canvas.height = 2;

navigator.mediaDevices.enumerateDevices().then(devices => {
  const obsCam = devices.find(d => d.kind === "videoinput" && d.label.toLowerCase().includes("obs"));
  const constraints = obsCam
    ? { video: { deviceId: { exact: obsCam.deviceId } } }
    : { video: true };

  return navigator.mediaDevices.getUserMedia(constraints);
}).then(stream => {
  video.srcObject = stream;
  video.play();

  setInterval(() => {
    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let r = 0, g = 0, b = 0;
      for (let i = 0; i < imgData.length; i += 4) {
        r += imgData[i];
        g += imgData[i + 1];
        b += imgData[i + 2];
      }

      const pixelCount = imgData.length / 4;
      r = Math.round(r / pixelCount);
      g = Math.round(g / pixelCount);
      b = Math.round(b / pixelCount);

      preview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      values.textContent = `R: ${r} G: ${g} B: ${b}`;

      client.doAction({ name: "UpdateGoveeFromCamColor" }, { r, g, b });
    }
  }, 300);
}).catch(err => {
  console.error("Erreur d’accès à la caméra :", err);
  values.textContent = "⚠️ Caméra non détectée";
});
