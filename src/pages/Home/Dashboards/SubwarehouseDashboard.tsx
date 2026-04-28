import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { Column } from "common/data/data_types";
import { movementTypeLabels } from "../dashboardHelpers";

interface Props { startDate: string; endDate: string; }

interface StockItem { productName: string; currentStock: number; unit: string; status: string; }
interface MoveItem { _id: string; date: string; productName: string; movementType: string; quantity: number; unit: string; }

interface SubwarehouseData {
    kpis: { subwarehouseName: string; totalProducts: number; totalMovements: number; pendingDistributions: number; criticalStockCount: number; };
    criticalStock: StockItem[];
    recentMovements: MoveItem[];
}

const SubwarehouseDashboard: React.FC<Props> = ({ startDate, endDate }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [data, setData] = useState<SubwarehouseData | null>(null);

    const subwarehouseId = userLogged?.assigment || userLogged?.farm_assigned;

    const fetchData = async () => {
        if (!configContext || !userLogged || !subwarehouseId) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/dashboard/subwarehouse/${subwarehouseId}?start_date=${startDate}&end_date=${endDate}`
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

    const stockColumns: Column<StockItem>[] = [
        { header: t("dashboard.subwarehouse.table.product"), accessor: "productName", type: "text", isFilterable: true },
        {
            header: t("dashboard.subwarehouse.table.stock"), accessor: "currentStock", type: "text",
            render: (v: number, row) => <span>{v?.toFixed(2)} {row.unit}</span>,
        },
        {
            header: t("dashboard.subwarehouse.table.status"), accessor: "status", type: "text",
            render: (v: string) => <Badge color={v === "critical" ? "danger" : "warning"}>{v === "critical" ? t("dashboard.subwarehouse.table.statusCritical") : t("dashboard.subwarehouse.table.statusLow")}</Badge>,
        },
    ];

    const movColumns: Column<MoveItem>[] = [
        { header: t("dashboard.subwarehouse.table.date"), accessor: "date", type: "date" },
        { header: t("dashboard.subwarehouse.table.product"), accessor: "productName", type: "text", isFilterable: true },
        {
            header: t("dashboard.subwarehouse.table.type"), accessor: "movementType", type: "text",
            render: (v: string) => {
                const m = movementTypeLabels[v] || { label: v, color: "secondary" };
                return <Badge color={m.color}>{t(`dashboard.movementType.${v}`, { defaultValue: m.label })}</Badge>;
            },
        },
        {
            header: t("dashboard.subwarehouse.table.quantity"), accessor: "quantity", type: "text",
            render: (v: number, row) => <span>{v} {row.unit}</span>,
        },
    ];

    return (
        <>
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard title={data.kpis.subwarehouseName || t("dashboard.subwarehouse.kpi.products")} value={data.kpis.totalProducts}
                        subtext={t("dashboard.subwarehouse.kpi.products")}
                        icon={<i className="ri-archive-line fs-4 text-primary"></i>} animateValue />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard title={t("dashboard.subwarehouse.kpi.movements")} value={data.kpis.totalMovements}
                        icon={<i className="ri-swap-line fs-4 text-info"></i>}
                        iconBgColor="#E0F7FA" animateValue />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard title={t("dashboard.subwarehouse.kpi.pendingDistributions")} value={data.kpis.pendingDistributions}
                        icon={<i className="ri-truck-line fs-4 text-warning"></i>}
                        iconBgColor="#FFF8E1" animateValue />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard title={t("dashboard.subwarehouse.kpi.criticalStock")} value={data.kpis.criticalStockCount}
                        icon={<i className="ri-alert-line fs-4 text-danger"></i>}
                        iconBgColor="#FEE2E2" animateValue />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={6}>
                    <Card className="h-100">
                        <CardHeader>
                            <h6 className="mb-0 text-muted">
                                <i className="ri-error-warning-line me-1 text-danger"></i>
                                {t("dashboard.subwarehouse.table.criticalStock")}
                            </h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={stockColumns} data={data.criticalStock || []} rowsPerPage={10} showSearchAndFilter={false} />
                        </CardBody>
                    </Card>
                </Col>
                <Col xl={6}>
                    <Card className="h-100">
                        <CardHeader>
                            <h6 className="mb-0 text-muted">{t("dashboard.subwarehouse.table.recentMovements")}</h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={movColumns} data={data.recentMovements || []} rowsPerPage={10} showSearchAndFilter={false} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))} />
        </>
    );
};

export default SubwarehouseDashboard;
