(function() {
  const config = {
    ballCount: 1,
    ballRadius: 20,
    gravity: 0.2,
    bounceVelocity: -8,
    handRadius: 50,
    countdownTime: 3,
  };

  let gameState = {
    balls: [],
    hands: [],
    score: 0,
    gameOver: false,
    startTime: null,
    animationId: null,
    countdown: 0,
    isCountingDown: false,
    isActive: false,
  };

  const canvas = document.getElementById("gameCanvas-airJ");
  const ctx = canvas.getContext("2d");
  const webcam = document.getElementById("webcam-airJ");

  const overlay = document.getElementById("overlay-airJ");
  const startButton = document.getElementById("startButton-airJ");
  const overlayMessage = document.getElementById("overlayMessage-airJ");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingStatus = document.getElementById("loadingStatus");

  // Raw element stays hidden since video feed is drawn to canvas instead
  webcam.style.display = "none";

  window.handTracking.registerGame("airJuggler", function receiveHands(hands) {
    if (gameState.isActive) {
      gameState.hands = hands;
    }
  });

  document.getElementById("AirJugglerGame").addEventListener("resetGame", function() {
    if (gameState.animationId) {
      cancelAnimationFrame(gameState.animationId);
    }

    gameState.isActive = false;
    gameState.balls = [];

    canvas.closest(".canvasWrapper").style.visibility = "hidden";
    overlayMessage.innerHTML = "Ready to Play?";
    
    render();
  })

  function initBalls() {
    gameState.balls = [];
    for (let i = 0; i < config.ballCount; i++) {
      gameState.balls.push({
        x: canvas.width / 2,
        y: 100,
        vx: 0,
        vy: 0,
        radius: config.ballRadius,
        color: `hsl(${i * 120}, 70%, 60%)`,
      });
    }
  }

  function updateBalls() {
    gameState.balls.forEach((ball) => {
      ball.vy += config.gravity;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Reverse horizontal direction when collided with left/right wall
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.vx *= -1;
        ball.x =
          ball.x < canvas.width / 2 ? ball.radius : canvas.width - ball.radius;
      }

      // Reverse vertical direction when collided with ceiling
      if (ball.y - ball.radius < 0) {
        ball.vy *= -1;
        ball.y = ball.radius;
      }
    });
  }

  function checkCollisions() {
    gameState.balls.forEach((ball) => {
      gameState.hands.forEach((hand) => {
        const dx = ball.x - hand.x;
        const dy = ball.y - hand.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ball.radius + config.handRadius) {
          ball.vy = config.bounceVelocity;
          ball.vx += dx * 0.1;

          // Bounce the ball when collided with the outside hand radius to prevent sticking
          const angle = Math.atan2(dy, dx);
          ball.x = hand.x + Math.cos(angle) * (ball.radius + config.handRadius);
          ball.y = hand.y + Math.sin(angle) * (ball.radius + config.handRadius);
        }
      });
    });
  }

  function checkGameOver() {
    return gameState.balls.some((ball) => ball.y - ball.radius > canvas.height);
  }

  function updateScore() {
    if (gameState.startTime && !gameState.gameOver) {
      gameState.score = Math.floor((Date.now() - gameState.startTime) / 1000);
      const scoreDisplay = document.getElementById("score");
      if (scoreDisplay) {
        scoreDisplay.textContent = gameState.score
      };
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mirror webcam feed horizontally to match the correct hand movement
    if (gameState.isActive && webcam && webcam.srcObject && webcam.readyState === webcam.HAVE_ENOUGH_DATA) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(webcam, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw balls only if game is active
    if (gameState.isActive) {
      gameState.balls.forEach((ball) => {
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // Draw hand zones around each tracked hand
    gameState.hands.forEach((hand, index) => {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(hand.x, hand.y, config.handRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(100, 200, 255, 0.3)";
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(hand.x, hand.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(hand.handedness || `Hand ${index + 1}`, hand.x, hand.y - config.handRadius - 10);
    });

    // Draw countdown
    if (gameState.isActive && gameState.isCountingDown) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "bold 72px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(Math.ceil(gameState.countdown), canvas.width / 2, canvas.height / 2);
      ctx.font = "bold 24px Arial";
      ctx.fillText("Get Ready!", canvas.width / 2, canvas.height / 2 + 60);
    }
  }

  function gameLoop() {
    if (!gameState.isActive || gameState.gameOver) {
      return;
    }

    if (gameState.isCountingDown) {
      gameState.countdown -= 1 / 60;
      if (gameState.countdown <= 0) {
        gameState.isCountingDown = false;
        gameState.startTime = Date.now();
      }
    } else {
      updateBalls();
      checkCollisions();
      updateScore();

      if (checkGameOver()) {
        endGame();
        return;
      }
    }

    gameState.animationId = requestAnimationFrame(gameLoop);
  }

  // Start game
  async function startGame() {
    if (gameState.animationId) {
      cancelAnimationFrame(gameState.animationId);
    }

    // Set this as the active game
    window.handTracking.setActiveGame("airJuggler");

    // Reset game state completely for a fresh start
    gameState = {
      balls: [],
      hands: [],
      score: 0,
      gameOver: false,
      startTime: null,
      animationId: null,
      countdown: config.countdownTime,
      isCountingDown: true,
      isActive: true,
    };

    initBalls();

    // Initialize hand tracking if not already done
    if (!window.handTrackingInitialized) {
        loadingOverlay.classList.remove("hidden");
        loadingStatus.textContent = "Requesting camera access...";

        const success = await window.handTracking.setupHandTracking(webcam);

        loadingOverlay.classList.add("hidden");

        if (!success) {
            endGame();
            overlayMessage.textContent = "Camera access required to play!";
            return;
        }

        window.handTrackingInitialized = true;
    } else {
        // Resign stream to this game's video element when switching games
        loadingOverlay.classList.remove("hidden");
        loadingStatus.textContent = "Switching camera...";

        await window.handTracking.setupHandTracking(webcam);

        loadingOverlay.classList.add("hidden");
    }

    // Always restart detection since resetGame() (game switch) stopped it
    window.handTracking.startDetection();

    overlay.classList.add("hidden");
    canvas.closest(".canvasWrapper").style.visibility = "visible";
    gameLoop();
  }

  function endGame() {
    gameState.gameOver = true;
    gameState.isActive = false;
    gameState.hands = [];
    gameState.balls = [];
    cancelAnimationFrame(gameState.animationId);

    canvas.closest(".canvasWrapper").style.visibility = "hidden";

    const emoji = gameState.score > 15 ? "🎉" : "💪";
    overlayMessage.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 0.5rem;">${emoji}</div>
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">Game Over!</div>
      <div style="font-size: 1.2rem;">You survived ${gameState.score} seconds</div>
    `;
    startButton.textContent = "Play Again";
    overlay.classList.remove("hidden");
  }

  if (startButton) {
    startButton.addEventListener("click", startGame);
  } else {
    console.error("Air Juggler startButton not found!");
  }

  // Check if TensorFlow.js is loaded before allowing user to play
  function checkTensorFlowLoaded() {
    if (typeof tf !== "undefined" && typeof handPoseDetection !== "undefined") {
      loadingOverlay.classList.add("hidden");
    } else {
      setTimeout(checkTensorFlowLoaded, 100);
    }
  }

  // Start checking once DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkTensorFlowLoaded);
  } else {
    checkTensorFlowLoaded();
  }

  window.startAirjuggler = startGame;

  // Runs independently from gameLoop to keep canvas updated on the start and end screens
  function renderLoop() {
      render();
      requestAnimationFrame(renderLoop);
  }

  renderLoop();
})();