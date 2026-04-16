import { Column } from "common/data/data_types";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import GroupForm from "Components/Common/Forms/GroupForm";
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
import { useState } from "react";

interface GroupsViewProps {
    stage: string;
    title: string;
    pageTitle: string;
    columns: Column<any>[];
    statsEndpoint?: 'group_alive_stats' | 'weaning_stats';
    transferStage?: string;
}

const GroupsView: React.FC<GroupsViewProps> = ({
    stage,
    title,
    pageTitle,
    columns,
    statsEndpoint = 'group_alive_stats',
    transferStage
}) => {
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

    const [selectedGroups, setSelectedGroups] = useState<any[]>([]);
    const [bulkMedicationModalOpen, setBulkMedicationModalOpen] = useState(false);
    const [bulkFeedAdminModalOpen, setBulkFeedAdminModalOpen] = useState(false);
    const [bulkStageChangeModalOpen, setBulkStageChangeModalOpen] = useState(false);
    const [bulkHealthEventModalOpen, setBulkHealthEventModalOpen] = useState(false);

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

    // Verificar si hay grupos listos para cambio de etapa
    const hasGroupsReadyForStageChange = selectedGroups.some(g => 
        g.status === 'ready_to_grow' || 
        g.status === 'grow_overdue' || 
        g.status === 'ready_for_sale'
    );

    // Agregar columna de acciones
    const tableColumns = [
        ...columns,
        getActionsColumn(navigate, setSelectedGroup, toggleModal)
    ];

    if (loading) {
        return <LoadingAnimation />;
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={title} pageTitle={pageTitle} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI title="Grupos" value={stats?.population?.totalGroups ?? 0} icon={FaLayerGroup} bgColor="#e8f4fd" iconColor="#0d6efd" />
                    <KPI title="Cerdos totales" value={stats?.population?.totalPigs ?? 0} icon={FaPiggyBank} bgColor="#fff3cd" iconColor="#ffc107" />
                    <KPI title={statsEndpoint === 'group_alive_stats' ? "Cerdos promedio por grupo" : "Promedio por grupo"} value={stats?.population?.avgPigsPerGroup ?? 0} icon={FaBalanceScale} bgColor="#e6f7e6" iconColor="#28a745" />
                    <KPI title="Mínimo por grupo" value={stats?.population?.minPigsPerGroup ?? 0} icon={FaArrowDown} bgColor="#f8d7da" iconColor="#dc3545" />
                    <KPI title="Máximo por grupo" value={stats?.population?.maxPigsPerGroup ?? 0} icon={FaArrowUp} bgColor="#d1e7dd" iconColor="#198754" />
                    <KPI title="Machos" value={stats?.population?.totalMales ?? 0} icon={FaMars} bgColor="#e7f1ff" iconColor="#0a58ca" />
                    <KPI title="Hembras" value={stats?.population?.totalFemales ?? 0} icon={FaVenus} bgColor="#fde7f3" iconColor="#d63384" />
                    <KPI title={statsEndpoint === 'group_alive_stats' ? "Peso promedio por cerdo (kg)" : "Peso promedio (kg)"} value={stats?.avgWeight?.toFixed(1) ?? 0} icon={FaWeight} bgColor="#ede9fe" iconColor="#6f42c1" />
                </div>

                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            {selectedGroups.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedGroups.length} {selectedGroups.length === 1 ? 'grupo seleccionado' : 'grupos seleccionados'}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-primary-button btn-sm"
                                            onClick={() => setBulkMedicationModalOpen(true)}
                                        >
                                            <i className="ri-medicine-bottle-line me-1"></i>
                                            Asignar Medicación
                                        </Button>
                                        <Button
                                            color="info"
                                            className="btn-sm"
                                            onClick={() => setBulkFeedAdminModalOpen(true)}
                                        >
                                            <i className="ri-restaurant-line me-1"></i>
                                            Administrar alimento
                                        </Button>
                                        <Button
                                            color="warning"
                                            className="btn-sm"
                                            disabled={!hasGroupsReadyForStageChange}
                                            title={!hasGroupsReadyForStageChange ? "No hay grupos listos para cambio de etapa" : undefined}
                                            onClick={() => setBulkStageChangeModalOpen(true)}
                                        >
                                            <i className="ri-arrow-up-circle-line me-1"></i>
                                            Cambiar Etapa
                                        </Button>
                                        <Button
                                            color="danger"
                                            className="btn-sm"
                                            onClick={() => setBulkHealthEventModalOpen(true)}
                                        >
                                            <i className="ri-heart-pulse-line me-1"></i>
                                            Evento Sanitario
                                        </Button>
                                    </div>
                                </div>
                            )}
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
                                <h5 style={{ marginBottom: 6 }}>No hay grupos disponibles</h5>
                                <p style={{ maxWidth: 360, margin: 0, fontSize: 15 }}>
                                    Actualmente no existen grupos de cerdos registrados o activos para mostrar.
                                </p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("create")}>Crear grupo</ModalHeader>
                <ModalBody>
                    <GroupForm onSave={() => { fetchData(); toggleModal('create') }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.move} toggle={() => toggleModal("move")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("move")}>Trasladar cerdos</ModalHeader>
                <ModalBody>
                    <GroupTransferForm groupId={selectedGroup._id} onSave={() => { toggleModal('move'); fetchData(); }} stage={transferStage || stage} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asign} toggle={() => toggleModal("asign")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("asign")}>Ingresar cerdos</ModalHeader>
                <ModalBody>
                    <GroupInsertForm groupId={selectedGroup?._id} onSave={() => { fetchData(); toggleModal('asign') }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.withdraw} toggle={() => toggleModal("withdraw")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("withdraw")}>Retirar cerdos</ModalHeader>
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
