import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb"
import { getLoggedinUser } from "helpers/api_helper"
import { useContext, useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap"
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import CustomTable from "Components/Common/CustomTable";
import { ExtractionData } from "common/data_interfaces";
import ExtractionForm from "Components/Common/ExtractionForm";
import { Column } from "common/data/data_types";
import AreaChart from "Components/Common/AreaChart";
import PigDetailsModal from "Components/Common/DetailsPigModal";
import { useNavigate } from "react-router-dom";
import LoadingAnimation from "Components/Common/LoadingAnimation";
import ExtractionDetails from "Components/Common/ExtractionDetails";
import AlertMessage from "Components/Common/AlertMesagge";

const ViewExtractions = () => {
    document.title = 'Ver extracciones | Management System'
    const userLoggged = getLoggedinUser();
    const configContext = useContext(ConfigContext)
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [extractions, setExtractions] = useState<ExtractionData[] | null>(null)
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false, pigDetails: false, extractionDetails: false });
    const [stats, setStats] = useState<any>({})
    const [selectedExtraction, setSelectedExtraction] = useState<any>({})
    const navigate = useNavigate();

    const extractionsColumns: Column<any>[] = [
        { header: 'Lote', accessor: 'batch', type: 'text', isFilterable: true },
        { header: 'Fecha de extracción', accessor: 'date', type: 'date', isFilterable: false },
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
                    {row.boar?.code} ↗
                </Button>
            )
        },
        {
            header: 'Responsable',
            accessor: 'technician',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.technician ? `${row.technician.name} ${row.technician.lastname}` : "Sin responsable"
        },
        { header: 'Ubicacion de la extracción', accessor: 'extraction_location', type: 'text', isFilterable: true },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`details-button-${row._id}`} className="farm-primary-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedExtraction(row); toggleModal('extractionDetails') }} >
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

    const fetchExtractions = async () => {
        if (!userLoggged || !configContext) return
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/find_by_farm/${userLoggged.farm_assigned}`)
            setExtractions(response.data.data)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos, intentelo mas tarde')
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        if (!userLoggged || !configContext) return
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/stadistics/${userLoggged.farm_assigned}`)
            setStats(response.data.data)
        } catch (error) {
            handleError(error, 'Error al obtener las estadisticas')
        }
    }

    const openPigDetailsModal = (extraction: any) => {
        setSelectedExtraction(extraction);
        toggleModal('pigDetails')
    }


    const onSaveExtraction = () => {
        toggleModal('create')
        fetchExtractions();
        fetchStats();
    }

    useEffect(() => {
        fetchExtractions();
        fetchStats();
    }, [])


    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver extracciones"} pageTitle={"Extracciones"} />

                <div className="d-flex flex-wrap gap-3">
                    <Card className="flex-fill shadow-sm border-0 rounded-3">
                        <CardBody className="text-center">
                            <h6 className="text-muted mb-2">Total de extracciones</h6>
                            <h3 className="fw-bold text-primary">{stats.totalExtractions || 0}</h3>
                        </CardBody>
                    </Card>

                    <Card className="flex-fill shadow-sm border-0 rounded-3">
                        <CardBody className="text-center">
                            <h6 className="text-muted mb-2">Promedio volumen</h6>
                            <h3 className="fw-bold text-success">
                                {stats.avgVolume ? stats.avgVolume.toFixed(2) : 0} ml
                            </h3>
                        </CardBody>
                    </Card>

                    <Card className="flex-fill shadow-sm border-0 rounded-3">
                        <CardBody className="text-center">
                            <h6 className="text-muted mb-2">Volumen máximo</h6>
                            <h3 className="fw-bold text-danger">
                                {stats.maxVolume || 0} ml
                            </h3>
                        </CardBody>
                    </Card>

                    <Card className="flex-fill shadow-sm border-0 rounded-3">
                        <CardBody className="text-center">
                            <h6 className="text-muted mb-2">Volumen mínimo</h6>
                            <h3 className="fw-bold text-warning">
                                {stats.minVolume || 0} ml
                            </h3>
                        </CardBody>
                    </Card>

                    <Card className="flex-fill shadow-sm border-0 rounded-3">
                        <CardBody className="text-center">
                            <h6 className="text-muted mb-2">Extracciones últimos 30 días</h6>
                            <h3 className="fw-bold text-info">{stats.last30Days || 0}</h3>
                        </CardBody>
                    </Card>
                </div>

                {/* <div className="">
                    <Card className="shadow-sm border-0 rounded-3">
                        <CardBody style={{ height: "300px" }}>
                            <AreaChart
                                title="Evolución mensual del volumen promedio"
                                series={series}
                                categories={categories}
                            />
                        </CardBody>
                    </Card>
                </div> */}

                <Card style={{ height: '75vh' }}>
                    <CardHeader className="d-flex">
                        <h4>Extracciones</h4>
                        <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                            <i className="ri-add-line me-2" />
                            Nueva extracción
                        </Button>
                    </CardHeader>

                    <CardBody>
                        <CustomTable columns={extractionsColumns} data={extractions || []} showPagination={false} />
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nueva extracción</ModalHeader>
                <ModalBody>
                    <ExtractionForm onSave={onSaveExtraction} onCancel={function (): void {
                        throw new Error("Function not implemented.");
                    }} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>Detalles del verraco</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedExtraction.boar?._id} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.extractionDetails} toggle={() => toggleModal("extractionDetails")} centered>
                <ModalHeader toggle={() => toggleModal("extractionDetails")}>Detalles de la extracción</ModalHeader>
                <ModalBody>
                    <ExtractionDetails extractionId={selectedExtraction?._id} />
                </ModalBody>
            </Modal>


            {alertConfig.visible && (
                <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            )}
        </div>
    )
}

export default ViewExtractions
