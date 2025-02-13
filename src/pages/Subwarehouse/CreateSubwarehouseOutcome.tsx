import { ConfigContext } from "App";
import { OutcomeData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import ErrorModal from "Components/Common/ErrorModal";
import OutcomeForm from "Components/Common/OutcomeForm";
import SubwarehouseOutcomeForm from "Components/Common/SubwarehouseOutcomeForm";
import SuccessModal from "Components/Common/SuccessModal";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, CardBody, Alert } from "reactstrap";

const CreateSubwarehouseOutcome = () => {
    document.title = 'Nueva Salida | Subalmacén';
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };
 

    const handleCreateSubwarehouseOutcome = async (data: OutcomeData) => {
        if (!configContext || !configContext.userLogged) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/outcomes/create_outcome/${false}/${data.outcomeType}`, data);
            toggleModal('success')
        } catch (error) {
            console.error(error, 'Ha ocurrido un error creando la salida')
            toggleModal('error')
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


            <SuccessModal isOpen={modals.success} onClose={handleCancel} message={"Salida creada exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={handleCancel} message="Ha ocurrido un error creando la salida, intentelo mas tarde"></ErrorModal>

        </div>
    )
}

export default CreateSubwarehouseOutcome