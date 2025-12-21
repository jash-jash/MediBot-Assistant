/********************************************
 * API BASE URL
 * For LOCAL testing: 127.0.0.1:5000
 * For DEPLOYMENT: replace with Render URL
 ********************************************/
const API_BASE = "http://127.0.0.1:5000";
// Example after deployment:
// const API_BASE = "https://your-backend.onrender.com";

/********************************************
 * CONFIG FAILSAFE
 ********************************************/
if (typeof config === "undefined") {
  window.config = { MAX_VIDEO_RESULTS: 3 };
}

/********************************************
 * SECTION SWITCH
 ********************************************/
function showSection(id) {
  document
    .querySelectorAll("main .section, main > section")
    .forEach((sec) => (sec.style.display = "none"));

  const target = document.getElementById(id);
  if (target) target.style.display = "block";

  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));

  const activeBtn = document.querySelector(
    `.nav-btn[onclick="showSection('${id}')"]`
  );
  if (activeBtn) activeBtn.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  showSection("home");
  updateSlides();
});

/********************************************
 * SIDEBAR & THEME
 ********************************************/
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("main-container").classList.toggle("shifted");
  document.getElementById("footer").classList.toggle("shifted");
}

function toggleTheme() {
  document.body.classList.toggle("dark");
}

/********************************************
 * SLIDESHOW
 ********************************************/
let slideIndex = 0;

function setSlide(n) {
  slideIndex = n;
  updateSlides();
}

function updateSlides() {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".nav-dot");

  slides.forEach((s) => (s.style.display = "none"));
  dots.forEach((d) => d.classList.remove("active"));

  if (slides[slideIndex]) slides[slideIndex].style.display = "block";
  if (dots[slideIndex]) dots[slideIndex].classList.add("active");
}

setInterval(() => {
  slideIndex = (slideIndex + 1) % 3;
  updateSlides();
}, 4000);

/********************************************
 * REMINDER SYSTEM
 ********************************************/
function showReminderForm(type) {
  document
    .querySelectorAll(".reminder-type-btn")
    .forEach((btn) => btn.classList.remove("active"));

  const active = document.querySelector(
    `.reminder-type-btn[onclick="showReminderForm('${type}')"]`
  );
  if (active) active.classList.add("active");

  document.getElementById("medicine-name").placeholder =
    type === "medicine"
      ? "Enter medicine name"
      : type === "syringe"
      ? "Enter syringe name"
      : "Enter tonic name";
}

function addMedicineReminder(event) {
  event.preventDefault();

  const name = document.getElementById("medicine-name").value;
  const qty = document.getElementById("medicine-quantity").value;
  const freq = document.getElementById("medicine-frequency").value;
  const time = document.getElementById("medicine-time").value;
  const start = document.getElementById("medicine-start-date").value;
  const end = document.getElementById("medicine-end-date").value;

  document.getElementById("reminders-list").innerHTML += `
    <div class="reminder-card">
      <strong>${name}</strong><br>
      Doses: ${qty}<br>
      Frequency: ${freq}<br>
      Time: ${time}<br>
      From: ${start} — To: ${end}
    </div>
  `;

  event.target.reset();
}

/********************************************
 * STRICT FORMAT RULES FOR AI TEXT
 ********************************************/
const FORMAT_RULES = `
STRICT FORMAT RULES:

SECTION 1 (Has a paragraph):
<h3>Heading</h3>
• point
• point
• point
• point
• point

(2–4 line paragraph explaining points.)

OTHER SECTIONS:
<h3>Heading</h3>
• point
• point
• point
• point

<h3>Heading</h3>
• point
• point
• point
• point

FINAL SUMMARY:
⭐ key takeaway
⚡ important action
✔ must-follow advice

RULES:
- ONLY "•" bullets
- ONLY <h3> headings
- MUST include paragraph in Section 1
- MUST include ⭐ ⚡ ✔ in summary
- No hyphens (-)
- No bold (**)
`;

/********************************************
 * AI RESPONSE (Backend -> OpenRouter)
 ********************************************/
