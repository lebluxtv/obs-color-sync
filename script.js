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

// ⚙️ Quand le worker renvoie une couleur
worker.onmessage = (event) => {
  const { r, g, b } = event.data;
  preview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  values.textContent = `R: ${r} G: ${g} B: ${b}`;

  if (r !== lastColor.r || g !== lastColor.g || b !== lastColor.b) {
    console.log("📡 Changement détecté → Streamer.bot :", { r, g, b });
    client.doAction({ name: "UpdateGoveeFromCamColor" }, { r, g, b });
    lastColor = { r, g, b };
  }
};

// 🔍 Essaie de détecter automatiquement une caméra OBS
function selectOBSCameraAndStart() {
  navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      const obsCam = videoDevices.find(d => d.label.toLowerCase().includes("obs"));

      const constraints = {
        video: obsCam ? { deviceId: { exact: obsCam.deviceId } } : true
      };

      return navigator.mediaDevices.getUserMedia(constraints);
    })
    .then(stream => {
      video.srcObject = stream;
      video.play();

      const canvas = new OffscreenCanvas(2, 2);
      const ctx = canvas.getContext("2d");

      function captureLoop() {
        if (video.readyState >= 2) {
          try {
            ctx.drawImage(video, 0, 0, 2, 2);
            const imgData = ctx.getImageData(0, 0, 2, 2);
            worker.postMessage(imgData);
          } catch (err) {
            console.error("Erreur lecture image :", err);
          }
        }
        requestAnimationFrame(captureLoop);
      }

      requestAnimationFrame(captureLoop);
    })
    .catch(err => {
      console.error("Erreur caméra :", err);
      alert("⚠️ Accès à la caméra refusé ou OBS non détecté.");
    });
}

// 🔁 Lancement
selectOBSCameraAndStart();
