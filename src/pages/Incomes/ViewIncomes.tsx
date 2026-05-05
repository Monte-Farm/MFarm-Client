import { logger } from 'utils/logger';
import { ConfigContext } from "App"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap"
import { Column } from "common/data/data_types"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation"
import AlertMessage from "Components/Common/Shared/AlertMesagge"
import { getEffectiveUser } from "helpers/impersonation_helper"
import IncomeForm from "Components/Common/Forms/IncomeForm"
import CustomTable from "Components/Common/Tables/CustomTable"
import StatKpiCard from "Components/Common/Graphics/StatKpiCard"
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard"
import IncomeDetails from "Components/Common/Details/IncomeDetailsModal"
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector"
import PDFViewer from "Components/Common/Shared/PDFViewer"
import { useTranslation } from "react-i18next"

const incomeTypeColor: Record<string, string> = {
    purchase: "success",
    donacion: "warning",
    internal_transfer: "info",
    own_production: "secondary",
};

const chartTypeColor: Record<string, string> = {
    purchase: '#10b981',
    donacion: '#f59e0b',
    transfer: '#3b82f6',
    own_production: '#6b7280',
};

const ViewIncomes = () => {
    const { t } = useTranslation();
    document.title = t('finance.income.pageTitle')
    const navigate = useNavigate()
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [incomes, setIncomes] = useState([])
    const [loading, setLoading] = useState<boolean>(true)
    const [modals, setModals] = useState({ createIncome: false, details: false, dateRange: false, viewPDF: false });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [mainWarehouseId, setMainWarehouseId] = useState<string>('')
    const [selectedIncome, setSelectedIncome] = useState<any>({});
    const [incomeStatistics, setIncomeStatistics] = useState({
        totalValue: 0,
        totalEntries: 0,
        averageValuePerEntry: 0
    });
    const [chartData, setChartData] = useState({
        entriesByType: [] as DonutDataItem[],
        valueByType: [] as DonutDataItem[],
        entriesLegendItems: [] as DonutLegendItem[],
        valueLegendItems: [] as DonutLegendItem[]
    });

    const columns: Column<any>[] = [
        { header: t('finance.income.column.id'), accessor: 'id', isFilterable: true, type: 'text' },
        {
            header: t('finance.income.column.supplier'),
            accessor: 'originName',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.origin?.id?.name ?? 'N/A'}</span>
        },
        { header: t('finance.income.column.date'), accessor: 'date', isFilterable: true, type: 'date' },
        {
            header: t('finance.income.column.type'),
            accessor: 'incomeType',
            isFilterable: true,
            type: 'text',
            render: (_, row) => {
                const color = incomeTypeColor[row.incomeType] || 'secondary';
                const text = t(`finance.income.incomeType.${row.incomeType}`, { defaultValue: row.incomeType });
                return <Badge color={color}>{text}</Badge>;
            },
        },
        { header: t('finance.income.column.totalPrice'), accessor: 'totalPrice', type: 'currency', bgColor: '#E8F5E9' },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedIncome(row); toggleModal('details') }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/incomes/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('finance.income.error.generatePdf') });
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
            logger.error('Error fetching main warehouse ID:', error);
        }
    }

    const handleFetchIncomes = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_warehouse_incomes/${mainWarehouseId}`);
            const incomesData = response.data.data;
            setIncomes(incomesData);
        } catch (error) {
            logger.error('Error fetching data: ', { error })
            setAlertConfig({ visible: false, color: 'danger', message: t('finance.income.error.generatePdf') })
        } finally {
            setLoading(false)
        }
    };

    const fetchIncomeStatistics = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/income_statistics/${mainWarehouseId}`);
            setIncomeStatistics(response.data.data.statistics);
        } catch (error) {
            logger.error('Error fetching income statistics:', error);
        }
    };

    const fetchIncomeChartData = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/income_charts/${mainWarehouseId}`);
            const chartDataResponse = response.data.data;

            const entriesByType: DonutDataItem[] = [];
            const valueByType: DonutDataItem[] = [];

            if (chartDataResponse.entriesByType) {
                Object.entries(chartDataResponse.entriesByType).forEach(([type, value]) => {
                    const numericValue = Number(value);
                    if (numericValue > 0 && chartTypeColor[type]) {
                        entriesByType.push({
                            id: type,
                            label: t(`finance.income.chart.type.${type}`, { defaultValue: type }),
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
                            label: t(`finance.income.chart.type.${type}`, { defaultValue: type }),
                            value: numericValue,
                            color: chartTypeColor[type]
                        });
                    }
                });
            }

            const entriesLegendItems = entriesByType.map(item => ({
                label: item.label,
                value: item.value,
                percentage: `${((item.value / entriesByType.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}%`
            }));

            const valueLegendItems = valueByType.map(item => ({
                label: item.label,
                value: `$${item.value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                percentage: `${((item.value / valueByType.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}%`
            }));

            setChartData({ entriesByType, valueByType, entriesLegendItems, valueLegendItems });
        } catch (error) {
            logger.error('Error fetching income chart data:', error);
        }
    };

    useEffect(() => {
        fetchWarehouseId();
    }, []);

    const fetchWarehouseData = async () => {
        if (!mainWarehouseId || !configContext) return;

        try {
            await Promise.all([
                handleFetchIncomes(),
                fetchIncomeStatistics(),
                fetchIncomeChartData()
            ]);
        } catch (error) {
            logger.error('Error fetching warehouse data:', error);
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
                <BreadCrumb title={t('finance.income.breadcrumb.title')} pageTitle={t('finance.income.breadcrumb.parent')} />

                <div className="row mb-3">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('finance.income.kpi.totalValue')}
                            value={incomeStatistics.totalValue}
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
                            title={t('finance.income.kpi.total')}
                            value={incomeStatistics.totalEntries}
                            icon={<i className="ri-file-list-3-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('finance.income.kpi.avgValue')}
                            value={incomeStatistics.averageValuePerEntry}
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
                            title={t('finance.income.chart.byType')}
                            data={chartData.entriesByType}
                            legendItems={chartData.entriesLegendItems}
                            height={200}
                        />
                    </div>
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('finance.income.chart.valueByType')}
                            data={chartData.valueByType}
                            legendItems={chartData.valueLegendItems}
                            height={200}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <h4 className="me-auto">{t('finance.income.cardTitle')}</h4>
                            <Button color="primary" onClick={() => toggleModal('dateRange')} disabled={pdfLoading}>
                                {pdfLoading ? (
                                    <><Spinner className="me-2" size="sm" />{t('common.button.generating')}</>
                                ) : (
                                    <><i className="ri-file-pdf-line me-2" />{t('common.button.exportPdf')}</>
                                )}
                            </Button>
                            <Button className="farm-primary-button" onClick={() => toggleModal('createIncome')}>
                                <i className="ri-add-line me-3" />
                                {t('finance.income.action.new')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={incomes.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {incomes.length === 0 ? (
                            <>
                                <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t('finance.income.empty')}</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={incomes} showPagination={false} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.createIncome} toggle={() => toggleModal("createIncome")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createIncome")}>{t('finance.income.modal.create')}</ModalHeader>
                <ModalBody>
                    <IncomeForm onSave={() => { toggleModal('createIncome'); fetchWarehouseData() }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("details")}>{t('finance.income.modal.details')}</ModalHeader>
                <ModalBody>
                    <IncomeDetails incomeId={selectedIncome?._id} />
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>{t('finance.income.modal.dateRange')}</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => toggleModal("dateRange")}
                    loading={pdfLoading}
                    generateButtonText={t('finance.income.action.generatePdf')}
                />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('finance.income.modal.pdfReport')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewIncomes;
