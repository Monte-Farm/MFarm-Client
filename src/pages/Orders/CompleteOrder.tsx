import { ConfigContext } from "App";
import { OrderData, OutcomeData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CompleteOrderForm from "Components/Common/CompleteOrderForm";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Card, CardBody, Container } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import ErrorModal from "Components/Common/ErrorModal";
import SuccessModal from "Components/Common/SuccessModal";

const CompleteOrder = () => {
    const history = useNavigate();
    const { id_order } = useParams();
    const configContext = useContext(ConfigContext)
    const [ordersDetails, setOrderDetails] = useState<OrderData>()
    const [loading, setLoading] = useState<boolean>(true)
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };


    const fetchOrderDetails = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/orders/find_id/${id_order}`);
            setOrderDetails(response.data.data);
        } catch (error) {
            console.error(error, 'Ha ocurrido un error obteniendo la información del pedido')
            toggleModal('error')
        } finally {
            setLoading(false)
        }
    };

    const handleCompleteOrder = async (data: OrderData) => {
        if (!configContext) return;
        try {
            data.status = 'completed';
            await configContext.axiosHelper.put(`${configContext.apiUrl}/orders/update_order/${data.id}`, data);

            await createOutcome(data);
        } catch (error) {
            toggleModal('error')
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
                totalPrice: 0,
                description: 'N/A'
            };

            await configContext.axiosHelper.create(`${configContext.apiUrl}/outcomes/create_outcome/true/order`, outcomeData);
            toggleModal('success')

        } catch (error) {
            throw error
        }
    };

    const handleCancel = () => {
        history('/orders/send_orders')
    }


    useEffect(() => {
        fetchOrderDetails();
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
                <BreadCrumb title={"Completar Pedido"} pageTitle={"Pedidos"} />

                <Card>
                    <CardBody>
                        <CompleteOrderForm initialData={ordersDetails} onSubmit={(data: OrderData) => handleCompleteOrder(data)} onCancel={handleCancel}></CompleteOrderForm>
                    </CardBody>
                </Card>

            </Container>


            <SuccessModal isOpen={modals.success} onClose={handleCancel} message={"El pedido se ha completado exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={handleCancel} message="Ha ocurrido un error al completar el pedido, intentelo mas tarde"></ErrorModal>


        </div>
    )
}

export default CompleteOrder;