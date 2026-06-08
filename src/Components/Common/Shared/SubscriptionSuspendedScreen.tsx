import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const SubscriptionSuspendedScreen: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div
            className="d-flex flex-column align-items-center justify-content-center text-center"
            style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", padding: "2rem" }}
        >
            <div
                className="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center mb-4"
                style={{ width: 96, height: 96 }}
            >
                <i className="ri-forbid-2-line text-secondary" style={{ fontSize: 48 }} />
            </div>

            <h3 className="fw-bold mb-2">{t("subscription.suspended.title")}</h3>
            <p className="text-muted mb-1" style={{ maxWidth: 420 }}>
                {t("subscription.suspended.message")}
            </p>
            <p className="text-muted small mb-4" style={{ maxWidth: 420 }}>
                {t("subscription.suspended.contact")}
            </p>

            <Link
                to="/subscription"
                className="btn btn-primary"
            >
                <i className="ri-vip-crown-2-line me-2" />
                {t("subscription.suspended.viewPlan")}
            </Link>
        </div>
    );
};

export default SubscriptionSuspendedScreen;
