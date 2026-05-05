import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import DatePicker from "react-flatpickr";
import { useFormik } from "formik";
import * as Yup from "yup";
import SelectableCustomTable from "../Tables/SelectableTable";
import MissingStockModal from "../Shared/MissingStockModal";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { useTranslation } from "react-i18next";

interface BulkGroupMedicationAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedGroups: any[];
    onSuccess: () => void;
}

const BulkGroupMedicationAssignmentModal: React.FC<BulkGroupMedicationAssignmentModalProps> = ({
    isOpen,
    onClose,
    selectedGroups,
    onSuccess
}) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false, subwarehouseError: false });
    const [medicationPackages, setMedicationPackages] = useState<any[]>([]);
    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<any>(null);
    const [missingItems, setMissingItems] = useState([]);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const medicationPackagesColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('common.field.name'), accessor: 'name', type: 'text', isFilterable: true },
        { header: t('medication.package.column.createdAt'), accessor: 'creation_date', type: 'date', isFilterable: true },
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
                    case "weaning": color = "warning"; break;
                    case "fattening": color = "primary"; break;
                    case "breeder": color = "success"; break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
    ];

    const bulkMedicationValidationSchema = Yup.object({
        packageId: Yup.string().required(t('medication.assign.bulkGroup.validation.packageRequired')),
        applicationDate: Yup.date().required(t('medication.assign.bulkGroup.validation.dateRequired')),
    });

    const bulkMedicationFormik = useFormik({
        initialValues: {
            packageId: '',
            name: '',
            applicationDate: null as Date | null,
            observations: '',
            appliedBy: userLogged?._id || '',
        },
        enableReinitialize: true,
        validationSchema: bulkMedicationValidationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            
            const groupIds = selectedGroups.map(group => group._id);

            try {
                setSubmitting(true);
                
                // 1. Asignar paquete de medicación masivo a grupos
                await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/medication_package/asign_bulk_group_medication_package/${userLogged.farm_assigned}`,
                    {
                        groupIds: groupIds,
                        packageId: values.packageId,
                        name: values.name,
                        applicationDate: values.applicationDate,
                        observations: values.observations,
                        appliedBy: values.appliedBy
                    }
                );

                // 2. Registrar en el historial del usuario
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de medicación ${values.name} asignado a ${groupIds.length} grupos`
                });

                toggleModal('success', true);
            } catch (error: any) {
                logger.error('Error bulk assigning medication package to groups:', error);
                
                // Manejo crítico de errores
                if (error.response?.status === 400 && error.response?.data?.missing) {
                    setMissingItems(error.response.data.missing);
                    toggleModal('missingStock', true);
                    return;
                }

                if (error.response?.status === 400 && !error.response?.data?.missing) {
                    toggleModal('subwarehouseError', true);
                    return;
                }

                toggleModal('error', true);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleMedicationPackageSelection = (selected: any[]) => {
        if (selected.length > 0) {
            const pkg = selected[0];
            setSelectedMedicationPackage(pkg);
            bulkMedicationFormik.setFieldValue('packageId', pkg._id);
            bulkMedicationFormik.setFieldValue('name', pkg.name);
        } else {
            setSelectedMedicationPackage(null);
            bulkMedicationFormik.setFieldValue('packageId', '');
            bulkMedicationFormik.setFieldValue('name', '');
        }
    };

    const handleSuccessClose = () => {
        toggleModal('success', false);
        onClose();
        onSuccess();
        bulkMedicationFormik.resetForm();
        setSelectedMedicationPackage(null);
    };

    const handleClose = () => {
        onClose();
        bulkMedicationFormik.resetForm();
        setSelectedMedicationPackage(null);
    };

    const fetchMedicationPackages = async () => {
        if (!configContext || !userLogged) return;
        
        try {
            // Obtener el stage más común de los grupos seleccionados
            const stages = selectedGroups.map(g => g.stage);
            const mostCommonStage = stages.sort((a, b) =>
                stages.filter(v => v === a).length - stages.filter(v => v === b).length
            ).pop() || 'general';

            const medicationResponse = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/medication_package/find_by_stage/${userLogged.farm_assigned}/${mostCommonStage}`
            );
            const packagesWithId = medicationResponse.data.data.map((p: any) => ({ ...p, id: p._id }));
            setMedicationPackages(packagesWithId);
        } catch (error) {
            logger.error('Error fetching medication packages:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMedicationPackages();
            bulkMedicationFormik.setFieldValue('applicationDate', new Date());
            setSelectedMedicationPackage(null);
        }
    }, [isOpen]);

    return (
        <>
            <Modal isOpen={isOpen} toggle={handleClose} size="lg" backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={handleClose}>
                    {t('medication.assign.bulkGroup.header', { count: selectedGroups.length })}
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={bulkMedicationFormik.handleSubmit}>
                        <div className="mb-3">
                            <small className="text-muted">
                                {t('medication.assign.bulkGroup.description')}
                            </small>
                        </div>

                        <div className="mb-4">
                            <Label className="form-label fw-semibold">{t('medication.assign.bulkGroup.selectPackage')}</Label>
                            {medicationPackages.length > 0 ? (
                                <>
                                    <SelectableCustomTable
                                        columns={medicationPackagesColumns}
                                        data={medicationPackages}
                                        showPagination={false}
                                        onSelect={handleMedicationPackageSelection}
                                        selectionOnlyOnCheckbox={false}
                                    />
                                    {bulkMedicationFormik.touched.packageId && bulkMedicationFormik.errors.packageId && (
                                        <div className="text-danger mt-2">{bulkMedicationFormik.errors.packageId}</div>
                                    )}
                                </>
                            ) : (
                                <div className="alert alert-warning d-flex align-items-center" role="alert">
                                    <i className="ri-error-warning-line fs-4 me-2 text-warning"></i>
                                    <div>
                                        <strong>{t('medication.assign.bulkGroup.noPackages')}</strong>
                                        <p className="mb-0 mt-1">{t('medication.assign.bulkGroup.noPackagesDesc')}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedMedicationPackage && (
                            <div className="alert alert-info">
                                <strong>{t('medication.assign.bulkGroup.selectedPackage')}</strong> {selectedMedicationPackage.name} ({selectedMedicationPackage.code})
                            </div>
                        )}

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="applicationDate" className="form-label">{t('medication.assign.field.date')}</Label>
                                <DatePicker
                                    id="applicationDate"
                                    className={`form-control ${bulkMedicationFormik.touched.applicationDate && bulkMedicationFormik.errors.applicationDate ? 'is-invalid' : ''}`}
                                    value={bulkMedicationFormik.values.applicationDate ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) bulkMedicationFormik.setFieldValue('applicationDate', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {bulkMedicationFormik.touched.applicationDate && bulkMedicationFormik.errors.applicationDate && (
                                    <FormFeedback className="d-block">{bulkMedicationFormik.errors.applicationDate as string}</FormFeedback>
                                )}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="appliedBy" className="form-label">{t('medication.assign.field.responsible')}</Label>
                                <Input
                                    type="text"
                                    id="appliedBy"
                                    name="appliedBy"
                                    value={`${userLogged?.name} ${userLogged?.lastname}`}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="observations" className="form-label">{t('medication.assign.field.observations')}</Label>
                            <Input
                                type="textarea"
                                id="observations"
                                name="observations"
                                rows={3}
                                value={bulkMedicationFormik.values.observations}
                                onChange={bulkMedicationFormik.handleChange}
                                onBlur={bulkMedicationFormik.handleBlur}
                                placeholder={t('medication.assign.bulkGroup.obsPlaceholder')}
                            />
                        </div>
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={handleClose}>{t('common.button.cancel')}</Button>
                    <Button
                        className="farm-primary-button"
                        onClick={() => bulkMedicationFormik.handleSubmit()}
                        disabled={bulkMedicationFormik.isSubmitting || !selectedMedicationPackage || medicationPackages.length === 0}
                    >
                        {bulkMedicationFormik.isSubmitting ? <Spinner size="sm" /> : t('medication.assign.bulkGroup.submit')}
                    </Button>
                </ModalFooter>
            </Modal>

            <SuccessModal
                isOpen={modals.success}
                onClose={handleSuccessClose}
                message={t('medication.assign.bulkGroup.success')}
            />

            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error', false)}
                message={t('medication.assign.bulkGroup.error')}
            />

            <MissingStockModal
                isOpen={modals.missingStock}
                onClose={() => toggleModal('missingStock', false)}
                missingItems={missingItems}
            />

            <Modal isOpen={modals.subwarehouseError} toggle={() => toggleModal('subwarehouseError', false)} centered>
                <ModalHeader toggle={() => toggleModal('subwarehouseError', false)}>
                    {t('medication.assign.bulkGroup.subwarehouseError.title')}
                </ModalHeader>
                <ModalBody>
                    <div className="text-center">
                        <i className="ri-error-warning-line" style={{ fontSize: '48px', color: '#f06548' }}></i>
                        <h5 className="mt-3">{t('medication.assign.bulkGroup.subwarehouseError.subtitle')}</h5>
                        <p className="text-muted">
                            {t('medication.assign.bulkGroup.subwarehouseError.description')}
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('subwarehouseError', false)}>
                        {t('common.button.close')}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default BulkGroupMedicationAssignmentModal;
