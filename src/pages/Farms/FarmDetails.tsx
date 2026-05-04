import { ConfigContext } from "App";
import { FarmData, UserData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalHeader, Row } from "reactstrap";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import DonutChartCard from "Components/Common/Graphics/DonutChartCard";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import farmDefaultImage from "assets/images/establo-cerdo.jpg";
import managerDefaultImage from "assets/images/default-profile-mage.jpg";
import { useTranslation } from "react-i18next";
import { stageLabelsEs } from "pages/Home/dashboardHelpers";

// ── tipos ──────────────────────────────────────────────────────────────────────

interface ExecutiveData {
    finance: { totalIncome: number; totalCosts: number; operatingResult: number; operatingMargin: number };
    production: { totalActivePigs: number; totalActiveGroups: number; mortalityRate: number; avgFcr: number };
    groupsByStage: { stage: string; stageLabel: string; pigCount: number }[];
    costVsIncomeMonthly: { month: string; totalCost: number; totalIncome: number }[];
}

interface ReproductionData {
    kpis: {
        inseminationEffectiveness: number;
        avgBornAlivePerBirth: number;
        pendingInseminations: number;
        upcomingBirths: number;
    };
}

interface VeterinaryData {
    kpis: {
        mortalityRate: number;
        totalDeaths: number;
        medicationsApplied: number;
        vaccinationsApplied: number;
        groupsWithHealthAlerts: number;
    };
}

// ── helpers ────────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];
const firstOfYear = () => `${new Date().getFullYear()}-01-01`;
const dateLocaleMap: Record<string, string> = { sp: "es-MX", en: "en-US", pt: "pt-BR" };
const stageColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444"];

const SectionTitle: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
    <div className="d-flex align-items-center gap-2 mb-3">
        <i className={`${icon} fs-5 text-primary`} />
        <span className="fw-semibold fs-6 text-muted text-uppercase" style={{ letterSpacing: "0.05em", fontSize: "12px" }}>
            {label}
        </span>
        <hr className="flex-grow-1 my-0" />
    </div>
);

// ── componente ─────────────────────────────────────────────────────────────────

