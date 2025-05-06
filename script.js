import { StreamerbotClient } from "https://unpkg.com/@streamerbot/client/dist/streamerbot-client.mjs";

const video = document.getElementById("video");
const preview = document.getElementById("colorPreview");
const values = document.getElementById("colorValues");

const client = new StreamerbotClient({
  host: "localhost",
  port: 8080,
  autoReconnect: true
});

const worker = new Worker("worker.js");
let lastColor = { r: -1, g: -1, b: -1 };

worker.onmessage = (event) => {
  const { r, g, b } = event.data;

  const delta =
    Math.abs(r - lastColor.r) +
    Math.abs(g - lastColor.g) +
    Math.abs(b - lastColor.b);

  if (delta > 4) {
    lastColor = { r, g, b };

    preview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    values.textContent = `R: ${r} G: ${g} B: ${b}`;

    client.doAction({ name: "UpdateGoveeFromCamColor" }, { r, g, b });
  }
};

navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const cam = devices.find(d => d.kind === "videoinput" && d.label.toLowerCase().includes("obs"));
    if (!cam) throw new Error("OBS Virtual Cam non trouvée");
    return navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: cam.deviceId } }
    });
  })
  .then(stream => {
    video.srcObject = stream;

    const canvas = new OffscreenCanvas(2, 2);
    const ctx = canvas.getContext("2d");

    setInterval(() => {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, 2, 2);
        const img = ctx.getImageData(0, 0, 2, 2);
        worker.postMessage(img);
      }
    }, 200); // ~5 FPS
  })
  .catch(err => {
    console.error("Caméra non détectée :", err);
    values.textContent = "⚠️ Caméra non détectée";
  });
