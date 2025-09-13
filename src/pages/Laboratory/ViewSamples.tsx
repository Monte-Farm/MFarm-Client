import { ConfigContext } from "App";
import { SemenSample } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import ExtractionForm from "Components/Common/ExtractionForm";
import SemenSampleForm from "Components/Common/SemenSampleForm";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import { Alert, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";

const ViewSamples = () => {
    document.title = 'Ver muestras de semen | Management System'
    const userLoggged = getLoggedinUser();
    const configContext = useContext(ConfigContext)
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false });
    const [samples, setSamples] = useState<SemenSample[]>([])

    const samplesColumns: Column<any>[] = [
        {
            header: 'Lote de extracción',
            accessor: 'extraction_id',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.extraction_id.batch || "Sin lote"
        },
        {
            header: 'Verraco',
            accessor: 'extraction_id',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.extraction_id.boar.code || "Sin codigo"
        },
        {
            header: 'No. de dosis',
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => row.doses.length || 0
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

    const fetchSemenSamples = async () => {
        if (!configContext || !userLoggged) return
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/semen_sample/find_by_farm/${userLoggged.farm_assigned}`)
            setSamples(response.data.data)
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

                <Card style={{ height: '82vh' }}>
                    <CardHeader className="d-flex">
                        <h4>Génetica líquida</h4>
                        <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                            <i className="ri-add-line me-2" />
                            Agregar muestra
                        </Button>
                    </CardHeader>

                    <CardBody>
                        <CustomTable columns={samplesColumns} data={samples} showPagination={false} />
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
        </div>
    )
}

export default ViewSamples