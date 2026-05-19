import { useContext, useEffect, useState } from "react";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Col, Container, Nav, NavItem, NavLink, Row, Table, TabContent, TabPane } from "reactstrap";
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { PeriodClosing, PeriodClosingAuditEvent, PeriodClosingStatus } from "common/data_interfaces";
import { fetchPeriodClosingAudit, fetchPeriodClosingDetail } from "slices/periodClosing/thunk";
import { resetPeriodClosing } from "slices/periodClosing/reducer";
import ReopenPeriodModal from "./ReopenPeriodModal";
import SummaryTab from "./tabs/SummaryTab";
import InventoryProductionTab from "./tabs/InventoryProductionTab";
import SalesDetailTab from "./tabs/SalesDetailTab";
import FeedingTab from "./tabs/FeedingTab";
import HealthTab from "./tabs/HealthTab";
import ReproductionTab from "./tabs/ReproductionTab";
import WorkforceTab from "./tabs/WorkforceTab";
import ComparisonsTab from "./tabs/ComparisonsTab";

const formatDateTime = (iso: string | null | undefined): string => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const TAB_IDS = {
    summary: "1",
    inventory: "2",
    sales: "3",
    feeding: "4",
    health: "5",
    reproduction: "6",
    workforce: "7",
    comparisons: "8",
};

