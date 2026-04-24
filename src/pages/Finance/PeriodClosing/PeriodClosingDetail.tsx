import { useContext, useEffect, useState } from "react";
import classnames from "classnames";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Col, Container, Nav, NavItem, NavLink, Row, Table, TabContent, TabPane } from "reactstrap";
import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { PeriodClosing, PeriodClosingAuditEvent, PeriodClosingStatus } from "common/data_interfaces";
import { fetchPeriodClosingAudit, fetchPeriodClosingDetail } from "slices/periodClosing/thunk";
import ReopenPeriodModal from "./ReopenPeriodModal";
import SummaryTab from "./tabs/SummaryTab";
import InventoryProductionTab from "./tabs/InventoryProductionTab";
import SalesDetailTab from "./tabs/SalesDetailTab";
import FeedingTab from "./tabs/FeedingTab";
import HealthTab from "./tabs/HealthTab";
import ReproductionTab from "./tabs/ReproductionTab";
import WorkforceTab from "./tabs/WorkforceTab";
import ComparisonsTab from "./tabs/ComparisonsTab";

const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const formatPeriod = (row: PeriodClosing) => {
    if (row.periodType === "annual") return `Año ${row.year}`;
    return row.month ? `${MONTHS_ES[row.month - 1]} ${row.year}` : `${row.year}`;
};

const formatDateTime = (iso: string | null | undefined): string => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const statusBadge = (status: PeriodClosingStatus) => {
    switch (status) {
        case "closed":
            return <Badge color="success"><i className="ri-lock-line me-1" />Cerrado</Badge>;
        case "reopened":
            return <Badge color="warning"><i className="ri-lock-unlock-line me-1" />Reabierto</Badge>;
        case "archived":
            return <Badge color="secondary"><i className="ri-archive-line me-1" />Archivado</Badge>;
    }
};

