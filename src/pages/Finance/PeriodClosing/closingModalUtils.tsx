import { PrecheckStatus } from "common/data_interfaces";

export const statusIcon = (status: PrecheckStatus) => {
    switch (status) {
        case "ok":
            return <i className="ri-checkbox-circle-line fs-5 text-success" />;
        case "warning":
            return <i className="ri-error-warning-line fs-5 text-warning" />;
        case "error":
            return <i className="ri-close-circle-line fs-5 text-danger" />;
    }
};

export const isTablet = (): boolean => {
    const w = document.documentElement.clientWidth;
    return w >= 768 && w <= 1024;
};
