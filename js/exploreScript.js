document.addEventListener("DOMContentLoaded", () => {
  const categories = [
    "technology",
    "travel",
    "nature",
    "lifestyle",
    "personal",
    "education",
  ];
  const allBlogsByCategory = {};
  let allBlogs = [];

  const searchResultsSection = document.getElementById("searchResultsSection");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  // Ensure search result section is hidden on page load
  if (searchResultsSection) {
    searchResultsSection.style.display = "none";
  }

  // Fetch blogs from API
  fetch("/api/blogs/public")
    .then((res) => res.json())
    .then((blogs) => {
      allBlogs = blogs;

      blogs.forEach((blog) => {
        const category = blog.category?.toLowerCase();
        if (!allBlogsByCategory[category]) {
          allBlogsByCategory[category] = [];
        }
        allBlogsByCategory[category].push(blog);
      });

      renderBlogs("all");
      setupCategoryButtons();
      setupSearchInput();
    })
    .catch((err) => {
      console.error("❌ Failed to fetch blogs:", err);
    });

  function renderBlogs(selectedCategory) {
    // Hide everything initially
    document.querySelectorAll(".container.mx-auto.mb-12").forEach((el) => {
      el.style.display = "none";
    });
    if (searchResultsSection) searchResultsSection.style.display = "none";

    if (selectedCategory === "all") {
      document.querySelectorAll(".container.mx-auto.mb-12").forEach((el) => {
        el.style.display = "block";
      });

      categories.forEach((cat) => {
        const container = document.querySelector(
          `.category-${capitalize(cat)}`
        );
        if (!container) return;
        container.innerHTML = "";

        (allBlogsByCategory[cat] || []).forEach((blog) => {
          container.appendChild(createBlogCard(blog));
        });
      });

      const mostViewed = document.getElementById("mostViewedBlogs");
      if (mostViewed) {
        mostViewed.innerHTML = "";
        allBlogs.forEach((blog) => {
          mostViewed.appendChild(createBlogCard(blog));
        });
      }
    } else {
      const section = document
        .querySelector(`.category-${capitalize(selectedCategory)}`)
        ?.closest(".container.mx-auto.mb-12");
      if (section) section.style.display = "block";

      const container = document.querySelector(
        `.category-${capitalize(selectedCategory)}`
      );
      if (container) {
        container.innerHTML = "";
        (allBlogsByCategory[selectedCategory] || []).forEach((blog) => {
          container.appendChild(createBlogCard(blog));
        });
      }
    }
  }

  function setupCategoryButtons() {
    const buttons = document.querySelectorAll(".category-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const selected = btn.getAttribute("data-category");
        if (searchInput) searchInput.value = "";

        buttons.forEach((b) => {
          b.classList.remove("bg-purple-600", "text-white");
          b.classList.add("bg-white", "text-gray-800");
        });
        btn.classList.remove("bg-white", "text-gray-800");
        btn.classList.add("bg-purple-600", "text-white");

        renderBlogs(selected);
      });
    });
  }

  function setupSearchInput() {
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim().toLowerCase();

      if (!query) {
        searchResultsSection.style.display = "none";
        renderBlogs("all");
        return;
      }

      const results = allBlogs.filter((blog) => {
        const titleMatch = blog.title?.toLowerCase().includes(query);
        const descMatch = blog.description?.toLowerCase().includes(query);
        const contentMatch = blog.content?.toLowerCase().includes(query);
        const authorMatch = blog.author?.name?.toLowerCase().includes(query);
        const categoryMatch = query.includes("blogs")
          ? query.includes(blog.category?.toLowerCase())
          : blog.category?.toLowerCase().includes(query);

        return (
          titleMatch ||
          descMatch ||
          contentMatch ||
          authorMatch ||
          categoryMatch
        );
      });

      document.querySelectorAll(".container.mx-auto.mb-12").forEach((el) => {
        el.style.display = "none";
      });

      searchResultsSection.style.display = "block";
      searchResults.innerHTML = "";

      if (results.length === 0) {
        searchResults.innerHTML = `<p class="text-white text-lg">No blogs found.</p>`;
      } else {
        results.forEach((blog) => {
          searchResults.appendChild(createBlogCard(blog));
        });
      }
    });
  }

  function createBlogCard(blog) {
    const card = document.createElement("div");
    card.className =
      "blog-card bg-white rounded-xl overflow-hidden shadow-lg transition duration-300 border border-gray-200 flex-shrink-0 w-80";

    card.innerHTML = `
      <div class="h-48 bg-gradient-to-r from-blue-100 to-purple-100 relative overflow-hidden">
        <img src="/uploads/${blog.coverImage}" alt="${
      blog.title
    }" class="w-full h-full object-cover" />
      </div>
      <div class="p-6">
        <h3 class="text-xl font-bold mb-2 text-gray-800">${blog.title}</h3>
        <p class="text-sm text-gray-500 mb-4">${
          blog.author?.name || "Anonymous"
        }</p>
        <p class="text-gray-600">${
          blog.description || blog.content?.slice(0, 100) + "..."
        }</p>
      </div>
    `;

    // Blog click — go to readblog.html
    card.addEventListener("click", () => {
      window.location.href = `/readblog.html?id=${blog._id}`;
    });

    return card;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
