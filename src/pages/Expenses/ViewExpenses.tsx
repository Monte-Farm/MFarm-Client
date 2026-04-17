import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalHeader, Row } from "reactstrap";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { getLoggedinUser } from "helpers/api_helper";
import ExpenseForm from "Components/Common/Forms/ExpenseForm";
import CustomTable from "Components/Common/Tables/CustomTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";

const categoryConfig: Record<string, { label: string; color: string; badgeColor: string }> = {
    LABOR: { label: "Sueldos y nómina", color: "#3b82f6", badgeColor: "primary" },
    UTILITY: { label: "Servicios", color: "#f59e0b", badgeColor: "warning" },
    MAINTENANCE: { label: "Mantenimiento", color: "#6b7280", badgeColor: "secondary" },
    TRANSPORT: { label: "Transporte", color: "#8b5cf6", badgeColor: "info" },
    LIVESTOCK_PURCHASE: { label: "Compra de ganado", color: "#10b981", badgeColor: "success" },
    VETERINARY: { label: "Veterinario", color: "#ef4444", badgeColor: "danger" },
    OTHER: { label: "Otro", color: "#ec4899", badgeColor: "dark" },
};

const ViewExpenses = () => {
    document.title = "Gastos | MFarm";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [entries, setEntries] = useState<any[]>([]);
    const [modals, setModals] = useState({ createExpense: false });
    const [statistics, setStatistics] = useState({
        totalAmount: 0,
        avgAmount: 0,
        count: 0,
        byCategory: [] as { category: string; totalAmount: number; count: number }[],
    });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const columns: Column<any>[] = [
        { header: "Fecha", accessor: "date", type: "date", isFilterable: true },
        {
            header: "Categoría",
            accessor: "category",
            isFilterable: true,
            render: (value: string) => {
                const config = categoryConfig[value] || { label: value, badgeColor: "secondary" };
                return <Badge color={config.badgeColor}>{config.label}</Badge>;
            },
        },
        {
            header: "Descripción",
            accessor: "metadata",
            type: "text",
            render: (value: any) => <span>{value?.description || "-"}</span>,
        },
        { header: "Monto", accessor: "amount", type: "currency", bgColor: "#FFEBEE" },
        {
            header: "Registrado por",
            accessor: "createdBy",
            render: (value: any) =>
                typeof value === "object" && value
                    ? `${value.name} ${value.lastname}`
                    : value,
        },
    ];

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/finances/entries?farm=${userLogged.farm_assigned}&sourceModule=MANUAL&type=COST`
            );
            const data = response.data.data;
            setEntries(data);

            // Calcular estadísticas del lado del cliente
            const total = data.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
            const grouped: Record<string, { totalAmount: number; count: number }> = {};
            data.forEach((e: any) => {
                if (!grouped[e.category]) grouped[e.category] = { totalAmount: 0, count: 0 };
                grouped[e.category].totalAmount += e.amount || 0;
                grouped[e.category].count += 1;
            });

            setStatistics({
                totalAmount: total,
                avgAmount: data.length > 0 ? total / data.length : 0,
                count: data.length,
                byCategory: Object.entries(grouped).map(([category, vals]) => ({
                    category,
                    ...vals,
                })),
            });
        } catch (error) {
            console.error("Error fetching expenses:", { error });
            setAlertConfig({ visible: true, color: "danger", message: "Error al obtener los gastos, inténtelo más tarde" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const donutData: DonutDataItem[] = statistics.byCategory
        .filter((c) => c.totalAmount > 0)
        .map((c) => ({
            id: c.category,
            label: categoryConfig[c.category]?.label || c.category,
            value: c.totalAmount,
            color: categoryConfig[c.category]?.color || "#999",
        }));

    const donutLegend: DonutLegendItem[] = statistics.byCategory
        .filter((c) => c.totalAmount > 0)
        .map((c) => {
            const total = statistics.totalAmount || 1;
            return {
                label: categoryConfig[c.category]?.label || c.category,
                value: `$${c.totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
                percentage: `${((c.totalAmount / total) * 100).toFixed(1)}%`,
            };
        });

    if (loading) {
        return <LoadingAnimation />;
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Gastos" pageTitle="Gastos" />

                <Row className="mb-3">
                    <Col xl={4} md={6}>
                        <StatKpiCard
                            title="Gasto Total"
                            value={statistics.totalAmount}
                            prefix="$"
                            decimals={2}
                            icon={<i className="ri-money-dollar-circle-line fs-20 text-danger"></i>}
                            iconBgColor="#FFEBEE"
                            animateValue
                        />
                    </Col>
                    <Col xl={4} md={6}>
                        <StatKpiCard
                            title="Gasto Promedio"
                            value={statistics.avgAmount}
                            prefix="$"
                            decimals={2}
                            icon={<i className="ri-bar-chart-line fs-20 text-warning"></i>}
                            iconBgColor="#FFF3E0"
                            animateValue
                        />
                    </Col>
                    <Col xl={4} md={6}>
                        <StatKpiCard
                            title="Registros"
                            value={statistics.count}
                            icon={<i className="ri-file-list-3-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue
                        />
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col xl={12}>
                        <DonutChartCard
                            title="Gastos por Categoría"
                            data={donutData}
                            legendItems={donutLegend}
                            height={200}
                        />
                    </Col>
                </Row>

                <Card>
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <h4 className="me-auto">Gastos</h4>
                            <Button className="farm-primary-button" onClick={() => toggleModal("createExpense")}>
                                <i className="ri-add-line me-2" />
                                Registrar gasto
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={entries.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : ""}>
                        {entries.length === 0 ? (
                            <>
                                <i className="ri-wallet-3-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">No hay gastos registrados</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={entries} showPagination rowsPerPage={10} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="lg" isOpen={modals.createExpense} toggle={() => toggleModal("createExpense")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createExpense")}>Registrar gasto</ModalHeader>
                <ModalBody>
                    <ExpenseForm onSave={() => { toggleModal("createExpense"); fetchData(); }} onCancel={() => toggleModal("createExpense")} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    );
};

export default ViewExpenses;
