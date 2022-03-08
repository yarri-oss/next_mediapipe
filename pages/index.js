import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Script from 'next/script'

import observable from "../components/Observable";

 const PlanckComponent = dynamic(() => import('../components/LandmarkPlanckComponent'), {
  ssr: false,
})

 const cameraLoaded = () => {
  console.log("Got the camera...")

  const videoElement = document.getElementsByClassName('input_video')[0];
  const canvasElement = document.getElementsByClassName('output_canvas')[0];
  const canvasCtx = canvasElement.getContext('2d');
    
  const onResults = (results) => {
    // console.log(results);

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                       {color: '#00FF00', lineWidth: 1});
        drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1});
        console.log(landmarks[0].y);
        observable.notify(landmarks[0].y);

      }
    }
    canvasCtx.restore();
  
  }

  const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }});
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  hands.onResults(onResults);
  
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({image: videoElement});
    },
    width: 128,
    height: 72
  });
  camera.start();
  
 }

  export default function IndexPage() {

   return (
     <div>
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous" 
          onLoad={() => {cameraLoaded()}}
        />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js" crossorigin="anonymous" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous" strategy="beforeInteractive" />
       <h1>Testing PixiJS &amp; Planck Physics</h1>
      <PlanckComponent />
      <video className="input_video" style={{visibility:"hidden"}}></video>
      <canvas className="output_canvas" width="128px" height="72px"></canvas>
       <pre>Using <a href="https://reactpixi.org">react-pixi</a> with NextJS and <a href="https://piqnt.com/planck.js/">Planck.js</a> physics engine.</pre>
     </div>
   )
 }
