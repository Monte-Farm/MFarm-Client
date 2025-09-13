import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { useSelector } from 'react-redux';
import defaultProfileImage from '../../assets/images/default-profile-mage.jpg';
import { getLoggedinUser } from 'helpers/api_helper';

const roleMap: Record<string, string> = {
    farm_manager: 'Gerente de Granja',
    // Puedes agregar más roles aquí en el futuro
};

const ProfileDropdown = () => {
    const navigate = useNavigate();
    const userLogged = getLoggedinUser();
    const [isProfileDropdown, setIsProfileDropdown] = useState(false);
    const toggleProfileDropdown = () => setIsProfileDropdown(!isProfileDropdown);
    const friendlyRole = roleMap[userLogged.role] || userLogged.role;
    const [modals, setModals] = useState({ logout: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };


    const clicLogout = () => {
        navigate('/login')
        sessionStorage.removeItem('authUser')
    }

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
                            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">
                                {friendlyRole}
                            </span>
                        </span>
                    </span>
                </DropdownToggle>

                <DropdownMenu className="dropdown-menu-end">
                    <DropdownItem className='p-0'>
                        <Link to="/profile" className="dropdown-item">
                            <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle text-black">Perfil</span>
                        </Link>
                    </DropdownItem>

                    <div className="dropdown-divider"></div>

                    {userLogged.role === 'Superadmin' && (
                        <DropdownItem className='p-0'>
                            <Link to="/pages-profile-settings" className="dropdown-item">
                                <i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i>
                                <span className="align-middle text-black">Ajustes generales</span>
                            </Link>
                        </DropdownItem>
                    )}

                    {userLogged.role === 'farm_manager' && (
                        <DropdownItem className='p-0'>
                            <Link to="/pages-profile-settings" className="dropdown-item">
                                <i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i>
                                <span className="align-middle text-black">Ajustes de granja</span>
                            </Link>
                        </DropdownItem>
                    )}


                    <DropdownItem className='p-0'>
                        <Link onClick={() => toggleModal('logout')} className="dropdown-item" to={''}>
                            <i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle text-black">Cerrar Sesión</span>
                        </Link>
                    </DropdownItem>
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