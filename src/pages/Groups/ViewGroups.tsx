import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { GroupData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import GroupForm from "Components/Common/Forms/GroupForm";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap";
import GroupWithDrawForm from "Components/Common/Forms/GroupWithdrawForm";
import GroupInsertForm from "Components/Common/Forms/GroupInsertForm";
import GroupTransferForm from "Components/Common/Forms/GroupTransferForm";
import { useTranslation } from "react-i18next";

const ViewGroups = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext)
    const userLogged = getEffectiveUser()
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, move: false, asign: false, withdraw: false });
    const [groups, setGroups] = useState<GroupData[]>([])
    const [selectedGroup, setSelectedGroup] = useState<any>({})

    const AREA_COLORS: Record<string, string> = {
        gestation: 'info', farrowing: 'primary', maternity: 'primary',
        weaning: 'success', nursery: 'warning', fattening: 'dark',
        replacement: 'secondary', boars: 'info', quarantine: 'danger',
        hospital: 'danger', shipping: 'secondary',
    };

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const groupsColumns: Column<any>[] = [
        { header: t('groups.column.code'), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('groups.column.name'), accessor: 'name', type: 'text', isFilterable: true },
        {
            header: t('groups.column.area'),
            accessor: 'area',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                const color = AREA_COLORS[row.area] || 'secondary';
                const text = t(`groups.area.${row.area}`, { defaultValue: row.area });
                return <Badge color={color}>{text}</Badge>;
            },
        },
        { header: t('groups.column.creationDate'), accessor: 'creationDate', type: 'date', isFilterable: true },
        {
            header: t('groups.column.femaleCount'),
            accessor: 'femaleCount',
            type: 'text',
            isFilterable: true,
            bgColor: "#fce4ec"
        },
        {
            header: t('groups.column.maleCount'),
            accessor: 'maleCount',
            type: 'text',
            isFilterable: true,
            bgColor: "#e3f2fd"
        },
        {
            header: t('groups.column.total'),
            accessor: 'pigCount',
            type: 'text',
            isFilterable: true,
            bgColor: "#e8f5e8"
        },
        {
            header: t('groups.column.actions'),
            accessor: "action",
            render: (_: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`move-button-${row._id}`} className="btn-icon btn-warning" onClick={() => { setSelectedGroup(row); toggleModal('move'); }}>
                        <i className="ri-arrow-left-right-line align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`move-button-${row._id}`}>
                        {t('groups.action.transfer')}
                    </UncontrolledTooltip>

                    <Button id={`withdraw-button-${row._id}`} className="btn-icon btn-danger" onClick={() => { setSelectedGroup(row); toggleModal('withdraw'); }}>
                        <i className="ri-upload-2-line align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`withdraw-button-${row._id}`}>
                        {t('groups.action.withdraw')}
                    </UncontrolledTooltip>

                    <Button id={`asign-button-${row._id}`} className="btn-icon btn-primary" onClick={() => { setSelectedGroup(row); toggleModal('asign'); }}>
                        <i className="ri-download-2-line align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`asign-button-${row._id}`}>
                        {t('groups.action.insert')}
                    </UncontrolledTooltip>

                    <Button id={`details-button-${row._id}`} className="btn-icon btn-success" onClick={() => navigate(`/groups/group_details/${row._id}`)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`details-button-${row._id}`}>
                        {t('groups.action.viewDetails')}
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return
        try {
            setLoading(true)
            const [groupResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_farm/${userLogged.farm_assigned}`),
            ])
            setGroups(groupResponse.data.data)
        } catch (error) {
            logger.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('groups.error.load') })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return <LoadingAnimation />
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('groups.view.title')} pageTitle={t('groups.pageTitle.groups')} />

                <Card>
                    <CardHeader className="d-flex">
                        <Button className="ms-auto" onClick={() => toggleModal('create')}>
                            <i className="ri-add-line me-2" />
                            {t('groups.action.newGroup')}
                        </Button>
                    </CardHeader>
                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {groups.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <CustomTable columns={groupsColumns} data={groups} showPagination={true} rowsPerPage={7} />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#6c757d", padding: "2rem", flexDirection: "column" }}>
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

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("create")}>{t('groups.modal.createGroup')}</ModalHeader>
                <ModalBody>
                    <GroupForm onSave={() => { fetchData(); toggleModal('create') }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.move} toggle={() => toggleModal("move")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("move")}>{t('groups.modal.moveGroup')}</ModalHeader>
                <ModalBody>
                    {/* <GroupTransferForm groupId={selectedGroup._id} onSave={() => { toggleModal('move'); fetchData(); }} /> */}
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asign} toggle={() => toggleModal("asign")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("asign")}>{t('groups.modal.insertPigs')}</ModalHeader>
                <ModalBody>
                    {/* <GroupInsertForm groupId={selectedGroup?._id} onSave={() => { fetchData(); toggleModal('asign') }} /> */}
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.withdraw} toggle={() => toggleModal("withdraw")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("withdraw")}>{t('groups.modal.withdrawPigs')}</ModalHeader>
                <ModalBody>
                    {/* <GroupWithDrawForm groupId={selectedGroup?._id} onSave={() => { fetchData(); toggleModal('withdraw') }} /> */}
                </ModalBody>
            </Modal>
        </div>
    )
}

export default ViewGroups;
