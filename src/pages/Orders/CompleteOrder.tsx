import { ConfigContext } from "App";
import { OrderData, OutcomeData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CompleteOrderForm from "Components/Common/CompleteOrderForm";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Card, CardBody, Container } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'

const CompleteOrder = () => {
    const history = useNavigate();
    const { id_order } = useParams();
    const configContext = useContext(ConfigContext)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [ordersDetails, setOrderDetails] = useState<OrderData>()
    const [loading, setLoading] = useState<boolean>(true)

    const handleError = (error: any, message: string) => {
        console.error(error, message)
        setAlertConfig({ visible: true, color: 'danger', message: message });
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message });
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const fetchOrderDetails = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/orders/find_id/${id_order}`);
            setOrderDetails(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener la información del pedido');
        } finally {
            setLoading(false)
        }
    };

    const handleCompleteOrder = async (data: OrderData) => {
        if (!configContext) return;
        try {
            data.status = 'completed';
            await configContext.axiosHelper.put(`${configContext.apiUrl}/orders/update_order/${data.id}`, data);

            showAlert('success', 'Se ha completado el pedido con éxito');
            await createOutcome(data);

            setTimeout(() => {
                history('/orders/send_orders');
            }, 5000);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al completar el pedido, intentelo más tarde');
        }
    };


    const createOutcome = async (data: OrderData) => {
        if (!configContext) return;

        try {
            let lastOutcomeId = '';
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_next_id`);
            lastOutcomeId = response.data.data;

            const outcomeData: OutcomeData = {
                id: lastOutcomeId,
                date: data.date,
                products: data.productsDelivered,
                outcomeType: "order",
                status: true,
                warehouseDestiny: data.orderDestiny,
                warehouseOrigin: data.orderOrigin,
                totalPrice: 0
            };

            await configContext.axiosHelper.create(`${configContext.apiUrl}/outcomes/create_outcome/true/order`, outcomeData);
            showAlert('success', 'Se ha completado el pedido con éxito');

        } catch (error) {
            handleError(error, 'Ha ocurrido un error al completar el pedido, intentelo más tarde');
        }
    };


    useEffect(() => {
        fetchOrderDetails();
    }, [])


    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
        );
    }


    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Completar Pedido"} pageTitle={"Pedidos"} />

                <Card>
                    <CardBody>
                        <CompleteOrderForm initialData={ordersDetails} onSubmit={(data: OrderData) => handleCompleteOrder(data)} onCancel={() => history('/orders/send_orders')}></CompleteOrderForm>
                    </CardBody>
                </Card>

            </Container>

            {/* Alerta */}
            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </div>
    )
}

export default CompleteOrder;