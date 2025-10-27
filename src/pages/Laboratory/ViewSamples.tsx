import { ConfigContext } from "App";
import { SemenSample } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import ExtractionForm from "Components/Common/ExtractionForm";
import SemenSampleForm from "Components/Common/SemenSampleForm";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiInbox } from "react-icons/fi";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap";
import { Column } from "common/data/data_types";
import DiscardSampleForm from "Components/Common/DiscardSampleForm";
import PigDetailsModal from "Components/Common/DetailsPigModal";
import { useNavigate } from "react-router-dom";
import LoadingAnimation from "Components/Common/LoadingAnimation";
import KPI from "Components/Common/Graphics/Kpi";
import { IconBaseProps } from "react-icons";

const ViewSamples = () => {
    document.title = 'Ver génetica liquida | Management System'
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
    const navigate = useNavigate();

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
                    <Button id={`discard-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={() => openDiscardModal(row)} disabled={row.lot_status === 'discarded' || row.lot_status === 'expired' || row.lot_status === 'out_of_stock'}>
                        <i className="ri-forbid-line align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`discard-button-${row._id}`}>
                        Descartar lote
                    </UncontrolledTooltip>

                    <Button id={`details-button-${row._id}`} className="farm-primary-button btn-icon" onClick={() => navigate(`/laboratory/samples/sample_details/${row._id}`)}>
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
            console.error('Error fetching the data: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
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
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Lotes"} pageTitle={"Génetica liquida"} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI
                        title="Lotes totales"
                        value={samples.length}
                        icon={FiCheckCircle}
                        bgColor="#e6f7e6"
                        iconColor="#28a745"
                    />

                    <KPI
                        title="Próximos a expirar"
                        value={samples.filter(s => s.lot_status === "near_expiration").length}
                        icon={FiAlertCircle}
                        bgColor="#fff4e6"
                        iconColor="#fd7e14"
                    />

                    <KPI
                        title="Disponibles"
                        value={samples.filter(s => s.lot_status === "available").length}
                        icon={FiCheckCircle}
                        bgColor="#e6f0ff"
                        iconColor="#0d6efd"
                    />

                    <KPI
                        title="Expirados"
                        value={samples.filter(s => s.lot_status === "expired").length}
                        icon={FiXCircle}
                        bgColor="#ffe6e6"
                        iconColor="#dc3545"
                    />

                    <KPI
                        title="Descartados"
                        value={samples.filter(s => s.lot_status === "discarded").length}
                        icon={FiXCircle}
                        bgColor="#f0f0f0"
                        iconColor="#6c757d"
                    />
                </div>

                <Card style={{ height: '65vh' }}>
                    <CardHeader className="d-flex">
                        <h4>Génetica líquida</h4>
                        <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                            <i className="ri-add-line me-2" />
                            Agregar muestra
                        </Button>
                    </CardHeader>

                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {filteredSamples && filteredSamples.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <CustomTable
                                    columns={samplesColumns}
                                    data={filteredSamples}
                                    showPagination={true}
                                    rowsPerPage={7}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#888", }}>
                                <div>
                                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                                    <div>No hay muestras disponibles</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nueva muestra</ModalHeader>
                <ModalBody>
                    <SemenSampleForm onSave={() => onSaveSample()} onCancel={() => { }} />
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
                    <DiscardSampleForm sample={selectedSample} onSave={() => onDiscardedSample()} onCancel={() => {}}/>
                </ModalBody>
            </Modal>
        </div>
    )
}

export default ViewSamples