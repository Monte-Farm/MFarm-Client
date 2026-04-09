import { ConfigContext } from "App";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import LitterMedicalDetails from "Components/Common/Details/LitterMedicalDetails";
import LitterEventsCard from "Components/Common/Shared/LitterEventsCard";
import WeanLitterForm from "Components/Common/Forms/WeanLitterForm";
import DiscardPigletsForm from "Components/Common/Forms/DiscardPigletsForm";
import WeaningProgress from "Components/Common/Shared/WeaningProgress";
import LitterFeedingDetails from "Components/Common/Details/LitterFeedingDetails";
import SimpleBar from "simplebar-react";

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
                        <div className="w-100 mb-3">
                            <WeaningProgress birthDate={litterDetails?.birthDate} litterStatus={litterDetails?.status} />
                        </div>


                        <div className="row g-3">
                            <div className="col-12 col-lg-4 d-flex flex-column">
                                <Card className="flex-fill">
                                    <CardHeader className="bg-white border-bottom d-flex justify-content-between">
                                        <h5 className="mb-0 text-dark fw-semibold">Datos de la camada</h5>

                                        <Button color="success" onClick={() => toggleModal('weanLitter')} disabled={litterDetails.status === 'weaned' || litterDetails.status === 'active'}>
                                            <i className="mdi mdi-baby-bottle-outline me-2" />
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
                                    <CardHeader className="bg-white border-bottom d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0 text-dark fw-semibold">Lechones</h5>
                                        <Button color="danger" size="sm" onClick={() => toggleModal('discardPiglets')} disabled={litterDetails.status === 'weaned'}>
                                            <i className="ri-close-circle-line me-1" />
                                            Descartar lechones
                                        </Button>
                                    </CardHeader>
                                    <CardBody className="p-3">
                                        {/* Estadísticas de lechones */}
                                        <div className="row g-2 mb-3">
                                            <div className="col-6">
                                                <div className="border rounded p-2 text-center bg-light">
                                                    <div className="d-flex align-items-center justify-content-center mb-1">
                                                        <i className="ri-men-line fs-5 text-info me-1"></i>
                                                        <span className="text-muted fw-semibold">Machos</span>
                                                    </div>
                                                    <h4 className="mb-0 text-info fw-bold">{litterDetails?.currentMale}</h4>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="border rounded p-2 text-center bg-light">
                                                    <div className="d-flex align-items-center justify-content-center mb-1">
                                                        <i className="ri-women-line fs-5 text-danger me-1"></i>
                                                        <span className="text-muted fw-semibold">Hembras</span>
                                                    </div>
                                                    <h4 className="mb-0 text-danger fw-bold">{litterDetails?.currentFemale}</h4>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-2 mb-3">
                                            <div className="col-6">
                                                <div className="border rounded p-2 text-center">
                                                    <div className="d-flex align-items-center justify-content-center mb-1">
                                                        <i className="ri-scales-3-line fs-5 text-success me-1"></i>
                                                        <span className="text-muted fw-semibold">Peso Promedio</span>
                                                    </div>
                                                    <h4 className="mb-0 text-success fw-bold">
                                                        {litterDetails?.piglets?.length > 0
                                                            ? (litterDetails?.piglets?.reduce((acc: number, p: any) => acc + Number(p.weight), 0) / litterDetails?.piglets?.length).toFixed(2)
                                                            : '0.00'
                                                        } kg
                                                    </h4>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="border rounded p-2 text-center">
                                                    <div className="d-flex align-items-center justify-content-center mb-1">
                                                        <i className="ri-calculator-line fs-5 text-primary me-1"></i>
                                                        <span className="text-muted fw-semibold">Peso Total</span>
                                                    </div>
                                                    <h4 className="mb-0 text-primary fw-bold">
                                                        {litterDetails?.piglets?.reduce((acc: number, p: any) => acc + Number(p.weight), 0).toFixed(2)} kg
                                                    </h4>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tabla detallada con scroll */}
                                        <div className="text-muted fw-semibold mb-2">Detalles de lechones:</div>

                                        <SimpleBar style={{ maxHeight: '400px' }}>
                                            <table className="table table-hover table-sm">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="text-center">#</th>
                                                        <th className="text-center">Sexo</th>
                                                        <th className="text-center">Peso</th>
                                                        <th className="text-center">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {litterDetails?.piglets?.map((piglet: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="text-center">{index + 1}</td>
                                                            <td className="text-center">
                                                                <Badge color={piglet.sex === 'male' ? "info" : "danger"}>
                                                                    {piglet.sex === 'male' ? "♂" : "♀"}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-center">{Number(piglet.weight).toFixed(2)}kg</td>
                                                            <td className="text-center">
                                                                <Badge color={piglet.status === 'alive' ? "success" : "danger"}>
                                                                    {piglet.status === 'alive' ? "Vivo" : "Muerto"}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </SimpleBar>
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