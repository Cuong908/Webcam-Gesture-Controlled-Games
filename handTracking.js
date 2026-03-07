// Hand tracking state
let detector = null;
let video = null;
let isDetecting = false;
let activeGame = null;
let gameCallbacks = {};

// DetectHand failure count
let failureCount = 0;

/**
 * Setup hand tracking with MediaPipe Hands
 * @param {HTMLVideoElement} videoElement - Video element for webcam
 */

function registerGame(gameName, callback) {
  gameCallbacks[gameName] = callback;
}

function setActiveGame(gameName) {
  activeGame = gameName;
}

function resetGame() {
  isDetecting = false;
  activeGame = null;
}

async function setupHandTracking(videoElement) {
  video = videoElement;

  if (detector && video && video.srcObject) {
    return true;
  }

  try {
    // Request webcam access
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 768, height: 512 },
    });

    video.srcObject = stream;
    await video.play();

    // Load MediaPipe Hands model
    const model = window.handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {
      runtime: "mediapipe",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
      maxHands: 2,
      modelType: "full",
    };

    detector = await window.handPoseDetection.createDetector(
      model,
      detectorConfig,
    );

    return true;
  } catch (error) {
    console.error("Error setting up hand tracking:", error);
    alert("Could not access webcam. Please ensure you have granted camera permissions.");
    return false;
  }
}

async function startDetection() {
  if (!detector) {
    console.error("Hand tracking is not initialized");
    await setupHandTracking();

    if (!detector) {
      console.error("Failed to initialize hand tracking. Please refresh.");
      return;
    }

    startDetection();
    return;
  }

  if (!video) {
    console.error("Webcam is not initialized");
    alert("Could not access webcam. Please ensure you have granted camera permissions.");
    return;
  }

  if (!isDetecting) {
    isDetecting = true;
    detectHands();
  }
}


function stopDetection() {
  isDetecting = false;
}

// Detect hands and call sendHandsCallback with positions
async function detectHands() {
  if (!isDetecting) {
    return
  };

  try {
    failureCount = 0;

    const hands = await detector.estimateHands(video);
    const handPositions = hands
      .filter(hand => hand.score > 0.8)
      
      .sort((a, b) => {
        const order = { Right: 0, Left: 1};
        return order[a.handedness] - order[b.handedness];
      })

      .map((hand) => {
        // Get palm center using average of palm base points (0, 5, 9, 13, 17)
        const palmBase = [0, 5, 9, 13, 17].map((i) => hand.keypoints[i]); // Wrist and base of index, middle, ring and pinky fingers
        const avgX = palmBase.reduce((sum, kp) => sum + kp.x, 0) / palmBase.length;
        const avgY = palmBase.reduce((sum, kp) => sum + kp.y, 0) / palmBase.length;

        const fingerTips = [8, 12].map((i) => ({ // Index and middle fingertip
          x: hand.keypoints[i].x,
          y: hand.keypoints[i].y
        }));

        // Finger is extended only if tip is above middle knuckle in the y-axis to prevent accidental clicks
        const indexTip = hand.keypoints[8];
        const indexMiddleKnuckle = hand.keypoints[6];
        const isIndexExtended = indexTip.y < indexMiddleKnuckle.y;

        const middleTip = hand.keypoints[12];
        const middleMiddleKnuckle = hand.keypoints[10];
        const isMiddleExtended = middleTip.y < middleMiddleKnuckle.y;

      return {
        x: 768 - avgX, // Mirror x coordinate to match video flip
        y: avgY,

        handedness: hand.handedness === "Left" ? "Right" : "Left",
        fingerTips: {
          index: isIndexExtended ? { x: 768 - fingerTips[0].x, y: fingerTips[0].y } : null,
          middle: isMiddleExtended ? { x: 768 - fingerTips[1].x, y: fingerTips[1].y } : null,
        }
      };
    });

    // Send hands to the active game's callback
    if (activeGame && gameCallbacks[activeGame]) {
      gameCallbacks[activeGame](handPositions);
    }
  } catch (error) {
    failureCount += 1;
    if (failureCount >= 10) {
      console.error("Error detecting hands:", error);
      await setupHandTracking();
      detectHands();
      return;
    }
  }

  // Continue detection loop (~30 FPS)
  setTimeout(() => detectHands(), 33);
}

// Export functions
window.handTracking = {
  setupHandTracking,
  startDetection,
  stopDetection,
  registerGame,
  setActiveGame,
  resetGame,
};