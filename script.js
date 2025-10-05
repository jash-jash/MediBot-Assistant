// Configuration
// Configuration
const config = {
  GEMINI_API_URL:"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
  YOUTUBE_API_URL: "https://www.googleapis.com/youtube/v3/search",
  MAX_VIDEO_RESULTS: 3,
  GEMINI_API_KEY: "AIzaSyAZ2u9bW-QXxKMFLQSI727jdJqbWQuRARY", // <-- make sure this is your valid key
  YOUTUBE_API_KEY: "AIzaSyByIqX-_-Neau9XR90el7Im3UjCHXkZ6M4",
  MAPS_API_KEY: "AIzaSyDkUVIEwHZF6Me8fX5YBGrDNo7nIDsZWFA0",
  NEWS_API_KEY: "c5d28615f046448f86af15e2b8a2f95e",
  // Example: NEWS_API_URL: `https://gnews.io/api/v4/search?q=healthcare&lang=en&max=9&token=${this.NEWS_API_KEY}`,
};

// State
let currentTheme = localStorage.getItem("theme") || "light";
let healthTipsGenerated = false;
let isGenerating = false;
let currentSlide = 0;
let slideInterval;

// Initialize tip history from localStorage or create empty
let tipHistory = JSON.parse(localStorage.getItem("tipHistory")) || {
  nutrition: [],
  exercise: [],
  sleep: [],
  stress: [],
  wellness: [],
};

// Limit history to 50 tips per category to prevent storage issues
const MAX_HISTORY = 10000;

// Fallback tips in case API fails to provide enough unique tips
const fallbackTips = {
  nutrition: [
    "Eat a variety of colorful vegetables daily.",
    "Choose whole grains over refined grains.",
    "Limit added sugars in your diet.",
  ],
  exercise: [
    "Aim for 30 minutes of daily activity.",
    "Incorporate strength training twice weekly.",
    "Try a new sport or workout.",
  ],
  sleep: [
    "Maintain a consistent sleep schedule.",
    "Avoid screens before bedtime.",
    "Create a relaxing bedroom environment.",
  ],
  stress: [
    "Practice deep breathing exercises daily.",
    "Take short breaks during work.",
    "Engage in a favorite hobby.",
  ],
  wellness: [
    "Stay hydrated throughout the day.",
    "Schedule regular health check-ups.",
    "Practice gratitude to boost mood.",
  ],
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const validThemes = ["light", "dark", "high-contrast", "ocean", "forest"];
  if (!validThemes.includes(currentTheme)) {
    currentTheme = "light";
    localStorage.setItem("theme", "light");
  }

  if (currentTheme === "dark") {
    document.body.setAttribute("data-theme", "dark");
  } else if (currentTheme === "high-contrast") {
    document.body.setAttribute("data-theme", "high-contrast");
  } else if (currentTheme === "ocean") {
    document.body.setAttribute("data-theme", "ocean");
  } else if (currentTheme === "forest") {
    document.body.setAttribute("data-theme", "forest");
  } else {
    document.body.removeAttribute("data-theme");
  }

  const themeBtn = document.querySelector(".theme-toggle-btn");
  themeBtn.textContent =
    currentTheme === "light"
      ? "☀️"
      : currentTheme === "dark"
      ? "🌙"
      : showSection("home");
  initSlideshow();
  updateSidebarImage(); // Call to display initial sidebar image
  setInterval(updateSidebarImage, 10000); // Change image every 10 seconds
});

// Slideshow Functions
function initSlideshow() {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".slideshow-nav button");
  if (slides.length === 0) return;

  slides[0].classList.add("active");
  dots[0].classList.add("active");

  slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
}

function nextSlide() {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".slideshow-nav button");
  slides[currentSlide].classList.remove("active");
  dots[currentSlide].classList.remove("active");
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add("active");
  dots[currentSlide].classList.add("active");
}

function setSlide(index) {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".slideshow-nav button");
  slides[currentSlide].classList.remove("active");
  dots[currentSlide].classList.remove("active");
  currentSlide = index;
  slides[currentSlide].classList.add("active");
  dots[currentSlide].classList.add("active");
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 5000);
}

