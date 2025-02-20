import { ConfigContext } from "App";
import { PurchaseOrderData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import ErrorModal from "Components/Common/ErrorModal";
import PurchaseOrderForm from "Components/Common/PurchaseOrderForm";
import SuccessModal from "Components/Common/SuccessModal";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Container } from "reactstrap";

const CreatePurchaseOrder = () => {
    document.title = 'Nueva Orden de Compra | Ordenes de Compra'
    const history = useNavigate();
    const configContext = useContext(ConfigContext);

    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };


    const handleCreatePurchaseOrder = async (data: any) => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/purchase_orders/create_purchase_order`, data);
            toggleModal('success')
        } catch (error) {
            console.error(error, 'Ha ocurrido un error al guardar los datos')
            toggleModal('error')
        }
    };

    const handleCancel = () => {
        history('/purchase_orders/view_purchase_orders')
    }


    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Nueva Orden de Compra"} pageTitle={"Ordenes de Compra"} />

                <Card className="rounded" style={{ maxHeight: '75vh' }}>
                    <CardBody>
                        <PurchaseOrderForm onSubmit={handleCreatePurchaseOrder} onCancel={handleCancel}></PurchaseOrderForm>
                    </CardBody>
                </Card>
            </Container>



            <SuccessModal isOpen={modals.success} onClose={handleCancel} message={"Order de compra exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={handleCancel} message="Ha ocurrido un error creando la orden de compra, intentelo mas tarde"></ErrorModal>

        </div>
    )
}

export default CreatePurchaseOrder