"use strict";

/* ==========================================
   T.I.T.A.N. V1
   Tactical Intelligence & Technology
   Assistant Network
========================================== */


/* ==========================================
   ELEMENTS
========================================== */

const bootScreen =
  document.getElementById("bootScreen");

const bootProgress =
  document.getElementById("bootProgress");

const bootStatus =
  document.getElementById("bootStatus");

const app =
  document.getElementById("app");

const systemTime =
  document.getElementById("systemTime");

const commandInput =
  document.getElementById("commandInput");

const sendBtn =
  document.getElementById("sendBtn");

const micBtn =
  document.getElementById("micBtn");

const micText =
  document.getElementById("micText");

const conversation =
  document.getElementById("conversation");

const coreState =
  document.getElementById("coreState");

const assistantStatus =
  document.getElementById("assistantStatus");

const voiceStatus =
  document.getElementById("voiceStatus");

const memoryStatus =
  document.getElementById("memoryStatus");


/* ==========================================
   SYSTEM STATE
========================================== */

let isListening = false;

let recognition = null;

let memory = [];

let speechEnabled = true;


/* ==========================================
   BOOT SYSTEM
========================================== */

function bootSystem() {

  let progress = 0;

  const bootMessages = [
    "POWERING CORE...",
    "LOADING NEURAL ENGINE...",
    "INITIALIZING VOICE SYSTEM...",
    "CHECKING COMMAND MODULES...",
    "LOADING MEMORY...",
    "SYSTEM READY..."
  ];

  const interval = setInterval(() => {

    progress += 2;

    if (progress > 100) {
      progress = 100;
    }

    bootProgress.style.width =
      progress + "%";

    const messageIndex =
      Math.min(
        Math.floor(progress / 17),
        bootMessages.length - 1
      );

    bootStatus.textContent =
      bootMessages[messageIndex];

    if (progress >= 100) {

      clearInterval(interval);

      setTimeout(() => {

        bootScreen.classList.add("hidden");

        app.classList.remove("hidden");

        coreState.textContent =
          "ONLINE";

        assistantStatus.textContent =
          "All primary systems are operational.";

        loadMemory();

        updateTime();

        speak(
          "T.I.T.A.N. online. Systems operational."
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

    console.error(
      "Memory error:",
      error
    );

  }
}


function saveMemory(
  userText,
  titanText
) {

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

function addMessage(
  sender,
  text
) {

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

  if (
    !("speechSynthesis" in window)
  ) {
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


  recognition.onresult =
    (event) => {

      const transcript =
        event.results[0][0].transcript;

      commandInput.value =
        transcript;

      processCommand(
        transcript
      );

    };


  recognition.onerror =
    (event) => {

      console.error(
        "Speech error:",
        event.error
      );

      resetMicrophone();

      assistantStatus.textContent =
        "Voice input error. Please try again.";

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
    "Voice and command systems ready.";

}


/* ==========================================
   MICROPHONE BUTTON
========================================== */

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
   COMMAND PROCESSOR
========================================== */

function processCommand(
  rawCommand
) {

  const command =
    rawCommand
      .trim()
      .toLowerCase();

  if (!command) {
    return;
  }

  addMessage(
    "user",
    rawCommand
  );

  commandInput.value = "";

  coreState.textContent =
    "THINKING";

  assistantStatus.textContent =
    "Processing your command...";


  setTimeout(() => {

    const response =
      generateResponse(command);

    addMessage(
      "titan",
      response
    );

    saveMemory(
      rawCommand,
      response
    );

    coreState.textContent =
      "ONLINE";

    assistantStatus.textContent =
      "Command processed.";

    speak(response);

  }, 450);
}


/* ==========================================
   AI RESPONSE ENGINE
========================================== */

function generateResponse(
  command
) {

  /* Greeting */

  if (
    command.includes("hello") ||
    command.includes("hi") ||
    command.includes("hey") ||
    command.includes("namaste")
  ) {

    return (
      "Hello. T.I.T.A.N. is online and ready."
    );
  }


  /* Identity */

  if (
    command.includes("who are you") ||
    command.includes("what are you") ||
    command.includes("about yourself")
  ) {

    return (
      "I am T.I.T.A.N., your personal AI assistant. " +
      "My system is being developed with voice control, " +
      "command execution, web intelligence, memory and automation."
    );
  }


  /* Capabilities */

  if (
    command.includes("what can you do") ||
    command.includes("capabilities") ||
    command.includes("what do you do")
  ) {

    return (
      "I can understand commands, respond using voice, " +
      "remember local conversation data, perform basic tasks, " +
      "and will later connect to advanced AI and external tools."
    );
  }


  /* Time */

  if (
    command.includes("time") ||
    command.includes("what time")
  ) {

    const now =
      new Date();

    return (
      "The current time is " +
      now.toLocaleTimeString(
        "en-IN",
        {
          hour: "numeric",
          minute: "2-digit"
        }
      )
    );
  }


  /* Date */

  if (
    command.includes("date") ||
    command.includes("today")
  ) {

    const now =
      new Date();

    return (
      "Today is " +
      now.toLocaleDateString(
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


  /* Status */

  if (
    command.includes("system status") ||
    command.includes("status")
  ) {

    return (
      "All primary systems are operational. " +
      "Core online. Voice ready. Local memory active."
    );
  }


  /* Memory */

  if (
    command.includes("memory") ||
    command.includes("remember")
  ) {

    return (
      `I currently have ${memory.length} local conversation records in memory.`
    );
  }


  /* Joke */

  if (
    command.includes("joke")
  ) {

    return (
      "Why did the computer get cold? " +
      "Because it left its Windows open."
    );
  }


  /* Thank you */

  if (
    command.includes("thank") ||
    command.includes("thanks")
  ) {

    return (
      "You're welcome. Always ready."
    );
  }


  /* Open YouTube */

  if (
    command.includes("open youtube")
  ) {

    window.open(
      "https://www.youtube.com/",
      "_blank"
    );

    return (
      "Opening YouTube."
    );
  }


  /* Open Google */

  if (
    command.includes("open google")
  ) {

    window.open(
      "https://www.google.com/",
      "_blank"
    );

    return (
      "Opening Google."
    );
  }


  /* Search command */

  if (
    command.startsWith("search ")
  ) {

    const query =
      command.substring(7).trim();

    if (query) {

      const url =
        "https://www.google.com/search?q=" +
        encodeURIComponent(query);

      window.open(
        url,
        "_blank"
      );

      return (
        `Searching the web for ${query}.`
      );
    }
  }


  /* Calculate */

  if (
    command.startsWith("calculate ")
  ) {

    const expression =
      command
        .replace(
          "calculate ",
          ""
        )
        .trim();

    const result =
      safeCalculate(
        expression
      );

    if (result !== null) {

      return (
        `The result is ${result}.`
      );
    }

    return (
      "I could not safely calculate that expression."
    );
  }


  /* Clear conversation */

  if (
    command.includes("clear conversation")
  ) {

    conversation.innerHTML = "";

    return (
      "Conversation cleared."
    );
  }


  /* Unknown */

  return (
    "I understood your command, but this capability " +
    "is not connected yet. In the next version, " +
    "I will connect the advanced AI engine and external tools."
  );
}


/* ==========================================
   SAFE CALCULATOR
========================================== */

function safeCalculate(
  expression
) {

  const cleaned =
    expression.replace(
      /[^0-9+\-*/().% ]/g,
      ""
    );

  if (!cleaned) {
    return null;
  }

  try {

    const result =
      Function(
        `"use strict"; return (${cleaned})`
      )();

    if (
      typeof result !== "number" ||
      !Number.isFinite(result)
    ) {
      return null;
    }

    return result;

  } catch (error) {

    return null;

  }
}


/* ==========================================
   SEND BUTTON
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
  (event) => {

    if (
      event.key === "Enter"
    ) {

      processCommand(
        commandInput.value
      );

    }

  }
);


/* ==========================================
   QUICK COMMANDS
========================================== */

const quickButtons =
  document.querySelectorAll(
    ".quick-btn"
  );

quickButtons.forEach(
  (button) => {

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

  }
);


/* ==========================================
   KEYBOARD SHORTCUT
========================================== */

document.addEventListener(
  "keydown",
  (event) => {

    /*
      Space + CTRL
      = voice activation
    */

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
   START SYSTEM
========================================== */

setupSpeechRecognition();

bootSystem();