function toggleTheme() {
  const themeBtn = document.querySelector(".theme-toggle-btn");
  if (currentTheme === "light") {
    document.body.setAttribute("data-theme", "dark");
    themeBtn.textContent = "🌙";
    currentTheme = "dark";
  } else {
    document.body.removeAttribute("data-theme");
    themeBtn.textContent = "☀️";
    currentTheme = "light";
  }
  localStorage.setItem("theme", currentTheme);
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggle-btn");
  const container = document.getElementById("main-container");
  const footer = document.getElementById("footer");

  sidebar.classList.toggle("open");
  toggleBtn.classList.toggle("open");
  toggleBtn.textContent = sidebar.classList.contains("open") ? "<" : ">";
  container.classList.toggle("shifted", sidebar.classList.contains("open"));
  footer.classList.toggle("shifted", sidebar.classList.contains("open"));
}

function showSection(sectionId) {
  document.querySelectorAll("#home, .section").forEach((section) => {
    section.style.display = section.id === sectionId ? "block" : "none";
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.getAttribute("onclick") === `showSection('${sectionId}')`
    );
    // Ensure to load news when the news section is shown
    if (sectionId === "news") {
      fetchNewsContent();
    }
    if (sectionId !== "health_tips") healthTipsGenerated = false;
  });

  const input = document.getElementById(`${sectionId}-input`);
  if (input) input.focus();

  if (sectionId === "health_tips" && !healthTipsGenerated) {
    console.log("Showing health_tips section, triggering auto-generation");
    waitForElement("health-tips-text", () => {
      console.log("health-tips-text found, calling generateHealthTips");
      generateHealthTips();
      healthTipsGenerated = true;
    });
  }
}

function waitForElement(id, callback, maxAttempts = 10, interval = 100) {
  let attempts = 0;
  const checkElement = () => {
    const element = document.getElementById(id);
    const isVisible =
      element &&
      window.getComputedStyle(document.getElementById("health_tips"))
        .display === "block";
    console.log(
      `Checking for ${id}: ${
        element ? "Found" : "Not found"
      }, Visible: ${isVisible}`
    );
    if (element && isVisible) {
      callback();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(checkElement, interval);
    } else {
      console.error(`Element ${id} not found after ${maxAttempts} attempts`);
      showError("Health tips section not available. Please try again.");
    }
  };
  checkElement();
}

