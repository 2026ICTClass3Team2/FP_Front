import jwtAxios from "./jwtAxios";

/**
 * 특정 상대방과의 채팅 이력을 가져옵니다.
 * @param {number} partnerId 상대방 userId
 * @param {number} page 페이지 번호 (0부터 시작)
 */
export const getChatHistory = async (partnerId, page = 0) => {
    const res = await jwtAxios.get(`chat/history`, {
        params: { with: partnerId, page }
    });
    return res.data;
};

/**
 * 현재 사용자의 전체 대화 목록을 가져옵니다.
 */
export const getChatConversations = async () => {
    const res = await jwtAxios.get(`chat/conversations`);
    return res.data;
};

/**
 * 특정 대화방의 메시지를 모두 읽음 처리합니다.
 * @param {number} partnerId 상대방 userId
 */
export const markChatRead = async (partnerId) => {
    const res = await jwtAxios.post(`chat/mark-read`, null, {
        params: { partnerId }
    });
    return res.data;
};

/**
 * 특정 대화방을 목록에서 숨깁니다 (나가기).
 * 이후 새 메시지가 오면 자동으로 다시 표시됩니다.
 * @param {number} partnerId 상대방 userId
 */
export const leaveConversation = async (partnerId) => {
    const res = await jwtAxios.delete(`chat/conversations/${partnerId}`);
    return res.data;
};
