const chatToggle = document.getElementById("chatToggle");
const chatBox = document.getElementById("chatBox");
const chatBody = document.getElementById("chatBody");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const quickReplies = document.querySelectorAll("#quickReplies button");

let qaData = [];
let userProfile = {
  name: null,
  age: null,
  cycleLength: null,
  lastPeriodStart: null,
  symptoms: null,
  goals: null,
};
let onboardingStep = 0;
let onboardingActive = true;

// ----------------------------
//  CSV LOADER (SAFE PARSER)
// ----------------------------
fetch("femcare_data.csv")
  .then((res) => res.text())
  .then((text) => {
    const rows = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') insideQuotes = !insideQuotes;

      if ((char === "\n" || char === "\r") && !insideQuotes) {
        if (current.trim()) rows.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) rows.push(current.trim());

    qaData = rows
      .slice(1)
      .map((line) => {
        const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        if (!parts || parts.length < 3) return null;
        return {
          category: parts[0].replace(/"/g, "").trim().toLowerCase(),
          question: parts[1].replace(/"/g, "").trim().toLowerCase(),
          answer: parts[2].replace(/"/g, "").trim(),
        };
      })
      .filter(Boolean);

    console.log("CSV Loaded:", qaData.length);
  })
  .catch((err) => console.error("CSV Error:", err));


// ----------------------------
//  CHATBOX TOGGLE
// ----------------------------
chatToggle.addEventListener("click", () => {
  const isOpen = chatBox.classList.contains("open");
  if (isOpen) {
    chatBox.classList.remove("open");
    setTimeout(() => (chatBox.style.display = "none"), 300);
  } else {
    chatBox.style.display = "flex";
    setTimeout(() => chatBox.classList.add("open"), 50);
  }
});

// ----------------------------
//  ADD MESSAGE TO CHAT
// ----------------------------
function addMessage(content, sender = "user") {
  const msg = document.createElement("div");
  msg.classList.add(sender === "user" ? "user-msg" : "bot-msg");

  if (sender === "user") {
    const avatar = document.createElement("img");
    avatar.src = "chatbot/assets/user_icon.jpeg";
    msg.appendChild(avatar);
  }

  const text = document.createElement("span");
  text.innerHTML = content; // HTML allowed for <br>
  msg.appendChild(text);

  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// ----------------------------
//  PERSONALIZED ANSWER BUILDER
// ----------------------------
function personalize(answer) {
  return answer
    .replace(/{{name}}/gi, userProfile.name || "friend")
    .replace(/{{age}}/gi, userProfile.age || "")
    .replace(/{{cycleLength}}/gi, userProfile.cycleLength || "")
    .replace(/{{symptoms}}/gi, userProfile.symptoms || "")
    .replace(/{{goals}}/gi, userProfile.goals || "");
}

// ----------------------------
//  ONBOARDING QUESTIONS
// ----------------------------
const onboardingQuestions = [
  "Hi! 💗 I'm FemCare Assistant. What’s your name?",
  "How old are you?",
  "Roughly how long is your menstrual cycle (in days)?",
  "When did your last period start? (Example: 2025-01-12)",
  "Any symptoms right now? (cramps, mood swings, headache, fatigue...)",
  "What is your main goal? (pain relief, cycle tracking, nutrition...)",
  "Thank you! 🎀 Your profile is set. Ask me anything now!"
];

// ----------------------------
//  HANDLE ONBOARDING ANSWERS
// ----------------------------
function handleOnboarding(answer) {
  const steps = [
    "name",
    "age",
    "cycleLength",
    "lastPeriodStart",
    "symptoms",
    "goals",
  ];

  if (onboardingStep < steps.length) {
    userProfile[steps[onboardingStep]] = answer;
  }

  onboardingStep++;

  if (onboardingStep < onboardingQuestions.length - 1) {
    addMessage(onboardingQuestions[onboardingStep], "bot");
  } else {
    onboardingActive = false;
    addMessage("Your personalized profile is ready 🎀", "bot");
    addMessage("You can ask anything related to periods, hygiene, nutrition, PMS, cycle phases…", "bot");
  }
}

// ----------------------------
//  CSV SEARCH ENGINE
// ----------------------------
function getResponse(input) {
  input = input.toLowerCase();

  let bestMatch = null;
  let maxScore = 0;

  for (const row of qaData) {
    const qWords = row.question.split(" ");
    let score = 0;

    qWords.forEach(w => {
      if (input.includes(w)) score++;
    });

    if (score > maxScore) {
      maxScore = score;
      bestMatch = row;
    }
  }

  if (bestMatch && maxScore >= 2) {
    return personalize(bestMatch.answer);
  }

  return "I'm still learning 💗 Try asking about cramps, cycles, hygiene, PMS, or nutrition!";
}




// ----------------------------
//  USER MESSAGE HANDLER
// ----------------------------
sendBtn.addEventListener("click", () => {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  // First time onboarding
  if (onboardingActive) {
    handleOnboarding(text);
    return;
  }

  const reply = getResponse(text);
  setTimeout(() => addMessage(reply, "bot"), 600);
});

// ----------------------------
//  QUICK REPLIES
// ----------------------------
quickReplies.forEach((btn) => {
  btn.addEventListener("click", () => {
    const text = btn.textContent;
    addMessage(text, "user");

    if (onboardingActive) {
      handleOnboarding(text);
      return;
    }

    const reply = getResponse(text);
    setTimeout(() => addMessage(reply, "bot"), 500);
  });
});

// ----------------------------
//  START BOT
// ----------------------------
window.onload = () => {
  addMessage(onboardingQuestions[0], "bot");
};
