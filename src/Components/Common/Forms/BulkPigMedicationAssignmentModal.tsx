import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, CardBody, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import DatePicker from "react-flatpickr";
import { useFormik } from "formik";
import * as Yup from "yup";
import SelectableCustomTable from "../Tables/SelectableTable";
import MissingStockModal from "../Shared/MissingStockModal";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import noImageUrl from '../../../assets/images/no-image.png';

type Mode = 'package' | 'individual' | null;

interface BulkPigMedicationAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPigs: any[];
    onSuccess: () => void;
}

const isTablet = () => {
    const w = document.documentElement.clientWidth;
    return w >= 768 && w <= 1024;
};

const BulkPigMedicationAssignmentModal: React.FC<BulkPigMedicationAssignmentModalProps> = ({
    isOpen, onClose, selectedPigs, onSuccess,
}) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false, subwarehouseError: false });
    const [missingItems, setMissingItems] = useState([]);
    const [subwarehouses, setSubwarehouses] = useState<any[]>([]);
    const [warehouseSource, setWarehouseSource] = useState<string>('');

    // Package mode state
    const [medicationPackages, setMedicationPackages] = useState<any[]>([]);
    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<any>(null);

    // Individual mode state
    const [mode, setMode] = useState<Mode>(null);
    const [medicationsItems, setMedicationsItems] = useState<any[]>([]);
    const [medicationsSelected, setMedicationsSelected] = useState<any[]>([]);
    const [medicationErrors, setMedicationErrors] = useState<Record<string, any>>({});
    const [applicationDate, setApplicationDate] = useState<Date>(new Date());
    const [isSubmittingIndividual, setIsSubmittingIndividual] = useState(false);

    const toggleModal = (m: keyof typeof modals, state?: boolean) => setModals(prev => ({ ...prev, [m]: state ?? !prev[m] }));

    const resetMode = () => {
        setMode(null);
        setMedicationsSelected([]);
        setMedicationErrors({});
        setSelectedMedicationPackage(null);
        formik.setFieldValue('packageId', '');
        formik.setFieldValue('name', '');
    };

    const fullReset = () => {
        setMode(null);
        setMedicationsSelected([]);
        setMedicationErrors({});
        setSelectedMedicationPackage(null);
        setWarehouseSource('');
        formik.resetForm();
    };

    // ── Package mode ────────────────────────────────────────────────────────────
    const medicationPackagesColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('common.field.name'), accessor: 'name', type: 'text', isFilterable: true },
        { header: t('medication.package.column.createdAt'), accessor: 'creation_date', type: 'date', isFilterable: true },
        {
            header: t('common.field.stage'), accessor: 'stage', type: 'text', isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                switch (row.stage) {
                    case "general": case "piglet": color = "info"; break;
                    case "weaning": color = "warning"; break;
                    case "fattening": color = "primary"; break;
                    case "breeder": color = "success"; break;
                }
                return <Badge color={color}>{t(`feeding.stage.${row.stage}`, { defaultValue: t('medical.medication.field.unknown') })}</Badge>;
            },
        },
    ];

    const validationSchema = useMemo(() => Yup.object({
        packageId: Yup.string().required(t('medication.bulk.pig.validation.selectPackage')),
        applicationDate: Yup.date().required(t('form.validation.required')),
    }), [t]);

    const formik = useFormik({
        initialValues: {
            packageId: '', name: '',
            applicationDate: null as Date | null,
            observations: '',
            appliedBy: userLogged?._id || '',
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            const alivePigIds = selectedPigs.filter(p => p.status === 'alive').map(p => p._id);
            try {
                setSubmitting(true);
                await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/medication_package/asign_bulk_pig_medication_package/${userLogged.farm_assigned}`,
                    { pigIds: alivePigIds, packageId: values.packageId, name: values.name, applicationDate: values.applicationDate, observations: values.observations, appliedBy: values.appliedBy, warehouseSource }
                );
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de medicación ${values.name} asignado a ${alivePigIds.length} cerdos`,
                });
                toggleModal('success', true);
            } catch (error: any) {
                logger.error('Error bulk assigning medication package to pigs:', error);
                if (error.response?.status === 400 && error.response?.data?.missing) { setMissingItems(error.response.data.missing); toggleModal('missingStock', true); return; }
                if (error.response?.status === 400 && !error.response?.data?.missing) { toggleModal('subwarehouseError', true); return; }
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
            formik.setFieldValue('packageId', pkg._id);
            formik.setFieldValue('name', pkg.name);
        } else {
            setSelectedMedicationPackage(null);
            formik.setFieldValue('packageId', '');
            formik.setFieldValue('name', '');
        }
    };

    // ── Individual mode ─────────────────────────────────────────────────────────
    const medicationValidation = useMemo(() => Yup.object({
        medication: Yup.string().required(),
        dosePerPig: Yup.number().moreThan(0, t('form.validation.positive')).required(t('form.validation.required')),
        administrationRoute: Yup.string().required(t('form.validation.required')).notOneOf([""], t('form.validation.required')),
    }), [t]);

    const medicationsColumns: Column<any>[] = [
        { header: t('feeding.package.form.column.image'), accessor: 'image', render: (_, row) => <img src={row.image || noImageUrl} alt="" style={{ height: "60px" }} /> },
        { header: t('common.field.code'), accessor: "code", type: "text", isFilterable: true },
        { header: t('feeding.package.form.column.product'), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('feeding.package.form.column.category'), accessor: 'category',
            render: (value: string) => {
                let color = "secondary";
                if (value === 'medications') color = "info";
                if (value === 'vaccines') color = "primary";
                return <Badge color={color}>{t(`feeding.productCategory.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        {
            header: t('medication.card.medications.perHead'), accessor: "dosePerPig",
            render: (_, row, isSelected) => {
                const sel = medicationsSelected.find(m => m.medication === row._id);
                return (
                    <div className="input-group">
                        <Input type="number" disabled={!isSelected}
                            value={sel?.dosePerPig === 0 ? "" : (sel?.dosePerPig ?? "")}
                            invalid={medicationErrors[row._id]?.dosePerPig}
                            onChange={(e) => {
                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                setMedicationsSelected(prev => prev.map(m => m.medication === row._id ? { ...m, dosePerPig: val } : m));
                            }}
                            onClick={(e) => e.stopPropagation()} />
                        <span className="input-group-text">{row.unit_measurement}</span>
                    </div>
                );
            },
        },
        {
            header: t('medical.medication.field.route'), accessor: "administrationRoute",
            render: (_, row, isSelected) => {
                const sel = medicationsSelected.find(m => m.medication === row._id);
                return (
                    <Input type="select" disabled={!isSelected}
                        value={sel?.administrationRoute ?? ""}
                        invalid={medicationErrors[row._id]?.administrationRoute}
                        onChange={(e) => { const v = e.target.value; setMedicationsSelected(prev => prev.map(m => m.medication === row._id ? { ...m, administrationRoute: v } : m)); }}
                        onClick={(e) => e.stopPropagation()}>
                        <option value="">{t('form.pig.placeholder.selectOption')}</option>
                        <option value="oral">{t('medical.medication.route.oral')}</option>
                        <option value="intramuscular">{t('medical.medication.route.intramuscular')}</option>
                        <option value="subcutaneous">{t('medical.medication.route.subcutaneous')}</option>
                        <option value="intravenous">{t('medical.medication.route.intravenous')}</option>
                        <option value="intranasal">{t('medical.medication.route.intranasal')}</option>
                        <option value="topical">{t('medical.medication.route.topical')}</option>
                        <option value="rectal">{t('medical.medication.route.rectal')}</option>
                    </Input>
                );
            },
        },
    ];

    const validateSelectedMedications = async () => {
        if (!warehouseSource || medicationsSelected.length === 0) return false;
        const errors: Record<string, any> = {};
        for (const med of medicationsSelected) {
            try { await medicationValidation.validate(med, { abortEarly: false }); }
            catch (err: any) {
                const medErrors: any = {};
                err.inner.forEach((e: any) => { medErrors[e.path] = true; });
                errors[med.medication] = medErrors;
            }
        }
        setMedicationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const submitIndividual = async () => {
        if (!configContext || !userLogged) return;
        const valid = await validateSelectedMedications();
        if (!valid) return;
        const alivePigIds = selectedPigs.filter(p => p.status === 'alive').map(p => p._id);
        try {
            setIsSubmittingIndividual(true);
            const medications = medicationsSelected.map(m => ({ ...m, applicationDate, appliedBy: userLogged._id }));
            await configContext.axiosHelper.create(
                `${configContext.apiUrl}/medication_package/asign_bulk_pig_medications/${userLogged.farm_assigned}`,
                { pigIds: alivePigIds, medications, warehouseSource }
            );
            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Medicación individual asignada a ${alivePigIds.length} cerdos`,
            });
            toggleModal('success', true);
        } catch (error: any) {
            logger.error('Error bulk assigning individual medications to pigs:', error);
            if (error.response?.status === 400 && error.response?.data?.missing) { setMissingItems(error.response.data.missing); toggleModal('missingStock', true); return; }
            if (error.response?.status === 400 && !error.response?.data?.missing) { toggleModal('subwarehouseError', true); return; }
            toggleModal('error', true);
        } finally {
            setIsSubmittingIndividual(false);
        }
    };

    // ── Fetch ───────────────────────────────────────────────────────────────────
    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            const [pkgRes, medsRes, subwhRes] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/medication_package/find_by_stage/${userLogged.farm_assigned}/breeder`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_medication_products`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`),
            ]);
            setMedicationPackages(pkgRes.data.data.map((p: any) => ({ ...p, id: p._id })));
            setMedicationsItems(medsRes.data.data.map((b: any) => ({ ...b, code: b.id, id: b._id })));
            setSubwarehouses(subwhRes.data.data || []);
        } catch (error) {
            logger.error('Error fetching medication data for pigs:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
            formik.setFieldValue('applicationDate', new Date());
            setApplicationDate(new Date());
            fullReset();
        }
    }, [isOpen]);

    useEffect(() => {
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── Handlers ────────────────────────────────────────────────────────────────
    const handleSuccessClose = () => {
        toggleModal('success', false);
        onClose();
        onSuccess();
        fullReset();
    };

    const handleClose = () => {
        onClose();
        fullReset();
    };

    const alivePigsCount = selectedPigs.filter(p => p.status === 'alive').length;

    // ── Shared form fields ───────────────────────────────────────────────────────
    const sharedFields = (
        <>
            <div className="mb-3">
                <Label className="form-label">{t('medication.assign.field.warehouseSource')}</Label>
                <Input type="select" value={warehouseSource} onChange={(e) => setWarehouseSource(e.target.value)}>
                    <option value="">{t('medication.assign.field.warehouseSourcePlaceholder')}</option>
                    <option value="general">{t('medication.assign.field.warehouseGeneral')}</option>
                    {subwarehouses.map((w: any) => <option key={w._id} value={w._id}>{w.name}</option>)}
                </Input>
            </div>
            <div className="d-flex gap-2">
                <div className="w-50">
                    <Label className="form-label">{t('medication.assign.field.date')}</Label>
                    {mode === 'package' ? (
                        <DatePicker
                            className={`form-control ${formik.touched.applicationDate && formik.errors.applicationDate ? 'is-invalid' : ''}`}
                            value={formik.values.applicationDate ?? undefined}
                            onChange={(d: Date[]) => { if (d[0]) formik.setFieldValue('applicationDate', d[0]); }}
                            options={{ dateFormat: 'd/m/Y' }}
                        />
                    ) : (
                        <DatePicker className="form-control" value={applicationDate}
                            onChange={(d: Date[]) => { if (d[0]) setApplicationDate(d[0]); }}
                            options={{ dateFormat: 'd/m/Y' }} />
                    )}
                    {mode === 'package' && formik.touched.applicationDate && formik.errors.applicationDate && (
                        <FormFeedback className="d-block">{formik.errors.applicationDate as string}</FormFeedback>
                    )}
                </div>
                <div className="w-50">
                    <Label className="form-label">{t('medication.assign.field.responsible')}</Label>
                    <Input type="text" value={`${userLogged?.name} ${userLogged?.lastname}`} disabled />
                </div>
            </div>
        </>
    );

    return (
        <>
            <Modal isOpen={isOpen} toggle={handleClose} size="lg" backdrop="static" keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={handleClose}>
                    {t('medication.bulk.pig.title', { count: alivePigsCount })}
                </ModalHeader>
                <ModalBody>
                    {/* ── Mode selector ── */}
                    {mode === null && (
                        <div className="d-flex flex-column align-items-center gap-4 py-3">
                            <h5 className="text-muted">{t('medication.assign.mode.title')}</h5>
                            <div className="d-flex gap-4 w-100">
                                <Card className="w-50 text-center border shadow-sm" style={{ cursor: 'pointer' }} onClick={() => setMode('package')}>
                                    <CardBody className="py-4">
                                        <i className="ri-file-list-3-line text-primary" style={{ fontSize: '2.5rem' }} />
                                        <h5 className="mt-3">{t('medication.assign.mode.package')}</h5>
                                        <p className="text-muted mb-0 small">{t('medication.assign.mode.packageDesc')}</p>
                                    </CardBody>
                                </Card>
                                <Card className="w-50 text-center border shadow-sm" style={{ cursor: 'pointer' }} onClick={() => setMode('individual')}>
                                    <CardBody className="py-4">
                                        <i className="ri-medicine-bottle-line text-success" style={{ fontSize: '2.5rem' }} />
                                        <h5 className="mt-3">{t('medication.assign.mode.individual')}</h5>
                                        <p className="text-muted mb-0 small">{t('medication.assign.mode.individualDesc')}</p>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* ── Package mode ── */}
                    {mode === 'package' && (
                        <form onSubmit={formik.handleSubmit}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="text-muted mb-0">{t('medication.assign.mode.current.package')}</h6>
                                <Button size="sm" onClick={resetMode}><i className="ri-arrow-go-back-line me-1" />{t('medication.assign.mode.change')}</Button>
                            </div>

                            {sharedFields}

                            <div className="mt-4">
                                <Label className="form-label fw-semibold">{t('medication.bulk.pig.selectPackage')}</Label>
                                {medicationPackages.length > 0 ? (
                                    <>
                                        <SelectableCustomTable columns={medicationPackagesColumns} data={medicationPackages} showPagination={false} onSelect={handleMedicationPackageSelection} selectionOnlyOnCheckbox={false} />
                                        {formik.touched.packageId && formik.errors.packageId && (
                                            <div className="text-danger mt-2">{formik.errors.packageId}</div>
                                        )}
                                    </>
                                ) : (
                                    <div className="alert alert-warning d-flex align-items-center">
                                        <i className="ri-error-warning-line fs-4 me-2 text-warning" />
                                        <div>
                                            <strong>{t('medication.bulk.pig.noPackagesTitle')}</strong>
                                            <p className="mb-0 mt-1">{t('medication.bulk.pig.noPackagesBody')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedMedicationPackage && (
                                <div className="alert alert-info mt-3">
                                    <strong>{t('medication.bulk.pig.selectedPackage')}</strong> {selectedMedicationPackage.name} ({selectedMedicationPackage.code})
                                </div>
                            )}

                            <div className="mt-3">
                                <Label className="form-label">{t('pigs.field.observations')}</Label>
                                <Input type="textarea" name="observations" rows={2}
                                    value={formik.values.observations}
                                    onChange={formik.handleChange}
                                    placeholder={t('medication.assign.field.observationsPlaceholder')} />
                            </div>
                        </form>
                    )}

                    {/* ── Individual mode ── */}
                    {mode === 'individual' && (
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="text-muted mb-0">{t('medication.assign.mode.current.individual')}</h6>
                                <Button size="sm" onClick={resetMode}><i className="ri-arrow-go-back-line me-1" />{t('medication.assign.mode.change')}</Button>
                            </div>

                            {sharedFields}

                            <div className="mt-4">
                                <Label className="form-label fw-semibold">{t('medication.assign.field.selectMedications')}</Label>
                                <SelectableCustomTable
                                    columns={medicationsColumns}
                                    data={medicationsItems}
                                    showPagination
                                    rowsPerPage={5}
                                    onSelect={(rows) => {
                                        setMedicationsSelected(prev => rows.map(r => {
                                            const existing = prev.find(p => p.medication === r._id);
                                            if (existing) return existing;
                                            return { medication: r._id, dosePerPig: 0, administrationRoute: "", observations: "", unit_measurement: r.unit_measurement };
                                        }));
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={handleClose}>{t('common.button.cancel')}</Button>
                    {mode === 'package' && (
                        <Button className="farm-primary-button"
                            onClick={() => formik.handleSubmit()}
                            disabled={formik.isSubmitting || !selectedMedicationPackage || medicationPackages.length === 0 || !warehouseSource}>
                            {formik.isSubmitting ? <Spinner size="sm" /> : t('medication.bulk.pig.confirm')}
                        </Button>
                    )}
                    {mode === 'individual' && (
                        <Button className="farm-primary-button"
                            onClick={submitIndividual}
                            disabled={isSubmittingIndividual || medicationsSelected.length === 0 || !warehouseSource}>
                            {isSubmittingIndividual ? <Spinner size="sm" /> : t('medication.bulk.pig.confirm')}
                        </Button>
                    )}
                </ModalFooter>
            </Modal>

            <SuccessModal isOpen={modals.success} onClose={handleSuccessClose}
                message={mode === 'package' ? t('medication.bulk.pig.success') : t('medication.assign.success.medications')} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t('medication.assign.error.submit')} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
            <Modal isOpen={modals.subwarehouseError} toggle={() => toggleModal('subwarehouseError', false)} centered>
                <ModalHeader toggle={() => toggleModal('subwarehouseError', false)}>{t('medication.assign.error.subwarehouseTitle')}</ModalHeader>
                <ModalBody>
                    <div className="text-center">
                        <i className="ri-error-warning-line" style={{ fontSize: '48px', color: '#f06548' }} />
                        <h5 className="mt-3">{t('medication.assign.error.subwarehouseHeading')}</h5>
                        <p className="text-muted">{t('medication.bulk.pig.subwarehouseBody')}</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('subwarehouseError', false)}>{t('common.button.close')}</Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default BulkPigMedicationAssignmentModal;
