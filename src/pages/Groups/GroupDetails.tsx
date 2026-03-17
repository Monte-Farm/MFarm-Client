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
import ProcessPigSaleForm from "Components/Common/Forms/ProcessPigSaleForm";
import ProcessPigReplacementForm from "Components/Common/Forms/ProcessPigReplacementForm";

const GroupDetails = () => {
    document.title = "Detalles de grupo | Management System";
    const { group_id } = useParams();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [groupData, setGroupData] = useState<any>({});
    const [activeTab, setActiveTab] = useState("1");
    const [modals, setModals] = useState({ changeStage: false, registerDeath: false, discard: false, transfer: false, processSale: false, processReplacement: false });
    const [lastWeighted, setLastWeigthed] = useState<any>({})
    const [growthRate, setGrowthRate] = useState<number>(0);
    const [averageAge, setAverageaAge] = useState<any>()
    const [weightDistribution, setWeightDistribution] = useState<any>();
    const [active, setActive] = useState<any>();
    const [mortality, setMortality] = useState<any>();

    const toggleTab = (tab: string) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const hasPigs = (groupData?.pigCount ?? 0) > 0;
    const isLinkedMode = groupData?.groupMode === "linked";
    const isCountMode = groupData?.groupMode === "count";

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
                        color = "primary";
                        text = "Retradado en crecimiento";
                        break;
                    case "growing":
                        color = "success";
                        text = "En crecimiento y ceba";
                        break;
                    case "ready_to_exit":
                        color = "warning";
                        text = "Listo para salida";
                        break;
                    case "exit_overdue":
                        color = "dark";
                        text = "Retrasado para salida";
                        break;
                    case "exit":
                        color = "warning";
                        text = "Salida";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo";
                        break;
                    case "exit_processed":
                        color = "success";
                        text = "Salida Procesada";
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

            const [groupResponse, lastWeightResponse, growthResponse, averageAgeResponse, weightResponse, activeResponse, mortalityResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/weighing/group_latest/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/weighing/growth_rate/${group_id}`, { isGroup: true }),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/group_average_age/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/weight_distribution/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/active_counts/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/mortality/${group_id}`),
            ])

            setGroupData(groupResponse.data.data);
            setLastWeigthed(lastWeightResponse.data.data)
            setGrowthRate(growthResponse.data.data)
            setAverageaAge(averageAgeResponse.data.data)
            setWeightDistribution(weightResponse.data.data)
            setActive(activeResponse.data.data)
            setMortality(mortalityResponse.data.data)
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
                                            <Button color="success" disabled={!['ready_to_grow', 'grow_overdue'].includes(groupData.status)} onClick={() => toggleModal('changeStage')}>
                                                <i className="mdi mdi-chart-line-variant me-2" />
                                                Cambiar a crecimiento
                                            </Button>
                                        )}

                                        {['growing', 'ready_to_exit', 'exit_overdue'].includes(groupData.status) && (
                                            <div className="d-flex gap-2">
                                                <Button color="warning" disabled={!['ready_to_exit', 'exit_overdue'].includes(groupData.status)} onClick={() => toggleModal('processSale')}>
                                                    <i className="ri-money-dollar-circle-line me-2" />
                                                    Procesar venta
                                                </Button>
                                                <Button color="info" disabled={!['ready_to_exit', 'exit_overdue'].includes(groupData.status)} onClick={() => toggleModal('processReplacement')}>
                                                    <i className="ri-refresh-line me-2" />
                                                    Procesar reemplazo
                                                </Button>
                                            </div>
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
                                            <Button color="danger" onClick={() => toggleModal('discard')}>
                                                <i className="ri-upload-2-line align-middle" />
                                            </Button>
                                            <Button color="warning" onClick={() => toggleModal('transfer')}>
                                                <i className="ri-arrow-left-right-line align-middle" />
                                            </Button>
                                            <Button color="dark" onClick={() => toggleModal('registerDeath')}>
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
                        <GroupFeedingDetails groupId={group_id ?? ""} />
                    </TabPane>

                    <TabPane tabId="3">
                        <GroupMedicalDetails groupId={group_id ?? ""} />
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
                    <ChangeStageGroup groupId={groupData._id} onSave={() => { toggleModal('changeStage'); fetchData() }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.processSale} toggle={() => toggleModal("processSale")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("processSale")}>Procesar venta de cerdos</ModalHeader>
                <ModalBody>
                    <ProcessPigSaleForm groupId={groupData._id} onSave={() => { toggleModal('processSale'); fetchData() }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.processReplacement} toggle={() => toggleModal("processReplacement")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("processReplacement")}>Procesar reemplazo de cerdos</ModalHeader>
                <ModalBody>
                    <ProcessPigReplacementForm groupId={groupData._id} onSave={() => { toggleModal('processReplacement'); fetchData() }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.transfer} toggle={() => toggleModal("transfer")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("transfer")}>Trasferir cerdos</ModalHeader>
                <ModalBody>
                    <GroupTransferForm groupId={group_id ?? ''} onSave={() => { toggleModal('transfer'); fetchData(); }} stage={groupData.stage} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.discard} toggle={() => toggleModal("discard")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("discard")}>Retirar cerdos</ModalHeader>
                <ModalBody>
                    <GroupWithDrawForm groupId={group_id ?? ''} onSave={() => { fetchData(); toggleModal('discard') }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.registerDeath} toggle={() => toggleModal("registerDeath")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("registerDeath")}>Registrar muerte</ModalHeader>
                <ModalBody>
                    <DiscardPigInGroupForm groupId={group_id ?? ''} onSave={() => { fetchData(); toggleModal('registerDeath') }} onCancel={() => { }} />
                </ModalBody>
            </Modal>


            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    );
};

export default GroupDetails;
