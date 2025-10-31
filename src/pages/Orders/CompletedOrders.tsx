import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";


const CompletedOrders = () => {
    document.title = 'Pedidos Completados | Pedidos'
    const history = useNavigate();
    const configContext = useContext(ConfigContext);

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState<boolean>(true)

    const columns: Column<any>[] = [
        { header: 'No. de Pedido', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Fecha de Pedido', accessor: 'date', isFilterable: true, type: 'text' },
        { header: 'Almacén', accessor: 'orderDestiny', isFilterable: true, type: 'text' },
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
                    <Button className="farm-primary-button btn-icon" onClick={() => history(`/orders/order_details/${row.id}`)}>
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

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/orders/find/orderOrigin/AG001`);
            const filteredOrders = response.data.data.filter((order: any) => order.status === 'completed');
            setOrders(filteredOrders);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al recuperar los pedidos, intentelo más tarde');
        } finally {
            setLoading(false)
        }
    };


    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchOrders();

        return () => {
            document.body.style.overflow = '';
        };
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
                <BreadCrumb title={'Pedidos completados'} pageTitle={"Pedidos"} />

                <Card style={{ height: '75vh' }}>
                    <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                        {orders && <CustomTable columns={columns} data={orders} showPagination={false} />}
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

export default CompletedOrders