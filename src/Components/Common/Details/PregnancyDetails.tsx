import { ConfigContext } from "App";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Progress } from "reactstrap";
import pigSilhouette from '../../assets/images/pig_silhouette.png'
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import AbortionForm from "../Forms/AbortionForm";
import BirthForm from "../Forms/BirthForm";

interface PregnancyDetailsProps {
    pregnancyId: string;
}

const PregnancyDetails: React.FC<PregnancyDetailsProps> = ({ pregnancyId, }) => {
    document.title = "Detalles de embarazo | Management System"
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [pregnancyDetails, setPregnancyDetails] = useState<any>({});
    const [sowDetails, setSowDetails] = useState<any>({})
    const [inseminationDetails, setInseminationDetails] = useState<any>({})
    const [loading, setLoaging] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const navigate = useNavigate();
    const [modals, setModals] = useState({ abortion: false, birth: false });
    const [allPregnancyData, setAllPregnancyData] = useState<any>({})

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const getFarrowingStatusConfig = (status: string) => {
        switch (status) {
            case "pregnant":
                return { color: "success", text: "Gestando" };
            case "close_to_farrow":
                return { color: "warning", text: "Próxima a parir" };
            case "farrowing_pending":
                return { color: "info", text: "Parto pendiente" };
            case "overdue_farrowing":
                return { color: "danger", text: "Parto atrasado" };
            case "farrowed":
                return { color: "dark", text: "Parida" };
            case "abortion":
                return { color: "dark", text: "Aborto" };
            default:
                return { color: "secondary", text: "Desconocido" };
        }
    };

    const sowAttributes: Attribute[] = [
        { key: "code", label: "Código", type: "text" },
        { key: "birthdate", label: "Fecha de nacimiento", type: "date" },
        { key: "breed", label: "Raza", type: "text" },
        { key: "origin", label: "Origen", type: "text" },
        { key: "weight", label: "Peso actual", type: "text" },
        {
            key: "status",
            label: "Estado",
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'vivo':
                        color = 'success';
                        label = 'Vivo';
                        break;
                    case 'descartado':
                        color = 'warning';
                        label = 'Descartado';
                        break;
                    case 'muerto':
                        color = 'danger';
                        label = 'Muerto';
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "observations", label: "Observaciones", type: "text" },
    ]

    const inseminationAttributes: Attribute[] = [
        { key: 'date', label: 'F. inseminación', type: 'date' },
        { key: 'notes', label: 'Notas', type: 'text' },
        {
            key: 'estimated_farrowing_date',
            label: 'Parto est.',
            type: 'date',
            render: (_: any, obj: any) => {
                const baseDate = new Date(obj.date);
                const estimated = new Date(baseDate.getTime() + 115 * 24 * 60 * 60 * 1000);
                return estimated.toLocaleDateString();
            }
        },
        {
            key: "result",
            label: "Resultado",
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'pregnant':
                        color = 'success';
                        label = 'Embarazada';
                        break;
                    case 'doubtful':
                        color = 'warning';
                        label = 'Dudosa';
                        break;
                    case 'empty':
                        color = 'danger';
                        label = 'Vacia';
                        break;
                    case 'resorption':
                        color = 'warning';
                        label = 'Reabsorsión';
                        break;
                    case 'abortion':
                        color = 'danger';
                        label = 'Aborto';
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'doses',
            label: 'Dosis aplicadas',
            type: 'text',
            render: (_: any, obj: any) => <span className="text-black">{inseminationDetails.doses.length}</span>
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged || !pregnancyId) return
        try {
            const pregnancyResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pregnancies/find_by_id/${pregnancyId}`)
            const pregnancyData = pregnancyResponse.data.data;
            setAllPregnancyData(pregnancyData)
            setSowDetails(pregnancyData.sow)
            setInseminationDetails(pregnancyData.insemination)

            const { sow, insemination, ...restPregnancy } = pregnancyData
            setPregnancyDetails(restPregnancy)
        } catch (error) {
            console.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoaging(false)
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
        <div className="">
            <Card className="shadow-sm h-100">
                <CardHeader className="d-flex bg-light fs-5">
                    <h5>Progreso del embarazo</h5>

                    <div className="ms-auto">
                        {pregnancyDetails.farrowing_status !== 'farrowed' && pregnancyDetails.farrowing_status !== 'abortion' && (
                            <Button className="me-2" color="danger" onClick={() => toggleModal('abortion')}>
                                <i className="bx bxs-skull me-2 align-middle fs-5" />
                                Registrar perdida
                            </Button>
                        )}

                        <Button className="ms-auto" onClick={() => toggleModal('birth')} disabled={pregnancyDetails.farrowing_status === 'farrowed' || pregnancyDetails.farrowing_status === 'pregnant' || pregnancyDetails.farrowing_status === 'abortion'}>
                            <i className="bx bx-dna align-middle me-2 fs-5" />
                            Registrar parto
                        </Button>
                    </div>


                </CardHeader>
                <CardBody>
                    <div className="d-flex flex-column justify-content-between align-items-center h-100">
                        {/* <img src={pigSilhouette} height="200px" alt="Pig silhouette" className="mb-4" /> */}

                        {pregnancyDetails.start_date && (
                            <div className="w-100">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="fs-5 text-black">
                                        Inseminación:{" "}
                                        {new Date(pregnancyDetails.start_date).toLocaleDateString()}
                                    </span>

                                    <Badge
                                        className="fs-5"
                                        color={getFarrowingStatusConfig(pregnancyDetails.farrowing_status).color}
                                        pill
                                    >
                                        {getFarrowingStatusConfig(pregnancyDetails.farrowing_status).text}
                                    </Badge>

                                    <span className="fs-5 text-black">
                                        Parto estimado:{" "}
                                        {pregnancyDetails.estimated_farrowing_date === null ? (
                                            <>
                                                <span className="text-black">N/A</span>
                                            </>
                                        ) : (
                                            <>
                                                {new Date(pregnancyDetails.estimated_farrowing_date).toLocaleDateString()}
                                            </>
                                        )}
                                    </span>
                                </div>

                                <Progress
                                    value={(() => {
                                        const status = pregnancyDetails.farrowing_status;

                                        if (status === "abortion" || status === "farrowed") return 100;

                                        const start = new Date(pregnancyDetails.start_date);
                                        const end = new Date(pregnancyDetails.estimated_farrowing_date);
                                        const today = new Date();

                                        const totalMs = end.getTime() - start.getTime();
                                        const elapsedMs = today.getTime() - start.getTime();

                                        let percent = (elapsedMs / totalMs) * 100;
                                        if (percent < 0) percent = 0;
                                        if (percent > 100) percent = 100;

                                        return percent;
                                    })()}
                                    color={(() => {
                                        const status = pregnancyDetails.farrowing_status;
                                        if (status === "abortion" || status === "farrowed") return "dark";
                                        return getFarrowingStatusConfig(status).color;
                                    })()}
                                    className="animated-progess progress-xl"
                                />
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            <div className="d-flex gap-3 w-100 h-50">
                <Card className="w-100" >
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                        <span className="text-black fs-5">Cerda inseminada</span>
                        <Button color='link' onClick={() => navigate(`/pigs/pig_details/${inseminationDetails.sow}`)}>
                            Toda la informacion ↗
                        </Button>
                    </CardHeader>
                    <CardBody className="flex-fill">
                        <ObjectDetails attributes={sowAttributes} object={sowDetails} />
                    </CardBody>
                </Card>

                <Card className="w-100" >
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                        <span className="text-black fs-5">Inseminación</span>
                        <Button color='link' onClick={() => navigate(`/gestation/insemination_details/${inseminationDetails._id}`)}>
                            Toda la informacion ↗
                        </Button>
                    </CardHeader>
                    <CardBody className="flex-fill">
                        <ObjectDetails attributes={inseminationAttributes} object={inseminationDetails} />
                    </CardBody>
                </Card>
            </div>

            <Modal size="lg" isOpen={modals.abortion} toggle={() => toggleModal("abortion")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("abortion")}>Registrar perdida</ModalHeader>
                <ModalBody>
                    <AbortionForm pregnancy={{ _id: pregnancyId }} onSave={() => { toggleModal('abortion'); fetchData() }} onCancel={function (): void {
                        throw new Error("Function not implemented.");
                    }} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.birth} toggle={() => toggleModal("birth")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("birth")}>Registrar perdida</ModalHeader>
                <ModalBody>
                    <BirthForm pregnancy={allPregnancyData} onSave={() => { toggleModal('birth'); fetchData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>


        </div>
    )
}

export default PregnancyDetails;