function sanitizeInput(input) {
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

function processGeminiResponse(text) {
  let cleanedText = text
    .replace(/##+\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/-\s/g, "")
    .replace(/^\s*>\s*/gm, "")
    .replace(/`[^`]*`/g, (match) => match.slice(1, -1));

  const sections = cleanedText
    .split("\n\n")
    .filter((section) => section.trim());

  let html = '<div class="response-content">';

  sections.forEach((section, index) => {
    section = section.trim();

    if (
      section.toLowerCase().includes("disclaimer") ||
      section.toLowerCase().includes("warning")
    ) {
      html += `<div class="disclaimer">${section}</div>`;
      return;
    }

    if (index === 0 && section.length < 100) {
      html += `<h2>${section}</h2>`;
    } else if (section.length < 5000 && section.match(/^[A-Z][\w\s:]+$/)) {
      html += `<h3>${section}</h3>`;
    } else if (section.includes(":")) {
      const lines = section.split("\n").filter((line) => line.trim());
      if (lines.every((line) => line.includes(":"))) {
        html += "<ul>";
        lines.forEach((line) => {
          const [key, value] = line.split(":").map((s) => s.trim());
          html += `<li><strong>${key}:</strong> ${value}</li>`;
        });
        html += "</ul>";
      } else {
        html += `<p>${section}</p>`;
      }
    } else {
      const lines = section.split("\n").filter((line) => line.trim());
      if (
        lines.length > 1 &&
        lines.every((line) => line.match(/^[A-Za-z\s]/))
      ) {
        html += "<ul>";
        lines.forEach((line) => {
          html += `<li>${line}</li>`;
        });
        html += "</ul>";
      } else {
        html += `<p>${section}</p>`;
      }
    }
  });

  html += "</div>";
  return html;
}

async function fetchAPI(url, options, retries = 2, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        let errorMessage = "API request failed";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${url}:`, error.message);
      if (attempt === retries) {
        let userMessage = error.message.includes("API key")
          ? "Invalid or restricted API key. Please check your API configuration."
          : error.message.includes("HTTP 429")
          ? "API rate limit exceeded. Please try again later."
          : `Failed to fetch data: ${error.message}`;
        // Add specific guidance for 426 error
        if (error.message.includes("HTTP 426")) {
          userMessage +=
            '. This often means your NewsAPI plan does not support this endpoint, or requests from this domain are blocked. Please check NewsAPI documentation for details on "Upgrade Required" or domain whitelisting.';
        }
        throw new Error(userMessage);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
async function fetchGeminiText(query, textContainerId, promptPrefix) {
  const container = document.getElementById(textContainerId);
  if (!container) {
    console.error(`Container ${textContainerId} not found`);
    return;
  }
  container.innerHTML = '<div class="loading">Loading information...</div>';

  try {
    // 🔑 Safety check before calling API
    if (!config.GEMINI_API_URL) {
      container.innerHTML =
        "<p class='error-message'>No Gemini model available. Please check your API key access.</p>";
      return;
    }

    const sanitizedQuery = sanitizeInput(query);
    const data = await fetchAPI(
      `${config.GEMINI_API_URL}?key=${config.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `${promptPrefix} ${sanitizedQuery}` }] },
          ],
        }),
      }
    );

    // ✅ Guard against empty response
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      container.innerHTML =
        "<p class='error-message'>No response from Gemini. Try again.</p>";
      return;
    }

    const text = data.candidates[0].content.parts[0].text;
    container.innerHTML = processGeminiResponse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    container.innerHTML = `<p class="error-message">Error loading information: ${error.message}</p>`;
  }
}

async function fetchVideos(query, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }
  container.innerHTML =
    '<div class="loading">Loading reference videos...</div>';

  try {
    const sanitizedQuery = sanitizeInput(query);
    const data = await fetchAPI(
      `${config.YOUTUBE_API_URL}?part=snippet&q=${encodeURIComponent(
        sanitizedQuery
      )}&type=video&videoEmbeddable=true&maxResults=${
        config.MAX_VIDEO_RESULTS
      }&key=${config.YOUTUBE_API_KEY}`
    );

    if (!data.items.length) {
      container.innerHTML =
        '<p class="error-message">No reference videos found.</p>';
      return;
    }

    const videos = data.items.map((item) => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
    }));
    displayVideos(videos, containerId);
  } catch (error) {
    console.error("YouTube API Error:", error);
    container.innerHTML = `<p class="error-message">Error loading videos: ${error.message}</p>`;
  }
}

function displayVideos(videos, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }
  container.innerHTML = videos
    .map(
      (video) => `
                        <div class="video-card">
                            <iframe
                                src="https://www.youtube.com/embed/${
                                  video.videoId
                                }"
                                style="width: 100%; aspect-ratio: 16/9; border: none;"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen
                                title="${video.title}"
                            ></iframe>
                            <div class="video-title">${video.title.slice(
                              0,
                              60
                            )}...</div>
                        </div>
                    `
    )
    .join("");
}

function saveTipHistory(newTips) {
  const allExistingTips = Object.values(tipHistory).flat();
  for (const category in newTips) {
    const uniqueTips = newTips[category].filter(
      (tip) =>
        !allExistingTips.includes(tip) && !tipHistory[category].includes(tip)
    );
    tipHistory[category] = [...tipHistory[category], ...uniqueTips].slice(
      -MAX_HISTORY
    );
  }
  localStorage.setItem("tipHistory", JSON.stringify(tipHistory));
}

function renderTips(containerId, tips) {
  console.log(`Rendering tips for ${containerId}, Tips:`, tips);
  let container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container ${containerId} not found, attempting to create`);
    const parent = document.getElementById("health-tips-text");
    if (!parent) {
      console.error("Parent container health-tips-text not found");
      showError("Health tips section not available. Please try again.");
      return;
    }
    container = document.createElement("div");
    container.id = containerId;
    container.className =
      {
        nutritionTips: "nutrition-card",
        exerciseTips: "exercise-card",
        sleepTips: "sleep-card",
        stressTips: "stress-card",
        wellnessNotes: "wellness-card",
      }[containerId] || "wellness-card";
    container.style.display = "none";
    const title = document.createElement("h3");
    title.className = "health-tip-title";
    title.textContent =
      {
        nutritionTips: "🍎 Nutrition Tips",
        exerciseTips: "🏋️‍♂️ Exercise Tips",
        sleepTips: "🛌 Sleep Tips",
        stressTips: "🧘 Stress Management Tips",
        wellnessNotes: "🌟 General Wellness Notes",
      }[containerId] || "🌟 General Wellness Notes";
    container.appendChild(title);
    parent.appendChild(container);
  }
  container.style.display = tips.length > 0 ? "block" : "none";
  const ul = document.createElement("ul");
  tips.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    ul.appendChild(li);
  });
  while (container.children.length > 1) {
    container.removeChild(container.lastChild);
  }
  if (tips.length > 0) {
    container.appendChild(ul);
  }
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  const container = document.getElementById("health-tips-text"); // Fallback to a common container if possible
  if (container) {
    container.insertBefore(errorDiv, container.firstChild);
    setTimeout(() => errorDiv.remove(), 5000);
  } else {
    console.error("Cannot show error: health-tips-text container not found");
    // As a last resort, if no container is found, log to console.
    // Avoid using alert() in production web apps.
    console.error(message);
  }
}

