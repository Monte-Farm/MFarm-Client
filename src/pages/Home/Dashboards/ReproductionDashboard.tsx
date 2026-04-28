import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import CustomTable from "Components/Common/Tables/CustomTable";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { Column } from "common/data/data_types";

interface Props { startDate: string; endDate: string; }

interface UpcomingBirth { sowIdentifier: string; estimatedBirthDate: string; daysToBirth: number; }
interface Insemination { _id: string; date: string; sowIdentifier: string; boarOrSample: string; result: string; }

interface ReproductionData {
    kpis: {
        inseminationEffectiveness: number;
        avgWeaningHeatInterval: number;
        avgBornAlivePerBirth: number;
        avgWeanedPerSow: number;
        pendingInseminations: number;
        upcomingBirths: number;
    };
    upcomingBirthsList: UpcomingBirth[];
    recentInseminations: Insemination[];
    monthlyEffectiveness: { month: string; total: number; successful: number; rate: number }[];
    bornAliveVsDead: { month: string; bornAlive: number; bornDead: number; mummified: number }[];
}

const ReproductionDashboard: React.FC<Props> = ({ startDate, endDate }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [data, setData] = useState<ReproductionData | null>(null);

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/dashboard/reproduction/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            setData(res.data.data);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: t("dashboard.error") });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [startDate, endDate]);

    if (loading) return <LoadingAnimation absolutePosition={false} />;
    if (!data) return null;

    const effectivenessLine = [{
        id: t("dashboard.reproduction.kpi.effectiveness"),
        data: data.monthlyEffectiveness.map(m => ({ x: m.month, y: m.rate })),
        color: "#10b981",
    }];

    const bornBarData = data.bornAliveVsDead.map(m => ({
        month: m.month,
        [t("dashboard.reproduction.chart.bornAlive")]: m.bornAlive,
        [t("dashboard.reproduction.chart.bornDead")]: m.bornDead,
        [t("dashboard.reproduction.chart.mummified")]: m.mummified,
    }));

    const upcomingColumns: Column<UpcomingBirth>[] = [
        { header: t("dashboard.reproduction.table.sow"), accessor: "sowIdentifier", type: "text" },
        { header: t("dashboard.reproduction.table.estimatedDate"), accessor: "estimatedBirthDate", type: "date" },
        {
            header: t("dashboard.reproduction.table.days"), accessor: "daysToBirth", type: "text",
            render: (v: number) => (
                <Badge color={v < 0 ? "danger" : v <= 7 ? "warning" : "info"}>
                    {v < 0 ? t("dashboard.reproduction.table.delayed", { days: Math.abs(v) }) : t("dashboard.reproduction.table.inDays", { days: v })}
                </Badge>
            ),
        },
    ];

    const insemColumns: Column<Insemination>[] = [
        { header: t("dashboard.reproduction.table.date"), accessor: "date", type: "date" },
        { header: t("dashboard.reproduction.table.sow"), accessor: "sowIdentifier", type: "text", isFilterable: true },
        { header: t("dashboard.reproduction.table.boarOrSample"), accessor: "boarOrSample", type: "text" },
        {
            header: t("dashboard.reproduction.table.result"), accessor: "result", type: "text",
            render: (v: string) => {
                const color = v === "success" ? "success" : v === "pending" ? "warning" : v === "failed" ? "danger" : "secondary";
                return <Badge color={color}>{t(`dashboard.reproduction.result.${v}`, { defaultValue: v })}</Badge>;
            },
        },
    ];

    return (
        <>
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("dashboard.reproduction.kpi.effectiveness")} value={data.kpis.inseminationEffectiveness} suffix="%" decimals={1}
                        icon={<i className="ri-check-double-line fs-4 text-success"></i>}
                        iconBgColor="#E8F5E9" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("dashboard.reproduction.kpi.weaningHeat")} value={data.kpis.avgWeaningHeatInterval} suffix=" d" decimals={1}
                        icon={<i className="ri-timer-line fs-4 text-info"></i>}
                        iconBgColor="#E0F7FA" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("dashboard.reproduction.kpi.bornAlivePerBirth")} value={data.kpis.avgBornAlivePerBirth} decimals={1}
                        icon={<i className="bx bxs-baby-carriage fs-4 text-primary"></i>} animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("dashboard.reproduction.kpi.weanedPerSow")} value={data.kpis.avgWeanedPerSow} decimals={1}
                        icon={<i className="ri-parent-line fs-4 text-warning"></i>}
                        iconBgColor="#FFF8E1" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("dashboard.reproduction.kpi.pendingInseminations")} value={data.kpis.pendingInseminations}
                        icon={<i className="ri-hourglass-line fs-4 text-warning"></i>}
                        iconBgColor="#FFF8E1" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("dashboard.reproduction.kpi.upcomingBirths")} value={data.kpis.upcomingBirths}
                        icon={<i className="ri-calendar-event-line fs-4 text-danger"></i>}
                        iconBgColor="#FEE2E2" animateValue />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={6}>
                    <BasicLineChartCard
                        title={t("dashboard.reproduction.chart.monthlyEffectiveness")}
                        data={effectivenessLine}
                        yLabel={t("dashboard.reproduction.chart.effectivenessY")}
                        xLabel={t("dashboard.reproduction.chart.xLabel")}
                        height={300}
                        enableArea
                        areaOpacity={0.1}
                    />
                </Col>
                <Col xl={6}>
                    <BasicBarChart
                        title={t("dashboard.reproduction.chart.bornAliveVsDead")}
                        data={bornBarData}
                        indexBy="month"
                        keys={[t("dashboard.reproduction.chart.bornAlive"), t("dashboard.reproduction.chart.bornDead"), t("dashboard.reproduction.chart.mummified")]}
                        xLegend={t("dashboard.reproduction.chart.xLabel")}
                        yLegend={t("dashboard.reproduction.chart.yLabel")}
                        height={300}
                        colors={["#10b981", "#ef4444", "#6b7280"]}
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={5}>
                    <Card className="h-100">
                        <CardHeader>
                            <h6 className="mb-0 text-muted">
                                <i className="ri-calendar-event-line me-1 text-primary"></i>
                                {t("dashboard.reproduction.table.upcomingBirths")}
                            </h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={upcomingColumns} data={data.upcomingBirthsList || []} rowsPerPage={8} showSearchAndFilter={false} />
                        </CardBody>
                    </Card>
                </Col>
                <Col xl={7}>
                    <Card className="h-100">
                        <CardHeader>
                            <h6 className="mb-0 text-muted">{t("dashboard.reproduction.table.recentInseminations")}</h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={insemColumns} data={data.recentInseminations || []} rowsPerPage={8} showSearchAndFilter />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))} />
        </>
    );
};

export default ReproductionDashboard;
