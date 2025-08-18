document.addEventListener("DOMContentLoaded", () => {
  let originalBlog = null;
  let currentBlogId = null;
  let isLiked = false;
  let likeCount = 0;

  // DOM Elements
  const blogId = new URLSearchParams(window.location.search).get("id");
  const titleEl = document.querySelector("h1#blogTitle");
  const descEl = document.querySelector("p#blogDesc");
  const authorNameEl = document.querySelector("#authorName");
  const authorAvatarEl = document.querySelector("#authorAvatar");
  const dateEl = document.querySelector("#lastUpdated");
  const coverImage = document.querySelector("#blogCoverImage");
  const contentEl = document.querySelector("#blogContent");
  const tagsEl = document.querySelector("#blogTags");
  const categoryEl = document.querySelector("#blogCategory");
  const likeCountEl = document.querySelector(".like-count");

  if (!blogId) {
    renderErrorState("No blog ID found in URL");
    return;
  }

  // Initialize the blog
  loadBlog(blogId);

  // Notification functions
  function showErrorToast(message) {
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  function showSuccessToast(message) {
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  async function loadBlog(blogId) {
    try {
      currentBlogId = blogId;
      const response = await fetch(`/api/blogs/${blogId}`);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const blog = await response.json();
      originalBlog = blog;

      // Update like status
      likeCount = blog.likes || 0;
      isLiked = false; // Will be updated by checkInitialLikeState

      renderBlog(blog);
      setupLanguageSwitcher(blog);
      await checkInitialLikeState(blogId); // Check if user already liked
      loadComments(blog.comments || []);
      // Set up event handlers after everything is loaded
      setupLikeHandler(blogId);
      setupCommentHandler(blogId);
      setupShareHandler();
    } catch (err) {
      console.error("Failed to load blog:", err);
      renderErrorState("Failed to load blog. Please try again later.");
    }
  }

  async function translateText(text, targetLang) {
    if (!text) return text;

    // Using the unofficial Google Translate API endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    try {
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();

      // Extract translated text from the complex response structure
      if (Array.isArray(data) && data[0] && Array.isArray(data[0][0])) {
        return data[0].map((sentence) => sentence[0]).join(" ");
      }
      return text; // Return original if format unexpected
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Return original text on failure
    }
  }

  async function translateBlog(blog, lang) {
    // Show loading state
    contentEl.innerHTML = `
      <div class="text-center py-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p>Translating to ${lang === "hi" ? "Hindi" : "Marathi"}...</p>
      </div>
    `;

    try {
      // Translate sequentially to maintain context
      const translated = {
        ...blog,
        title: await translateText(blog.title, lang),
        description: await translateText(blog.description, lang),
        content: await translateText(blog.content, lang),
        category: await translateText(blog.category || "Uncategorized", lang),
        tags: await Promise.all(
          (blog.tags || []).map((tag) => translateText(tag, lang))
        ),
      };

      return translated;
    } catch (error) {
      console.error("Blog translation failed:", error);
      alert("Translation failed - showing original content");
      return blog;
    }
  }

  function setupLanguageSwitcher(blog) {
    document.querySelectorAll(".language-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const lang = btn.dataset.lang;
        const allButtons = document.querySelectorAll(".language-btn");

        // Disable all buttons during translation
        allButtons.forEach((b) => {
          b.disabled = true;
          b.classList.add("opacity-50");
        });

        btn.innerHTML = `
          <span class="inline-flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Translating...
          </span>
        `;

        try {
          const translated = await translateBlog(blog, lang);
          renderBlog(translated);
          toggleActiveLangBtn(btn);
        } catch (error) {
          console.error("Translation failed:", error);
          alert("Translation failed. Please try again.");
        } finally {
          allButtons.forEach((b) => {
            b.disabled = false;
            b.classList.remove("opacity-50");
          });
          btn.textContent = getLanguageButtonText(lang);
        }
      });
    });
  }

  function toggleActiveLangBtn(activeBtn) {
    document.querySelectorAll(".language-btn").forEach((btn) => {
      btn.classList.remove("bg-purple-600", "text-white");
      btn.classList.add("bg-transparent", "text-gray-700");
    });
    activeBtn.classList.remove("bg-transparent", "text-gray-700");
    activeBtn.classList.add("bg-purple-600", "text-white");
  }

  function getLanguageButtonText(lang) {
    return lang === "en"
      ? "English"
      : lang === "hi"
      ? "हिन्दी (Hindi)"
      : "मराठी (Marathi)";
  }

  function renderBlog(blog) {
    titleEl.textContent = blog.title;
    descEl.textContent = blog.description;
    authorNameEl.textContent = blog.author?.name || "Unknown";
    authorAvatarEl.textContent = getInitials(blog.author?.name || "U");
    dateEl.textContent = `Last updated: ${new Date(
      blog.updatedAt || blog.createdAt
    ).toLocaleDateString()}`;
    coverImage.src = blog.coverImage
      ? `/uploads/${blog.coverImage}`
      : "assets/default-blog.jpg";
    contentEl.innerHTML = blog.content || "<p>No content available</p>";

    // Render category
    categoryEl.textContent = `Category: ${blog.category || "Uncategorized"}`;

    // Render tags
    tagsEl.innerHTML = "";
    if (blog.tags?.length > 0) {
      blog.tags.forEach((tag) => {
        const span = document.createElement("span");
        span.className =
          "inline-block bg-purple-200 text-purple-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded";
        span.textContent = `#${tag.trim()}`;
        tagsEl.appendChild(span);
      });
    }
  }

  function renderErrorState() {
    contentEl.innerHTML = `
      <div class="text-center py-20">
        <h2 class="text-2xl font-bold text-red-600 mb-4">Failed to load blog</h2>
        <p class="text-gray-600 mb-4">Please try refreshing the page or check back later.</p>
        <button onclick="window.location.reload()" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          Refresh Page
        </button>
      </div>
    `;
  }

  function getInitials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  // ========================
  // Engagement Functions
  // ========================

  async function isLoggedIn() {
    try {
      const response = await fetch("/api/session");
      if (!response.ok) return false;
      const data = await response.json();
      return !!data.userId;
    } catch (error) {
      console.error("Session check error:", error);
      return false;
    }
  }

  function showLoginToast(message) {
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg flex items-center";
    toast.innerHTML = `
    <span>${message}</span>
    <a href="/signin.html" class="ml-4 text-purple-200 underline">Login</a>
    <button onclick="this.parentElement.remove()" class="ml-4 text-white">&times;</button>
  `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  async function setupCommentHandler(blogId) {
    const form = document.querySelector("form");
    if (!form) return;

    // Define the submit handler separately
    async function submitHandler(e) {
      e.preventDefault();

      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        showLoginToast("Please login to post a comment");
        return;
      }

      const textarea = form.querySelector("textarea");
      const content = textarea.value.trim();

      if (!content) {
        showErrorToast("Comment cannot be empty");
        return;
      }

      const submitBtn = form.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
      <span class="inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Posting...
      </span>
    `;

      try {
        const response = await fetch(`/api/blogs/${blogId}/comments`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) throw new Error("Comment failed");

        const comment = await response.json();
        displayComment(comment);
        updateCommentCount(1); // Increment comment count
        form.reset();
      } catch (error) {
        console.error("Comment error:", error);
        showErrorToast("Failed to post comment. Please try again.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Post Comment";
      }
    }

    // Remove any existing listener to prevent duplicate submissions
    form.removeEventListener("submit", submitHandler);
    console.log("Attaching submit handler for blog:", blogId);

    form.addEventListener("submit", submitHandler);
  }

  function updateCommentCount(count) {
    document.querySelectorAll(".comment-count").forEach((el) => {
      el.textContent = count;
    });
  }

  function loadComments(comments) {
    const container = document.querySelector(".comments-container");
    if (!container) return;

    container.innerHTML = "";
    updateCommentCount(comments.length);

    comments.forEach((comment) => {
      displayComment(comment);
    });
  }

  function displayComment(comment) {
    const container = document.querySelector(".comments-container");
    if (!container) return;

    const commentHTML = `
    <div class="flex space-x-4 mb-4">
      <div class="w-10 h-10 rounded-full bg-purple-700 flex-shrink-0 flex items-center justify-center text-white font-bold">
        ${getInitials(comment.user?.name || "U")}
      </div>
      <div class="bg-gray-100 rounded-xl p-4 flex-grow">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-medium text-gray-800">${
            comment.user?.name || "Anonymous"
          }</h4>
          <span class="text-xs text-gray-500">${new Date(
            comment.createdAt
          ).toLocaleString()}</span>
        </div>
        <p class="text-gray-600">${comment.text}</p>
      </div>
    </div>
  `;

    container.insertAdjacentHTML("beforeend", commentHTML);
  }

  function setupShareHandler() {
    const shareBtns = document.querySelectorAll(".share-btn");

    shareBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const url = window.location.href;
        const title = document.querySelector("h1#blogTitle").textContent;

        if (navigator.share) {
          navigator
            .share({
              title: title,
              url: url,
            })
            .catch((err) => {
              console.error("Share failed:", err);
              copyToClipboard(url);
            });
        } else {
          copyToClipboard(url);
        }
      });
    });
  }

  async function checkInitialLikeState(blogId) {
    try {
      const response = await fetch(`/api/blogs/${blogId}/like-status`, {
        credentials: "include", // Crucial for sessions
      });

      if (!response.ok) {
        const data = await response.json();
        console.log("Like status response:", data);
        updateLikeUI(data.likes || 0, false);
        return;
      }

      const data = await response.json();
      updateLikeUI(data.likes, data.isLiked);
    } catch (error) {
      console.error("Like check error:", error);
      updateLikeUI(0, false);
    }
  }

  async function setupLikeHandler(blogId) {
    const likeBtns = document.querySelectorAll(".like-btn");

    likeBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        // Get heart icon INSIDE the click handler
        const heartIcon = btn.querySelector(".heart-icon");

        try {
          btn.disabled = true;
          if (heartIcon) heartIcon.classList.add("animate-pulse");

          const response = await fetch(`/api/blogs/${blogId}/like`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Like action failed");
          }

          const data = await response.json();
          updateLikeUI(data.likes, data.isLiked);
        } catch (error) {
          console.error("Like error:", error);
          showToast(error.message || "Failed to update like", "error");
        } finally {
          btn.disabled = false;
          if (heartIcon) heartIcon.classList.remove("animate-pulse");
        }
      });
    });
  }

  // Add this helper function if missing
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${
      type === "error" ? "bg-red-500" : "bg-green-500"
    } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }
  // Update like UI everywhere
  function updateLikeUI(count, liked, animate = true) {
    document.querySelectorAll(".like-btn").forEach((btn) => {
      const heartIcon = btn.querySelector(".heart-icon");
      const countSpan = btn.querySelector(".like-count");

      countSpan.textContent = count;

      if (liked) {
        heartIcon.classList.add("text-red-500", "fill-red-500");
        if (animate) {
          heartIcon.classList.add("animate-bounce");
          setTimeout(() => heartIcon.classList.remove("animate-bounce"), 1000);
        }
      } else {
        heartIcon.classList.remove("text-red-500", "fill-red-500");
      }
    });
  }

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Clipboard API writeText failed:", err);
        // Fallback for older browsers or specific security contexts
        try {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed"; // Prevent scrolling to bottom of page
          textarea.style.top = "0";
          textarea.style.left = "0";
          textarea.style.opacity = "0"; // Make it invisible
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select(); // Select the text

          const successful = document.execCommand("copy");
          document.body.removeChild(textarea);

          if (successful) {
            alert("Link copied to clipboard! (Fallback)");
          } else {
            // This might happen if execCommand fails (e.g., no user gesture, or browser doesn't allow)
            alert(
              "Could not copy link to clipboard. Please copy manually: " + text
            );
            console.warn("document.execCommand('copy') failed.");
          }
        } catch (execErr) {
          console.error("Fallback copy failed entirely:", execErr);
          alert(
            "Could not copy link to clipboard. Please copy manually: " + text
          );
        }
      });
  }

  // if (blogId) {
  //   loadBlog(blogId);
  // } else {
  //   renderErrorState("No blog ID found in URL");
  // }
});
