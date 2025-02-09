import { ConfigContext } from "App";
import { OutcomeData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import OutcomeForm from "Components/Common/OutcomeForm";
import SubwarehouseOutcomeForm from "Components/Common/SubwarehouseOutcomeForm";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, CardBody, Alert } from "reactstrap";

const CreateSubwarehouseOutcome = () => {
    document.title = 'Nueva Salida | Subalmacén';
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
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

    const handleCreateSubwarehouseOutcome = async (data: OutcomeData) => {
        if (!configContext || !configContext.userLogged) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/outcomes/create_outcome/${false}/${data.outcomeType}`, data);
            showAlert('success', 'La salida se ha creado exitosamente')
            setTimeout(() => {
                handleCancel()
            }, 5000);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al crear la salida, intentelo más tarde')
        }
    }

    const handleCancel = () => {
        history('/subwarehouse/subwarehouse_outcomes')
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Nueva Salida"} pageTitle={"Salidas"} />

                <Card>
                    <CardBody>
                        <SubwarehouseOutcomeForm onSubmit={(data: OutcomeData) => handleCreateSubwarehouseOutcome(data)} onCancel={handleCancel} />
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

export default CreateSubwarehouseOutcome