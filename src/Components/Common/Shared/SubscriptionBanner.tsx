import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const SubscriptionBanner: React.FC = () => {
    const { t } = useTranslation();
    const status = useSelector((s: any) => s.Subscription.details?.status);

    if (status !== "expired") return null;

    return (
        <div
            className="d-flex align-items-center justify-content-center gap-2 px-3 py-2 text-white fw-semibold small"
            style={{ backgroundColor: "#c0392b", zIndex: 1100, position: "relative" }}
        >
            <i className="ri-error-warning-line fs-5" />
            <span>{t("subscription.banner.expired")}</span>
            <Link
                to="/subscription"
                className="text-white text-decoration-underline ms-2"
            >
                {t("subscription.banner.viewPlan")}
            </Link>
        </div>
    );
};

export default SubscriptionBanner;
