import jwtAxios from './jwtAxios';

export const reviewCode = async (code) => {
    const res = await jwtAxios.post('/chatbot/review', { code });
    return res.data;
};

export const chatWithBot = async (message, history = []) => {
    const res = await jwtAxios.post('/chatbot/chat', { message, history });
    return res.data;
};
