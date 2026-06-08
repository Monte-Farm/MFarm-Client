import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { onSubscriptionWriteBlocked } from "utils/subscriptionWriteBlockedEvents";

const SubscriptionWriteBlockedModal: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const off = onSubscriptionWriteBlocked(() => setOpen(true));
        return () => { off(); };
    }, []);

    const close = () => setOpen(false);

    const goToSubscription = () => {
        navigate("/subscription");
        close();
    };

    return (
        <Modal isOpen={open} toggle={close} centered size="sm" backdrop="static">
            <ModalHeader toggle={close}>
                <i className="ri-lock-line me-2 text-danger" />
                {t("subscription.readOnly.blockedTitle")}
            </ModalHeader>
            <ModalBody>
                <div className="text-center py-2">
                    <i className="ri-file-lock-line text-danger mb-3" style={{ fontSize: 48 }} />
                    <p className="mb-1 fw-semibold">{t("subscription.readOnly.blockedMessage")}</p>
                    <p className="text-muted small mb-0">{t("subscription.readOnly.blockedHint")}</p>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color="light" onClick={close}>{t("common.button.cancel")}</Button>
                <Button color="primary" onClick={goToSubscription}>
                    <i className="ri-arrow-up-circle-line me-1" />
                    {t("subscription.limitModal.upgrade")}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default SubscriptionWriteBlockedModal;