const auditActionLabel: Record<string, { label: string; color: string }> = {
    close: { label: "Cierre", color: "success" },
    reopen: { label: "Reapertura", color: "warning" },
    reclose: { label: "Recierre", color: "info" },
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
    const { closingId } = useParams<{ closingId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<any>();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const current: PeriodClosing | null = useSelector((state: any) => state.PeriodClosing.current);
    const loadingDetail: boolean = useSelector((state: any) => state.PeriodClosing.loadingDetail);
    const audit: PeriodClosingAuditEvent[] = useSelector((state: any) => state.PeriodClosing.audit);
    const loadingAudit: boolean = useSelector((state: any) => state.PeriodClosing.loadingAudit);
    const error: string | null = useSelector((state: any) => state.PeriodClosing.error);

    const [activeTab, setActiveTab] = useState<string>(TAB_IDS.summary);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const toggleTab = (tab: string) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const isSuperadmin = Array.isArray(userLogged?.role)
        ? userLogged.role.includes("Superadmin")
        : userLogged?.role === "Superadmin";

    document.title = current ? `${formatPeriod(current)} | Cierres` : "Cierre | MFarm";

    const loadDetail = () => {
        if (!closingId) return;
        dispatch(fetchPeriodClosingDetail(closingId));
        dispatch(fetchPeriodClosingAudit(closingId));
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [closingId]);

    const handleReopenSuccess = () => {
        setShowReopenModal(false);
        setAlertConfig({ visible: true, color: "success", message: "Cierre reabierto correctamente." });
        loadDetail();
    };

    if (loadingDetail || !configContext) return <LoadingAnimation />;

    if (!current) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Detalle de cierre" pageTitle="Administración" />
                    <Alert color="danger">{error || "No se pudo cargar el cierre."}</Alert>
                    <Button className="farm-secondary-button" onClick={() => navigate("/finance/period-closing")}>
                        <i className="ri-arrow-left-line me-3" />
                        Regresar
                    </Button>
                </Container>
            </div>
        );
    }

    const { snapshot } = current;
    const isAnnual = current.periodType === "annual";

    // Detect legacy snapshot (no new sections)
    const hasExtended = !!(snapshot.inventory || snapshot.production || snapshot.salesDetail
        || snapshot.feeding || snapshot.health || snapshot.reproduction
        || snapshot.workforce || snapshot.comparisons);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={`Cierre — ${formatPeriod(current)}`} pageTitle="Administración" />

                <div className="mb-3 d-flex">
                    <Button className="farm-secondary-button" onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-3" />
                        Regresar
                    </Button>
                </div>

                {/* Header card */}
                <Card className="mb-3">
                    <CardBody>
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <h4 className="mb-0">{formatPeriod(current)}</h4>
                                    {isAnnual && (
                                        <Badge color="info">
                                            <i className="ri-calendar-2-line me-1" />Cierre anual
                                        </Badge>
                                    )}
                                    {statusBadge(current.status)}
                                    {current.forced && (
                                        <Badge color="warning">
                                            <i className="ri-alert-line me-1" />Forzado
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-muted mt-2">
                                    <div>
                                        <i className="ri-calendar-line me-1 text-muted" />
                                        Periodo: {current.periodStart} a {current.periodEnd}
                                    </div>
                                    {current.closedBy && (
                                        <div>
                                            <i className="ri-user-line me-1 text-muted" />
                                            Cerrado por {current.closedBy.name} {current.closedBy.lastname} el {formatDateTime(current.closedAt)}
                                        </div>
                                    )}
                                    {current.status === "reopened" && current.reopenedBy && (
                                        <div className="text-warning">
                                            <i className="ri-alert-line me-1 text-warning" />
                                            Reabierto por {current.reopenedBy.name} {current.reopenedBy.lastname} el {formatDateTime(current.reopenedAt)} — Razón: {current.reopenReason}
                                        </div>
                                    )}
                                    {current.forced && current.forcedReason && (
                                        <div className="text-warning">
                                            <i className="ri-alert-line me-1 text-warning" />
                                            Cierre forzado con {current.forcedWarnings?.length || 0} error(es) ignorado(s) — Razón: {current.forcedReason}
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
                                        <i className="ri-lock-unlock-line me-1" />Reabrir
                                    </Button>
                                )}
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Legacy snapshot banner */}
                {!hasExtended && (
                    <Alert color="warning" className="d-flex align-items-start">
                        <i className="ri-information-line me-2 fs-5 text-warning" />
                        <div>
                            <div className="fw-semibold">Cierre generado antes de la extensión del snapshot</div>
                            <small>
                                Este cierre fue creado con una versión anterior del sistema y no incluye las
                                nuevas secciones (Inventario, Producción, Ventas detalladas, Alimentación, Sanidad,
                                Reproducción, Personal ni Comparativas). Solo está disponible el resumen financiero.
                            </small>
                        </div>
                    </Alert>
                )}

                {/* Tabs */}
                <Card>
                    <Nav pills className="nav-justified p-3 flex-wrap">
                        <NavItem>
                            <NavLink className={classnames({ active: activeTab === TAB_IDS.summary })} onClick={() => toggleTab(TAB_IDS.summary)} style={{ cursor: "pointer" }}>
                                <i className="ri-dashboard-line me-1" />Resumen
                            </NavLink>
                        </NavItem>
                        {hasExtended && (
                            <>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.inventory })} onClick={() => toggleTab(TAB_IDS.inventory)} style={{ cursor: "pointer" }}>
                                        <i className="ri-archive-line me-1" />Inventario y Producción
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.sales })} onClick={() => toggleTab(TAB_IDS.sales)} style={{ cursor: "pointer" }}>
                                        <i className="ri-money-dollar-circle-line me-1" />Ventas
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.feeding })} onClick={() => toggleTab(TAB_IDS.feeding)} style={{ cursor: "pointer" }}>
                                        <i className="ri-restaurant-line me-1" />Alimentación
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.health })} onClick={() => toggleTab(TAB_IDS.health)} style={{ cursor: "pointer" }}>
                                        <i className="ri-medicine-bottle-line me-1" />Sanidad
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.reproduction })} onClick={() => toggleTab(TAB_IDS.reproduction)} style={{ cursor: "pointer" }}>
                                        <i className="ri-heart-pulse-line me-1" />Reproducción
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.workforce })} onClick={() => toggleTab(TAB_IDS.workforce)} style={{ cursor: "pointer" }}>
                                        <i className="ri-group-line me-1" />Personal
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === TAB_IDS.comparisons })} onClick={() => toggleTab(TAB_IDS.comparisons)} style={{ cursor: "pointer" }}>
                                        <i className="ri-bar-chart-box-line me-1" />Comparativas
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

                {/* Audit trail (always visible below tabs) */}
                <Card className="mb-3 mt-3">
                    <CardHeader>
                        <h5 className="mb-0"><i className="ri-history-line me-2 text-primary" />Auditoría</h5>
                    </CardHeader>
                    <CardBody>
                        {loadingAudit ? (
                            <p className="text-muted mb-0">Cargando auditoría...</p>
                        ) : audit.length === 0 ? (
                            <p className="text-muted mb-0">Sin eventos registrados.</p>
                        ) : (
                            <Table className="align-middle mb-0" size="sm">
                                <thead className="table-light">
                                    <tr>
                                        <th>Acción</th>
                                        <th>Usuario</th>
                                        <th>Fecha</th>
                                        <th>Razón</th>
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
