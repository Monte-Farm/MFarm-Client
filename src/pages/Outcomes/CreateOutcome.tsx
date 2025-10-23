import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import ErrorModal from "Components/Common/ErrorModal";
import OutcomeForm from "Components/Common/OutcomeForm";
import SuccessModal from "Components/Common/SuccessModal";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Card, CardBody, Container } from "reactstrap";

const CreateOutcome = () => {
    document.title = 'Nueva Salida | Salidas';
    const history = useNavigate();
    const configContext = useContext(ConfigContext);

    const [modals, setModals] = useState({ success: false, error: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const handleCreateOutcome = async (outcomeData: any) => {
        if (!configContext) return;

        let createIncome: boolean = true
        if (outcomeData.outcomeType.toLowerCase() === 'merma') createIncome = false

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/outcomes/create_outcome/${createIncome}/${outcomeData.outcomeType}`, outcomeData);
            toggleModal('success')
            handlePrintOutcome(outcomeData.id)
        } catch (error) {
            console.error(error, 'Ha ocurrido un error al guardar los datos')
            toggleModal('error')
        }
    };


    const handlePrintOutcome = async (idOutcome: string) => {
        if (!configContext) return;

        try {

            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/generate_outcome_report/${idOutcome}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reporte_salida.pdf');
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al generar el reporte, inténtelo más tarde.');
        }
    };


    const handleCancel = () => {
        history('/warehouse/outcomes/view_outcomes')
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Nueva Salida"} pageTitle={"Salidas"} />

                <Card style={{ maxHeight: "75vh" }}>
                    <CardBody>
                       
                    </CardBody>
                </Card>

            </Container>

            <SuccessModal isOpen={modals.success} onClose={handleCancel} message={"Salida creada exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={handleCancel} message="Ha ocurrido un error registrando la salida, intentelo mas tarde"></ErrorModal>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </div>
    )
}

export default CreateOutcome;