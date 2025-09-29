import AlertMessage from "Components/Common/AlertMesagge";
import { ConfigContext } from "App";
import LoadingAnimation from "Components/Common/LoadingAnimation";
import BreadCrumb from "Components/Common/BreadCrumb";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalHeader, Row } from "reactstrap";
import ObjectDetails from "Components/Common/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import { FiAlertCircle, FiXCircle } from "react-icons/fi";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import DiagnosisForm from "Components/Common/DiagnoseForm";
import HeatForm from "Components/Common/HeatForm";

const InseminationDetails = () => {
    document.title = 'Detalles de inseminación | System Management'
    const { insemination_id } = useParams();
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [inseminationDetails, setInseminationDetails] = useState<any>({});
    const [sowDetails, setSowDetails] = useState<any>({})
    const [dosesDetails, setDosesDetails] = useState<any[]>([])
    const [modals, setModals] = useState({ heat: false, diagnosis: false, abortionDetails: false })
    const [abortionDetails, setAbortionDetails] = useState<any>({})

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
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
        {
            key: 'responsible',
            label: 'Responsable',
            type: 'text',
            render: (_, obj) => (
                <Button className="p-0 fs-5" color="link" onClick={() => navigate(`/users/user_details/${obj.responsible._id}`)}>
                    {obj.responsible.name} {obj.responsible.lastname} ↗
                </Button>
            )
        },
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
    ]

    const diagnoseAttributes: Attribute[] = [
        { key: 'diagnosis_date', label: 'F. diagnostico', type: 'date' },
        { key: 'diagnose_notes', label: 'Notas', type: 'text' },
        {
            key: 'diagnose_responsible',
            label: 'Responable',
            type: 'text',
            render: (_, obj) =>
                <Button className="p-0 fs-5" color="link" onClick={() => navigate(`/users/user_details/${obj.diagnose_responsible._id}`)}>
                    {obj.diagnose_responsible.name} {obj.diagnose_responsible.lastname} ↗
                </Button>
        },
    ]

    const abortionAttributes: Attribute[] = [
        { key: 'date', label: 'Fecha de aborto', type: 'date' },
        { key: 'probable_cause', label: 'Causa probable', type: 'text' },
        { key: 'notes', label: 'Notas', type: 'text' },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged || !insemination_id) return;
        try {
            const axiosResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/insemination/find_by_id/${insemination_id}`);
            const inseminationData = axiosResponse.data.data;
            setInseminationDetails(inseminationData);

            const [sowResponse, dosesResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${inseminationData.sow}`),
                configContext.axiosHelper.create(`${configContext.apiUrl}/semen_sample/enrich_insemination_doses`, { doses: inseminationData.doses }),
            ]);

            setSowDetails(sowResponse.data.data)
            setDosesDetails(dosesResponse.data.data)
            if (inseminationData.abortions.length > 0) {
                setAbortionDetails(inseminationData.abortions[0]);
            }
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
                <BreadCrumb title={"Detalles de inseminación"} pageTitle={"Inseminaciones"} />

                <Button className="mb-4" onClick={() => navigate(-1)}>
                    <i className="ri-arrow-left-line me-2" />
                    Regresar
                </Button>

                <div style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                    <Row className="h-100 g-3">
                        <Col lg={3} className="h-100 d-flex flex-column">
                            <div className="d-flex flex-column h-100 gap-3">
                                <Card className="m-0 flex-fill d-flex flex-column min-h-0"> {/* Added min-h-0 */}
                                    <CardHeader>
                                        <span className="fs-5 text-black">Estado</span>
                                    </CardHeader>
                                    <CardBody className="d-flex justify-content-center align-items-center">
                                        {(() => {
                                            switch (inseminationDetails.status) {
                                                case "active":
                                                    return (
                                                        <span className="bg-success text-white rounded-5 fs-5 px-3 py-1">
                                                            Activa
                                                        </span>
                                                    );
                                                case "completed":
                                                    return (
                                                        <span className="bg-primary text-white rounded-5 fs-5 px-3 py-1">
                                                            Completada
                                                        </span>
                                                    );
                                                case "failed":
                                                    return (
                                                        <span className="bg-danger text-white rounded-5 fs-5 px-3 py-1">
                                                            Fallida
                                                        </span>
                                                    );
                                                default:
                                                    return (
                                                        <span className="bg-secondary text-white rounded-5 fs-5 px-3 py-1">
                                                            Desconocido
                                                        </span>
                                                    );
                                            }
                                        })()}
                                    </CardBody>
                                </Card>

                                <Card className="m-0 flex-fill d-flex flex-column min-h-0"> {/* Added min-h-0 */}
                                    <CardHeader>
                                        <span className="text-black fs-5"> Informacion de inseminación</span>
                                    </CardHeader>
                                    <CardBody className="flex-fill">
                                        <ObjectDetails attributes={inseminationAttributes} object={inseminationDetails} />
                                    </CardBody>
                                </Card>

                                <Card className="m-0 flex-fill d-flex flex-column min-h-0" > {/* Added min-h-0 */}
                                    <CardHeader className="d-flex justify-content-between align-items-center">
                                        <span className="text-black fs-5">Cerda inseminada</span>
                                        <Button color='link' onClick={() => navigate(`/pigs/pig_details/${inseminationDetails.sow}`)}>
                                            Toda la informacion ↗
                                        </Button>
                                    </CardHeader>
                                    <CardBody className="flex-fill">
                                        <ObjectDetails attributes={sowAttributes} object={sowDetails} />
                                    </CardBody>
                                </Card>
                            </div>
                        </Col>

                        <Col lg={4} className="h-100 d-flex flex-column">
                            <div className="d-flex flex-column h-100 gap-3">
                                <Card className="m-0" style={{ flex: '0 0 auto' }}>
                                    <CardHeader className="d-flex justify-content-between">
                                        <span className="text-black fs-5">Resultado</span>

                                        {inseminationDetails && inseminationDetails.result === 'abortion' && (
                                            <Button className="p-0" color="link" onClick={() => toggleModal('abortionDetails')}>
                                                Detalles de aborto ↗
                                            </Button>
                                        )}

                                    </CardHeader>
                                    <CardBody className="d-flex justify-content-center align-items-center">
                                        {inseminationDetails.result === null ? (
                                            <>
                                                <FiAlertCircle className="text-muted" size={22} />
                                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                                    Esta inseminación aun no tiene resultado
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                {(() => {
                                                    switch (inseminationDetails.result) {
                                                        case "pregnant":
                                                            return (
                                                                <span className="bg-success text-white rounded-5 fs-5 px-3 py-1">
                                                                    Preñada
                                                                </span>
                                                            );
                                                        case "empty":
                                                            return (
                                                                <span className="bg-danger text-white rounded-5 fs-5 px-3 py-1">
                                                                    Vacia
                                                                </span>
                                                            );
                                                        case "doubtful":
                                                            return (
                                                                <span className="bg-warning text-white rounded-5 fs-5 px-3 py-1">
                                                                    Dudosa
                                                                </span>
                                                            );
                                                        case "resorption":
                                                            return (
                                                                <span className="bg-danger text-white rounded-5 fs-5 px-3 py-1">
                                                                    Reabsorción
                                                                </span>
                                                            );
                                                        case "abortion":
                                                            return (
                                                                <span className="bg-black text-white rounded-5 fs-5 px-3 py-1">
                                                                    Aborto
                                                                </span>
                                                            );
                                                        default:
                                                            return (
                                                                <span className="bg-secondary text-white rounded-5 fs-5 px-3 py-1">
                                                                    Desconocido
                                                                </span>
                                                            );
                                                    }
                                                })()}
                                            </>
                                        )}
                                    </CardBody>
                                </Card>

                                <Card className="m-0" style={{ flex: '0 0 auto' }}>
                                    <CardHeader className="d-flex justify-content-between">
                                        <span className="text-black fs-5">Diagnostico</span>

                                        <Button className="" size="sm" onClick={() => toggleModal('diagnosis')} disabled={inseminationDetails.status !== 'active'}>
                                            Diagnosticar
                                        </Button>
                                    </CardHeader>
                                    <CardBody className={!inseminationDetails.diagnosis_date ? 'justify-content-center align-items-center d-flex' : ''}>
                                        {!inseminationDetails.diagnosis_date ? (
                                            <div className="">
                                                <FiAlertCircle className="text-muted" size={22} />
                                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                                    Esta inseminación aun no tiene dianostico
                                                </span>
                                            </div>
                                        ) : (
                                            <ObjectDetails attributes={diagnoseAttributes} object={inseminationDetails} />
                                        )}
                                    </CardBody>
                                </Card>

                                <Card className="m-0 flex-fill d-flex flex-column min-h-0">
                                    <CardHeader className="d-flex gap-2 justify-content-between">
                                        <span className="text-black fs-5">Celo</span>

                                        <Button className="" size="sm" onClick={() => toggleModal('heat')} disabled={inseminationDetails !== 'active'}>
                                            Registrar celo
                                        </Button>
                                    </CardHeader>
                                    <CardBody className={`flex-fill p-0`} style={{ minHeight: '200px' }}>
                                        <SimpleBar style={{ height: '100%', maxHeight: 'none' }}>
                                            <div className="p-3">
                                                {inseminationDetails.heats.length === 0 ? (
                                                    <div className="h-100 d-flex justify-content-center align-items-center">
                                                        <FiAlertCircle className="text-muted" size={22} />
                                                        <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                                            No se ha registrado celo
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex flex-column gap-3">
                                                        {inseminationDetails.heats
                                                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                            .map((heat: any, idx: number) => (
                                                                <div key={idx} className="d-flex align-items-start gap-3 p-3 border rounded bg-light">
                                                                    <span className={`fs-6 fw-semibold py-2 px-3 rounded text-white ${heat.heat_detected ? "bg-success" : "bg-secondary"}`} style={{ width: "120px", textAlign: "center", flexShrink: 0 }}>
                                                                        {heat.heat_detected ? "Detectado" : "No detectado"}
                                                                    </span>

                                                                    <div className="flex-grow-1">
                                                                        <div className="text-muted mb-1" style={{ fontSize: "0.9rem" }}>
                                                                            {new Date(heat.date).toLocaleDateString("es-ES")}
                                                                        </div>
                                                                        {heat.notes && (
                                                                            <div className="mb-1" style={{ fontSize: "1rem", fontWeight: 500 }}>
                                                                                {heat.notes}
                                                                            </div>
                                                                        )}
                                                                        {heat.responsible && (
                                                                            <Button className="p-0" color="link" style={{ fontSize: "1rem" }}>
                                                                                {heat.responsible.name} {heat.responsible.lastname} ↗
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </SimpleBar>
                                    </CardBody>
                                </Card>
                            </div>
                        </Col>


                        <Col lg={5} className="h-100 d-flex flex-column">
                            <Card className="m-0 h-100 d-flex flex-column min-h-0">
                                <CardHeader>
                                    <span className="text-black fs-5">Dosis aplicadas</span>
                                </CardHeader>
                                <CardBody className="flex-fill p-0 pb-3" style={{ minHeight: '300px' }}>
                                    <SimpleBar
                                        style={{
                                            height: '100%',
                                            maxHeight: '100%'
                                        }}
                                        className="h-100"
                                    >
                                        <div className="p-3">
                                            {dosesDetails.length === 0 ? (
                                                <div className="h-100 d-flex justify-content-center align-items-center">
                                                    <FiAlertCircle className="text-muted" size={22} />
                                                    <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                                        No hay dosis aplicadas
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="d-flex flex-column gap-3">
                                                    {dosesDetails
                                                        .sort((a, b) => a.order - b.order)
                                                        .map((dose) => (
                                                            <div key={dose._id} className="d-flex p-3 border rounded bg-light">
                                                                <div className="d-flex align-items-center justify-content-center bg-secondary text-white rounded me-3" style={{ width: "50px", fontWeight: 600 }}>
                                                                    {dose.order}
                                                                </div>

                                                                <div className="flex-grow-1 d-flex flex-column gap-1 fs-5">
                                                                    <div className="d-flex justify-content-between">
                                                                        <span className="fw-semibold text-black">Código:</span>
                                                                        <span className="text-black">{dose.dose_info.code}</span>
                                                                    </div>
                                                                    <div className="d-flex justify-content-between">
                                                                        <span className="fw-semibold text-black">Volumen semen:</span>
                                                                        <span className="text-black">{dose.dose_info.semen_volume} {dose.dose_info.unit_measurement}</span>
                                                                    </div>
                                                                    <div className="d-flex justify-content-between">
                                                                        <span className="fw-semibold text-black">Volumen diluyente:</span>
                                                                        <span className="text-black">{dose.dose_info.diluent_volume} {dose.dose_info.unit_measurement}</span>
                                                                    </div>
                                                                    <div className="d-flex justify-content-between">
                                                                        <span className="fw-semibold text-black">Volumen total:</span>
                                                                        <span className="text-black">{dose.dose_info.total_volume} {dose.dose_info.unit_measurement}</span>
                                                                    </div>
                                                                    <div className="d-flex justify-content-between text-muted">
                                                                        <span className="text-black">Fecha de aplicación:</span>
                                                                        <span className="text-black">{new Date(dose.time).toLocaleString("es-ES")}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </SimpleBar>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Container>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />

            <Modal size="lg" isOpen={modals.diagnosis} toggle={() => toggleModal("diagnosis")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("diagnosis")}>Registrar diagnóstico</ModalHeader>
                <ModalBody>
                    <DiagnosisForm insemination={inseminationDetails} onSave={() => { toggleModal('diagnosis'); fetchData() }} onCancel={() => toggleModal('diagnosis')} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.heat} toggle={() => toggleModal("heat")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("heat")}>Registrar celo</ModalHeader>
                <ModalBody>
                    {inseminationDetails && <HeatForm insemination={inseminationDetails} onSave={() => { toggleModal('heat'); fetchData() }} onCancel={() => toggleModal('heat')} />}
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.abortionDetails} toggle={() => toggleModal("abortionDetails")} backdrop="static" centered>
                <ModalHeader toggle={() => toggleModal("abortionDetails")}>Detalles de aborto</ModalHeader>
                <ModalBody className="mt-3">
                    <ObjectDetails attributes={abortionAttributes} object={abortionDetails} />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default InseminationDetails;