import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'

//Page for warehouse managers
const SendOrders = () => {
    const history = useNavigate();
    const configContext = useContext(ConfigContext);

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState<boolean>(true)

    const columns = [
        { header: 'No. de Pedido', accessor: 'id', isFilterable: true },
        { header: 'Fecha de Pedido', accessor: 'date', isFilterable: true },
        {
            header: 'Estado', accessor: 'status', isFilterable: true, render: (value: string) => (
                <Badge color={value === 'completed' ? "success" : "warning"}>
                    {value === 'completed' ? "Completado" : "Pendiente"}
                </Badge>
            ),
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => clicOrder(row)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },

    ]

    const handleError = (error: any, message: string) => {
        console.error(error, message)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const fetchOrders = async () => {
        if (!configContext) return;

        let query = '';
        if (configContext.userLogged.role === 'Encargado de almacen') {
            query = `${configContext.apiUrl}/orders/find/orderOrigin/AG001`;
        } else {
            query = `${configContext.apiUrl}/orders/find/orderDestiny/${configContext.userLogged.assigment}`;
        }

        try {
            const response = await configContext.axiosHelper.get(query);
            const filteredOrders = response.data.data.filter((order: any) => order.status !== 'completed');
            setOrders(filteredOrders);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al recuperar los pedidos, intentelo más tarde');
        } finally {
            setLoading(false)
        }
    };


    const clicOrder = (row: any) => {
        if (configContext?.userLogged.role === 'Encargado de almacen') {
            history(`/orders/complete_order/${row.id}`)
        } else {
            history(`/orders/order_details/${row.id}`)
        }
    }


    useEffect(() => {
        if (!configContext?.userLogged) return;
        document.body.style.overflow = 'hidden';
        fetchOrders();

        return () => {
            document.body.style.overflow = '';
        };
    }, [configContext?.userLogged]);


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
                {configContext?.userLogged && <BreadCrumb title={configContext?.userLogged.role === 'Encargado de almacen' ? 'Pedidos recibidos' : "Pedidos enviados"} pageTitle={"Pedidos"} />}

                <Card style={{ height: '80vh' }}>
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto farm-primary-button" onClick={() => history('/orders/create_order')}>
                                <i className="ri-add-line me-2" />
                                Nuevo Pedido
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                        {orders && <CustomTable columns={columns} data={orders} showPagination={false}/>}
                    </CardBody>
                </Card>
            </Container>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </div>
    )
}

export default SendOrders;