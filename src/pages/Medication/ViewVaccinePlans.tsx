import { logger } from 'utils/logger';
import { ConfigContext } from "App"
import { Column } from "common/data/data_types"
import MedicationPackageDetails from "Components/Common/Details/MedicationPackageDetails"
import VaccinationPlanDetails from "Components/Common/Details/VaccinationPlanDetails"
import MedicationPackageForm from "Components/Common/Forms/MedicationPackageForm"
import VaccinationPlanForm from "Components/Common/Forms/VaccinationPlanForm"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation"
import CustomTable from "Components/Common/Tables/CustomTable"
import { getEffectiveUser } from "helpers/impersonation_helper"
import { useContext, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiInbox } from "react-icons/fi"
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap"

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const ViewVaccinationPlans = () => {
    const { t } = useTranslation();
    document.title = t('medication.vaccinePlan.pageTitle') + ' | System Management'
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [vaccinationPlans, setVaccinationPlans] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ create: false, details: false, update: false, delete: false, activate: false });
    const [selectedVaccinationPlan, setSelectedVaccinationPlan] = useState<any>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const vaccinationPlansColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('common.field.name'), accessor: 'name', type: 'text', isFilterable: true },
        { header: t('medication.package.column.createdAt'), accessor: 'creation_date', type: 'date', isFilterable: true },
        {
            header: t('medication.package.column.createdBy'),
            accessor: 'creation_responsible',
            type: 'text',
            isFilterable: true,
            render: (_, row) => (<span>{row.creation_responsible.name} {row.creation_responsible.lastname}</span>)
        },
        {
            header: t('common.field.stage'),
            accessor: 'stage',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                const text = t(`feeding.stage.${row.stage}`, { defaultValue: t('medical.medication.field.unknown') });

                switch (row.stage) {
                    case "general": color = "info"; break;
                    case "piglet": color = "info"; break;
                    case "weaning": color = "info"; break;
                    case "fattening": color = "primary"; break;
                    case "breeder": color = "primary"; break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: t('common.field.status'), accessor: 'is_active', isFilterable: true, render: (value: boolean) => (
                <Badge color={value ? "success" : "danger"}>{value ? t('common.status.active') : t('common.status.inactive')}</Badge>
            ),
        },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    {/* <Button className="farm-secondary-button btn-icon">
                        <i className="ri-pencil-fill align-middle"></i>
                    </Button> */}
                    <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedVaccinationPlan(row); toggleModal('details') }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const [vaccinationResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/vaccination_plan/find_by_farm/${userLogged.farm_assigned}`),
            ])
            setVaccinationPlans(vaccinationResponse.data.data);
        } catch (error) {
            logger.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.package.error.load') })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('medication.vaccinePlan.pageTitle')} pageTitle={t('medication.vaccinePlan.breadcrumb')} />

                <Card className="rounded">
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2  " />
                                {t('medication.vaccinePlan.create')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={vaccinationPlans.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {vaccinationPlans.length === 0 ? (
                            <>
                                <FiInbox className="text-muted" size={48} style={{ marginBottom: 10 }} />
                                <span className="fs-5 text-muted">{t('medication.vaccinePlan.noRecords')}</span>
                            </>
                        ) : (
                            <CustomTable columns={vaccinationPlansColumns} data={vaccinationPlans} showPagination={true} rowsPerPage={10} />
                        )}
                    </CardBody>
                </Card>
            </Container>


            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("create")}>{t('medication.vaccinePlan.createModal')}</ModalHeader>
                <ModalBody>
                    <VaccinationPlanForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => { toggleModal("details"); fetchData() }}>{t('medication.vaccinePlan.detailsModal')}</ModalHeader>
                <ModalBody>
                    <VaccinationPlanDetails vaccinationPlanId={selectedVaccinationPlan?._id} />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default ViewVaccinationPlans;