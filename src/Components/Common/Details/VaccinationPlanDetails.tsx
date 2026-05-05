import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "./ObjectDetails";
import { Attribute } from "common/data_interfaces";
import { Badge, Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import noImageUrl from '../../../assets/images/no-image.png'
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { HttpStatusCode } from "axios";
import { useTranslation } from "react-i18next";

interface VaccinationPlanDetailsProps {
    vaccinationPlanId: string;
}

const VaccinationPlanDetails: React.FC<VaccinationPlanDetailsProps> = ({ vaccinationPlanId }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [vaccinationPlanDetails, setVaccinationPlanDetails] = useState<any>({});
    const [vaccinationItems, setVaccinationItems] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [modals, setModals] = useState({ deactivateVaccinationPlan: false, activateVaccinationPlan: false, deactivationSuccess: false, activationSuccess: false, deactivationError: false, activationError: false });
    const [isSubmitting, setSubmitting] = useState<boolean>(false);

    const vaccinationPlanAttributes: Attribute[] = [
        { key: 'code', label: t('medication.vaccinePlan.attribute.code'), type: 'text' },
        { key: 'name', label: t('medication.vaccinePlan.attribute.name'), type: 'text' },
        { key: 'creation_date', label: t('medication.vaccinePlan.attribute.createdAt'), type: 'date' },
        {
            key: 'stage',
            label: t('medication.vaccinePlan.attribute.stage'),
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                const text = t(`feeding.stage.${row.stage}`, { defaultValue: t('medical.medication.field.unknown') });

                switch (row.stage) {
                    case "piglet": color = "info"; break;
                    case "weaning": color = "info"; break;
                    case "fattening": color = "primary"; break;
                    case "breeder": color = "primary"; break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            key: 'creation_responsible',
            label: t('medication.vaccinePlan.attribute.responsible'),
            type: 'text',
            render: (_, obj) => (<span className="text-black">{userLogged.name} {userLogged.lastname}</span>)
        },
    ]

    const vaccinesColumns: Column<any>[] = [
        {
            header: t('medication.vaccinePlan.vaccineColumn.code'),
            accessor: "vaccine.id",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.vaccine.id,
        },
        {
            header: t('medication.vaccinePlan.vaccineColumn.name'),
            accessor: "name",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.vaccine.name,
        },
        {
            header: t('medication.vaccinePlan.vaccineColumn.dose'),
            accessor: "dose",
            type: "text",
            isFilterable: true,
            render: (_, row) => `${row.dose} ${row.vaccine?.unit_measurement || ''}`,
        },
        {
            header: t('medication.vaccinePlan.vaccineColumn.route'),
            accessor: "administration_route",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                const label = value === 'protocol'
                    ? t('medication.vaccinePlan.protocol')
                    : t(`medical.medication.route.${value}`, { defaultValue: value });

                switch (value) {
                    case "oral": color = "info"; break;
                    default: color = "primary"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: t('medication.vaccinePlan.vaccineColumn.age'),
            accessor: "age_objective",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.age_objective} {t('medication.vaccinePlan.vaccineColumn.days')}</span>
        },
        {
            header: t('medication.vaccinePlan.vaccineColumn.frequency'),
            accessor: "frequency",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                const label = t(`medication.vaccinePlan.frequency.${value}`, { defaultValue: value });

                switch (value) {
                    case "single": color = "info"; break;
                    default: color = "primary"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
    ]

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext || !userLogged || !vaccinationPlanId) return;
        try {
            setLoading(true);
            const [vaccinationResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/vaccination_plan/find_by_id/${vaccinationPlanId}`)
            ])
            const vaccinationPlanData = vaccinationResponse.data.data;
            setVaccinationPlanDetails(vaccinationPlanData);
            setVaccinationItems(vaccinationPlanData.vaccines)
            setLoading(false)
        } catch (error) {
            logger.error('Error fetching data:', error)
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.vaccinePlan.error.load') })
        }
    }

    const deactivateVaccinationPlan = async () => {
        if (!configContext || !userLogged || !vaccinationPlanId) return;
        try {
            setSubmitting(true);
            const deactivateResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/vaccination_plan/deactivate/${vaccinationPlanId}`, {})

            if (deactivateResponse.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Plan de vacunacion ${vaccinationPlanDetails.code} desactivado`
                });

                toggleModal('deactivationSuccess')
            }
        } catch (error) {
            toggleModal('deactivationError')
        } finally {
            setSubmitting(false)
        }
    }

    const activateVaccinationPlan = async () => {
        if (!configContext || !userLogged || !vaccinationPlanId) return;
        try {
            setSubmitting(true);
            const deactivateResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/vaccination_plan/activate/${vaccinationPlanId}`, {})

            if (deactivateResponse.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Plan de vacunacion ${vaccinationPlanDetails.code} activado`
                });

                toggleModal('activationSuccess')
            }
        } catch (error) {
            toggleModal('activationError')
        } finally {
            setSubmitting(false)
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

    return (
        <>
            <div className="d-flex gap-2 mb-3 justify-content-end">
                {vaccinationPlanDetails.is_active ? (
                    <Button className="btn-danger" onClick={() => toggleModal('deactivateVaccinationPlan')}>
                        <i className="ri-forbid-line align-middle me-2 fs-5" />
                        {t('medication.vaccinePlan.action.deactivate')}
                    </Button>
                ) : (
                    <Button className="btn-success" onClick={() => toggleModal('activateVaccinationPlan')}>
                        <i className="ri-check-line align-middle me-2 fs-5" />
                        {t('medication.vaccinePlan.action.activate')}
                    </Button>
                )}
            </div>
            <div className="d-flex gap-3">
                <Card className="w-25">
                    <CardHeader className="bg-light">
                        <h5>{t('medication.vaccinePlan.info')}</h5>
                    </CardHeader>
                    <CardBody>
                        <ObjectDetails attributes={vaccinationPlanAttributes} object={vaccinationPlanDetails} />
                    </CardBody>
                </Card>

                <Card className="w-75">
                    <CardHeader className="bg-light">
                        <h5>{t('medication.vaccinePlan.vaccinesCard')}</h5>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable columns={vaccinesColumns} data={vaccinationItems} showSearchAndFilter={false} showPagination={true} rowsPerPage={5} />
                    </CardBody>
                </Card>
            </div>

            <Modal size="md" isOpen={modals.deactivateVaccinationPlan} toggle={() => toggleModal("deactivateVaccinationPlan")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("deactivateVaccinationPlan")}>{t('medication.vaccinePlan.action.deactivateModal')}</ModalHeader>
                <ModalBody>
                    <p>{t('medication.vaccinePlan.action.deactivateConfirm')}</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('deactivateVaccinationPlan', false)}>{t('common.button.cancel')}</Button>
                    <Button color="danger" onClick={() => { toggleModal('deactivateVaccinationPlan'); deactivateVaccinationPlan() }}>{t('common.button.confirm')}</Button>
                </ModalFooter>
            </Modal>

            <Modal size="md" isOpen={modals.activateVaccinationPlan} toggle={() => toggleModal("activateVaccinationPlan")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("activateVaccinationPlan")}>{t('medication.vaccinePlan.action.activateModal')}</ModalHeader>
                <ModalBody>
                    <p>{t('medication.vaccinePlan.action.activateConfirm')}</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('activateVaccinationPlan', false)}>{t('common.button.cancel')}</Button>
                    <Button color="danger" onClick={() => { toggleModal('activateVaccinationPlan'); activateVaccinationPlan() }}>{t('common.button.confirm')}</Button>
                </ModalFooter>
            </Modal>

            <SuccessModal isOpen={modals.deactivationSuccess} onClose={() => { toggleModal('deactivationSuccess'); fetchData() }} message={t('medication.vaccinePlan.success.deactivated')} />
            <SuccessModal isOpen={modals.activationSuccess} onClose={() => { toggleModal('activationSuccess'); fetchData() }} message={t('medication.vaccinePlan.success.activated')} />

            <ErrorModal isOpen={modals.deactivationError} onClose={() => { toggleModal('deactivationError') }} message={t('medication.vaccinePlan.error.deactivate')} />
            <ErrorModal isOpen={modals.activationError} onClose={() => { toggleModal('activationError') }} message={t('medication.vaccinePlan.error.activate')} />

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    )
}

export default VaccinationPlanDetails;