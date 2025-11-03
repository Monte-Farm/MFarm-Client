import { ConfigContext } from "App";
import { Attribute, UserData } from "common/data_interfaces";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "reactstrap";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import defaultImageProfila from '../../assets/images/default-profile-mage.jpg'
import UserHistoryItem from "Components/Common/Lists/UserHistoryItem";
import SimpleBar from "simplebar-react";
import UserForm from "Components/Common/Forms/UserForm";

const userAttributes: Attribute[] = [
    { key: 'username', label: 'Usuario', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'lastname', label: 'Apellido', type: 'text' },
    { key: 'email', label: 'Correo Electronico', type: 'text' },
    { key: 'phoneNumber', label: 'Número de Telefono', type: 'text' },
    { key: 'role', label: 'Rol', type: 'text' },
    { key: 'status', label: 'Estado', type: 'status' },
]

const UserDetails = () => {
    const { id_user } = useParams();
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [userDetails, setUserDetails] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ details: false, create: false, update: false, delete: false });
    const navigate = useNavigate();

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchUserDetails = async () => {
        if (!configContext || !id_user) return;

        setIsLoading(true)
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_mongo_id/${id_user}`)
            setUserDetails(response.data.data)
        } catch (error) {

        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateUser = async (data: UserData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/user/update_user/${userDetails?.username}`, data);
            showAlert('success', 'Usuario actualizado con éxito');
            fetchUserDetails();
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al actualizar el usuario, intentelo más tarde');
        } finally {
            toggleModal('update', false);
        }
    };


    const handleDeleteUser = async () => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/user/delete_user/${userDetails?.username}`);
            showAlert('success', 'Usuario desactivado con éxito');
            fetchUserDetails();
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al desactivar el usuario, intentelo mas tarde');
        } finally {
            toggleModal('delete', false);
        }
    };

    useEffect(() => {
        fetchUserDetails();
    }, [])

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Detalles de usuario"} pageTitle={"Usuarios"} />

                <div className="d-flex mb-3 gap-2">
                    <Button className="farm-secondary-button" onClick={() => navigate(-1)}>
                        <i className=" ri-arrow-left-line me-3"></i>
                        Regresar
                    </Button>

                    <Button className="farm-secondary-button ms-auto" onClick={() => toggleModal("delete")} disabled={!userDetails?.status}>
                        <i className="ri-delete-bin-line me-3"></i>Desactivar usuario
                    </Button>
                    <Button className="farm-primary-button" onClick={() => toggleModal("update")}>
                        <i className="ri-pencil-line me-3"></i>Modificar usuario
                    </Button>
                </div>

                <Row>
                    <Col lg={4}>
                        <Card className="">
                            <CardHeader>
                                <h4>Información del usuario</h4>
                            </CardHeader>
                            <CardBody>
                                <ObjectDetails attributes={userAttributes} object={userDetails || {}} showImage={true} imageSrc={userDetails?.profile_image ||defaultImageProfila}></ObjectDetails>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={8}>
                        <Card>
                            <CardHeader>
                                <h4>Historial de cambios</h4>
                            </CardHeader>
                            <CardBody style={{ padding: 0 }}>
                                {userDetails?.history?.length ? (
                                    <SimpleBar style={{ maxHeight: 635, padding: '1rem' }} className="scrollable-history">
                                        {userDetails.history.map((item, idx) => (
                                            <UserHistoryItem key={idx} record={item} />
                                        ))}
                                    </SimpleBar>
                                ) : (
                                    <div
                                        className="d-flex flex-column justify-content-center align-items-center text-muted fst-italic"
                                        style={{ height: '635px', fontSize: '1.1rem' }}
                                    >
                                        <i className="ri-file-info-line mb-2" style={{ fontSize: '2rem' }}></i>
                                        Sin historial disponible.
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered>
                <ModalHeader toggle={() => toggleModal('update')}>Actualizar Usuario</ModalHeader>
                <ModalBody>
                    <UserForm initialData={userDetails || undefined} isUsernameDisable={true} onSubmit={(data: UserData) => handleUpdateUser(data)} onCancel={() => toggleModal('update', false)} currentUserRole={userLogged.role} />
                </ModalBody>
            </Modal>

            {/* Modal delete */}
            <Modal isOpen={modals.delete} toggle={() => toggleModal('delete')} size="md" keyboard={false} backdrop="static" centered>
                <ModalHeader toggle={() => toggleModal('delete')}>Confirmación de Eliminación</ModalHeader>
                <ModalBody>
                    {`¿Estás seguro de que deseas desactivar al usuario ${userDetails?.username}?`}
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal('delete', false)}>Cancelar</Button>
                    <Button className="farm-primary-button" onClick={() => {
                        if (userDetails) {
                            handleDeleteUser();
                        }
                    }}
                    >
                        Eliminar
                    </Button>
                </ModalFooter>
            </Modal>

        </div>
    )
}

export default UserDetails;