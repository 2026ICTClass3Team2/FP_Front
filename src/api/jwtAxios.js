import axios from 'axios';

const testURI = import.meta.env.DEV ? 'http://localhost:8090/api/' : '/api/';

const jwtAxios = axios.create({
    baseURL: testURI 
});

const beforeReq = (config) => {
    const token = localStorage.getItem("token");
    if (!token) {
        // 명시적 로그아웃 상태이거나, 이미 로그인/가입 페이지라면 주소 저장 생략
        const isLoggingOut = sessionStorage.getItem('isLoggingOut');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && !isLoggingOut) {
            const currentUrl = window.location.pathname + window.location.search;
            sessionStorage.setItem('redirectUrl', currentUrl);
            window.location.href = '/login'; // 로그인 페이지로 강제 이동
        }
        
        return Promise.reject({
            response: { data: { message: '로그인이 필요한 서비스입니다.' } }
        });
    }
    config.headers.Authorization = `Bearer ${token}`;
    return config;
}

const refreshJWT = async (accessToken, refreshToken) => {
    const header = { headers: { "Authorization": `Bearer ${accessToken}` } }
    const res = await axios.get(`${testURI}member/refresh?refreshToken=${refreshToken}`, header);
    return res.data;
}

const responseFail = async (err) => {
    const data = err.response?.data;
    if (data && data.error === "ERROR_ACCESS_TOKEN") {
        try {
            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user")) || {};
            const result = await refreshJWT(token, user.refreshToken); 
            localStorage.setItem("token", result.accessToken);
            const originalRequest = err.config;
            originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
            return await jwtAxios(originalRequest);
        } catch (refreshErr) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
            const isLoggingOut = sessionStorage.getItem('isLoggingOut');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && !isLoggingOut) {
                sessionStorage.setItem('redirectUrl', window.location.pathname + window.location.search);
                window.location.href = "/login";
            }
            return Promise.reject(refreshErr);
        }
    }
    return Promise.reject(err);
}

jwtAxios.interceptors.request.use(beforeReq, (err) => Promise.reject(err));
jwtAxios.interceptors.response.use((res) => res, responseFail);

export default jwtAxios;