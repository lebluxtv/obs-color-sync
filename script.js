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

// ⬇️ Fonction principale pour détecter la bonne caméra OBS
async function setupCamera() {
  try {
    // Étape 1 : forcer un accès général pour débloquer les labels
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
    tempStream.getTracks().forEach(track => track.stop()); // On ferme ce flux

    // Étape 2 : détecter la caméra OBS dans la liste
    const devices = await navigator.mediaDevices.enumerateDevices();
    const obsCam = devices.find(d =>
      d.kind === "videoinput" && d.label.toLowerCase().includes("obs")
    );

    if (!obsCam) throw new Error("Caméra OBS non détectée");

    // Étape 3 : ouvrir un flux uniquement sur OBS
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: obsCam.deviceId } }
    });

    video.srcObject = stream;
    video.play();

    // Utilise OffscreenCanvas pour la performance
    const canvas = new OffscreenCanvas(2, 2);
    const ctx = canvas.getContext("2d");

    function loop() {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, 2, 2);
        const img = ctx.getImageData(0, 0, 2, 2);
        worker.postMessage(img);
      }
      requestAnimationFrame(loop);
    }

    loop();
  } catch (err) {
    console.error("Erreur d’accès caméra :", err);
    values.textContent = "⚠️ Caméra non détectée";
  }
}

// Réception des couleurs traitées depuis le worker
worker.onmessage = (event) => {
  const { r, g, b } = event.data;

  preview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  values.textContent = `R: ${r} G: ${g} B: ${b}`;

  if (r !== lastColor.r || g !== lastColor.g || b !== lastColor.b) {
    client.doAction({ name: "UpdateGoveeFromCamColor" }, { r, g, b });
    lastColor = { r, g, b };
  }
};

// Lance la capture
setupCamera();
