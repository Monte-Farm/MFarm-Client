import { ConfigContext } from "App"
import BreadCrumb from "Components/Common/BreadCrumb"
import ErrorModal from "Components/Common/ErrorModal"
import IncomeForm from "Components/Common/IncomeForm"
import SuccessModal from "Components/Common/SuccessModal"
import { APIClient } from "helpers/api_helper"
import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Card, CardBody, Container } from "reactstrap"
import { boolean } from "yup"



const CreatIncome = () => {
    document.title = 'Nueva Entrada | Almacén'
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

    const handleCreateIncome = async (data: any) => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/incomes/create_income`, data);
            handlePrintIncome(data.id)
            toggleModal('success')
        } catch (error) {
            console.error(error, 'Ha ocurrido un error al guardar los datos')
            toggleModal('error')
        }
    };

    const handlePrintIncome = async (idIncome: string) => {
        if (!configContext) return;

        try {

            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/generate_income_report/${idIncome}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reporte_entrada.pdf');
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al generar el reporte, inténtelo más tarde.');
        }
    };

    const handleCancel = () => {
        history('/warehouse/incomes/view_incomes')
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Nueva Entrada"} pageTitle={"Entradas"} />

                <Card className="rounded" style={{ maxHeight: '75vh' }}>
                    <CardBody>
                        <IncomeForm onSubmit={handleCreateIncome} onCancel={handleCancel}></IncomeForm>
                    </CardBody>
                </Card>

            </Container>

            <SuccessModal isOpen={modals.success} onClose={handleCancel} message={"Productos ingresados exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={handleCancel} message="Ha ocurrido un error ingresando los productos, intentelo mas tarde"></ErrorModal>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </div>
    )
}

export default CreatIncome