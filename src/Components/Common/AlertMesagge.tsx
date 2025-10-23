import React, { useEffect } from "react";
import { Alert, Button } from "reactstrap";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";

interface AlertMessageProps {
    color: string;
    message: string;
    visible: boolean;
    onClose: () => void;
    autoClose?: number;
    absolutePosition?: boolean
}

const AlertMessage: React.FC<AlertMessageProps> = ({
    color,
    message,
    visible,
    onClose,
    autoClose = 3000,
    absolutePosition = true,
}) => {
    useEffect(() => {
        if (visible && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoClose);
            return () => clearTimeout(timer);
        }
    }, [visible, autoClose, onClose]);

    if (!visible) return null;

    const renderIcon = () => {
        switch (color) {
            case "success":
                return <FiCheckCircle size={22} />;
            case "danger":
                return <FiXCircle size={22} />;
            case "warning":
                return <FiAlertCircle size={22} />;
            case "info":
                return <FiInfo size={22} />;
            default:
                return null;
        }
    };

    return (
        <Alert
            color={color}
            className={`${absolutePosition ? 'position-fixed bottom-0 start-50 translate-middle-x d-flex align-items-center gap-2 shadow rounded-3 p-3' : 'd-flex align-items-center gap-2 shadow rounded-3 mt-3'}`}
            style={{ minWidth: "350px", maxWidth: "100%", zIndex: 1050 }}
        >
            {renderIcon()}
            <span className="flex-grow-1 text-black">{message}</span>
            <Button close onClick={onClose} />
        </Alert>
    );
};

export default AlertMessage;