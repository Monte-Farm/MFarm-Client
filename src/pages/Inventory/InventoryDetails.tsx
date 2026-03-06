import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button, Card, CardBody, CardHeader, Col, Container, Nav, NavItem, NavLink, Row, TabContent, TabPane, Alert, Badge } from "reactstrap"
import classnames from "classnames";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import { ConfigContext } from "App";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import DonutChartCard from "Components/Common/Graphics/DonutChartCard";
import StackedAreaChartCard from "Components/Common/Graphics/StackedAreaChartCard";
import { RiBox3Line, RiMoneyDollarCircleLine, RiPriceTag3Line, RiPercentLine, RiAddLine, RiSubtractLine, RiFilter3Line, RiDownloadLine, RiArrowUpLine } from "react-icons/ri";
import NoImage from '../../assets/images/no-image.png';
import { transformQuantityData, transformPriceData, combinePriceSeries } from '../../utils/chartTransformers';
import CustomTable from "Components/Common/Tables/CustomTable";
import { Column } from "common/data/data_types";
import AlertMessage from "Components/Common/Shared/AlertMesagge";

const productAttributes: Attribute[] = [
    { key: 'id', label: 'Código', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    {
        key: 'category',
        label: 'Categoría',
        render: (value: any) => {
            let color = "secondary";
            let label = value;

            switch (value) {
                case "nutrition":
                    color = "info";
                    label = "Nutrición";
                    break;
                case "medications":
                    color = "warning";
                    label = "Medicamentos";
                    break;
                case "vaccines":
                    color = "primary";
                    label = "Vacunas";
                    break;
                case "vitamins":
                    color = "success";
                    label = "Vitaminas";
                    break;
                case "minerals":
                    color = "success";
                    label = "Minerales";
                    break;
                case "supplies":
                    color = "success";
                    label = "Insumos";
                    break;
                case "hygiene_cleaning":
                    color = "success";
                    label = "Higiene y desinfección";
                    break;
                case "equipment_tools":
                    color = "success";
                    label = "Equipamiento y herramientas";
                    break;
                case "spare_parts":
                    color = "success";
                    label = "Refacciones y repuestos";
                    break;
                case "office_supplies":
                    color = "success";
                    label = "Material de oficina";
                    break;
                case "others":
                    color = "success";
                    label = "Otros";
                    break;
            }

            return <Badge color={color}>{label}</Badge>;
        }
    },
    { key: 'unit_measurement', label: 'Unidad de Medida', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'text' },
]

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
    // Calcular variación de precio
    const calculatePriceVariation = () => {
        const lastPrice = productStatistics?.lastPrice || 0;
        const averagePrice = productStatistics?.averagePrice || 0;
        
        if (averagePrice === 0) return 0;
        
        // Calcula la variación porcentual vs el precio promedio
        const variation = ((lastPrice - averagePrice) / averagePrice) * 100;
        return variation;
    };

    const priceVariation = calculatePriceVariation();
    const productId = searchParams.get('product');
    const warehouseId = searchParams.get('warehouse');

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
                    case "income":
                        color = "success";
                        text = "Entrada";
                        break;
                    case "outcome":
                        color = "danger";
                        text = "Salida";
                        break;
                }
                return <Badge color={color}>{text}</Badge>;
            },
        },
        { header: 'Cantidad', accessor: 'quantity', type: 'number' },
        { header: 'Valor Monetario', accessor: 'monetaryValue', type: 'currency' },
        {
            header: 'Origen/Destino',
            accessor: 'origin',
            type: 'text',
            render: (_, row) => {
                if (row.type === 'income' && row.origin) {
                    return `${row.origin.name}`;
                } else if (row.type === 'outcome' && row.destination) {
                    return `${row.destination.name}`;
                }
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
            const movementsData = response.data.data;
            setMovements(movementsData.movements);
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
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Detalles de Producto" pageTitle="Inventario" />

                <div className="d-flex gap-2 mb-3">
                    <div className="flex-grow-1">
                        <Button className="farm-secondary-button" onClick={() => history(-1)}>
                            <i className=" ri-arrow-left-line me-3"></i>
                            Regresar
                        </Button>
                    </div>
                </div>

                <div className="p-3 bg-white rounded">
                    <Nav tabs className="nav-tabs">
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => toggleTab("1")}
                            >
                                Información del Producto
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => toggleTab("2")}
                            >
                                Movimientos
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeTab} className="justified-tabs mt-3">
                    <TabPane tabId="1">
                        <div className="g-2" style={{ minHeight: '500px' }}>
                            <div className="row g-2">
                                {/* Sección 1: Columna izquierda grande */}
                                <div className="col-md-3">
                                    <Card className="h-100 m-0">
                                        <CardHeader className="bg-light">
                                            <h5 className="mb-0 text-muted">Información del Producto</h5>
                                        </CardHeader>
                                        <CardBody>
                                            <ObjectDetails attributes={productAttributes} object={productDetails} showImage={true} imageSrc={productDetails?.image || NoImage} />
                                        </CardBody>
                                    </Card>
                                </div>

                                {/* Contenedor derecho para secciones 2-7 */}
                                <div className="col-md-9 d-flex flex-column">
                                    {/* Secciones 2-5: KPIs con componente Kpi */}
                                    <div className="row g-2 mb-2">
                                        <div className="col-2">
                                            <StatKpiCard
                                                title="Existencias"
                                                value={productStatistics?.existences?.quantity || 0}
                                                suffix={productStatistics?.existences?.unitMeasurement || ''}
                                                icon={<RiBox3Line size={20} style={{ color: "#f59e0b" }} />}
                                                animateValue={true}
                                                decimals={0}
                                            />
                                        </div>
                                        <div className="col-2">
                                            <StatKpiCard
                                                title="Valor Total"
                                                value={productStatistics?.totalValue || 0}
                                                icon={<RiMoneyDollarCircleLine size={20} style={{ color: "#0ea5e9" }} />}
                                                animateValue={true}
                                                decimals={0}
                                                prefix="$"
                                            />
                                        </div>
                                        <div className="col-2">
                                            <StatKpiCard
                                                title="Último Precio de compra"
                                                value={productStatistics?.lastPrice || 0}
                                                icon={<RiPriceTag3Line size={20} style={{ color: "#ef4444" }} />}
                                                animateValue={true}
                                                decimals={0}
                                                prefix="$"
                                            />
                                        </div>
                                        <div className="col-2">
                                            <StatKpiCard
                                                title="Precio Promedio"
                                                value={productStatistics?.averagePrice || 0}
                                                icon={<RiPercentLine size={20} style={{ color: "#3b82f6" }} />}
                                                animateValue={true}
                                                decimals={0}
                                                prefix="$"
                                            />
                                        </div>
                                        <div className="col-2">
                                            <StatKpiCard
                                                title="Variación de Precio"
                                                value={priceVariation}
                                                icon={<RiArrowUpLine size={20} style={{ color: priceVariation >= 0 ? "#ef4444" : "#10b981" }} />}
                                                animateValue={true}
                                                decimals={1}
                                                suffix="%"
                                            />
                                        </div>
                                    </div>

                                    {/* Secciones 6-7: Fila inferior (directamente debajo de 2-5) */}
                                    <div className="d-flex gap-3 h-75">
                                        <BasicLineChartCard
                                            title="Existencias Históricas"
                                            data={transformQuantityData(historicalData?.quantityHistory, "Existencias", "#0d6efd")}
                                            yLabel="Cantidad"
                                            xLabel="Período"
                                            height={350}
                                            curve="natural"
                                            pointSize={4}
                                            strokeWidth={2}
                                            enableGrid={true}
                                            enablePoints={true}
                                            enableArea={false}
                                            headerBgColor="#e3f2fd"
                                            className="mb-0"
                                        />

                                        <BasicLineChartCard
                                            title="Precios Históricos"
                                            data={combinePriceSeries([
                                                {
                                                    data: historicalData?.averagePriceHistory,
                                                    serieId: "Precio Promedio",
                                                    color: "#dc3545"
                                                },
                                                {
                                                    data: historicalData?.lastPriceHistory,
                                                    serieId: "Último Precio de compra",
                                                    color: "#198754"
                                                }
                                            ])}
                                            yLabel="Precio (RD$)"
                                            xLabel="Período"
                                            height={350}
                                            curve="natural"
                                            pointSize={4}
                                            strokeWidth={2}
                                            enableGrid={true}
                                            enablePoints={true}
                                            enableArea={false}
                                            showLegend={true}
                                            legendPosition="top"
                                            headerBgColor="#f3e5f5"
                                            className="mb-0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabPane>

                    <TabPane tabId="2">
                        <div className="g-2">
                            <div className="d-flex gap-2">
                                <StatKpiCard
                                    title="Total Entradas"
                                    value={movementsSummary?.totalIncomes || 0}
                                    suffix={productDetails?.unit_measurement || 'unidades'}
                                    icon={<RiAddLine size={20} style={{ color: "#10b981" }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                                <StatKpiCard
                                    title="Total Salidas"
                                    value={movementsSummary?.totalOutcomes || 0}
                                    suffix={productDetails?.unit_measurement || 'unidades'}
                                    icon={<RiSubtractLine size={20} style={{ color: "#ef4444" }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                                <StatKpiCard
                                    title="Total Movimientos"
                                    value={movementsSummary?.totalMovements || 0}
                                    icon={<RiBox3Line size={20} style={{ color: "#3b82f6" }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                                <StatKpiCard
                                    title="Valor Total Entradas"
                                    value={movementsSummary?.totalIncomeValue || 0}
                                    prefix="$"
                                    icon={<RiMoneyDollarCircleLine size={20} style={{ color: "#0ea5e9" }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                                <StatKpiCard
                                    title="Valor Total Salidas"
                                    value={movementsSummary?.totalOutcomeValue || 0}
                                    prefix="$"
                                    icon={<RiMoneyDollarCircleLine size={20} style={{ color: "#ef4444" }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                            </div>

                            <div className="d-flex gap-2">
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
                                    className="w-100"
                                    headerBgColor="#e8f5e8"
                                />

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
                                    className="w-100"
                                    headerBgColor="#e1f5fe"
                                />

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
                                    className="w-100"
                                    headerBgColor="#e0f2f1"
                                    tooltipType="currency"
                                />
                            </div>

                            <div className="w-100">
                                <Card>
                                    <CardHeader style={{ backgroundColor: '#f5f5f5' }}>
                                        <h6 className="mb-0 text-muted">Movimientos Recientes</h6>
                                    </CardHeader>
                                    <CardBody className="p-0">
                                        {movements && movements.length > 0 ? (
                                            <CustomTable columns={movementsColumns} data={movements} showPagination={true} rowsPerPage={10} showSearchAndFilter={false} className="fs-6" />
                                        ) : (
                                            <div className="p-4 text-center">
                                                <span className="fs-5 text-muted">Aún no hay movimientos registrados</span>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    </TabPane>
                </TabContent>

                <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />

            </Container>
        </div>
    );
};

export default ProductDetails