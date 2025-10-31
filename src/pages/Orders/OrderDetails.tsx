import { ConfigContext } from "App"
import { Attribute, OrderData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import ObjectDetailsHorizontal from "Components/Common/ObjectDetailsHorizontal"
import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Alert, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalHeader, Row, Spinner } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'
import PDFViewer from "Components/Common/PDFViewer"
import { Column } from "common/data/data_types"
import CustomTable from "Components/Common/Tables/CustomTable"

const orderAttributes: Attribute[] = [
    { key: 'id', label: 'No. de Pedido', type: 'text' },
    { key: 'date', label: 'Fecha de pedido', type: 'text' },
    { key: 'user', label: 'Usuario', type: 'text' },
    { key: 'orderDestiny', label: 'Almacén de destino', type: 'text' },
    { key: 'status', label: 'Estado', type: 'status' }
]

const productsColumns: Column<any>[] = [
    { header: 'Codigo', accessor: 'id', isFilterable: true, type: 'text' },
    { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
    { header: 'Cantidad Solicitada', accessor: 'quantity', isFilterable: true, type: 'number' },
    { header: 'Unidad de medida', accessor: 'unit_measurement', isFilterable: true, type: 'text' },
    { header: 'Categoria', accessor: 'category', isFilterable: true, type: 'text' },
    { header: 'Observaciones', accessor: 'observations', isFilterable: true, type: 'text' },
]

const productsCompletedColumns: Column<any>[] = [
    { header: 'Codigo', accessor: 'id', isFilterable: true, type: 'text' },
    { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
    { header: 'Cantidad Solicitada', accessor: 'quantity', isFilterable: true, type: 'number' },
    { header: 'Cantidad Entregada', accessor: 'quantityDelivered', isFilterable: true, type: 'number' },
    { header: 'Unidad de medida', accessor: 'unit_measurement', isFilterable: true, type: 'text' },
    { header: 'Categoria', accessor: 'category', isFilterable: true, type: 'text' },
    { header: 'Observaciones', accessor: 'observations', isFilterable: true, type: 'text' },
]

const OrderDetails = () => {
    const history = useNavigate();
    const { id_order } = useParams();
    const configContext = useContext(ConfigContext)

    const [loading, setLoading] = useState(true);
    const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
    const [orderDisplay, setOrderDisplay] = useState<OrderData | null>(null);
    const [products, setProducts] = useState([])
    const [fileURL, setFileURL] = useState<string>('')
    const [modals, setModals] = useState({ viewPDF: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })

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

    const fetchOrderDetails = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/orders/find_id/${id_order}`);
            const orderData: OrderData = response.data.data;
            setOrderDetails(orderData);

            const [userResponse, destinyResponse, productsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_id/${orderData.user}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${orderData.orderDestiny}`),
                configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_array`, orderData.productsRequested)
            ]);

            setOrderDisplay({
                ...orderData,
                user: `${userResponse.data.data.name} ${userResponse.data.data.lastname}`,
                orderDestiny: destinyResponse.data.data.name,
            });

            let products = productsResponse.data.data;

            if (orderData.status === 'completed' && orderData.productsDelivered) {
                const deliveredMap = new Map(orderData.productsDelivered.map(p => [p.id, p.quantity]));

                products = products.map((product: any) => ({
                    ...product,
                    quantityDelivered: deliveredMap.get(product.id) || 0, // Agrega quantityDelivered o 0 si no existe
                }));
            }

            setProducts(products);
        } catch (error) {
            console.error('Error al obtener los datos del pedido', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintOrder = async () => {
        if (!configContext) return;

        try {

            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/generate_order_report/${id_order}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setFileURL(url);
            toggleModal('viewPDF')
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al generar el reporte, inténtelo más tarde.');
        }
    };

    useEffect(() => {
        fetchOrderDetails();
    }, []);

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
                <BreadCrumb title={"Detalles de pedido"} pageTitle={"Pedidos"} />

                <div className="d-flex gap-2">
                    <Button className="me-auto farm-secondary-button" onClick={() => history(-1)}>
                        <i className="ri-arrow-left-line me-3"></i>Regresar
                    </Button>

                    <Button className="ms-auto farm-primary-button" onClick={handlePrintOrder}>
                        <i className="ri-download-line me-2"></i>
                        Descargar Reporte
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center my-5">
                        <Spinner color="primary" />
                    </div>
                ) : (

                    <div className="d-flex-column gap-2 mt-3">
                        <Card className="w-100 h-100 pt-2">
                            <CardBody>
                                {orderDisplay && <ObjectDetailsHorizontal attributes={orderAttributes} object={orderDisplay} />}
                            </CardBody>
                        </Card>

                        <Card className="rounded" style={{ height: '55vh' }}>
                            <CardHeader>
                                <h4>Productos</h4>
                            </CardHeader>
                            <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                                <CustomTable columns={orderDetails?.status === 'completed' ? productsCompletedColumns : productsColumns} data={products} rowClickable={false} showPagination={false} />
                            </CardBody>
                        </Card>
                    </div>
                )}


                <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Inventario </ModalHeader>
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
    );
};

export default OrderDetails;
