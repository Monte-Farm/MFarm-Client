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
    Container,
    Modal,
    ModalBody,
    ModalHeader,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
} from "reactstrap";
import classnames from "classnames";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import KPI from "Components/Common/Graphics/Kpi";
import { FaBalanceScale, FaBirthdayCake, FaCalendarDay, FaChartLine, FaMars, FaPiggyBank, FaSkullCrossbones, FaVenus } from "react-icons/fa";
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import GroupHistoryList from "Components/Common/Lists/GroupHistoryList";
import SimpleBar from "simplebar-react";
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

                <div className="w-100 mb-4">
                    <Button className="btn-danger" onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-2" />
                        Regresar
                    </Button>
                </div>

                <div className="p-3 bg-white rounded">
                    <Nav tabs className="nav-tabs nav-justified">
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeTab === "0" })}
                                onClick={() => toggleTab("0")}
                            >
                                Nueva Tab
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
                        <div className="p-4">
                            {/* Header Section */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <div>
                                            <h2 className="mb-1 fw-bold text-dark">
                                                <i className="ri-dashboard-3-line me-2 text-primary" />
                                                Dashboard de Métricas
                                            </h2>
                                            <p className="text-muted mb-0">Análisis completo del rendimiento del grupo</p>
                                        </div>
                                        <div className="text-end">
                                            <div className="badge bg-primary-subtle text-primary px-3 py-2 fs-6">
                                                <i className="ri-refresh-line me-1" />
                                                Actualizado en tiempo real
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Key Metrics Overview */}
                            <div className="row g-3 mb-4">
                                <div className="col-12">
                                    <div className="bg-white border-0 shadow-lg rounded-3 p-4">
                                        <div className="row align-items-center">
                                            <div className="col-md-3">
                                                <div className="text-center p-3 rounded bg-primary bg-opacity-10">
                                                    <div className="display-6 fw-bold mb-2 text-primary">{groupMetrics?.groupInfo?.code || '-'}</div>
                                                    <div className="small text-muted fw-medium">CÓDIGO DE GRUPO</div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="text-center p-3 rounded bg-success bg-opacity-10">
                                                    <div className="display-6 fw-bold mb-2 text-success">{groupMetrics?.groupInfo?.pigCount || 0}</div>
                                                    <div className="small text-muted fw-medium">CERDOS ACTIVOS</div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="text-center p-3 rounded bg-info bg-opacity-10">
                                                    <div className="display-6 fw-bold mb-2 text-info">{groupMetrics?.survivalMetrics?.survivalRate || 0}%</div>
                                                    <div className="small text-muted fw-medium">TASA DE SUPERVIVENCIA</div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="text-center p-3 rounded bg-warning bg-opacity-10">
                                                    <div className="display-6 fw-bold mb-2 text-warning">${groupMetrics?.costBreakdown?.total?.toFixed(2) || 0}</div>
                                                    <div className="small text-muted fw-medium">COSTO TOTAL</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Dashboard Grid */}
                            <div className="row g-4">
                                {/* Left Column - Performance Metrics */}
                                <div className="col-12 col-xl-8">
                                    <div className="row g-3">
                                        {/* Weight Performance Card */}
                                        <div className="col-12">
                                            <div className="card border-0 shadow-sm h-100">
                                                <div className="card-header bg-gradient-success text-white border-0 py-3">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <i className="ri-scales-3-line fs-4 me-2" />
                                                            <h5 className="mb-0 fw-semibold">Análisis de Peso</h5>
                                                        </div>
                                                        <div className="badge bg-white text-success fs-6">
                                                            <i className="ri-line-chart-line me-1" />
                                                            Rendimiento
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    <div className="row mb-4">
                                                        <div className="col-6 col-md-3">
                                                            <div className="text-center p-3 rounded bg-light">
                                                                <div className="h3 text-primary fw-bold mb-1">{groupMetrics?.weightMetrics?.totalWeight?.toFixed(1) || 0} <small className="fs-6">kg</small></div>
                                                                <div className="small text-muted">Peso Total</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-6 col-md-3">
                                                            <div className="text-center p-3 rounded bg-light">
                                                                <div className="h3 text-info fw-bold mb-1">{groupMetrics?.weightMetrics?.averageWeight?.toFixed(2) || 0} <small className="fs-6">kg</small></div>
                                                                <div className="small text-muted">Peso Promedio</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-6 col-md-3">
                                                            <div className="text-center p-3 rounded bg-light">
                                                                <div className="h3 text-success fw-bold mb-1">{groupMetrics?.weightMetrics?.uniformity || 0}%</div>
                                                                <div className="small text-muted">Uniformidad</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-6 col-md-3">
                                                            <div className="text-center p-3 rounded bg-light">
                                                                <div className="h3 text-warning fw-bold mb-1">±{groupMetrics?.weightMetrics?.weightVariance?.toFixed(2) || 0}</div>
                                                                <div className="small text-muted">Varianza</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="border-top pt-3">
                                                        <div className="row">
                                                            <div className="col-6">
                                                                <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                                                                    <span className="text-muted fw-medium">Peso Mínimo:</span>
                                                                    <span className="fw-bold text-primary">{groupMetrics?.weightMetrics?.minWeight?.toFixed(2) || 0} kg</span>
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                                                                    <span className="text-muted fw-medium">Peso Máximo:</span>
                                                                    <span className="fw-bold text-primary">{groupMetrics?.weightMetrics?.maxWeight?.toFixed(2) || 0} kg</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Feed Efficiency Card */}
                                        <div className="col-12">
                                            <div className="card border-0 shadow-sm h-100">
                                                <div className="card-header bg-gradient-warning text-white border-0 py-3">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <i className="ri-restaurant-line fs-4 me-2" />
                                                            <h5 className="mb-0 fw-semibold">Eficiencia Alimenticia</h5>
                                                        </div>
                                                        <div className="badge bg-white text-warning fs-6">
                                                            <i className="ri-calculator-line me-1" />
                                                            Optimización
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    <div className="row mb-4">
                                                        <div className="col-6 col-md-3">
                                                            <div className="text-center p-3 rounded bg-light">
                                                                <div className="h3 text-primary fw-bold mb-1">{groupMetrics?.feedEfficiency?.estimatedFeedKg || 0} <small className="fs-6">kg</small></div>
                                                                <div className="small text-muted">Alimento Estimado</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-6 col-md-3">
                                                            <div className="text-center p-3 rounded bg-light">
                                                                <div className="h3 text-info fw-bold mb-1">{groupMetrics?.feedEfficiency?.totalWeightGainKg?.toFixed(1) || 0} <small className="fs-6">kg</small></div>
                                                                <div className="small text-muted">Ganancia Total</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-6 col-md-3">
                                                            <div className="text-center p-3 rounded bg-light">
                                                                <div className="h3 text-success fw-bold mb-1">{groupMetrics?.feedEfficiency?.fcr?.toFixed(2) || 0}</div>
                                                                <div className="small text-muted">FCR</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-6 col-md-3">
                                                            <div className="text-center p-3 rounded bg-light">
                                                                <div className="h3 text-warning fw-bold mb-1">${groupMetrics?.feedEfficiency?.feedCostPerKgGain?.toFixed(2) || 0}</div>
                                                                <div className="small text-muted">Costo/kg Ganado</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="alert alert-warning border-0 mb-0">
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div>
                                                                <i className="ri-money-dollar-circle-line me-2" />
                                                                <strong>Costo Total de Alimentación:</strong>
                                                            </div>
                                                            <span className="h4 mb-0 text-warning fw-bold">${groupMetrics?.feedEfficiency?.feedCostTotal?.toFixed(2) || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Status & Costs */}
                                <div className="col-12 col-xl-4">
                                    <div className="row g-3">
                                        {/* Survival Status Card */}
                                        <div className="col-12">
                                            <div className="card border-0 shadow-sm h-100">
                                                <div className="card-header bg-gradient-info text-white border-0 py-3">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <i className="ri-heart-pulse-line fs-4 me-2" />
                                                            <h5 className="mb-0 fw-semibold">Estado de Salud</h5>
                                                        </div>
                                                        <div className="badge bg-white text-info fs-6">
                                                            <i className="ri-shield-check-line me-1" />
                                                            Vital
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    <div className="text-center mb-4">
                                                        <div className="position-relative d-inline-block">
                                                            <div className="display-3 fw-bold text-success mb-2">
                                                                {groupMetrics?.survivalMetrics?.survivalRate || 0}%
                                                            </div>
                                                            <div className="badge bg-success-subtle text-success position-absolute top-0 start-100 translate-middle">
                                                                <i className="ri-arrow-up-line" />
                                                            </div>
                                                        </div>
                                                        <div className="text-muted">Tasa de Supervivencia</div>
                                                    </div>
                                                    <div className="row mb-3">
                                                        <div className="col-6">
                                                            <div className="text-center p-3 rounded bg-light">
                                                                <div className="h5 text-primary fw-bold mb-1">{groupMetrics?.survivalMetrics?.initialPigCount || 0}</div>
                                                                <div className="small text-muted">Iniciales</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="text-center p-3 rounded bg-light">
                                                                <div className="h5 text-info fw-bold mb-1">{groupMetrics?.survivalMetrics?.currentPigCount || 0}</div>
                                                                <div className="small text-muted">Actuales</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="border-top pt-3">
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <span className="text-muted fw-medium">Mortalidad:</span>
                                                            <Badge color={groupMetrics?.survivalMetrics?.mortality > 0 ? "danger" : "success"} className="fs-6">
                                                                <i className={`ri-${groupMetrics?.survivalMetrics?.mortality > 0 ? 'alert' : 'check'}-line me-1`} />
                                                                {groupMetrics?.survivalMetrics?.mortality || 0} ({groupMetrics?.survivalMetrics?.mortalityRate || 0}%)
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cost Analysis Card */}
                                        <div className="col-12">
                                            <div className="card border-0 shadow-sm h-100">
                                                <div className="card-header bg-gradient-danger text-white border-0 py-3">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <i className="ri-money-dollar-circle-line fs-4 me-2" />
                                                            <h5 className="mb-0 fw-semibold">Análisis de Costos</h5>
                                                        </div>
                                                        <div className="badge bg-white text-danger fs-6">
                                                            <i className="ri-funds-line me-1" />
                                                            Finanzas
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    <div className="text-center mb-4">
                                                        <div className="display-4 fw-bold text-danger mb-2">
                                                            ${groupMetrics?.costBreakdown?.total?.toFixed(2) || 0}
                                                        </div>
                                                        <div className="text-muted">Costo Total Operativo</div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                                                            <div className="d-flex align-items-center">
                                                                <i className="ri-restaurant-line text-primary me-2" />
                                                                <span className="text-muted fw-medium">Alimento:</span>
                                                            </div>
                                                            <div className="text-end">
                                                                <strong className="text-primary">${groupMetrics?.costBreakdown?.feed?.toFixed(2) || 0}</strong>
                                                                <Badge color="primary" className="ms-2">
                                                                    {groupMetrics?.costBreakdown?.feedPercentage || 0}%
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                                                            <div className="d-flex align-items-center">
                                                                <i className="ri-medicine-bottle-line text-info me-2" />
                                                                <span className="text-muted fw-medium">Medicación:</span>
                                                            </div>
                                                            <div className="text-end">
                                                                <strong className="text-info">${groupMetrics?.costBreakdown?.medication?.toFixed(2) || 0}</strong>
                                                                <Badge color="info" className="ms-2">
                                                                    {groupMetrics?.costBreakdown?.medicationPercentage || 0}%
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                                                            <div className="d-flex align-items-center">
                                                                <i className="ri-shield-star-line text-success me-2" />
                                                                <span className="text-muted fw-medium">Vacunas:</span>
                                                            </div>
                                                            <div className="text-end">
                                                                <strong className="text-success">${groupMetrics?.costBreakdown?.vaccines?.toFixed(2) || 0}</strong>
                                                                <Badge color="success" className="ms-2">
                                                                    {groupMetrics?.costBreakdown?.vaccinePercentage || 0}%
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                                                            <div className="d-flex align-items-center">
                                                                <i className="ri-more-line text-warning me-2" />
                                                                <span className="text-muted fw-medium">Otros:</span>
                                                            </div>
                                                            <div className="text-end">
                                                                <strong className="text-warning">${groupMetrics?.costBreakdown?.other?.toFixed(2) || 0}</strong>
                                                                <Badge color="warning" className="ms-2">
                                                                    {groupMetrics?.costBreakdown?.otherPercentage || 0}%
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Time Metrics Card */}
                                        <div className="col-12">
                                            <div className="card border-0 shadow-sm h-100">
                                                <div className="card-header bg-gradient-secondary text-white border-0 py-3">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <i className="ri-time-line fs-4 me-2" />
                                                            <h5 className="mb-0 fw-semibold">Métricas de Tiempo</h5>
                                                        </div>
                                                        <div className="badge bg-white text-secondary fs-6">
                                                            <i className="ri-calendar-line me-1" />
                                                            Cronología
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    <div className="text-center mb-4">
                                                        <div className="display-4 fw-bold text-secondary mb-2">
                                                            {groupMetrics?.timeMetrics?.daysInProduction || 0}
                                                        </div>
                                                        <div className="text-muted">Días en Producción</div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="d-flex align-items-center justify-content-between p-3 rounded bg-light">
                                                            <div className="d-flex align-items-center">
                                                                <i className="ri-money-dollar-circle-line text-primary me-2" />
                                                                <span className="text-muted fw-medium">Costo por Día:</span>
                                                            </div>
                                                            <strong className="text-primary fs-5">${groupMetrics?.timeMetrics?.costPerDay?.toFixed(2) || 0}</strong>
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between p-3 rounded bg-light">
                                                            <div className="d-flex align-items-center">
                                                                <i className="ri-calendar-event-line text-info me-2" />
                                                                <span className="text-muted fw-medium">Fecha Inicio:</span>
                                                            </div>
                                                            <strong className="text-info">{new Date(groupMetrics?.timeMetrics?.startDate || '').toLocaleDateString()}</strong>
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between p-3 rounded bg-light">
                                                            <div className="d-flex align-items-center">
                                                                <i className="ri-flag-line text-success me-2" />
                                                                <span className="text-muted fw-medium">Etapa Actual:</span>
                                                            </div>
                                                            <Badge color="success" className="fs-6">
                                                                {groupMetrics?.groupInfo?.stage || '-'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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

                            {/* 🔹 2. COLUMNA IZQUIERDA: GRÁFICOS (Análisis visual) */}
                            <div className="col-12 col-xl-7 d-flex flex-column gap-2 h-100">
                                <WeightDistributionChart data={weightDistribution} title="Distribución de pesos" />
                                <WeightEvolutionChart entityId={group_id ?? ""} mode="group" title="Evolución del peso" />
                            </div>

                            {/* 🔹 3. COLUMNA DERECHA: DATOS Y LISTADO (Detalles técnicos) */}
                            <div className="col-12 col-xl-5 d-flex flex-column gap-2">
                                {/* Datos del grupo (Ahora más compacto) */}
                                <Card className="shadow-sm flex-grow-1 h-50">
                                    <CardHeader className="bg-white d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0 text-uppercase text-muted">Información General</h5>

                                        {['weaning', 'ready_to_grow', 'grow_overdue'].includes(groupData.status) && (
                                            <Button color="success" disabled={groupData.status === 'sold' || !['ready_to_grow', 'grow_overdue'].includes(groupData.status)} onClick={() => toggleModal('changeStage')}>
                                                <i className="mdi mdi-chart-line-variant me-2" />
                                                Cambiar a crecimiento
                                            </Button>
                                        )}

                                        {['growing', 'ready_for_sale',].includes(groupData.status) && (
                                            <div className="d-flex gap-2">

                                                <Button color="info" disabled={groupData.status === 'sold' || !groupData.isReadyForReplacement} onClick={() => toggleModal('processReplacement')}>
                                                    <i className="ri-refresh-line me-2" />
                                                    Procesar reemplazo
                                                </Button>

                                                <Button color="warning" disabled={groupData.status === 'sold' || !['ready_for_sale'].includes(groupData.status)} onClick={() => toggleModal('changeStage')}>
                                                    <i className="ri-money-dollar-circle-line me-2" />
                                                    Procesar venta
                                                </Button>

                                            </div>
                                        )}

                                        {groupData.status === 'sale' && groupData.stage === 'sale' && (
                                            <Button color="success" onClick={() => toggleModal('sellPigs')}>
                                                <i className="ri-shopping-cart-line me-2" />
                                                Vender
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={groupAttibutes} object={groupData} />
                                    </CardBody>
                                </Card>

                                {/* Tabla de Cerdos */}
                                <Card className="shadow-sm flex-grow-1 h-50">
                                    <CardHeader className="bg-white d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0 fw-bold text-uppercase text-muted">Cerdos en el grupo</h5>

                                        <div className="d-flex gap-2">
                                            <Button color="danger" onClick={() => toggleModal('discard')} disabled={groupData.status === 'sold'}>
                                                <i className="ri-upload-2-line align-middle" />
                                            </Button>
                                            <Button color="warning" onClick={() => toggleModal('transfer')} disabled={groupData.status === 'sold'}>
                                                <i className="ri-arrow-left-right-line align-middle" />
                                            </Button>
                                            <Button color="dark" onClick={() => toggleModal('registerDeath')} disabled={groupData.status === 'sold'}>
                                                <FaSkullCrossbones color="white" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="px-0">
                                        <CustomTable
                                            columns={pigColumns}
                                            data={groupData.pigsInGroup}
                                            showSearchAndFilter={false}
                                            rowsPerPage={5}
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
                        <div className="w-100 h-100">
                            <Card className="h-100">
                                <CardHeader className="border-bottom custom-card-header">
                                    <h5 className="mb-0 text-dark fw-semibold">Historial de grupo</h5>
                                </CardHeader>
                                <CardBody className="h-100 overflow-hidden p-0">
                                    <SimpleBar style={{ maxHeight: "100%" }}>
                                        <GroupHistoryList data={groupData.groupHistory} />
                                    </SimpleBar>
                                </CardBody>
                            </Card>
                        </div>
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
