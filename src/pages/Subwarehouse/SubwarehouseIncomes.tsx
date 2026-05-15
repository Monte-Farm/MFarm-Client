import { logger } from 'utils/logger';
import { useTranslation } from "react-i18next";
import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Container, Card, CardHeader, CardBody, Row, Col, Modal, ModalHeader, ModalBody, Spinner } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getEffectiveUser } from "helpers/impersonation_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import IncomeDetails from "Components/Common/Details/IncomeDetailsModal";
import IncomeForm from "Components/Common/Forms/IncomeForm";
import ConfirmModal from "Components/Common/Shared/ConfirmModal";
import { getApprovalErrorMessage } from "helpers/income_error_helper";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import AlertMessage from "Components/Common/Shared/AlertMesagge";

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const approvalStatusColor: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    released: 'info',
};

const canApproveOrRelease = (role: string[]) =>
    role.includes('farm_manager') || role.includes('finance_manager');

const SubwarehouseIncomes = () => {
    const { t } = useTranslation();
    document.title = `${t("menu.subwarehouseIncomes")} | ${t("systemName")}`;
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [subwarehouseIncomes, setSubwarehouseIncomes] = useState([])
    const [loading, setLoading] = useState<boolean>(true)
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ details: false, editIncome: false });
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; action: 'approve' | 'release' | null; income: any }>({ open: false, action: null, income: null });
    const [confirmLoading, setConfirmLoading] = useState(false);
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

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const incomesColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'id', isFilterable: true, type: 'text' },
        {
            header: t('reports.col.supplier'),
            accessor: 'originName',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.origin?.id?.name || 'N/A'}</span>
        },
        { header: t('common.field.date'), accessor: 'date', isFilterable: true, type: 'date' },
        {
            header: t('warehouse.subwarehouseDetails.tab.incomes'),
            accessor: 'incomeType',
            isFilterable: true,
            type: 'text',
            render: (_, row) => {
                let color = 'secondary';
                const text = t(`warehouse.common.incomeType.${row.incomeType}`, { defaultValue: row.incomeType });

                switch (row.incomeType) {
                    case "purchase": color = "success"; break;
                    case "donacion": color = "warning"; break;
                    case "transfer": color = "info"; break;
                    case "own_production": color = "secondary"; break;
                }
                return <Badge color={color}>{text}</Badge>;
            },
        },
        { header: t('common.field.totalPrice'), accessor: 'totalPrice', type: 'currency', bgColor: '#E8F5E9' },
        {
            header: t('finance.income.column.approvalStatus'),
            accessor: 'approvalStatus',
            type: 'text',
            render: (_, row) => {
                const status = row.approvalStatus ?? 'pending';
                return <Badge color={approvalStatusColor[status] || 'secondary'}>{t(`finance.income.approvalStatus.${status}`, { defaultValue: status })}</Badge>;
            },
        },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (value: any, row: any) => {
                const status = row.approvalStatus ?? 'pending';
                const canManage = canApproveOrRelease(userLogged?.role ?? []);
                return (
                    <div className="d-flex gap-1">
                        <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedIncome(row); toggleModal('details') }}>
                            <i className="ri-eye-fill align-middle" />
                        </Button>
                        <Button
                            className="btn-icon btn-soft-warning"
                            onClick={() => { setSelectedIncome(row); toggleModal('editIncome') }}
                            disabled={status === 'approved'}
                            title={t('common.button.edit')}
                        >
                            <i className="ri-pencil-fill align-middle" />
                        </Button>
                        {canManage && status !== 'approved' && (
                            <Button
                                className="btn-icon btn-soft-success"
                                onClick={() => handleApproveIncome(row)}
                                title={t('finance.income.action.approve')}
                            >
                                <i className="ri-check-double-line align-middle" />
                            </Button>
                        )}
                        {canManage && status === 'approved' && (
                            <Button
                                className="btn-icon btn-soft-info"
                                onClick={() => handleReleaseIncome(row)}
                                title={t('finance.income.action.release')}
                            >
                                <i className="ri-lock-unlock-line align-middle" />
                            </Button>
                        )}
                    </div>
                );
            }
        }
    ]

    const fetchAllData = async () => {
        await Promise.all([
            handleFetchWarehouseIncomes(),
            fetchIncomeStatistics(),
            fetchIncomeChartData(),
        ]);
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
            fetchAllData();
        } catch (error) {
            setAlertConfig({
                visible: true,
                color: 'danger',
                message: getApprovalErrorMessage(error, confirmModal.action, t),
            });
        } finally {
            setConfirmLoading(false);
            setConfirmModal({ open: false, action: null, income: null });
        }
    };

    const handleFetchWarehouseIncomes = async () => {
        if (!configContext || !userLogged) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_warehouse_incomes/${userLogged.assigment}`);
            setSubwarehouseIncomes(response.data.data);
        } catch (error) {
            logger.error('Error fetching data', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.subwarehouseDetails.error.fetchIncomes') })
        }
    };

    const fetchIncomeStatistics = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/income_statistics/${userLogged.assigment}`);
            setIncomeStatistics(response.data.data.statistics);
        } catch (error) {
            logger.error('Error fetching income statistics:', error);
        }
    };

    const fetchIncomeChartData = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/income_charts/${userLogged.assigment}`);
            const chartDataResponse = response.data.data;

            // Transformar datos para las gráficas de dona - solo incluir tipos que tienen datos
            const entriesByType: DonutDataItem[] = [];
            const valueByType: DonutDataItem[] = [];

            const typeConfig: Record<string, { color: string }> = {
                purchase: { color: '#10b981' },
                donacion: { color: '#f59e0b' },
                transfer: { color: '#3b82f6' },
                own_production: { color: '#6b7280' }
            };

            if (chartDataResponse.entriesByType) {
                Object.entries(chartDataResponse.entriesByType).forEach(([type, value]) => {
                    const numericValue = Number(value);
                    if (numericValue > 0 && typeConfig[type]) {
                        entriesByType.push({
                            id: type,
                            label: t(`warehouse.common.incomeType.${type}`, { defaultValue: type }),
                            value: numericValue,
                            color: typeConfig[type].color
                        });
                    }
                });
            }

            if (chartDataResponse.valueByType) {
                Object.entries(chartDataResponse.valueByType).forEach(([type, value]) => {
                    const numericValue = Number(value);
                    if (numericValue > 0 && typeConfig[type]) {
                        valueByType.push({
                            id: type,
                            label: t(`warehouse.common.incomeType.${type}`, { defaultValue: type }),
                            value: numericValue,
                            color: typeConfig[type].color
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
        const fetchData = async () => {
            await fetchAllData();
            setLoading(false);
        };

        fetchData();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('warehouse.subwarehouseDetails.tab.incomes')} pageTitle={t('warehouse.subwarehouseDetails.tab.incomes')} />

                {/* KPIs Section */}
                <div className="row mb-3">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.subwarehouseDetails.kpi.incomes.totalValue')}
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
                            title={t('warehouse.subwarehouseDetails.kpi.incomes.totalEntries')}
                            value={incomeStatistics.totalEntries}
                            icon={<i className="ri-file-list-3-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.subwarehouseDetails.kpi.incomes.avgValuePerEntry')}
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

                {/* Charts Section */}
                <div className="row mb-4">
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('warehouse.subwarehouseDetails.chart.incomesByType')}
                            data={chartData.entriesByType}
                            legendItems={chartData.entriesLegendItems}
                            height={200}
                        />
                    </div>
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('warehouse.subwarehouseDetails.chart.incomeValueByType')}
                            data={chartData.valueByType}
                            legendItems={chartData.valueLegendItems}
                            height={200}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <h4 className="me-auto">{t('warehouse.subwarehouseDetails.tab.incomes')}</h4>
                        </div>
                    </CardHeader>
                    <CardBody className={subwarehouseIncomes.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {subwarehouseIncomes.length === 0 ? (
                            <>
                                <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t('warehouse.subwarehouseDetails.empty.incomes')}</span>
                            </>
                        ) : (
                            <CustomTable columns={incomesColumns} data={subwarehouseIncomes} showPagination={false} />
                        )}
                    </CardBody>
                </Card>

            </Container>

            <Modal size="xl" isOpen={modals.editIncome} toggle={() => toggleModal("editIncome")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("editIncome")}>{t('finance.income.modal.edit')}</ModalHeader>
                <ModalBody>
                    <IncomeForm initialData={selectedIncome} onSave={() => { toggleModal('editIncome'); fetchAllData(); }} onCancel={() => toggleModal('editIncome')} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('details')}>{t('warehouse.subwarehouseDetails.modal.incomeDetails')}</ModalHeader>
                <ModalBody>
                    <IncomeDetails incomeId={selectedIncome._id} onApproveOrRelease={fetchAllData} />
                </ModalBody>
            </Modal>

            <ConfirmModal
                isOpen={confirmModal.open}
                title={confirmModal.action === 'approve' ? t('finance.income.confirm.approveTitle') : t('finance.income.confirm.releaseTitle')}
                message={confirmModal.action === 'approve' ? t('finance.income.confirm.approveMessage') : t('finance.income.confirm.releaseMessage')}
                confirmLabel={confirmModal.action === 'approve' ? t('finance.income.action.approve') : t('finance.income.action.release')}
                cancelLabel={t('common.button.cancel')}
                confirmColor={confirmModal.action === 'approve' ? 'success' : 'info'}
                loading={confirmLoading}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmModal({ open: false, action: null, income: null })}
            />

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )

}

export default SubwarehouseIncomes;
