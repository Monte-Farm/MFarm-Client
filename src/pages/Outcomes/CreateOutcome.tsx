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

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleCreateOutcome = async (outcomeData: any) => {
        if (!configContext) return;

        let createIncome: boolean = true
        if(outcomeData.outcomeType.toLowerCase() === 'merma') createIncome = false

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/outcomes/create_outcome/${createIncome}/${outcomeData.outcomeType}`,outcomeData);
            toggleModal('success')
        } catch (error) {
            console.error(error, 'Ha ocurrido un error al guardar los datos')
            toggleModal('error')
        }
    };


    const handleCancel = () => {
        history('/warehouse/outcomes/view_outcomes')
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Nueva Salida"} pageTitle={"Salidas"} />

                <Card style={{maxHeight: "75vh"}}>
                    <CardBody>
                        <OutcomeForm onSubmit={handleCreateOutcome} onCancel={handleCancel}></OutcomeForm>
                    </CardBody>
                </Card>

            </Container>
            
            <SuccessModal isOpen={modals.success} onClose={handleCancel} message={"Salida creada exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={handleCancel} message="Ha ocurrido un error registrando la salida, intentelo mas tarde"></ErrorModal>

        </div>
    )
}

export default CreateOutcome;