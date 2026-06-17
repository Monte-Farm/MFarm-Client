import { logger } from 'utils/logger';
import { appendLangParam } from 'helpers/reports_url_helper';
import { ConfigContext } from "App"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap"
import classnames from "classnames"
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
import ConfirmModal from "Components/Common/Shared/ConfirmModal"
import MissingStockModal from "Components/Common/Shared/MissingStockModal"
import { getApprovalErrorMessage } from "helpers/income_error_helper"
import { useTranslation } from "react-i18next"

const approvalStatusColor: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    released: 'info',
};

const canApproveOrRelease = (role: string[]) =>
    role.includes('farm_manager') || role.includes('finance_manager');

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

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const ViewIncomes = () => {
    const { t } = useTranslation();
    document.title = t('finance.income.pageTitle')
    const navigate = useNavigate()
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [incomes, setIncomes] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ createIncome: false, editIncome: false, details: false, dateRange: false, viewPDF: false });
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; action: 'approve' | 'release' | 'cancel' | null; income: any }>({ open: false, action: null, income: null });
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [missingStockModal, setMissingStockModal] = useState<{ open: boolean; items: Array<{ product: string; required: number; available: number }> }>({ open: false, items: [] });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [mainWarehouseId, setMainWarehouseId] = useState<string>('')
    const [selectedIncome, setSelectedIncome] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'regular' | 'preparation'>('regular');
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
            header: t('finance.income.column.approvalStatus'),
            accessor: 'approvalStatus',
            type: 'text',
            render: (_, row) => {
                if (row.cancelled) {
                    return <Badge color="danger">{t('finance.income.status.cancelled')}</Badge>;
                }
                const status = row.approvalStatus ?? 'pending';
                const color = approvalStatusColor[status] || 'secondary';
                return <Badge color={color}>{t(`finance.income.approvalStatus.${status}`, { defaultValue: status })}</Badge>;
            },
        },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (value: any, row: any) => {
                const status = row.approvalStatus ?? 'pending';
                const canManage = canApproveOrRelease(userLogged?.role ?? []);
                const isCancelled = row.cancelled === true;
                return (
                    <div className="d-flex gap-1">
                        <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedIncome(row); toggleModal('details') }}>
                            <i className="ri-eye-fill align-middle"></i>
                        </Button>
                        {!isCancelled && (
                            <Button
                                className="btn-icon btn-soft-warning"
                                onClick={() => { setSelectedIncome(row); toggleModal('editIncome') }}
                                disabled={status === 'approved'}
                                title={t('common.button.edit')}
                            >
                                <i className="ri-pencil-fill align-middle"></i>
                            </Button>
                        )}
                        {canManage && !isCancelled && status !== 'approved' && (
                            <Button
                                className="btn-icon btn-soft-success"
                                onClick={() => handleApproveIncome(row)}
                                title={t('finance.income.action.approve')}
                            >
                                <i className="ri-check-double-line align-middle"></i>
                            </Button>
                        )}
                        {canManage && !isCancelled && status === 'approved' && (
                            <Button
                                className="btn-icon btn-soft-info"
                                onClick={() => handleReleaseIncome(row)}
                                title={t('finance.income.action.release')}
                            >
                                <i className="ri-lock-unlock-line align-middle"></i>
                            </Button>
                        )}
                        {!isCancelled && status === 'pending' && (
                            <Button
                                className="btn-icon btn-soft-danger"
                                onClick={() => setConfirmModal({ open: true, action: 'cancel', income: row })}
                                title={t('finance.income.action.cancel')}
                            >
                                <i className="ri-close-circle-line align-middle"></i>
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ]

    const preparationColumns: Column<any>[] = [
        { header: t('finance.income.column.id'), accessor: 'id', isFilterable: true, type: 'text' },
        { header: t('finance.income.column.date'), accessor: 'date', isFilterable: true, type: 'date' },
        { header: t('finance.income.column.totalPrice'), accessor: 'totalPrice', type: 'currency', bgColor: '#E8F5E9' },
        {
            header: t('finance.income.column.approvalStatus'),
            accessor: 'approvalStatus',
            type: 'text',
            render: (_, row) => {
                const status = row.approvalStatus ?? 'pending';
                const color = approvalStatusColor[status] || 'secondary';
                return <Badge color={color}>{t(`finance.income.approvalStatus.${status}`, { defaultValue: status })}</Badge>;
            },
        },
        {
            header: t('common.field.actions'),
            accessor: 'action',
            render: (_: any, row: any) => (
                <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedIncome(row); toggleModal('details'); }}>
                    <i className="ri-eye-fill align-middle"></i>
                </Button>
            ),
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleApproveIncome = (income: any) => {
        setConfirmModal({ open: true, action: 'approve', income });
    };

    const handleReleaseIncome = (income: any) => {
        setConfirmModal({ open: true, action: 'release', income });
    };

    const handleConfirmAction = async () => {
        if (!configContext || !confirmModal.income || !confirmModal.action) return;
        try {
            setConfirmLoading(true);
            if (confirmModal.action === 'cancel') {
                await configContext.axiosHelper.update(`${configContext.apiUrl}/incomes/cancel/${confirmModal.income._id}`, {});
                setAlertConfig({ visible: true, color: 'success', message: t('finance.income.success.cancelled') });
                fetchWarehouseData();
            } else {
                const endpoint = confirmModal.action === 'approve'
                    ? `${configContext.apiUrl}/incomes/approve/${confirmModal.income._id}`
                    : `${configContext.apiUrl}/incomes/release/${confirmModal.income._id}`;
                await configContext.axiosHelper.update(endpoint, {});
                setAlertConfig({
                    visible: true,
                    color: 'success',
                    message: confirmModal.action === 'approve'
                        ? t('finance.income.success.approved')
                        : t('finance.income.success.released'),
                });
                fetchWarehouseData();
            }
        } catch (error: any) {
            if (confirmModal.action === 'cancel' && error?.response?.data?.missing) {
                const missing = error.response.data.missing as Array<{ id: string; required: number; available: number }>;
                const items = missing.map((item) => ({
                    product: (confirmModal.income.products ?? []).find((p: any) => p.id?._id === item.id)?.id?.name ?? item.id,
                    required: item.required,
                    available: item.available,
                }));
                setMissingStockModal({ open: true, items });
            } else {
                setAlertConfig({
                    visible: true,
                    color: 'danger',
                    message: confirmModal.action === 'cancel'
                        ? t('finance.income.error.cancel')
                        : getApprovalErrorMessage(error, confirmModal.action as 'approve' | 'release', t),
                });
            }
        } finally {
            setConfirmLoading(false);
            setConfirmModal({ open: false, action: null, income: null });
        }
    };

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);
            const response = await configContext.axiosHelper.getBlob(
                appendLangParam(`${configContext.apiUrl}/reports/incomes/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`)
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
            const incomesData = [...response.data.data].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
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
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
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

                <div className="row g-3 mb-3">
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

                <div className="row g-3 mb-4">
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
                        <div className="d-flex gap-2 align-items-center flex-wrap">
                            <h4 className="me-auto mb-0">{t('finance.income.cardTitle')}</h4>
                            <Button color="primary" onClick={() => toggleModal('dateRange')} disabled={pdfLoading}>
                                {pdfLoading ? (
                                    <><Spinner className="me-2" size="sm" />{t('common.button.generating')}</>
                                ) : (
                                    <><i className="ri-file-pdf-line me-2" />{t('common.button.exportPdf')}</>
                                )}
                            </Button>
                            {activeTab === 'regular' && (
                                <Button className="farm-primary-button" onClick={() => toggleModal('createIncome')}>
                                    <i className="ri-add-line me-3" />
                                    {t('finance.income.action.new')}
                                </Button>
                            )}
                        </div>
                        <Nav tabs className="mt-3">
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: activeTab === 'regular' })}
                                    onClick={() => setActiveTab('regular')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {t('finance.income.tab.regular', { defaultValue: 'Entradas' })}
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: activeTab === 'preparation' })}
                                    onClick={() => setActiveTab('preparation')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {t('finance.income.tab.preparation', { defaultValue: 'Preparación de alimento' })}
                                </NavLink>
                            </NavItem>
                        </Nav>
                    </CardHeader>
                    <CardBody className="d-flex flex-column flex-grow-1">
                        <TabContent activeTab={activeTab}>
                            <TabPane tabId="regular">
                                {(() => {
                                    const regularIncomes = incomes.filter(i => i.incomeType !== 'preparation');
                                    return regularIncomes.length === 0 ? (
                                        <div className="d-flex flex-column justify-content-center align-items-center text-center py-4">
                                            <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                            <span className="fs-5 text-muted">{t('finance.income.empty')}</span>
                                        </div>
                                    ) : (
                                        <CustomTable columns={columns} data={regularIncomes} showPagination={false} />
                                    );
                                })()}
                            </TabPane>
                            <TabPane tabId="preparation">
                                {(() => {
                                    const preparationIncomes = incomes.filter(i => i.incomeType === 'preparation');
                                    return preparationIncomes.length === 0 ? (
                                        <div className="d-flex flex-column justify-content-center align-items-center text-center py-4">
                                            <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                            <span className="fs-5 text-muted">{t('finance.income.emptyPreparation', { defaultValue: 'No hay entradas de preparación registradas' })}</span>
                                        </div>
                                    ) : (
                                        <CustomTable columns={preparationColumns} data={preparationIncomes} showPagination={false} />
                                    );
                                })()}
                            </TabPane>
                        </TabContent>
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.createIncome} toggle={() => toggleModal("createIncome")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("createIncome")}>{t('finance.income.modal.create')}</ModalHeader>
                <ModalBody>
                    <IncomeForm onSave={() => { toggleModal('createIncome'); fetchWarehouseData() }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.editIncome} toggle={() => toggleModal("editIncome")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("editIncome")}>{t('finance.income.modal.edit')}</ModalHeader>
                <ModalBody>
                    <IncomeForm initialData={selectedIncome} onSave={() => { toggleModal('editIncome'); fetchWarehouseData() }} onCancel={() => toggleModal('editIncome')} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("details")}>{t('finance.income.modal.details')}</ModalHeader>
                <ModalBody>
                    <IncomeDetails incomeId={selectedIncome?._id} onApproveOrRelease={fetchWarehouseData} />
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

            <ConfirmModal
                isOpen={confirmModal.open}
                title={
                    confirmModal.action === 'approve' ? t('finance.income.confirm.approveTitle') :
                    confirmModal.action === 'cancel' ? t('finance.income.confirm.cancelTitle') :
                    t('finance.income.confirm.releaseTitle')
                }
                message={
                    confirmModal.action === 'approve' ? t('finance.income.confirm.approveMessage') :
                    confirmModal.action === 'cancel' ? t('finance.income.confirm.cancelMessage') :
                    t('finance.income.confirm.releaseMessage')
                }
                confirmLabel={
                    confirmModal.action === 'approve' ? t('finance.income.action.approve') :
                    confirmModal.action === 'cancel' ? t('finance.income.action.cancel') :
                    t('finance.income.action.release')
                }
                cancelLabel={t('common.button.cancel')}
                confirmColor={confirmModal.action === 'approve' ? 'success' : confirmModal.action === 'cancel' ? 'danger' : 'info'}
                loading={confirmLoading}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmModal({ open: false, action: null, income: null })}
            />

            <MissingStockModal
                isOpen={missingStockModal.open}
                onClose={() => setMissingStockModal({ open: false, items: [] })}
                missingItems={missingStockModal.items}
            />

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewIncomes;
