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

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleCreateIncome = async (data: any) => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/incomes/create_income`, data);
            toggleModal('success')
        } catch (error) {
            console.error(error, 'Ha ocurrido un error al guardar los datos')
            toggleModal('error')
        }
    };

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
                <BreadCrumb title={"Nueva Entrada"} pageTitle={"Entradas"} />

                <Card className="rounded" style={{maxHeight: '75vh'}}>
                    <CardBody>
                        <IncomeForm onSubmit={handleCreateIncome} onCancel={handleCancel}></IncomeForm>
                    </CardBody>
                </Card>

            </Container>

            <SuccessModal isOpen={modals.success} onClose={handleCancel} message={"Productos ingresados exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={handleCancel} message="Ha ocurrido un error ingresando los productos, intentelo mas tarde"></ErrorModal>

        </div>
    )
}

export default CreatIncome