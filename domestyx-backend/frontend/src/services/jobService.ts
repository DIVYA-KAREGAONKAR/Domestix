import axios from './axiosConfig.ts';

export const getEmployerJobs = async () => {
  try {
    const response = await axios.get('/api/jobs/my-jobs/');
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error fetching employer jobs:", error);
    return { success: false, error: error.response?.data?.message || 'Failed to fetch job data.' };
  }
};

export const postNewJob = async (jobData: any) => {
    try {
        const response = await axios.post('/api/jobs/my-jobs/', jobData);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error("Error posting new job:", error);
        return { 
            success: false, 
            error: error.response?.data?.message || 'Failed to post job.' 
        };
    }
};

export const getAvailableJobs = async () => {
    try {
        const response = await axios.get('/api/jobs/available/');
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error("Error fetching available jobs:", error);
        return { success: false, error: error.response?.data?.message || 'Failed to fetch job data.' };
    }
};

export const applyToJob = async (jobId: number) => {
    try {
        const response = await axios.post(`/api/jobs/${jobId}/apply/`);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error("Error applying to job:", error);
        return { 
            success: false, 
            error: error.response?.data?.message || 'Failed to apply to job.' 
        };
    }
};