const FarmDetails = () => {
    const { t } = useTranslation();
    const { farm_id } = useParams();
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext);

    const [farmData, setFarmData] = useState<FarmData | null>(null);
    const [managerData, setManagerData] = useState<UserData | null>(null);
    const [executive, setExecutive] = useState<ExecutiveData | null>(null);
    const [reproduction, setReproduction] = useState<ReproductionData | null>(null);
    const [veterinary, setVeterinary] = useState<VeterinaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dashLoading, setDashLoading] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [startDate, setStartDate] = useState(firstOfYear());
    const [endDate, setEndDate] = useState(today());

    const shortMonths = t("common.shortMonths", { returnObjects: true }) as string[];
    const formatDateLabel = (dateStr: string) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${parseInt(day)} ${shortMonths[parseInt(month) - 1]} ${year}`;
    };
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const showError = (msg: string) => {
        setAlertConfig({ visible: true, color: "danger", message: msg });
        setTimeout(() => setAlertConfig(p => ({ ...p, visible: false })), 5000);
    };

    const fetchFarm = async () => {
        if (!configContext || !farm_id) return;
        try {
            const res = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/find_by_id/${farm_id}`);
            setFarmData(res.data.data);
            setManagerData(res.data.data.manager);
        } catch {
            showError(t("farms.error.fetchDetails"));
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboard = async () => {
        if (!configContext || !farm_id) return;
        setDashLoading(true);
        try {
            const qs = `?start_date=${startDate}&end_date=${endDate}`;
            const [execRes, reproRes, vetRes] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/dashboard/executive/${farm_id}${qs}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/dashboard/reproduction/${farm_id}${qs}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/dashboard/veterinary/${farm_id}${qs}`),
            ]);
            setExecutive(execRes.data.data);
            setReproduction(reproRes.data.data);
            setVeterinary(vetRes.data.data);
        } catch {
            showError(t("farms.details.dashboard.error"));
        } finally {
            setDashLoading(false);
        }
    };

    useEffect(() => { fetchFarm(); }, []);
    useEffect(() => { fetchDashboard(); }, [startDate, endDate]);

    if (loading) return <LoadingAnimation />;

    const d = t("farms.details.dashboard");
    const incomeVsCost = executive ? [
        { id: t("dashboard.executive.chart.income"), data: executive.costVsIncomeMonthly.map(m => ({ x: m.month, y: m.totalIncome })), color: "#10b981" },
        { id: t("dashboard.executive.chart.costs"), data: executive.costVsIncomeMonthly.map(m => ({ x: m.month, y: m.totalCost })), color: "#ef4444" },
    ] : [];

    const stageDonut = (executive?.groupsByStage ?? []).map((s, idx) => ({
        id: s.stageLabel || stageLabelsEs[s.stage] || s.stage,
        label: s.stageLabel || stageLabelsEs[s.stage] || s.stage,
        value: s.pigCount,
        color: stageColors[idx % stageColors.length],
    }));

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t("farms.details.breadcrumb")} pageTitle={t("farms.breadcrumbParent")} />

                <div className="mb-3">
                    <Button className="farm-secondary-button" onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-2" />
                        {t("common.button.back")}
                    </Button>
                </div>

                {/* ── Encabezado: info granja + gerente ── */}
                <Row className="g-3 mb-4">
                    <Col lg={5}>
                        <Card className="h-100 border-0 shadow-sm">
                            <CardBody className="d-flex gap-3 align-items-center p-3">
                                <img
                                    src={farmData?.image || farmDefaultImage}
                                    alt=""
                                    style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                                    onError={e => { (e.target as HTMLImageElement).src = farmDefaultImage; }}
                                />
                                <div className="flex-grow-1 min-w-0">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <h5 className="mb-0 fw-bold text-truncate">{farmData?.name}</h5>
                                        <Badge color={farmData?.status ? "success" : "danger"} className="flex-shrink-0">
                                            {farmData?.status ? t("common.status.active") : t("common.status.inactive")}
                                        </Badge>
                                    </div>
                                    <div className="text-muted small"><i className="ri-barcode-line me-1" />{farmData?.code}</div>
                                    <div className="text-muted small"><i className="ri-map-pin-line me-1" />{farmData?.location}</div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        <Card className="h-100 border-0 shadow-sm">
                            <CardBody className="d-flex gap-3 align-items-center p-3">
                                <img
                                    src={managerData?.profile_image || managerDefaultImage}
                                    alt=""
                                    style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                                    onError={e => { (e.target as HTMLImageElement).src = managerDefaultImage; }}
                                />
                                <div className="flex-grow-1 min-w-0">
                                    <div className="fw-semibold text-truncate">{managerData?.name} {managerData?.lastname}</div>
                                    <div className="text-muted small text-truncate"><i className="ri-user-line me-1" />{managerData?.username}</div>
                                    <div className="text-muted small text-truncate"><i className="ri-mail-line me-1" />{managerData?.email}</div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={3}>
                        <Card className="h-100 border-0 shadow-sm">
                            <CardBody className="d-flex justify-content-center align-items-center p-3">
                                <Button
                                    color="light"
                                    className="d-flex align-items-center gap-2 shadow-sm border w-100 justify-content-center"
                                    onClick={() => setPickerOpen(true)}
                                    style={{ borderRadius: "8px", padding: "8px 16px" }}
                                >
                                    <i className="ri-calendar-line text-primary" style={{ fontSize: "16px" }} />
                                    <span style={{ fontSize: "13px" }}>
                                        <span className="fw-semibold">{formatDateLabel(startDate)}</span>
                                        <span className="text-muted" style={{ margin: "0 6px" }}>—</span>
                                        <span className="fw-semibold">{formatDateLabel(endDate)}</span>
                                    </span>
                                    <i className="ri-arrow-down-s-line text-muted" />
                                </Button>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {dashLoading ? <LoadingAnimation absolutePosition={false} /> : (
                    <>
                        {/* ── Financiero ── */}
                        {executive && (
                            <>
                                <SectionTitle icon="ri-money-dollar-circle-line" label={t("farms.details.dashboard.sectionFinance")} />
                                <Row className="g-3 mb-4">
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.totalIncome")} value={executive.finance.totalIncome} prefix="$" decimals={2}
                                            icon={<i className="ri-money-dollar-circle-line fs-4 text-success" />} iconBgColor="#E8F5E9" animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.totalCosts")} value={executive.finance.totalCosts} prefix="$" decimals={2}
                                            icon={<i className="ri-shopping-cart-2-line fs-4 text-danger" />} iconBgColor="#FEE2E2" animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.operatingResult")} value={executive.finance.operatingResult} prefix="$" decimals={2}
                                            icon={<i className="ri-line-chart-line fs-4 text-primary" />} iconBgColor="#EEF2FF" animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.operatingMargin")} value={executive.finance.operatingMargin} suffix="%" decimals={2}
                                            icon={<i className="ri-percent-line fs-4 text-warning" />} iconBgColor="#FFF8E1" animateValue />
                                    </Col>
                                </Row>
                            </>
                        )}

                        {/* ── Producción ── */}
                        {executive && (
                            <>
                                <SectionTitle icon="bx bxs-dog" label={t("farms.details.dashboard.sectionProduction")} />
                                <Row className="g-3 mb-4">
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.activePigs")} value={executive.production.totalActivePigs}
                                            icon={<i className="bx bxs-dog fs-4 text-info" />} iconBgColor="#E0F7FA" animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.activeGroups")} value={executive.production.totalActiveGroups}
                                            icon={<i className="ri-group-line fs-4 text-primary" />} animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.mortalityRate")} value={executive.production.mortalityRate} suffix="%" decimals={2}
                                            icon={<i className="ri-alert-line fs-4 text-danger" />} iconBgColor="#FEE2E2" animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.avgFcr")} value={executive.production.avgFcr} decimals={2}
                                            icon={<i className="ri-restaurant-line fs-4 text-warning" />} iconBgColor="#FFF8E1" animateValue />
                                    </Col>
                                </Row>

                                <Row className="g-3 mb-4">
                                    <Col xl={8}>
                                        <BasicLineChartCard
                                            title={t("dashboard.executive.chart.incomeVsCost")}
                                            data={incomeVsCost}
                                            yLabel={t("dashboard.executive.chart.yLabel")}
                                            xLabel={t("dashboard.executive.chart.xLabel")}
                                            height={280}
                                            enableArea
                                            areaOpacity={0.08}
                                            showLegend
                                        />
                                    </Col>
                                    <Col xl={4}>
                                        <DonutChartCard
                                            title={t("dashboard.executive.chart.pigsByStage")}
                                            data={stageDonut}
                                            height={280}
                                        />
                                    </Col>
                                </Row>
                            </>
                        )}

                        {/* ── Reproducción ── */}
                        {reproduction && (
                            <>
                                <SectionTitle icon="ri-heart-pulse-line" label={t("farms.details.dashboard.sectionReproduction")} />
                                <Row className="g-3 mb-4">
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.inseminationEffectiveness")} value={reproduction.kpis.inseminationEffectiveness} suffix="%" decimals={1}
                                            icon={<i className="ri-heart-pulse-line fs-4 text-success" />} iconBgColor="#E8F5E9" animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.avgBornAlive")} value={reproduction.kpis.avgBornAlivePerBirth} decimals={1}
                                            icon={<i className="ri-baby-line fs-4 text-info" />} iconBgColor="#E0F7FA" animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.upcomingBirths")} value={reproduction.kpis.upcomingBirths}
                                            icon={<i className="ri-calendar-event-line fs-4 text-warning" />} iconBgColor="#FFF8E1" animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.pendingInseminations")} value={reproduction.kpis.pendingInseminations}
                                            icon={<i className="ri-time-line fs-4 text-primary" />} iconBgColor="#EEF2FF" animateValue />
                                    </Col>
                                </Row>
                            </>
                        )}

                        {/* ── Sanidad ── */}
                        {veterinary && (
                            <>
                                <SectionTitle icon="ri-first-aid-kit-line" label={t("farms.details.dashboard.sectionHealth")} />
                                <Row className="g-3 mb-4">
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.totalDeaths")} value={veterinary.kpis.totalDeaths}
                                            icon={<i className="ri-alert-line fs-4 text-danger" />} iconBgColor="#FEE2E2" animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.medicationsApplied")} value={veterinary.kpis.medicationsApplied}
                                            icon={<i className="ri-capsule-line fs-4 text-info" />} iconBgColor="#E0F7FA" animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.vaccinationsApplied")} value={veterinary.kpis.vaccinationsApplied}
                                            icon={<i className="ri-syringe-line fs-4 text-success" />} iconBgColor="#E8F5E9" animateValue />
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <StatKpiCard title={t("farms.details.dashboard.kpi.groupsWithAlerts")} value={veterinary.kpis.groupsWithHealthAlerts}
                                            icon={<i className="ri-error-warning-line fs-4 text-warning" />} iconBgColor="#FFF8E1" animateValue />
                                    </Col>
                                </Row>
                            </>
                        )}
                    </>
                )}
            </Container>

            <Modal isOpen={pickerOpen} toggle={() => setPickerOpen(false)} centered>
                <ModalHeader toggle={() => setPickerOpen(false)}>
                    <i className="ri-calendar-line me-2" />
                    {t("dashboard.header.selectDateRange")}
                </ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={(s, e) => { setStartDate(s); setEndDate(e); setPickerOpen(false); }}
                    onCancel={() => setPickerOpen(false)}
                    generateButtonText={t("dashboard.header.apply")}
                />
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible}
                onClose={() => setAlertConfig(p => ({ ...p, visible: false }))} />
        </div>
    );
};

export default FarmDetails;
