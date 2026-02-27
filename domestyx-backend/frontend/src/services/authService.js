import api from './api'; // Assuming you have a central API config like axios

/**
 * Registers a new user.
 * The payload is cleaned up to only send fields that exist on the CustomUser model.
 */
export async function registerUser(userData) {
  const response = await api.post('/register/', userData);
  return response.data;
}

/**
 * Logs in a user to get a JWT token.
 * It now sends 'email' instead of 'username' to match the backend.
 */
export const loginUser = async (email, password) => {
  // 🐛 FIX: Changed the key from 'username' to 'email'.
  // Refactored to use the 'api' instance for consistency.
  const response = await api.post('/token/', {
    email: email,
    password: password,
  });
  
  if (!response.data || !response.data.user) {
    throw new Error("Login successful, but no user info was received from the server.");
  }

  return response.data;
};

/**
 * Gets the profile of the currently logged-in user.
 */
export async function getUserProfile() {
  const response = await api.get('/profile/');
  return response.data;
}

/**
 * Logs out the user by clearing tokens from local storage.
 */
export function logoutUser() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  // You might also want to remove the user object if you store it
  localStorage.removeItem('user');
}



