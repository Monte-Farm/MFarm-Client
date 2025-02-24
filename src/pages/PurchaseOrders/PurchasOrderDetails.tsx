import { ConfigContext } from "App";
import { Attribute, PurchaseOrderData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, CardBody, CardHeader, Container } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import CustomTable from "Components/Common/CustomTable";
import ObjectDetailsHorizontal from "Components/Common/ObjectDetailsHorizontal";


const purchaseOrderAttributes: Attribute[] = [
    { key: 'id', label: 'No. de Orden', type: "text" },
    { key: 'date', label: 'Fecha', },
    { key: 'supplier', label: 'Proveedor', type: "text" },
    { key: 'tax', label: 'Impuesto', type: "percentage" },
    { key: 'discount', label: 'Descuento', type: "percentage" },
    { key: 'subtotal', label: 'Subtotal', type: "currency" },
    { key: 'totalPrice', label: 'Total', type: "currency" },
];


const productColumns = [
    { header: 'Código', accessor: 'id', isFilterable: true },
    { header: 'Producto', accessor: 'name', isFilterable: true },
    { header: 'Cantidad', accessor: 'quantity', isFilterable: true },
    { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true },
    { header: 'Precio Unitario', accessor: 'price' },
    { header: 'Categoría', accessor: 'category', isFilterable: true },
];

const PurchaseOrderDetails = () => {
    document.title = 'Detalles de Orden de Compra | Almacén'
    const history = useNavigate();
    const { id_order } = useParams();
    const configContext = useContext(ConfigContext);

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [purchaseOrderDetails, setPurchaseOrderDetails] = useState<PurchaseOrderData>();
    const [purchaseOrderDisplay, setPurchaseOrderDisplay] = useState({});
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState<boolean>(true);

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const fetchPurchaseOrder = async () => {
        if (!configContext) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/find_purchase_order_id/${id_order}`)
            const purchaseOrderFound = response.data.data;
            setPurchaseOrderDetails(purchaseOrderFound);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos, intentelo más tarde');
        }
    }

    const handleFetchPurchaseOrderDisplay = async () => {
        if (!configContext || !purchaseOrderDetails) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/supplier/find_supplier_id/${purchaseOrderDetails.supplier}`);
            const supplier = response.data.data;

            setPurchaseOrderDisplay({...purchaseOrderDetails, supplier: supplier.name})
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos de la entrada, intentelo más tarde');
        }
    };

    const handleFetchIncomeProducts = async () => {
        if (!configContext || !purchaseOrderDetails) return;

        try {
            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_array`, purchaseOrderDetails?.products);
            setProducts(response.data.data);
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        }
    };


    const handleBack = () => {
        if (window.history.length > 1) {
            history(-1);
        } else {
            history('/#');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([
                fetchPurchaseOrder(),
                handleFetchPurchaseOrderDisplay(),
            ]);
            setLoading(false);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (purchaseOrderDetails) {
            handleFetchIncomeProducts();
        }
    }, [purchaseOrderDetails]);


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
                <BreadCrumb title={"Detalles de Orden de Compra"} pageTitle={"Ordenes de Compra"} />
                <div className="d-flex gap-2 mb-3">
                    <Button className="me-auto farm-secondary-button" onClick={handleBack}>
                        <i className="ri-arrow-left-line me-3"></i>
                        Regresar
                    </Button>
                </div>

                <div className="d-flex-column gap-3">
                    <Card className="w-100 h-100 pt-2" style={{ backgroundColor: '#A3C293' }}>
                        <CardBody>
                            {purchaseOrderDetails && (
                                <ObjectDetailsHorizontal attributes={purchaseOrderAttributes} object={purchaseOrderDisplay} />
                            )}
                        </CardBody>
                    </Card>

                    <Card className="w-100" style={{ height: '55vh' }}>
                        <CardHeader>
                            <div className="d-flex gap-2">
                                <h4>Productos</h4>

                                <Button className="ms-auto farm-primary-button">
                                    <i className="ri-download-line me-2"></i>
                                    Descargar Orden de Compra
                                </Button>
                            </div>

                        </CardHeader>
                        <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                            <CustomTable columns={productColumns} data={products} rowClickable={false} showPagination={false} />
                        </CardBody>
                    </Card>
                </div>

                {alertConfig.visible && (
                    <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                        {alertConfig.message}
                    </Alert>
                )}
            </Container>
        </div>
    )
}

export default PurchaseOrderDetails;