import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import defaultProfileImage from '../../../assets/images/default-profile-mage.jpg';
import { getLoggedinUser } from 'helpers/api_helper';
import { stopImpersonation } from 'helpers/impersonation_helper';
import { disconnectNotificationSocket } from 'helpers/socketService';
import { changeLayoutMode } from 'slices/layouts/thunk';
import { LAYOUT_MODE_TYPES } from 'Components/constants/layout';
import LanguageSelector from './LanguageDropdown';
import ChangePasswordModal from '../Shared/ChangePasswordModal';

const ProfileDropdown = () => {
    const dispatch: any = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const userLogged = getLoggedinUser();
    const layoutModeType = useSelector((state: any) => state.Layout.layoutModeType);
    const [isProfileDropdown, setIsProfileDropdown] = useState(false);
    const toggleProfileDropdown = () => {
        setIsProfileDropdown(prev => {
            // When opening on tablet, cancel Bootstrap's scrollbar padding compensation
            if (!prev) {
                requestAnimationFrame(() => {
                    document.body.style.paddingRight = '0px';
                });
            }
            return !prev;
        });
    };
    const [modals, setModals] = useState({ logout: false, changePassword: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleToggleMode = () => {
        const newMode = layoutModeType === LAYOUT_MODE_TYPES.LIGHTMODE
            ? LAYOUT_MODE_TYPES.DARKMODE
            : LAYOUT_MODE_TYPES.LIGHTMODE;
        dispatch(changeLayoutMode(newMode));
    };

    const clicLogout = () => {
        disconnectNotificationSocket(dispatch);
        stopImpersonation();
        sessionStorage.removeItem('authUser');
        navigate('/login');
    }

    const roleLabels = userLogged.role.map((role: string) => t(`roles.${role}`, { defaultValue: role }));

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
                                    <span>{t('profile.users')}</span>
                                </Link>
                            </DropdownItem>
                        )}

                        {userLogged.role.includes('Superadmin') && (
                            <DropdownItem className='p-0'>
                                <Link to="/configurations/global" className="dropdown-item d-flex align-items-center py-2">
                                    <i className="mdi mdi-cog-outline fs-18 me-2 text-primary"></i>
                                    <span>{t('profile.settings')}</span>
                                </Link>
                            </DropdownItem>
                        )}
                        {userLogged.role.includes('farm_manager') && (
                            <DropdownItem className='p-0'>
                                <Link to="/configurations/farm" className="dropdown-item d-flex align-items-center py-2">
                                    <i className="mdi mdi-cog-outline fs-18 me-2 text-primary"></i>
                                    <span>{t('profile.settings')}</span>
                                </Link>
                            </DropdownItem>
                        )}
                    </div>

                    <div className="border-top py-1">
                        <DropdownItem className="p-0" toggle={false}>
                            <div
                                className="dropdown-item d-flex align-items-center py-2"
                                onClick={() => toggleModal('changePassword')}
                                style={{ cursor: 'pointer' }}
                            >
                                <i className="ri-lock-password-line fs-18 me-2 text-primary"></i>
                                <span>{t('profile.changePassword')}</span>
                            </div>
                        </DropdownItem>
                    </div>

                    <div className="border-top py-1">
                        <DropdownItem className='p-0'>
                            <Link to="/user-manual" className="dropdown-item d-flex align-items-center py-2">
                                <i className="ri-book-open-line fs-18 me-2 text-primary"></i>
                                <span>{t('profile.userManual')}</span>
                            </Link>
                        </DropdownItem>
                        {(userLogged.role.includes('Superadmin') || userLogged.role.includes('farm_manager')) && (
                            <DropdownItem className='p-0'>
                                <Link to="/subscription" className="dropdown-item d-flex align-items-center py-2">
                                    <i className="ri-vip-crown-2-line fs-18 me-2 text-primary"></i>
                                    <span>{t('profile.subscription')}</span>
                                </Link>
                            </DropdownItem>
                        )}
                    </div>

                    <div className="border-top py-1">
                        <LanguageSelector />
                    </div>

                    <div className="border-top py-1">
                        <DropdownItem className="p-0" toggle={false}>
                            <div
                                className="dropdown-item d-flex align-items-center justify-content-between py-2"
                                onClick={handleToggleMode}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex align-items-center">
                                    <i className={`${layoutModeType === LAYOUT_MODE_TYPES.DARKMODE ? 'ri-sun-line' : 'ri-moon-line'} fs-18 me-2 text-primary`}></i>
                                    <span>{layoutModeType === LAYOUT_MODE_TYPES.DARKMODE ? t('profile.lightMode') : t('profile.darkMode')}</span>
                                </div>
                            </div>
                        </DropdownItem>
                    </div>

                    <div className="border-top py-1">
                        <DropdownItem className='p-0'>
                            <Link onClick={() => toggleModal('logout')} className="dropdown-item d-flex align-items-center py-2" to={''}>
                                <i className="mdi mdi-logout fs-18 me-2 text-danger"></i>
                                <span className="text-danger">{t('auth.logout')}</span>
                            </Link>
                        </DropdownItem>
                    </div>
                </DropdownMenu>
            </Dropdown>

            <ChangePasswordModal
                isOpen={modals.changePassword}
                onClose={() => toggleModal('changePassword', false)}
            />

            <Modal isOpen={modals.logout} toggle={() => toggleModal('logout')} size="md" keyboard={false} backdrop="static" centered>
                <ModalHeader toggle={() => toggleModal('logout')}>{t('auth.logout')}</ModalHeader>
                <ModalBody>
                    {t('auth.logoutConfirm')}
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal('logout', false)}>{t('common.button.cancel')}</Button>
                    <Button className="farm-primary-button" onClick={clicLogout}>
                        {t('auth.logout')}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default ProfileDropdown;