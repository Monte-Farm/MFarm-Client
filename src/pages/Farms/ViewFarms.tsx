import { logger } from 'utils/logger';
import { Column } from "common/data/data_types"
import { ConfigContext } from "App";
import { FarmData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState, useMemo } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import { useNavigate } from "react-router-dom";
import FarmForm from "Components/Common/Forms/FarmForm";
import { startImpersonation } from "helpers/impersonation_helper";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useTranslation } from "react-i18next";

const ViewFarms = () => {
    const { t } = useTranslation();
    document.title = t('farms.pageTitle')
    const configContext = useContext(ConfigContext);
    const navigate = useNavigate();
    const realUser = getEffectiveUser();
    const isSuperadmin = Array.isArray(realUser?.role)
        ? realUser.role.includes('Superadmin')
        : realUser?.role === 'Superadmin';
    const [loading, setLoading] = useState<boolean>(true);
    const [farms, setFarms] = useState<FarmData[]>([]);
    const [modals, setModals] = useState({ create: false, update: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [selectedFarm, setSelectedFarm] = useState<FarmData | null>(null);

    const farmColumns: Column<FarmData>[] = useMemo(() => [
        { accessor: "name", header: t('farms.column.name') },
        { accessor: "code", header: t('farms.column.code') },
        { accessor: "location", header: t('farms.column.location') },
        {
            header: t('farms.column.status'),
            accessor: 'status',
            isFilterable: true,
            render: (value: boolean) => (
                <Badge color={value ? 'success' : 'danger'}>
                    {value ? t('common.status.active') : t('common.status.inactive')}
                </Badge>
            ),
        },
        {
            header: t('common.field.actions'),
            accessor: 'action' as any,
            render: (_: any, row: FarmData) => (
                <div className="d-flex gap-1">
                    {isSuperadmin && (
                        <>
                            <Button
                                id={`enter-btn-${row._id}`}
                                className="farm-secondary-button btn-icon"
                                disabled={row.status === false}
                                onClick={() => {
                                    startImpersonation({ farm_id: row._id!, farm_name: row.name, effective_role: 'farm_manager' });
                                    configContext?.setImpersonation({ farm_id: row._id!, farm_name: row.name, effective_role: 'farm_manager' });
                                    navigate('/home');
                                }}
                            >
                                <i className="ri-login-box-line" />
                            </Button>
                            <UncontrolledTooltip target={`enter-btn-${row._id}`}>
                                {t('farms.card.enterManager')}
                            </UncontrolledTooltip>
                        </>
                    )}
                    <>
                        <Button
                            id={`edit-btn-${row._id}`}
                            className="farm-secondary-button btn-icon"
                            disabled={row.status === false}
                            onClick={() => { setSelectedFarm(row); toggleModal('update', true); }}
                        >
                            <i className="ri-pencil-fill" />
                        </Button>
                        <UncontrolledTooltip target={`edit-btn-${row._id}`}>
                            {t('common.button.edit')}
                        </UncontrolledTooltip>
                    </>
                    <>
                        <Button
                            id={`details-btn-${row._id}`}
                            className="farm-primary-button btn-icon"
                            onClick={() => navigate(`/farms/farm_details/${row._id}`)}
                        >
                            <i className="ri-eye-fill" />
                        </Button>
                        <UncontrolledTooltip target={`details-btn-${row._id}`}>
                            {t('common.button.viewDetails')}
                        </UncontrolledTooltip>
                    </>
                </div>
            ),
        },
    ], [t, isSuperadmin, configContext]);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleError = (error: any, message: string) => {
        logger.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color, message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const fetchFarms = async () => {
        if (!configContext) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/find_all`)
            setFarms(response.data.data)
        } catch (error) {
            handleError(error, t('farms.error.fetch'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchFarms();
    }, [])

    if (loading) return <LoadingAnimation />;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('farms.breadcrumb')} pageTitle={t('farms.breadcrumbParent')} />

                <Card>
                    <CardHeader>
                        <div className="d-flex align-items-center justify-content-end">
                            <Button
                                className="farm-primary-button"
                                onClick={() => toggleModal('create')}
                            >
                                <i className="ri-add-line me-2" />
                                {t('farms.button.new')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <CustomTable
                            columns={farmColumns}
                            data={farms}
                            showSearchAndFilter={true}
                            rowsPerPage={10}
                            showPagination={true}
                        />
                    </CardBody>
                </Card>
            </Container>

            <Modal isOpen={modals.create} toggle={() => toggleModal('create')} size="xl" keyboard={false} backdrop="static" centered>
                <ModalHeader toggle={() => toggleModal('create')}>{t('farms.modal.create')}</ModalHeader>
                <ModalBody>
                    <FarmForm
                        onSave={() => { toggleModal('create'); fetchFarms(); showAlert('success', t('farms.success.created')); }}
                        onCancel={() => toggleModal('create')}
                    />
                </ModalBody>
            </Modal>

            <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop="static" centered>
                <ModalHeader toggle={() => toggleModal('update')}>{t('farms.modal.update')}</ModalHeader>
                <ModalBody>
                    <FarmForm
                        data={selectedFarm || undefined}
                        onSave={() => { toggleModal('update'); fetchFarms(); showAlert('success', t('farms.success.updated')); setSelectedFarm(null); }}
                        onCancel={() => { toggleModal('update'); setSelectedFarm(null); }}
                    />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    );
}

export default ViewFarms;
