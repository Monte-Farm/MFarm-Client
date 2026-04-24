import { io, Socket } from 'socket.io-client';
import { addNotification, resetNotifications } from 'slices/notifications/reducer';
import { fetchUnreadCount } from 'slices/notifications/thunk';
import { toast } from 'react-toastify';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;
let currentToken: string | null = null;

export const connectNotificationSocket = (token: string, dispatch: any) => {
    if (socket && currentToken === token) {
        if (!socket.connected && !socket.active) {
            socket.connect();
        }
        return;
    }

    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }

    currentToken = token;

    socket = io(`${SOCKET_URL}/notifications`, {
        auth: { token },
        reconnectionAttempts: 5,
        forceNew: false,
    });

    socket.on('connect', () => {
        dispatch(fetchUnreadCount());
    });

    socket.on('notification:new', (notification: any) => {
        const normalized = { ...notification, _id: notification?._id ?? notification?.id };
        dispatch(addNotification(normalized));
        toast.info(normalized.title, {
            position: 'top-right',
            autoClose: 5000,
        });
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
    });
};

export const disconnectNotificationSocket = (dispatch: any) => {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
    currentToken = null;
    dispatch(resetNotifications());
};
