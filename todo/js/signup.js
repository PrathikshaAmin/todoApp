document.addEventListener('DOMContentLoaded', () => {
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const signupButton = document.getElementById('signupButton');
  const errorMessage = document.getElementById('signupErrorMessage');

  // Enable the signup button when all fields are filled
  const toggleButtonState = () => {
    if (
      nameInput.value.trim() !== '' &&
      emailInput.value.trim() !== '' &&
      passwordInput.value.trim() !== ''
    ) {
      signupButton.disabled = false;
    } else {
      signupButton.disabled = true;
    }
  };

  // Ensure the button state is correct on page load
  toggleButtonState();

  // Add event listeners to input fields
  nameInput.addEventListener('input', toggleButtonState);
  emailInput.addEventListener('input', toggleButtonState);
  passwordInput.addEventListener('input', toggleButtonState);

  // Handle form submission
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      const response = await fetch('http://localhost:5000/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        // Signup successful
        alert('Account created successfully!');
          window.location.href = "login.html"; // Redirect to login page
      } else {
        // Show error message
        errorMessage.style.display = 'block';
        errorMessage.textContent = data.message || 'An error occurred during signup.';
      }
    } catch (err) {
      console.error('Error during signup:', err);
      errorMessage.style.display = 'block';
      errorMessage.textContent = 'An error occurred. Please try again.';
    }
  });
});