import jwtAxios from "./jwtAxios";

export const getRecentNotifications = async () => {
    const res = await jwtAxios.get(`notifications/recent`);
    return res.data;
};

export const getAllNotifications = async (filter = 'all') => {
    const res = await jwtAxios.get(`notifications`, { params: { filter } });
    return res.data;
};

export const markAsRead = async (ids) => {
    const res = await jwtAxios.post(`notifications/read`, { ids });
    return res.data;
};

export const markAllAsRead = async () => {
    const res = await jwtAxios.post(`notifications/read-all`);
    return res.data;
};

export const markTypeAsRead = async (targetType) => {
    const res = await jwtAxios.post(`notifications/read-type`, null, { params: { targetType } });
    return res.data;
};

export const getNotificationSettings = async () => {
    const res = await jwtAxios.get(`notifications/settings`);
    return res.data;
};

export const updateNotificationSettings = async (settings) => {
    const res = await jwtAxios.put(`notifications/settings`, settings);
    return res.data;
};
