"use strict";

/* ==========================================
   T.I.T.A.N. V2
   AI + VOICE + LOCAL COMMAND ENGINE
========================================== */

const bootScreen = document.getElementById("bootScreen");
const bootProgress = document.getElementById("bootProgress");
const bootStatus = document.getElementById("bootStatus");

const app = document.getElementById("app");
const systemTime = document.getElementById("systemTime");

const commandInput = document.getElementById("commandInput");
const sendBtn = document.getElementById("sendBtn");

const micBtn = document.getElementById("micBtn");
const micText = document.getElementById("micText");

const conversation = document.getElementById("conversation");

const coreState = document.getElementById("coreState");
const assistantStatus = document.getElementById("assistantStatus");

const voiceStatus = document.getElementById("voiceStatus");
const memoryStatus = document.getElementById("memoryStatus");


/* ==========================================
   STATE
========================================== */

let isListening = false;
let recognition = null;

let memory = [];

let chatHistory = [];

let speechEnabled = true;

let isThinking = false;


/* ==========================================
   BOOT
========================================== */

function bootSystem() {

  let progress = 0;

  const messages = [
    "POWERING CORE...",
    "LOADING NEURAL ENGINE...",
    "INITIALIZING VOICE SYSTEM...",
    "CONNECTING AI SYSTEM...",
    "LOADING MEMORY...",
    "SYSTEM READY..."
  ];

  const interval = setInterval(() => {

    progress += 2;

    if (progress > 100) {
      progress = 100;
    }

    bootProgress.style.width =
      `${progress}%`;

    const index = Math.min(
      Math.floor(progress / 17),
      messages.length - 1
    );

    bootStatus.textContent =
      messages[index];

    if (progress >= 100) {

      clearInterval(interval);

      setTimeout(() => {

        bootScreen.classList.add("hidden");
        app.classList.remove("hidden");

        coreState.textContent = "ONLINE";

        assistantStatus.textContent =
          "AI systems are ready.";

        loadMemory();
        updateTime();

        speak(
          "T.I.T.A.N. online. AI systems ready."
        );

      }, 700);
    }

  }, 35);
}


/* ==========================================
   CLOCK
========================================== */

function updateTime() {

  const now = new Date();

  systemTime.textContent =
    now.toLocaleTimeString(
      "en-IN",
      {
        hour12: false
      }
    );
}

setInterval(updateTime, 1000);


/* ==========================================
   MEMORY
========================================== */

function loadMemory() {

  try {

    const saved =
      localStorage.getItem(
        "titan_memory"
      );

    if (saved) {

      memory =
        JSON.parse(saved);

      memoryStatus.textContent =
        `${memory.length} ITEMS`;

    } else {

      memory = [];

      memoryStatus.textContent =
        "LOCAL";
    }

  } catch (error) {

    console.error(error);

    memory = [];
  }
}


function saveMemory(userText, titanText) {

  memory.push({
    user: userText,
    titan: titanText,
    time: new Date().toISOString()
  });

  if (memory.length > 50) {
    memory.shift();
  }

  localStorage.setItem(
    "titan_memory",
    JSON.stringify(memory)
  );

  memoryStatus.textContent =
    `${memory.length} ITEMS`;
}


/* ==========================================
   CHAT UI
========================================== */

function addMessage(sender, text) {

  const message =
    document.createElement("div");

  message.className =
    "message " +
    (
      sender === "user"
        ? "user-message"
        : "titan-message"
    );

  const label =
    document.createElement("div");

  label.className =
    "message-label";

  label.textContent =
    sender === "user"
      ? "YOU"
      : "T.I.T.A.N.";

  const content =
    document.createElement("div");

  content.className =
    "message-content";

  content.textContent =
    text;

  message.appendChild(label);
  message.appendChild(content);

  conversation.appendChild(message);

  conversation.scrollTop =
    conversation.scrollHeight;
}


/* ==========================================
   TEXT TO SPEECH
========================================== */

function speak(text) {

  if (!speechEnabled) {
    return;
  }

  if (!("speechSynthesis" in window)) {

    voiceStatus.textContent =
      "NOT SUPPORTED";

    return;
  }

  window.speechSynthesis.cancel();

  const speech =
    new SpeechSynthesisUtterance(text);

  speech.lang = "en-IN";
  speech.rate = 0.95;
  speech.pitch = 0.85;
  speech.volume = 1;

  speech.onstart = () => {

    voiceStatus.textContent =
      "SPEAKING";

    coreState.textContent =
      "SPEAKING";
  };

  speech.onend = () => {

    voiceStatus.textContent =
      "READY";

    coreState.textContent =
      "ONLINE";
  };

  window.speechSynthesis.speak(
    speech
  );
}


/* ==========================================
   SPEECH RECOGNITION
========================================== */

function setupSpeechRecognition() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {

    micBtn.disabled = true;

    micText.textContent =
      "VOICE NOT SUPPORTED";

    voiceStatus.textContent =
      "UNAVAILABLE";

    return;
  }

  recognition =
    new SpeechRecognition();

  recognition.lang =
    "en-IN";

  recognition.continuous =
    false;

  recognition.interimResults =
    false;

  recognition.maxAlternatives =
    1;


  recognition.onstart = () => {

    isListening = true;

    micBtn.classList.add(
      "listening"
    );

    micText.textContent =
      "LISTENING...";

    voiceStatus.textContent =
      "LISTENING";

    coreState.textContent =
      "LISTENING";

    assistantStatus.textContent =
      "I am listening.";
  };


  recognition.onresult = event => {

    const transcript =
      event.results[0][0].transcript;

    commandInput.value =
      transcript;

    processCommand(
      transcript
    );
  };


  recognition.onerror = event => {

    console.error(
      "Speech error:",
      event.error
    );

    resetMicrophone();

    assistantStatus.textContent =
      "Voice input error.";
  };


  recognition.onend = () => {

    resetMicrophone();
  };
}


