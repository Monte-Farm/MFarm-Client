import React, { useEffect, useState } from 'react';
import { Collapse } from 'reactstrap';
import { useTranslation } from 'react-i18next';

import i18n from "../../../i18n";
import languages from "../../../common/languages";

const LanguageSelector = () => {
    const { t } = useTranslation();
    const [selectedLang, setSelectedLang] = useState<string>(
        () => localStorage.getItem("I18N_LANGUAGE") || i18n.language || "sp"
    );
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handler = (lng: string) => setSelectedLang(lng);
        i18n.on("languageChanged", handler);
        return () => {
            i18n.off("languageChanged", handler);
        };
    }, []);

    const changeLanguageAction = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("I18N_LANGUAGE", lang);
        setSelectedLang(lang);
        setIsOpen(false);
    };

    const current = languages[selectedLang] || languages.sp;

    return (
        <>
            <div
                className="dropdown-item d-flex align-items-center justify-content-between py-2"
                onClick={() => setIsOpen((v) => !v)}
                style={{ cursor: 'pointer' }}
            >
                <div className="d-flex align-items-center">
                    <i className="ri-translate-2 fs-18 me-2 text-primary"></i>
                    <span>{t('profile.language')}</span>
                </div>
                <div className="d-flex align-items-center text-muted">
                    <span className="me-1 small">{current.label}</span>
                    <i className={`ri-arrow-${isOpen ? 'up' : 'down'}-s-line fs-16`}></i>
                </div>
            </div>

            <Collapse isOpen={isOpen}>
                <div className="bg-light-subtle">
                    {Object.keys(languages).map((key) => {
                        const isActive = selectedLang === key;
                        return (
                            <div
                                key={key}
                                onClick={() => changeLanguageAction(key)}
                                className="dropdown-item d-flex align-items-center justify-content-between py-2 ps-5"
                                style={{ cursor: 'pointer' }}
                            >
                                <span>{languages[key].label}</span>
                                {isActive && (
                                    <i className="ri-check-line text-success fs-18"></i>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Collapse>
        </>
    );
};

export default LanguageSelector;
