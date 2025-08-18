document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const alertBox = document.getElementById("formAlert");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value,
      message: form.message.value.trim(),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        // ✅ Show response message only after submission
        alertBox.textContent = result.message;
        alertBox.className = "text-green-600 text-center mt-4 font-medium";
        form.reset();
      } else {
        alertBox.textContent = result.message || "Submission failed.";
        alertBox.className = "text-red-600 text-center mt-4 font-medium";
      }
    } catch (err) {
      alertBox.textContent = "Something went wrong.";
      alertBox.className = "text-red-600 text-center mt-4 font-medium";
    }
  });
});
