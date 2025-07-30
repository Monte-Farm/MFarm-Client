import BreadCrumb from "Components/Common/BreadCrumb"
import ErrorModal from "Components/Common/ErrorModal"
import PigForm from "Components/Common/PigForm"
import SuccessModal from "Components/Common/SuccessModal"
import { divide } from "lodash"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardBody, Container } from "reactstrap"

const RegisterPig = () => {
    const navigate = useNavigate();
    const [modals, setModals] = useState({ success: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Registrar Cerdo"} pageTitle={"Cerdos"} />

                <Card>
                    <CardBody>
                        <PigForm onSave={() => toggleModal('success')} onCancel={() => navigate('/pigs/view_pigs')} />
                    </CardBody>
                </Card>

            </Container>

            <SuccessModal isOpen={modals.success} onClose={() => navigate('/pigs/view_pigs')} message="Cerdo registrado exitosamente" />

        </div>
    )
}

export default RegisterPig