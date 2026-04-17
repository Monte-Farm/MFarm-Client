import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createSelector } from 'reselect';
import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    Spinner,
} from 'reactstrap';
import { NotificationData, NotificationEntity } from 'common/data_interfaces';
import {
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from 'slices/notifications/thunk';

const entityRouteMap: Record<NotificationEntity['type'], (id: string) => string> = {
    pig: (id) => `/pigs/pig_details/${id}`,
    group: (id) => `/groups/group_details/${id}`,
    insemination: (id) => `/gestation/insemination_details/${id}`,
    birth: () => '/births/view_births',
    pregnancy: () => '/gestation/view_pregnancies',
    income: () => '/warehouse/incomes/view_incomes',
};

const selectNotificationsState = createSelector(
    (state: any) => state.Notifications,
    (n) => ({
        notifications: n.notifications as NotificationData[],
        unreadCount: n.unreadCount as number,
        loading: n.loading as boolean,
    })
);

const typeConfig: Record<string, { icon: string; color: string; bg: string; gradient: string; label: string }> = {
    health_alert: {
        icon: 'ri-heart-pulse-line',
        color: '#f672a7',
        bg: 'rgba(246, 114, 167, 0.12)',
        gradient: 'linear-gradient(135deg, #f672a7 0%, #d14a86 100%)',
        label: 'Salud',
    },
    birth_approaching: {
        icon: 'ri-heart-add-line',
        color: '#6559cc',
        bg: 'rgba(101, 89, 204, 0.12)',
        gradient: 'linear-gradient(135deg, #6559cc 0%, #4a3fb3 100%)',
        label: 'Parto',
    },
    reproduction: {
        icon: 'ri-parent-line',
        color: '#a855d6',
        bg: 'rgba(168, 85, 214, 0.12)',
        gradient: 'linear-gradient(135deg, #a855d6 0%, #8a3db0 100%)',
        label: 'Reproducción',
    },
    stage_change: {
        icon: 'ri-arrow-right-circle-line',
        color: '#405189',
        bg: 'rgba(64, 81, 137, 0.12)',
        gradient: 'linear-gradient(135deg, #405189 0%, #2f3e6f 100%)',
        label: 'Etapa',
    },
    system: {
        icon: 'ri-settings-3-line',
        color: '#74788d',
        bg: 'rgba(116, 120, 141, 0.12)',
        gradient: 'linear-gradient(135deg, #74788d 0%, #5a5e73 100%)',
        label: 'Sistema',
    },
    weight_goal: {
        icon: 'ri-scales-line',
        color: '#0ab39c',
        bg: 'rgba(10, 179, 156, 0.12)',
        gradient: 'linear-gradient(135deg, #0ab39c 0%, #089986 100%)',
        label: 'Peso',
    },
    feeding_alert: {
        icon: 'ri-restaurant-line',
        color: '#299cdb',
        bg: 'rgba(41, 156, 219, 0.12)',
        gradient: 'linear-gradient(135deg, #299cdb 0%, #1f82bb 100%)',
        label: 'Alimento',
    },
    group_management: {
        icon: 'ri-group-line',
        color: '#3577f1',
        bg: 'rgba(53, 119, 241, 0.12)',
        gradient: 'linear-gradient(135deg, #3577f1 0%, #2560d6 100%)',
        label: 'Grupo',
    },
    inventory: {
        icon: 'ri-archive-line',
        color: '#f7b84b',
        bg: 'rgba(247, 184, 75, 0.12)',
        gradient: 'linear-gradient(135deg, #f7b84b 0%, #e09b25 100%)',
        label: 'Inventario',
    },
};

const defaultConfig = {
    icon: 'ri-information-line',
    color: '#74788d',
    bg: 'rgba(116, 120, 141, 0.12)',
    gradient: 'linear-gradient(135deg, #74788d 0%, #5a5e73 100%)',
    label: 'General',
};

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} d`;
}

type TabKey = 'all' | 'unread';

const NotificationDropdown = () => {
    const dispatch: any = useDispatch();
    const navigate = useNavigate();
    const { notifications, unreadCount, loading } = useSelector(selectNotificationsState);
    const [isOpen, setIsOpen] = useState(false);
    const [panelLoaded, setPanelLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const toggle = () => {
        if (!isOpen && !panelLoaded) {
            dispatch(fetchNotifications());
            setPanelLoaded(true);
        }
        setIsOpen(prev => !prev);
    };

    const handleClickNotification = (n: NotificationData) => {
        if (!n.read && n._id) {
            dispatch(markNotificationAsRead(n._id));
        }
        if (n.entity?.type && n.entity?.id) {
            const builder = entityRouteMap[n.entity.type];
            if (builder) {
                navigate(builder(n.entity.id));
                setIsOpen(false);
            }
        }
    };

    const handleMarkAll = () => {
        dispatch(markAllNotificationsAsRead());
    };

    const filteredNotifications = useMemo(() => {
        if (activeTab === 'unread') return notifications.filter(n => !n.read);
        return notifications;
    }, [notifications, activeTab]);

    return (
        <Dropdown isOpen={isOpen} toggle={toggle} className="topbar-head-dropdown header-item">
            <DropdownToggle
                tag="button"
                type="button"
                className="btn btn-icon btn-topbar rounded-circle position-relative border-0"
                style={{
                    background: 'rgba(64, 81, 137, 0.10)',
                    transition: 'all 0.2s ease',
                }}
            >
                <i className="ri-notification-3-line fs-20" style={{ color: '#405189' }} />
                {unreadCount > 0 && (
                    <span
                        className="position-absolute d-flex align-items-center justify-content-center rounded-pill border border-2 border-white"
                        style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            minWidth: '18px',
                            height: '18px',
                            padding: '0 5px',
                            top: '-2px',
                            right: '-2px',
                            color: '#fff',
                            background: '#f06548',
                            boxShadow: '0 2px 6px rgba(240, 101, 72, 0.35)',
                        }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </DropdownToggle>

            <DropdownMenu
                end
                className="p-0 border-0"
                style={{
                    width: '460px',
                    overflow: 'hidden',
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(30, 32, 37, 0.20), 0 4px 16px rgba(30, 32, 37, 0.08)',
                    marginTop: '12px',
                    background: '#fff',
                }}
            >
                <div
                    className="position-relative px-4 pt-4 pb-3"
                    style={{
                        background: 'linear-gradient(135deg, #405189 0%, #3a4a7e 55%, #0ab39c 160%)',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        className="position-absolute rounded-circle"
                        style={{
                            width: '180px',
                            height: '180px',
                            background: 'rgba(255,255,255,0.06)',
                            top: '-80px',
                            right: '-40px',
                            filter: 'blur(20px)',
                        }}
                    />
                    <div
                        className="position-absolute rounded-circle"
                        style={{
                            width: '120px',
                            height: '120px',
                            background: 'rgba(10, 179, 156, 0.22)',
                            bottom: '-60px',
                            left: '30px',
                            filter: 'blur(24px)',
                        }}
                    />

                    <div className="position-relative d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <div
                                className="d-flex align-items-center justify-content-center"
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.18)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.22)',
                                }}
                            >
                                <i className="ri-notification-3-fill" style={{ color: '#fff', fontSize: '20px' }} />
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold" style={{ color: '#fff', fontSize: '17px', letterSpacing: '-0.3px' }}>
                                    Notificaciones
                                </h6>
                                <p className="mb-0" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', marginTop: '2px' }}>
                                    {unreadCount > 0 ? `${unreadCount} pendientes por revisar` : 'Todo al día'}
                                </p>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                className="btn btn-sm d-flex align-items-center gap-1"
                                style={{
                                    fontSize: '12px',
                                    color: '#fff',
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '1px solid rgba(255,255,255,0.22)',
                                    borderRadius: '10px',
                                    padding: '7px 12px',
                                    fontWeight: 600,
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <i className="ri-check-double-line" style={{ fontSize: '14px' }} />
                                Marcar leídas
                            </button>
                        )}
                    </div>

                    <div className="position-relative d-flex gap-2" style={{ marginBottom: '-1px' }}>
                        {([
                            { key: 'all' as TabKey, label: 'Todas', count: notifications.length },
                            { key: 'unread' as TabKey, label: 'Sin leer', count: unreadCount },
                        ]).map(tab => {
                            const active = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className="btn btn-sm d-flex align-items-center gap-2 border-0"
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        padding: '9px 16px',
                                        background: active ? '#fff' : 'rgba(255,255,255,0.08)',
                                        color: active ? '#405189' : 'rgba(255,255,255,0.9)',
                                        borderRadius: '12px 12px 0 0',
                                        transition: 'all 0.2s',
                                        boxShadow: active ? '0 -2px 12px rgba(0,0,0,0.06)' : 'none',
                                    }}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                background: active ? 'rgba(64, 81, 137, 0.12)' : 'rgba(255,255,255,0.22)',
                                                color: active ? '#405189' : '#fff',
                                                minWidth: '22px',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ maxHeight: '500px', overflowY: 'auto', background: '#fff' }}>
                    {loading ? (
                        <div className="d-flex flex-column justify-content-center align-items-center py-5 gap-3">
                            <div
                                className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'rgba(64, 81, 137, 0.10)',
                                }}
                            >
                                <Spinner size="sm" style={{ color: '#405189' }} />
                            </div>
                            <p className="mb-0" style={{ fontSize: '12.5px', color: '#878a99' }}>Cargando notificaciones...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="d-flex flex-column align-items-center justify-content-center py-5 px-4 text-center">
                            <div
                                className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'linear-gradient(135deg, rgba(64, 81, 137, 0.10) 0%, rgba(10, 179, 156, 0.10) 100%)',
                                }}
                            >
                                <i className="ri-notification-off-line" style={{ fontSize: '34px', color: '#405189', opacity: 0.8 }} />
                            </div>
                            <h6 className="mb-1 fw-semibold" style={{ fontSize: '15px', color: '#212529' }}>
                                {activeTab === 'unread' ? 'Sin notificaciones nuevas' : 'No hay notificaciones'}
                            </h6>
                            <p className="mb-0" style={{ fontSize: '12.5px', maxWidth: '260px', color: '#878a99', lineHeight: '1.5' }}>
                                {activeTab === 'unread'
                                    ? 'Todas tus notificaciones están al día'
                                    : 'Cuando recibas alguna aparecerá aquí'}
                            </p>
                        </div>
                    ) : (
                        <ul className="list-unstyled mb-0 py-2">
                            {filteredNotifications.map((n) => {
                                const cfg = typeConfig[n.type] || defaultConfig;
                                const isHovered = hoveredId === n._id;
                                const isClickable = !n.read || !!n.entity;
                                return (
                                    <li
                                        key={n._id}
                                        onClick={() => handleClickNotification(n)}
                                        onMouseEnter={() => setHoveredId(n._id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        className="position-relative d-flex gap-3 px-3 py-3 mx-2 my-1"
                                        style={{
                                            cursor: isClickable ? 'pointer' : 'default',
                                            transition: 'all 0.2s ease',
                                            borderRadius: '14px',
                                            background: isHovered
                                                ? 'linear-gradient(135deg, rgba(64, 81, 137, 0.06) 0%, rgba(10, 179, 156, 0.04) 100%)'
                                                : !n.read ? 'rgba(64, 81, 137, 0.04)' : 'transparent',
                                            transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                                        }}
                                    >
                                        {!n.read && (
                                            <span
                                                className="position-absolute"
                                                style={{
                                                    left: '4px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    width: '3px',
                                                    height: '32px',
                                                    borderRadius: '2px',
                                                    background: cfg.gradient,
                                                }}
                                            />
                                        )}

                                        <div
                                            className="d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{
                                                width: '46px',
                                                height: '46px',
                                                borderRadius: '14px',
                                                background: cfg.gradient,
                                                marginTop: '2px',
                                                boxShadow: `0 6px 16px ${cfg.color}35`,
                                            }}
                                        >
                                            <i className={cfg.icon} style={{ fontSize: '20px', color: '#fff' }} />
                                        </div>

                                        <div className="flex-grow-1 overflow-hidden">
                                            <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                                                <p
                                                    className="mb-0 text-truncate"
                                                    style={{
                                                        fontSize: '14px',
                                                        color: '#212529',
                                                        fontWeight: !n.read ? 700 : 500,
                                                        letterSpacing: '-0.1px',
                                                    }}
                                                >
                                                    {n.title}
                                                </p>
                                                {!n.read && (
                                                    <span
                                                        className="rounded-circle d-block flex-shrink-0"
                                                        style={{
                                                            width: '9px',
                                                            height: '9px',
                                                            background: cfg.gradient,
                                                            marginTop: '6px',
                                                            boxShadow: `0 0 0 3px ${cfg.color}20`,
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <p
                                                className="mb-2"
                                                style={{
                                                    fontSize: '13px',
                                                    color: '#878a99',
                                                    lineHeight: '1.5',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {n.message}
                                            </p>
                                            <div className="d-flex align-items-center gap-2">
                                                <span
                                                    className="d-flex align-items-center gap-1"
                                                    style={{
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        padding: '3px 9px',
                                                        borderRadius: '8px',
                                                        background: cfg.bg,
                                                        color: cfg.color,
                                                    }}
                                                >
                                                    <span
                                                        className="rounded-circle d-block"
                                                        style={{ width: '5px', height: '5px', background: cfg.color }}
                                                    />
                                                    {cfg.label}
                                                </span>
                                                <span className="d-flex align-items-center gap-1" style={{ fontSize: '11.5px', color: '#adb5bd' }}>
                                                    <i className="ri-time-line" style={{ fontSize: '13px' }} />
                                                    {timeAgo(n.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {n.entity && (
                                            <div
                                                className="d-flex align-items-center flex-shrink-0"
                                                style={{
                                                    opacity: isHovered ? 1 : 0,
                                                    transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <i className="ri-arrow-right-s-line" style={{ fontSize: '20px', color: '#adb5bd' }} />
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {filteredNotifications.length > 0 && !loading && (
                    <div
                        className="px-3 py-2 d-flex align-items-center justify-content-between"
                        style={{
                            background: '#f9f9fb',
                            borderTop: '1px solid rgba(64, 81, 137, 0.08)',
                        }}
                    >
                        <span style={{ fontSize: '11.5px', color: '#adb5bd', fontWeight: 500 }}>
                            {filteredNotifications.length} {filteredNotifications.length === 1 ? 'notificación' : 'notificaciones'}
                        </span>
                        <button
                            className="btn btn-sm d-flex align-items-center gap-1 border-0"
                            style={{
                                fontSize: '12px',
                                color: '#405189',
                                background: 'transparent',
                                fontWeight: 600,
                                padding: '4px 8px',
                            }}
                        >
                            Ver todas
                            <i className="ri-arrow-right-line" style={{ fontSize: '14px' }} />
                        </button>
                    </div>
                )}
            </DropdownMenu>
        </Dropdown>
    );
};

export default NotificationDropdown;
