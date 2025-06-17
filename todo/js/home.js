document.addEventListener("DOMContentLoaded", () => {
  // Check if the user is logged in
  const token = localStorage.getItem("token");

  if (!token) {
    // If no token is found, redirect to the login page
    console.log("No token found. Redirecting to login page.");
    window.location.href = "login.html";
  } else {
    // Optionally, fetch user-specific data using the token
    console.log("User is logged in. Token:", token);
    fetchTasks(token); // Fetch tasks when the page loads
  }
});

function logout() {
  // Remove the JWT token from localStorage
  localStorage.removeItem("token");

  // Redirect to the login page
  console.log("User logged out. Redirecting to login page.");
  window.location.href = "login.html";
}

// Function to fetch tasks
async function fetchTasks(token) {
  try {
    const response = await fetch("http://localhost:5000/tasks", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Response Status:", response.status);

    if (response.ok) {
      const tasks = await response.json();
      console.log("Tasks Fetched:", tasks);

      const taskList = document.getElementById("taskList");
      taskList.innerHTML = ""; // Clear existing tasks

      tasks.forEach((task) => {
        const li = document.createElement("li");
        li.textContent = task.name;
        taskList.appendChild(li);
      });
    } else {
      console.error("Failed to fetch tasks:", response.status);
    }
  } catch (err) {
    console.error("Error fetching tasks:", err);
  }
}