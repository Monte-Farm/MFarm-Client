import { logger } from 'utils/logger';
import { useTranslation } from "react-i18next";
import { ConfigContext } from "App";
import { Attribute, SubwarehouseData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Row, TabContent, TabPane, Spinner } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import classnames from "classnames";
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import IncomeDetails from "Components/Common/Details/IncomeDetailsModal";
import OutcomeDetails from "Components/Common/Details/OutcomeDetails";
import { OUTCOME_TYPES, getOutcomeTypeLabel } from "common/enums/outcomes.enums";
import PDFViewer from "Components/Common/Shared/PDFViewer";

const SubwarehouseDetails = () => {
    const { t } = useTranslation();
    document.title = t('warehouse.subwarehouseDetails.pageTitle')
    const { id_subwarehouse } = useParams();
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [subwarehouseDetails, setSubwarehouseDetails] = useState<any>();
    const [subwarehouseInventory, setSubwarehouseInventory] = useState([])
    const [subwarehouseIncomes, setSubwarehouseIncomes] = useState([])
    const [subwarehouseOutcomes, setSubwarehouseOutcomes] = useState([])
    const [loading, setLoading] = useState<boolean>(true);
    const [subwarehouseStatistics, setSubwarehouseStatistics] = useState<any>({});
    const [incomeStatistics, setIncomeStatistics] = useState({
        totalValue: 0,
        totalEntries: 0,
        averageValuePerEntry: 0
    });
    const [incomeChartData, setIncomeChartData] = useState({
        entriesByType: [] as DonutDataItem[],
        valueByType: [] as DonutDataItem[],
        entriesLegendItems: [] as DonutLegendItem[],
        valueLegendItems: [] as DonutLegendItem[]
    });
    const [activeStep, setActiveStep] = useState<string>("1");
    const [outcomeStatistics, setOutcomeStatistics] = useState({
        totalValue: 0,
        totalOutcomes: 0,
        averageValuePerOutcome: 0
    });
    const [outcomeChartData, setOutcomeChartData] = useState({
        outcomesByType: [] as DonutDataItem[],
        valueByType: [] as DonutDataItem[],
        outcomesLegendItems: [] as DonutLegendItem[],
        valueLegendItems: [] as DonutLegendItem[]
    });
    const [modals, setModals] = useState({ incomeDetails: false, outcomeDetails: false, viewPDF: false });
    const [selectedIncome, setSelectedIncome] = useState<any>({});
    const [selectedOutcome, setSelectedOutcome] = useState<any>({});
    const [fileURL, setFileURL] = useState<string>('')
    const [pdfLoading, setPdfLoading] = useState(false);

    const subwarehouseAttributes: Attribute[] = [
        { key: 'name', label: t('warehouse.subwarehouseDetails.attr.name'), type: 'text' },
        { key: 'manager', label: t('warehouse.subwarehouseDetails.attr.manager'), type: 'text' },
        { key: 'location', label: t('warehouse.subwarehouseDetails.attr.location'), type: 'text' },
    ]

    function toggleArrowTab(tab: string) {
        if (activeStep !== tab) {
            setActiveStep(tab);
        }
    }

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const inventoryColumns: Column<any>[] = [
        {
            header: t('common.field.code'),
            accessor: "id",
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span className="text-black">{row.product?.id || row.id}</span>
        },
        {
            header: t('common.field.name'),
            accessor: "name",
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span className="text-black">{row.product?.name || row.name}</span>
        },
        {
            header: t('warehouse.inventoryDetails.kpi.stock'),
            accessor: 'quantity',
            isFilterable: true,
            type: 'number',
            render: (_, row) => <span>{row.quantity} {row.product?.unit_measurement || row.unit_measurement}</span>,
            bgColor: '#E8F5E9'
        },
        {
            header: t('warehouse.inventoryDetails.kpi.avgPrice'),
            accessor: 'averagePrice',
            isFilterable: true,
            type: 'currency',
            bgColor: '#E3F2FD'
        },
        {
            header: t('warehouse.inventory.kpi.totalValue'),
            accessor: 'totalValue',
            isFilterable: true,
            type: 'currency',
            render: (_, row) => {
                const totalValue = row.quantity * (row.averagePrice || 0);
                return <span>${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
            },
            bgColor: '#FFF3E0'
        },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleClicProductDetails(row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const incomesColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'id', isFilterable: true, type: 'text' },
        {
            header: t('warehouse.subwarehouseDetails.col.supplier'),
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
        { header: t('warehouse.subwarehouseDetails.col.totalPrice'), accessor: 'totalPrice', type: 'currency', bgColor: '#E8F5E9' },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedIncome(row); toggleModal('incomeDetails') }}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

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
            header: t('common.field.actions'),
            accessor: 'actions',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="btn-icon farm-primary-button" onClick={() => { setSelectedOutcome(row); toggleModal('outcomeDetails') }}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const handleError = (error: any, message: string) => {
        logger.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const handleFetchSubwarehouseDetails = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${id_subwarehouse}`);
            setSubwarehouseDetails(response.data.data);
        } catch (error) {
            handleError(error, t('warehouse.subwarehouseDetails.error.fetchDetails'));
        }
    };

    const handleFetchWarehouseInventory = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${id_subwarehouse}`);
            setSubwarehouseInventory(response.data.data);
        } catch (error) {
            handleError(error, t('warehouse.subwarehouseDetails.error.fetchInventory'));
        }
    };

    const handleFetchSubwarehouseStatistics = async () => {
        if (!configContext || !id_subwarehouse) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/warehouse_statistics/${id_subwarehouse}`);
            setSubwarehouseStatistics(response.data.data.statistics);
        } catch (error) {
            handleError(error, t('warehouse.subwarehouseDetails.error.fetchInventory'));
        }
    };

    const handleFetchWarehouseIncomes = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_warehouse_incomes/${id_subwarehouse}`);
            setSubwarehouseIncomes(response.data.data);
        } catch (error) {
            handleError(error, t('warehouse.subwarehouseDetails.error.fetchIncomes'));
        }
    };

    const fetchIncomeStatistics = async () => {
        if (!configContext || !id_subwarehouse) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/income_statistics/${id_subwarehouse}`);
            setIncomeStatistics(response.data.data.statistics);
        } catch (error) {
            handleError(error, t('warehouse.subwarehouseDetails.error.fetchIncomes'));
        }
    };

    const fetchIncomeChartData = async () => {
        if (!configContext || !id_subwarehouse) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/income_charts/${id_subwarehouse}`);
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

            setIncomeChartData({ entriesByType, valueByType, entriesLegendItems, valueLegendItems });
        } catch (error) {
            logger.error('Error fetching income chart data:', error);
        }
    };

    const handleFetchWarehouseOutcomes = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_warehouse_outcomes/${id_subwarehouse}`);
            setSubwarehouseOutcomes(response.data.data);
        } catch (error) {
            handleError(error, t('warehouse.subwarehouseDetails.error.fetchOutcomes'));
        }
    };

    const fetchOutcomeStatistics = async () => {
        if (!configContext || !id_subwarehouse) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_statistics/${id_subwarehouse}`);
            setOutcomeStatistics(response.data.data.statistics);
        } catch (error) {
            handleError(error, t('warehouse.subwarehouseDetails.error.fetchOutcomes'));
        }
    };

    const fetchOutcomeChartData = async () => {
        if (!configContext || !id_subwarehouse) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_charts/${id_subwarehouse}`);
            const chartDataResponse = response.data.data;

            // Transformar datos para las gráficas de dona - solo incluir tipos que tienen datos
            const outcomesByType: DonutDataItem[] = [];
            const valueByType: DonutDataItem[] = [];

            // Mapeo de tipos con sus colores y etiquetas
            const typeConfig: Record<string, { color: string }> = {
                [OUTCOME_TYPES.TRANSFER]: { color: '#3b82f6' },
                [OUTCOME_TYPES.SALE]: { color: '#10b981' },
                [OUTCOME_TYPES.LOSS]: { color: '#ef4444' },
                [OUTCOME_TYPES.ADJUSTMENT]: { color: '#f59e0b' },
                [OUTCOME_TYPES.RETURN]: { color: '#6366f1' },
                [OUTCOME_TYPES.CONSUMPTION]: { color: '#6b7280' },
                [OUTCOME_TYPES.WAREHOUSE_ORDER]: { color: '#8b5cf6' }
            };

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

            setOutcomeChartData({ outcomesByType, valueByType, outcomesLegendItems, valueLegendItems });
        } catch (error) {
            logger.error('Error fetching outcome chart data:', error);
        }
    };

    const handlePrintInventory = async () => {
        if (!configContext || !id_subwarehouse) return;

        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(`${configContext.apiUrl}/reports/warehouse_inventory/${id_subwarehouse}`);

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating inventory report:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.subwarehouseDetails.error.generateReport') });
        } finally {
            setPdfLoading(false);
        }
    };



    const handleClicProductDetails = (row: any) => {
        history(`/warehouse/inventory/product_details?warehouse=${id_subwarehouse}&product=${row.id}`)
    }

    const handleReturn = () => {
        if (window.history.length > 1) {
            history(-1);
        } else {
            history('/subwarehouse/view_subwarehouse')
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([
                handleFetchSubwarehouseDetails(),
                handleFetchWarehouseInventory(),
                handleFetchSubwarehouseStatistics(),
                handleFetchWarehouseIncomes(),
                fetchIncomeStatistics(),
                fetchIncomeChartData(),
                handleFetchWarehouseOutcomes(),
                fetchOutcomeStatistics(),
                fetchOutcomeChartData(),
            ])

            setLoading(false);
        }

        fetchData();
    }, [])


    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={`${t('warehouse.subwarehouseDetails.breadcrumbTitle')} ${subwarehouseDetails?.name}`} pageTitle={t('warehouse.subwarehouse.breadcrumb')} />

                <div className="d-flex gap-2 mb-3">
                    <Button className="farm-secondary-button" onClick={handleReturn}>
                        <i className="ri-arrow-left-line me-2"></i>
                        {t('common.button.back')}
                    </Button>
                </div>

                <div className="p-3 bg-white rounded">
                    <Nav tabs className="nav-tabs">
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeStep === "1" })}
                                onClick={() => toggleArrowTab("1")}
                            >
                                {t('warehouse.subwarehouseDetails.tab.inventory')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeStep === "2" })}
                                onClick={() => toggleArrowTab("2")}
                            >
                                {t('warehouse.subwarehouseDetails.tab.incomes')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeStep === "3" })}
                                onClick={() => toggleArrowTab("3")}
                            >
                                {t('warehouse.subwarehouseDetails.tab.outcomes')}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep} className="justified-tabs mt-3">
                    <TabPane tabId="1">
                        {/* KPIs Section */}
                        <div className="row mb-3">
                            <div className="col-xl-3 col-md-6">
                                <StatKpiCard
                                    title={t('warehouse.subwarehouseDetails.kpi.inventory.totalValue')}
                                    value={subwarehouseStatistics.totalValue || 0}
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
                                    title={t('warehouse.subwarehouseDetails.kpi.inventory.totalProducts')}
                                    value={subwarehouseStatistics.uniqueProducts || 0}
                                    icon={<i className="ri-shopping-bag-3-line fs-20 text-info"></i>}
                                    iconBgColor="#E3F2FD"
                                    animateValue={true}
                                    durationSeconds={1.5}
                                />
                            </div>
                            <div className="col-xl-3 col-md-6">
                                <StatKpiCard
                                    title={t('warehouse.subwarehouseDetails.kpi.inventory.totalUnits')}
                                    value={subwarehouseStatistics.totalUnits || 0}
                                    icon={<i className="ri-stack-line fs-20 text-warning"></i>}
                                    iconBgColor="#FFF3E0"
                                    animateValue={true}
                                    durationSeconds={1.5}
                                />
                            </div>
                            <div className="col-xl-3 col-md-6">
                                <StatKpiCard
                                    title={t('warehouse.subwarehouseDetails.kpi.inventory.avgValuePerProduct')}
                                    value={subwarehouseStatistics.averageValuePerProduct || 0}
                                    prefix="$"
                                    decimals={2}
                                    icon={<i className="ri-bar-chart-line fs-20 text-success"></i>}
                                    iconBgColor="#F3E5F5"
                                    animateValue={true}
                                    durationSeconds={1.5}
                                />
                            </div>
                        </div>

                        <Card className="rounded">
                            <CardHeader>
                                <div className="d-flex gap-2 justify-content-between">
                                    <h4 className="">{t('warehouse.subwarehouseDetails.productsTitle')}</h4>
                                    <div>
                                        <Button
                                            className="farm-primary-button"
                                            onClick={handlePrintInventory}
                                            disabled={pdfLoading}
                                        >
                                            {pdfLoading ? (
                                                <>
                                                    <Spinner className="me-2" size='sm' />
                                                    {t('common.button.generating')}
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-file-pdf-line pe-2" />
                                                    {t('warehouse.subwarehouseDetails.button.report')}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className={subwarehouseInventory.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                                {subwarehouseInventory.length === 0 ? (
                                    <>
                                        <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                        <span className="fs-5 text-muted">{t('warehouse.subwarehouseDetails.empty.inventory')}</span>
                                    </>
                                ) : (
                                    <CustomTable
                                        columns={inventoryColumns}
                                        data={subwarehouseInventory}
                                        showSearchAndFilter={true}
                                        rowClickable={false}
                                        showPagination={false}
                                    />
                                )}
                            </CardBody>
                        </Card>
                    </TabPane>

                    <TabPane tabId="2">
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
                                    data={incomeChartData.entriesByType}
                                    legendItems={incomeChartData.entriesLegendItems}
                                    height={200}
                                />
                            </div>
                            <div className="col-xl-6">
                                <DonutChartCard
                                    title={t('warehouse.subwarehouseDetails.chart.incomeValueByType')}
                                    data={incomeChartData.valueByType}
                                    legendItems={incomeChartData.valueLegendItems}
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
                    </TabPane>

                    <TabPane tabId="3">
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
                                    data={outcomeChartData.outcomesByType}
                                    legendItems={outcomeChartData.outcomesLegendItems}
                                    height={200}
                                />
                            </div>
                            <div className="col-xl-6">
                                <DonutChartCard
                                    title={t('warehouse.subwarehouseDetails.chart.outcomeValueByType')}
                                    data={outcomeChartData.valueByType}
                                    legendItems={outcomeChartData.valueLegendItems}
                                    height={200}
                                />
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <div className="d-flex">
                                    <h4>{t('warehouse.subwarehouseDetails.tab.outcomes')}</h4>
                                </div>
                            </CardHeader>
                            <CardBody className={subwarehouseOutcomes.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                                {subwarehouseOutcomes.length === 0 ? (
                                    <>
                                        <i className="ri-archive-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                        <span className="fs-5 text-muted">{t('warehouse.subwarehouseDetails.empty.outcomes')}</span>
                                    </>
                                ) : (
                                    <CustomTable columns={outcomesColumns} data={subwarehouseOutcomes} showSearchAndFilter={true} showPagination={false} />
                                )}
                            </CardBody>
                        </Card>
                    </TabPane>
                </TabContent>

            </Container>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.subwarehouseDetails.modal.report')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.incomeDetails} toggle={() => toggleModal("incomeDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("incomeDetails")}>{t('warehouse.subwarehouseDetails.modal.incomeDetails')}</ModalHeader>
                <ModalBody>
                    <IncomeDetails incomeId={selectedIncome?._id} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.outcomeDetails} toggle={() => toggleModal("outcomeDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("outcomeDetails")}>{t('warehouse.subwarehouseDetails.modal.outcomeDetails')}</ModalHeader>
                <ModalBody>
                    <OutcomeDetails outcomeId={selectedOutcome._id} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    );
}


export default SubwarehouseDetails;