async function fetchGeminiText(query, textId, extraPrefix = "") {
  const container = document.getElementById(textId);
  container.innerHTML = `<div class="loading">Loading...</div>`;

  const prompt = `
${FORMAT_RULES}

TOPIC: ${extraPrefix} ${query}

Generate output EXACTLY in the required structure.
  `;

  try {
    const res = await fetch(`${API_BASE}/openai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    let formatted = data.text
      .replace(/^\s*-\s*/gm, "• ")
      .replace(/•\s*•/g, "• ")
      .replace(/\n{2,}/g, "<br><br>")
      .replace(/\n/g, "<br>");

    container.innerHTML = formatted;
  } catch (err) {
    container.innerHTML = `<p class="error-message">⚠️ ${err.message}</p>`;
  }
}

/********************************************
 * DIET PLAN DETECTION
 ********************************************/
function isPlanRequest(query) {
  let q = query.trim().toLowerCase();
  return (
    q.endsWith("plan") ||
    q.includes("meal plan") ||
    q.includes("diet plan") ||
    q.includes("balanced diet plan")
  );
}

/********************************************
 * UNIQUE DAY MEAL GENERATOR
 ********************************************/
function getRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateWeeklyMealPlan() {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const breakfast = [
    "Oats with fruits",
    "Idli & Sambar",
    "Veg omelette",
    "Smoothie bowl",
    "Poha",
    "Upma",
    "Peanut butter toast",
  ];
  const lunch = [
    "Grilled chicken + veggies",
    "Dal + Rice + Sabji",
    "Paneer curry + rotis",
    "Chickpea salad",
    "Fish curry + rice",
    "Rajma + rice",
    "Veg biryani + curd",
  ];
  const snack = [
    "Mixed nuts",
    "Fruit bowl",
    "Greek yogurt",
    "Protein bar",
    "Sprouts chaat",
    "Banana + peanuts",
  ];
  const dinner = [
    "Grilled salmon",
    "Chapati + sabji",
    "Paneer tikka + salad",
    "Soup + sandwich",
    "Chicken curry + roti",
    "Veg khichdi",
    "Egg curry + rice",
  ];

  let table = `
    <br><h3>7-Day Balanced Diet Meal Plan</h3>
    <table class="meal-plan-table" border="1" cellpadding="8" style="width:100%;border-collapse:collapse;">
      <tr>
        <th>Day</th><th>Breakfast</th><th>Lunch</th><th>Snack</th><th>Dinner</th>
      </tr>
  `;

  let bullets = `<br><h3>Daily Breakdown</h3>`;

  days.forEach((day, i) => {
    const B = getRandom(breakfast);
    const L = getRandom(lunch);
    const S = getRandom(snack);
    const D = getRandom(dinner);

    table += `
      <tr>
        <td>${day}</td>
        <td>${B}</td>
        <td>${L}</td>
        <td>${S}</td>
        <td>${D}</td>
      </tr>
    `;

    bullets += `
      <h3>Day ${i + 1} – ${day}</h3>
      • Breakfast: ${B}<br>
      • Lunch: ${L}<br>
      • Snack: ${S}<br>
      • Dinner: ${D}<br><br>
    `;
  });

  table += `</table><br>`;
  return table + bullets;
}

/********************************************
 * BALANCED DIET HANDLER
 ********************************************/
async function fetchBalancedDietContent(event) {
  event.preventDefault();

  const q = document.getElementById("balanced-diet-input").value;
  const container = document.getElementById("balanced-diet-text");

  await fetchGeminiText(q, "balanced-diet-text", "Balanced diet plan for");

  if (isPlanRequest(q)) {
    container.innerHTML += generateWeeklyMealPlan();
  }

  fetchVideos(q, "balanced-diet-videos");
}

/********************************************
 * OTHER FORM HANDLERS
 ********************************************/
function fetchEmergencyContent(event) {
  event.preventDefault();
  const q = document.getElementById("emergency-input").value;
  fetchGeminiText(q, "emergency-text", "Emergency guidance for");
  fetchVideos(q, "emergency-videos");
}

function fetchMedicineContent(event) {
  event.preventDefault();
  const q = document.getElementById("medicine-input").value;
  fetchGeminiText(q, "medicine-text", "Medicine information for");
  fetchVideos(q, "medicine-videos");
}

function fetchRemedyContent(event) {
  event.preventDefault();
  const q = document.getElementById("remedies-input").value;
  fetchGeminiText(q, "remedies-text", "Natural remedies for");
  fetchVideos(q, "remedies-videos");
}

/********************************************
 * YOUTUBE VIDEO FETCHER
 ********************************************/
async function fetchVideos(query, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<div class="loading">Fetching videos...</div>`;

  try {
    const res = await fetch(
      `${API_BASE}/youtube?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    if (!data.items || data.error) {
      throw new Error("YouTube API error");
    }

    container.innerHTML = "";

    data.items.slice(0, 3).forEach((video) => {
      const vid = video.id.videoId;
      const title = video.snippet.title;

      container.innerHTML += `
        <div class="video-card">
          <iframe width="100%" height="200"
            src="https://www.youtube.com/embed/${vid}"
            frameborder="0" allowfullscreen></iframe>
          <p>${title}</p>
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = `<p class="error-message">⚠️ Unable to load videos</p>`;
  }
}
