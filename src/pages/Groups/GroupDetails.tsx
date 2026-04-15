import { ConfigContext } from "App";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Modal,
    ModalBody,
    ModalHeader,
    Nav,
    NavItem,
    NavLink,
    Row,
    TabContent,
    TabPane,
} from "reactstrap";
import classnames from "classnames";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import KPI from "Components/Common/Graphics/Kpi";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import { FaBalanceScale, FaBirthdayCake, FaCalendarDay, FaChartLine, FaMars, FaPiggyBank, FaSkullCrossbones, FaVenus } from "react-icons/fa";
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import GroupHistoryTimeline from "Components/Common/Lists/GroupHistoryTimeline";
import GroupMedicalDetails from "Components/Common/Details/GroupMedicalDetails";
import GroupFeedingDetails from "Components/Common/Details/GroupFeedingDetails";
import ChangeStageGroup from "Components/Common/Forms/ChangeStageGroup";
import WeightEvolutionChart from "Components/Common/Graphics/WeightEvolutionChart";
import WeightDistributionChart from "Components/Common/Graphics/WeightDistributionChart";
import GroupTransferForm from "Components/Common/Forms/GroupTransferForm";
import GroupWithDrawForm from "Components/Common/Forms/GroupWithdrawForm";
import DiscardPigInGroupForm from "Components/Common/Forms/DiscardPigInGroupForm";
import GrowthStatusProgress from "Components/Common/Shared/GrowthStatusProgress";
import ProcessPigReplacementForm from "Components/Common/Forms/ProcessPigReplacementForm";
import SellPigsForm from "Components/Common/Forms/SellPigsForm";

