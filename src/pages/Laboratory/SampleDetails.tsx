import { ConfigContext } from "App";
import { HttpStatusCode } from "axios";
import { Column } from "common/data/data_types";
import { Attribute } from "common/data_interfaces";
import AlertMessage from "Components/Common/AlertMesagge";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import ExtractionDetails from "Components/Common/ExtractionDetails";
import LoadingAnimation from "Components/Common/LoadingAnimation";
import ObjectDetails from "Components/Common/ObjectDetails";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalFooter, ModalHeader, Row, UncontrolledTooltip } from "reactstrap";
import SimpleBar from "simplebar-react";

const SampleDetails = () => {
    document.title = 'Detalles de genetica liquida | System Management'
    const { sample_id } = useParams();
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLoggged = getLoggedinUser();
    const [loading, setLoading] = useState(true);
    const [alerConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [sampleDetails, setSampleDetails] = useState<any>({});
    const [extractionDetails, setExtractionDetails] = useState<any>({});
    const [technicianDetails, setTecnicianDetails] = useState<any>({});
    const [dosesDetails, setDosesDetails] = useState<any[]>([]);
    const [discardDetails, setDiscardDetails] = useState<{ userId: string, discardResponsible: string, discardDate: string, discardReason: string }>()
    const [modals, setModals] = useState({ extractionDetails: false, discardDose: false });
    const [selectedDose, setSelectedDose] = useState<any>({});

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const sampleAttributes: Attribute[] = [
        {
            key: 'lot_status',
            label: 'Estado',
            type: 'text',
            render: (_, obj) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (obj.lot_status) {
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
        { key: 'expiration_date', label: 'Fecha de expiración', type: 'date' },
        { key: 'conservation_method', label: 'Metodo de conservacion', type: 'text' },
        { key: 'concentration_million', label: 'Concentración (millones)', type: 'text' },
        { key: 'motility_percent', label: 'Motilidad. (%)', type: 'text' },
        { key: 'vitality_percent', label: 'Vitalidad (%)', type: 'text' },
        { key: 'abnormal_percent', label: 'Anormalidad (%)', type: 'text' },
        { key: 'pH', label: 'P.H.', type: 'text' },
        { key: 'temperature', label: 'Temperatura', type: 'text' },
        {
            key: 'diluent',
            label: 'Diluyente',
            type: 'text',
            render: (_, obj) => obj.diluent.type + " - " + obj.diluent.lot + " - " + obj.diluent.volume + " " + obj.diluent.unit_measurement || "Sin diluyente"
        },
    ]

    const DiscardAttributes: Attribute[] = [
        {
            key: "discardResponsible",
            label: "Descartado por",
            type: "text",
            render: (value: any, obj: any) => (
                <div className="d-flex gap-1">
                    <Button className="p-0 fs-5 text-underline" color="link" onClick={() => navigate(`/users/user_details/${obj.userId}`)}>
                        {obj.discardResponsible} ↗
                    </Button>
                </div>
            ),
        },
        { key: "discardReason", label: "Razon de descarte", type: "text" },
        { key: "discardDate", label: "Fecha de descarte", type: "date" },
    ];


    const ExtractionAttributes: Attribute[] = [
        {
            key: "batch",
            label: "Lote",
            type: "text",
            render: (value: any, obj: any) => (
                <div className="d-flex gap-1">
                    <Button className="p-0 fs-5" color="link" onClick={() => toggleModal('extractionDetails')}>
                        {obj.batch} ↗
                    </Button>
                </div>
            ),
        },
        { key: "date", label: "Fecha de extracción", type: "date" },
        { key: "volume", label: "Volumen", type: "text" },
        { key: "unit_measurement", label: "Unidad de medida", type: "text" },
        { key: "extraction_location", label: "Ubicación", type: "text" },
        { key: "appearance", label: "Apariencia", type: "text" },
        { key: "notes", label: "Notas", type: "text" },
    ];

    const dosesColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        {
            header: 'Semen',
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.semen_volume} ${row.unit_measurement}` || 0
        },
        {
            header: 'Diluyente',
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.diluent_volume} ${row.unit_measurement}` || 0
        },
        {
            header: 'V. total',
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.total_volume} ${row.unit_measurement}` || 0
        },
        {
            header: 'Estado',
            accessor: 'status',
            type: 'text',
            isFilterable: false,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.status) {
                    case "available":
                        color = "success";
                        text = "Disponible";
                        break;
                    case "used":
                        color = "warning";
                        text = "Usada";
                        break;
                    case "expired":
                        color = "danger";
                        text = "Expirado";
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
                <Button className="p-0" color="link" onClick={() => { setSelectedDose(row); toggleModal('discardDose') }} disabled={row.status === "available" ? false : true}>
                    Descartar
                </Button>
            ),
        },
    ]

    const discardDose = async () => {
        if (!configContext) return;
        try {
            const discardResponse = await configContext.axiosHelper.update(`${configContext.apiUrl}/semen_sample/discard_dose`, {
                sampleId: sampleDetails._id,
                doseId: selectedDose._id
            })

            if (discardResponse.status === HttpStatusCode.Ok) {
                toggleModal('discardDose')
                setAlertConfig({ visible: true, color: 'success', message: `Dosis ${selectedDose.code} descartada con éxito` })
                fetchData();
            }
        } catch (error) {
            console.error(`Error discarding the dose: ${selectedDose.code}:`, error)
            toggleModal('discardDose')
            setAlertConfig({ visible: true, color: 'danger', message: `Ha ocurrido un error la descartar la dosis: ${selectedDose.code}, intentelo mas tarde` })
        }
    }

    const fetchData = async () => {
        if (!configContext || !userLoggged || !sample_id) return;
        try {
            const axiosResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/semen_sample/find_by_id/${sample_id}`);
            const sampleData = axiosResponse.data.data;
            setSampleDetails(sampleData);
            setDosesDetails(sampleData.doses)

            const [extractionResponse, technicianResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/find_by_id/${sampleData.extraction_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_mongo_id/${sampleData.technician}`),
            ]);

            if (sampleData.lot_status === 'discarded') {
                const discardResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_mongo_id/${sampleData.discarded_by}`)

                const discardData = discardResponse.data.data

                const discardInfo = {
                    userId: discardData._id,
                    discardResponsible: discardData.name + " " + discardData.lastname,
                    discardDate: sampleData.discard_date,
                    discardReason: sampleData.discard_reason
                }

                setDiscardDetails(discardInfo)
            }

            setExtractionDetails(extractionResponse.data.data);
            setTecnicianDetails(technicianResponse.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false);
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
                <BreadCrumb title={"Detalles de lote"} pageTitle={"Genetica liquida"} />

                <div className="mb-4">
                    <Button onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-3"></i>
                        Regresar
                    </Button>
                </div>

                {technicianDetails && (
                    <Card className="mb-4 shadow-sm">
                        <CardBody className="d-flex justify-content-between align-items-center">
                            <span className="text-black fs-5">
                                <strong>Responsable: </strong>
                                <Button className="p-0 fs-5" color="link" onClick={() => navigate(`/users/user_details/${technicianDetails._id}`)}>
                                    {technicianDetails.name} {technicianDetails.lastname} ↗
                                </Button>
                            </span>
                        </CardBody>
                    </Card>
                )}

                <Row className="align-items-stretch">
                    <Col lg={3}>
                        {sampleDetails && (
                            <Card className="shadow-md h-100">
                                <CardHeader className="d-flex justify-content-between align-items-center" style={{ backgroundColor: 'lightsteelblue' }}>
                                    <h5>Informacion del lote</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={sampleAttributes} object={sampleDetails} />
                                </CardBody>
                            </Card>
                        )}
                    </Col>

                    <Col lg={3}>
                        {sampleDetails.lot_status === 'discarded' && (
                            <Card className="shadow-md m-0 mb-3">
                                <CardHeader className="d-flex justify-content-between align-items-center" style={{ backgroundColor: 'lightsteelblue' }}>
                                    <h5>Informacion de descarte</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={DiscardAttributes} object={discardDetails || {}} />
                                </CardBody>
                            </Card>
                        )}

                        {extractionDetails && (
                            <Card className={`shadow-md m-0 ${sampleDetails.lot_status === "discarded" ? "" : "h-100"}`}>
                                <CardHeader className="d-flex justify-content-between align-items-center" style={{ backgroundColor: 'lightsteelblue' }}>
                                    <h5>Informacion de extracción</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={ExtractionAttributes} object={extractionDetails} />
                                </CardBody>
                            </Card>
                        )}
                    </Col>

                    <Col lg={6}>
                        {dosesDetails && (
                            <Card className="shadow-md h-100">
                                <CardHeader className="d-flex justify-content-between align-items-center" style={{ backgroundColor: 'lightsteelblue' }}>
                                    <h5>Informacion de dosis</h5>
                                </CardHeader>
                                <CardBody>
                                    <CustomTable columns={dosesColumns} data={dosesDetails} showPagination={true} showSearchAndFilter={true} rowsPerPage={8} />
                                </CardBody>
                            </Card>
                        )}
                    </Col>
                </Row>
            </Container>

            <Modal size="xl" isOpen={modals.extractionDetails} toggle={() => toggleModal("extractionDetails")} centered>
                <ModalHeader toggle={() => toggleModal("extractionDetails")}>Detalles de extraccion</ModalHeader>
                <ModalBody>
                    <ExtractionDetails extractionId={extractionDetails._id} />
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.discardDose} toggle={() => toggleModal("discardDose")} centered>
                <ModalHeader toggle={() => toggleModal("discardDose")}> Descartar dosis </ModalHeader>
                <ModalBody>
                    <div className="d-flex flex-column align-items-center text-center gap-3">
                        <FiAlertCircle size={50} color="#dc3545" />
                        <div>
                            <p className="mb-1 fs-5">
                                ¿Desea descartar la dosis <strong>{selectedDose.code}</strong>?
                            </p>
                            <p className="text-muted fs-6">
                                Esta dosis ya no podrá ser utilizada.
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className="d-flex gap-2 mt-3">
                        <Button color="secondary" onClick={() => toggleModal("discardDose")}>
                            Cancelar
                        </Button>
                        <Button color="danger" onClick={() => discardDose()}>
                            Confirmar
                        </Button>
                    </div>
                </ModalFooter>
            </Modal>

            {alerConfig.visible && (
                <AlertMessage color={alerConfig.color} message={alerConfig.message} visible={alerConfig.visible} onClose={() => setAlertConfig({ ...alerConfig, visible: false })} />
            )}
        </div>
    )
}

export default SampleDetails;