async function generateHealthTips() {
  if (isGenerating) {
    console.log("generateHealthTips already in progress, skipping");
    return;
  }
  isGenerating = true;
  console.log("Starting generateHealthTips");
  const container = document.getElementById("health-tips-text");
  const generateBtn = document.getElementById("generate-tips-btn");
  const downloadBtn = document.getElementById("download-tips-btn");
  if (!container || !generateBtn || !downloadBtn) {
    console.error(
      "Required elements not found: health-tips-text, generate-tips-btn, or download-tips-btn"
    );
    showError("Cannot generate tips: Required elements missing");
    isGenerating = false;
    return;
  }
  const requiredIds = [
    "nutritionTips",
    "exerciseTips",
    "sleepTips",
    "stressTips",
    "wellnessNotes",
  ];
  const missingIds = requiredIds.filter((id) => !document.getElementById(id));
  if (missingIds.length > 0) {
    console.warn("Missing containers:", missingIds);
    missingIds.forEach((id) => renderTips(id, []));
  }
  generateBtn.disabled = true;
  container.innerHTML = '<div class="loading">Generating health tips...</div>';

  try {
    const timestamp = new Date().toISOString();
    const allExistingTips = Object.values(tipHistory).flat();
    let prompt = `
                    Generate exactly 3 health tips for each of the following categories: nutrition, exercise, sleep, stress management, and general wellness.
                    Return the response in JSON format with the following structure:
                    {
                        "nutrition": ["tip1", "tip2", "tip2"],
                        "exercise": ["tip1", "tip2", "tip3"],
                        "sleep": ["tip1", "tip2", "tip3"],
                        "stress": ["tip1", "tip2", "tip3"],
                        "wellness": ["tip1", "tip2", "tip3"]
                    }
                    Ensure the tips are:
                    - Concise (max 30 words each)
                    - Practical and actionable
                    - Unique for this request (timestamp: ${timestamp})
                    - Distinct from each other within and across all categories
                    - Not included in the following previously used tips:
                    ${JSON.stringify(allExistingTips, null, 2)}
                `;

    let healthTips = {
      nutrition: [],
      exercise: [],
      sleep: [],
      stress: [],
      wellness: [],
    };
    const categories = Object.keys(healthTips);
    let apiAttempts = 0;
    const maxApiAttempts = 3;

    while (apiAttempts < maxApiAttempts) {
      apiAttempts++;
      console.log(`API attempt ${apiAttempts}`);
      const data = await fetchAPI(
        `${config.GEMINI_API_URL}?key=${config.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9 },
          }),
        }
      );

      let generatedText = data.candidates[0].content.parts[0].text;
      console.log("API Response:", generatedText);
      generatedText = generatedText.replace(/```json\n|\n```|```/g, "").trim();
      let apiTips;
      try {
        apiTips = JSON.parse(generatedText);
      } catch {
        console.warn("Invalid JSON response, retrying...");
        continue;
      }

      for (const category of categories) {
        if (!apiTips[category] || !Array.isArray(apiTips[category])) {
          console.warn(`Invalid tips for ${category}, retrying...`);
          apiTips[category] = [];
        }
        const uniqueTips = apiTips[category].filter(
          (tip) =>
            !allExistingTips.includes(tip) &&
            !healthTips[category].includes(tip) &&
            !Object.values(healthTips).flat().includes(tip)
        );
        healthTips[category] = [...healthTips[category], ...uniqueTips].slice(
          0,
          3
        );
      }

      const allComplete = categories.every(
        (cat) => healthTips[cat].length === 3
      );
      if (allComplete) break;

      const missingCategories = categories.filter(
        (cat) => healthTips[cat].length < 3
      );
      if (missingCategories.length > 0) {
        console.log(`Missing tips in ${missingCategories}, retrying...`);
        prompt = `
                            Generate additional health tips for the following categories to reach exactly 3 unique tips per category:
                            ${missingCategories
                              .map(
                                (cat) =>
                                  `${cat}: ${
                                    3 - healthTips[cat].length
                                  } tips needed`
                              )
                              .join(", ")}.
                            Return in JSON format matching the previous structure.
                            Ensure tips are:
                            - Concise (max 40 words)
                            - Unique from:
                              - Existing tips: ${JSON.stringify(
                                healthTips,
                                null,
                                2
                              )}
                              - Previous tips: ${JSON.stringify(
                                allExistingTips,
                                null,
                                2
                              )}
                        `;
      }
    }

    for (const category of categories) {
      while (healthTips[category].length < 3) {
        const availableFallbacks = fallbackTips[category].filter(
          (tip) =>
            !allExistingTips.includes(tip) &&
            !healthTips[category].includes(tip) &&
            !Object.values(healthTips).flat().includes(tip)
        );
        if (availableFallbacks.length === 0) {
          console.warn(`No unique fallback tips available for ${category}`);
          healthTips[category].push(
            `Generic ${category} tip ${healthTips[category].length + 1}`
          );
        } else {
          healthTips[category].push(availableFallbacks[0]);
        }
      }
    }

    const allNewTips = Object.values(healthTips).flat();
    const uniqueTips = new Set(allNewTips);
    if (uniqueTips.size !== allNewTips.length) {
      console.warn("Duplicates detected in final tips, adjusting...");
      for (const category of categories) {
        healthTips[category] = [...new Set(healthTips[category])];
        while (healthTips[category].length < 3) {
          healthTips[category].push(
            `Unique ${category} tip ${healthTips[category].length + 1}`
          );
        }
      }
    }

    saveTipHistory(healthTips);

    container.innerHTML = "";
    renderTips("nutritionTips", healthTips.nutrition);
    renderTips("exerciseTips", healthTips.exercise);
    renderTips("sleepTips", healthTips.sleep);
    renderTips("stressTips", healthTips.stress);
    renderTips("wellnessNotes", healthTips.wellness);

    downloadBtn.disabled = false;
    healthTipsGenerated = true;
  } catch (error) {
    console.error("Health Tips Error:", error);
    container.innerHTML = "";
    showError(`Error generating health tips: ${error.message}`);
    downloadBtn.disabled = true;
  } finally {
    generateBtn.disabled = false;
    isGenerating = false;
  }
}

