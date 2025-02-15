import { ConfigContext } from "App"
import { OrderData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/BreadCrumb"
import ErrorModal from "Components/Common/ErrorModal"
import OrderForm from "Components/Common/OrderForm"
import SuccessModal from "Components/Common/SuccessModal"
import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Card, CardBody, Container } from "reactstrap"

const CreateOrder = () => {
    document.title = 'Crear Pedido | Pedidos'
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };


    const handleCreateOrder = async (data: OrderData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/orders/create_order`, data);
            toggleModal('success')
        } catch (error) {
            console.error(error, 'Ha ocurrido un error al crear el pedido')
            toggleModal('error')
        }
    };

    const handleCancel = () => {
        history('/orders/send_orders');
    }


    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Crear Pedido"} pageTitle={"Pedidos"}></BreadCrumb>

                <Card style={{maxHeight: "75vh"}}>
                    <CardBody>
                        <OrderForm onSubmit={(data: OrderData) => handleCreateOrder(data)} onCancel={handleCancel}></OrderForm>
                    </CardBody>
                </Card>
            </Container>

            <SuccessModal isOpen={modals.success} onClose={handleCancel} message={"Pedido creado exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={handleCancel} message="Ha ocurrido un error al crear el pedido, intentelo mas tarde"></ErrorModal>

        </div>
    )
}

export default CreateOrder