import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import defaultProfileImage from '../../../assets/images/default-profile-mage.jpg';
import { getLoggedinUser } from 'helpers/api_helper';
import { userRoles } from 'common/user_roles';
import { disconnectNotificationSocket } from 'helpers/socketService';

const ProfileDropdown = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userLogged = getLoggedinUser();
    const [isProfileDropdown, setIsProfileDropdown] = useState(false);
    const toggleProfileDropdown = () => setIsProfileDropdown(!isProfileDropdown);
    const [modals, setModals] = useState({ logout: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const clicLogout = () => {
        disconnectNotificationSocket(dispatch);
        sessionStorage.removeItem('authUser');
        navigate('/login');
    }

    const roleLabels = userLogged.role.map((role: string) => {
        const match = userRoles.find(r => r.value === role);
        return match ? match.label : role;
    });

    return (
        <>

            <Dropdown isOpen={isProfileDropdown} toggle={toggleProfileDropdown} className="ms-sm-3 header-item topbar-user">
                <DropdownToggle tag="button" type="button" className="btn">
                    <span className="d-flex align-items-center">
                        <img className="rounded-circle header-profile-user" src={userLogged.profile_image || defaultProfileImage} alt="Header Avatar" />
                        <span className="text-start ms-xl-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">
                                {userLogged.name} {userLogged.lastname}
                            </span>
                            <span className="d-none d-xl-flex gap-1 ms-1 flex-wrap">
                                {roleLabels.map((label: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Iterable<React.ReactNode> | null | undefined, i: React.Key | null | undefined) => (
                                    <span
                                        key={i}
                                        className="badge bg-primary-subtle text-primary fw-semibold"
                                        style={{ fontSize: '10px' }}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </span>
                        </span>
                    </span>
                </DropdownToggle>

                <DropdownMenu className="dropdown-menu-end" style={{ minWidth: '220px', padding: '0' }}>
                    {/* Header con info del usuario */}
                    <div className="px-3 py-3 text-center border-bottom">
                        <img
                            className="rounded-circle mb-2"
                            src={userLogged.profile_image || defaultProfileImage}
                            alt="Avatar"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                        <h6 className="mb-1">{userLogged.name} {userLogged.lastname}</h6>
                        <div className="d-flex gap-1 justify-content-center flex-wrap">
                            {roleLabels.map((label: any, i: number) => (
                                <span key={i} className="badge bg-success-subtle text-success" style={{ fontSize: '10px' }}>
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="py-1">
                        {(userLogged.role.includes('Superadmin') || userLogged.role.includes('farm_manager')) && (
                            <DropdownItem className='p-0'>
                                <Link to="/users/view_users" className="dropdown-item d-flex align-items-center py-2">
                                    <i className="ri-user-line fs-18 me-2 text-primary"></i>
                                    <span>Usuarios</span>
                                </Link>
                            </DropdownItem>
                        )}

                        <DropdownItem className='p-0'>
                            <Link to="/settings" className="dropdown-item d-flex align-items-center py-2">
                                <i className="mdi mdi-cog-outline fs-18 me-2 text-primary"></i>
                                <span>Configuración</span>
                            </Link>
                        </DropdownItem>
                    </div>

                    <div className="border-top py-1">
                        <DropdownItem className='p-0'>
                            <Link onClick={() => toggleModal('logout')} className="dropdown-item d-flex align-items-center py-2" to={''}>
                                <i className="mdi mdi-logout fs-18 me-2 text-danger"></i>
                                <span className="text-danger">Cerrar Sesión</span>
                            </Link>
                        </DropdownItem>
                    </div>
                </DropdownMenu>
            </Dropdown>

            <Modal isOpen={modals.logout} toggle={() => toggleModal('logout')} size="md" keyboard={false} backdrop="static" centered>
                <ModalHeader toggle={() => toggleModal('logout')}>Cerrar Sesión</ModalHeader>
                <ModalBody>
                    {`¿Estás seguro de que desea cerrar sesión?`}
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal('logout', false)}>Cancelar</Button>
                    <Button className="farm-primary-button" onClick={clicLogout}>
                        Cerrar Sesión
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default ProfileDropdown;