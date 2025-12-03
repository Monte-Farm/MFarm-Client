import { ConfigContext } from "App";
import { Attribute, UserData } from "common/data_interfaces";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useState, useEffect } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Badge, Button, Card, CardBody, CardHeader, Col, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "reactstrap";
import SimpleBar from "simplebar-react";
import UserForm from "../Forms/UserForm";
import UserHistoryItem from "../Lists/UserHistoryItem";
import ObjectDetails from "./ObjectDetails";
import { userRoles } from "common/user_roles";
import defaultImageProfila from '../../../assets/images/default-profile-mage.jpg'
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";

interface UserDetailsProps {
    userId: string
}

const UserDetailsModal: React.FC<UserDetailsProps> = ({ userId }) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [userDetails, setUserDetails] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ details: false, create: false, update: false, deactivate: false, activate: false, success: false, error: false });

    const roleLabelsMap: Record<string, string> = Object.fromEntries(
        userRoles.map(r => [r.value, r.label])
    );

    const roleColorsMap: Record<string, string> = {
        Superadmin: "danger",
        farm_manager: "primary",
        warehouse_manager: "warning",
        subwarehouse_manager: "secondary",
        general_worker: "success",
        reproduction_technician: "info",
        veterinarian: "dark",
    };

    const userAttributes: Attribute[] = [
        { key: 'username', label: 'Usuario', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'lastname', label: 'Apellido', type: 'text' },
        { key: 'email', label: 'Correo Electronico', type: 'text' },
        {
            key: 'role',
            label: 'Rol',
            type: 'text',
            render: (value: string | string[] | undefined) => {
                const roles = Array.isArray(value)
                    ? value
                    : value
                        ? [value]
                        : [];

                if (!roles.length) return <span className="text-muted">—</span>;

                return (
                    <div className="d-flex flex-wrap gap-2">
                        {roles.map((r: string) => {
                            const label = roleLabelsMap[r] || r;
                            const color = roleColorsMap[r] || "secondary";

                            return (
                                <Badge key={r} color={color} pill>
                                    {label}
                                </Badge>
                            );
                        })}
                    </div>
                );
            },
        },
        { key: 'status', label: 'Estado', type: 'status' },
    ]

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchUserDetails = async () => {
        if (!configContext || !userId) return;

        setIsLoading(true)
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_mongo_id/${userId}`)
            setUserDetails(response.data.data)
        } catch (error) {
            toggleModal('error')
        } finally {
            setIsLoading(false)
        }
    }


    const handleDeactivateUser = async () => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/user/delete_user/${userDetails?.username}`);
            toggleModal('success');
        } catch (error) {
            toggleModal('error')
        } finally {
            toggleModal('deactivate', false);
        }
    };

    const handleActivateUser = async () => {
        if (!configContext) return;
        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/user/activate_user/${userDetails?.username}`, {});
            toggleModal('success');
        } catch (error) {
            toggleModal('error')
        } finally {
            toggleModal('activate', false);
        }
    };

    useEffect(() => {
        fetchUserDetails();
    }, [])

    if (isLoading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        );
    }

    return (
        <div>
            <div className="d-flex mb-3 gap-2">
                {userDetails?.status === true ? (
                    <Button className="farm-secondary-button ms-auto" onClick={() => toggleModal("deactivate")}>
                        <i className="ri-delete-bin-line me-3"></i>Desactivar usuario
                    </Button>
                ) : (
                    <Button className="btn-success ms-auto" onClick={() => toggleModal("activate")}>
                        <i className="ri-check-line me-3"></i>Activar usuario
                    </Button>
                )}

                <Button className="farm-primary-button" onClick={() => toggleModal("update")} disabled={!userDetails?.status}>
                    <i className="ri-pencil-line me-3"></i>Modificar usuario
                </Button>
            </div>

            <Row>
                <Col lg={5}>
                    <Card className="">
                        <CardHeader>
                            <h4>Información del usuario</h4>
                        </CardHeader>
                        <CardBody>
                            <ObjectDetails attributes={userAttributes} object={userDetails || {}} showImage={true} imageSrc={userDetails?.profile_image || defaultImageProfila}></ObjectDetails>
                        </CardBody>
                    </Card>
                </Col>

                <Col lg={7}>
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


            <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered>
                <ModalHeader toggle={() => toggleModal('update')}>Actualizar Usuario</ModalHeader>
                <ModalBody>
                    <UserForm initialData={userDetails || undefined} isUsernameDisable={true} onSave={() => { toggleModal('update'); fetchUserDetails(); }} onCancel={() => toggleModal('update', false)} currentUserRole={userLogged.role} />
                </ModalBody>
            </Modal>

            {/* Modal deactivate */}
            <Modal isOpen={modals.deactivate} toggle={() => toggleModal('deactivate')} size="md" keyboard={false} backdrop="static" centered>
                <ModalHeader toggle={() => toggleModal('deactivate')}>Confirmación de desactivacion</ModalHeader>
                <ModalBody>
                    {`¿Estás seguro de que deseas desactivar al usuario ${userDetails?.username}?`}
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal('deactivate', false)}>Cancelar</Button>
                    <Button className="farm-primary-button" onClick={() => {
                        if (userDetails) {
                            handleDeactivateUser();
                        }
                    }}>
                        Desactivar
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Modal activate */}
            <Modal isOpen={modals.activate} toggle={() => toggleModal('activate')} size="md" keyboard={false} backdrop="static" centered>
                <ModalHeader toggle={() => toggleModal('activate')}>Confirmación de activacion</ModalHeader>
                <ModalBody>
                    {`¿Estás seguro de que deseas activar al usuario ${userDetails?.username}?`}
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal('activate', false)}>Cancelar</Button>
                    <Button className="farm-primary-button" onClick={() => {
                        if (userDetails) {
                            handleActivateUser();
                        }
                    }}>
                        Activar
                    </Button>
                </ModalFooter>
            </Modal>

            <SuccessModal isOpen={modals.success} onClose={() => { toggleModal('success'); fetchUserDetails() }} message={userDetails?.status === true ? 'Usuario desactivado con exito' : 'Usuario activado con exito'} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={"Ha ocurrido un error, intentelo mas tarde"} />
        </div>
    )
}

export default UserDetailsModal;