import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// respond to 401 errors
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if( error.response?.status === 401 ) {
            localStorage.removeItem('user');

            // redirect to login
            window.location.href = '/login'
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;