import axios from "axios";
import Swal from "sweetalert2";

// --- Theme Config ---
const BOTTLE_GREEN = '#004d40';

// --- Axios Instance ---
const API = axios.create({
  baseURL: "http://localhost:5161/api/", 
  timeout: 10000,
});

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};


const handleError = (error) => {
  const message = error.response?.data?.result || "Network Error: Unable to reach the server.";
  
  Swal.fire({
    icon: 'error',
    title: 'Request Failed',
    text: message,
    confirmButtonColor: BOTTLE_GREEN,
    background: '#fff',
    customClass: {
      popup: 'rounded-4'
    }
  });

  return Promise.reject(error);
};

// --- Exported Methods ---

// 1. GET
export const requestGet = async (endpoint, isAuth = false) => {
  try {
    const response = await API.get(endpoint, {
      headers: isAuth ? getAuthHeaders() : {},
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// 2. POST
export const requestPost = async (endpoint, payload, isAuth = false) => {
  try {
    const response = await API.post(endpoint, payload, {
      headers: isAuth ? getAuthHeaders() : {},
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// 3. PUT
export const requestPut = async (endpoint, payload, isAuth = false) => {
  try {
    const response = await API.put(endpoint, payload, {
      headers: isAuth ? getAuthHeaders() : {},
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// 4. DELETE
export const requestDelete = async (endpoint, isAuth = false) => {
  try {
    const response = await API.delete(endpoint, {
      headers: isAuth ? getAuthHeaders() : {},
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};