const PeriodClosingDetail = () => {
    const { t } = useTranslation();
    const { closingId } = useParams<{ closingId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<any>();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();

    const current: PeriodClosing | null = useSelector((state: any) => state.PeriodClosing.current);
    const loadingDetail: boolean = useSelector((state: any) => state.PeriodClosing.loadingDetail);
    const audit: PeriodClosingAuditEvent[] = useSelector((state: any) => state.PeriodClosing.audit);
    const loadingAudit: boolean = useSelector((state: any) => state.PeriodClosing.loadingAudit);
    const error: string | null = useSelector((state: any) => state.PeriodClosing.error);

    const [activeTab, setActiveTab] = useState<string>(TAB_IDS.summary);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const MONTHS = t("finance.periodClosing.months", { returnObjects: true }) as string[];

    const formatPeriod = (row: PeriodClosing) => {
        if (row.periodType === "annual") return t("finance.periodClosing.modal.closeYear.yearLabel", { val: row.year });
        return row.month ? `${MONTHS[row.month - 1]} ${row.year}` : `${row.year}`;
    };

    const statusBadge = (status: PeriodClosingStatus) => {
        switch (status) {
            case "closed":
                return <Badge color="success"><i className="ri-lock-line me-1" />{t("finance.periodClosing.status.closed")}</Badge>;
            case "reopened":
                return <Badge color="warning"><i className="ri-lock-unlock-line me-1" />{t("finance.periodClosing.status.reopened")}</Badge>;
            case "archived":
                return <Badge color="secondary"><i className="ri-archive-line me-1" />{t("finance.periodClosing.status.archived")}</Badge>;
        }
    };

    const auditActionLabel: Record<string, { label: string; color: string }> = {
        close: { label: t("finance.periodClosing.detail.audit.action.close"), color: "success" },
        reopen: { label: t("finance.periodClosing.detail.audit.action.reopen"), color: "warning" },
        reclose: { label: t("finance.periodClosing.detail.audit.action.reclose"), color: "info" },
    };

    const toggleTab = (tab: string) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const isSuperadmin = Array.isArray(userLogged?.role)
        ? userLogged.role.includes("Superadmin")
        : userLogged?.role === "Superadmin";

    useEffect(() => {
        document.title = current
            ? `${formatPeriod(current)} | ${t("finance.periodClosing.detail.breadcrumb")}`
            : `${t("finance.periodClosing.detail.breadcrumb")} | ${t("systemName")}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current]);

    const loadDetail = () => {
        if (!closingId) return;
        dispatch(fetchPeriodClosingDetail(closingId));
        dispatch(fetchPeriodClosingAudit(closingId));
    };

    useEffect(() => {
        loadDetail();
        return () => { dispatch(resetPeriodClosing()); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [closingId]);

    const handleReopenSuccess = () => {
        setShowReopenModal(false);
        setAlertConfig({ visible: true, color: "success", message: t("finance.periodClosing.detail.success.reopened") });
        loadDetail();
    };

    if (loadingDetail || !configContext) return <LoadingAnimation />;

    if (!current) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("finance.periodClosing.detail.breadcrumb")} pageTitle="Administración" />
                    <Alert color="danger">{error || t("finance.periodClosing.detail.error")}</Alert>
                    <Button className="farm-secondary-button" onClick={() => navigate("/finance/period-closing")}>
                        <i className="ri-arrow-left-line me-3" />
                        {t("finance.periodClosing.detail.button.back")}
                    </Button>
                </Container>
            </div>
        );
    }

    const { snapshot } = current;
    const isAnnual = current.periodType === "annual";

    const hasExtended = !!(snapshot.inventory || snapshot.production || snapshot.salesDetail
        || snapshot.feeding || snapshot.health || snapshot.reproduction
        || snapshot.workforce || snapshot.comparisons);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={`${t("finance.periodClosing.detail.breadcrumb")} — ${formatPeriod(current)}`} pageTitle="Administración" />

                <div className="mb-3 d-flex">
                    <Button className="farm-secondary-button" onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-3" />
                        {t("finance.periodClosing.detail.button.back")}
                    </Button>
                </div>

                <Card className="mb-3">
                    <CardBody>
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <h4 className="mb-0">{formatPeriod(current)}</h4>
                                    {isAnnual && (
                                        <Badge color="info">
                                            <i className="ri-calendar-2-line me-1" />{t("finance.periodClosing.detail.badge.annual")}
                                        </Badge>
                                    )}
                                    {statusBadge(current.status)}
                                    {current.forced && (
                                        <Badge color="warning">
                                            <i className="ri-alert-line me-1" />{t("finance.periodClosing.detail.badge.forced")}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-muted mt-2">
                                    <div>
                                        <i className="ri-calendar-line me-1 text-muted" />
                                        {t("finance.periodClosing.detail.info.period")} {t("finance.periodClosing.detail.info.periodRange", { start: current.periodStart, end: current.periodEnd })}
                                    </div>
                                    {current.closedBy && (
                                        <div>
                                            <i className="ri-user-line me-1 text-muted" />
                                            {t("finance.periodClosing.detail.info.closedBy")} {t("finance.periodClosing.detail.info.closedByOn", { name: `${current.closedBy.name} ${current.closedBy.lastname}`, date: formatDateTime(current.closedAt) })}
                                        </div>
                                    )}
                                    {current.status === "reopened" && current.reopenedBy && (
                                        <div className="text-warning">
                                            <i className="ri-alert-line me-1 text-warning" />
                                            {t("finance.periodClosing.detail.info.reopenedBy")} {t("finance.periodClosing.detail.info.reopenedByFull", { name: `${current.reopenedBy.name} ${current.reopenedBy.lastname}`, date: formatDateTime(current.reopenedAt), reason: current.reopenReason })}
                                        </div>
                                    )}
                                    {current.forced && current.forcedReason && (
                                        <div className="text-warning">
                                            <i className="ri-alert-line me-1 text-warning" />
                                            {t("finance.periodClosing.detail.info.forcedWith")} {t("finance.periodClosing.detail.info.forcedWithFull", { count: current.forcedWarnings?.length || 0, reason: current.forcedReason })}
                                        </div>
                                    )}
                                    {current.notes && (
                                        <div className="mt-1"><i className="ri-sticky-note-line me-1 text-muted" />{current.notes}</div>
                                    )}
                                </div>
                            </Col>
                            <Col md={4} className="text-end">
                                {isSuperadmin && current.status === "closed" && (
                                    <Button color="warning" onClick={() => setShowReopenModal(true)}>
                                        <i className="ri-lock-unlock-line me-1" />{t("finance.periodClosing.detail.button.reopen")}
                                    </Button>
                                )}
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {!hasExtended && (
                    <Alert color="warning" className="d-flex align-items-start">
                        <i className="ri-information-line me-2 fs-5 text-warning" />
                        <div>
                            <div className="fw-semibold">{t("finance.periodClosing.detail.legacy.title")}</div>
                            <small>{t("finance.periodClosing.detail.legacy.body")}</small>
                        </div>
                    </Alert>
                )}

                <Card>
                    <Nav pills className="nav-justified p-3 flex-wrap">
                        <NavItem>
                            <NavLink className={classnames({ active: activeTab === TAB_IDS.summary })} onClick={() => toggleTab(TAB_IDS.summary)} style={{ cursor: "pointer" }}>
                                <i className="ri-dashboard-line me-1" />{t("finance.periodClosing.detail.tab.summary")}
                            </NavLink>
                        </NavItem>
                        {hasExtended && (
                            <>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.inventory })} onClick={() => toggleTab(TAB_IDS.inventory)} style={{ cursor: "pointer" }}>
                                        <i className="ri-archive-line me-1" />{t("finance.periodClosing.detail.tab.inventory")}
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.sales })} onClick={() => toggleTab(TAB_IDS.sales)} style={{ cursor: "pointer" }}>
                                        <i className="ri-money-dollar-circle-line me-1" />{t("finance.periodClosing.detail.tab.sales")}
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.feeding })} onClick={() => toggleTab(TAB_IDS.feeding)} style={{ cursor: "pointer" }}>
                                        <i className="ri-restaurant-line me-1" />{t("finance.periodClosing.detail.tab.feeding")}
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.health })} onClick={() => toggleTab(TAB_IDS.health)} style={{ cursor: "pointer" }}>
                                        <i className="ri-medicine-bottle-line me-1" />{t("finance.periodClosing.detail.tab.health")}
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.reproduction })} onClick={() => toggleTab(TAB_IDS.reproduction)} style={{ cursor: "pointer" }}>
                                        <i className="ri-heart-pulse-line me-1" />{t("finance.periodClosing.detail.tab.reproduction")}
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.workforce })} onClick={() => toggleTab(TAB_IDS.workforce)} style={{ cursor: "pointer" }}>
                                        <i className="ri-group-line me-1" />{t("finance.periodClosing.detail.tab.workforce")}
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.comparisons })} onClick={() => toggleTab(TAB_IDS.comparisons)} style={{ cursor: "pointer" }}>
                                        <i className="ri-bar-chart-box-line me-1" />{t("finance.periodClosing.detail.tab.comparisons")}
                                    </NavLink>
                                </NavItem>
                            </>
                        )}
                    </Nav>
                </Card>

                <TabContent activeTab={activeTab} className="mt-3">
                    <TabPane tabId={TAB_IDS.summary}>
                        <SummaryTab snapshot={snapshot} isAnnual={isAnnual} />
                    </TabPane>
                    {hasExtended && (
                        <>
                            <TabPane tabId={TAB_IDS.inventory}>
                                <InventoryProductionTab snapshot={snapshot} />
                            </TabPane>
                            <TabPane tabId={TAB_IDS.sales}>
                                <SalesDetailTab snapshot={snapshot} />
                            </TabPane>
                            <TabPane tabId={TAB_IDS.feeding}>
                                <FeedingTab snapshot={snapshot} />
                            </TabPane>
                            <TabPane tabId={TAB_IDS.health}>
                                <HealthTab snapshot={snapshot} />
                            </TabPane>
                            <TabPane tabId={TAB_IDS.reproduction}>
                                <ReproductionTab snapshot={snapshot} />
                            </TabPane>
                            <TabPane tabId={TAB_IDS.workforce}>
                                <WorkforceTab snapshot={snapshot} />
                            </TabPane>
                            <TabPane tabId={TAB_IDS.comparisons}>
                                <ComparisonsTab snapshot={snapshot} isAnnual={isAnnual} />
                            </TabPane>
                        </>
                    )}
                </TabContent>

                <Card className="mb-3 mt-3">
                    <CardHeader>
                        <h5 className="mb-0"><i className="ri-history-line me-2 text-primary" />{t("finance.periodClosing.detail.audit.header")}</h5>
                    </CardHeader>
                    <CardBody>
                        {loadingAudit ? (
                            <p className="text-muted mb-0">{t("finance.periodClosing.detail.audit.loading")}</p>
                        ) : audit.length === 0 ? (
                            <p className="text-muted mb-0">{t("finance.periodClosing.detail.audit.empty")}</p>
                        ) : (
                            <Table className="align-middle mb-0" size="sm">
                                <thead className="table-light">
                                    <tr>
                                        <th>{t("finance.periodClosing.detail.audit.col.action")}</th>
                                        <th>{t("finance.periodClosing.detail.audit.col.user")}</th>
                                        <th>{t("finance.periodClosing.detail.audit.col.date")}</th>
                                        <th>{t("finance.periodClosing.detail.audit.col.reason")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {audit.map((ev) => {
                                        const cfg = auditActionLabel[ev.action] || { label: ev.action, color: "secondary" };
                                        return (
                                            <tr key={ev._id}>
                                                <td><Badge color={cfg.color}>{cfg.label}</Badge></td>
                                                <td>{ev.performedBy ? `${ev.performedBy.name} ${ev.performedBy.lastname}` : "-"}</td>
                                                <td>{formatDateTime(ev.performedAt)}</td>
                                                <td>{ev.reason || "-"}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </Container>

            {current && (
                <ReopenPeriodModal
                    isOpen={showReopenModal}
                    onClose={() => setShowReopenModal(false)}
                    onSuccess={handleReopenSuccess}
                    closingId={current._id}
                    periodLabel={formatPeriod(current)}
                />
            )}

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </div>
    );
};

export default PeriodClosingDetail;
