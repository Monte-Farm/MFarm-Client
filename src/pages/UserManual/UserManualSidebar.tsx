import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ManualCategory } from "./userManualSections";

interface Props {
  categories: ManualCategory[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
}

const UserManualSidebar = ({ categories, activeSectionId, onSelectSection }: Props) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [openCategory, setOpenCategory] = useState<string>("");

  useEffect(() => {
    const parentCategory = categories.find((cat) =>
      cat.sections.some((s) => s.id === activeSectionId)
    );
    if (parentCategory) {
      setOpenCategory(parentCategory.id);
    }
  }, [activeSectionId, categories]);

  const filteredCategories = categories
    .map((cat) => {
      if (!searchTerm) return cat;
      const filtered = cat.sections.filter((s) =>
        t(s.labelKey).toLowerCase().includes(searchTerm.toLowerCase())
      );
      return filtered.length > 0 ? { ...cat, sections: filtered } : null;
    })
    .filter(Boolean) as ManualCategory[];

  const handleCategoryToggle = (catId: string) => {
    setOpenCategory((prev) => (prev === catId ? "" : catId));
  };

  return (
    <div className="manual-sidebar card sticky-top" style={{ top: "80px" }}>
      <div className="card-body p-0">
        <div className="px-3 py-2 border-bottom">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-transparent border-end-0">
              <i className="ri-search-line text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder={t("manual.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary border-start-0"
                type="button"
                onClick={() => setSearchTerm("")}
              >
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>
        </div>

        <div className="accordion accordion-flush" id="manualAccordion">
          {filteredCategories.map((category) => {
            const isOpen = openCategory === category.id || !!searchTerm;
            return (
              <div className="accordion-item border-0 border-bottom" key={category.id}>
                <h2 className="accordion-header mb-0">
                  <button
                    className={`accordion-button py-2 px-3 ${!isOpen ? "collapsed" : ""}`}
                    style={{ fontSize: "0.875rem", fontWeight: 600 }}
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    <i className={`${category.icon} me-2 fs-16`}></i>
                    {t(category.labelKey)}
                  </button>
                </h2>
                <div className={`accordion-collapse collapse ${isOpen ? "show" : ""}`}>
                  <div className="accordion-body p-0">
                    <ul className="list-unstyled mb-0">
                      {category.sections.map((section) => (
                        <li key={section.id}>
                          <button
                            className={`btn btn-link w-100 text-start py-1 px-4 manual-nav-item ${
                              activeSectionId === section.id ? "active" : ""
                            }`}
                            onClick={() => onSelectSection(section.id)}
                          >
                            {t(section.labelKey)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center text-muted py-4 px-3">
            <i className="ri-search-line fs-24 d-block mb-1"></i>
            <small>{t("manual.noResults")}</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManualSidebar;
