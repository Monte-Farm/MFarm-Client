import { APIClient } from 'helpers/api_helper';
import { NotificationData } from 'common/data_interfaces';
import {
    setLoading,
    setNotifications,
    setUnreadCount,
    markOneAsRead,
    markAllRead,
} from './reducer';

const api = new APIClient();

const normalizeNotification = (n: any): NotificationData => ({
    ...n,
    _id: n?._id ?? n?.id,
});

export const fetchNotifications = () => async (dispatch: any) => {
    dispatch(setLoading(true));
    try {
        const res = await api.get('/notifications/find_by_user');
        const list = Array.isArray(res.data.data) ? res.data.data.map(normalizeNotification) : [];
        dispatch(setNotifications(list));
    } finally {
        dispatch(setLoading(false));
    }
};

export const fetchUnreadCount = () => async (dispatch: any) => {
    const res = await api.get('/notifications/unread_count');
    dispatch(setUnreadCount(res.data.data));
};

export const markNotificationAsRead = (id: string) => async (dispatch: any) => {
    await api.put(`/notifications/mark_as_read/${id}`, {});
    dispatch(markOneAsRead(id));
};

export const markAllNotificationsAsRead = () => async (dispatch: any) => {
    await api.put('/notifications/mark_all_as_read', {});
    dispatch(markAllRead());
};