const GroupDetails = () => {
    document.title = "Detalles de grupo | Management System";
    const { group_id } = useParams();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [groupData, setGroupData] = useState<any>({});
    const [activeTab, setActiveTab] = useState("0");
    const [modals, setModals] = useState({ changeStage: false, registerDeath: false, discard: false, transfer: false, processSale: false, processReplacement: false, sellPigs: false });
    const [lastWeighted, setLastWeigthed] = useState<any>({})
    const [growthRate, setGrowthRate] = useState<number>(0);
    const [averageAge, setAverageaAge] = useState<any>()
    const [weightDistribution, setWeightDistribution] = useState<any>();
    const [active, setActive] = useState<any>();
    const [mortality, setMortality] = useState<any>();
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [groupMetrics, setGroupMetrics] = useState<any>({});

    const toggleTab = (tab: string) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const groupAttibutes: Attribute[] = [
        { key: "code", label: "Codigo", type: "text" },
        { key: "name", label: "Nombre", type: "text" },
        {
            key: "area",
            label: "Area",
            type: "text",
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.area) {
                    case "gestation":
                        color = "info";
                        text = "Gestación";
                        break;
                    case "farrowing":
                        color = "primary";
                        text = "Paridera";
                        break;
                    case "maternity":
                        color = "primary";
                        text = "Maternidad";
                        break;
                    case "weaning":
                        color = "success";
                        text = "Destete";
                        break;
                    case "nursery":
                        color = "warning";
                        text = "Preceba / Levante inicial";
                        break;
                    case "fattening":
                        color = "dark";
                        text = "Ceba / Engorda";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo / Recría";
                        break;
                    case "boars":
                        color = "info";
                        text = "Área de verracos";
                        break;
                    case "quarantine":
                        color = "danger";
                        text = "Cuarentena / Aislamiento";
                        break;
                    case "hospital":
                        color = "danger";
                        text = "Hospital / Enfermería";
                        break;
                    case "shipping":
                        color = "secondary";
                        text = "Corrales de venta / embarque";
                        break;
                    case "exit":
                        color = "secondary";
                        text = "Salida";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            key: "status",
            label: "Estado",
            type: "text",
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.status) {
                    case "weaning":
                        color = "info";
                        text = "En destete";
                        break;
                    case "ready_to_grow":
                        color = "primary";
                        text = "Listo para crecimiento";
                        break;
                    case "grow_overdue":
                        color = "warning";
                        text = "Retradado en crecimiento";
                        break;
                    case "growing":
                        color = "success";
                        text = "En crecimiento y ceba";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo";
                        break;
                    case "ready_for_sale":
                        color = "success";
                        text = "Listo para venta";
                        break;
                    case "sale":
                        color = "success";
                        text = "En venta";
                        break;
                    case "sold":
                        color = "success";
                        text = "Vendido";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        { key: "creationDate", label: "Fecha de creacion", type: "date" },
        { key: "observations", label: "Observaciones", type: "text" },
    ];

    const pigColumns: Column<any>[] = [
        { header: "Codigo", accessor: "code", type: "text" },
        { header: "Raza", accessor: "breed", type: "text" },
        { header: "Fecha de N.", accessor: "birthdate", type: "date" },
        {
            header: "Sexo",
            accessor: "sex",
            render: (value: string) => (
                <Badge color={value === "male" ? "info" : "danger"}>
                    {value === "male" ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
        { header: "Peso actual", accessor: "weight", type: "number" },
        {
            header: "Estado",
            accessor: "status",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "alive":
                        color = "success";
                        label = "Vivo";
                        break;
                    case "discarded":
                        color = "warning";
                        label = "Descartado";
                        break;
                    case "dead":
                        color = "dark";
                        label = "Muerto";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
    ];

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {

            const [groupResponse, lastWeightResponse, growthResponse, averageAgeResponse, weightResponse, activeResponse, mortalityResponse, metricsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/weighing/group_latest/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/weighing/growth_rate/${group_id}`, { isGroup: true }),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/group_average_age/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/weight_distribution/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/active_counts/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/mortality/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/group_metrics/${group_id}`),
            ])

            setGroupData(groupResponse.data.data);
            setLastWeigthed(lastWeightResponse.data.data)
            setGrowthRate(growthResponse.data.data)
            setAverageaAge(averageAgeResponse.data.data)
            setWeightDistribution(weightResponse.data.data)
            setActive(activeResponse.data.data)
            setMortality(mortalityResponse.data.data)
            setGroupMetrics(metricsResponse.data.data)
        } catch (error) {
            console.error("Error fetching data: ", { error });
            setAlertConfig({
                visible: true,
                color: "danger",
                message: "Ha ocurrido un error al obtener los datos, intentelo mas tarde",
            });
        } finally {
            setLoading(false);
        }
    };

    const daysSinceLastWeigh = lastWeighted?.weighedAt
        ? Math.floor(
            (Date.now() - new Date(lastWeighted.weighedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        : 0;


    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <LoadingAnimation />;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Detalles de grupo"} pageTitle={"Grupos"} />

                <div className="w-100 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <Button className="btn-danger" onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-2" />
                        Regresar
                    </Button>

                    <div className="d-flex gap-2 flex-wrap">
                        {['weaning', 'ready_to_grow', 'grow_overdue'].includes(groupData.status) && (
                            <Button color="success" disabled={groupData.status === 'sold' || !['ready_to_grow', 'grow_overdue'].includes(groupData.status)} onClick={() => toggleModal('changeStage')}>
                                <i className="mdi mdi-chart-line-variant me-2" />
                                Cambiar a crecimiento
                            </Button>
                        )}

                        {['growing', 'ready_for_sale'].includes(groupData.status) && (
                            <>
                                <Button color="info" disabled={groupData.status === 'sold' || !groupData.isReadyForReplacement} onClick={() => toggleModal('processReplacement')}>
                                    <i className="ri-refresh-line me-2" />
                                    Procesar reemplazo
                                </Button>
                                <Button color="warning" disabled={groupData.status === 'sold' || !['ready_for_sale'].includes(groupData.status)} onClick={() => toggleModal('changeStage')}>
                                    <i className="ri-money-dollar-circle-line me-2" />
                                    Procesar venta
                                </Button>
                            </>
                        )}

                        {groupData.status === 'sale' && groupData.stage === 'sale' && (
                            <Button color="success" onClick={() => toggleModal('sellPigs')}>
                                <i className="ri-shopping-cart-line me-2" />
                                Vender
                            </Button>
                        )}

                        <Button color="danger" onClick={() => toggleModal('discard')} disabled={groupData.status === 'sold'} title="Retirar cerdos">
                            <i className="ri-upload-2-line me-2" />
                            Retirar
                        </Button>
                        <Button color="warning" onClick={() => toggleModal('transfer')} disabled={groupData.status === 'sold'} title="Transferir cerdos">
                            <i className="ri-arrow-left-right-line me-2" />
                            Transferir
                        </Button>
                        <Button color="dark" onClick={() => toggleModal('registerDeath')} disabled={groupData.status === 'sold'} title="Registrar muerte">
                            <FaSkullCrossbones className="me-2" />
                            Registrar muerte
                        </Button>
                    </div>
                </div>

                <div className="p-3 bg-white rounded">
                    <Nav tabs className="nav-tabs nav-justified">
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeTab === "0" })}
                                onClick={() => toggleTab("0")}
                            >
                                Rendimiento
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => toggleTab("1")}
                            >
                                Información del grupo
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => toggleTab("2")}
                            >
                                Alimentación
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => toggleTab("3")}
                            >
                                Medicación
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeTab === "4" })}
                                onClick={() => toggleTab("4")}
                            >
                                Historial
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeTab} className="justified-tabs mt-3">
                    <TabPane tabId="0">
                        {/* KPIs principales */}
                        <Row className="g-3 mb-3">
                            <Col md={6} lg={3}>
                                <StatKpiCard
                                    title="Tasa de Supervivencia"
                                    value={groupMetrics?.survivalMetrics?.survivalRate || 0}
                                    suffix="%"
                                    icon={<i className="ri-heart-pulse-line" style={{ fontSize: 20, color: '#10b981' }} />}
                                    animateValue={true}
                                    decimals={1}
                                />
                            </Col>
                            <Col md={6} lg={3}>
                                <StatKpiCard
                                    title="FCR"
                                    value={groupMetrics?.feedEfficiency?.fcr || 0}
                                    suffix="kg/kg"
                                    icon={<i className="ri-exchange-line" style={{ fontSize: 20, color: '#ef4444' }} />}
                                    animateValue={true}
                                    decimals={2}
                                />
                            </Col>
                            <Col md={6} lg={3}>
                                <StatKpiCard
                                    title="Uniformidad"
                                    value={groupMetrics?.weightMetrics?.uniformity || 0}
                                    suffix="%"
                                    icon={<i className="ri-scales-3-line" style={{ fontSize: 20, color: '#8b5cf6' }} />}
                                    animateValue={true}
                                    decimals={1}
                                />
                            </Col>
                            <Col md={6} lg={3}>
                                <StatKpiCard
                                    title="Días en Producción"
                                    value={groupMetrics?.timeMetrics?.daysInProduction || 0}
                                    suffix="días"
                                    icon={<i className="ri-time-line" style={{ fontSize: 20, color: '#f59e0b' }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                            </Col>
                        </Row>

                        {/* Análisis de Peso */}
                        <Card className="border-0 shadow-sm mb-3">
                            <CardHeader className="bg-white border-bottom py-3">
                                <h6 className="mb-0 fw-bold text-dark">
                                    <i className="ri-scales-3-line me-2 text-primary" />
                                    Análisis de Peso
                                </h6>
                            </CardHeader>
                            <CardBody>
                                <Row className="g-3 mb-3">
                                    <Col xs={6} md={3}>
                                        <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                            <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.weightMetrics?.totalWeight?.toFixed(1) || 0} <small className="fs-6 text-muted">kg</small></div>
                                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Peso Total</div>
                                        </div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                            <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.weightMetrics?.averageWeight?.toFixed(2) || 0} <small className="fs-6 text-muted">kg</small></div>
                                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Peso Promedio</div>
                                        </div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                            <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.weightMetrics?.minWeight?.toFixed(2) || 0} <small className="fs-6 text-muted">kg</small></div>
                                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Peso Mínimo</div>
                                        </div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                            <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.weightMetrics?.maxWeight?.toFixed(2) || 0} <small className="fs-6 text-muted">kg</small></div>
                                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Peso Máximo</div>
                                        </div>
                                    </Col>
                                </Row>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded" style={{ background: '#f8f9fa' }}>
                                            <span className="text-muted small">Varianza de peso</span>
                                            <strong className="text-dark">±{groupMetrics?.weightMetrics?.weightVariance?.toFixed(2) || 0}</strong>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded" style={{ background: '#f8f9fa' }}>
                                            <span className="text-muted small">Uniformidad del grupo</span>
                                            <strong className="text-dark">{groupMetrics?.weightMetrics?.uniformity || 0}%</strong>
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>

                        {/* Eficiencia alimenticia + Supervivencia */}
                        <Row className="g-3 mb-3">
                            <Col lg={7}>
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-bottom py-3">
                                        <h6 className="mb-0 fw-bold text-dark">
                                            <i className="ri-restaurant-line me-2 text-warning" />
                                            Eficiencia Alimenticia
                                        </h6>
                                    </CardHeader>
                                    <CardBody>
                                        <Row className="g-3">
                                            <Col xs={6} md={4}>
                                                <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                    <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.feedEfficiency?.estimatedFeedKg || 0} <small className="fs-6 text-muted">kg</small></div>
                                                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Alimento Estimado</div>
                                                </div>
                                            </Col>
                                            <Col xs={6} md={4}>
                                                <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                    <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.feedEfficiency?.totalWeightGainKg?.toFixed(1) || 0} <small className="fs-6 text-muted">kg</small></div>
                                                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Ganancia Total</div>
                                                </div>
                                            </Col>
                                            <Col xs={12} md={4}>
                                                <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                    <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.feedEfficiency?.fcr?.toFixed(2) || 0}</div>
                                                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>FCR</div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col lg={5}>
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-bottom py-3">
                                        <h6 className="mb-0 fw-bold text-dark">
                                            <i className="ri-heart-pulse-line me-2 text-success" />
                                            Supervivencia
                                        </h6>
                                    </CardHeader>
                                    <CardBody className="d-flex flex-column justify-content-center">
                                        <div className="text-center mb-3">
                                            <div className="display-5 fw-bold text-success">{groupMetrics?.survivalMetrics?.survivalRate || 0}%</div>
                                            <div className="text-muted small">Tasa de Supervivencia</div>
                                        </div>
                                        <Row className="g-2">
                                            <Col xs={6}>
                                                <div className="text-center p-2 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                    <div className="h5 fw-bold text-dark mb-0">{groupMetrics?.survivalMetrics?.initialPigCount || 0}</div>
                                                    <div className="text-muted small">Iniciales</div>
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="text-center p-2 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                    <div className="h5 fw-bold text-dark mb-0">{groupMetrics?.survivalMetrics?.currentPigCount || 0}</div>
                                                    <div className="text-muted small">Actuales</div>
                                                </div>
                                            </Col>
                                        </Row>
                                        <div className="border-top mt-3 pt-3 d-flex justify-content-between align-items-center">
                                            <span className="text-muted small">Mortalidad</span>
                                            <Badge color={groupMetrics?.survivalMetrics?.mortality > 0 ? 'danger' : 'success'} className="fw-normal">
                                                {groupMetrics?.survivalMetrics?.mortality || 0} ({groupMetrics?.survivalMetrics?.mortalityRate || 0}%)
                                            </Badge>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Cronología */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-white border-bottom py-3">
                                <h6 className="mb-0 fw-bold text-dark">
                                    <i className="ri-calendar-event-line me-2 text-primary" />
                                    Cronología
                                </h6>
                            </CardHeader>
                            <CardBody>
                                <Row className="g-3">
                                    <Col md={4}>
                                        <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                                            <span className="text-muted small">Días en Producción</span>
                                            <strong className="text-dark">{groupMetrics?.timeMetrics?.daysInProduction || 0} días</strong>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                                            <span className="text-muted small">Fecha de Inicio</span>
                                            <strong className="text-dark">
                                                {groupMetrics?.timeMetrics?.startDate
                                                    ? new Date(groupMetrics.timeMetrics.startDate).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : '—'}
                                            </strong>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                                            <span className="text-muted small">Etapa Actual</span>
                                            <Badge color="success" className="fw-normal">
                                                {groupMetrics?.groupInfo?.stage || '—'}
                                            </Badge>
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </TabPane>

                    <TabPane tabId="1">
                        <div className="row g-3 align-items-stretch">
                            <div className="d-flex gap-2">
                                <div className="bg-white p-3 rounded shadow-sm d-flex gap-3">
                                    <KPI title="Total activos" value={active?.total} icon={FaPiggyBank} bgColor="#F3F4F6" iconColor="#374151" />
                                    <KPI title="Machos" value={active?.male} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                    <KPI title="Hembras" value={active?.female} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                    <KPI title="Mortalidad" value={mortality.mortality} icon={FaSkullCrossbones} bgColor="#FDECEC" iconColor="#E74C3C" />
                                    <KPI title="Edad promedio" value={averageAge ? `${averageAge.days} días` : "-"} icon={FaBirthdayCake} bgColor="#E8F6F3" iconColor="#1ABC9C" />
                                    <KPI title="Peso promedio" value={`${lastWeighted?.weight?.toFixed(2) ?? groupData.avgWeight.toFixed(2)} kg`} icon={FaBalanceScale} bgColor="#E9F7EF" iconColor="#2ECC71" />
                                    <KPI title="Ganancia diaria" value={`${growthRate.toFixed(2)} kg/día`} icon={FaChartLine} bgColor="#EEF2FF" iconColor="#4F46E5" />
                                    <KPI title="Último pesaje" value={`${daysSinceLastWeigh} días`} icon={FaCalendarDay} bgColor="#FFF4E5" iconColor="#F39C12" />
                                </div>

                                <div className="d-flex gap-3 w-100">
                                    <GrowthStatusProgress status={groupData.status} title="Progreso de ciclo de vida del grupo" />
                                </div>
                            </div>

                            {/* 🔹 Fila: Información General + Distribución + Evolución */}
                            <div className="col-12 col-xl-4 d-flex flex-column">
                                <Card className="shadow-sm flex-grow-1 h-100">
                                    <CardHeader className="bg-white">
                                        <h5 className="mb-0 text-uppercase text-muted">Información General</h5>
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={groupAttibutes} object={groupData} />
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="col-12 col-xl-4 d-flex flex-column">
                                <WeightDistributionChart data={weightDistribution} title="Distribución de pesos" />
                            </div>

                            <div className="col-12 col-xl-4 d-flex flex-column">
                                <WeightEvolutionChart entityId={group_id ?? ""} mode="group" title="Evolución del peso" />
                            </div>

                            {/* 🔹 Tabla de Cerdos (ancho completo) */}
                            <div className="col-12">
                                <Card className="shadow-sm m-0">
                                    <CardHeader className="bg-white">
                                        <h5 className="mb-0 fw-bold text-uppercase text-muted">Cerdos en el grupo</h5>
                                    </CardHeader>
                                    <CardBody className="px-0">
                                        <CustomTable
                                            columns={pigColumns}
                                            data={groupData.pigsInGroup}
                                            showSearchAndFilter={false}
                                            rowsPerPage={10}
                                            showPagination
                                        />
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    </TabPane>

                    <TabPane tabId="2">
                        <GroupFeedingDetails key={`feeding-${refreshKey}`} groupId={group_id ?? ""} onUpdate={fetchData} isGroupSold={groupData.status === 'sold'} />
                    </TabPane>

                    <TabPane tabId="3">
                        <GroupMedicalDetails key={`medical-${refreshKey}`} groupId={group_id ?? ""} onUpdate={fetchData} isGroupSold={groupData.status === 'sold'} />
                    </TabPane>

                    <TabPane tabId="4">
                        <GroupHistoryTimeline data={groupData.groupHistory || []} />
                    </TabPane>
                </TabContent>
            </Container>


            <Modal size="xl" isOpen={modals.changeStage} toggle={() => toggleModal("changeStage")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("changeStage")}>Cambiar de etapa</ModalHeader>
                <ModalBody>
                    <ChangeStageGroup groupId={groupData._id} onSave={() => { toggleModal('changeStage'); fetchData(); setRefreshKey(prev => prev + 1); }} />
                </ModalBody>
            </Modal>


            <Modal size="xl" isOpen={modals.processReplacement} toggle={() => toggleModal("processReplacement")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("processReplacement")}>Procesar reemplazo de cerdos</ModalHeader>
                <ModalBody>
                    <ProcessPigReplacementForm groupId={groupData._id} onSave={() => { toggleModal('processReplacement'); fetchData(); setRefreshKey(prev => prev + 1); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.transfer} toggle={() => toggleModal("transfer")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("transfer")}>Trasferir cerdos</ModalHeader>
                <ModalBody>
                    <GroupTransferForm groupId={group_id ?? ''} onSave={() => { toggleModal('transfer'); fetchData(); setRefreshKey(prev => prev + 1); }} stage={groupData.stage} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.discard} toggle={() => toggleModal("discard")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("discard")}>Retirar cerdos</ModalHeader>
                <ModalBody>
                    <GroupWithDrawForm groupId={group_id ?? ''} onSave={() => { fetchData(); toggleModal('discard'); setRefreshKey(prev => prev + 1); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.registerDeath} toggle={() => toggleModal("registerDeath")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("registerDeath")}>Registrar muerte</ModalHeader>
                <ModalBody>
                    <DiscardPigInGroupForm groupId={group_id ?? ''} onSave={() => { fetchData(); toggleModal('registerDeath'); setRefreshKey(prev => prev + 1); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.sellPigs} toggle={() => toggleModal("sellPigs")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("sellPigs")}>Vender cerdos</ModalHeader>
                <ModalBody>
                    <SellPigsForm groupId={groupData._id} onSave={() => { toggleModal('sellPigs'); fetchData(); setRefreshKey(prev => prev + 1); }} />
                </ModalBody>
            </Modal>


            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    );
};

export default GroupDetails;
