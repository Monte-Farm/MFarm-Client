import { ConfigContext } from "App"
import { OrderData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/BreadCrumb"
import OrderForm from "Components/Common/OrderForm"
import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Card, CardBody, Container } from "reactstrap"

const CreateOrder = () => {
    document.title = 'Crear Pedido'
    const history = useNavigate();
    const configContext = useContext(ConfigContext);

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const handleError = (error: any, message: string) => {
        console.error(error, message)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const showAlert = (message: string) => {
        setAlertConfig({ visible: true, color: 'success', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const handleCreateOrder = async (data: OrderData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/orders/create_order`, data);
            showAlert(`El pedido ${data.id} se ha generado con éxito`);

            setTimeout(() => {
                history('/orders/send_orders');
            }, 5000);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al generar el pedido, intentelo más tarde');
        }
    };


    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Crear Pedido"} pageTitle={"Pedidos"}></BreadCrumb>

                <Card>
                    <CardBody>
                        <OrderForm onSubmit={(data: OrderData) => handleCreateOrder(data)} onCancel={() => history(-1)}></OrderForm>
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

export default CreateOrder