function downloadHealthTips() {
  const container = document.getElementById("health-tips-text");
  if (!container) {
    console.error("health-tips-text container not found for PDF download");
    // No alert here, error is logged.
    return;
  }
  const cards = container.querySelectorAll(
    ".nutrition-card, .exercise-card, .sleep-card, .stress-card, .wellness-card"
  );
  let textContent = "";

  cards.forEach((card) => {
    if (card.style.display !== "none") {
      const title = card.querySelector(".health-tip-title")?.textContent || "";
      const tipsList = card.querySelector("ul");
      if (tipsList && tipsList.children.length > 0) {
        const tips = Array.from(tipsList.children)
          .map((li) => `- ${li.textContent.trim()}`)
          .join("\n");
        textContent += `${title}\n${tips}\n\n`;
      }
    }
  });

  if (!textContent.trim()) {
    showError(
      "No health tips available to download. Please generate tips first."
    );
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("MediBot Health Tips", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(textContent, 170);
    let y = 30;
    lines.forEach((line) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 6;
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const footerText = [
      "⚠️ MediBot provides medical information for guidance only. Always consult healthcare professionals for treatment.",
      "© 2025 MediBot Assistant | All Rights Reserved",
    ];
    footerText.forEach((line, index) => {
      doc.text(line, 20, doc.internal.pageSize.height - 20 + index * 5);
    });

    console.log("PDF Content:", textContent);
    doc.save("health_tips.pdf");
  } catch (error) {
    console.error("PDF Generation Error:", error);
    showError("Failed to generate PDF. Please try again.");
  }
}

// New function to update the sidebar image
function updateSidebarImage() {
  const imgElement = document.getElementById("sidebar-dynamic-image");
  if (imgElement && config.SIDEBAR_IMAGES && config.SIDEBAR_IMAGES.length > 0) {
    const randomIndex = Math.floor(
      Math.random() * config.SIDEBAR_IMAGES.length
    );
    imgElement.src = config.SIDEBAR_IMAGES[randomIndex];
    imgElement.alt = `AI/Health Image ${randomIndex + 1}`; // Update alt text dynamically
  }
}

async function fetchEmergencyContent() {
  const input = document.getElementById("emergency-input").value.trim();
  if (!input) {
    document.getElementById("emergency-text").innerHTML =
      '<p class="error-message">Please enter an emergency situation.</p>';
    document.getElementById("emergency-videos").innerHTML = "";
    return;
  }
  // First fetch and display the text content
  await fetchGeminiText(
    input,
    "emergency-text",
    "Provide detailed first aid guidance for the emergency situation:"
  );
  // Then fetch and display the videos
  await fetchVideos(
    `first aid ${input} emergency treatment tutorial medical`,
    "emergency-videos"
  );
}

async function fetchMedicineContent() {
  const input = document.getElementById("medicine-input").value.trim();
  if (!input) {
    document.getElementById("medicine-text").innerHTML =
      '<p class="error-message">Please enter a medication name.</p>';
    document.getElementById("medicine-videos").innerHTML = "";
    return;
  }
  // First fetch and display the text content
  await fetchGeminiText(
    input,
    "medicine-text",
    "Provide detailed information about the medication, including uses, side effects, and precautions:"
  );
  // Then fetch and display the videos
  await fetchVideos(`${input} medication information tutorial`, "medicine-videos");
}

async function fetchRemedyContent() {
  const input = document.getElementById("remedies-input").value.trim();
  if (!input) {
    document.getElementById("remedies-text").innerHTML =
      '<p class="error-message">Please enter symptoms.</p>';
    document.getElementById("remedies-videos").innerHTML = "";
    return;
  }
  // First fetch and display the text content
  await fetchGeminiText(
    input,
    "remedies-text",
    "Suggest natural remedies for the symptoms:"
  );
  // Then fetch and display the videos
  await fetchVideos(`natural remedy for ${input} tutorial`, "remedies-videos");
}

async function fetchBalancedDietContent() {
  const input = document.getElementById("balanced-diet-input").value.trim();
  if (!input) {
    document.getElementById("balanced-diet-text").innerHTML =
      '<p class="error-message">Please enter a diet-related query.</p>';
    document.getElementById("balanced-diet-videos").innerHTML = "";
    return;
  }
  // First fetch and display the text content
  await fetchGeminiText(
    input,
    "balanced-diet-text",
    "Provide detailed nutrition advice and diet plans for:"
  );
  // Then fetch and display the videos
  await fetchVideos(
    `balanced diet ${input} nutrition tutorial`,
    "balanced-diet-videos"
  );
}

async function fetchNewsContent() {
  const container = document.getElementById("news-articles-container");
  if (!container) {
    console.error("News articles container not found.");
    return;
  }
  container.innerHTML =
    '<div class="loading">Loading latest healthcare news...</div>';

  try {
    // Fetch top healthcare news using GNews API
    const gNewsUrl = `${config.NEWS_API_URL}?q=healthcare&lang=en&max=9&token=${config.NEWS_API_KEY}`;

    // IMPORTANT: If you are using a free GNews API key, it might require whitelisting the domain
    // from which the request is made. If you continue to see errors, please check your GNews API dashboard.
    // For local development, you might need a proxy or a paid plan.
    if (config.NEWS_API_KEY === "e214f4d79ec144a5b0106ab37f8d8519") {
      container.innerHTML =
        '<p class="error-message">Please replace "e214f4d79ec144a5b0106ab37f8d8519" with your actual GNews API key in the config object to fetch news.</p>';
      return;
    }

    const data = await fetchAPI(gNewsUrl);

    if (!data.articles || data.articles.length === 0) {
      container.innerHTML =
        '<p class="error-message">No healthcare news found at this time.</p>';
      return;
    }

    // GNews API structure has 'image' field directly for image URL
    const articlesToDisplay = data.articles
      .filter(
        (article) =>
          article.image &&
          (article.image.startsWith("http://") ||
            article.image.startsWith("https://"))
      )
      .slice(0, 9); // Limit to 9 articles for a clean grid

    if (articlesToDisplay.length === 0) {
      container.innerHTML =
        '<p class="error-message">No healthcare news with valid images found to display.</p>';
      return;
    }

    displayNews(articlesToDisplay, container);
  } catch (error) {
    console.error("GNews API Error:", error);
    let errorMessage = `Error loading news: ${error.message}.`;
    if (error.message.includes("HTTP 403")) {
      errorMessage +=
        " This often means your GNews API key is invalid, or the domain is not whitelisted. Please check your GNews API dashboard.";
    } else if (error.message.includes("HTTP 429")) {
      errorMessage +=
        " You have exceeded the daily request limit for your GNews API key. Please try again tomorrow or upgrade your plan.";
    }
    container.innerHTML = `<p class="error-message">${errorMessage}</p>`;
  }
}

function displayNews(articles, container) {
  container.innerHTML = articles
    .map(
      (article) => `
                <a href="${
                  article.url
                }" target="_blank" rel="noopener noreferrer" class="news-card">
                    <img src="${article.image}" alt="${
        article.title || "News Image"
      }" onerror="this.onerror=null;this.src='[https://placehold.co/300x180/e0e0e0/000000?text=No+Image](https://placehold.co/300x180/e0e0e0/000000?text=No+Image)';">
                    <div class="news-content">
                        <h3>${
                          article.title
                            ? article.title.slice(0, 100) +
                              (article.title.length > 100 ? "..." : "")
                            : "No Title"
                        }</h3>
                        <p>${
                          article.description
                            ? article.description.slice(0, 150) +
                              (article.description.length > 150 ? "..." : "")
                            : "No description available."
                        }</p>
                        <div class="news-source-date">
                            <span>${
                              article.source.name || "Unknown Source"
                            }</span>
                            <span>${
                              article.publishedAt
                                ? new Date(
                                    article.publishedAt
                                  ).toLocaleDateString()
                                : "N/A"
                            }</span>
                        </div>
                    </div>
                </a>
            `
    )
    .join("");
}

// Medicine Reminder Feature
let currentReminderType = 'medicine';
const reminders = JSON.parse(localStorage.getItem('medicineReminders')) || [];

function showReminderForm(type) {
    currentReminderType = type;
    const buttons = document.querySelectorAll('.reminder-type-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === type) {
            btn.classList.add('active');
        }
    });

    const form = document.getElementById('medicine-reminder-form');
    const nameInput = document.getElementById('medicine-name');
    
    // Update form labels based on type
    nameInput.placeholder = `Enter ${type} name`;
    document.querySelector('label[for="medicine-name"]').textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Name:`;
}

function addMedicineReminder(event) {
    event.preventDefault();
    
    const reminder = {
        id: Date.now(),
        type: currentReminderType,
        name: document.getElementById('medicine-name').value,
        quantity: document.getElementById('medicine-quantity').value,
        frequency: document.getElementById('medicine-frequency').value,
        time: document.getElementById('medicine-time').value,
        startDate: document.getElementById('medicine-start-date').value,
        endDate: document.getElementById('medicine-end-date').value,
        notes: document.getElementById('medicine-notes').value,
        createdAt: new Date().toISOString()
    };

    reminders.push(reminder);
    localStorage.setItem('medicineReminders', JSON.stringify(reminders));
    
    // Reset form
    event.target.reset();
    
    // Refresh reminders list
    displayReminders();
    
    // Show success message
    alert('Reminder set successfully!');
    
    // Schedule notification
    scheduleReminderNotification(reminder);
}

function displayReminders() {
    const container = document.getElementById('reminders-list');
    if (!container) return;

    const remindersList = reminders
        .map(reminder => `
            <div class="reminder-item">
                <div class="reminder-info">
                    <h4>${reminder.name} (${reminder.type})</h4>
                    <p>Quantity: ${reminder.quantity} | Time: ${reminder.time}</p>
                    <p>Frequency: ${reminder.frequency}</p>
                    <p>From: ${reminder.startDate} To: ${reminder.endDate}</p>
                    ${reminder.notes ? `<p>Notes: ${reminder.notes}</p>` : ''}
                </div>
                <div class="reminder-actions">
                    <button class="edit-reminder" onclick="editReminder(${reminder.id})">✏️</button>
                    <button class="delete-reminder" onclick="deleteReminder(${reminder.id})">🗑️</button>
                </div>
            </div>
        `)
        .join('');

    container.innerHTML = `<h3>Active Reminders</h3>${remindersList || '<p>No active reminders</p>'}`;
}

function editReminder(id) {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    // Set form values
    document.getElementById('medicine-name').value = reminder.name;
    document.getElementById('medicine-quantity').value = reminder.quantity;
    document.getElementById('medicine-frequency').value = reminder.frequency;
    document.getElementById('medicine-time').value = reminder.time;
    document.getElementById('medicine-start-date').value = reminder.startDate;
    document.getElementById('medicine-end-date').value = reminder.endDate;
    document.getElementById('medicine-notes').value = reminder.notes || '';

    // Switch to correct type
    showReminderForm(reminder.type);

    // Remove old reminder
    deleteReminder(id, true);

    // Scroll to form
    document.getElementById('medicine-reminder-form').scrollIntoView({ behavior: 'smooth' });
}

function deleteReminder(id, skipConfirm = false) {
    if (!skipConfirm && !confirm('Are you sure you want to delete this reminder?')) return;

    const index = reminders.findIndex(r => r.id === id);
    if (index > -1) {
        reminders.splice(index, 1);
        localStorage.setItem('medicineReminders', JSON.stringify(reminders));
        displayReminders();
    }
}

function scheduleReminderNotification(reminder) {
    // Request notification permission if not granted
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    // Calculate next reminder time
    const reminderTime = new Date(reminder.startDate + 'T' + reminder.time);
    const now = new Date();
    
    if (reminderTime > now) {
        const timeUntilReminder = reminderTime - now;
        
        setTimeout(() => {
            if (Notification.permission === 'granted') {
                new Notification(`Medicine Reminder: ${reminder.name}`, {
                    body: `Time to take ${reminder.quantity} ${reminder.type}(s)\n${reminder.notes}`,
                    icon: '/favicon.png'
                });
            }
            
            // Play notification sound
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            audio.play();
        }, timeUntilReminder);
    }
}

// Initialize reminders display when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('medicine_reminder')) {
        displayReminders();
    }
});