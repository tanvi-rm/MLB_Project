document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const profileName = document.querySelector('.profile-header h1');
  const profileEmail = document.querySelector('.profile-email');
  const profileBio = document.querySelector('.profile-bio');
  const profileImage = document.querySelector('.profile-picture img');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const profileImageInput = document.getElementById('profileImage');
  const dobEl = document.getElementById('dob');
  const descriptionEl = document.getElementById('description');
  const profilePreview = document.getElementById('profilePreview');

  const blogCountEl = document.querySelector('.blog-count');
  const likeCountEl = document.querySelector('.like-count');
  const commentCountEl = document.querySelector('.comment-count');

  document.getElementById('submitChangeBtn').addEventListener('click', updateProfile);

  // Fetch and load user profile data
  async function loadProfile() {
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to load profile");

      const data = await res.json();
      console.log("✅ Profile Data:", data);

      // Fill the profile card
      document.querySelector(".profile-card h1").textContent = data.fullName;
      document.querySelector(".profile-card p.text-lg").textContent = data.bio;
      document.querySelectorAll(".profile-card p.text-white")[0].textContent = data.fullName;
      document.querySelectorAll(".profile-card p.text-white")[1].textContent = data.user.email;
      document.querySelectorAll(".profile-card p.text-white")[2].textContent = new Date(data.dob).toLocaleDateString();

      // Set stats
      document.querySelectorAll(".profile-card p.text-3xl")[0].textContent = data.stats.blogsWritten;
      document.querySelectorAll(".profile-card p.text-3xl")[1].textContent = data.stats.likesReceived;
      document.querySelectorAll(".profile-card p.text-3xl")[2].textContent = data.stats.commentsReceived;

      // Set profile image
      document.querySelector(".profile-card img").src = `/uploads/profile-images/${data.profileImage}`;
      profilePreview.src = `/uploads/profile-images/${data.profileImage}`;

      // Pre-fill edit form
      document.getElementById("fullName").value = data.fullName;
      document.getElementById("email").value = data.user.email;
      document.getElementById("dob").value = data.dob.substring(0, 10);
      document.getElementById("description").value = data.bio;

      // 🔥 Load User Contributions
      await loadUserContributions(data.user._id);

    } catch (err) {
      console.error("⚠️ Error loading profile:", err);
      alert("Unable to load profile. Please login again.");
      window.location.href = "/signin.html";
    }
  }

  // Update Profile
  async function updateProfile() {
  const fullName = fullNameInput ? fullNameInput.value : "";
  const bio = descriptionEl ? descriptionEl.value : "";
  const dob = dobEl ? dobEl.value : "";

  const formData = new FormData();
  formData.append("fullName", fullName);
  formData.append("bio", bio);
  formData.append("dob", dob);

  if (profileImageInput.files[0]) {
    formData.append("profileImage", profileImageInput.files[0]);
  }

  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      body: formData,
      credentials: 'include'
    });

    // Always parse response JSON safely
    let result;
    try {
      result = await res.json();
    } catch {
      result = {};
    }

    if (res.ok) {
      alert('✅ Profile updated successfully!');
      console.log("Server response:", result);
      loadProfile(); // Reload updated profile
    } else {
      console.error("Server responded with error:", result);
      alert("⚠️ Profile updated but server responded with an error.");
    }
  } catch (err) {
    console.error("Fetch error:", err);
    alert("❌ Network or server error. Profile may not have updated.");
  }
}


  // 🔥 Load User Contributions
  async function loadUserContributions(userId) {
    try {
      const res = await fetch(`/api/blogs/user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user contributions");

      const blogs = await res.json();
      console.log("📚 User Contributions:", blogs);

      const contributionContainer = document.getElementById("userContributions");
      contributionContainer.innerHTML = ""; // Clear previous content

      if (blogs.length === 0) {
        contributionContainer.innerHTML = `
          <p class="text-gray-400 italic">This user hasn’t written any blogs yet.</p>
        `;
        return;
      }

      blogs.forEach(blog => {
        contributionContainer.appendChild(createBlogCard(blog));
      });

    } catch (err) {
      console.error("⚠️ Error loading user contributions:", err);
      const contributionContainer = document.getElementById("userContributions");
      contributionContainer.innerHTML = `
        <p class="text-red-500">Failed to load contributions. Please try again later.</p>
      `;
    }
  }

  // 🎨 Create a Blog Card (reuse from explore.js)
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

    // Click handler: open blog page
    card.addEventListener("click", () => {
      window.location.href = `/readBlog.html?id=${blog._id}`;
    });

    return card;
  }

  // Fetch and update live stats
async function fetchProfileStats() {
  try {
    const res = await fetch('/api/profile/stats', { credentials: 'include' });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return await res.json();
  } catch (err) {
    console.error("⚠️ Stats fetch error:", err);
    return { blogsWritten: 0, likesReceived: 0, commentsReceived: 0 };
  }
}

const stats = await fetchProfileStats();

// Update the stats numbers in the DOM
const statEls = document.querySelectorAll(".profile-card p.text-3xl");
statEls[0].textContent = stats.blogsWritten;
statEls[1].textContent = stats.likesReceived;
statEls[2].textContent = stats.commentsReceived;

  // Initial load
  loadProfile();
});
