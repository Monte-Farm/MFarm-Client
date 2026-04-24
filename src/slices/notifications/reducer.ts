import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationData } from 'common/data_interfaces';

interface NotificationsState {
    notifications: NotificationData[];
    unreadCount: number;
    loading: boolean;
}

const initialState: NotificationsState = {
    notifications: [],
    unreadCount: 0,
    loading: false,
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setNotifications(state, action: PayloadAction<NotificationData[]>) {
            state.notifications = action.payload;
        },
        setUnreadCount(state, action: PayloadAction<number>) {
            state.unreadCount = action.payload;
        },
        addNotification(state, action: PayloadAction<NotificationData>) {
            state.notifications.unshift(action.payload);
            state.unreadCount += 1;
        },
        markOneAsRead(state, action: PayloadAction<string>) {
            const n = state.notifications.find(n => n._id === action.payload);
            if (n && !n.read) {
                n.read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        markAllRead(state) {
            state.notifications.forEach(n => { n.read = true; });
            state.unreadCount = 0;
        },
        resetNotifications(state) {
            state.notifications = [];
            state.unreadCount = 0;
            state.loading = false;
        },
    },
});

export const {
    setLoading,
    setNotifications,
    setUnreadCount,
    addNotification,
    markOneAsRead,
    markAllRead,
    resetNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
