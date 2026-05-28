import { Column } from "common/data/data_types";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import CreateGroupLinkedForm, { CreateGroupLinkedDefaults } from "Components/Common/Forms/CreateGroupLinkedForm";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import SelectableCustomTable from "Components/Common/Tables/SelectableTable";
import { useGroupsByStage } from "hooks/useGroupsByStage";
import { FiInbox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap";
import GroupWithDrawForm from "Components/Common/Forms/GroupWithdrawForm";
import GroupInsertForm from "Components/Common/Forms/GroupInsertForm";
import GroupTransferForm from "Components/Common/Forms/GroupTransferForm";
import BulkGroupMedicationAssignmentModal from "Components/Common/Forms/BulkGroupMedicationAssignmentModal";
import BulkGroupStageChangeModal from "Components/Common/Forms/BulkGroupStageChangeModal";
import BulkFeedAdministrationModal from "Components/Common/Forms/BulkFeedAdministrationModal";
import BulkGroupHealthEventModal from "Components/Common/Forms/BulkGroupHealthEventModal";
import KPI from "Components/Common/Graphics/Kpi";
import { FaArrowDown, FaArrowUp, FaBalanceScale, FaLayerGroup, FaMars, FaPiggyBank, FaVenus, FaWeight } from "react-icons/fa";
import { getActionsColumn } from "config/groupColumnsConfig";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface GroupsViewProps {
    stage: string;
    title: string;
    pageTitle: string;
    columns: Column<any>[];
    statsEndpoint?: 'group_alive_stats' | 'weaning_stats';
    transferStage?: string;
    headerActions?: React.ReactNode;
    showCreate?: boolean;
    createDefaults?: CreateGroupLinkedDefaults;
}

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const GroupsView: React.FC<GroupsViewProps> = ({
    stage,
    title,
    pageTitle,
    columns,
    statsEndpoint = 'group_alive_stats',
    transferStage,
    headerActions,
    showCreate = false,
    createDefaults,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
        loading,
        modals,
        toggleModal,
        groups,
        stats,
        selectedGroup,
        setSelectedGroup,
        fetchData
    } = useGroupsByStage({ stage, statsEndpoint });

    const [tabletMode, setTabletMode] = useState(isTablet);
    const [selectedGroups, setSelectedGroups] = useState<any[]>([]);
    const [bulkMedicationModalOpen, setBulkMedicationModalOpen] = useState(false);
    const [bulkFeedAdminModalOpen, setBulkFeedAdminModalOpen] = useState(false);
    const [bulkStageChangeModalOpen, setBulkStageChangeModalOpen] = useState(false);
    const [bulkHealthEventModalOpen, setBulkHealthEventModalOpen] = useState(false);

    useEffect(() => {
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const handleSelectionChange = (selected: any[]) => {
        setSelectedGroups(selected);
    };

    const handleBulkMedicationSuccess = () => {
        fetchData();
        setSelectedGroups([]);
    };

    const handleBulkStageChangeSuccess = () => {
        fetchData();
        setSelectedGroups([]);
    };

    const handleBulkHealthEventSuccess = () => {
        fetchData();
        setSelectedGroups([]);
    };

    const hasGroupsReadyForStageChange = selectedGroups.some(g =>
        g.status === 'ready_to_grow' ||
        g.status === 'grow_overdue' ||
        g.status === 'ready_for_sale'
    );

    const tableColumns = [
        ...columns,
        getActionsColumn(navigate, setSelectedGroup, toggleModal, t)
    ];

    if (loading) {
        return <LoadingAnimation />;
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={title} pageTitle={pageTitle} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI title={t('groups.kpi.groups')} value={stats?.population?.totalGroups ?? 0} icon={FaLayerGroup} bgColor="#e8f4fd" iconColor="#0d6efd" />
                    <KPI title={t('groups.kpi.totalPigs')} value={stats?.population?.totalPigs ?? 0} icon={FaPiggyBank} bgColor="#fff3cd" iconColor="#ffc107" />
                    <KPI title={statsEndpoint === 'group_alive_stats' ? t('groups.kpi.avgPigsPerGroup') : t('groups.kpi.avgPerGroup')} value={stats?.population?.avgPigsPerGroup ?? 0} icon={FaBalanceScale} bgColor="#e6f7e6" iconColor="#28a745" />
                    <KPI title={t('groups.kpi.minPerGroup')} value={stats?.population?.minPigsPerGroup ?? 0} icon={FaArrowDown} bgColor="#f8d7da" iconColor="#dc3545" />
                    <KPI title={t('groups.kpi.maxPerGroup')} value={stats?.population?.maxPigsPerGroup ?? 0} icon={FaArrowUp} bgColor="#d1e7dd" iconColor="#198754" />
                    <KPI title={t('groups.kpi.males')} value={stats?.population?.totalMales ?? 0} icon={FaMars} bgColor="#e7f1ff" iconColor="#0a58ca" />
                    <KPI title={t('groups.kpi.females')} value={stats?.population?.totalFemales ?? 0} icon={FaVenus} bgColor="#fde7f3" iconColor="#d63384" />
                    <KPI title={statsEndpoint === 'group_alive_stats' ? t('groups.kpi.avgWeightPerPig') : t('groups.kpi.avgWeightShort')} value={stats?.avgWeight?.toFixed(1) ?? 0} icon={FaWeight} bgColor="#ede9fe" iconColor="#6f42c1" />
                </div>

                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                            {selectedGroups.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedGroups.length} {selectedGroups.length === 1 ? t('groups.modal.selectedSingular') : t('groups.modal.selectedPlural')}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-primary-button btn-sm"
                                            onClick={() => setBulkMedicationModalOpen(true)}
                                        >
                                            <i className="ri-medicine-bottle-line me-1"></i>
                                            {t('groups.button.bulkMedication')}
                                        </Button>
                                        <Button
                                            color="info"
                                            className="btn-sm"
                                            onClick={() => setBulkFeedAdminModalOpen(true)}
                                        >
                                            <i className="ri-restaurant-line me-1"></i>
                                            {t('groups.button.bulkFeed')}
                                        </Button>
                                        <Button
                                            color="warning"
                                            className="btn-sm"
                                            disabled={!hasGroupsReadyForStageChange}
                                            title={!hasGroupsReadyForStageChange ? t('groups.tooltip.noStageChange') : undefined}
                                            onClick={() => setBulkStageChangeModalOpen(true)}
                                        >
                                            <i className="ri-arrow-up-circle-line me-1"></i>
                                            {t('groups.button.bulkStageChange')}
                                        </Button>
                                        <Button
                                            color="danger"
                                            className="btn-sm"
                                            onClick={() => setBulkHealthEventModalOpen(true)}
                                        >
                                            <i className="ri-heart-pulse-line me-1"></i>
                                            {t('groups.button.bulkHealthEvent')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="ms-auto d-flex gap-2">
                            {showCreate && (
                                <Button onClick={() => toggleModal('create')}>
                                    <i className="ri-add-line me-2" />
                                    {t('groups.action.newGroup')}
                                </Button>
                            )}
                            {headerActions}
                        </div>
                    </CardHeader>

                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {groups.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <SelectableCustomTable
                                    columns={tableColumns}
                                    data={groups}
                                    showPagination={true}
                                    rowsPerPage={7}
                                    onSelect={handleSelectionChange}
                                    selectionMode="multiple"
                                    selectionOnlyOnCheckbox={true}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#6c757d", padding: "2rem", flexDirection: "column", }}>
                                <FiInbox size={56} style={{ marginBottom: 12, opacity: 0.8 }} />
                                <h5 style={{ marginBottom: 6 }}>{t('groups.empty.noGroups')}</h5>
                                <p style={{ maxWidth: 360, margin: 0, fontSize: 15 }}>
                                    {t('groups.empty.noGroupsMsg')}
                                </p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} centered backdrop={'static'} keyboard={false} fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("create")}>{t('groups.modal.createGroup')}</ModalHeader>
                <ModalBody>
                    <CreateGroupLinkedForm onSave={() => { fetchData(); toggleModal('create'); }} onCancel={() => toggleModal('create', false)} defaults={createDefaults} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.move} toggle={() => toggleModal("move")} centered backdrop={'static'} keyboard={false} fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("move")}>{t('groups.modal.moveGroup')}</ModalHeader>
                <ModalBody>
                    <GroupTransferForm groupId={selectedGroup._id} onSave={() => { toggleModal('move'); fetchData(); }} stage={transferStage || stage} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asign} toggle={() => toggleModal("asign")} centered backdrop={'static'} keyboard={false} fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("asign")}>{t('groups.modal.insertPigs')}</ModalHeader>
                <ModalBody>
                    <GroupInsertForm groupId={selectedGroup?._id} onSave={() => { fetchData(); toggleModal('asign') }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.withdraw} toggle={() => toggleModal("withdraw")} centered backdrop={'static'} keyboard={false} fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("withdraw")}>{t('groups.modal.withdrawPigs')}</ModalHeader>
                <ModalBody>
                    <GroupWithDrawForm groupId={selectedGroup?._id} onSave={() => { fetchData(); toggleModal('withdraw') }} />
                </ModalBody>
            </Modal>

            <BulkGroupMedicationAssignmentModal
                isOpen={bulkMedicationModalOpen}
                onClose={() => setBulkMedicationModalOpen(false)}
                selectedGroups={selectedGroups}
                onSuccess={handleBulkMedicationSuccess}
            />

            <BulkFeedAdministrationModal
                isOpen={bulkFeedAdminModalOpen}
                onClose={() => setBulkFeedAdminModalOpen(false)}
                targetType="group"
                selectedTargets={selectedGroups}
                onSuccess={() => { fetchData(); setSelectedGroups([]); }}
            />

            <BulkGroupStageChangeModal
                isOpen={bulkStageChangeModalOpen}
                onClose={() => setBulkStageChangeModalOpen(false)}
                selectedGroups={selectedGroups}
                onSuccess={handleBulkStageChangeSuccess}
            />

            <BulkGroupHealthEventModal
                isOpen={bulkHealthEventModalOpen}
                onClose={() => setBulkHealthEventModalOpen(false)}
                selectedGroups={selectedGroups}
                onSuccess={handleBulkHealthEventSuccess}
            />
        </div>
    );
};

export default GroupsView;
