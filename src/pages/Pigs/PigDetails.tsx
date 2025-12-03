import { ConfigContext } from "App";
import { Attribute, PigData, PigHistoryChanges } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { Alert, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane, UncontrolledTooltip } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'
import classnames from "classnames";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import defaultPigImage from "../../assets/images/pig-default.png";
import KPIBox from "Components/Common/Graphics/KPIBox";
import PigTimeline from "Components/Common/Shared/PigTimeline";
import PigEditForm from "Components/Common/Forms/PigEditForm";
import HistoryFlagItem from "Components/Common/Lists/HistoryFlagItem";
import SimpleBar from "simplebar-react";
import FeedingEntryItem from "Components/Common/Lists/FeedingEntryItem";
import HistoryList from "Components/Common/Lists/HistoryList";
import ReproductionFilters from "Components/Common/Lists/HistoryListFilter";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import IndividualMedicationPackageForm from "Components/Common/Forms/IndividualMedicationPackageForm";

const pigDetailsAttributes: Attribute[] = [
    { key: 'code', label: 'Codigo', type: 'text' },
    { key: 'birthdate', label: 'Nacimiento', type: 'date' },
    { key: 'status', label: 'Estado', type: 'text' },
    { key: 'currentStage', label: 'Etapa', type: 'text' },
    { key: 'observations', label: 'Car. Fisicas', type: 'text' },
]

const farmDetailsAttributes: Attribute[] = [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'code', label: 'Codigo', type: 'text' },
    { key: 'location', label: 'Ubicación', type: 'text' },
]

