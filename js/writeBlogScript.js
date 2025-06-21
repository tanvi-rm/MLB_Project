// Initialize Quill Editor
const quill = new Quill("#editor", {
  theme: "snow",
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image", "video"],
      ["clean"],
    ],
  },
  placeholder: "Write your blog content here...",
});

// Track Word Count
quill.on("text-change", function () {
  const text = quill.getText().trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  document.getElementById("word-count").textContent = `${wordCount} words`;
  document.getElementById("auto-save-status").textContent = "Auto-saving...";
  setTimeout(() => {
    document.getElementById("auto-save-status").textContent = "Auto-saved";
  }, 1000);
});

// Language Selection
let selectedLanguage = "";
document.querySelectorAll(".language-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".language-btn").forEach((b) =>
      b.classList.replace("bg-purple-600", "bg-gray-200")
    );
    btn.classList.replace("bg-gray-200", "bg-purple-600");
    selectedLanguage = btn.dataset.lang;
  });
});

// Plagiarism Simulation
let plagiarismChecked = false;
let currentPlagiarismScore = null;

document.getElementById("plagiarism-check-btn").addEventListener("click", function () {
  const btn = this;
  btn.textContent = "Checking...";
  btn.disabled = true;

  setTimeout(() => {
    plagiarismChecked = true;
    currentPlagiarismScore = Math.floor(Math.random() * 30); // 0–29%
    const resultDiv = document.getElementById("plagiarism-result");
    const scoreEl = document.getElementById("plagiarism-score");
    const msgEl = document.getElementById("plagiarism-message");
    const detailsEl = document.getElementById("plagiarism-details");

    resultDiv.classList.remove("hidden");
    resultDiv.className = "p-3 rounded-lg text-sm font-medium";

    if (currentPlagiarismScore < 10) {
      resultDiv.classList.add("plagiarism-low");
      msgEl.textContent = "Low plagiarism detected";
      detailsEl.textContent = "Your content appears original.";
    } else if (currentPlagiarismScore < 20) {
      resultDiv.classList.add("plagiarism-medium");
      msgEl.textContent = "Moderate plagiarism detected";
      detailsEl.textContent = "Consider revising a few parts.";
    } else {
      resultDiv.classList.add("plagiarism-high");
      msgEl.textContent = "High plagiarism detected";
      detailsEl.textContent = "Please revise before publishing.";
    }

    scoreEl.textContent = `${currentPlagiarismScore}%`;
    btn.textContent = "Check Again";
    btn.disabled = false;
  }, 2000);
});

// ✅ Session Info
let currentUserId = "";
let currentUserName = "";

async function fetchSessionInfo() {
  try {
    const res = await fetch("/api/session");
    if (!res.ok) throw new Error("Not authenticated");

    const data = await res.json();
    currentUserId = data.userId;
    currentUserName = data.userName;

    console.log("✅ Logged in as:", currentUserName);
  } catch (err) {
    console.error("Session fetch failed:", err);
    alert("⚠️ You must be logged in to write a blog.");
    window.location.href = "/signin.html";
  }
}

// Show error inline
function showError(id, msg) {
  let el = document.getElementById(id);
  if (!el) {
    const input = document.getElementById(id.replace("error-", ""));
    el = document.createElement("span");
    el.id = id;
    el.className = "text-red-600 text-sm";
    input.parentNode.appendChild(el);
  }
  el.textContent = msg;
  el.classList.remove("hidden");
}

// Hide error
function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

// Validate all fields
function validateFields() {
  let valid = true;

  const title = document.getElementById("blog-title").value.trim();
  const category = document.getElementById("blog-category").value.trim();
  const description = document.getElementById("blog-description").value.trim();
  const tags = document.getElementById("blog-tags").value.trim();
  const content = quill.root.innerHTML.trim();
  const coverImage = document.getElementById("file-upload").files[0];

  if (!title) { showError("error-title", "Title is required."); valid = false; } else hideError("error-title");
  if (!category) { showError("error-category", "Select a category."); valid = false; } else hideError("error-category");
  if (!description) { showError("error-description", "Description is required."); valid = false; } else hideError("error-description");
  if (!tags) { showError("error-tags", "Tags are required."); valid = false; } else hideError("error-tags");
  if (!content || content === "<p><br></p>") { showError("error-content", "Content is empty."); valid = false; } else hideError("error-content");
  if (!selectedLanguage) { showError("error-language", "Select a language."); valid = false; } else hideError("error-language");
  if (!coverImage) { showError("error-image", "Upload cover image."); valid = false; } else hideError("error-image");

  if (!plagiarismChecked) {
    showError("error-plagiarism", "Please check for plagiarism.");
    valid = false;
  } else if (currentPlagiarismScore > 20) {
    showError("error-plagiarism", "Plagiarism too high to publish.");
    valid = false;
  } else {
    hideError("error-plagiarism");
  }

  return valid;
}

// Publish handler
document.getElementById("publish-btn").addEventListener("click", async function () {

  if (!currentUserId) {
  alert("⚠️ You are not logged in. Please sign in again.");
  return;
}
  if (!validateFields()) return;

  const formData = new FormData();
  formData.append("title", document.getElementById("blog-title").value.trim());
  formData.append("category", document.getElementById("blog-category").value.trim());
  formData.append("description", document.getElementById("blog-description").value.trim());
  formData.append("tags", document.getElementById("blog-tags").value.trim());
  formData.append("content", quill.root.innerHTML.trim());
  formData.append("language", selectedLanguage);
  formData.append("coverImage", document.getElementById("file-upload").files[0]);
  formData.append("authorId", currentUserId);
  formData.append("authorName", currentUserName);

  try {
    const res = await fetch("/api/blogs/write", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (res.ok) {
      alert("✅ Blog published!");
      window.location.href = "/index.html";
    } else {
      alert("❌ Failed: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Error: " + err.message);
  }
});

window.addEventListener("DOMContentLoaded", fetchSessionInfo);
