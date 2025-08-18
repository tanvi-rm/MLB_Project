document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuButton = document.getElementById("mobileMenuButton");
  const mobileMenu = document.getElementById("mobileMenu");

  // Function to update auth section based on login status
  function updateAuthSection() {
    // Check login status (using session API)
    fetch('/api/session')
      .then(response => response.json())
      .then(data => {
        const isLoggedIn = !data.message; // If no "message", user is logged in
        
        // Desktop auth section
        const desktopAuth = document.querySelector('.desktop-auth');
        // Mobile auth section
        const mobileAuth = document.querySelector('.mobile-auth');
        
        if (isLoggedIn) {
          // User is logged in - show profile image
          const profileHtml = `
            <a href="/profile.html">
              <img src="assests/profile-user1.png" alt="Profile" 
                   class="w-9 h-9 rounded-full border-2 border-purple-500 hover:border-purple-300 transition">
            </a>`;
          
          desktopAuth.innerHTML = profileHtml;
          mobileAuth.innerHTML = `
            <div class="pt-2">
              <a href="/profile.html" class="flex justify-center">
                ${profileHtml}
              </a>
            </div>`;
        } else {
          // User is not logged in - show login/signup buttons
          desktopAuth.innerHTML = `
            <a href="/signin.html" class="text-gray-200 hover:text-white hover:bg-purple-700 font-medium bg-purple-800 py-2 px-4 rounded-full">
              Log In
            </a>
            <a href="/signup.html" class="text-gray-200 hover:text-white hover:bg-purple-700 font-medium bg-purple-800 py-2 px-4 rounded-full ml-2">
              Sign Up
            </a>`;
          
          mobileAuth.innerHTML = `
            <div class="flex space-x-4 pt-2">
              <a href="/signin.html" class="flex-1 text-center text-gray-200 hover:text-white hover:bg-purple-700 font-medium bg-purple-800 py-2 px-4 rounded-full">
                Log In
              </a>
              <a href="/signup.html" class="flex-1 text-center text-gray-200 hover:text-white hover:bg-purple-700 font-medium bg-purple-800 py-2 px-4 rounded-full">
                Sign Up
              </a>
            </div>`;
        }
      })
      .catch(error => {
        console.error('Error checking session:', error);
      });
  }

  // Mobile menu toggle functionality (keep your existing code)
  mobileMenuButton.addEventListener("click", function () {
    mobileMenu.classList.toggle("open");
    
    // Update icon
    if (mobileMenu.classList.contains("open")) {
      mobileMenuButton.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>`;
    } else {
      mobileMenuButton.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>`;
    }
  });

  // Initialize auth section
  updateAuthSection();
  setInterval(updateAuthSection, 2000);
});