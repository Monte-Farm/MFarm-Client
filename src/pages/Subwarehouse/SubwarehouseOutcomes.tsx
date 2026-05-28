import { logger } from 'utils/logger';
import { useTranslation } from "react-i18next";
import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalHeader, Row, Spinner } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getEffectiveUser } from "helpers/impersonation_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import SubwarehouseOutcomeForm from "Components/Common/Forms/SubwarehouseOutcomeForm";
import OutcomeDetails from "Components/Common/Details/OutcomeDetails";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { OUTCOME_TYPES, getOutcomeTypeLabel } from "common/enums/outcomes.enums";
import ConfirmModal from "Components/Common/Shared/ConfirmModal";
import MissingStockModal from "Components/Common/Shared/MissingStockModal";


const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const SubwarehouseOutcomes = () => {
    const { t } = useTranslation();
    document.title = `${t("menu.subwarehouseOutcomes")} | ${t("systemName")}`;
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [subwarehouseOutcomes, setSubwarehouseOutcomes] = useState([])
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmCancelModal, setConfirmCancelModal] = useState<{ open: boolean; outcome: any | null }>({ open: false, outcome: null });
    const [missingStockModal, setMissingStockModal] = useState<{ open: boolean; items: Array<{ product: string; required: number; available: number }> }>({ open: false, items: [] });
    const [loading, setLoading] = useState<boolean>(true)
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ create: false, details: false });
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

    const outcomesColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'code', isFilterable: true, type: 'text' },
        { header: t('common.field.date'), accessor: 'date', isFilterable: true, type: 'date' },
        {
            header: t('warehouse.subwarehouseDetails.tab.outcomes'),
            accessor: 'outcomeType',
            isFilterable: true,
            type: 'text',
            render: (_, row) => {
                let color = 'secondary';
                const label = t(`warehouse.common.outcomeType.${row.outcomeType}`, { defaultValue: getOutcomeTypeLabel(row.outcomeType) });

                switch (row.outcomeType) {
                    case OUTCOME_TYPES.TRANSFER:
                        color = "info";
                        break;
                    case OUTCOME_TYPES.SALE:
                        color = "success";
                        break;
                    case OUTCOME_TYPES.LOSS:
                        color = "danger";
                        break;
                    case OUTCOME_TYPES.ADJUSTMENT:
                        color = "warning";
                        break;
                    case OUTCOME_TYPES.RETURN:
                        color = "primary";
                        break;
                    case OUTCOME_TYPES.CONSUMPTION:
                        color = "secondary";
                        break;
                    case OUTCOME_TYPES.WAREHOUSE_ORDER:
                        color = "info";
                        break;
                }
                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: t('warehouse.subwarehouseDetails.col.destWarehouse'),
            accessor: 'warehouseDestiny',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.warehouseDestiny?.name || "N/A"}</span>
        },
        { header: t('warehouse.subwarehouseDetails.col.value'), accessor: 'totalPrice', isFilterable: true, type: 'currency' },
        {
            header: t('common.field.status', { defaultValue: 'Estado' }),
            accessor: 'cancelled',
            type: 'text',
            render: (_, row) => row.cancelled
                ? <Badge color="danger">{t('finance.outcome.status.cancelled')}</Badge>
                : null,
        },
        {
            header: t('common.field.actions'),
            accessor: 'actions',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="btn-icon farm-primary-button" onClick={() => { setSelectedOutcome(row); toggleModal('details') }}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                    {!row.cancelled && (
                        <Button
                            className="btn-icon btn-soft-danger"
                            onClick={() => setConfirmCancelModal({ open: true, outcome: row })}
                            title={t('finance.outcome.action.cancel')}
                        >
                            <i className="ri-close-circle-line align-middle" />
                        </Button>
                    )}
                </div>
            )
        }
    ]

    const handleFetchWarehouseOutcomes = async () => {
        if (!configContext || !userLogged) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_warehouse_outcomes/${userLogged.assigment}`);
            setSubwarehouseOutcomes(response.data.data);
        } catch (error) {
            logger.error('Error fetching data', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.subwarehouseDetails.error.fetchOutcomes') })
        }
    };

    const fetchOutcomeStatistics = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_statistics/${userLogged.assigment}`);
            setOutcomeStatistics(response.data.data.statistics);
        } catch (error) {
            logger.error('Error fetching outcome statistics:', error);
        }
    };

    const fetchOutcomeChartData = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_charts/${userLogged.assigment}`);
            const chartDataResponse = response.data.data;

            // Transformar datos para las gráficas de dona - solo incluir tipos que tienen datos
            const outcomesByType: DonutDataItem[] = [];
            const valueByType: DonutDataItem[] = [];

            // Mapeo de tipos con sus colores y etiquetas (adaptado para outcomes)
            const typeConfig: Record<string, { color: string }> = {
                [OUTCOME_TYPES.TRANSFER]: { color: '#3b82f6' },
                [OUTCOME_TYPES.SALE]: { color: '#10b981' },
                [OUTCOME_TYPES.LOSS]: { color: '#ef4444' },
                [OUTCOME_TYPES.ADJUSTMENT]: { color: '#f59e0b' },
                [OUTCOME_TYPES.RETURN]: { color: '#6366f1' },
                [OUTCOME_TYPES.CONSUMPTION]: { color: '#6b7280' },
                [OUTCOME_TYPES.WAREHOUSE_ORDER]: { color: '#8b5cf6' }
            };

            // Procesar outcomesByType
            if (chartDataResponse.outcomesByType) {
                Object.entries(chartDataResponse.outcomesByType).forEach(([type, value]) => {
                    const numericValue = Number(value);
                    if (numericValue > 0 && typeConfig[type]) {
                        outcomesByType.push({
                            id: type,
                            label: t(`warehouse.common.outcomeType.${type}`, { defaultValue: type }),
                            value: numericValue,
                            color: typeConfig[type].color
                        });
                    }
                });
            }

            // Procesar valueByType
            if (chartDataResponse.valueByType) {
                Object.entries(chartDataResponse.valueByType).forEach(([type, value]) => {
                    const numericValue = Number(value);
                    if (numericValue > 0 && typeConfig[type]) {
                        valueByType.push({
                            id: type,
                            label: t(`warehouse.common.outcomeType.${type}`, { defaultValue: type }),
                            value: numericValue,
                            color: typeConfig[type].color
                        });
                    }
                });
            }

            // Crear legendItems para mostrar datos detallados
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
            logger.error('Error fetching outcome chart data:', error);
        }
    };

    const handleCancelOutcome = async () => {
        if (!configContext || !confirmCancelModal.outcome) return;
        try {
            setActionLoading(true);
            const outcomeId = confirmCancelModal.outcome._id;
            await configContext.axiosHelper.update(`${configContext.apiUrl}/outcomes/cancel_outcome/${outcomeId}`, {});
            setAlertConfig({ visible: true, color: 'success', message: t('finance.outcome.success.cancelled') });
            setConfirmCancelModal({ open: false, outcome: null });
            await fetchData();
        } catch (error: any) {
            if (error?.response?.data?.missing) {
                const missing = error.response.data.missing as Array<{ id: string; required: number; available: number }>;
                const products: any[] = confirmCancelModal.outcome?.products ?? [];
                const items = missing.map((item: any) => ({
                    product: products.find((p: any) => p.id?._id === item.id)?.id?.name ?? item.id,
                    required: item.required,
                    available: item.available,
                }));
                setMissingStockModal({ open: true, items });
            } else {
                setAlertConfig({ visible: true, color: 'danger', message: t('finance.outcome.error.cancel') });
            }
            setConfirmCancelModal({ open: false, outcome: null });
        } finally {
            setActionLoading(false);
        }
    };

    const fetchData = async () => {
        await Promise.all([
            handleFetchWarehouseOutcomes(),
            fetchOutcomeStatistics(),
            fetchOutcomeChartData(),
        ]);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [configContext])

    useEffect(() => {
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
                <BreadCrumb title={t('warehouse.subwarehouseDetails.tab.outcomes')} pageTitle={t('warehouse.subwarehouseDetails.tab.outcomes')} />

                {/* KPIs Section */}
                <div className="row mb-3">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.subwarehouseDetails.kpi.outcomes.totalValue')}
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
                            title={t('warehouse.subwarehouseDetails.kpi.outcomes.totalOutcomes')}
                            value={outcomeStatistics.totalOutcomes}
                            icon={<i className="ri-file-list-3-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.subwarehouseDetails.kpi.outcomes.avgValuePerOutcome')}
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

                {/* Charts Section */}
                <div className="row mb-4">
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('warehouse.subwarehouseDetails.chart.outcomesByType')}
                            data={chartData.outcomesByType}
                            legendItems={chartData.outcomesLegendItems}
                            height={200}
                        />
                    </div>
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('warehouse.subwarehouseDetails.chart.outcomeValueByType')}
                            data={chartData.valueByType}
                            legendItems={chartData.valueLegendItems}
                            height={200}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="d-flex gap-2 align-items-center flex-wrap">
                            <h4 className="me-auto mb-0">{t('warehouse.subwarehouseDetails.tab.outcomes')}</h4>
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2" />
                                {t('finance.outcome.action.new')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={subwarehouseOutcomes.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {subwarehouseOutcomes.length === 0 ? (
                            <>
                                <i className="ri-archive-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t('warehouse.subwarehouseDetails.empty.outcomes')}</span>
                            </>
                        ) : (
                            <CustomTable
                                columns={outcomesColumns}
                                data={subwarehouseOutcomes}
                                showSearchAndFilter={true}
                                showPagination={false}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Modal Create */}
            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("create")}>{t('warehouse.subwarehouseDetails.modal.outcomeDetails')}</ModalHeader>
                <ModalBody>
                    <SubwarehouseOutcomeForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={() => toggleModal('create')} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("details")}>{t('warehouse.subwarehouseDetails.modal.outcomeDetails')}</ModalHeader>
                <ModalBody>
                    <OutcomeDetails outcomeId={selectedOutcome._id} onCancelled={fetchData} />
                </ModalBody>
            </Modal>

            <ConfirmModal
                isOpen={confirmCancelModal.open}
                title={t('finance.outcome.confirm.cancelTitle')}
                message={confirmCancelModal.outcome?.outcomeType === 'transfer' ? t('finance.outcome.confirm.cancelTransferMessage') : t('finance.outcome.confirm.cancelMessage')}
                confirmLabel={t('finance.outcome.action.cancel')}
                cancelLabel={t('common.button.cancel')}
                confirmColor="danger"
                loading={actionLoading}
                onConfirm={handleCancelOutcome}
                onCancel={() => setConfirmCancelModal({ open: false, outcome: null })}
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

export default SubwarehouseOutcomes
