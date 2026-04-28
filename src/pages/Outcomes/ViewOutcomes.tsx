import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { getEffectiveUser } from "helpers/impersonation_helper";
import OutcomeForm from "Components/Common/Forms/OutcomeForm";
import CustomTable from "Components/Common/Tables/CustomTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import OutcomeDetails from "Components/Common/Details/OutcomeDetails";
import { OUTCOME_TYPES } from "common/enums/outcomes.enums";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { useTranslation } from "react-i18next";

const outcomeTypeColor: Record<string, string> = {
    transfer: "info",
    sale: "success",
    loss: "danger",
    adjustment: "warning",
    return: "primary",
    consumption: "secondary",
    warehouse_order: "info",
};

const chartTypeColor: Record<string, string> = {
    [OUTCOME_TYPES.TRANSFER]: '#3b82f6',
    [OUTCOME_TYPES.SALE]: '#10b981',
    [OUTCOME_TYPES.LOSS]: '#ef4444',
    [OUTCOME_TYPES.ADJUSTMENT]: '#f59e0b',
    [OUTCOME_TYPES.RETURN]: '#6366f1',
    [OUTCOME_TYPES.CONSUMPTION]: '#6b7280',
    [OUTCOME_TYPES.WAREHOUSE_ORDER]: '#8b5cf6',
};

