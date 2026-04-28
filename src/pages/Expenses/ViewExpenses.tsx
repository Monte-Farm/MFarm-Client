import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalHeader, Row, Spinner } from "reactstrap";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { getEffectiveUser } from "helpers/impersonation_helper";
import ExpenseForm from "Components/Common/Forms/ExpenseForm";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import CustomTable from "Components/Common/Tables/CustomTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import { useTranslation } from "react-i18next";

const categoryBadgeColor: Record<string, string> = {
    LABOR: "primary",
    UTILITY: "warning",
    MAINTENANCE: "secondary",
    TRANSPORT: "info",
    LIVESTOCK_PURCHASE: "success",
    VETERINARY: "danger",
    OTHER: "dark",
};

const categoryChartColor: Record<string, string> = {
    LABOR: "#3b82f6",
    UTILITY: "#f59e0b",
    MAINTENANCE: "#6b7280",
    TRANSPORT: "#8b5cf6",
    LIVESTOCK_PURCHASE: "#10b981",
    VETERINARY: "#ef4444",
    OTHER: "#ec4899",
};

const ViewExpenses = () => {
    const { t } = useTranslation();
    document.title = t('finance.expense.pageTitle');

    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [entries, setEntries] = useState<any[]>([]);
    const [modals, setModals] = useState({ createExpense: false, dateRange: false, viewPDF: false });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
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
        { header: t('finance.expense.column.date'), accessor: "date", type: "date", isFilterable: true },
        {
            header: t('finance.expense.column.category'),
            accessor: "category",
            isFilterable: true,
            render: (value: string) => {
                const badgeColor = categoryBadgeColor[value] || "secondary";
                const label = t(`finance.expense.category.${value}`, { defaultValue: value });
                return <Badge color={badgeColor}>{label}</Badge>;
            },
        },
        {
            header: t('finance.expense.column.description'),
            accessor: "metadata",
            type: "text",
            render: (value: any) => <span>{value?.description || "-"}</span>,
        },
        { header: t('finance.expense.column.amount'), accessor: "amount", type: "currency", bgColor: "#FFEBEE" },
        {
            header: t('finance.expense.column.createdBy'),
            accessor: "createdBy",
            render: (value: any) =>
                typeof value === "object" && value
                    ? `${value.name} ${value.lastname}`
                    : value,
        },
    ];

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/expenses/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('finance.expense.error.generatePdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/finances/entries?farm=${userLogged.farm_assigned}&sourceModule=MANUAL&type=COST`
            );
            const data = response.data.data;
            setEntries(data);

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
            setAlertConfig({ visible: true, color: "danger", message: t('finance.expense.error.fetchData') });
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
            label: t(`finance.expense.category.${c.category}`, { defaultValue: c.category }),
            value: c.totalAmount,
            color: categoryChartColor[c.category] || "#999",
        }));

    const donutLegend: DonutLegendItem[] = statistics.byCategory
        .filter((c) => c.totalAmount > 0)
        .map((c) => {
            const total = statistics.totalAmount || 1;
            return {
                label: t(`finance.expense.category.${c.category}`, { defaultValue: c.category }),
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
                <BreadCrumb title={t('finance.expense.breadcrumb.title')} pageTitle={t('finance.expense.breadcrumb.parent')} />

                <Row className="mb-3">
                    <Col xl={4} md={6}>
                        <StatKpiCard
                            title={t('finance.expense.kpi.total')}
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
                            title={t('finance.expense.kpi.avg')}
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
                            title={t('finance.expense.kpi.count')}
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
                            title={t('finance.expense.chart.byCategory')}
                            data={donutData}
                            legendItems={donutLegend}
                            height={200}
                        />
                    </Col>
                </Row>

                <Card>
                    <CardHeader>
                        <div className="d-flex gap-2 align-items-center">
                            <h4 className="me-auto mb-0">{t('finance.expense.cardTitle')}</h4>
                            <Button color="primary" onClick={() => toggleModal("dateRange")} disabled={pdfLoading}>
                                {pdfLoading ? (
                                    <><Spinner className="me-2" size="sm" />{t('common.button.generating')}</>
                                ) : (
                                    <><i className="ri-file-pdf-line me-2" />{t('common.button.exportPdf')}</>
                                )}
                            </Button>
                            <Button className="farm-primary-button" onClick={() => toggleModal("createExpense")}>
                                <i className="ri-add-line me-2" />
                                {t('finance.expense.action.new')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={entries.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : ""}>
                        {entries.length === 0 ? (
                            <>
                                <i className="ri-wallet-3-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t('finance.expense.empty')}</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={entries} showPagination rowsPerPage={10} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="lg" isOpen={modals.createExpense} toggle={() => toggleModal("createExpense")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createExpense")}>{t('finance.expense.modal.create')}</ModalHeader>
                <ModalBody>
                    <ExpenseForm onSave={() => { toggleModal("createExpense"); fetchData(); }} onCancel={() => toggleModal("createExpense")} />
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>{t('finance.expense.modal.dateRange')}</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => toggleModal("dateRange")}
                    loading={pdfLoading}
                    generateButtonText={t('finance.expense.action.generatePdf')}
                />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('finance.expense.modal.pdfReport')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    );
};

export default ViewExpenses;
