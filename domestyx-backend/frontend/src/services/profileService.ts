import axios from './axiosConfig.ts'; // Ensure you have an axios instance configured with your base URL

// Function to get the base user profile (first_name, last_name, etc.)
export const getBaseUserProfile = async () => {
    try {
        const response = await axios.get('/api/auth/profile/');
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Error fetching base user profile:", error);
        return { success: false, error: 'Failed to fetch user profile' };
    }
};

// Function to update the base user profile
export const updateBaseUserProfile = async (userData: any) => {
    try {
        const response = await axios.put('/api/auth/profile/', userData);
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Error updating base user profile:", error);
        return { success: false, error: 'Failed to update user profile' };
    }
};

// Function to get the worker profile
export const getWorkerProfile = async () => {
    try {
        const response = await axios.get('/api/auth/worker-profile/');
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Error fetching worker profile:", error);
        return { success: false, error: 'Failed to fetch worker profile' };
    }
};

// Function to update the worker profile
export const updateWorkerProfile = async (profileData: any) => {
    try {
        const response = await axios.put('/api/auth/worker-profile/', profileData);
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Error updating worker profile:", error);
        return { success: false, error: 'Failed to update worker profile' };
    }
};