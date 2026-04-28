import { Modal, ModalBody, ModalHeader } from "reactstrap";
import { useTranslation } from "react-i18next";
import FeedAdministrationForm from "./FeedAdministrationForm";

interface BulkFeedAdministrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: 'group' | 'litter';
    selectedTargets: any[];   // groups o litters seleccionados
    onSuccess: () => void;
}

const BulkFeedAdministrationModal: React.FC<BulkFeedAdministrationModalProps> = ({
    isOpen,
    onClose,
    targetType,
    selectedTargets,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const targetIds = selectedTargets.map((tgt) => tgt._id || tgt.id).filter(Boolean);
    const targetLabel = targetType === 'group' ? t('feeding.administration.target.groups') : t('feeding.administration.target.litters');

    return (
        <Modal size="lg" isOpen={isOpen} toggle={onClose} backdrop="static" keyboard={false} centered>
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
