document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 indexScript.js loaded and running!");

  const mostViewedContainer = document.getElementById("mostViewedBlogs");

  fetch("/api/blogs/public")
    .then((res) => res.json())
    .then((blogs) => {
      // Sort blogs by createdAt DESC (latest first)
      blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Show only latest 6 blogs
      blogs.slice(0, 6).forEach((blog) => {
        mostViewedContainer.appendChild(createBlogCard(blog));
      });
    })
    .catch((err) => {
      console.error("❌ Failed to load blogs:", err);
      mostViewedContainer.innerHTML = `
        <p class="text-white text-center">Failed to load blogs.</p>
      `;
    });

  function createBlogCard(blog) {
    const card = document.createElement("div");
    card.className =
      "blog-card bg-white rounded-xl overflow-hidden shadow-lg transition duration-300 border border-gray-200 flex-shrink-0 w-80";

    card.innerHTML = `
      <div class="h-48 bg-gradient-to-r from-blue-100 to-purple-100 relative overflow-hidden">
        <img src="/uploads/${blog.coverImage}" alt="${blog.title}" class="w-full h-full object-cover" />
      </div>
      <div class="p-6">
        <h3 class="text-xl font-bold mb-2 text-gray-800">${blog.title}</h3>
        <p class="text-sm text-gray-500 mb-4">${blog.author?.name || "Anonymous"}</p>
        <p class="text-gray-600">
          ${blog.description || blog.content.slice(0, 100) + "..."}
        </p>
      </div>
    `;

    // Click handler to open blog
    card.addEventListener("click", () => {
      window.location.href = `/readBlog.html?id=${blog._id}`;
    });

    return card;
  }
});
