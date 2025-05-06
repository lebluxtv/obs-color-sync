onmessage = (e) => {
  const data = e.data.data;
  let r = 0, g = 0, b = 0;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  const count = data.length / 4;
  postMessage({
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count)
  });
};
