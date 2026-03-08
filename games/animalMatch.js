(function() {
    const config = {
        rows: 4,
        columns: 4,
        cardWidth: 90,
        cardHeight: 100,
        padding: 10,
        countdownTime: 3,
        HOVER_DWELL_MS: 800,
    }

    let gameState = {
        cards: [],
        hands: [],
        selectedCard: null,
        canSelect: true,
        matchedPairs: 0,
        moves: 0,
        gameOver: false,
        startTime: null,
        animationId: null,
        countdown: 0,
        isCountingDown: false,
        isActive: false,
        hoverCard: null,
        hoverStartTime: null,
    };

    const symbols = ["🐶", "🐻", "🐭", "🐰", "🐷", "🦊", "🐯", "🐱"]

    const canvas = document.getElementById("gameCanvas-animalM");
    const ctx = canvas.getContext("2d");
    const webcam = document.getElementById("webcam-animalM");

    const overlay = document.getElementById("overlay-animalM");
    const startButton = document.getElementById("startButton-animalM");
    const overlayMessage = document.getElementById("overlayMessage-animalM");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const loadingStatus = document.getElementById("loadingStatus");

    // Raw element stays hidden since video feed is drawn to canvas instea
    webcam.style.display = "none";

    window.handTracking.registerGame("animalMatch", function receiveHands(hands) {
        if (gameState.isActive) {
            gameState.hands = hands;
        }
    });

    document.getElementById("AnimalMatchGame").addEventListener("resetGame", function() {
        console.log("AnimalMatch reset triggered");
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }

        gameState.isActive = false;
        gameState.cards = [];

        canvas.closest(".canvasWrapper").style.visibility = "hidden";
        overlayMessage.innerHTML = "Ready to Play?";

        render();
    });

    function initCards() {
        gameState.cards = [];
        const pairs = [...symbols, ...symbols];

        // Fisher-Yates shuffle for random card placement
        for (let i = pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }

        let index = 0;
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.columns; col++) {
                gameState.cards.push({
                    id: index,
                    symbol: pairs[index],
                    x: col * (config.cardWidth + config.padding) + Math.floor((768 - (config.columns * config.cardWidth + (config.columns - 1) * config.padding)) / 2),
                    y: row * (config.cardHeight + config.padding) + Math.floor((512 - (config.rows * config.cardHeight + (config.rows - 1) * config.padding)) / 2),
                    width: config.cardWidth,
                    height: config.cardHeight,
                    isFlipped: false,
                    isMatched: false
                });
                index++;
            }
        }
    }

    // Returns the card under the fingertip (if none, then null)
    function checkCardSelection(hand) {
        if (!gameState.canSelect || !hand) return null;

        const fingertip = hand.fingerTips?.index;
        if (!fingertip) return null;

        const x = fingertip.x;
        const y = fingertip.y;

        for (let card of gameState.cards) {
            if (card.isMatched) continue;

            if (x > card.x && x < card.x + card.width && y > card.y && y < card.y + card.height) {
                return card;
            }
        }
        return null;
    }

    function handleCardSelection(card) {
        if (!card || card.isMatched || card.isFlipped) return;

        gameState.moves++;
        const moveDisplay = document.getElementById("move");
        if (moveDisplay) {
            moveDisplay.textContent = gameState.moves
        };
        
        card.isFlipped = true;

        if (!gameState.selectedCard) {
            gameState.selectedCard = card;
            return;
        }
        
        gameState.canSelect = false;
        
        // Delay before flipping unmatched cards back so players have time to see them
        setTimeout(() => {
            const firstCard = gameState.selectedCard;
            const secondCard = card;

            if (firstCard.symbol === secondCard.symbol) {
                firstCard.isMatched = true;
                secondCard.isMatched = true;
                gameState.matchedPairs++;
                
                const matchDisplay = document.getElementById("pairs");
                if (matchDisplay) {
                    matchDisplay.textContent = `${gameState.matchedPairs}/${symbols.length}`;
                }

                if (gameState.matchedPairs === symbols.length) {
                    endGame(true);
                }
            } else {
                firstCard.isFlipped = false;
                secondCard.isFlipped = false;
            }

            gameState.selectedCard = null;
            gameState.canSelect = true;
        }, 800);
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Mirror webcam feed horizontally to match the correct movement
        if (gameState.isActive && webcam && webcam.srcObject && webcam.readyState === webcam.HAVE_ENOUGH_DATA) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(webcam, -canvas.width, 0, canvas.width, canvas.height);
            ctx.restore();
            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw cards
        gameState.cards.forEach(card => {
            if (card.isMatched) ctx.globalAlpha = 0.5;
            
            // Highlight the card that's currently being hovered
            const isHovered = gameState.hoverCard?.id === card.id;

            if (card.isFlipped || card.isMatched) {
                ctx.fillStyle = isHovered ? '#eaffd0' : 'white';
                ctx.fillRect(card.x, card.y, card.width, card.height);
                ctx.strokeStyle = '#27ae60';
                ctx.lineWidth = isHovered ? 6 : 4;
                ctx.strokeRect(card.x, card.y, card.width, card.height);
                
                ctx.font = '60px Arial';
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(card.symbol, card.x + card.width/2, card.y + card.height/2);
            } else {
                ctx.fillStyle = isHovered ? '#5dade2' : '#3498db';
                ctx.fillRect(card.x, card.y, card.width, card.height);
                ctx.strokeStyle = isHovered ? '#1a5276' : '#2980b9';
                ctx.lineWidth = isHovered ? 6 : 4;
                ctx.strokeRect(card.x, card.y, card.width, card.height);
                
                ctx.font = '60px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('?', card.x + card.width/2, card.y + card.height/2);
            }
            
            ctx.globalAlpha = 1;
        });

        // Draw dwell progress arc over hovered card
        if (gameState.hoverCard && gameState.hoverStartTime && !gameState.hoverCard.isFlipped) {
            const elapsed = Date.now() - gameState.hoverStartTime;
            const progress = Math.min(elapsed / config.HOVER_DWELL_MS, 1);
            const card = gameState.hoverCard;
            const cx = card.x + card.width / 2;
            const cy = card.y + card.height / 2;

            ctx.beginPath();
            ctx.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 220, 0, 0.9)";
            ctx.lineWidth = 5;
            ctx.stroke();
        }
        
        // Draw fingertip cursor when finger is extended
        if (gameState.isActive && gameState.hands[0]) {
            const hand = gameState.hands[0];
            const tip = hand.fingerTips?.index;
            
            if (tip) {
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }

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
        if (!gameState.isActive || gameState.gameOver) return;

        if (gameState.isCountingDown) {
            gameState.countdown -= 1 / 60;
            if (gameState.countdown <= 0) {
                gameState.isCountingDown = false;
            }
        } else if (gameState.hands.length > 0) {
            const hand = gameState.hands[0];
            const hoveredCard = checkCardSelection(hand);

            if (hoveredCard) {
                if (gameState.hoverCard?.id === hoveredCard.id) {
                    // Same card — trigger card selection once dwell time is completed
                    const elapsed = Date.now() - gameState.hoverStartTime;
                    if (elapsed >= config.HOVER_DWELL_MS && gameState.canSelect) {
                        handleCardSelection(hoveredCard);
                        gameState.hoverCard = null;
                        gameState.hoverStartTime = null;
                    }
                } else {
                    // New card found - start dwell timer
                    gameState.hoverCard = hoveredCard;
                    gameState.hoverStartTime = Date.now();
                }
            } else {
                // No card hovered — clear hover state
                gameState.hoverCard = null;
                gameState.hoverStartTime = null;
            }
        } else {
            gameState.hoverCard = null;
            gameState.hoverStartTime = null;
        }

        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    async function startGame() {
        console.log("Animal Match startGame called");
        
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }

        // Set this as the active game
        window.handTracking.setActiveGame("animalMatch");

        // Reset game state completely for a fresh start
        gameState = {
            cards: [],
            hands: [],
            selectedCard: null,
            canSelect: true,
            matchedPairs: 0,
            moves: 0,
            gameOver: false,
            startTime: null,
            animationId: null,
            countdown: config.countdownTime,
            isCountingDown: true,
            isActive: true,
            hoverCard: null,
            hoverStartTime: null,
        };
        
        initCards();
        
        const moveDisplay = document.getElementById("move");
        const matchDisplay = document.getElementById("pairs");

        if (moveDisplay) {
            moveDisplay.textContent = "0"
        };
        if (matchDisplay) {
            matchDisplay.textContent = `0/${symbols.length}`
        };

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
            // Reassign stream to this game's video element when switching games
            loadingOverlay.classList.remove("hidden");
            loadingStatus.textContent = "Switching camera...";

            await window.handTracking.setupHandTracking(webcam);

            loadingOverlay.classList.add("hidden");
        }

        // Always restart detection since resetGame() (game switch) stopped it
        window.handTracking.startDetection();
        
        overlay.classList.add('hidden');
        canvas.closest(".canvasWrapper").style.visibility = "visible";
        gameLoop();
    }

    function endGame(win = true) {
        gameState.gameOver = true;
        gameState.isActive = false;
        gameState.cards = [];
        gameState.hands = [];
        cancelAnimationFrame(gameState.animationId);

        canvas.closest(".canvasWrapper").style.visibility = "hidden";
        
        overlayMessage.innerHTML = win 
            ? `<div style="font-size: 2rem;">🎉 You Win!</div>
            <div style="font-size: 1.2rem;">Moves: ${gameState.moves}</div>`
            : `<div style="font-size: 2rem;">Game Over!</div>`;
        
        startButton.textContent = "Play Again";
        overlay.classList.remove("hidden");

        render();
    }

    if (startButton) {
        console.log("Animal Match startButton found, adding listener");
        startButton.addEventListener("click", startGame);
    } else {
        console.error("startButton-animalM not found");
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

    window.startAnimalMatch = startGame;

    // Runs independently from gameLoop to keep canvas updated on the start and end screens
    function renderLoop() {
        render();
        requestAnimationFrame(renderLoop);
    }

    renderLoop();
})();