import React from "react";
import { useTranslation } from "react-i18next";
import LoadingGif from "../../../assets/images/loading-gif.gif";

interface LoadingAnimationProps {
    absolutePosition?: boolean;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
    absolutePosition = true,
}) => {
    const { t } = useTranslation();
    if (absolutePosition) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img
                    src={LoadingGif}
                    alt={t("common.status.loading")}
                    style={{ width: "200px" }}
                />
            </div>
        );
    }

    return (
        <div className="d-flex justify-content-center align-items-center h-100">
            <img
                src={LoadingGif}
                alt={t("common.status.loading")}
                style={{ width: "200px" }}
            />
        </div>
    );
};

export default LoadingAnimation;