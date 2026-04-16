import { Modal, ModalBody, ModalHeader } from "reactstrap";
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
    const targetIds = selectedTargets.map((t) => t._id || t.id).filter(Boolean);
    const targetLabel = targetType === 'group' ? 'grupos' : 'camadas';

    return (
        <Modal size="lg" isOpen={isOpen} toggle={onClose} backdrop="static" keyboard={false} centered>
            <ModalHeader toggle={onClose}>
                Administrar alimento a {selectedTargets.length} {targetLabel}
            </ModalHeader>
            <ModalBody>
                {targetIds.length === 0 ? (
                    <div className="alert alert-warning">
                        No hay {targetLabel} seleccionados.
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