const ViewOutcomes = () => {
    const { t } = useTranslation();
    document.title = t('finance.outcome.pageTitle')
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();

    const [outcomes, setOutcomes] = useState([])
    const [loading, setLoading] = useState<boolean>(false)
    const [modals, setModals] = useState({ createOutcome: false, details: false, dateRange: false, viewPDF: false });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [mainWarehouseId, setMainWarehouseId] = useState<string>('')
    const [selectedOutcome, setSelectedOutcome] = useState<any>({});
    const [outcomeStatistics, setOutcomeStatistics] = useState({
        totalValue: 0,
        totalOutcomes: 0,
        averageValuePerOutcome: 0
    });
    const [chartData, setChartData] = useState({
        outcomesByType: [] as DonutDataItem[],
        valueByType: [] as DonutDataItem[],
        outcomesLegendItems: [] as DonutLegendItem[],
        valueLegendItems: [] as DonutLegendItem[]
    });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const columns: Column<any>[] = [
        { header: t('finance.outcome.column.id'), accessor: 'code', isFilterable: true, type: 'text' },
        { header: t('finance.outcome.column.date'), accessor: 'date', isFilterable: true, type: 'date' },
        {
            header: t('finance.outcome.column.type'),
            accessor: 'outcomeType',
            isFilterable: true,
            type: 'text',
            render: (_, row) => {
                const color = outcomeTypeColor[row.outcomeType] || 'secondary';
                const label = t(`finance.outcome.outcomeType.${row.outcomeType}`, { defaultValue: row.outcomeType });
                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: t('finance.outcome.column.destination'),
            accessor: 'warehouseDestiny',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.warehouseDestiny?.name || "N/A"}</span>
        },
        { header: t('finance.outcome.column.value'), accessor: 'totalPrice', isFilterable: true, type: 'currency' },
        {
            header: t('common.field.actions'), accessor: 'actions',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="btn-icon farm-primary-button" onClick={() => { setSelectedOutcome(row); toggleModal('details') }}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/outcomes/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('finance.outcome.error.generatePdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    const fetchWarehouseId = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`);
            setMainWarehouseId(response.data.data)
        } catch (error) {
            console.error('Error fetching main warehouse ID:', error);
        }
    }

    const handleFetchOutcomes = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_warehouse_outcomes/${mainWarehouseId}`);
            setOutcomes(response.data.data);
        } catch (error) {
            console.error('Error fetching data', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('finance.outcome.error.fetchData') })
        } finally {
            setLoading(false)
        }
    };

    const fetchOutcomeStatistics = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_statistics/${mainWarehouseId}`);
            setOutcomeStatistics(response.data.data.statistics);
        } catch (error) {
            console.error('Error fetching outcome statistics:', error);
        }
    };

    const fetchOutcomeChartData = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_charts/${mainWarehouseId}`);
            const chartDataResponse = response.data.data;

            const outcomesByType: DonutDataItem[] = [];
            const valueByType: DonutDataItem[] = [];

            if (chartDataResponse.outcomesByType) {
                Object.entries(chartDataResponse.outcomesByType).forEach(([type, value]) => {
                    const numericValue = Number(value);
                    if (numericValue > 0 && chartTypeColor[type]) {
                        outcomesByType.push({
                            id: type,
                            label: t(`finance.outcome.outcomeType.${type}`, { defaultValue: type }),
                            value: numericValue,
                            color: chartTypeColor[type]
                        });
                    }
                });
            }

            if (chartDataResponse.valueByType) {
                Object.entries(chartDataResponse.valueByType).forEach(([type, value]) => {
                    const numericValue = Number(value);
                    if (numericValue > 0 && chartTypeColor[type]) {
                        valueByType.push({
                            id: type,
                            label: t(`finance.outcome.outcomeType.${type}`, { defaultValue: type }),
                            value: numericValue,
                            color: chartTypeColor[type]
                        });
                    }
                });
            }

            const outcomesLegendItems = outcomesByType.map(item => ({
                label: item.label,
                value: item.value,
                percentage: `${((item.value / outcomesByType.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}%`
            }));

            const valueLegendItems = valueByType.map(item => ({
                label: item.label,
                value: `$${item.value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                percentage: `${((item.value / valueByType.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}%`
            }));

            setChartData({ outcomesByType, valueByType, outcomesLegendItems, valueLegendItems });
        } catch (error) {
            console.error('Error fetching outcome chart data:', error);
        }
    };

    useEffect(() => {
        fetchWarehouseId();
    }, []);

    const fetchWarehouseData = async () => {
        if (!mainWarehouseId || !configContext) return;

        try {
            await Promise.all([
                handleFetchOutcomes(),
                fetchOutcomeStatistics(),
                fetchOutcomeChartData()
            ]);
        } catch (error) {
            console.error('Error fetching warehouse data:', error);
        }
    };

    useEffect(() => {
        fetchWarehouseData();
    }, [mainWarehouseId])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('finance.outcome.breadcrumb.title')} pageTitle={t('finance.outcome.breadcrumb.parent')} />

                <div className="row mb-3">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('finance.outcome.kpi.totalValue')}
                            value={outcomeStatistics.totalValue}
                            prefix="$"
                            decimals={2}
                            icon={<i className="ri-money-dollar-circle-line fs-20 text-primary"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('finance.outcome.kpi.total')}
                            value={outcomeStatistics.totalOutcomes}
                            icon={<i className="ri-file-list-3-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('finance.outcome.kpi.avgValue')}
                            value={outcomeStatistics.averageValuePerOutcome}
                            prefix="$"
                            decimals={2}
                            icon={<i className="ri-bar-chart-line fs-20 text-warning"></i>}
                            iconBgColor="#FFF3E0"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                </div>

                <div className="row mb-4">
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('finance.outcome.chart.byType')}
                            data={chartData.outcomesByType}
                            legendItems={chartData.outcomesLegendItems}
                            height={200}
                        />
                    </div>
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('finance.outcome.chart.valueByType')}
                            data={chartData.valueByType}
                            legendItems={chartData.valueLegendItems}
                            height={200}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="d-flex gap-2 align-items-center">
                            <h4 className="me-auto mb-0">{t('finance.outcome.cardTitle')}</h4>
                            <Button color="primary" onClick={() => toggleModal('dateRange')} disabled={pdfLoading}>
                                {pdfLoading ? (
                                    <><Spinner className="me-2" size="sm" />{t('common.button.generating')}</>
                                ) : (
                                    <><i className="ri-file-pdf-line me-2" />{t('common.button.exportPdf')}</>
                                )}
                            </Button>
                            <Button className="farm-primary-button" onClick={() => toggleModal('createOutcome')}>
                                <i className="ri-add-line me-2" />
                                {t('finance.outcome.action.new')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={outcomes.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {outcomes.length === 0 ? (
                            <>
                                <i className="ri-archive-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t('finance.outcome.empty')}</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={outcomes} showSearchAndFilter={true} showPagination={false} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.createOutcome} toggle={() => toggleModal("createOutcome")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createOutcome")}>{t('finance.outcome.modal.create')}</ModalHeader>
                <ModalBody>
                    <OutcomeForm onSave={() => { toggleModal('createOutcome'); fetchWarehouseData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("details")}>{t('finance.outcome.modal.details')}</ModalHeader>
                <ModalBody>
                    <OutcomeDetails outcomeId={selectedOutcome._id} />
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>{t('finance.outcome.modal.dateRange')}</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => toggleModal("dateRange")}
                    loading={pdfLoading}
                    generateButtonText={t('finance.outcome.action.generatePdf')}
                />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('finance.outcome.modal.pdfReport')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewOutcomes;
