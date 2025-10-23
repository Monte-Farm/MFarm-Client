import { ConfigContext } from "App"
import { Attribute, OutcomeData, SubwarehouseData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/BreadCrumb"
import CustomTable from "Components/Common/CustomTable"
import ObjectDetails from "Components/Common/ObjectDetails"
import ObjectDetailsHorizontal from "Components/Common/ObjectDetailsHorizontal"
import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Alert, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalHeader, Row } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'
import PDFViewer from "Components/Common/PDFViewer"
import { Column } from "common/data/data_types"

const outcomeAttributes: Attribute[] = [
    { key: 'id', label: 'Identificador', type: 'text' },
    { key: 'date', label: 'Fecha', type: 'date' },
    { key: 'warehouseDestiny', label: 'Almacén de destino', type: 'text' },
    { key: 'outcomeType', label: 'Motivo de salida', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'text' },
]

const OutcomeDetails = () => {
    document.title = 'Detalles de salida | Salidas'
    const history = useNavigate();
    const { id_outcome } = useParams();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [outcome, setOutcome] = useState<OutcomeData>();
    const [warehouseDestiny, setWarehouseDestiny] = useState<SubwarehouseData>();
    const [productsOutcome, setProductsOutcome] = useState([]);
    const [outcomeDisplay, setOutcomeDisplay] = useState({});
    const [loading, setLoading] = useState<boolean>(true)
    const [modals, setModals] = useState({ viewPDF: false });
    const [fileURL, setFileURL] = useState<string>('')

    const productColumns: Column<any>[] = [
        { header: 'Código', accessor: 'id', type: 'text' },
        { header: 'Producto', accessor: 'name', type: 'text' },
        { header: 'Cantidad', accessor: 'quantity', type: 'number' },
        { header: 'Unidad de Medida', accessor: 'unit_measurement', type: 'text' },
        { header: 'Precio Promedio (Unidad)', accessor: 'price', type: 'currency' },
        { header: 'Categoría', accessor: 'category', type: 'text' },
    ]

    const handleError = (error: any, message: string) => {
        console.error(message, error)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };


    const handleFetchOutcome = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_outcome_id/${id_outcome}`);
            setOutcome(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos, intentelo más tarde');
        }
    };


    const handleFetchWarehouseDestiny = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${outcome?.warehouseDestiny}`);
            setWarehouseDestiny(response.data.data);
        } catch (error) {
            console.log(error, 'Ha ocurrido un error al obtener los datos del almacén de destino, intentelo más tarde');
        }
    };


    const handleFetchOutcomeProducts = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_array`, outcome?.products);
            setProductsOutcome(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos de los productos, intentelo más tarde');
        }
    };


    const handlePrintOutcome = async () => {
        if (!configContext) return;

        try {

            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/generate_outcome_report/${id_outcome}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setFileURL(url);
            toggleModal('viewPDF')
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al generar el reporte, inténtelo más tarde.');
        }
    };



    const handleBack = () => {
        if (window.history.length > 1) {
            history(-1)
        } else {
            history('/warehouse/outcomes/view_outcomes')
        }
    }

    useEffect(() => {
        handleFetchOutcome();
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            if (outcome) {
                await Promise.all([
                    handleFetchWarehouseDestiny(),
                    handleFetchOutcomeProducts()
                ])
                setOutcomeDisplay({ ...outcome, warehouseDestiny: warehouseDestiny?.name })
                setLoading(false)
            }
        }

        fetchData();

    }, [outcome])


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
                <BreadCrumb title={"Detalles de Salida"} pageTitle={"Salidas"} />

                <div className="d-flex mt-1">
                    <Button className="me-auto farm-secondary-button" onClick={handleBack}>
                        <i className="ri-arrow-left-line me-3" />
                        Regresar
                    </Button>
                </div>

                <div className="d-flex-column gap-3 mt-4">
                    <Card className="pt-2" style={{ backgroundColor: '#A3C293' }}>
                        <CardBody>
                            <ObjectDetailsHorizontal attributes={outcomeAttributes} object={outcomeDisplay || {}} />
                        </CardBody>
                    </Card>

                    <Card className="w-100" style={{ height: '55vh' }}>
                        <CardHeader>
                            <div className="d-flex gap-2">
                                <h4>Productos</h4>

                                <Button className="ms-auto farm-primary-button" onClick={handlePrintOutcome}>
                                    <i className="ri-download-line me-2"></i>
                                    Descargar Reporte
                                </Button>
                            </div>

                        </CardHeader>
                        <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                            <CustomTable columns={productColumns} data={productsOutcome} showPagination={false} />
                        </CardBody>
                    </Card>
                </div>


                <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Salida </ModalHeader>
                    <ModalBody>
                        {fileURL && <PDFViewer fileUrl={fileURL} />}
                    </ModalBody>
                </Modal>


                {alertConfig.visible && (
                    <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                        {alertConfig.message}
                    </Alert>
                )}
            </Container>
        </div>
    )
}

export default OutcomeDetails