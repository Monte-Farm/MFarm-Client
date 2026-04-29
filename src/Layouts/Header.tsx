import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownMenu, DropdownToggle, Form, Input } from 'reactstrap';

import { changeSidebarVisibility } from '../slices/thunks';
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from 'reselect';
import Configuration from 'Components/Common/Velzon/Configuration';
import { ConfigContext } from 'App';
import { getLoggedinUser } from 'helpers/api_helper';
import { stopImpersonation } from 'helpers/impersonation_helper';
import LogoSystem from '../assets/images/logo.png'
import { FarmData, SubwarehouseData } from 'common/data_interfaces';
import ProfileDropdown from 'Components/Common/Velzon/ProfileDropdown';
import NotificationDropdown from 'Components/Common/Notifications/NotificationDropdown';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Header = ({ onChangeLayoutMode, layoutModeType, headerClass }: any) => {
    const dispatch: any = useDispatch();
    const configContext = useContext(ConfigContext)
    const navigate = useNavigate();
    const { t } = useTranslation();
    const userLogged = getLoggedinUser();
    const impersonation = configContext?.impersonation ?? null;
    const [assigment, setAssigment] = useState<SubwarehouseData | null>(null)
    const [farmName, setFarmName] = useState<string>("")
    const [farms, setFarms] = useState<FarmData[]>([])

    const realRoles: string[] = Array.isArray(userLogged?.role) ? userLogged.role : [userLogged?.role];
    const isSuperadmin = realRoles.includes('Superadmin');

    useEffect(() => {
        const fetchFarmName = async () => {
            if (!userLogged || !userLogged.farm_assigned) return;
            if (impersonation) return;
            if (isSuperadmin) return;
            try {
                const response = await configContext?.axiosHelper.get(`${configContext.apiUrl}/farm/find_by_id/${userLogged.farm_assigned}`)
                const farm = response?.data?.data
                if (farm?.name) setFarmName(farm.name)
            } catch (error) {
                console.error("Error fetching farm name:", error)
            }
        }
        fetchFarmName()
    }, [configContext, userLogged?.farm_assigned, userLogged?.role, impersonation])

    useEffect(() => {
        if (!isSuperadmin || impersonation || !configContext) return;
        configContext.axiosHelper
            .get(`${configContext.apiUrl}/farm/find_all`)
            .then((res) => setFarms(res.data.data || []))
            .catch(() => setFarms([]));
    }, [isSuperadmin, impersonation])

    const handleExitImpersonation = () => {
        stopImpersonation();
        configContext?.setImpersonation(null);
        navigate('/farms/view_farms');
    };

    const selectDashboardData = createSelector(
        (state) => state.Layout,
        (sidebarVisibilitytype) => sidebarVisibilitytype.sidebarVisibilitytype
    );
    // Inside your component
    const sidebarVisibilitytype = useSelector(selectDashboardData);


    const [search, setSearch] = useState<boolean>(false);
    const toogleSearch = () => {
        setSearch(!search);
    };


    const toogleMenuBtn = () => {
        var windowSize = document.documentElement.clientWidth;
        const humberIcon = document.querySelector(".hamburger-icon") as HTMLElement;
        dispatch(changeSidebarVisibility("show"));

        if (windowSize > 767)
            humberIcon.classList.toggle('open');

        //For collapse horizontal menu
        if (document.documentElement.getAttribute('data-layout') === "horizontal") {
            document.body.classList.contains("menu") ? document.body.classList.remove("menu") : document.body.classList.add("menu");
        }

        //For collapse vertical and semibox menu
        if (sidebarVisibilitytype === "show" && (document.documentElement.getAttribute('data-layout') === "vertical" || document.documentElement.getAttribute('data-layout') === "semibox")) {
            if (windowSize < 1025 && windowSize > 767) {
                document.body.classList.remove('vertical-sidebar-enable');
                (document.documentElement.getAttribute('data-sidebar-size') === 'sm') ? document.documentElement.setAttribute('data-sidebar-size', '') : document.documentElement.setAttribute('data-sidebar-size', 'sm');
            } else if (windowSize > 1025) {
                document.body.classList.remove('vertical-sidebar-enable');
                (document.documentElement.getAttribute('data-sidebar-size') === 'lg') ? document.documentElement.setAttribute('data-sidebar-size', 'sm') : document.documentElement.setAttribute('data-sidebar-size', 'lg');
            } else if (windowSize <= 767) {
                document.body.classList.add('vertical-sidebar-enable');
                document.documentElement.setAttribute('data-sidebar-size', 'lg');
            }
        }


        //Two column menu
        if (document.documentElement.getAttribute('data-layout') === "twocolumn") {
            document.body.classList.contains('twocolumn-panel') ? document.body.classList.remove('twocolumn-panel') : document.body.classList.add('twocolumn-panel');
        }
    };

    return (
        <React.Fragment>
            <header id="page-topbar" className={headerClass}>
                <div className="layout-width">
                    <div className="navbar-header">
                        <div className="d-flex align-items-center">

                            <div className="navbar-brand-box horizontal-logo">
                                <Link to="/home" className="logo logo-dark">
                                    <span className="logo-sm">
                                        <img src={LogoSystem} alt="" height="60" />
                                    </span>
                                    <span className="logo-lg">
                                        <img src={LogoSystem} alt="" height="60" />
                                    </span>
                                </Link>

                                <Link to="/home" className="logo logo-light">
                                    <span className="logo-sm">
                                        <img src={LogoSystem} alt="" height="60" />
                                    </span>
                                    <span className="logo-lg">
                                        <img src={LogoSystem} alt="" height="60" />
                                    </span>
                                </Link>
                            </div>

                            <button hidden
                                onClick={toogleMenuBtn}
                                type="button"
                                className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                                id="topnav-hamburger-icon">
                                <span className="hamburger-icon">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                            </button>


                            {impersonation ? (
                                <div className="d-none d-md-flex align-items-center ms-3 gap-2">
                                    <div className="farm-name-pill farm-name-pill--impersonating" title={impersonation.farm_name}>
                                        <i className="ri-eye-line fs-16 me-2 farm-name-pill-icon"></i>
                                        <span className="fw-semibold text-truncate farm-name-pill-text" style={{ letterSpacing: "0.2px" }}>
                                            {impersonation.farm_name}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-sm farm-exit-impersonation-btn"
                                        onClick={handleExitImpersonation}
                                        title="Salir del modo granja"
                                    >
                                        <i className="ri-logout-box-line me-1" />
                                        Salir
                                    </button>
                                </div>
                            ) : isSuperadmin ? (
                                <div className="d-none d-md-flex align-items-center ms-3 gap-2">
                                    <i className="ri-building-line farm-name-pill-icon fs-16" />
                                    <Input
                                        type="select"
                                        bsSize="sm"
                                        value={configContext?.superadminFarmId ?? ''}
                                        onChange={(e) => configContext?.setSuperadminFarmId(e.target.value)}
                                        className="farm-selector-input"
                                    >
                                        <option value="">{t('common.allFarms')}</option>
                                        {farms.map((f) => (
                                            <option key={f._id} value={f._id}>{f.name}</option>
                                        ))}
                                    </Input>
                                </div>
                            ) : (farmName && (
                                <div className="d-none d-md-flex align-items-center ms-3 farm-name-pill" title={farmName}>
                                    <i className="ri-home-4-fill fs-16 me-2 farm-name-pill-icon"></i>
                                    <span className="fw-semibold text-truncate farm-name-pill-text" style={{ letterSpacing: "0.2px" }}>
                                        {farmName}
                                    </span>
                                </div>
                            ))}

                            {/* <SearchOption /> */}
                        </div>

                        <div className="d-flex align-items-center">

                            <Dropdown isOpen={search} toggle={toogleSearch} className="d-md-none topbar-head-dropdown header-item">
                                <DropdownToggle type="button" tag="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle">
                                    <i className="bx bx-search fs-22"></i>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-lg dropdown-menu-end p-0">
                                    <Form className="p-3">
                                        <div className="form-group m-0">
                                            <div className="input-group">
                                                <input type="text" className="form-control" placeholder="Search ..."
                                                    aria-label="Recipient's username" />
                                                <button className="btn btn-primary" type="submit"><i
                                                    className="mdi mdi-magnify"></i></button>
                                            </div>
                                        </div>
                                    </Form>
                                </DropdownMenu>
                            </Dropdown>

                            {/* LanguageDropdown */}
                            {/* <LanguageDropdown /> */}

                            {/* WebAppsDropdown */}
                            {/* <WebAppsDropdown /> */}

                            {/* MyCartDropdwon */}
                            { /* <MyCartDropdown /> */}

                            {/* FullScreenDropdown */}
                            {/* <FullScreenDropdown /> */}

                            
                            

                            {/* Dark/Light Mode set */}
                            {/* <LightDark
                                layoutMode={layoutModeType}
                                onChangeLayoutMode={onChangeLayoutMode}
                            /> */}

                            {userLogged?.role === "Superadmin" && <Configuration />}

                            {/* NotificationDropdown */}
                            <NotificationDropdown />

                            {/* ProfileDropdown */}
                            <ProfileDropdown />

                        </div>
                    </div>
                </div>
            </header>
        </React.Fragment>
    );
};

export default Header;