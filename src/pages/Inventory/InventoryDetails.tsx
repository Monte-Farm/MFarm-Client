import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button, Card, CardBody, CardHeader, Col, Container, Nav, NavItem, NavLink, Row, TabContent, TabPane, Badge, Spinner, Modal, ModalHeader, ModalBody } from "reactstrap"
import classnames from "classnames";
import { ConfigContext } from "App";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import DonutChartCard from "Components/Common/Graphics/DonutChartCard";
import StackedAreaChartCard from "Components/Common/Graphics/StackedAreaChartCard";
import { RiBox3Line, RiMoneyDollarCircleLine, RiPriceTag3Line, RiPercentLine, RiAddLine, RiSubtractLine, RiArrowUpLine, RiArrowDownLine, RiInformationLine, RiExchangeLine } from "react-icons/ri";
import NoImage from '../../assets/images/no-image.png';
import { transformQuantityData, combinePriceSeries } from '../../utils/chartTransformers';
import CustomTable from "Components/Common/Tables/CustomTable";
import { Column } from "common/data/data_types";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import PDFViewer from "Components/Common/Shared/PDFViewer";

const categoryConfig: Record<string, { color: string; label: string }> = {
    nutrition: { color: "info", label: "Nutrición" },
    medications: { color: "warning", label: "Medicamentos" },
    vaccines: { color: "primary", label: "Vacunas" },
    vitamins: { color: "success", label: "Vitaminas" },
    minerals: { color: "success", label: "Minerales" },
    supplies: { color: "success", label: "Insumos" },
    hygiene_cleaning: { color: "success", label: "Higiene y desinfección" },
    equipment_tools: { color: "success", label: "Equipamiento y herramientas" },
    spare_parts: { color: "success", label: "Refacciones y repuestos" },
    office_supplies: { color: "success", label: "Material de oficina" },
    others: { color: "secondary", label: "Otros" },
};

