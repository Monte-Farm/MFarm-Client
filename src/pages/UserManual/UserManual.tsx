import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col } from "reactstrap";
import i18n from "i18n";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { MANUAL_CATEGORIES } from "./userManualSections";
import UserManualSidebar from "./UserManualSidebar";
import UserManualContent from "./UserManualContent";
import { getEffectiveUser } from "helpers/impersonation_helper";
import "./userManual.scss";

// Lazy-load the manual content bundles so they don't inflate the main bundle
const loadManualNs = async () => {
  const lang = i18n.language || "sp";
  if (i18n.hasResourceBundle(lang, "manual")) return;

  try {
    let bundle: Record<string, unknown>;
    if (lang === "en") {
      bundle = (await import("../../locales/manual-en.json")).default;
    } else if (lang === "pt") {
      bundle = (await import("../../locales/manual-pt.json")).default;
    } else {
      bundle = (await import("../../locales/manual-sp.json")).default;
    }
    i18n.addResourceBundle(lang, "manual", bundle, true, true);
  } catch {
    // Fallback: try Spanish if the selected language bundle is missing
    if (lang !== "sp" && !i18n.hasResourceBundle("sp", "manual")) {
      const bundle = (await import("../../locales/manual-sp.json")).default;
      i18n.addResourceBundle("sp", "manual", bundle, true, true);
    }
  }
};

const UserManual = () => {
  const { t } = useTranslation();
  const [manualReady, setManualReady] = useState(false);

  const userRoles: string[] = getEffectiveUser()?.role ?? [];
  const visibleCategories = MANUAL_CATEGORIES.map((cat) => ({
    ...cat,
    sections: cat.sections.filter(
      (s) => !s.roles || s.roles.some((r) => userRoles.includes(r))
    ),
  }));

  document.title = `${t("manual.title")} | ${t("systemName")}`;

  // Load the manual namespace on mount (and when language changes)
  useEffect(() => {
    setManualReady(false);
    loadManualNs().then(() => setManualReady(true));
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const initialId = window.location.hash.replace("#", "") || "overview";
  const [activeSectionId, setActiveSectionId] = useState(initialId);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);

  const handleSelectSection = useCallback((id: string) => {
    isScrollingRef.current = true;
    setActiveSectionId(id);
    window.history.replaceState(null, "", `#${id}`);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    } else {
      isScrollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!manualReady) return;

    const allSectionIds = visibleCategories.flatMap((c) =>
      c.sections.map((s) => s.id)
    );

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSectionId(visible[0].target.id);
          window.history.replaceState(null, "", `#${visible[0].target.id}`);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    allSectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [manualReady]);

  useEffect(() => {
    if (initialId && initialId !== "overview") {
      setTimeout(() => handleSelectSection(initialId), 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("manual.title")} pageTitle={t("systemName")} />
          <Row>
            <Col lg={3} className="d-none d-lg-block">
              <UserManualSidebar
                categories={visibleCategories}
                activeSectionId={activeSectionId}
                onSelectSection={handleSelectSection}
              />
            </Col>
            <Col lg={9}>
              <UserManualContent categories={visibleCategories} />
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default UserManual;
