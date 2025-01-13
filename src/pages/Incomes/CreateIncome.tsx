import BreadCrumb from "Components/Common/BreadCrumb"
import IncomeForm, { IncomeData } from "Components/Common/IncomeForm"
import { APIClient } from "helpers/api_helper"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Card, CardBody, Container } from "reactstrap"



const CreatIncome = () => {
    document.title = 'New Income | Warehouse'
    const apiUrl = process.env.REACT_APP_API_URL;
    const axiosHelper = new APIClient()
    const history = useNavigate();

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({visible: true, color: color, message: message})
        setTimeout(() => {
            setAlertConfig({...alertConfig, visible: false})
        }, 5000);
    }

    const handleCreateIncome = async (data: any) => {
        await axiosHelper.create(`${apiUrl}/incomes/create_income`, data)
            .then((response) => {
                showAlert('success', 'Entrada creada con éxito')
                setTimeout(() => history('/warehouse/incomes/view_incomes'), 2500);
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error guardando la información, intentelo más tarde')
            })
    }

    const handleCancel = () => {
        if (window.history.length > 1) {
            history(-1)
        } else {
            history('/warehouse/incomes/view_incomes')
        }
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"New Income"} pageTitle={"Incomes"} />

                <Card className="rounded">
                    <CardBody>
                        <IncomeForm onSubmit={handleCreateIncome} onCancel={handleCancel}></IncomeForm>
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

export default CreatIncome