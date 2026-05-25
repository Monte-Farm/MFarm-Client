import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { Attribute, GroupMedicationPackagesHistory, LitterEvent } from "common/data_interfaces";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, CardBody, CardHeader, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import { useFormik } from "formik";
import * as Yup from "yup";
import DatePicker from "react-flatpickr";
import LoadingAnimation from "../Shared/LoadingAnimation";
import SelectableCustomTable from "../Tables/SelectableTable";
import noImageUrl from '../../../assets/images/no-image.png';
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import MissingStockModal from "../Shared/MissingStockModal";

type Mode = 'package' | 'individual' | null;

interface Props { litterId: string; onSave: () => void; }

const AsignLitterMedicationCombinedForm: React.FC<Props> = ({ litterId, onSave }) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false, subwarehouseError: false });
    const [missingItems, setMissingItems] = useState<any[]>([]);
    const [isSubmittingIndividual, setIsSubmittingIndividual] = useState<boolean>(false);
    const [subwarehouses, setSubwarehouses] = useState<any[]>([]);
    const [warehouseSource, setWarehouseSource] = useState<string>("");

    const [mode, setMode] = useState<Mode>(null);
    const [litterDetails, setLitterDetails] = useState<any>();

    const [medicationsItems, setMedicationsItems] = useState<any[]>([]);
    const [medicationsSelected, setMedicationsSelected] = useState<any[]>([]);
    const [medicationErrors, setMedicationErrors] = useState<Record<string, any>>({});
    const [applicationDate, setApplicationDate] = useState<Date>(new Date());

    const [medicationsPackages, setMedicationsPackages] = useState<any[]>([]);
    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<any>();
    const [medicationPackagesItems, setMedicationsPackagesItems] = useState<any[]>();

    const totalAnimals = (litterDetails?.currentMale ?? 0) + (litterDetails?.currentFemale ?? 0);

    const toggleArrowTab = (tab: number) => { if (activeStep !== tab && tab >= 1 && tab <= 5) setActiveStep(tab); };
    const toggleModal = (m: keyof typeof modals, s?: boolean) => setModals(prev => ({ ...prev, [m]: s ?? !prev[m] }));

    const resetMode = () => {
        setMode(null);
        setMedicationsSelected([]);
        setMedicationErrors({});
        setSelectedMedicationPackage(undefined);
        setMedicationsPackagesItems(undefined);
        setWarehouseSource("");
        formik.setFieldValue('packageId', '');
        formik.setFieldValue('name', '');
        formik.setFieldValue('medications', []);
        formik.setFieldValue('observations', '');
        setActiveStep(1);
    };

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const litterResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/litter/find_by_id/${litterId}`);
            setLitterDetails(litterResponse.data.data);

            const [medicationsResponse, packagesResponse, subwarehousesResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_medication_products`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/medication_package/find_by_stage/${userLogged.farm_assigned}/piglet`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`),
            ]);

            const medsWithId = medicationsResponse.data.data.map((b: any) => ({ ...b, code: b.id, id: b._id }));
            const pkgsWithId = packagesResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            setMedicationsItems(medsWithId);
            setMedicationsPackages(pkgsWithId);
            setSubwarehouses(subwarehousesResponse.data.data || []);
        } catch (error) {
            logger.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.assign.error.load') });
        } finally {
            setLoading(false);
        }
    };

    const fetchMedicationsItemsForPackage = async (medications: any[]) => {
        if (!configContext || !userLogged || !medications) return;
        try {
            const ids = medications.map(m => m.medication);
            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_ids`, ids);
            const products = response.data.data;
            const combined = medications.map(med => {
                const product = products.find((p: any) => p._id === med.medication);
                return { ...product, ...med };
            });
            setMedicationsPackagesItems(combined);
        } catch (error) {
            logger.error('Error fetching package items:', error);
        }
    };

    const medicationValidation = useMemo(() => Yup.object({
        medication: Yup.string().required(),
        dosePerPig: Yup.number().moreThan(0, t('form.validation.positive')).required(t('form.validation.required')),
        administrationRoute: Yup.string().required(t('form.validation.required')).notOneOf([""], t('form.validation.required')),
    }), [t]);

    const validateSelectedMedications = async () => {
        const errors: Record<string, any> = {};
        if (!warehouseSource) {
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.assign.field.warehouseSourceRequired') });
            return false;
        }
        if (medicationsSelected.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.assign.validation.selectAtLeastOne') });
            return false;
        }
        for (const med of medicationsSelected) {
            try { await medicationValidation.validate(med, { abortEarly: false }); }
            catch (err: any) {
                const medErrors: any = {};
                err.inner.forEach((e: any) => { medErrors[e.path] = true; });
                errors[med.medication] = medErrors;
            }
        }
        setMedicationErrors(errors);
        if (Object.keys(errors).length > 0) {
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.assign.validation.fillAllData') });
            return false;
        }
        return true;
    };

    const packageValidationSchema = useMemo(() => Yup.object({
        applicationDate: Yup.date().required(t('form.validation.required')),
        appliedBy: Yup.string().required(t('form.validation.required')),
    }), [t]);

    const formik = useFormik<GroupMedicationPackagesHistory>({
        initialValues: {
            packageId: '', name: '', stage: '', medications: [],
            applicationDate: new Date(), appliedBy: userLogged._id, observations: '',
            isActive: true, estimatedTotal: 0,
        },
        enableReinitialize: false,
        validationSchema: packageValidationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            if (!configContext) return;
            try {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/medication_package/asign_litter_medication_package/${userLogged.farm_assigned}/${litterId}`, { ...values, warehouseSource });

                const litterEvent: LitterEvent = {
                    type: "GROUP_TREATMENT",
                    date: new Date(),
                    data: `Paquete de medicacion ${selectedMedicationPackage?.code} asignado`,
                    registeredBy: userLogged._id,
                };
                await configContext.axiosHelper.put(`${configContext.apiUrl}/litter/add_event/${litterId}`, litterEvent);
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, { event: `Paquete de medicación asignado a la camada ${litterDetails?.code}` });
                toggleModal('success', true);
            } catch (error: any) {
                logger.error('Error saving package:', error);
                if (error.response?.status === 400 && error.response?.data?.missing) { setMissingItems(error.response.data.missing); toggleModal('missingStock'); return; }
                if (error.response?.status === 400) { toggleModal('subwarehouseError'); return; }
                toggleModal('error');
            }
        },
    });

    const checkPackageSelected = () => {
        if (!warehouseSource) {
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.assign.field.warehouseSourceRequired') });
            return;
        }
        if (!formik.values.packageId) {
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.assign.validation.selectPackage') });
            return;
        }
        toggleArrowTab(activeStep + 1);
    };

    const submitIndividual = async () => {
        if (!configContext || !userLogged) return;
        try {
            setIsSubmittingIndividual(true);
            const medications = medicationsSelected.map(m => ({ ...m, applicationDate }));
            await configContext.axiosHelper.create(`${configContext.apiUrl}/medication_package/asign_litter_medications/${userLogged.farm_assigned}/${litterId}`, { medications, warehouseSource });

            const litterEvent: LitterEvent = {
                type: "GROUP_TREATMENT",
                date: new Date(),
                data: `Medicacion administrada`,
                registeredBy: userLogged._id,
            };
            await configContext.axiosHelper.put(`${configContext.apiUrl}/litter/add_event/${litterId}`, litterEvent);
            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, { event: `Medicación asignada a la camada ${litterDetails?.code}` });
            toggleModal('success', true);
        } catch (error: any) {
            logger.error('Error saving individual:', error);
            if (error.response?.status === 400 && error.response?.data?.missing) { setMissingItems(error.response.data.missing); toggleModal('missingStock'); return; }
            toggleModal('error');
        } finally {
            setIsSubmittingIndividual(false);
        }
    };

    useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

    useEffect(() => {
        if (selectedMedicationPackage && litterDetails) {
            const meds = selectedMedicationPackage.medications.map((m: any) => ({
                medication: m.medication,
                administrationRoute: m.administration_route,
                dosePerPig: m.quantity,
                totalDose: Number(m.quantity * totalAnimals),
            }));
            formik.setFieldValue('packageId', selectedMedicationPackage._id);
            formik.setFieldValue('name', selectedMedicationPackage.name);
            formik.setFieldValue('medications', meds);
            fetchMedicationsItemsForPackage(meds);
        }
        // eslint-disable-next-line
    }, [selectedMedicationPackage]);

    const medicationsColumns: Column<any>[] = [
        { header: t('feeding.package.form.column.image'), accessor: 'image', render: (_, row) => (<img src={row.image || noImageUrl} alt="" style={{ height: "70px" }} />) },
        { header: t('common.field.code'), accessor: "code", type: "text", isFilterable: true },
        { header: t('feeding.package.form.column.product'), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('feeding.package.form.column.category'), accessor: 'category',
            render: (value: string) => {
                let color = "secondary"; if (value === 'medications') color = "info"; if (value === 'vaccines') color = "primary";
                return <Badge color={color}>{t(`feeding.productCategory.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        {
            header: t('medication.card.medications.perHead'), accessor: "dosePerPig", type: "number",
            render: (_, row, isSelected) => {
                const sel = medicationsSelected.find(m => m.medication === row._id);
                return (
                    <div className="input-group">
                        <Input type="number" disabled={!isSelected}
                            value={sel?.dosePerPig === 0 ? "" : (sel?.dosePerPig ?? "")}
                            invalid={medicationErrors[row._id]?.dosePerPig}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                const totalDoseNew = Number(newValue * totalAnimals);
                                setMedicationsSelected(prev => prev.map(m => m.medication === row._id ? { ...m, dosePerPig: newValue, totalDose: totalDoseNew } : m));
                            }}
                            onClick={(e) => e.stopPropagation()} />
                        <span className="input-group-text">{row.unit_measurement}</span>
                    </div>
                );
            },
        },
        {
            header: t('medical.medication.field.route'), accessor: "administrationRoute", type: "text",
            render: (_, row, isSelected) => {
                const sel = medicationsSelected.find(m => m.medication === row._id);
                return (
                    <Input type="select" disabled={!isSelected}
                        value={sel?.administrationRoute ?? ""}
                        invalid={medicationErrors[row._id]?.administrationRoute}
                        onChange={(e) => {
                            const v = e.target.value;
                            setMedicationsSelected(prev => prev.map(m => m.medication === row._id ? { ...m, administrationRoute: v } : m));
                        }}
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
        {
            header: t('pigs.field.observations'), accessor: "observations", type: "text",
            render: (_, row, isSelected) => {
                const sel = medicationsSelected.find(m => m.medication === row._id);
                return (
                    <Input type="text" disabled={!isSelected}
                        value={sel?.observations ?? ""}
                        onChange={(e) => {
                            const v = e.target.value;
                            setMedicationsSelected(prev => prev.map(m => m.medication === row._id ? { ...m, observations: v } : m));
                        }}
                        onClick={(e) => e.stopPropagation()} />
                );
            },
        },
    ];

    const selectedIndividualColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: "code", type: "text", isFilterable: true },
        { header: t('feeding.package.form.column.product'), accessor: "name", type: "text", isFilterable: true },
        { header: t('medication.card.medications.perHead'), accessor: "dosePerPig", render: (_, row) => <span>{row.dosePerPig} {row.unit_measurement}</span> },
        { header: t('medication.card.medications.totalDose'), accessor: "totalDose", render: (_, row) => <span>{row.totalDose} {row.unit_measurement}</span> },
        {
            header: t('medical.medication.field.route'), accessor: "administrationRoute",
            render: (value: string) => <Badge color={value === 'oral' ? 'info' : 'primary'}>{t(`medical.medication.route.${value}`, { defaultValue: value })}</Badge>,
        },
    ];

    const medicationPackagesColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('common.field.name'), accessor: 'name', type: 'text', isFilterable: true },
        { header: t('medication.package.column.createdAt'), accessor: 'creation_date', type: 'date', isFilterable: true },
    ];

    const selectedPackageMedicationsColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: "id", type: "text", isFilterable: true },
        { header: t('feeding.package.form.column.product'), accessor: "name", type: "text", isFilterable: true },
        { header: t('medication.card.medications.perHead'), accessor: "dosePerPig", render: (_, row) => <span>{row.dosePerPig} {row.unit_measurement}</span> },
        { header: t('medication.card.medications.totalDose'), accessor: "totalDose", render: (_, row) => <span>{row.totalDose} {row.unit_measurement}</span> },
        {
            header: t('medical.medication.field.route'), accessor: "administrationRoute",
            render: (value: string) => <Badge color={value === 'oral' ? 'info' : 'primary'}>{t(`medical.medication.route.${value}`, { defaultValue: value })}</Badge>,
        },
    ];

    const litterAttributes: Attribute[] = [
        { key: 'code', label: t('common.field.code'), type: 'text' },
        { key: 'birthDate', label: t('pigs.field.birthDate'), type: 'date' },
        { key: 'currentMale', label: t('litter.attr.currentMale'), type: 'text' },
        { key: 'currentFemale', label: t('litter.attr.currentFemale'), type: 'text' },
        {
            key: 'status', label: t('common.field.status'), type: 'text',
            render: (value: any) => {
                let color = 'secondary';
                if (value === 'active') color = 'warning';
                if (value === 'weaned') color = 'success';
                return <Badge color={color}>{t(`litter.status.${value}`, { defaultValue: value })}</Badge>;
            },
        },
    ];

    const packageAttributes: Attribute[] = [
        { label: t('common.field.code'), key: 'code', type: 'text' },
        { label: t('common.field.name'), key: 'name', type: 'text' },
        { label: t('medication.package.column.createdAt'), key: 'creation_date', type: 'date' },
    ];

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    const step2Label = mode === 'package' ? t('medication.assign.step.package') : t('medication.assign.step.medications');

    return (
        <>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem><NavLink href="#" className={classnames({ active: activeStep === 1, done: activeStep > 1 })} disabled>{t('medication.assign.step.mode')}</NavLink></NavItem>
                    <NavItem><NavLink href="#" className={classnames({ active: activeStep === 2, done: activeStep > 2 })} disabled>{step2Label}</NavLink></NavItem>
                    <NavItem><NavLink href="#" className={classnames({ active: activeStep === 3, done: activeStep > 3 })} disabled>{t('medication.assign.step.summary')}</NavLink></NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    <div className="d-flex flex-column align-items-center gap-4 py-4">
                        <h5 className="text-muted">{t('medication.assign.mode.title')}</h5>
                        <div className="d-flex gap-4 w-75">
                            <Card className="w-50 text-center border shadow-sm" style={{ cursor: 'pointer' }} onClick={() => { setMode('package'); toggleArrowTab(2); }}>
                                <CardBody className="py-5">
                                    <i className="ri-file-list-3-line text-primary" style={{ fontSize: '3rem' }} />
                                    <h5 className="mt-3">{t('medication.assign.mode.package')}</h5>
                                    <p className="text-muted mb-0">{t('medication.assign.mode.packageDesc')}</p>
                                </CardBody>
                            </Card>
                            <Card className="w-50 text-center border shadow-sm" style={{ cursor: 'pointer' }} onClick={() => { setMode('individual'); toggleArrowTab(2); }}>
                                <CardBody className="py-5">
                                    <i className="ri-medicine-bottle-line text-success" style={{ fontSize: '3rem' }} />
                                    <h5 className="mt-3">{t('medication.assign.mode.individual')}</h5>
                                    <p className="text-muted mb-0">{t('medication.assign.mode.individualDesc')}</p>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </TabPane>

                <TabPane tabId={2}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="text-muted mb-0">
                            {mode === 'package' ? t('medication.assign.mode.current.package') : t('medication.assign.mode.current.individual')}
                        </h5>
                        <Button size="sm" onClick={resetMode}><i className="ri-arrow-go-back-line me-1" />{t('medication.assign.mode.change')}</Button>
                    </div>

                    <div className="mb-3">
                        <Label className="form-label">{t('medication.assign.field.warehouseSource')}</Label>
                        <Input
                            type="select"
                            value={warehouseSource}
                            onChange={(e) => setWarehouseSource(e.target.value)}
                        >
                            <option value="">{t('medication.assign.field.warehouseSourcePlaceholder')}</option>
                            <option value="general">{t('medication.assign.field.warehouseGeneral')}</option>
                            {subwarehouses.map((w: any) => (
                                <option key={w._id} value={w._id}>{w.name}</option>
                            ))}
                        </Input>
                    </div>

                    <div className="d-flex gap-3">
                        <div className="w-50">
                            <Label className="form-label">{t('medication.assign.field.date')}</Label>
                            {mode === 'package' ? (
                                <DatePicker className="form-control" value={formik.values.applicationDate ?? undefined}
                                    onChange={(d: Date[]) => { if (d[0]) formik.setFieldValue('applicationDate', d[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }} />
                            ) : (
                                <DatePicker className="form-control" value={applicationDate}
                                    onChange={(d: Date[]) => { if (d[0]) setApplicationDate(d[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }} />
                            )}
                        </div>
                        <div className="w-50">
                            <Label className="form-label">{t('medication.assign.field.responsible')}</Label>
                            <Input type="text" value={`${userLogged.name} ${userLogged.lastname}`} disabled />
                        </div>
                    </div>

                    {mode === 'package' && (
                        <>
                            <div className="mt-4">
                                <Label className="form-label">{t('medication.assign.field.observations')}</Label>
                                <Input type="text" name="observations" value={formik.values.observations} onChange={formik.handleChange} placeholder={t('medication.assign.field.observationsPlaceholder')} />
                            </div>
                            <div className="mt-4">
                                <Label className="form-label">{t('medication.assign.field.selectPackage')}</Label>
                                <SelectableCustomTable columns={medicationPackagesColumns} data={medicationsPackages} showPagination rowsPerPage={6} selectionMode="single" showSearchAndFilter={false} onSelect={(rows) => setSelectedMedicationPackage(rows[0])} />
                            </div>
                        </>
                    )}

                    {mode === 'individual' && (
                        <div className="mt-4">
                            <Label className="form-label">{t('medication.assign.field.selectMedications')}</Label>
                            <SelectableCustomTable columns={medicationsColumns} data={medicationsItems} showPagination rowsPerPage={6}
                                onSelect={(rows) => {
                                    setMedicationsSelected(prev => rows.map(r => {
                                        const existing = prev.find(p => p.medication === r._id);
                                        if (existing) return existing;
                                        return { medication: r._id, dosePerPig: 0, totalDose: 0, administrationRoute: "", observations: "", unit_measurement: r.unit_measurement };
                                    }));
                                }} />
                        </div>
                    )}

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(1)}><i className="ri-arrow-left-line me-2" />{t('common.button.back')}</Button>
                        <Button className="btn btn-primary" onClick={async () => {
                            if (mode === 'package') { checkPackageSelected(); }
                            else { const ok = await validateSelectedMedications(); if (ok) toggleArrowTab(3); }
                        }}>{t('common.button.next')}<i className="ri-arrow-right-line ms-1" /></Button>
                    </div>
                </TabPane>

                <TabPane tabId={3}>
                    <div className="d-flex gap-3 align-items-stretch">
                        <Card className="shadow-sm h-100">
                            <CardHeader className="bg-light fw-bold fs-5">{t('medication.assign.summary.litterCard')}</CardHeader>
                            <CardBody><ObjectDetails attributes={litterAttributes} object={litterDetails ?? {}} /></CardBody>
                        </Card>

                        <div className="w-100">
                            {mode === 'package' ? (
                                <>
                                    <Card className="shadow-sm mb-3">
                                        <CardHeader className="bg-light fw-bold fs-5">{t('medication.assign.summary.packageCard')}</CardHeader>
                                        <CardBody><ObjectDetails attributes={packageAttributes} object={selectedMedicationPackage ?? {}} /></CardBody>
                                    </Card>
                                    <Card className="shadow-sm">
                                        <CardHeader className="bg-light fw-bold fs-5"><h5 className="mb-0">{t('medication.assign.summary.medicationsCard')}</h5></CardHeader>
                                        <CardBody className="p-0">
                                            <CustomTable columns={selectedPackageMedicationsColumns} data={medicationPackagesItems || []} showSearchAndFilter={false} rowsPerPage={4} showPagination />
                                        </CardBody>
                                    </Card>
                                </>
                            ) : (
                                <Card className="shadow-sm">
                                    <CardHeader className="bg-light fw-bold fs-5"><h5 className="mb-0">{t('medication.assign.summary.medicationsCard')}</h5></CardHeader>
                                    <CardBody className="p-0">
                                        <CustomTable columns={selectedIndividualColumns} data={medicationsSelected.map(ms => ({ ...medicationsItems.find(p => p._id === ms.medication), ...ms }))} showSearchAndFilter={false} />
                                    </CardBody>
                                </Card>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(2)}><i className="ri-arrow-left-line me-2" />{t('common.button.back')}</Button>
                        <Button className="ms-auto btn-success"
                            onClick={() => { if (mode === 'package') formik.handleSubmit(); else submitIndividual(); }}
                            disabled={(mode === 'package' && formik.isSubmitting) || (mode === 'individual' && isSubmittingIndividual)}>
                            {(mode === 'package' && formik.isSubmitting) || (mode === 'individual' && isSubmittingIndividual)
                                ? <Spinner size="sm" />
                                : <><i className="ri-check-line me-2" />{t('medication.assign.button.assign')}</>}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={mode === 'package' ? t('medication.assign.success.package') : t('medication.assign.success.medications')} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t('medication.assign.error.submit')} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
            <ErrorModal isOpen={modals.subwarehouseError} onClose={() => toggleModal('subwarehouseError')} message={t('medication.assign.error.noSubwarehouse')} />
        </>
    );
};

export default AsignLitterMedicationCombinedForm;
