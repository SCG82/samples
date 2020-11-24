/*
 *  Copyright (c) 2020 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

let counter = 0;
async function run(target, cmd) {
  const id = `result${counter++}`;
  target.postMessage({run: {cmd, id}}, "*");
  return new Promise(r => window.addEventListener("message", function listen({data}) {
    if (!(id in data)) return;
    window.removeEventListener("message", listen);
    r(data[id]);
  }));
}

function startLocalVideo(r1,g1,b1, r2,g2,b2) {
  const whiteNoise = (width, height, r, g, b) => {
    const canvas = Object.assign(document.createElement('canvas'), {width, height});
    const ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, width, height);
    const p = ctx.getImageData(0, 0, width, height);
    const draw = () => {
      for (let i = 0; i < p.data.length; i++) {
        const color = Math.random() * 255;
        p.data[i++] = color * r;
        p.data[i++] = color * g;
        p.data[i++] = color * b;
      }
      ctx.putImageData(p, 0, 0);
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    return canvas.captureStream();
  };
  const localVideo1 = document.getElementById('localVideo1');
  localVideo1.srcObject = whiteNoise(32, 32, r1,g1,b1);
  localVideo1.play();
  const localVideo2 = document.getElementById('localVideo2');
  localVideo2.srcObject = whiteNoise(32, 32, r2,g2,b2);
  localVideo2.play();
}

const politeIframe = document.getElementById("polite");
const impoliteIframe = document.getElementById("impolite");

async function setupIframe(el, polite, r1,g1,b1, r2,g2,b2) {
  el.srcdoc =
    `<html\>
  <body\>
  <p\>${polite ? 'Polite' : 'Impolite'} Peer's iframe</p\>
  <p\>
    <button onclick="(${startLocalVideo.toString()})(${r1},${g1},${b1},${r2},${g2},${b2});"\>Start</button\>
    <button onclick="window.parent.run(window, 'swapTransceivers')"\>Swap Sending Track</button\>
  </p\>
  <p\>
    <video id="localVideo1" autoplay\></video\>
    <video id="localVideo2" autoplay\></video\>
    <video id="remoteVideo" autoplay\></video\>
  </p\>
  </body\>
  <script\>
    (${peer.toString()})(window.parent.document.getElementById("${polite ? 'impolite' : 'polite'}").contentWindow, ${polite});
  </script\>
  <html\>`;
  await new Promise(r => el.onload = r);
}

async function setupIframes() {
  await setupIframe(politeIframe, true, 0,1,0, 0,1,1);
  await setupIframe(impoliteIframe, false, 1,0,0, 1,0,1);
}
setupIframes();

async function swapOnBoth(politeFirst) {
  if (politeFirst) {
    run(politeIframe.contentWindow, "swapTransceivers");
    run(impoliteIframe.contentWindow, "swapTransceivers");
  } else {
    run(impoliteIframe.contentWindow, "swapTransceivers");
    run(politeIframe.contentWindow, "swapTransceivers");
  }
}