const ProductDetails = () => {
    document.title = 'Detalles de Producto | Almacén'
    const configContext = useContext(ConfigContext);
    const history = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState("1");
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [productDetails, setProductDetails] = useState<any>(null);
    const [productStatistics, setProductStatistics] = useState<any>(null);
    const [historicalData, setHistoricalData] = useState<any>(null);
    const [movements, setMovements] = useState<any>(null);
    const [movementsSummary, setMovementsSummary] = useState<any>(null);
    const [movementsCharts, setMovementsCharts] = useState<any>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [showPDFModal, setShowPDFModal] = useState(false);

    const calculatePriceVariation = () => {
        const lastPrice = productStatistics?.lastPrice || 0;
        const averagePrice = productStatistics?.averagePrice || 0;
        if (averagePrice === 0) return 0;
        return ((lastPrice - averagePrice) / averagePrice) * 100;
    };

    const priceVariation = calculatePriceVariation();
    const productId = searchParams.get('product');
    const warehouseId = searchParams.get('warehouse');
    const categoryInfo = productDetails?.category ? categoryConfig[productDetails.category] : null;

    const movementsColumns: Column<any>[] = [
        { header: 'Fecha', accessor: 'date', isFilterable: true, type: 'date' },
        { header: 'Código', accessor: 'code', isFilterable: true, type: 'text' },
        {
            header: 'Tipo',
            accessor: 'type',
            isFilterable: true,
            type: 'text',
            render: (value: string) => {
                let color = 'secondary';
                let text = 'N/A';
                switch (value) {
                    case "income": color = "success"; text = "Entrada"; break;
                    case "outcome": color = "danger"; text = "Salida"; break;
                }
                return <Badge color={color} className="px-2 py-1">{text}</Badge>;
            },
        },
        { header: 'Cantidad', accessor: 'quantity', type: 'number' },
        { header: 'Valor Monetario', accessor: 'monetaryValue', type: 'currency' },
        {
            header: 'Origen/Destino',
            accessor: 'origin',
            type: 'text',
            render: (_, row) => {
                if (row.type === 'income' && row.origin) return `${row.origin.name}`;
                if (row.type === 'outcome' && row.destination) return `${row.destination.name}`;
                return 'N/A';
            },
        },
    ];

    const toggleTab = (tab: string) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const handleFetchProductDetails = async () => {
        if (!configContext || !productId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_product_id/${productId}`);
            setProductDetails(response.data.data);
        } catch (error) {
            handleError(error, 'El servicio no está disponible, inténtelo más tarde');
        }
    };

    const handleFetchProductStatistics = async () => {
        if (!configContext || !productId || !warehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/product_statistics/${warehouseId}/${productId}`);
            setProductStatistics(response.data.data);
        } catch (error) {
            handleError(error, 'Error al obtener las estadísticas del producto');
        }
    };

    const handleFetchProductHistoricalData = async () => {
        if (!configContext || !productId || !warehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/product_historical_data/${warehouseId}/${productId}`);
            setHistoricalData(response.data.data);
        } catch (error) {
            handleError(error, 'Error al obtener los datos históricos del producto');
        }
    };

    const handleFetchProductMovements = async () => {
        if (!configContext || !productId || !warehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/product_movements/${warehouseId}/${productId}`);
            setMovements(response.data.data.movements);
        } catch (error) {
            handleError(error, 'Error al obtener los movimientos del producto');
        }
    };

    const handleFetchProductMovementsSummary = async () => {
        if (!configContext || !productId || !warehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/product_movement_summary/${warehouseId}/${productId}`);
            setMovementsSummary(response.data.data.summary);
        } catch (error) {
            handleError(error, 'Error al obtener los movimientos del producto');
        }
    };

    const handleFetchProductMovementsCharts = async () => {
        if (!configContext || !productId || !warehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/product_movement_charts/${warehouseId}/${productId}`);
            setMovementsCharts(response.data.data.charts);
        } catch (error) {
            handleError(error, 'Error al obtener los movimientos del producto');
        }
    };

    const handlePrintProduct = async () => {
        if (!configContext || !warehouseId || !productId) return;
        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(`${configContext.apiUrl}/reports/product_inventory/${warehouseId}/${productId}`);
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            setFileURL(url);
            setShowPDFModal(true);
        } catch (error) {
            console.error('Error generating product inventory PDF: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al generar el PDF del inventario del producto' });
        } finally {
            setPdfLoading(false);
        }
    };

    const fetchData = async () => {
        if (!configContext || !productId || !warehouseId) return;
        setLoading(true);
        try {
            await Promise.all([
                handleFetchProductDetails(),
                handleFetchProductStatistics(),
                handleFetchProductHistoricalData(),
                handleFetchProductMovements(),
                handleFetchProductMovementsSummary(),
                handleFetchProductMovementsCharts(),
            ]);
        } catch (error) {
            handleError(error, "Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [productId, warehouseId]);

    if (loading) {
        return <LoadingAnimation />;
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Detalles de Producto" pageTitle="Inventario" />

                <div className="d-flex gap-2 mb-3">
                    <div className="flex-grow-1">
                        <Button className="farm-secondary-button" onClick={() => history(-1)}>
                            <i className="ri-arrow-left-line me-3"></i>
                            Regresar
                        </Button>
                    </div>
                    <Button color="primary" onClick={handlePrintProduct} disabled={pdfLoading}>
                        {pdfLoading ? (
                            <><Spinner className="me-2" size='sm' />Generando...</>
                        ) : (
                            <><i className="ri-file-pdf-line me-2"></i>Imprimir Reporte</>
                        )}
                    </Button>
                </div>

                {/* Tabs */}
                <Card className="border-0 shadow-sm mb-3">
                    <CardBody className="p-0">
                        <Nav tabs className="nav-tabs-custom border-0 px-3 pt-2">
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames("fw-medium", { active: activeTab === "1" })}
                                    onClick={() => toggleTab("1")}
                                >
                                    <RiInformationLine className="me-1" />
                                    Información General
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames("fw-medium", { active: activeTab === "2" })}
                                    onClick={() => toggleTab("2")}
                                >
                                    <RiExchangeLine className="me-1" />
                                    Movimientos
                                </NavLink>
                            </NavItem>
                        </Nav>
                    </CardBody>
                </Card>

                <TabContent activeTab={activeTab}>
                    {/* ============ TAB 1: INFORMACIÓN ============ */}
                    <TabPane tabId="1">
                        {/* KPIs Row */}
                        <Row className="g-3 mb-3">
                            <Col md={6} lg>
                                <StatKpiCard
                                    title="Existencias"
                                    value={productStatistics?.existences?.quantity || 0}
                                    suffix={productStatistics?.existences?.unitMeasurement || ''}
                                    icon={<RiBox3Line size={20} style={{ color: "#f59e0b" }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                            </Col>
                            <Col md={6} lg>
                                <StatKpiCard
                                    title="Valor Total"
                                    value={productStatistics?.totalValue || 0}
                                    icon={<RiMoneyDollarCircleLine size={20} style={{ color: "#0ea5e9" }} />}
                                    animateValue={true}
                                    decimals={0}
                                    prefix="$"
                                />
                            </Col>
                            <Col md={6} lg>
                                <StatKpiCard
                                    title="Último Precio"
                                    value={productStatistics?.lastPrice || 0}
                                    icon={<RiPriceTag3Line size={20} style={{ color: "#ef4444" }} />}
                                    animateValue={true}
                                    decimals={0}
                                    prefix="$"
                                />
                            </Col>
                            <Col md={6} lg>
                                <StatKpiCard
                                    title="Precio Promedio"
                                    value={productStatistics?.averagePrice || 0}
                                    icon={<RiPercentLine size={20} style={{ color: "#3b82f6" }} />}
                                    animateValue={true}
                                    decimals={0}
                                    prefix="$"
                                />
                            </Col>
                            <Col md={6} lg>
                                <StatKpiCard
                                    title="Variación de Precio"
                                    value={priceVariation}
                                    icon={priceVariation >= 0
                                        ? <RiArrowUpLine size={20} style={{ color: "#ef4444" }} />
                                        : <RiArrowDownLine size={20} style={{ color: "#10b981" }} />}
                                    animateValue={true}
                                    decimals={1}
                                    suffix="%"
                                />
                            </Col>
                        </Row>

                        {/* Product info + Charts */}
                        <Row className="g-3">
                            <Col lg={4}>
                                <Card className="border-0 shadow-sm h-100 overflow-hidden">
                                    <div
                                        style={{
                                            background: 'linear-gradient(135deg, #0d6efd 0%, #3b82f6 100%)',
                                            height: 80,
                                            position: 'relative'
                                        }}
                                    />
                                    <CardBody className="pt-0 position-relative">
                                        <div className="d-flex justify-content-center" style={{ marginTop: -60 }}>
                                            <div
                                                className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm"
                                                style={{ width: 120, height: 120, border: '4px solid #fff', overflow: 'hidden' }}
                                            >
                                                <img
                                                    src={productDetails?.image || NoImage}
                                                    alt={productDetails?.name}
                                                    style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="text-center mt-3 mb-4">
                                            <h4 className="mb-2 fw-bold text-dark">{productDetails?.name}</h4>
                                            {categoryInfo && (
                                                <Badge
                                                    color={categoryInfo.color}
                                                    className="fw-normal px-3 py-2"
                                                    style={{ fontSize: '0.75rem', letterSpacing: '0.3px' }}
                                                >
                                                    {categoryInfo.label}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="row g-2 mb-3">
                                            <div className="col-6">
                                                <div
                                                    className="p-3 rounded-3 h-100"
                                                    style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}
                                                >
                                                    <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                                                        Código
                                                    </div>
                                                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>
                                                        {productDetails?.id || '—'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div
                                                    className="p-3 rounded-3 h-100"
                                                    style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}
                                                >
                                                    <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                                                        Unidad
                                                    </div>
                                                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>
                                                        {productDetails?.unit_measurement || '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-muted text-uppercase fw-semibold mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                                                <RiInformationLine className="me-1" />
                                                Descripción
                                            </div>
                                            <p className="text-dark mb-0 small" style={{ lineHeight: 1.6 }}>
                                                {productDetails?.description || 'Sin descripción disponible'}
                                            </p>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col lg={8}>
                                <Row className="g-3">
                                    <Col xs={12}>
                                        <BasicLineChartCard
                                            title="Existencias Históricas"
                                            data={transformQuantityData(historicalData?.quantityHistory, "Existencias", "#0d6efd")}
                                            yLabel="Cantidad"
                                            xLabel="Período"
                                            height={280}
                                            curve="natural"
                                            pointSize={4}
                                            strokeWidth={2}
                                            enableGrid={true}
                                            enablePoints={true}
                                            enableArea={false}
                                            headerBgColor="#ffffff"
                                            className="mb-0 border-0 shadow-sm"
                                        />
                                    </Col>
                                    <Col xs={12}>
                                        <BasicLineChartCard
                                            title="Precios Históricos"
                                            data={combinePriceSeries([
                                                { data: historicalData?.averagePriceHistory, serieId: "Precio Promedio", color: "#dc3545" },
                                                { data: historicalData?.lastPriceHistory, serieId: "Último Precio de compra", color: "#198754" }
                                            ])}
                                            yLabel="Precio (RD$)"
                                            xLabel="Período"
                                            height={280}
                                            curve="natural"
                                            pointSize={4}
                                            strokeWidth={2}
                                            enableGrid={true}
                                            enablePoints={true}
                                            enableArea={false}
                                            showLegend={true}
                                            legendPosition="top"
                                            headerBgColor="#ffffff"
                                            className="mb-0 border-0 shadow-sm"
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </TabPane>

                    {/* ============ TAB 2: MOVIMIENTOS ============ */}
                    <TabPane tabId="2">
                        {/* Summary KPIs */}
                        <Row className="g-3 mb-3">
                            <Col md={6} lg>
                                <StatKpiCard
                                    title="Total Entradas"
                                    value={movementsSummary?.totalIncomes || 0}
                                    suffix={productDetails?.unit_measurement || 'unidades'}
                                    icon={<RiAddLine size={20} style={{ color: "#10b981" }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                            </Col>
                            <Col md={6} lg>
                                <StatKpiCard
                                    title="Total Salidas"
                                    value={movementsSummary?.totalOutcomes || 0}
                                    suffix={productDetails?.unit_measurement || 'unidades'}
                                    icon={<RiSubtractLine size={20} style={{ color: "#ef4444" }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                            </Col>
                            <Col md={6} lg>
                                <StatKpiCard
                                    title="Total Movimientos"
                                    value={movementsSummary?.totalMovements || 0}
                                    icon={<RiExchangeLine size={20} style={{ color: "#3b82f6" }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                            </Col>
                            <Col md={6} lg>
                                <StatKpiCard
                                    title="Valor Entradas"
                                    value={movementsSummary?.totalIncomeValue || 0}
                                    prefix="$"
                                    icon={<RiMoneyDollarCircleLine size={20} style={{ color: "#0ea5e9" }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                            </Col>
                            <Col md={6} lg>
                                <StatKpiCard
                                    title="Valor Salidas"
                                    value={movementsSummary?.totalOutcomeValue || 0}
                                    prefix="$"
                                    icon={<RiMoneyDollarCircleLine size={20} style={{ color: "#ef4444" }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                            </Col>
                        </Row>

                        {/* Charts Row */}
                        <Row className="g-3 mb-3">
                            <Col lg={4}>
                                <DonutChartCard
                                    title="Distribución por Tipo"
                                    data={movementsCharts?.distribution || []}
                                    legendItems={[
                                        {
                                            label: 'Entradas',
                                            value: `${movementsSummary?.totalIncomes || 0} ${productDetails?.unit_measurement || 'unidades'}`,
                                            percentage: movementsSummary?.totalIncomes && movementsSummary?.totalOutcomes
                                                ? `${((movementsSummary.totalIncomes / (movementsSummary.totalIncomes + movementsSummary.totalOutcomes)) * 100).toFixed(1)}%`
                                                : '0%'
                                        },
                                        {
                                            label: 'Salidas',
                                            value: `${movementsSummary?.totalOutcomes || 0} ${productDetails?.unit_measurement || 'unidades'}`,
                                            percentage: movementsSummary?.totalIncomes && movementsSummary?.totalOutcomes
                                                ? `${((movementsSummary.totalOutcomes / (movementsSummary.totalIncomes + movementsSummary.totalOutcomes)) * 100).toFixed(1)}%`
                                                : '0%'
                                        }
                                    ]}
                                    className="h-100 border-0 shadow-sm"
                                    headerBgColor="#ffffff"
                                />
                            </Col>
                            <Col lg={4}>
                                <BasicLineChartCard
                                    title="Tendencia de Movimientos"
                                    data={combinePriceSeries(
                                        movementsCharts?.trend?.map((serie: any) => ({
                                            data: serie.data,
                                            serieId: serie.id,
                                            color: serie.color
                                        })) || []
                                    )}
                                    yLabel={`Cantidad (${productDetails?.unit_measurement || 'unidades'})`}
                                    xLabel="Fecha"
                                    curve="monotoneX"
                                    pointSize={6}
                                    strokeWidth={2}
                                    enableGrid={true}
                                    enablePoints={true}
                                    enableArea={false}
                                    showLegend={true}
                                    legendPosition="top"
                                    className="h-100 border-0 shadow-sm"
                                    headerBgColor="#ffffff"
                                />
                            </Col>
                            <Col lg={4}>
                                <StackedAreaChartCard
                                    title="Valor Acumulado"
                                    data={movementsCharts?.accumulatedValue || []}
                                    yLabel="Valor (RD$)"
                                    xLabel="Fecha"
                                    curve="monotoneX"
                                    enableArea={true}
                                    areaOpacity={0.7}
                                    strokeWidth={2}
                                    enablePoints={false}
                                    showLegend={true}
                                    legendPosition="top"
                                    className="h-100 border-0 shadow-sm"
                                    headerBgColor="#ffffff"
                                    tooltipType="currency"
                                />
                            </Col>
                        </Row>

                        {/* Movements Table */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-white border-bottom py-3">
                                <h6 className="mb-0 fw-bold text-dark">
                                    <RiExchangeLine className="me-2 text-primary" />
                                    Movimientos Recientes
                                </h6>
                            </CardHeader>
                            <CardBody className="p-0">
                                {movements && movements.length > 0 ? (
                                    <CustomTable columns={movementsColumns} data={movements} showPagination={true} rowsPerPage={10} showSearchAndFilter={false} className="fs-6" />
                                ) : (
                                    <div className="p-5 text-center">
                                        <RiExchangeLine size={48} className="text-muted mb-2" />
                                        <p className="fs-6 text-muted mb-0">Aún no hay movimientos registrados</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </TabPane>
                </TabContent>

                <Modal size="xl" isOpen={showPDFModal} toggle={() => setShowPDFModal(!showPDFModal)} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => setShowPDFModal(!showPDFModal)}>Reporte de Inventario del Producto</ModalHeader>
                    <ModalBody>
                        {fileURL && <PDFViewer fileUrl={fileURL} />}
                    </ModalBody>
                </Modal>

                <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />

            </Container>
        </div>
    );
};

export default ProductDetails
