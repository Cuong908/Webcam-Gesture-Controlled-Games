#  Gesture-Controlled Games using TensorFlow.js

<p align="center">
    <img src="https://img.shields.io/badge/JavaScript-yellow?logo=javascript" alt="JavaScript" />
    <img src="https://img.shields.io/badge/TensorFlow.js-orange?logo=tensorflow" alt="TensorFlow.js" />
    <img src="https://img.shields.io/badge/MediaPipe-Hands-blue" alt="MediaPipe"/>
    <a href="https://github.com/Cuong908/Webcam-Gesture-Controlled-Games/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-red" alt="MIT License" /></a>
</p>

This project used TensorFlow.js and MediaPipe Hands to build interactive gestured-controlled games such as AirJuggler and AnimalMatch

<!-- ![Intro Demo](demo.gif) -->

## Installing

### 1. Clone the repository

```
git clone https://github.com/Cuong908/Webcam-Gesture-Controlled-Games
cd Webcam-Gesture-Controlled-Games
```

### 2. Run the program

1. Go to File Explorer
2. Go to the folder Webcam-Gesture-Controlled-Games (or whatever you've changed it to)
3. Click on the `index.html` file

## How to Start

1. **Open the game** - Load `index.html` in a browser (Chrome, Firefox, Edge recommended)
2. **Grant camera permission** - Allow access when prompted
3. **Pick your game** - Load desire game to play

## AirJuggler

<!-- ![Air Juggler Demo](demo.gif) -->

### How to Play

1. **Click "Start Game"** - Wait for the ML model to load (~2-3 seconds)
2. **Move your hands** - Position your hands in front of the camera
3. **Bounce the ball** - Keep the ball in the air by hitting it with your hands!

### Game Rules

- A ball falls due to gravity
- Your hands create invisible "paddles" that bounce the ball upward
- If the ball falls off the bottom of the screen, game over
- Score is based on how long you survive (in seconds)

## AnimalMatch

<!-- ![Animal Match Demo](demo.gif) -->

### How to Play

1. **Click "Start Game"** - Wait for the ML model to load (~2-3 seconds)
2. **Use your fingertip (index or middle finger)** - Position your finger in front of the camera
3. **Pick your card** - Using your fingertip, hover over the desire card

### Game Rules

- 16 cards are randomized and hidden
- Your fingertip picks the card by hovering over it
- Match all the cards to win
- Score is based on number of moves you took

## Browser Compatibility

Requires a modern browser with:

- WebRTC support (for webcam access)
- ES6+ JavaScript support
- HTML5 Canvas support
- WebGL support (for GPU acceleration)

**Tested on:**

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## Technical Stack

- **HTML5 Canvas** - Game rendering
- **JavaScript** - Game logic, hand tracking integration, and canvas rendering
- **TensorFlow.js** - Machine learning framework
- **MediaPipe Hands** - Pre-trained hand detection model

## Performance Notes

- **Detection runs at ~30 FPS** - Good balance of accuracy and performance
- **Rendering runs at 60 FPS** - Smooth visuals
- **Model loading** - First load downloads ~10MB, then cached
- **GPU acceleration** - Automatically used when available

## Troubleshooting

**Camera not working?**

- Ensure you've granted camera permissions
- Check that no other app is using your camera
- Try refreshing the page
- Check browser console for errors

**Model loading slowly?**

- First load downloads the MediaPipe Hands model
- Subsequent loads use browser cache
- Check your internet connection

**Hands not detected?**

- Ensure good lighting conditions
- Keep hands clearly visible to camera
- Try moving closer or adjusting camera angle
- Make sure hands are within the camera frame

**Low FPS/Performance?**

- Close other browser tabs
- Check if GPU acceleration is enabled
- Try using a different browser
- Reduce `maxHands` from 2 to 1 in configuration

## File Structure

```
Webcam-Gesture-Controlled-Games/
├── index.html
├── handTracking.js
├── games/
│   ├── airJuggler.js
│   └── animalMatch.js
└── README.md
```

## Resources

- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [MediaPipe Hands Guide](https://google.github.io/mediapipe/solutions/hands.html)
- [Hand Pose Detection API](https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection)
- [WebRTC getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)

## Credits

Built as part of the [Codédex Project Tutorials](https://www.codedex.io/projects).

## License

MIT License - Feel free to use this code for entertainment, learning, and teaching!