import { ConfigContext } from "App"
import { Attribute, UserData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import ObjectDetails from "Components/Common/Details/ObjectDetails"
import { getLoggedinUser } from "helpers/api_helper"
import { useContext, useEffect, useMemo, useState } from "react"
import { Badge, Button, Card, CardBody, CardHeader, Container, Input, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap"
import { Column } from "common/data/data_types"
import UserCards from "Components/Common/Lists/UserCards"
import { roleLabels } from "common/role_labels"
import { useNavigate } from "react-router-dom"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation"
import AlertMessage from "Components/Common/Shared/AlertMesagge"
import UserForm from "Components/Common/Forms/UserForm"

const userAttributes: Attribute[] = [
    { key: 'username', label: 'Usuario', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'lastname', label: 'Apellido', type: 'text' },
    { key: 'email', label: 'Correo Electronico', type: 'text' },
    { key: 'role', label: 'Rol', type: 'text' },
    { key: 'status', label: 'Estado', type: 'status' },
]

const ViewUsers = () => {
    document.title = 'Ver Usuarios | Usuarios'
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser();

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelecteduser] = useState<any>()
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ details: false, create: false, update: false, delete: false });
    const [loading, setLoading] = useState<boolean>(true)
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const columns: Column<any>[] = [
        { header: 'Usuario', accessor: 'username', isFilterable: true, type: 'text' },
        { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
        { header: 'Apellido', accessor: 'lastname', isFilterable: true, type: 'text' },
        {
            header: 'Rol',
            accessor: 'role',
            isFilterable: true,
            render: (value: string) => roleLabels[value] || value,
        },
        {
            header: 'Estado',
            accessor: 'status',
            isFilterable: true,
            render: (value: boolean) => (
                <Badge color={value ? 'success' : 'danger'}>
                    {value ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
    ];


    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleClicModal = async (modal: any, data: any) => {
        setSelecteduser(data);
        toggleModal(modal)
    }

    const handleFetchUsers = async () => {
        if (!configContext || !userLogged) return;

        try {
            let response = null;
            let users = [];
            if (userLogged.role === 'Superadmin') {
                response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_role/farm_manager`)
                users = response.data.data;
                setUsers(
                    users.filter(function (obj: any) {
                        return obj.username !== userLogged.username;
                    })
                );
            } else {
                response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user`)
                users = response.data.data;
                setUsers(
                    users.filter(function (obj: any) {
                        return obj.username !== userLogged.username && obj.role !== 'Superadmin' && obj.role !== 'farm_manager';
                    })
                );
            }

        } catch (error) {
            console.error('Error fetching users:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener a los usuarios' });
        } finally {
            setLoading(false);
        }
    };


    const handleCreateUser = async (data: UserData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/create_user`, data);
            setAlertConfig({ visible: true, color: 'success', message: 'Usuario creado con éxito' });
            handleFetchUsers();
        } catch (error) {
            console.error('Error creating the user:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al crear el usuario, intentelo mas tarde' });
        } finally {
            toggleModal('create', false);
        }
    };

    const handleUpdateUser = async (data: UserData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/user/update_user/${data.username}`, data);
            setAlertConfig({ visible: true, color: 'success', message: 'Usuario actualizado con éxito' });
            handleFetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al actualizar el usuario, intentelo mas tarde' });
        } finally {
            toggleModal('update', false);
        }
    };


    const handleDeleteUser = async () => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/user/delete_user/${selectedUser.username}`);
            setAlertConfig({ visible: true, color: 'success', message: 'Usuario eliminado con éxito' });
            handleFetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al eliminar el usuario, intentelo mas tarde' });
        } finally {
            toggleModal('delete', false);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lowerSearch = searchTerm.toLowerCase();
        return users.filter(user =>
            columns.some(col => {
                const value = (user as any)[col.accessor];
                if (value === undefined || value === null) return false;
                return value.toString().toLowerCase().includes(lowerSearch);
            })
        );
    }, [searchTerm, users, columns]);


    useEffect(() => {
        handleFetchUsers();
    }, [])


    if (loading) {
        return (
            <LoadingAnimation />
        );
    }


    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Usuarios Registrados"} pageTitle={"Usuarios"} />

                <Card style={{ minHeight: "calc(100vh - 220px)" }}>
                    <CardHeader>
                        <div className="d-flex gap-3">
                            <Input
                                placeholder="Buscar usuario..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="fs-5"
                            />

                            <Button
                                className="ms-auto farm-primary-button"
                                onClick={() => toggleModal("create")}
                                style={{ width: "200px" }}
                            >
                                <i className="ri-add-line me-3" />
                                Registrar Usuario
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody
                        className={
                            filteredUsers.length === 0
                                ? "d-flex flex-column justify-content-center align-items-center text-center"
                                : "d-flex flex-column flex-grow-1"
                        }
                        style={{ maxHeight: "calc(80vh - 100px)", overflowY: "auto" }}
                    >
                        {filteredUsers.length === 0 ? (
                            <>
                                <i className="ri-user-unfollow-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay usuarios registrados</span>
                            </>
                        ) : (
                            <UserCards
                                columns={columns}
                                data={filteredUsers}
                                onDetailsClick={(user) => navigate(`/users/user_details/${user._id}`)}
                                onCardClick={(user) => navigate(`/users/user_details/${user._id}`)}
                                onEditClick={(user) => handleClicModal("update", user)}
                                onDeleteClick={(user) => handleClicModal("delete", user)}
                                imageAccessor="profile_image"
                            />
                        )}
                    </CardBody>
                </Card>

                {/* Modal Details */}
                <Modal size="lg" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("details")}><h4>Detalles de Usuario</h4></ModalHeader>
                    <ModalBody>
                        {selectedUser && (
                            <ObjectDetails attributes={userAttributes} object={selectedUser} showImage={true}></ObjectDetails>
                        )}
                    </ModalBody>
                </Modal>

                {/* Modal Create */}
                <Modal isOpen={modals.create} toggle={() => toggleModal('create')} size="xl" keyboard={false} backdrop='static' centered>
                    <ModalHeader toggle={() => toggleModal('create')}>Nuevo Usuario</ModalHeader>
                    <ModalBody>
                        <UserForm onSubmit={(data: UserData) => handleCreateUser(data)} onCancel={() => toggleModal('create', false)} defaultRole={userLogged.role === 'Superadmin' ? 'farm_manager' : ''} currentUserRole={userLogged.role} />
                    </ModalBody>
                </Modal>

                {/* Modal Update */}
                <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered>
                    <ModalHeader toggle={() => toggleModal('update')}>Actualizar Usuario</ModalHeader>
                    <ModalBody>
                        <UserForm initialData={selectedUser} isUsernameDisable={true} onSubmit={(data: UserData) => handleUpdateUser(data)} onCancel={() => toggleModal('update', false)} currentUserRole={userLogged.role} />
                    </ModalBody>
                </Modal>

                {/* Modal delete */}
                <Modal isOpen={modals.delete} toggle={() => toggleModal('delete')} size="md" keyboard={false} backdrop="static" centered>
                    <ModalHeader toggle={() => toggleModal('delete')}>Confirmación de Eliminación</ModalHeader>
                    <ModalBody>
                        {`¿Estás seguro de que deseas desactivar al usuario ${selectedUser?.username}?`}
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal('delete', false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={() => {
                            if (selectedUser) {
                                handleDeleteUser();
                            }
                        }}>
                            Eliminar
                        </Button>
                    </ModalFooter>
                </Modal>


            </Container>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewUsers