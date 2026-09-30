import axios from 'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api'});
api.interceptors.response.use(r=>r,e=>{e.friendly=e.response?.data?.message||'Cannot reach the server';return Promise.reject(e);});
export default api;
