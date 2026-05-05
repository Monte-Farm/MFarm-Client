import React, { useEffect } from "react";
import SimpleBar from "simplebar-react";
import VerticalLayout from "./VerticalLayouts";
import { Container } from "reactstrap";
import { useSelector } from "react-redux";
import { getEffectiveUser } from "helpers/impersonation_helper";
import systemLogoDark from '../assets/images/system-logo-dark.png'
import systemLogoLight from '../assets/images/system-logo-light.png'
import { GlobalConfiguration } from "common/data_interfaces";

const Sidebar = ({ layoutType }: any) => {
  const userLogged = getEffectiveUser();
  const globalConfig: GlobalConfiguration | null = useSelector((s: any) => s.Configurations.globalConfig);
  const layoutModeType = useSelector((s: any) => s.Layout.layoutModeType);
  const systemLogo = layoutModeType === 'dark' ? systemLogoLight : systemLogoDark;
  const logoSrc = globalConfig?.logoUrl || systemLogo;


  useEffect(() => {
    var verticalOverlay = document.getElementsByClassName("vertical-overlay");
    if (verticalOverlay) {
      verticalOverlay[0].addEventListener("click", function () {
        document.body.classList.remove("vertical-sidebar-enable");
      });
    }
  });

  const addEventListenerOnSmHoverMenu = () => {
    // add listener Sidebar Hover icon on change layout from setting
    if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover-active');
    } else if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover-active') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    } else {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    }
  };

  return (
    <React.Fragment>
      <div className="app-menu navbar-menu">
        <div className="navbar-brand-box mt-2 mb-3">

          <img src={logoSrc} height={190} width={190} alt="Logo del sistema" style={{ objectFit: 'contain' }}/>

          <button
            onClick={addEventListenerOnSmHoverMenu}
            type="button"
            className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover"
            id="vertical-hover"
          >
            <i className="ri-record-circle-line"></i>
          </button>
        </div>
        <SimpleBar id="scrollbar" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <Container fluid>
            <div id="two-column-menu"></div>
            <ul className="navbar-nav" id="navbar-nav">
              <VerticalLayout layoutType={layoutType} />
            </ul>
          </Container>
        </SimpleBar>
        <div className="sidebar-background"></div>
      </div>
      <div className="vertical-overlay"></div>
    </React.Fragment>
  );
};

export default Sidebar;
