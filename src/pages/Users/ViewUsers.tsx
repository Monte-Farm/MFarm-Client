import { ConfigContext } from "App"
import { Attribute, UserData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import ObjectDetails from "Components/Common/Details/ObjectDetails"
import { getLoggedinUser } from "helpers/api_helper"
import { useContext, useEffect, useMemo, useState } from "react"
import { Badge, Button, Card, CardBody, CardHeader, Container, Input, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap"
import { Column } from "common/data/data_types"
import SelectableCustomTable from "Components/Common/Tables/SelectableTable"
import { roleLabels } from "common/role_labels"
import { useNavigate } from "react-router-dom"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation"
import AlertMessage from "Components/Common/Shared/AlertMesagge"
import UserForm from "Components/Common/Forms/UserForm"
import UserDetailsModal from "Components/Common/Details/UserDetails"
import defaultProfile from '../../assets/images/default-profile-mage.jpg'

const ViewUsers = () => {
    document.title = 'Ver Usuarios | Usuarios'
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser();

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelecteduser] = useState<any>()
    const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ details: false, create: false, update: false, delete: false, bulkDelete: false, bulkActivate: false });
    const [loading, setLoading] = useState<boolean>(true)
    const navigate = useNavigate();

    const columns: Column<any>[] = [
        {
            header: 'Imagen', accessor: 'profile_image', render: (_, row) => (
                <img
                    src={row.profile_image || defaultProfile}
                    alt="Imagen de Perfil"
                    style={{
                        height: "50px",
                        width: "50px",
                        borderRadius: "50%",
                        objectFit: "cover"
                    }}
                />
            ),
        },
        { header: 'Usuario', accessor: 'username', isFilterable: true, type: 'text', bgColor: '#E3F2FD' },
        { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
        { header: 'Apellido', accessor: 'lastname', isFilterable: true, type: 'text' },
        {
            header: 'Rol',
            accessor: 'role',
            isFilterable: true,
            bgColor: '#E8F5E9',
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
        {
            header: "Acciones",
            accessor: "action",
            render: (_, row: any) => (
                <div className="d-flex gap-1">
                    <Button
                        className="btn-icon"
                        color="secondary"
                        onClick={(e) => { e.stopPropagation(); handleClicModal("update", row); }}
                        disabled={row.status === false}
                        title="Editar usuario"
                    >
                        <i className="ri-pencil-fill align-middle"></i>
                    </Button>
                    <Button
                        className="btn-icon"
                        color="primary"
                        onClick={(e) => { e.stopPropagation(); setSelecteduser(row); toggleModal('details'); }}
                        title="Ver detalles"
                    >
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ];

    const handleSelectionChange = (selected: UserData[]) => {
        setSelectedUsers(selected);
    };

    const hasActiveUsers = selectedUsers.some(u => u.status === true);
    const hasInactiveUsers = selectedUsers.some(u => u.status === false);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleClicModal = async (modal: any, data: any) => {
        setSelecteduser(data);
        toggleModal(modal)
    }

    const handleFetchUsers = async () => {
        if (!configContext || !userLogged) return;
        setLoading(true)
        try {
            let response = null;
            let users = [];

            const isSuperAdmin = Array.isArray(userLogged.role) ? userLogged.role.includes("Superadmin") : userLogged.role === "Superadmin";

            if (isSuperAdmin) {
                response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_role/farm_manager`);
                users = response.data.data;
                const usersWithId = users.map((user: any) => ({
                    ...user,
                    id: user._id
                }));
                setUsers(usersWithId.filter((obj: any) => obj.username !== userLogged.username));
            } else {
                response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user`);
                users = response.data.data;
                const usersWithId = users.map((user: any) => ({
                    ...user,
                    id: user._id
                }));
                setUsers(
                    usersWithId.filter((obj: any) => {
                        const userRoles = Array.isArray(obj.role) ? obj.role : [];
                        return (
                            obj.username !== userLogged.username &&
                            !userRoles.includes("Superadmin") &&
                            !userRoles.includes("farm_manager")
                        );
                    })
                );
            }

        } catch (error) {
            console.error("Error fetching users:", error);
            setAlertConfig({ visible: true, color: "danger", message: "Ha ocurrido un error al obtener a los usuarios", });
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDeactivate = async () => {
        if (!configContext) return;

        const activeUserIds = selectedUsers
            .filter(u => u.status === true)
            .map(u => u._id);

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/user/delete_users`, { data: { userIds: activeUserIds } });
            setAlertConfig({ visible: true, color: 'success', message: `${activeUserIds.length} usuarios desactivados con éxito` });
            handleFetchUsers();
            setSelectedUsers([]);
        } catch (error) {
            console.error('Error bulk deactivating users:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al desactivar los usuarios, intentelo más tarde' });
        } finally {
            toggleModal('bulkDelete');
        }
    };

    const handleBulkActivate = async () => {
        if (!configContext) return;

        const inactiveUserIds = selectedUsers
            .filter(u => u.status === false)
            .map(u => u._id);

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/user/activate_users`, { userIds: inactiveUserIds });
            setAlertConfig({ visible: true, color: 'success', message: `${inactiveUserIds.length} usuarios activados con éxito` });
            handleFetchUsers();
            setSelectedUsers([]);
        } catch (error) {
            console.error('Error bulk activating users:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al activar los usuarios, intentelo más tarde' });
        } finally {
            toggleModal('bulkActivate');
        }
    };

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

                <Card>
                    <CardHeader>
                        <div className="d-flex justify-content-between align-items-center">
                            {selectedUsers.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedUsers.length} {selectedUsers.length === 1 ? 'usuario seleccionado' : 'usuarios seleccionados'}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-secondary-button btn-sm"
                                            disabled={!hasActiveUsers}
                                            title={!hasActiveUsers ? "No hay usuarios activos seleccionados" : undefined}
                                            onClick={() => toggleModal('bulkDelete')}
                                        >
                                            <i className="ri-forbid-line me-1"></i>
                                            Desactivar
                                        </Button>
                                        <Button
                                            className="farm-secondary-button btn-sm"
                                            disabled={!hasInactiveUsers}
                                            title={!hasInactiveUsers ? "No hay usuarios inactivos seleccionados" : undefined}
                                            onClick={() => toggleModal('bulkActivate')}
                                        >
                                            <i className="ri-check-line me-1"></i>
                                            Activar
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <Button className="farm-primary-button ms-auto" onClick={() => toggleModal("create")}>
                                <i className="ri-add-line me-2" />
                                Registrar Usuario
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody className={users.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                        {users.length === 0 ? (
                            <>
                                <i className="ri-user-unfollow-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay usuarios registrados</span>
                            </>
                        ) : (
                            <SelectableCustomTable
                                columns={columns}
                                data={users}
                                showPagination={true}
                                rowsPerPage={10}
                                onSelect={handleSelectionChange}
                                selectionOnlyOnCheckbox={true}
                            />
                        )}
                    </CardBody>
                </Card>

                {/* Modal Details */}
                <Modal size="xl" isOpen={modals.details} toggle={() => { toggleModal("details"); handleFetchUsers(); }} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("details")}><h4>Detalles de Usuario</h4></ModalHeader>
                    <ModalBody>
                        <UserDetailsModal userId={selectedUser?._id} />
                    </ModalBody>
                </Modal>

                {/* Modal Create */}
                <Modal isOpen={modals.create} toggle={() => toggleModal('create')} size="xl" keyboard={false} backdrop='static' centered>
                    <ModalHeader toggle={() => toggleModal('create')}>Nuevo Usuario</ModalHeader>
                    <ModalBody>
                        <UserForm onSave={() => { toggleModal('create'); handleFetchUsers(); }} onCancel={() => toggleModal('create', false)} defaultRole={userLogged.role.includes('Superadmin') ? 'farm_manager' : ''} currentUserRole={userLogged.role} />
                    </ModalBody>
                </Modal>

                {/* Modal Update */}
                <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered>
                    <ModalHeader toggle={() => toggleModal('update')}>Actualizar Usuario</ModalHeader>
                    <ModalBody>
                        <UserForm initialData={selectedUser} isUsernameDisable={true} onSave={() => { toggleModal('update'); handleFetchUsers(); }} onCancel={() => toggleModal('update', false)} currentUserRole={userLogged.role} />
                    </ModalBody>
                </Modal>

                {/* Modal Bulk Deactivate */}
                <Modal isOpen={modals.bulkDelete} toggle={() => toggleModal("bulkDelete")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("bulkDelete")}>Desactivar Usuarios</ModalHeader>
                    <ModalBody>
                        ¿Desea desactivar {selectedUsers.filter(u => u.status === true).length} usuarios seleccionados?
                        <div className="mt-2">
                            <small className="text-muted">
                                Esta acción desactivará los usuarios y no podrán acceder al sistema.
                            </small>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("bulkDelete", false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={handleBulkDeactivate}>Confirmar</Button>
                    </ModalFooter>
                </Modal>

                {/* Modal Bulk Activate */}
                <Modal isOpen={modals.bulkActivate} toggle={() => toggleModal("bulkActivate")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("bulkActivate")}>Activar Usuarios</ModalHeader>
                    <ModalBody>
                        ¿Desea activar {selectedUsers.filter(u => u.status === false).length} usuarios seleccionados?
                        <div className="mt-2">
                            <small className="text-muted">
                                Esta acción activará los usuarios y podrán acceder al sistema.
                            </small>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("bulkActivate", false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={handleBulkActivate}>Confirmar</Button>
                    </ModalFooter>
                </Modal>
            </Container>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewUsers