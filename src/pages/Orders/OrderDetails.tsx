import { ConfigContext } from "App"
import { OrderData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/BreadCrumb"
import CustomTable from "Components/Common/CustomTable"
import ObjectDetailsHorizontal from "Components/Common/ObjectDetailsHorizontal"
import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button, Card, CardBody, CardHeader, Col, Container, Row, Spinner } from "reactstrap"

const orderAttributes = [
    { key: 'id', label: 'No. de Pedido' },
    { key: 'date', label: 'Fecha de pedido' },
    { key: 'user', label: 'Usuario' },
    { key: 'orderDestiny', label: 'Almacén de destino' },
    { key: 'status', label: 'Estado' }
]

const productsColumns = [
    { header: 'Codigo', accessor: 'id', isFilterable: true },
    { header: 'Nombre', accessor: 'name', isFilterable: true },
    { header: 'Cantidad', accessor: 'quantity', isFilterable: true },
    { header: 'Unidad de medida', accessor: 'unit_measurement', isFilterable: true },
    { header: 'Categoria', accessor: 'category', isFilterable: true },
    { header: 'Description', accessor: 'description', isFilterable: true },
]

const OrderDetails = () => {
    const history = useNavigate();
    const { id_order } = useParams();
    const configContext = useContext(ConfigContext)

    const [loading, setLoading] = useState(true);
    const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
    const [orderDisplay, setOrderDisplay] = useState<OrderData | null>(null);
    const [products, setProducts] = useState([])

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

            setProducts(productsResponse.data.data);
        } catch (error) {
            console.error('Error al obtener los datos del pedido', error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchOrderDetails();
    }, []);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Detalles de pedido"} pageTitle={"Pedidos"} />

                <Button className="me-auto" color="secondary" onClick={() => history(-1)}>
                    <i className="ri-arrow-left-line me-3"></i>Regresar
                </Button>

                {loading ? (
                    <div className="text-center my-5">
                        <Spinner color="primary" />
                    </div>
                ) : (

                    <div className="d-flex-column gap-2 mt-3">
                        <Card className="w-100 h-100">
                            <CardHeader>
                                <h4>Detalles del Pedido</h4>
                            </CardHeader>
                            <CardBody>
                                {orderDisplay && <ObjectDetailsHorizontal attributes={orderAttributes} object={orderDisplay} />}
                            </CardBody>
                        </Card>

                        <Card className="w-100 h-100">
                            <CardHeader>
                                <h4>Productos</h4>
                            </CardHeader>
                            <CardBody>
                                <CustomTable columns={productsColumns} data={products} rowClickable={false} />
                            </CardBody>
                        </Card>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default OrderDetails;
