import axios from 'axios';

// Python LangChain backend address
const CHATBOT_BASE_URL = 'http://localhost:8001/api/';

const chatbotAxios = axios.create({
    baseURL: CHATBOT_BASE_URL,
});

/**
 * AI 코드 리뷰 요청
 * @param {string} code 
 */
export const reviewCode = async (code) => {
    const res = await chatbotAxios.post('chatbot/review', { code });
    return res.data;
};

/**
 * AI 챗봇 일반 대화 요청
 * @param {string} message 
 * @param {Array} history 
 */
export const chatWithBot = async (message, history = []) => {
    const res = await chatbotAxios.post('chatbot/chat', { message, history });
    return res.data;
};

export default chatbotAxios;
