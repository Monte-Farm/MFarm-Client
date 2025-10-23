import { ConfigContext } from "App";
import { OrderData, OutcomeData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CompleteOrderForm from "Components/Common/CompleteOrderForm";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import ErrorModal from "Components/Common/ErrorModal";
import SuccessModal from "Components/Common/SuccessModal";
import PDFViewer from "Components/Common/PDFViewer";

const CompleteOrder = () => {
    const history = useNavigate();
    const { id_order } = useParams();
    const configContext = useContext(ConfigContext)
    const [ordersDetails, setOrderDetails] = useState<OrderData>()
    const [loading, setLoading] = useState<boolean>(true)
    const [modals, setModals] = useState({ success: false, error: false, viewPDF: false });
    const [fileURL, setFileURL] = useState<string>('')
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })

    const handleError = (error: any, message: string) => {
        console.error(message, error)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

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
                code: lastOutcomeId,
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

    const handlePrintOrder = async () => {
        if (!configContext) return;

        try {

            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/generate_order_report/${id_order}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setFileURL(url);
            toggleModal('viewPDF')
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al generar el reporte, inténtelo más tarde.');
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
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <h5>Detalles del Pedido</h5>

                            <Button className="ms-auto farm-primary-button" onClick={handlePrintOrder}>
                                <i className="ri-download-line me-2"></i>
                                Descargar Reporte
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <CompleteOrderForm initialData={ordersDetails} onSubmit={(data: OrderData) => handleCompleteOrder(data)} onCancel={handleCancel}></CompleteOrderForm>
                    </CardBody>
                </Card>

            </Container>


            <SuccessModal isOpen={modals.success} onClose={handleCancel} message={"El pedido se ha completado exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={handleCancel} message="Ha ocurrido un error al completar el pedido, intentelo mas tarde"></ErrorModal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Pedido </ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </div>
    )
}

export default CompleteOrder;