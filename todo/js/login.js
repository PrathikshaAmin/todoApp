document.getElementById("loginForm").addEventListener("input", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const loginButton = document.getElementById("loginButton");

  // Enable the button only if both fields are filled
  loginButton.disabled = !(email && password);
});

// Redirect to dashboard if already logged in
if (localStorage.getItem("token")) {
  window.location.href = "dashboard.html";
}

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("errorMessage");
  const loading = document.getElementById("loading");

  // Basic validation
  if (!email) {
    if (errorMessage) {
      errorMessage.textContent = "Email is required!";
      errorMessage.style.display = "block";
    }
    document.getElementById("email").focus();
    return;
  }

  if (!password) {
    if (errorMessage) {
      errorMessage.textContent = "Password is required!";
      errorMessage.style.display = "block";
    }
    document.getElementById("password").focus();
    return;
  }

  // Show loading indicator
  if (loading) loading.style.display = "block";
  if (errorMessage) errorMessage.style.display = "none";

  try {
    const res = await fetch("http://localhost:5000/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("Response Status:", res.status);
    console.log("Response Data:", data);

    if (res.ok) {
      // Store user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      
      // Optional: store user name if available in response
      if (data.user && data.user.name) {
        localStorage.setItem("userName", data.user.name);
      }

      // Success message
      alert("Login successful! ✅");
      
      // Redirect to dashboard (changed from login.html)
      window.location.href = 'dashboard.html';
    } else {
      if (errorMessage) {
        errorMessage.textContent = data.message || "Login failed.";
        errorMessage.style.display = "block";
      }
    }
  } catch (err) {
    console.error("Error:", err);
    if (errorMessage) {
      errorMessage.textContent = "An error occurred. Please try again later.";
      errorMessage.style.display = "block";
    }
  } finally {
    // Hide loading indicator
    if (loading) loading.style.display = "none";
  }
});
