import React, { useEffect } from 'react';
import PropTypes from "prop-types";
import { Link } from 'react-router-dom';
import { Collapse } from 'reactstrap';
import withRouter from '../../Components/Common/withRouter';

// Import Data
import navdata from "../LayoutMenuData";
//i18n
import { withTranslation } from "react-i18next";

const HorizontalLayout = (props: any) => {
    const navData = navdata().props.children;
    const path = props.router.location.pathname;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const initMenu = () => {
            const pathName = process.env.PUBLIC_URL + path;
            const ul = document.getElementById("navbar-nav") as HTMLElement;
            const items: any = ul.getElementsByTagName("a");
            let itemsArray = [...items]; // converts NodeList to Array
            removeActivation(itemsArray);
            let matchingMenuItem = itemsArray.find((x) => {
                return x.pathname === pathName;
            });
            if (matchingMenuItem) {
                activateParentDropdown(matchingMenuItem);
            }
        };
        initMenu();
    }, [path, props.layoutType]);

    function activateParentDropdown(item: any) {
        item.classList.add("active");
        let parentCollapseDiv = item.closest(".collapse.menu-dropdown");

        if (parentCollapseDiv) {
            parentCollapseDiv.classList.add("show");
            parentCollapseDiv.parentElement.children[0].classList.add("active");
            parentCollapseDiv.parentElement.children[0].setAttribute("aria-expanded", "true");
            if (parentCollapseDiv.parentElement.closest(".collapse.menu-dropdown")) {
                parentCollapseDiv.parentElement.closest(".collapse").classList.add("show");
                const parentElementDiv = parentCollapseDiv.parentElement.closest(".collapse").previousElementSibling;
                if (parentElementDiv)
                    if (parentElementDiv.closest(".collapse"))
                        parentElementDiv.closest(".collapse").classList.add("show");
                parentElementDiv.classList.add("active");
                const parentElementSibling = parentElementDiv.parentElement.parentElement.parentElement.previousElementSibling;
                if (parentElementSibling) {
                    parentElementSibling.classList.add("active");
                }
            }
            return false;
        }
        return false;
    }

    const removeActivation = (items: any) => {
        let actiItems = items.filter((x: any) => x.classList.contains("active"));

        actiItems.forEach((item: any) => {
            if (item.classList.contains("menu-link")) {
                if (!item.classList.contains("active")) {
                    item.setAttribute("aria-expanded", false);
                }
                if (item.nextElementSibling) {
                    item.nextElementSibling.classList.remove("show");
                }
            }
            if (item.classList.contains("nav-link")) {
                if (item.nextElementSibling) {
                    item.nextElementSibling.classList.remove("show");
                }
                item.setAttribute("aria-expanded", false);
            }
            item.classList.remove("active");
        });
    };

    return (
        <React.Fragment>
            {(navData || []).map((item: any, key: number) => (
                <React.Fragment key={key}>
                    {/* Main Header */}
                    {!item['isHeader'] ? (
                        item.subItems ? (
                            <li className="nav-item">
                                <Link
                                    onClick={item.click}
                                    className="nav-link menu-link"
                                    to={item.link ? item.link : "/#"}
                                    data-bs-toggle="collapse"
                                >
                                    <i className={item.icon}></i> <span>{props.t(item.label)}</span>
                                </Link>
                                <Collapse className="menu-dropdown" isOpen={item.stateVariables} id="sidebarApps">
                                    <ul className="nav nav-sm flex-column">
                                        {(item.subItems || []).map((subItem: any, key: number) => (
                                            <li className="nav-item" key={key}>
                                                <Link
                                                    to={subItem.link ? subItem.link : "/#"}
                                                    className="nav-link"
                                                >
                                                    {props.t(subItem.label)}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </Collapse>
                            </li>
                        ) : (
                            <li className="nav-item">
                                <Link
                                    className="nav-link menu-link"
                                    to={item.link ? item.link : "/#"}
                                >
                                    <i className={item.icon}></i> <span>{props.t(item.label)}</span>
                                </Link>
                            </li>
                        )
                    ) : (
                        <li className="menu-title">
                            <span>{props.t(item.label)}</span>
                        </li>
                    )}
                </React.Fragment>
            ))}
        </React.Fragment>
    );
};

HorizontalLayout.propTypes = {
    location: PropTypes.object,
    t: PropTypes.any,
};

export default withRouter(withTranslation()(HorizontalLayout));
