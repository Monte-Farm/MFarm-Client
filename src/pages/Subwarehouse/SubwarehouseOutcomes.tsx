import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalHeader, Row } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getLoggedinUser } from "helpers/api_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import SubwarehouseOutcomeForm from "Components/Common/Forms/SubwarehouseOutcomeForm";
import OutcomeDetails from "Components/Common/Details/OutcomeDetails";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { OUTCOME_TYPES, getOutcomeTypeLabel } from "common/enums/outcomes.enums";


const SubwarehouseOutcomes = () => {
    document.title = "Ver salidas | Subalmacén"
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [subwarehouseOutcomes, setSubwarehouseOutcomes] = useState([])
    const [loading, setLoading] = useState<boolean>(true)
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
        { header: 'Identificador', accessor: 'code', isFilterable: true, type: 'text' },
        { header: 'Fecha de Salida', accessor: 'date', isFilterable: true, type: 'date' },
        {
            header: 'Tipo de salida',
            accessor: 'outcomeType',
            isFilterable: true,
            type: 'text',
            render: (_, row) => {
                let color = 'secondary';
                let label = getOutcomeTypeLabel(row.outcomeType);

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
            header: 'Subalmacén de destino',
            accessor: 'warehouseDestiny',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.warehouseDestiny?.name || "N/A"}</span>
        },
        { header: 'Valor', accessor: 'totalPrice', isFilterable: true, type: 'currency' },
        {
            header: 'Acciones',
            accessor: 'actions',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="btn-icon farm-primary-button" onClick={() => { setSelectedOutcome(row); toggleModal('details') }}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
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
            console.error('Error fetching data', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        }
    };

    const fetchOutcomeStatistics = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_statistics/${userLogged.assigment}`);
            setOutcomeStatistics(response.data.data.statistics);
        } catch (error) {
            console.error('Error fetching outcome statistics:', error);
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
            const typeConfig: Record<string, { label: string; color: string }> = {
                [OUTCOME_TYPES.TRANSFER]: { label: 'Transferencia', color: '#3b82f6' },
                [OUTCOME_TYPES.SALE]: { label: 'Venta', color: '#10b981' },
                [OUTCOME_TYPES.LOSS]: { label: 'Pérdida', color: '#ef4444' },
                [OUTCOME_TYPES.ADJUSTMENT]: { label: 'Ajuste', color: '#f59e0b' },
                [OUTCOME_TYPES.RETURN]: { label: 'Devolución', color: '#6366f1' },
                [OUTCOME_TYPES.CONSUMPTION]: { label: 'Consumo', color: '#6b7280' },
                [OUTCOME_TYPES.WAREHOUSE_ORDER]: { label: 'Orden de Almacén', color: '#8b5cf6' }
            };

            // Procesar outcomesByType
            if (chartDataResponse.outcomesByType) {
                Object.entries(chartDataResponse.outcomesByType).forEach(([type, value]) => {
                    const numericValue = Number(value);
                    if (numericValue > 0 && typeConfig[type]) {
                        outcomesByType.push({
                            id: type,
                            label: typeConfig[type].label,
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
                            label: typeConfig[type].label,
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
            console.error('Error fetching outcome chart data:', error);
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


    if (loading) {
        return (
            <LoadingAnimation />
        );
    }


    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver Salidas"} pageTitle={"Salidas"} />

                {/* KPIs Section */}
                <div className="row">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Valor Total de Salidas"
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
                            title="Total de Salidas"
                            value={outcomeStatistics.totalOutcomes}
                            icon={<i className="ri-file-list-3-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Valor Promedio por Salida"
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
                            title="Salidas por Tipo"
                            data={chartData.outcomesByType}
                            legendItems={chartData.outcomesLegendItems}
                            height={200}
                        />
                    </div>
                    <div className="col-xl-6">
                        <DonutChartCard
                            title="Valor de Salidas por Tipo"
                            data={chartData.valueByType}
                            legendItems={chartData.valueLegendItems}
                            height={200}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="d-flex">
                            <h4>Salidas</h4>
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2" />
                                Nueva Salida
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={subwarehouseOutcomes.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {subwarehouseOutcomes.length === 0 ? (
                            <>
                                <i className="ri-archive-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay salidas de inventario registradas</span>
                            </>
                        ) : (
                            <CustomTable columns={outcomesColumns} data={subwarehouseOutcomes} showSearchAndFilter={true} showPagination={false} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Modal Create */}
            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nueva salida</ModalHeader>
                <ModalBody>
                    <SubwarehouseOutcomeForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={() => toggleModal('create')} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("details")}>Detalles de salida</ModalHeader>
                <ModalBody>
                    <OutcomeDetails outcomeId={selectedOutcome._id} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default SubwarehouseOutcomes