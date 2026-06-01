import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import { useTranslation } from "react-i18next";
import FeedAdministrationForm from "./FeedAdministrationForm";

interface BulkFeedAdministrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: 'group' | 'litter' | 'pig';
    selectedTargets: any[];   // groups o litters seleccionados
    onSuccess: () => void;
}

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const BulkFeedAdministrationModal: React.FC<BulkFeedAdministrationModalProps> = ({
    isOpen,
    onClose,
    targetType,
    selectedTargets,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const targetIds = selectedTargets.map((tgt) => tgt._id || tgt.id).filter(Boolean);

    useEffect(() => {
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const targetLabel = targetType === 'group'
        ? t('feeding.administration.target.groups')
        : targetType === 'litter'
        ? t('feeding.administration.target.litters')
        : t('feeding.administration.target.pigs');

    return (
        <Modal size="lg" isOpen={isOpen} toggle={onClose} backdrop="static" keyboard={false} centered fullscreen={tabletMode}>
            <ModalHeader toggle={onClose}>
                {t('feeding.administration.bulk.title', { count: selectedTargets.length, target: targetLabel })}
            </ModalHeader>
            <ModalBody>
                {targetIds.length === 0 ? (
                    <div className="alert alert-warning">
                        {t('feeding.administration.bulk.noTargets', { target: targetLabel })}
                    </div>
                ) : (
                    <FeedAdministrationForm
                        targetType={targetType}
                        bulkTargets={targetIds}
                        isBulk={true}
                        onSave={() => { onSuccess(); onClose(); }}
                        onCancel={onClose}
                    />
                )}
            </ModalBody>
        </Modal>
    );
};

export default BulkFeedAdministrationModal;
