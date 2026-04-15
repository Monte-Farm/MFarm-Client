import { ConfigContext } from "App";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import { Column } from "common/data/data_types";
import LitterMedicalDetails from "Components/Common/Details/LitterMedicalDetails";
import LitterEventsCard from "Components/Common/Shared/LitterEventsCard";
import WeanLitterForm from "Components/Common/Forms/WeanLitterForm";
import DiscardPigletsForm from "Components/Common/Forms/DiscardPigletsForm";
import WeaningProgress from "Components/Common/Shared/WeaningProgress";
import LitterFeedingDetails from "Components/Common/Details/LitterFeedingDetails";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import { FaMars, FaVenus, FaPiggyBank } from "react-icons/fa";
import { RiScales3Line, RiCalculatorLine } from "react-icons/ri";

const LitterDetails = () => {
    const { litter_id } = useParams();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [litterDetails, setLitterDetails] = useState<any>({})
    const [activeTab, setActiveTab] = useState("1");
    const [modals, setModals] = useState({ weanLitter: false, discardPiglets: false });

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
                    case "active":
                        color = "primary";
                        label = "Lactando";
                        break;
                    case "ready_to_wean":
                        color = "warning";
                        label = "Listo para destetar";
                        break;
                    case "weaned":
                        color = "success";
                        label = "Destetada";
                        break;
                    case "wean_overdue":
                        color = "black";
                        label = "Destete vencido";
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

                <div className="w-100 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <Button className="btn-danger" onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-2" />
                        Regresar
                    </Button>

                    <div className="d-flex gap-2 flex-wrap">
                        <Button color="danger" onClick={() => toggleModal('discardPiglets')} disabled={litterDetails.status === 'weaned'}>
                            <i className="ri-close-circle-line me-2" />
                            Descartar lechones
                        </Button>
                        <Button color="success" onClick={() => toggleModal('weanLitter')} disabled={litterDetails.status === 'weaned' || litterDetails.status === 'active'}>
                            <i className="mdi mdi-baby-bottle-outline me-2" />
                            Destetar
                        </Button>
                    </div>
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
                        <NavItem>
                            <NavLink
                                style={{ cursor: "pointer" }}
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => toggleTab("3")}
                            >
                                Alimentación
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeTab} className="justified-tabs mt-3">
                    <TabPane tabId="1">
                        {(() => {
                            const piglets = litterDetails?.piglets || [];
                            const totalCurrent = (litterDetails?.currentMale || 0) + (litterDetails?.currentFemale || 0);
                            const totalWeight = piglets.reduce((acc: number, p: any) => acc + Number(p.weight || 0), 0);
                            const avgWeight = piglets.length > 0 ? totalWeight / piglets.length : 0;

                            const pigletColumns: Column<any>[] = [
                                {
                                    header: 'Sexo',
                                    accessor: 'sex',
                                    type: 'text',
                                    render: (value: string) => (
                                        <Badge color={value === 'male' ? 'info' : 'danger'} className="fw-normal">
                                            {value === 'male' ? '♂ Macho' : '♀ Hembra'}
                                        </Badge>
                                    ),
                                },
                                {
                                    header: 'Peso (kg)',
                                    accessor: 'weight',
                                    type: 'number',
                                    render: (value: any) => <span>{Number(value || 0).toFixed(2)}</span>,
                                },
                                {
                                    header: 'Estado',
                                    accessor: 'status',
                                    type: 'text',
                                    render: (value: string) => (
                                        <Badge color={value === 'alive' ? 'success' : 'dark'} className="fw-normal">
                                            {value === 'alive' ? 'Vivo' : 'Muerto'}
                                        </Badge>
                                    ),
                                },
                            ];

                            return (
                                <>
                                    {/* KPIs */}
                                    <Row className="g-3 mb-3">
                                        <Col md={6} lg>
                                            <StatKpiCard
                                                title="Total Lechones"
                                                value={totalCurrent}
                                                icon={<FaPiggyBank size={20} style={{ color: '#374151' }} />}
                                                animateValue={true}
                                                decimals={0}
                                            />
                                        </Col>
                                        <Col md={6} lg>
                                            <StatKpiCard
                                                title="Machos"
                                                value={litterDetails?.currentMale || 0}
                                                icon={<FaMars size={20} style={{ color: '#0ea5e9' }} />}
                                                animateValue={true}
                                                decimals={0}
                                            />
                                        </Col>
                                        <Col md={6} lg>
                                            <StatKpiCard
                                                title="Hembras"
                                                value={litterDetails?.currentFemale || 0}
                                                icon={<FaVenus size={20} style={{ color: '#ec4899' }} />}
                                                animateValue={true}
                                                decimals={0}
                                            />
                                        </Col>
                                        <Col md={6} lg>
                                            <StatKpiCard
                                                title="Peso Promedio"
                                                value={avgWeight}
                                                suffix="kg"
                                                icon={<RiScales3Line size={20} style={{ color: '#10b981' }} />}
                                                animateValue={true}
                                                decimals={2}
                                            />
                                        </Col>
                                        <Col md={6} lg>
                                            <StatKpiCard
                                                title="Peso Total"
                                                value={totalWeight}
                                                suffix="kg"
                                                icon={<RiCalculatorLine size={20} style={{ color: '#4F46E5' }} />}
                                                animateValue={true}
                                                decimals={2}
                                            />
                                        </Col>
                                    </Row>

                                    {/* Progreso de destete */}
                                    <Card className="border-0 shadow-sm mb-3">
                                        <CardBody>
                                            <WeaningProgress birthDate={litterDetails?.birthDate} litterStatus={litterDetails?.status} />
                                        </CardBody>
                                    </Card>

                                    {/* 3 cards lado a lado */}
                                    <Row className="g-3 align-items-stretch mb-3">
                                        <Col lg={4} className="d-flex flex-column">
                                            <Card className="shadow-sm flex-grow-1 m-0 h-100 border-0">
                                                <CardHeader className="bg-white">
                                                    <h5 className="mb-0 text-uppercase text-muted">Datos de la camada</h5>
                                                </CardHeader>
                                                <CardBody>
                                                    <ObjectDetails attributes={litterAttributes} object={litterDetails} />
                                                </CardBody>
                                            </Card>
                                        </Col>

                                        <Col lg={4} className="d-flex flex-column">
                                            <Card className="shadow-sm flex-grow-1 m-0 h-100 border-0">
                                                <CardHeader className="bg-white d-flex justify-content-between align-items-center">
                                                    <h5 className="mb-0 text-uppercase text-muted">Información de la madre</h5>
                                                    <Button className="fs-6 p-0" color="link" onClick={() => navigate(`/pigs/pig_details/${litterDetails?.mother?._id}`)}>
                                                        Todos los detalles ↗
                                                    </Button>
                                                </CardHeader>
                                                <CardBody>
                                                    <ObjectDetails attributes={motherAttributes} object={litterDetails.mother} />
                                                </CardBody>
                                            </Card>
                                        </Col>

                                        <Col lg={4} className="d-flex flex-column">
                                            <div className="d-flex flex-column flex-grow-1 h-100">
                                                <LitterEventsCard events={litterDetails?.events} />
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Tabla de lechones */}
                                    <Card className="shadow-sm m-0 border-0">
                                        <CardHeader className="bg-white">
                                            <h5 className="mb-0 fw-bold text-uppercase text-muted">
                                                <FaPiggyBank className="me-2 text-primary" />
                                                Lechones de la camada
                                            </h5>
                                        </CardHeader>
                                        <CardBody className="p-0">
                                            <CustomTable
                                                columns={pigletColumns}
                                                data={piglets}
                                                showSearchAndFilter={false}
                                                rowsPerPage={10}
                                                showPagination
                                            />
                                        </CardBody>
                                    </Card>
                                </>
                            );
                        })()}
                    </TabPane>

                    <TabPane tabId="2">
                        <LitterMedicalDetails litterId={litter_id ?? ''} />
                    </TabPane>

                    <TabPane tabId="3">
                        <LitterFeedingDetails litterId={litter_id ?? ""} />
                    </TabPane>
                </TabContent>
            </Container>

            <Modal size="xl" isOpen={modals.weanLitter} toggle={() => toggleModal("weanLitter")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("weanLitter")}>Destetar camada </ModalHeader>
                <ModalBody>
                    <WeanLitterForm litterId={litter_id ?? ''} onSave={() => { toggleModal('weanLitter'); fetchData(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.discardPiglets} toggle={() => toggleModal("discardPiglets")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("discardPiglets")}>Descartar lechones</ModalHeader>
                <ModalBody>
                    <DiscardPigletsForm
                        litterId={litter_id ?? ''}
                        piglets={litterDetails?.piglets ?? []}
                        onSave={() => { toggleModal('discardPiglets'); fetchData(); }}
                    />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default LitterDetails;