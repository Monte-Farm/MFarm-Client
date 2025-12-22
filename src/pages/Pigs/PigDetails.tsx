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
import IndividualMedicationPackageForm from "Components/Common/Forms/AsignMedicationPackageForm";
import { FaKeyboard, FaListUl } from "react-icons/fa";
import SingleMedicationForm from "Components/Common/Forms/SingleMedicationForm";
import PigMedicalDetails from "Components/Common/Details/PigMedicalDetails";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import PigFeedingDetails from "Components/Common/Details/PigFeedingDetails";

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
    const [modals, setModals] = useState({ update: false, viewPDF: false, selectMedicationMode: false, asignSingle: false, medicationPackage: false, });
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
            <LoadingAnimation />
        )
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
                    </TabPane>

                    <TabPane tabId="2" id="feeding-info-tab">
                        <PigFeedingDetails pigId={pig_id ?? ''} />
                    </TabPane>

                    <TabPane tabId="3" id="medical-info-tab">
                        <PigMedicalDetails pigId={pig_id ?? ''} />
                    </TabPane>

                    <TabPane tabId="4" id="reproduction-info-tab">
                    </TabPane>

                    <TabPane tabId="5" id="history-info-tab">
                    </TabPane>
                </TabContent>


            </Container>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default PigDetails