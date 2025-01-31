import { OrderData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { APIClient, getLoggedinUser } from "helpers/api_helper";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container } from "reactstrap";

//Page for warehouse managers
const SendOrders = () => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const axiosHelper = new APIClient();
    const history = useNavigate();
    const userLogged = getLoggedinUser();

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [orders, setOrders] = useState([])

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
                    <Button className="btn-secondary btn-icon" onClick={() => clicOrder(row)}>
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
        let query = ''
        if (userLogged.role === 'Encargado de almacen') {
            query = `${apiUrl}/orders/find/orderOrigin/AG001`
        } else {
            query = `${apiUrl}/orders/find/orderDestiny/${userLogged.assigment}`
        }

        await axiosHelper.get(`${query}`)
            .then((response) => {
                const orders = response.data.data;
                setOrders(orders)
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al recuperar los pedidos, intentelo más tarde');
            })
    }

    const clicOrder = (row: any) => {
        if(userLogged.role === 'Encargado de almacen'){
            history(`/orders/complete_order/${row.id}`)
        } else {
            history(`/orders/order_details/${row.id}`)
        }
    }

    useEffect(() => {
        fetchOrders();
    }, [])

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={userLogged.role === 'Encargado de almacen' ? 'Pedidos recibidos' : "Pedidos enviados"} pageTitle={"Pedidos"} />

                <Card style={{ height: '70vh' }}>
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto" color="secondary" onClick={() => history('/orders/create_order')}>
                                <i className="ri-add-line me-2" />
                                Nuevo Pedido
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {orders && <CustomTable columns={columns} data={orders} />}
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