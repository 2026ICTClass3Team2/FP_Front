import jwtAxios from './jwtAxios';

export const globalSearch = async (query) => {
    try {
        const response = await jwtAxios.get(`/search?q=${encodeURIComponent(query)}`);
        return response.data;
    } catch (error) {
        console.error('Search failed:', error);
        throw error;
    }
};
