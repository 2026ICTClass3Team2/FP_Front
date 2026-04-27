import jwtAxios from './jwtAxios';

export const globalSearch = async (query) => {
    try {
        console.log(`Searching for: ${query}`);
        const response = await jwtAxios.get(`/search?q=${encodeURIComponent(query)}`);
        console.log('Search response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Search failed:', error);
        throw error;
    }
};

