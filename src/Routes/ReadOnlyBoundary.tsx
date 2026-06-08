import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Container } from "reactstrap";

interface ReadOnlyBoundaryProps {
    children: React.ReactNode;
}

const ReadOnlyBoundary: React.FC<ReadOnlyBoundaryProps> = ({ children }) => {
    const { t } = useTranslation();
    const status = useSelector((s: any) => s.Subscription.details?.status);

    if (status === "expired") {
        return (
            <div className="page-content">
                <Container fluid>
                    <div
                        className="d-flex flex-column align-items-center justify-content-center text-center py-5"
                        style={{ minHeight: 400 }}
                    >
                        <div
                            className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center mb-4"
                            style={{ width: 80, height: 80 }}
                        >
                            <i className="ri-file-lock-line text-danger" style={{ fontSize: 40 }} />
                        </div>
                        <h5 className="fw-bold mb-2">{t("subscription.readOnly.reportsBlockedTitle")}</h5>
                        <p className="text-muted mb-4" style={{ maxWidth: 380 }}>
                            {t("subscription.readOnly.reportsBlockedMessage")}
                        </p>
                        <Link to="/subscription" className="btn btn-primary">
                            <i className="ri-arrow-up-circle-line me-2" />
                            {t("subscription.limitModal.upgrade")}
                        </Link>
                    </div>
                </Container>
            </div>
        );
    }

    return <>{children}</>;
};

export default ReadOnlyBoundary;
