import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import GroupBasicEditForm from "./GroupBasicEditForm";

interface GroupBasicEditModalProps {
    isOpen: boolean;
    group: any;
    fullscreen?: boolean;
    onClose: () => void;
    onSave: () => void;
}

const GroupBasicEditModal: React.FC<GroupBasicEditModalProps> = ({ isOpen, group, fullscreen, onClose, onSave }) => {
    const { t } = useTranslation();

    return (
        <Modal size="lg" isOpen={isOpen} toggle={onClose} centered backdrop="static" keyboard={false} fullscreen={fullscreen}>
            <ModalHeader toggle={onClose}>{t('common.button.edit')} {t('groups.tab.information').toLowerCase()}</ModalHeader>
            <ModalBody>
                <GroupBasicEditForm group={group} onSave={onSave} onCancel={onClose} />
            </ModalBody>
        </Modal>
    );
};

export default GroupBasicEditModal;
