// ===============================
// GAME VARIABLES
// ===============================

let playerScore = 0;
let computerScore = 0;

let round = 1;
const maxRounds = 5;

let currentGesture = null;

let lastGesture = null;
let stableFrames = 0;

let gameOver = false;

let roundLocked = false;


// ===============================
// HTML ELEMENTS
// ===============================

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const ctx = canvas.getContext("2d");

const detected = document.getElementById("detected");

const playerChoice = document.getElementById("playerChoice");
const computerChoice = document.getElementById("computerChoice");

const result = document.getElementById("result");

const countdown = document.getElementById("countdown");


// ===============================
// CAMERA
// ===============================

async function startCamera() {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480,
                facingMode: "user"
            }
        });

        video.srcObject = stream;

    } catch (error) {

        console.error(error);

        result.innerText =
            "❌ Camera permission denied";

        detected.innerText =
            "Please allow camera access.";

    }

}


// ===============================
// MEDIAPIPE HANDS
// ===============================

const hands = new Hands({
    locateFile: (file) => {

        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;

    }
});


hands.setOptions({

    maxNumHands: 1,

    modelComplexity: 1,

    minDetectionConfidence: 0.7,

    minTrackingConfidence: 0.7

});


hands.onResults(onResults);


// ===============================
// MEDIAPIPE CAMERA
// ===============================

const camera = new Camera(video, {

    onFrame: async () => {

        await hands.send({
            image: video
        });

    },

    width: 640,
    height: 480

});


camera.start();

startCamera();


// ===============================
// HAND RESULT
// ===============================

function onResults(results) {

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // No hand detected

    if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
    ) {

        currentGesture = null;

        stableFrames = 0;

        detected.innerText =
            "Show your hand ✋";

        return;

    }


    const landmarks =
        results.multiHandLandmarks[0];


    // Draw hand landmarks

    drawConnectors(
        ctx,
        landmarks,
        HAND_CONNECTIONS,
        {
            color: "#00FF00",
            lineWidth: 3
        }
    );


    drawLandmarks(
        ctx,
        landmarks,
        {
            color: "#FF0000",
            lineWidth: 2,
            radius: 4
        }
    );


    // Detect gesture

    const gesture =
        detectGesture(landmarks);


    currentGesture = gesture;


    if (gesture) {

        detected.innerText =
            "Detected: " + gesture.toUpperCase();

        checkStableGesture(gesture);

    }

}


// ===============================
// GESTURE DETECTION
// ===============================

function detectGesture(landmarks) {

    /*
        Finger landmarks:

        Index  = 8
        Middle = 12
        Ring   = 16
        Pinky  = 20

        PIP joints:

        Index  = 6
        Middle = 10
        Ring   = 14
        Pinky  = 18
    */


    const indexOpen =
        landmarks[8].y < landmarks[6].y;

    const middleOpen =
        landmarks[12].y < landmarks[10].y;

    const ringOpen =
        landmarks[16].y < landmarks[14].y;

    const pinkyOpen =
        landmarks[20].y < landmarks[18].y;


    const fingers = [
        indexOpen,
        middleOpen,
        ringOpen,
        pinkyOpen
    ];


    const openCount =
        fingers.filter(Boolean).length;


    // PAPER

    if (openCount === 4) {

        return "paper";

    }


    // SCISSORS

    if (
        indexOpen &&
        middleOpen &&
        !ringOpen &&
        !pinkyOpen
    ) {

        return "scissors";

    }


    // ROCK

    if (openCount === 0) {

        return "rock";

    }


    return null;

}


// ===============================
// STABLE GESTURE
// ===============================

function checkStableGesture(gesture) {

    if (gesture === lastGesture) {

        stableFrames++;

    } else {

        stableFrames = 0;

        lastGesture = gesture;

    }


    /*
        Gesture must remain stable
        for several frames.
    */

    if (
        stableFrames >= 15 &&
        !roundLocked &&
        !gameOver
    ) {

        playRound(gesture);

    }

}


// ===============================
// PLAY ROUND
// ===============================

function playRound(playerMove) {

    roundLocked = true;

    stableFrames = 0;


    const computerMove =
        getComputerMove();


    playerChoice.innerText =
        getEmoji(playerMove);

    computerChoice.innerText =
        getEmoji(computerMove);


    const winner =
        getWinner(playerMove, computerMove);


    if (winner === "player") {

        playerScore++;

        result.innerText =
            "🎉 You Win!";

    }

    else if (winner === "computer") {

        computerScore++;

        result.innerText =
            "🤖 Computer Wins!";

    }

    else {

        result.innerText =
            "🤝 Draw!";

    }


    updateScore();


    // Check match winner

    if (
        playerScore >= 3 ||
        computerScore >= 3
    ) {

        finishGame();

        return;

    }


    round++;


    document.getElementById("round").innerText =
        `Round: ${round} / ${maxRounds}`;


    /*
        Wait before next round.
    */

    setTimeout(() => {

        roundLocked = false;

        playerChoice.innerText = "❔";
        computerChoice.innerText = "❔";

        result.innerText =
            "Show your next hand!";

    }, 2500);

}


// ===============================
// COMPUTER MOVE
// ===============================

function getComputerMove() {

    const choices = [
        "rock",
        "paper",
        "scissors"
    ];

    const randomIndex =
        Math.floor(
            Math.random() * choices.length
        );

    return choices[randomIndex];

}


// ===============================
// WINNER LOGIC
// ===============================

function getWinner(player, computer) {

    if (player === computer) {

        return "draw";

    }


    if (

        (player === "rock" &&
            computer === "scissors") ||

        (player === "paper" &&
            computer === "rock") ||

        (player === "scissors" &&
            computer === "paper")

    ) {

        return "player";

    }


    return "computer";

}


// ===============================
// EMOJIS
// ===============================

function getEmoji(choice) {

    if (choice === "rock") {

        return "✊";

    }

    if (choice === "paper") {

        return "✋";

    }

    if (choice === "scissors") {

        return "✌️";

    }

}


// ===============================
// UPDATE SCORE
// ===============================

function updateScore() {

    document.getElementById(
        "playerScore"
    ).innerText = playerScore;


    document.getElementById(
        "computerScore"
    ).innerText = computerScore;

}


// ===============================
// GAME OVER
// ===============================

function finishGame() {

    gameOver = true;

    roundLocked = true;


    if (playerScore > computerScore) {

        result.innerText =
            "🏆 YOU WON THE MATCH! 🎉";

    }

    else {

        result.innerText =
            "🤖 COMPUTER WON THE MATCH!";

    }


    detected.innerText =
        "Game Over";


    countdown.innerText =
        `${playerScore} - ${computerScore}`;


    document.getElementById(
        "restart"
    ).style.display = "inline-block";

}


// ===============================
// RESTART
// ===============================

function restartGame() {

    playerScore = 0;

    computerScore = 0;

    round = 1;

    gameOver = false;

    roundLocked = false;

    stableFrames = 0;

    lastGesture = null;


    document.getElementById(
        "playerScore"
    ).innerText = "0";


    document.getElementById(
        "computerScore"
    ).innerText = "0";


    document.getElementById(
        "round"
    ).innerText = "Round: 1 / 5";


    playerChoice.innerText = "❔";

    computerChoice.innerText = "❔";

    result.innerText =
        "Show your hand ✋";

    detected.innerText =
        "Waiting for hand...";

    countdown.innerText = "";


    document.getElementById(
        "restart"
    ).style.display = "none";

}
