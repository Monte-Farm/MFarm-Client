import BreadCrumb from "Components/Common/BreadCrumb";
import OutcomeForm, { OutcomeData } from "Components/Common/OutcomeForm";
import { APIClient } from "helpers/api_helper";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Card, CardBody, Container } from "reactstrap";

const CreateOutcome = () => {
    document.title = 'Nueva Salida';
    const apiUrl = process.env.REACT_APP_API_URL;
    const axiosHelper = new APIClient();
    const history = useNavigate()

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });

    const handleError = (error: any, message: string) => {
        console.error(message, error)
        setAlertConfig({ visible: true, color: 'danger', message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }


    const handleCreateOutcome = async (outcomeData: any) => {

        await axiosHelper.create(`${apiUrl}/outcomes/create_outcome/${true}/${outcomeData.outcomeType}`, outcomeData)
            .then((response) => {
                showAlert('success', 'La salida se ha creado con éxito')
                setTimeout(() => {
                    handleCancel()
                }, 2500);
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al crear la salida, intentelo más tarde')
            })
    }

    const handleCancel = () => {
        history('/warehouse/outcomes/view_outcomes')
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Nueva Salida"} pageTitle={"Salidas"} />

                <Card style={{ height: '85vh' }}>
                    <CardBody>
                        <OutcomeForm onSubmit={handleCreateOutcome} onCancel={handleCancel}></OutcomeForm>
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

export default CreateOutcome;