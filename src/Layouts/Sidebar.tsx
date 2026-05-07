import React, { useEffect } from "react";
import SimpleBar from "simplebar-react";
import VerticalLayout from "./VerticalLayouts";
import { Container } from "reactstrap";
import { useSelector } from "react-redux";
import systemLogoDark from '../assets/images/system-logo-dark.png'
import systemLogoLight from '../assets/images/system-logo-light.png'
import { GlobalConfiguration } from "common/data_interfaces";

const Sidebar = ({ layoutType }: any) => {
  const globalConfig: GlobalConfiguration | null = useSelector((s: any) => s.Configurations.globalConfig);
  const layoutModeType = useSelector((s: any) => s.Layout.layoutModeType);
  const systemLogo = layoutModeType === 'dark' ? systemLogoLight : systemLogoDark;
  const logoSrc = globalConfig?.logoUrl || systemLogo;


  useEffect(() => {
    const overlay = document.querySelector(".vertical-overlay") as HTMLElement;
    if (!overlay) return;

    const closeMenu = () => {
      document.body.classList.remove("vertical-sidebar-enable");
      const humberIcon = document.querySelector(".hamburger-icon");
      if (humberIcon) humberIcon.classList.remove("open");
    };

    // Touch: only close on tap, not when the user is scrolling
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
      if (deltaY < 10) closeMenu(); // treat as tap
    };

    overlay.addEventListener("click", closeMenu);
    overlay.addEventListener("touchstart", onTouchStart, { passive: true });
    overlay.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      overlay.removeEventListener("click", closeMenu);
      overlay.removeEventListener("touchstart", onTouchStart);
      overlay.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

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
      <div
        className="app-menu navbar-menu"
        onTouchStart={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
      >
        <div className="navbar-brand-box mt-2 mb-3 sidebar-logo-desktop">
          <span className="logo">
            <span className="logo-lg">
              <img src={logoSrc} height={100} width={200} alt="Logo del sistema" style={{ objectFit: 'contain' }} />
            </span>
            <span className="logo-sm">
              <img src={logoSrc} height={40} width={40} alt="Logo" style={{ objectFit: 'contain' }} />
            </span>
          </span>

          <button
            onClick={addEventListenerOnSmHoverMenu}
            type="button"
            className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover"
            id="vertical-hover"
          >
            <i className="ri-record-circle-line"></i>
          </button>
        </div>
        <SimpleBar
          id="scrollbar"
          style={{ maxHeight: "100vh", overscrollBehavior: 'contain' } as React.CSSProperties}
        >
          <div className="navbar-brand-box mt-2 mb-2 sidebar-logo-tablet">
            <span className="logo">
              <img src={logoSrc} height={50} width={120} alt="Logo del sistema" style={{ objectFit: 'contain' }} />
            </span>
          </div>
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
