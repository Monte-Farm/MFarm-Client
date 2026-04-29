import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col } from "reactstrap";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { MANUAL_CATEGORIES } from "./userManualSections";
import UserManualSidebar from "./UserManualSidebar";
import UserManualContent from "./UserManualContent";
import "./userManual.scss";

const UserManual = () => {
  const { t } = useTranslation();
  document.title = t("manual.title") + " | MFarm";

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
    const allSectionIds = MANUAL_CATEGORIES.flatMap((c) =>
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
  }, []);

  useEffect(() => {
    if (initialId && initialId !== "overview") {
      setTimeout(() => handleSelectSection(initialId), 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("manual.title")} pageTitle="MFarm" />
          <Row>
            <Col lg={3} className="d-none d-lg-block">
              <UserManualSidebar
                categories={MANUAL_CATEGORIES}
                activeSectionId={activeSectionId}
                onSelectSection={handleSelectSection}
              />
            </Col>
            <Col lg={9}>
              <UserManualContent categories={MANUAL_CATEGORIES} />
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default UserManual;