function resetMicrophone() {

  isListening = false;

  micBtn.classList.remove(
    "listening"
  );

  micText.textContent =
    "TAP TO SPEAK";

  voiceStatus.textContent =
    "READY";

  coreState.textContent =
    "ONLINE";

  assistantStatus.textContent =
    "AI systems are ready.";
}


micBtn.addEventListener(
  "click",
  () => {

    if (!recognition) {

      speak(
        "Voice recognition is not supported on this browser."
      );

      return;
    }

    if (isListening) {

      recognition.stop();

      return;
    }

    try {

      recognition.start();

    } catch (error) {

      console.error(error);
    }
  }
);


/* ==========================================
   LOCAL COMMANDS
========================================== */

function localCommand(command) {

  if (
    command.includes("what time") ||
    command === "time"
  ) {

    return (
      "The current time is " +
      new Date().toLocaleTimeString(
        "en-IN",
        {
          hour: "numeric",
          minute: "2-digit"
        }
      )
    );
  }


  if (
    command.includes("today") ||
    command.includes("date")
  ) {

    return (
      "Today is " +
      new Date().toLocaleDateString(
        "en-IN",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      )
    );
  }


  if (
    command.includes("open youtube")
  ) {

    window.open(
      "https://www.youtube.com/",
      "_blank"
    );

    return "Opening YouTube.";
  }


  if (
    command.includes("open google")
  ) {

    window.open(
      "https://www.google.com/",
      "_blank"
    );

    return "Opening Google.";
  }


  if (
    command.startsWith("search ")
  ) {

    const query =
      command
        .replace("search ", "")
        .trim();

    if (query) {

      window.open(
        "https://www.google.com/search?q=" +
        encodeURIComponent(query),
        "_blank"
      );

      return (
        `Searching the web for ${query}.`
      );
    }
  }


  if (
    command.includes("clear conversation")
  ) {

    conversation.innerHTML = "";

    chatHistory = [];

    return "Conversation cleared.";
  }


  if (
    command.includes("system status")
  ) {

    return (
      "T.I.T.A.N. core is online. " +
      "Voice system is ready. " +
      "AI backend is connected."
    );
  }


  return null;
}


/* ==========================================
   REAL AI REQUEST
========================================== */

async function askAI(message) {

  const response =
    await fetch(
      "/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          message,
          history: chatHistory
        })
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.error ||
      "AI request failed"
    );
  }


  return (
    data.reply ||
    "I couldn't generate a response."
  );
}


/* ==========================================
   MAIN COMMAND PROCESSOR
========================================== */

async function processCommand(
  rawCommand
) {

  const command =
    rawCommand.trim();

  if (!command || isThinking) {
    return;
  }

  addMessage(
    "user",
    command
  );

  commandInput.value = "";

  const localResponse =
    localCommand(
      command.toLowerCase()
    );


  if (localResponse) {

    addMessage(
      "titan",
      localResponse
    );

    saveMemory(
      command,
      localResponse
    );

    speak(localResponse);

    return;
  }


  isThinking = true;

  coreState.textContent =
    "THINKING";

  assistantStatus.textContent =
    "T.I.T.A.N. is thinking...";


  try {

    const reply =
      await askAI(command);


    addMessage(
      "titan",
      reply
    );


    chatHistory.push({
      role: "user",
      content: command
    });


    chatHistory.push({
      role: "assistant",
      content: reply
    });


    if (chatHistory.length > 12) {

      chatHistory =
        chatHistory.slice(-12);
    }


    saveMemory(
      command,
      reply
    );


    coreState.textContent =
      "ONLINE";

    assistantStatus.textContent =
      "Response generated.";

    speak(reply);


  } catch (error) {

    console.error(
      "T.I.T.A.N. AI error:",
      error
    );


    const message =
      "I couldn't connect to my AI core right now. " +
      "Please check the backend configuration and try again.";


    addMessage(
      "titan",
      message
    );


    coreState.textContent =
      "ERROR";

    assistantStatus.textContent =
      "AI connection error.";

    speak(message);
  }


  isThinking = false;
}


/* ==========================================
   SEND
========================================== */

sendBtn.addEventListener(
  "click",
  () => {

    processCommand(
      commandInput.value
    );
  }
);


/* ==========================================
   ENTER KEY
========================================== */

commandInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      event.preventDefault();

      processCommand(
        commandInput.value
      );
    }
  }
);


/* ==========================================
   QUICK COMMANDS
========================================== */

document
  .querySelectorAll(".quick-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const command =
          button.dataset.command;

        commandInput.value =
          command;

        processCommand(
          command
        );
      }
    );
  });


/* ==========================================
   KEYBOARD SHORTCUT
========================================== */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.ctrlKey &&
      event.code === "Space"
    ) {

      event.preventDefault();

      micBtn.click();
    }
  }
);


/* ==========================================
   START
========================================== */

setupSpeechRecognition();

bootSystem();
