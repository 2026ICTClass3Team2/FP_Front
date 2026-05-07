import jwtAxios from './jwtAxios';

export const globalSearch = async (query, size = 5) => {
    const response = await jwtAxios.get(`/search?q=${encodeURIComponent(query)}&size=${size}`);
    return response.data;
};

