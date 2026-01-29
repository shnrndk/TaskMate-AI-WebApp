export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");
  
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  
    const response = await fetch(url, {
      ...options,
      headers,
    });
  
    if (response.status === 401) {
      alert("Session expired. Please log in again.");
      localStorage.removeItem("token");
      window.location = "/login";
    }
  
    return response;
  };
  