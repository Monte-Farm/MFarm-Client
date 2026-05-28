import { logger } from 'utils/logger';
import { ConfigContext } from "App"
import { UserData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { getEffectiveUser } from "helpers/impersonation_helper"
import { useContext, useEffect, useMemo, useState } from "react"
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap"
import { Column } from "common/data/data_types"
import SelectableCustomTable from "Components/Common/Tables/SelectableTable"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation"
import AlertMessage from "Components/Common/Shared/AlertMesagge"
import UserForm from "Components/Common/Forms/UserForm"
import UserDetailsModal from "Components/Common/Details/UserDetails"
import defaultProfile from '../../assets/images/default-profile-mage.jpg'

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const ViewUsers = () => {
    const { t } = useTranslation();
    document.title = t('users.pageTitle')
    const configContext = useContext(ConfigContext)
    const userLogged = getEffectiveUser();

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelecteduser] = useState<any>()
    const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ details: false, create: false, update: false, delete: false, bulkDelete: false, bulkActivate: false, toggleStatus: false, resendCredentials: false });
    const [resendingCredentials, setResendingCredentials] = useState(false);
    const [loading, setLoading] = useState<boolean>(true)
    const navigate = useNavigate();

    const columns: Column<any>[] = useMemo(() => [
        {
            header: t('users.column.image'), accessor: 'profile_image', render: (_, row) => (
                <img
                    src={row.profile_image || defaultProfile}
                    alt={t('users.column.image')}
                    style={{
                        height: "50px",
                        width: "50px",
                        borderRadius: "50%",
                        objectFit: "cover"
                    }}
                />
            ),
        },
        { header: t('users.column.username'), accessor: 'username', isFilterable: true, type: 'text', bgColor: '#E3F2FD' },
        { header: t('users.column.name'), accessor: 'name', isFilterable: true, type: 'text' },
        { header: t('users.column.lastname'), accessor: 'lastname', isFilterable: true, type: 'text' },
        {
            header: t('users.column.role'),
            accessor: 'role',
            isFilterable: true,
            bgColor: '#E8F5E9',
            render: (value: string) => t(`roles.${value}`, { defaultValue: value }),
        },
        {
            header: t('users.column.status'),
            accessor: 'status',
            isFilterable: true,
            render: (value: boolean) => (
                <Badge color={value ? 'success' : 'danger'}>
                    {value ? t('common.status.active') : t('common.status.inactive')}
                </Badge>
            ),
        },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (_, row: any) => (
                <div className="d-flex gap-1">
                    <Button
                        className="btn-icon"
                        color="secondary"
                        onClick={(e) => { e.stopPropagation(); handleClicModal("update", row); }}
                        disabled={row.status === false}
                        title={t('users.button.editTitle')}
                    >
                        <i className="ri-pencil-fill align-middle"></i>
                    </Button>
                    <Button
                        className="btn-icon"
                        color="primary"
                        onClick={(e) => { e.stopPropagation(); setSelecteduser(row); toggleModal('details'); }}
                        title={t('common.button.viewDetails')}
                    >
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <Button
                        className="btn-icon"
                        color={row.status ? 'danger' : 'success'}
                        onClick={(e) => { e.stopPropagation(); setSelecteduser(row); toggleModal('toggleStatus'); }}
                        title={row.status ? t('users.button.deactivate') : t('users.button.activate')}
                    >
                        <i className={`align-middle ${row.status ? 'ri-forbid-line' : 'ri-check-line'}`}></i>
                    </Button>
                    {row.email && (
                        <Button
                            className="btn-icon"
                            color="info"
                            onClick={(e) => { e.stopPropagation(); setSelecteduser(row); toggleModal('resendCredentials'); }}
                            title={t('users.button.resendCredentials')}
                        >
                            <i className="ri-mail-send-line align-middle"></i>
                        </Button>
                    )}
                </div>
            ),
        },
    ], [t]);

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
            logger.error("Error fetching users:", error);
            setAlertConfig({ visible: true, color: "danger", message: t('users.error.fetch') });
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
            setAlertConfig({ visible: true, color: 'success', message: t('users.success.deactivated', { val: activeUserIds.length }) });
            handleFetchUsers();
            setSelectedUsers([]);
        } catch (error) {
            logger.error('Error bulk deactivating users:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('users.error.deactivate') });
        } finally {
            toggleModal('bulkDelete');
        }
    };

    const handleToggleUserStatus = async () => {
        if (!configContext || !selectedUser) return;
        try {
            if (selectedUser.status === true) {
                await configContext.axiosHelper.delete(`${configContext.apiUrl}/user/delete_users`, { data: { userIds: [selectedUser._id] } });
                setAlertConfig({ visible: true, color: 'success', message: t('users.success.deactivated', { val: 1 }) });
            } else {
                await configContext.axiosHelper.put(`${configContext.apiUrl}/user/activate_users`, { userIds: [selectedUser._id] });
                setAlertConfig({ visible: true, color: 'success', message: t('users.success.activated', { val: 1 }) });
            }
            handleFetchUsers();
        } catch (error) {
            logger.error('Error toggling user status:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('users.error.deactivate') });
        } finally {
            toggleModal('toggleStatus', false);
        }
    };

    const handleBulkActivate = async () => {
        if (!configContext) return;

        const inactiveUserIds = selectedUsers
            .filter(u => u.status === false)
            .map(u => u._id);

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/user/activate_users`, { userIds: inactiveUserIds });
            setAlertConfig({ visible: true, color: 'success', message: t('users.success.activated', { val: inactiveUserIds.length }) });
            handleFetchUsers();
            setSelectedUsers([]);
        } catch (error) {
            logger.error('Error bulk activating users:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('users.error.activate') });
        } finally {
            toggleModal('bulkActivate');
        }
    };

    const handleResendCredentials = async () => {
        if (!configContext || !selectedUser) return;
        setResendingCredentials(true);
        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/resend_credentials/${selectedUser.username}`, {});
            setAlertConfig({ visible: true, color: 'success', message: t('users.success.resendCredentials') });
        } catch (error) {
            logger.error('Error resending credentials:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('users.error.resendCredentials') });
        } finally {
            setResendingCredentials(false);
            toggleModal('resendCredentials', false);
        }
    };

    useEffect(() => {
        handleFetchUsers();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('users.breadcrumb')} pageTitle={t('users.breadcrumbParent')} />

                <Card>
                    <CardHeader>
                        <div className="d-flex justify-content-between align-items-center">
                            {selectedUsers.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedUsers.length} {selectedUsers.length === 1 ? t('users.selection.singular') : t('users.selection.plural')}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-secondary-button btn-sm"
                                            disabled={!hasActiveUsers}
                                            title={!hasActiveUsers ? t('users.selection.noActive') : undefined}
                                            onClick={() => toggleModal('bulkDelete')}
                                        >
                                            <i className="ri-forbid-line me-1"></i>
                                            {t('users.button.deactivate')}
                                        </Button>
                                        <Button
                                            className="farm-secondary-button btn-sm"
                                            disabled={!hasInactiveUsers}
                                            title={!hasInactiveUsers ? t('users.selection.noInactive') : undefined}
                                            onClick={() => toggleModal('bulkActivate')}
                                        >
                                            <i className="ri-check-line me-1"></i>
                                            {t('users.button.activate')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <Button className="farm-primary-button ms-auto" onClick={() => toggleModal("create")}>
                                <i className="ri-add-line me-2" />
                                {t('users.button.register')}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody className={users.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                        {users.length === 0 ? (
                            <>
                                <i className="ri-user-unfollow-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t('users.empty')}</span>
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
                <Modal size="xl" isOpen={modals.details} toggle={() => { toggleModal("details"); handleFetchUsers(); }} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                    <ModalHeader toggle={() => toggleModal("details")}><h4>{t('users.modal.details')}</h4></ModalHeader>
                    <ModalBody>
                        <UserDetailsModal userId={selectedUser?._id} />
                    </ModalBody>
                </Modal>

                {/* Modal Create */}
                <Modal isOpen={modals.create} toggle={() => toggleModal('create')} size="xl" keyboard={false} backdrop='static' centered fullscreen={tabletMode}>
                    <ModalHeader toggle={() => toggleModal('create')}>{t('users.modal.create')}</ModalHeader>
                    <ModalBody>
                        <UserForm onSave={() => { toggleModal('create'); handleFetchUsers(); }} onCancel={() => toggleModal('create', false)} defaultRole={userLogged.role.includes('Superadmin') ? 'farm_manager' : ''} currentUserRole={userLogged.role} />
                    </ModalBody>
                </Modal>

                {/* Modal Update */}
                <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered fullscreen={tabletMode}>
                    <ModalHeader toggle={() => toggleModal('update')}>{t('users.modal.update')}</ModalHeader>
                    <ModalBody>
                        <UserForm initialData={selectedUser} isUsernameDisable={true} onSave={() => { toggleModal('update'); handleFetchUsers(); }} onCancel={() => toggleModal('update', false)} currentUserRole={userLogged.role} />
                    </ModalBody>
                </Modal>

                {/* Modal Toggle Status */}
                <Modal isOpen={modals.toggleStatus} toggle={() => toggleModal("toggleStatus")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("toggleStatus")}>
                        {selectedUser?.status ? t('users.modal.bulkDeactivate.title') : t('users.modal.bulkActivate.title')}
                    </ModalHeader>
                    <ModalBody>
                        {selectedUser?.status
                            ? t('users.modal.bulkDeactivate.body', { val: 1 })
                            : t('users.modal.bulkActivate.body', { val: 1 })
                        }
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={() => toggleModal("toggleStatus", false)}>{t('common.button.cancel')}</Button>
                        <Button color={selectedUser?.status ? 'danger' : 'success'} onClick={handleToggleUserStatus}>{t('common.button.confirm')}</Button>
                    </ModalFooter>
                </Modal>

                {/* Modal Bulk Deactivate */}
                <Modal isOpen={modals.bulkDelete} toggle={() => toggleModal("bulkDelete")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("bulkDelete")}>{t('users.modal.bulkDeactivate.title')}</ModalHeader>
                    <ModalBody>
                        {t('users.modal.bulkDeactivate.body', { val: selectedUsers.filter(u => u.status === true).length })}
                        <div className="mt-2">
                            <small className="text-muted">
                                {t('users.modal.bulkDeactivate.warning')}
                            </small>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("bulkDelete", false)}>{t('common.button.cancel')}</Button>
                        <Button className="farm-primary-button" onClick={handleBulkDeactivate}>{t('common.button.confirm')}</Button>
                    </ModalFooter>
                </Modal>

                {/* Modal Bulk Activate */}
                <Modal isOpen={modals.bulkActivate} toggle={() => toggleModal("bulkActivate")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("bulkActivate")}>{t('users.modal.bulkActivate.title')}</ModalHeader>
                    <ModalBody>
                        {t('users.modal.bulkActivate.body', { val: selectedUsers.filter(u => u.status === false).length })}
                        <div className="mt-2">
                            <small className="text-muted">
                                {t('users.modal.bulkActivate.warning')}
                            </small>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("bulkActivate", false)}>{t('common.button.cancel')}</Button>
                        <Button className="farm-primary-button" onClick={handleBulkActivate}>{t('common.button.confirm')}</Button>
                    </ModalFooter>
                </Modal>
                {/* Modal Resend Credentials */}
                <Modal isOpen={modals.resendCredentials} toggle={() => toggleModal("resendCredentials")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("resendCredentials", false)}>
                        {t('users.modal.resendCredentials.title')}
                    </ModalHeader>
                    <ModalBody>
                        <p>{t('users.modal.resendCredentials.body', { name: `${selectedUser?.name} ${selectedUser?.lastname}`, email: selectedUser?.email })}</p>
                        <small className="text-warning">
                            <i className="ri-error-warning-line me-1"></i>
                            {t('users.modal.resendCredentials.warning')}
                        </small>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={() => toggleModal("resendCredentials", false)} disabled={resendingCredentials}>
                            {t('common.button.cancel')}
                        </Button>
                        <Button color="info" onClick={handleResendCredentials} disabled={resendingCredentials}>
                            {resendingCredentials ? t('common.status.loading') : t('users.button.resendCredentials')}
                        </Button>
                    </ModalFooter>
                </Modal>

            </Container>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewUsers
