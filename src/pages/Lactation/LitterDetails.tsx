import { ConfigContext } from "App";
import KPI from "Components/Common/Graphics/Kpi";
import KPIBox from "Components/Common/Graphics/KPIBox";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FaMars, FaPiggyBank, FaVenus, FaWeightHanging } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import CustomTable from "Components/Common/Tables/CustomTable";
import { Column } from "common/data/data_types";
import { FiInbox } from "react-icons/fi";
import LitterMedicalDetails from "Components/Common/Details/LitterMedicalDetails";
import LitterEventsCard from "Components/Common/Shared/LitterEventsCard";
import WeanLitterForm from "Components/Common/Forms/WeanLitterForm";

const LitterDetails = () => {
    const { litter_id } = useParams();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [litterDetails, setLitterDetails] = useState<any>({})
    const [activeTab, setActiveTab] = useState("1");
    const [modals, setModals] = useState({ weanLitter: false });

    const litterAttributes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
        { key: 'initialMale', label: 'Nacidos macho', type: 'text' },
        { key: 'initialFemale', label: 'Nacidos hembra', type: 'text' },
        {
            key: 'status',
            label: 'Estado',
            type: 'text',
            render: (value, object) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'active':
                        color = 'warning';
                        label = 'Lactando';
                        break;
                    case 'weaned':
                        color = 'success';
                        label = 'Destetada';
                        break;
                }

                return <Badge color={color}>{label}</Badge>;

            }
        },
        {
            key: 'responsible',
            label: 'Registrado por',
            type: 'text',
            render: (value, object) => <span>{object.responsible?.name} {object.responsible?.lastname}</span>
        },
    ]

    const motherAttributes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'birthdate', label: 'Fecha de nacimiento', type: 'date' },
        { key: 'breed', label: 'Raza', type: 'text' },
    ]

    const pigletsColumns: Column<any>[] = [
        {
            header: 'Sexo',
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
        { header: 'Peso', accessor: 'weight', type: 'text', isFilterable: true },
        {
            header: 'Estado',
            accessor: 'status',
            render: (value: string) => (
                <Badge color={value === 'alive' ? "info" : "danger"}>
                    {value === 'alive' ? "Vivo" : "Muerto"}
                </Badge>
            ),
        },
    ]

    const toggleTab = (tab: string) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext || !userLogged || !litter_id) return
        try {
            setLoading(true)
            const litterResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/litter/find_by_id/${litter_id}`)
            setLitterDetails(litterResponse.data.data);
        } catch (error) {
            console.error('Error fetching data:', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' });
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Detalles de camada"} pageTitle={"Camadas"} />

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
                                Información de la camada
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => toggleTab("2")}
                            >
                                Informacion medica
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeTab} className="justified-tabs mt-3">
                    <TabPane tabId="1">
                        <div className="d-flex gap-3">
                            <KPI title="Machos" value={litterDetails.currentMale} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                            <KPI title="Hembras" value={litterDetails.currentFemale} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                            <KPI title="Lechones totales" value={litterDetails.currentMale + litterDetails.currentFemale} icon={FaPiggyBank} bgColor="#EFE8FF" iconColor="#7B2FFF" />
                            <KPI title="Peso promedio" value={`${litterDetails?.averageWeight?.toFixed(2)} kg`} icon={FaWeightHanging} bgColor="#E6F4EA" iconColor="#2E7D32" />
                        </div>

                        <div className="row g-3">
                            <div className="col-12 col-lg-4 d-flex flex-column">
                                <Card className="flex-fill">
                                    <CardHeader className="bg-white border-bottom d-flex justify-content-between">
                                        <h5 className="mb-0 text-dark fw-semibold">Datos de la camada</h5>

                                        <Button color="success" onClick={() => toggleModal('weanLitter')} disabled={litterDetails.status === 'weaned'}>
                                            Destetar
                                        </Button>
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={litterAttributes} object={litterDetails} />
                                    </CardBody>
                                </Card>

                                <Card className="flex-fill">
                                    <CardHeader className="d-flex justify-content-between align-items-center">
                                        <h5>Información de la madre</h5>
                                        <Button className="fs-6 p-0" color="link" onClick={() => navigate(`/pigs/pig_details/${litterDetails?.mother?._id}`)}>
                                            Todos los detalles ↗
                                        </Button>
                                    </CardHeader>
                                    <CardBody className="overflow-auto">
                                        <ObjectDetails attributes={motherAttributes} object={litterDetails.mother} />
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="col-12 col-lg-4 d-flex flex-column">
                                <Card className="flex-fill">
                                    <CardHeader className="bg-white border-bottom">
                                        <h5 className="mb-0 text-dark fw-semibold">Lechones</h5>
                                    </CardHeader>
                                    <CardBody className="overflow-auto p-0">
                                        <CustomTable columns={pigletsColumns} data={litterDetails?.piglets} showSearchAndFilter={false} showPagination rowsPerPage={7} />
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="col-12 col-lg-4 d-flex flex-column">
                                <LitterEventsCard events={litterDetails?.events} />
                            </div>
                        </div>
                    </TabPane>

                    <TabPane tabId="2">
                        <LitterMedicalDetails litterId={litter_id ?? ''} />
                    </TabPane>
                </TabContent>
            </Container>

            <Modal size="xl" isOpen={modals.weanLitter} toggle={() => toggleModal("weanLitter")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("weanLitter")}>Destetar camada </ModalHeader>
                <ModalBody>
                    <WeanLitterForm litterId={litter_id ?? ''} onSave={() => { toggleModal('weanLitter'); fetchData(); }} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default LitterDetails;