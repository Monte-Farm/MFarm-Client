import { OrderData, OutcomeData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CompleteOrderForm from "Components/Common/CompleteOrderForm";
import { APIClient } from "helpers/api_helper";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Card, CardBody, Container } from "reactstrap";

const CompleteOrder = () => {
    const history = useNavigate();
    const axiosHelper = new APIClient();
    const apiurl = process.env.REACT_APP_API_URL;
    const { id_order } = useParams();

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [ordersDetails, setOrderDetails] = useState<OrderData>()

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
        await axiosHelper.get(`${apiurl}/orders/find_id/${id_order}`)
            .then((response) => {
                setOrderDetails(response.data.data);
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al obtener la informacion del pedido')
            })
    }

    const handleCompleteOrder = async (data: OrderData) => {
        data.status = 'completed'
        await axiosHelper.put(`${apiurl}/orders/update_order/${data.id}`, data)
        .then(async (response) => {
            showAlert('success', 'Se ha completado el pedido con éxito') 
            await createOutcome(data)
            setTimeout(() => {
                history('/orders/send_orders')
            }, 5000);
        })
        .catch((error) => {
            handleError(error, 'Ha ocurrido un error al completar el pedido, intentelo más tarde')
        })
    }

    const createOutcome = async (data: OrderData) => {
        let lastOutcomeId = ''
        await axiosHelper.get(`${apiurl}/outcomes/outcome_next_id`)
        .then((response) => {
            lastOutcomeId = response.data.data
        })

        const outcomeData: OutcomeData = {
            id: lastOutcomeId,
            date: data.date,
            products: data.productsDelivered,
            outcomeType: "order",
            status: true,
            warehouseDestiny: data.orderDestiny,
            warehouseOrigin: data.orderOrigin,
            totalPrice: 0
        }

        await axiosHelper.create(`${apiurl}/outcomes/create_outcome/true/order`, outcomeData)
        .then(() => {
            showAlert('success', 'Se ha completado el pedido con éxito') 
        })
        .catch((error) => {
            handleError(error, 'Ha ocurrido un error al completar el pedido, intentelo más tarde')
        })
    }

    useEffect(() => {
        fetchOrderDetails();
    }, [])

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Completar Pedido"} pageTitle={"Pedidos"}/>

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