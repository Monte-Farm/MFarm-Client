import BreadCrumb from "Components/Common/BreadCrumb";
import GroupForm from "Components/Common/GroupForm";
import SuccessModal from "Components/Common/SuccessModal";
import { getLoggedinUser } from "helpers/api_helper";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader, Container } from "reactstrap";

const CreateGroup = () => {
    const userLogged = getLoggedinUser();
    const navigate = useNavigate();
    const [modals, setModals] = useState({ success: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Crear Grupo"} pageTitle={"Grupos"} />

                <Card>
                    <CardHeader>

                    </CardHeader>
                    <CardBody>
                        <GroupForm onSave={() => toggleModal('success')} onCancel={() => navigate('/groups/view_groups')} />
                    </CardBody>
                </Card>
            </Container>

            <SuccessModal isOpen={modals.success} onClose={() => navigate('/groups/view_groups')} message={"Grupo creado con exito"} />
        </div>
    )
}

export default CreateGroup;