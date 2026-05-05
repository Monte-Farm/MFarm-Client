import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import LoadingAnimation from "../Shared/LoadingAnimation";

interface MedicationPackageDetailsProps {
    medicationPackageId: string;
}

const MedicationPackageDetails: React.FC<MedicationPackageDetailsProps> = ({ medicationPackageId }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [medicationPackageDetails, setMedicationPackageDetails] = useState<any>({});
    const [medicationsItems, setMedicationsItems] = useState<any[]>([]);
    const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [modals, setModals] = useState({ deactivateMedicationPackage: false, activateMedicationPackage: false, deactivationSuccess: false, activationSuccess: false, deactivationError: false, activationError: false });
    const [isSubmitting, setSubmitting] = useState<boolean>(false);

    const medicationAttributes: Attribute[] = [
        { key: 'code', label: t('common.field.code'), type: 'text' },
        { key: 'name', label: t('common.field.name'), type: 'text' },
        { key: 'creation_date', label: t('medication.package.column.createdAt'), type: 'date' },
        {
            label: t('common.field.stage'),
            key: 'stage',
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                const text = t(`feeding.stage.${row.stage}`, { defaultValue: t('medical.medication.field.unknown') });

                switch (row.stage) {
                    case "general": color = "info"; break;
                    case "piglet": color = "info"; break;
                    case "weaning": color = "warning"; break;
                    case "fattening": color = "primary"; break;
                    case "breeder": color = "success"; break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        { key: 'description', label: t('medication.package.detail.description'), type: 'text' },
        {
            key: 'creation_responsible',
            label: t('medication.package.detail.responsible'),
            type: 'text',
            render: (_, obj) => (<span className="text-black">{medicationPackageDetails?.creation_responsible?.name} {medicationPackageDetails?.creation_responsible?.lastname} </span>)
        },
        {
            key: 'is_active', label: t('common.field.status'), render: (value: boolean) => (
                <Badge color={value ? "success" : "danger"}>{value ? t('common.status.active') : t('common.status.inactive')}</Badge>
            ),
        },
    ]

    const medicationsColumns: Column<any>[] = [
        {
            header: t('feeding.package.form.column.image'), accessor: 'image', render: (_, row) => (
                <img src={row.medication.image || noImageUrl} alt="Imagen del Producto" style={{ height: "70px" }} />
            ),
        },
        {
            header: t('common.field.code'),
            accessor: "medication.id",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.medication.id,
        },
        {
            header: t('feeding.package.form.column.product'),
            accessor: "name",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.medication.name,

        },
        {
            header: t('feeding.package.form.column.category'),
            accessor: 'category',
            render: (_, row) => {
                let color = "secondary";
                const label = t(`feeding.productCategory.${row.medication?.category}`, { defaultValue: t('medical.medication.field.unknown') });

                switch (row.medication?.category) {
                    case "medications": color = "info"; break;
                    case "vaccines": color = "primary"; break;
                    case "vitamins": color = "primary"; break;
                    case "minerals": color = "primary"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: t('medication.package.medicationColumn.quantity'),
            accessor: "quantity",
            type: "text",
            isFilterable: true,
            render: (_, row) => `${row.quantity} ${row.medication?.unit_measurement || ''}`,
        },
        {
            header: t('medication.package.medicationColumn.route'),
            accessor: "administration_route",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                const label = t(`medical.medication.route.${value}`, { defaultValue: value });

                switch (value) {
                    case "oral": color = "info"; break;
                    case "intramuscular": color = "primary"; break;
                    case "subcutaneous": color = "primary"; break;
                    case "intravenous": color = "primary"; break;
                    case "intranasal": color = "primary"; break;
                    case "topical": color = "primary"; break;
                    case "rectal": color = "primary"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
    ]

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const medicationResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/medication_package/find_by_id/${medicationPackageId}`);
            const medicationData = medicationResponse.data.data;
            setMedicationPackageDetails(medicationData);
            setMedicationsItems(medicationData.medications);

            const productIds = medicationData.medications.map((item: any) => item.medication._id || item.medication.id);
            const pricesResponse = await configContext.axiosHelper.create(
                `${configContext.apiUrl}/warehouse/average_prices/${userLogged.farm_assigned}`,
                { productIds }
            );
            const pricesMap: Record<string, number> = {};
            for (const p of pricesResponse.data.data) {
                pricesMap[p.productId] = p.averagePrice;
            }
            setCurrentPrices(pricesMap);
        } catch (error) {
            logger.error('Error fetching data:', error)
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.package.error.load') })
        } finally {
            setLoading(false)
        }
    }

    const deactivateMedicationPackage = async () => {
        if (!configContext || !userLogged || !medicationPackageId) return;
        try {
            setSubmitting(true);
            const deactivateResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/medication_package/deactivate/${medicationPackageId}`, {})

            if (deactivateResponse.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de medicamentos ${medicationPackageDetails.code} desactivado`
                });

                toggleModal('deactivationSuccess')
            }
        } catch (error) {
            toggleModal('deactivationError')
        } finally {
            setSubmitting(false)
        }
    }

    const activateMedicationPackage = async () => {
        if (!configContext || !userLogged || !medicationPackageId) return;
        try {
            setSubmitting(true);
            const deactivateResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/medication_package/activate/${medicationPackageId}`, {})

            if (deactivateResponse.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de medicamentos ${medicationPackageDetails.code} activado`
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

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <div className="d-flex gap-2 mb-3 justify-content-end">
                {userLogged.role.includes('veterinarian') || userLogged.role.includes('farm_manager') ? (
                    <>
                        {medicationPackageDetails.is_active ? (
                            <Button className="btn-danger" onClick={() => toggleModal('deactivateMedicationPackage')}>
                                <i className="ri-forbid-line align-middle me-2 fs-5" />
                                {t('medication.package.action.deactivate')}
                            </Button>
                        ) : (
                            <Button className="btn-success" onClick={() => toggleModal('activateMedicationPackage')}>
                                <i className="ri-check-line align-middle me-2 fs-5" />
                                {t('medication.package.action.activate')}
                            </Button>
                        )}
                    </>
                ) : null}

            </div>
            <div className="d-flex gap-3 align-items-start">
                <Card className="border-primary border-opacity-25 flex-shrink-0" style={{ width: '320px' }}>
                    <CardHeader className="bg-primary bg-opacity-10">
                        <h5 className="mb-0 text-primary">
                            <i className="ri-file-list-3-line me-2" />
                            {t('medication.package.info.card')}
                        </h5>
                    </CardHeader>
                    <CardBody>
                        <ObjectDetails attributes={medicationAttributes} object={medicationPackageDetails} />
                    </CardBody>
                </Card>

                <Card className="flex-fill border-success border-opacity-25">
                    <CardHeader className="bg-success bg-opacity-10">
                        <h5 className="mb-0 text-success">
                            <i className="ri-medicine-bottle-line me-2" />
                            {t('medication.package.info.medicationsCard')}
                        </h5>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable columns={medicationsColumns} data={medicationsItems} showSearchAndFilter={false} showPagination={true} rowsPerPage={5} />

                        <div className="border-top">
                            <div className="d-flex gap-3 px-4 py-3">
                                <div className="flex-fill bg-success bg-opacity-10 rounded px-4 py-3 d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="text-muted small mb-1">
                                            <i className="ri-history-line me-1" />
                                            {t('medication.package.info.costAtRegistration')}
                                        </div>
                                        <div className="fs-4 fw-bold text-success">
                                            ${medicationsItems.reduce((total, item) => {
                                                return total + (item.quantity ?? 0) * (item.averagePrice ?? 0);
                                            }, 0).toFixed(2)}
                                        </div>
                                        <div className="d-flex align-items-center gap-1 mt-1">
                                            <i className="ri-information-line text-warning small" />
                                            <small className="text-muted">
                                                {medicationPackageDetails.creation_date
                                                    ? t('medication.package.info.recordedOn', { date: new Date(medicationPackageDetails.creation_date).toLocaleDateString('es-MX') })
                                                    : '—'}
                                            </small>
                                        </div>
                                    </div>
                                    <i className="ri-money-dollar-circle-line fs-1 text-success opacity-50" />
                                </div>

                                <div className="flex-fill bg-primary bg-opacity-10 rounded px-4 py-3 d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="text-muted small mb-1">
                                            <i className="ri-refresh-line me-1" />
                                            {t('medication.package.info.costAtCurrent')}
                                        </div>
                                        {Object.keys(currentPrices).length > 0 ? (
                                            <>
                                                <div className="fs-4 fw-bold text-primary">
                                                    ${medicationsItems.reduce((total, item) => {
                                                        const productId = item.medication?._id || item.medication?.id;
                                                        const price = currentPrices[productId] ?? 0;
                                                        return total + (item.quantity ?? 0) * price;
                                                    }, 0).toFixed(2)}
                                                </div>
                                                <div className="d-flex align-items-center gap-1 mt-1">
                                                    <i className="ri-information-line text-warning small" />
                                                    <small className="text-muted">
                                                        {t('medication.package.info.currentPrice', { date: new Date().toLocaleDateString('es-MX') })}
                                                    </small>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="fs-4 fw-bold text-muted">—</div>
                                        )}
                                    </div>
                                    <i className="ri-money-dollar-circle-line fs-1 text-primary opacity-50" />
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Modal size="md" isOpen={modals.deactivateMedicationPackage} toggle={() => toggleModal("deactivateMedicationPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("deactivateMedicationPackage")}>{t('medication.package.action.deactivateModal')}</ModalHeader>
                <ModalBody>
                    <p>{t('medication.package.action.deactivateConfirm')}</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('deactivateMedicationPackage', false)}>{t('common.button.cancel')}</Button>
                    <Button color="danger" onClick={() => { toggleModal('deactivateMedicationPackage'); deactivateMedicationPackage() }}>{t('common.button.confirm')}</Button>
                </ModalFooter>
            </Modal>

            <Modal size="md" isOpen={modals.activateMedicationPackage} toggle={() => toggleModal("activateMedicationPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("activateMedicationPackage")}>{t('medication.package.action.activateModal')}</ModalHeader>
                <ModalBody>
                    <p>{t('medication.package.action.activateConfirm')}</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('activateMedicationPackage', false)}>{t('common.button.cancel')}</Button>
                    <Button color="danger" onClick={() => { toggleModal('activateMedicationPackage'); activateMedicationPackage() }}>{t('common.button.confirm')}</Button>
                </ModalFooter>
            </Modal>


            <SuccessModal isOpen={modals.deactivationSuccess} onClose={() => { toggleModal('deactivationSuccess'); fetchData() }} message={t('medication.package.success.deactivated')} />
            <SuccessModal isOpen={modals.activationSuccess} onClose={() => { toggleModal('activationSuccess'); fetchData() }} message={t('medication.package.success.activated')} />

            <ErrorModal isOpen={modals.deactivationError} onClose={() => { toggleModal('deactivationError') }} message={t('medication.package.error.deactivate')} />
            <ErrorModal isOpen={modals.activationError} onClose={() => { toggleModal('activationError') }} message={t('medication.package.error.activate')} />

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    )
}

export default MedicationPackageDetails;