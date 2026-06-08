import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Badge, Card, CardBody, Col, Container, Progress, Row } from "reactstrap";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { fetchSubscriptionDetails } from "slices/subscription/thunk";
import { SubscriptionStatus, SubscriptionBillingCycle } from "common/data_interfaces";

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
    active: "success",
    trial: "info",
    expired: "danger",
    suspended: "secondary",
};

const BILLING_CYCLE_KEYS: Record<SubscriptionBillingCycle, string> = {
    monthly: "subscription.billing.monthly",
    annual: "subscription.billing.annual",
    lifetime: "subscription.billing.lifetime",
};

const SubscriptionDetails: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<any>();
    const { details, loading, error } = useSelector((s: any) => s.Subscription);

    useEffect(() => {
        dispatch(fetchSubscriptionDetails());
    }, [dispatch]);

    if (loading) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    if (error || !details) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("subscription.title")} pageTitle={t("menu.admin")} />
                    <div className="alert alert-danger">{error || t("subscription.error.load")}</div>
                </Container>
            </div>
        );
    }

    const { plan, status, type, daysRemaining, limits } = details;

    const getDaysColor = () => {
        if (daysRemaining === null) return "success";
        if (daysRemaining <= 30) return "danger";
        return "success";
    };

    const renderLimit = (labelKey: string, usage: { max: number; current: number }) => {
        const isUnlimited = usage.max === -1;
        const pct = isUnlimited ? 0 : Math.min(Math.round((usage.current / usage.max) * 100), 100);
        const barColor = pct >= 90 ? "danger" : pct >= 70 ? "warning" : "success";

        return (
            <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                    <span className="fw-semibold small">{t(labelKey)}</span>
                    <span className="text-muted small">
                        {isUnlimited
                            ? t("subscription.unlimited")
                            : `${usage.current} / ${usage.max}`}
                    </span>
                </div>
                {!isUnlimited && (
                    <Progress value={pct} color={barColor} style={{ height: 8 }} />
                )}
            </div>
        );
    };

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t("subscription.title")} pageTitle={t("menu.admin")} />

                <Row className="g-3">
                    {/* Plan header */}
                    <Col xs={12}>
                        <Card className="border-0 shadow-sm">
                            <CardBody>
                                <Row className="align-items-center">
                                    <Col xs="auto">
                                        <div
                                            className="avatar-md rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                                            style={{ width: 56, height: 56 }}
                                        >
                                            <i className="ri-vip-crown-2-line fs-2 text-primary" />
                                        </div>
                                    </Col>
                                    <Col>
                                        <h4 className="mb-1">{t("subscription.planLabel", { plan: plan.name })}</h4>
                                        <p className="text-muted mb-0">
                                            {type === "lifetime"
                                                ? t("subscription.billing.lifetime")
                                                : `$${plan.price} / ${t(BILLING_CYCLE_KEYS[plan.billingCycle as SubscriptionBillingCycle])}`}
                                        </p>
                                    </Col>
                                    <Col xs="auto">
                                        <Badge color={STATUS_COLORS[status as SubscriptionStatus]} className="fs-6 px-3 py-2">
                                            {t(`subscription.status.${status}`)}
                                        </Badge>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>

                    {/* Vencimiento */}
                    <Col xs={12} md={4}>
                        <Card className="border-0 shadow-sm h-100">
                            <CardBody>
                                <h6 className="text-muted text-uppercase mb-3 small">
                                    {t("subscription.section.expiration")}
                                </h6>
                                {daysRemaining === null ? (
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="ri-infinity-line fs-3 text-success" />
                                        <span className="fw-semibold text-success">
                                            {t("subscription.noExpiration")}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="d-flex align-items-center gap-2">
                                        <i className={`ri-calendar-line fs-3 text-${getDaysColor()}`} />
                                        <div>
                                            <span className={`fw-bold fs-4 text-${getDaysColor()}`}>
                                                {daysRemaining}
                                            </span>
                                            <span className="text-muted ms-1 small">
                                                {t("subscription.daysRemaining")}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {details.endDate && (
                                    <p className="text-muted small mt-2 mb-0">
                                        {t("subscription.expiresOn", {
                                            date: new Date(details.endDate).toLocaleDateString(),
                                        })}
                                    </p>
                                )}
                            </CardBody>
                        </Card>
                    </Col>

                    {/* Uso de recursos */}
                    <Col xs={12} md={8}>
                        <Card className="border-0 shadow-sm h-100">
                            <CardBody>
                                <h6 className="text-muted text-uppercase mb-3 small">
                                    {t("subscription.section.usage")}
                                </h6>
                                {renderLimit("subscription.resource.farms", limits.farms)}
                                {renderLimit("subscription.resource.sows", limits.sows)}
                                {renderLimit("subscription.resource.users", limits.users)}
                            </CardBody>
                        </Card>
                    </Col>

                    {/* Funcionalidades del plan */}
                    <Col xs={12}>
                        <Card className="border-0 shadow-sm">
                            <CardBody>
                                <h6 className="text-muted text-uppercase mb-3 small">
                                    {t("subscription.section.features")}
                                </h6>
                                <Row className="g-2">
                                    <Col xs={12} sm={6} md={4}>
                                        <div className="d-flex align-items-center gap-2">
                                            <i className={`ri-robot-line fs-5 ${plan.features.aiEnabled ? "text-success" : "text-muted"}`} />
                                            <span className={plan.features.aiEnabled ? "" : "text-muted"}>
                                                {t("subscription.feature.ai")}
                                            </span>
                                            {!plan.features.aiEnabled && (
                                                <Badge color="secondary" pill className="ms-1 small">
                                                    {t("subscription.feature.notIncluded")}
                                                </Badge>
                                            )}
                                        </div>
                                    </Col>
                                    <Col xs={12} sm={6} md={4}>
                                        <div className="d-flex align-items-center gap-2">
                                            <i className={`ri-bar-chart-line fs-5 ${plan.features.advancedReports ? "text-success" : "text-muted"}`} />
                                            <span className={plan.features.advancedReports ? "" : "text-muted"}>
                                                {t("subscription.feature.advancedReports")}
                                            </span>
                                            {!plan.features.advancedReports && (
                                                <Badge color="secondary" pill className="ms-1 small">
                                                    {t("subscription.feature.notIncluded")}
                                                </Badge>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default SubscriptionDetails;
