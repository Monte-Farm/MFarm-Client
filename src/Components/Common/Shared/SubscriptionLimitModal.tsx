import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { onSubscriptionLimit, SubscriptionLimitEventPayload } from "utils/subscriptionLimitEvents";

const SubscriptionLimitModal = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [payload, setPayload] = useState<SubscriptionLimitEventPayload | null>(null);

    useEffect(() => {
        const off = onSubscriptionLimit((p) => setPayload(p));
        return () => { off(); };
    }, []);

    const close = () => setPayload(null);

    const goToSubscription = () => {
        navigate("/subscription");
        close();
    };

    if (!payload) return null;

    return (
        <Modal isOpen={true} toggle={close} centered size="md" backdrop="static">
            <ModalHeader toggle={close}>
                <i className="ri-vip-crown-line me-2 text-warning" />
                {t("subscription.limitModal.title")}
            </ModalHeader>
            <ModalBody>
                <Alert color="warning" className="d-flex align-items-start mb-3">
                    <i className="ri-error-warning-line me-2 fs-5 text-warning mt-1" />
                    <div>
                        <div className="fw-semibold mb-1">{t("subscription.limitModal.alertTitle")}</div>
                        <small>{payload.message}</small>
                    </div>
                </Alert>
                <p className="text-muted mb-0">
                    {t("subscription.limitModal.hint")}
                </p>
            </ModalBody>
            <ModalFooter>
                <Button color="light" onClick={close}>{t("common.button.cancel")}</Button>
                <Button color="primary" onClick={goToSubscription}>
                    <i className="ri-arrow-up-circle-line me-1" />{t("subscription.limitModal.upgrade")}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default SubscriptionLimitModal;
