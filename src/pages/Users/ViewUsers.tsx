import { ConfigContext } from "App"
import { UserData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/BreadCrumb"
import CustomTable from "Components/Common/CustomTable"
import ObjectDetails from "Components/Common/ObjectDetails"
import UserForm from "Components/Common/UserForm"
import { getLoggedinUser } from "helpers/api_helper"
import { useContext, useEffect, useState } from "react"
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'

const userAttributes = [
    { key: 'username', label: 'Usuario' },
    { key: 'name', label: 'Nombre' },
    { key: 'lastname', label: 'Apellido' },
    { key: 'email', label: 'Correo Electronico' },
    { key: 'phone_number', label: 'Número de Telefono' },
    { key: 'role', label: 'Rol' },
    { key: 'status', label: 'Estado' },
]

const ViewUsers = () => {
    document.title = 'Ver Usuarios'
    const configContext = useContext(ConfigContext)

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelecteduser] = useState<any>()
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ details: false, create: false, update: false, delete: false });
    const [loading, setLoading] = useState<boolean>(true)

    const columns = [
        { header: 'Usuario', accessor: 'username', isFilterable: true },
        { header: 'Nombre', accessor: 'name', isFilterable: true },
        { header: 'Apellido', accessor: 'lastname', isFilterable: true },
        { header: 'Correo electronico', accessor: 'email', isFilterable: true },
        { header: 'Rol', accessor: 'role', isFilterable: true },
        {
            header: "Estado",
            accessor: "status",
            render: (value: boolean) => (
                <Badge color={value === true ? "success" : "danger"}>
                    {value === true ? "Activo" : "Inactivo"}
                </Badge>
            ),
            isFilterable: true,
        },
        {
            header: 'Acciones',
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleClicModal('details', row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>

                    <Button className="farm-primary-button btn-icon" disabled={!row.status} onClick={() => handleClicModal('update', row)}>
                        <i className="ri-pencil-fill align-middle" />
                    </Button>

                    <Button className="farm-secondary-button btn-icon" disabled={!row.status} onClick={() => handleClicModal('delete', row)}>
                        <i className="ri-delete-bin-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]



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

    const handleClicModal = async (modal: any, data: any) => {
        setSelecteduser(data);
        toggleModal(modal)
    }

    const handleFetchUsers = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user`);
            const users = response.data.data;
            const userLogged = getLoggedinUser();
            setUsers(
                users.filter(function (obj: any) {
                    return obj.username !== userLogged.username;
                })
            );
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener a los usuarios');
        } finally {
            setLoading(false);
        }
    };


    const handleCreateUser = async (data: UserData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/create_user`, data);
            showAlert('success', 'Usuario creado con éxito');
            handleFetchUsers();
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al crear el usuario, intentelo más tarde');
        } finally {
            toggleModal('create', false);
        }
    };

    const handleUpdateUser = async (data: UserData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/user/update_user/${data.username}`, data);
            showAlert('success', 'Usuario actualizado con éxito');
            handleFetchUsers();
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al actualizar el usuario, intentelo más tarde');
        } finally {
            toggleModal('update', false);
        }
    };


    const handleDeleteUser = async () => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/user/delete_user/${selectedUser.username}`);
            showAlert('success', 'Usuario desactivado con éxito');
            handleFetchUsers();
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al desactivar el usuario, intentelo mas tarde');
        } finally {
            toggleModal('delete', false);
        }
    };


    useEffect(() => {
        handleFetchUsers();
    }, [])


    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
        );
    }
    

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Usuarios"} pageTitle={"Ver Usuarios"} />

                <Card className="mt-4">
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-3" />
                                Agregar Usuario
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <CustomTable columns={columns} data={users} />
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
                        <UserForm onSubmit={(data: UserData) => handleCreateUser(data)} onCancel={() => toggleModal('create', false)} />
                    </ModalBody>
                </Modal>

                {/* Modal Update */}
                <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered>
                    <ModalHeader toggle={() => toggleModal('update')}>Actualizar Usuario</ModalHeader>
                    <ModalBody>
                        <UserForm initialData={selectedUser} isUsernameDisable={true} onSubmit={(data: UserData) => handleUpdateUser(data)} onCancel={() => toggleModal('update', false)}></UserForm>
                    </ModalBody>
                </Modal>

                {/* Modal delete */}
                <Modal isOpen={modals.delete} toggle={() => toggleModal('delete')} size="md" keyboard={false} backdrop="static" centered>
                    <ModalHeader toggle={() => toggleModal('delete')}>Confirmación de Eliminación</ModalHeader>
                    <ModalBody>
                        {`¿Estás seguro de que deseas desactivar al usuario ${selectedUser.username}?`}
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal('delete', false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={() => {
                            if (selectedUser) {
                                handleDeleteUser();
                            }
                        }}
                        >
                            Eliminar
                        </Button>
                    </ModalFooter>
                </Modal>


            </Container>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </div>
    )
}

export default ViewUsers