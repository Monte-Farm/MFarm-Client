import React, { useEffect, useState } from 'react';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { get } from "lodash";

import i18n from "../../../i18n";
import languages from "../../../common/languages";

const LanguageDropdown = () => {
    const [selectedLang, setSelectedLang] = useState("");

    useEffect(() => {
        const currentLanguage: string = localStorage.getItem("I18N_LANGUAGE") || "en";
        setSelectedLang(currentLanguage);
    }, []);

    const changeLanguageAction = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("I18N_LANGUAGE", lang);
        setSelectedLang(lang);
    };

    const [isLanguageDropdown, setIsLanguageDropdown] = useState<boolean>(false);
    const toggleLanguageDropdown = () => {
        setIsLanguageDropdown(!isLanguageDropdown);
    };

    return (
        <React.Fragment>
            <Dropdown isOpen={isLanguageDropdown} toggle={toggleLanguageDropdown} className="ms-1 topbar-head-dropdown header-item">
                <DropdownToggle className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle" tag="button">
                    <i className="ri-translate-2" style={{ fontSize: '22px' }}></i>
                </DropdownToggle>
                <DropdownMenu className="notify-item language py-2">
                    {Object.keys(languages).map(key => (
                        <DropdownItem
                            key={key}
                            onClick={() => changeLanguageAction(key)}
                            className={`notify-item ${selectedLang === key ? "active" : "none"}`}
                        >
                            <span className="align-middle">
                                {languages[key]?.label}
                            </span>
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default LanguageDropdown;