const PigDetails = () => {
    const { pig_id } = useParams();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [pigInfo, setPigInfo] = useState<PigData | null>(null)
    const [pigHistory, setPigHistory] = useState<PigHistoryChanges[]>([])
    const [pigReproductionHistory, setPigReproductionHistory] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<string>('1');
    const [modals, setModals] = useState({ update: false, viewPDF: false, medicationPackage: false });
    const [fileURL, setFileURL] = useState<string>('')
    const navigate = useNavigate()
    const [generatingReport, setGeneratingReport] = useState(false);
    const [userResponsible, setUserResponsible] = useState<{ _id: string, name: string, lastname: string, email: string }>()
    const [filteredHistory, setFilteredHistory] = useState(pigReproductionHistory);


    const toggleTab = (tab: any) => {
        if (activeTab !== tab) setActiveTab(tab)
    }

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

    const fetchData = async () => {
        if (!pig_id || !configContext) return;

        setLoading(true);
        try {
            const [detailsRes, historyRes, reproductionHistory] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${pig_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/history/${pig_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/reproduction_history/${pig_id}`),

            ]);

            const pig = detailsRes.data.data;
            setPigInfo(pig);
            setPigHistory(historyRes.data.data);
            setPigReproductionHistory(reproductionHistory.data.data)

            if (pig.discarded && pig.discardReason === 'muerto') {
                const userRes = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_discard_responsible/${pig?.discardResponsible}`);
                setUserResponsible(userRes.data.data)
            }

        } catch (error) {
            handleError(error, 'Ha ocurrido un error al recuperar los datos, intentelo más tarde');
        } finally {
            setLoading(false);
        }
    };


    const getOriginLabel = (pig: PigData | null) => {
        if (!pig) return 'No especificado';

        const origins: Record<string, string> = {
            'nacido': 'Nacido en granja',
            'comprado': 'Comprado',
            'donado': 'Donado',
            'otro': 'Otro'
        };

        return origins[pig.origin] || pig.origin;
    };

    const updatedSuccessfully = async () => {
        toggleModal('update')
        await fetchData();
        showAlert('success', 'Datos actualizados con éxito')
    }

    const handlePrintReport = async () => {
        if (!configContext || !pig_id) return;

        setGeneratingReport(true);
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/reports/generate_pig_report/${pig_id}`, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setFileURL(url);
            toggleModal('viewPDF')
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al generar el reporte, inténtelo más tarde.');
        } finally {
            setGeneratingReport(false)
        }
    };

    useEffect(() => {
        fetchData();
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
                <BreadCrumb title={"Detalles de cerdo"} pageTitle={"Cerdos"} />

                <div className="mb-3 d-flex">
                    <Button className="farm-secondary-button" onClick={() => navigate(-1)}>
                        <i className=" ri-arrow-left-line me-3"></i>
                        Regresar
                    </Button>

                    <Button className="h-50 farm-primary-button ms-auto" onClick={handlePrintReport} disabled={generatingReport}>
                        {generatingReport ? (
                            <>
                                <Spinner size="sm" /> Generando...
                            </>
                        ) : (
                            <>
                                <i className="ri-download-line me-2"></i>
                                Descargar información
                            </>
                        )}
                    </Button>
                </div>

                <Card>
                    <Nav pills className="nav-justified p-3">
                        <NavItem>
                            <NavLink className={classnames({ active: activeTab === '1' })} onClick={() => toggleTab('1')} style={{ cursor: 'pointer' }}>
                                Informacion general
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink className={classnames({ active: activeTab === '2' })} onClick={() => toggleTab('2')} style={{ cursor: 'pointer' }}>
                                Alimentación
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink className={classnames({ active: activeTab === '3' })} onClick={() => toggleTab('3')} style={{ cursor: 'pointer' }}>
                                Medicación
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink className={classnames({ active: activeTab === '4' })} onClick={() => toggleTab('4')} style={{ cursor: 'pointer' }}>
                                Reproducción
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink className={classnames({ active: activeTab === '5' })} onClick={() => toggleTab('5')} style={{ cursor: 'pointer' }}>
                                Historial
                            </NavLink>
                        </NavItem>
                    </Nav>
                </Card>


                <TabContent activeTab={activeTab} className="">
                    <TabPane tabId="1" id="general-info-tab">

                        <div className="d-flex gap-2">
                            <Card className="w-25">
                                <CardHeader className="d-flex">
                                    <h5>Informacion</h5>
                                    {pigInfo?.discard ? (
                                        <div id="editButton" className="ms-auto">
                                            <Button
                                                className="farm-primary-button fs-6"
                                                size="sm"
                                                disabled
                                            >
                                                <i className="ri-pencil-line me-2" />
                                                Editar
                                            </Button>
                                            <UncontrolledTooltip placement="top" target="editButton">
                                                Este cerdo fue descartado y no puede ser modificado.
                                            </UncontrolledTooltip>
                                        </div>
                                    ) : (
                                        <Button
                                            className="ms-auto farm-primary-button fs-6"
                                            size="sm"
                                            onClick={() => toggleModal('update')}
                                        >
                                            <i className="ri-pencil-line me-2" />
                                            Editar
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        showImage={true}
                                        imageSrc={defaultPigImage}
                                        attributes={pigDetailsAttributes}
                                        object={pigInfo || {}}
                                    />
                                </CardBody>
                            </Card>

                            <div className="w-75">
                                <div>
                                    {pigInfo?.discard && (
                                        <>
                                            <Card className="mt-1">
                                                <CardHeader>
                                                    <h5 className="mb-0 text-danger">Información del Descarte</h5>
                                                </CardHeader>
                                                <CardBody className="d-flex">
                                                    <KPIBox label="Motivo del descarte" value={pigInfo.discard.reason || 'No especificado'} />
                                                    <KPIBox label="Destino del animal" value={pigInfo.discard.destination || 'No especificado'} />

                                                </CardBody>

                                            </Card>

                                        </>

                                    )}
                                </div>

                                <div className="d-flex justify-content-evenly gap-2 mb-3">
                                    <KPIBox
                                        label="Edad (días)"
                                        value={
                                            pigInfo?.birthdate
                                                ? (() => {
                                                    const days = Math.floor((Date.now() - new Date(pigInfo.birthdate).getTime()) / (1000 * 60 * 60 * 24));
                                                    return days === 0 ? 'Nacido hoy' : `${days}`;
                                                })()
                                                : 'N/D'
                                        }
                                    />
                                    <KPIBox label={"Raza"} value={pigInfo?.breed || 'No especificado'} />
                                    <KPIBox label={"Origen"} value={getOriginLabel(pigInfo)} />

                                    {pigInfo?.origin === 'other' && (
                                        <KPIBox label={"Detalle origen"} value={pigInfo?.originDetail || 'No especificado'} />
                                    )}

                                    {pigInfo?.origin !== 'born' && (
                                        <KPIBox
                                            label={"Fecha llegada"}
                                            value={pigInfo?.arrivalDate ? new Date(pigInfo.arrivalDate).toLocaleDateString() : 'No especificada'}
                                        />
                                    )}

                                    {(pigInfo?.origin === 'purchased' || pigInfo?.origin === 'donated') && (
                                        <KPIBox label={"Granja origen"} value={pigInfo?.sourceFarm || 'No especificada'} />
                                    )}

                                    <KPIBox label={"Estado"} value={pigInfo?.status || 'No especificado'} />
                                    <KPIBox label={"Sexo"} value={pigInfo?.sex === 'male' ? 'Macho' : 'Hembra'} />
                                </div>



                                <div className="d-flex flex-wrap gap-2 flex-grow-1" style={{ flex: "1 1 0", minWidth: "300px" }}>
                                    <div style={{ flex: "1 1 350px", minWidth: "280px" }}>
                                        <Card style={{ minHeight: '300px' }}>
                                            <CardHeader><h4>Peso</h4></CardHeader>
                                            <CardBody>
                                                {/* aqui va una grafica de la evolucion del peso */}
                                            </CardBody>
                                        </Card>
                                    </div>

                                    <div style={{ flex: "1 1 350px", minWidth: "280px" }}>
                                        <Card style={{ minHeight: '300px' }}>
                                            <CardHeader><h4>Etapa</h4></CardHeader>
                                            <CardBody>
                                                <PigTimeline
                                                    currentStage={pigInfo?.currentStage || ''}
                                                    sex={pigInfo?.sex || 'female'}
                                                    className="my-4"
                                                />
                                            </CardBody>
                                        </Card>
                                    </div>
                                </div>


                            </div>



                        </div>

                    </TabPane>

                    <TabPane tabId="2" id="feeding-info-tab">
                        <div className="mt-3">
                            <div className="row">
                                <div className="col-md-4">
                                    <Card style={{ minHeight: "calc(100vh - 320px)" }} className="feeding-card">
                                        <CardHeader className="feeding-header">
                                            <h5 className="mb-0">
                                                <i className="ri-restaurant-line me-2"></i>Alimentación Inicial
                                            </h5>
                                        </CardHeader>
                                        <CardBody>
                                            {pigInfo?.feedings?.length ? (
                                                pigInfo.feedings.map((entry, idx) => (
                                                    <FeedingEntryItem key={`feed-${idx}`} entry={entry} />
                                                ))
                                            ) : (
                                                <div className="text-center feeding-placeholder">
                                                    <i className="ri-fridge-line fs-1"></i>
                                                    <p className="text-muted mt-2">Sin registros de alimentación inicial</p>
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </div>

                                <div className="col-md-8">
                                    <Card style={{ minHeight: "calc(100vh - 320px)" }} className="feeding-history-card">
                                        <CardHeader className="d-flex justify-content-between align-items-center feeding-header">
                                            <h5 className="mb-0">
                                                <i className="ri-history-line me-2"></i>Historial de Alimentación
                                            </h5>
                                            <Button color="feeding" size="sm" className="feeding-btn">
                                                <i className="ri-add-line me-1"></i> Nueva Alimentación
                                            </Button>
                                        </CardHeader>
                                        <CardBody className="d-flex align-items-center justify-content-center">
                                            <div className="text-center feeding-placeholder">
                                                <i className="ri-calendar-todo-line fs-1"></i>
                                                <p className="text-muted mt-3">Registra el primer consumo diario</p>
                                                <Button color="outline-feeding" size="sm" className="mt-3">
                                                    <i className="ri-pencil-line me-1"></i> Comenzar registro
                                                </Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabPane>

                    <TabPane tabId="3" id="medical-info-tab">
                        <div>
                            <Button className="btn-success" onClick={() => toggleModal('medicationPackage')}>
                                Paquete de medicacion
                            </Button>
                        </div>
                        <div className="mt-3">
                            <div className="row">
                                <div className="col-md-4">
                                    <Card style={{ minHeight: "calc(100vh - 320px)" }}>
                                        <CardHeader>
                                            <h5 className="mb-0">Medicamentos Iniciales</h5>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="text-muted text-center">Sin registros de medicamentos iniciales.</div>
                                        </CardBody>
                                    </Card>
                                </div>

                                <div className="col-md-8">
                                    <Card style={{ minHeight: "calc(100vh - 320px)" }}>
                                        <CardHeader>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0">Historial Médico</h5>
                                                <Button color="primary" size="sm">
                                                    <i className="ri-add-line me-1"></i> Nuevo Registro
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardBody className="text-muted d-flex align-items-center justify-content-center">
                                            <div className="text-center">
                                                <i className="ri-hospital-line fs-1 text-muted mb-3"></i>
                                                <p className="mb-0">Módulo de historial médico aún no implementado.</p>
                                                <Button color="outline-primary" size="sm" className="mt-3">
                                                    Agregar primer registro
                                                </Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabPane>

                    <TabPane tabId="4" id="reproduction-info-tab">
                        <Card style={{ minHeight: "calc(100vh - 435px)" }}>
                            <CardHeader><h4>Historial de Reproducción</h4></CardHeader>
                            <CardBody className="p-0">
                                {pigReproductionHistory.length === 0 ? (
                                    <div className="p-4 text-center text-muted fs-5">
                                        No hay registros de reproducción
                                    </div>
                                ) : (
                                    <>
                                        <ReproductionFilters
                                            history={pigReproductionHistory}
                                            setFilteredHistory={setFilteredHistory}
                                        />

                                        <HistoryList
                                            data={filteredHistory}
                                            typeKey="type"
                                            dateKey="date"
                                            descriptionKey="description"
                                            responsibleKey="responsible"
                                        />
                                    </>

                                )}
                            </CardBody>
                        </Card>
                    </TabPane>

                    <TabPane tabId="5" id="history-info-tab">
                        <div className="">
                            <Card style={{ minHeight: "calc(100vh - 435px)" }}>
                                <CardHeader>
                                    <h4>Historial de Cambios</h4>
                                </CardHeader>
                                <CardBody className="p-0">
                                    {pigHistory.length === 0 ? (
                                        <div className="p-4 text-center text-muted">
                                            No hay registros de cambios
                                        </div>
                                    ) : (
                                        <SimpleBar
                                            style={{
                                                maxHeight: "calc(100vh - 435px)",
                                                padding: "16px"
                                            }}
                                            autoHide={false}
                                        >
                                            <div className="history-flag-list">
                                                {pigHistory
                                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                    .map((record) => (
                                                        <HistoryFlagItem record={record} />
                                                    ))}
                                            </div>
                                        </SimpleBar>
                                    )}
                                </CardBody>
                            </Card>
                        </div>
                    </TabPane>
                </TabContent>


            </Container>

            <Modal size="xl" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("update")}>Registrar cerdo </ModalHeader>
                <ModalBody>
                    {/* {pigInfo && (
                        <PigEditForm initialData={pigInfo} onSave={updatedSuccessfully} onCancel={() => toggleModal('update')} />
                    )} */}

                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.medicationPackage} toggle={() => toggleModal("medicationPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("medicationPackage")}>Asignar paquete de medicacion</ModalHeader>
                <ModalBody>
                    <IndividualMedicationPackageForm pigId={pig_id ?? ""} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Inventario </ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default PigDetails