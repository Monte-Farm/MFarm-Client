import { ConfigContext } from "App";
import { SemenSample } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import ExtractionForm from "Components/Common/ExtractionForm";
import SemenSampleForm from "Components/Common/SemenSampleForm";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import DiscardSampleForm from "Components/Common/DiscardSampleForm";
import PigDetailsModal from "Components/Common/DetailsPigModal";

const ViewSamples = () => {
    document.title = 'Ver muestras de semen | Management System'
    const userLoggged = getLoggedinUser();
    const configContext = useContext(ConfigContext)
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, discard: false, pigDetails: false });
    const [samples, setSamples] = useState<SemenSample[]>([])
    const [selectedSample, setSelectedSample] = useState({})
    const [filteredSamples, setFilteredSamples] = useState<SemenSample[]>([]);
    const [activeKpi, setActiveKpi] = useState<string | null>(null);
    const [selectedPig, setSelectedPig] = useState<any>({})

    const samplesColumns: Column<any>[] = [
        {
            header: 'Lote',
            accessor: 'extraction_id',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.extraction_id.batch || "Sin lote"
        },
        {
            header: 'Verraco',
            accessor: 'boar',
            render: (_, row) => (
                <Button
                    className="text-underline fs-5"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        openPigDetailsModal(row)
                    }}
                >
                    {row.extraction_id?.boar?.code} ↗
                </Button>
            )
        },
        {
            header: 'Dosis totales',
            accessor: 'total_doses',
            type: 'number',
            isFilterable: true,
        },
        {
            header: 'Dosis disponibles',
            accessor: 'available_doses',
            type: 'number',
            isFilterable: true,
        },
        {
            header: 'Volumen de dosis',
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${Number(row.extraction_id.volume / row.doses.length).toFixed(2)} ${row.extraction_id.unit_measurement}` || 0
        },
        { header: 'Fecha de expiracion', accessor: 'expiration_date', type: 'date', isFilterable: false },
        { header: 'Método de conservación', accessor: 'conservation_method', type: 'text', isFilterable: true },
        {
            header: 'Responsable',
            accessor: 'technician',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.technician ? `${row.technician.name} ${row.technician.lastname}` : "Sin responsable"
        },
        {
            header: "Estado del lote",
            accessor: "lot_status",
            type: "text",
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.lot_status) {
                    case "available":
                        color = "success";
                        text = "Disponible";
                        break;
                    case "near_expiration":
                        color = "warning";
                        text = "A punto de expirar";
                        break;
                    case "expired":
                        color = "dark";
                        text = "Expirado";
                        break;
                    case "out_of_stock":
                        color = "dark";
                        text = "Sin dosis";
                        break;
                    case "discarded":
                        color = "dark";
                        text = "Descartado";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`discard-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={() => openDiscardModal(row)}>
                        <i className="ri-forbid-line align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`discard-button-${row._id}`}>
                        Descartar lote
                    </UncontrolledTooltip>

                    <Button id={`details-button-${row._id}`} className="farm-primary-button btn-icon">
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`details-button-${row._id}`}>
                        Ver detalles
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const openPigDetailsModal = (data: any) => {
        setSelectedPig(data.extraction_id?.boar?._id);
        toggleModal('pigDetails')
    }

    const openDiscardModal = (row: any) => {
        setSelectedSample(row);
        toggleModal('discard');
    };

    const onDiscardedSample = () => {
        toggleModal('discard')
        fetchSemenSamples();
    }

    const fetchSemenSamples = async () => {
        if (!configContext || !userLoggged) return
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/semen_sample/find_by_farm/${userLoggged.farm_assigned}`)
            setSamples(response.data.data)
            setFilteredSamples(response.data.data)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos, intentelo mas tarde')
        } finally {
            setLoading(false)
        }
    }

    const onSaveSample = () => {
        toggleModal('create')
        fetchSemenSamples()
    }

    useEffect(() => {
        fetchSemenSamples();
    }, [])

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Lotes"} pageTitle={"Génetica liquida"} />

                <div className="d-flex gap-3 flex-wrap">
                    <Card
                        className={`flex-fill text-center shadow-sm ${activeKpi === 'all' ? 'border-primary border-1' : ''}`}
                        onClick={() => { setActiveKpi('all'); setFilteredSamples(samples); }}
                    >
                        <CardBody>
                            <h5 className="text-muted">Total lotes</h5>
                            <h2 className="fw-bold">{samples.length}</h2>
                        </CardBody>
                    </Card>

                    <Card
                        className={`flex-fill text-center shadow-sm ${activeKpi === 'near_expiration' ? 'border-warning border-1' : ''}`}
                        onClick={() => {
                            setActiveKpi('near_expiration');
                            setFilteredSamples(samples.filter(s => s.lot_status === "near_expiration"));
                        }}
                    >
                        <CardBody>
                            <h5 className="text-muted">Próximos a expirar</h5>
                            <h2 className="fw-bold text-warning">
                                {samples.filter(s => s.lot_status === "near_expiration").length}
                            </h2>
                        </CardBody>
                    </Card>

                    <Card
                        className={`flex-fill text-center shadow-sm ${activeKpi === 'available' ? 'border-success border-1' : ''}`}
                        onClick={() => {
                            setActiveKpi('available');
                            setFilteredSamples(samples.filter(s => s.lot_status === "available"));
                        }}
                    >
                        <CardBody>
                            <h5 className="text-muted">Disponibles</h5>
                            <h2 className="fw-bold text-success">
                                {samples.filter(s => s.lot_status === "available").length}
                            </h2>
                        </CardBody>
                    </Card>

                    <Card
                        className={`flex-fill text-center shadow-sm ${activeKpi === 'expired' ? 'border-dark border-1' : ''}`}
                        onClick={() => {
                            setActiveKpi('expired');
                            setFilteredSamples(samples.filter(s => s.lot_status === "expired"));
                        }}
                    >
                        <CardBody>
                            <h5 className="text-muted">Expirados</h5>
                            <h2 className="fw-bold text-dark">
                                {samples.filter(s => s.lot_status === "expired").length}
                            </h2>
                        </CardBody>
                    </Card>

                    <Card
                        className={`flex-fill text-center shadow-sm ${activeKpi === 'discarded' ? 'border-secondary border-1' : ''}`}
                        onClick={() => {
                            setActiveKpi('discarded');
                            setFilteredSamples(samples.filter(s => s.lot_status === "discarded"));
                        }}
                    >
                        <CardBody>
                            <h5 className="text-muted">Descartados</h5>
                            <h2 className="fw-bold text-secondary">
                                {samples.filter(s => s.lot_status === "discarded").length}
                            </h2>
                        </CardBody>
                    </Card>
                </div>

                <Card style={{ height: '82vh' }}>
                    <CardHeader className="d-flex">
                        <h4>Génetica líquida</h4>
                        <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                            <i className="ri-add-line me-2" />
                            Agregar muestra
                        </Button>
                    </CardHeader>

                    <CardBody>
                        <CustomTable columns={samplesColumns} data={filteredSamples} showPagination={false} />
                    </CardBody>
                </Card>

            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nueva muestra</ModalHeader>
                <ModalBody>
                    <SemenSampleForm onSave={() => onSaveSample()} onCancel={function (): void {
                        throw new Error("Function not implemented.");
                    }} />
                </ModalBody>
            </Modal>

            {alertConfig.visible && (
                <Alert
                    color={alertConfig.color}
                    className="position-fixed bottom-0 start-50 translate-middle-x d-flex align-items-center gap-2 shadow rounded-3 p-3"
                    style={{ minWidth: "350px", maxWidth: "90%", zIndex: 1050 }}
                >
                    {alertConfig.color === "success" && <FiCheckCircle size={22} />}
                    {alertConfig.color === "danger" && <FiXCircle size={22} />}
                    {alertConfig.color === "warning" && <FiAlertCircle size={22} />}
                    {alertConfig.color === "info" && <FiInfo size={22} />}

                    <span className="flex-grow-1 text-black">{alertConfig.message}</span>

                    <Button close onClick={() => setAlertConfig({ ...alertConfig, visible: false })} />
                </Alert>
            )}

            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>Detalles del verraco</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedPig} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.discard} toggle={() => toggleModal("discard")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("discard")}>Descartar lote</ModalHeader>
                <ModalBody>
                    <DiscardSampleForm sample={selectedSample} onSave={() => onDiscardedSample()} onCancel={function (): void {
                        throw new Error("Function not implemented.");
                    }} />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default ViewSamples