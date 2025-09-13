import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb"
import { getLoggedinUser } from "helpers/api_helper"
import { useContext, useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import CustomTable from "Components/Common/CustomTable";
import { ExtractionData } from "common/data_interfaces";
import ExtractionForm from "Components/Common/ExtractionForm";
import { Column } from "common/data/data_types";
import AreaChart from "Components/Common/AreaChart";

const ViewExtractions = () => {
    document.title = 'Ver extracciones | Management System'
    const userLoggged = getLoggedinUser();
    const configContext = useContext(ConfigContext)
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [extractions, setExtractions] = useState<ExtractionData[] | null>(null)
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false });
    const [stats, setStats] = useState<any>({})

    const extractionsColumns: Column<any>[] = [
        { header: 'Lote', accessor: 'batch', type: 'text', isFilterable: true },
        { header: 'Fecha de extracción', accessor: 'date', type: 'date', isFilterable: false },
        {
            header: 'Verraco',
            accessor: 'boar',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.boar?.code || "Sin código"
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
                    <Button className="farm-primary-button btn-icon">
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ];

    const categories = stats.monthlyAvg ? stats.monthlyAvg.map((m: any) => `${m.month}/${m.year}`) : [];

    const series = [
        {
            name: "Promedio Volumen",
            data: stats.monthlyAvg ? stats.monthlyAvg.map((m: any) => m.avgVolume) : [],
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
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
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
        </div>
    )
}

export default ViewExtractions
