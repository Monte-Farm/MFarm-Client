import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Attribute } from "common/data_interfaces";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Col, FormFeedback, Input, Label, Row } from "reactstrap";
import SimpleBar from "simplebar-react";
import { PigletSnapshot } from "common/data_interfaces";
import * as Yup from "yup";
import classnames from "classnames";
import DatePicker from "react-flatpickr";
import { HttpStatusCode } from "axios";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import SuccessModal from "../Shared/SuccessModal";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { useTranslation } from "react-i18next";

interface CreateLitterStandaloneValues {
    farm: string;
    mother: string;
    father: string;
    birthDate: Date | null;
    initialMale: number;
    initialFemale: number;
    currentMale: number;
    currentFemale: number;
    status: string;
    observations: string;
    responsible: string;
}

interface CreateLitterStandaloneFormProps {
    onSave: (created: any) => void;
    onCancel: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    active: 'primary',
    ready_to_wean: 'warning',
    weaned: 'success',
    wean_overdue: 'dark',
};

const CreateLitterStandaloneForm: React.FC<CreateLitterStandaloneFormProps> = ({ onSave, onCancel: _onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();

    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState(true);
    const [sows, setSows] = useState<any[]>([]);
    const [boars, setBoars] = useState<any[]>([]);
    const [hasBajas, setHasBajas] = useState(false);
    const [pigletsArray, setPigletsArray] = useState<PigletSnapshot[]>([]);
    const [useIndividualWeight, setUseIndividualWeight] = useState(false);
    const [totalLitterWeight, setTotalLitterWeight] = useState<number | ''>('');
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ success: false });
    const [createdLitter, setCreatedLitter] = useState<any>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            const modifiedSteps = [...passedarrowSteps, tab];
            if (tab >= 1 && tab <= 3) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const step1Schema = Yup.object({
        mother: Yup.string().optional(),
        birthDate: Yup.date().nullable().required(t('litter.standalone.validation.birthDateRequired')),
        currentMale: Yup.number().min(0).required(),
        currentFemale: Yup.number().min(0).required(),
        initialMale: Yup.number().min(0).required(),
        initialFemale: Yup.number().min(0).required(),
    })
        .test('pig-count-min', t('litter.standalone.validation.pigCountMin'), function (val) {
            return (val?.currentMale ?? 0) + (val?.currentFemale ?? 0) > 0;
        })
        .test('initial-gte-current', t('litter.standalone.validation.initialGteCurrent'), function (val) {
            if (!hasBajas) return true;
            return (val?.initialMale ?? 0) >= (val?.currentMale ?? 0) &&
                (val?.initialFemale ?? 0) >= (val?.currentFemale ?? 0);
        });

    const step2Schema = Yup.object({
        observations: Yup.string().optional().max(500),
    });

    const formik = useFormik<CreateLitterStandaloneValues>({
        initialValues: {
            farm: userLogged.farm_assigned || '',
            mother: '',
            father: '',
            birthDate: null,
            initialMale: 0,
            initialFemale: 0,
            currentMale: 0,
            currentFemale: 0,
            status: 'active',
            observations: '',
            responsible: userLogged._id || '',
        },
        validationSchema: step1Schema.concat(step2Schema),
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const avgWeight = pigletsArray.length > 0
                    ? pigletsArray.reduce((acc, p) => acc + Number(p.weight), 0) / pigletsArray.length
                    : 0;

                const payload: Record<string, any> = {
                    farm: values.farm,
                    birthDate: values.birthDate,
                    initialMale: hasBajas ? values.initialMale : values.currentMale,
                    initialFemale: hasBajas ? values.initialFemale : values.currentFemale,
                    currentMale: values.currentMale,
                    currentFemale: values.currentFemale,
                    responsible: values.responsible,
                    piglets: pigletsArray,
                };
                if (avgWeight > 0) payload.averageWeight = Number(avgWeight.toFixed(2));
                if (values.mother) payload.mother = values.mother;
                if (values.father) payload.father = values.father;
                if (values.status) payload.status = values.status;
                if (values.observations) payload.observations = values.observations;

                const response = await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/litter/create_standalone`,
                    payload
                );
                if (response.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(
                        `${configContext.apiUrl}/user/add_user_history/${userLogged._id}`,
                        { event: `Camada standalone ${response.data.data.code} registrada` }
                    );
                    setCreatedLitter(response.data.data);
                    toggleModal('success');
                }
            } catch (error) {
                logger.error('Error saving standalone litter:', { error });
                setAlertConfig({ visible: true, color: 'danger', message: t('litter.standalone.error.save') });
            } finally {
                setSubmitting(false);
            }
        },
    });

    const fetchInitialData = async () => {
        if (!configContext) return;
        try {
            setLoading(true);
            const [sowsRes, boarsRes] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_sows/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_boars/${userLogged.farm_assigned}`),
            ]);
            setSows(sowsRes.data.data || []);
            setBoars(boarsRes.data.data || []);
        } catch (error) {
            logger.error('Error fetching pigs for litter form:', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('litter.standalone.error.load') });
        } finally {
            setLoading(false);
        }
    };

    const checkStep1 = async () => {
        formik.setTouched({
            birthDate: true,
            initialMale: true, initialFemale: true,
            currentMale: true, currentFemale: true,
        });
        try {
            await step1Schema.validate(formik.values, { abortEarly: false });
            setAlertConfig({ visible: false, color: '', message: '' });
            toggleArrowTab(2);
        } catch {
            setAlertConfig({ visible: true, color: 'danger', message: t('litter.standalone.validation.fillAllData') });
        }
    };

    const checkStep2 = async () => {
        try {
            await step2Schema.validate(formik.values, { abortEarly: false });
            setAlertConfig({ visible: false, color: '', message: '' });
            toggleArrowTab(3);
        } catch {
            setAlertConfig({ visible: true, color: 'danger', message: t('litter.standalone.validation.fillAllData') });
        }
    };

    // Regenerate piglets array when counts change
    useEffect(() => {
        const males: PigletSnapshot[] = Array.from({ length: Number(formik.values.currentMale) }, () => ({
            sex: 'male', weight: 0, status: 'alive', recordedAt: new Date(),
        }));
        const females: PigletSnapshot[] = Array.from({ length: Number(formik.values.currentFemale) }, () => ({
            sex: 'female', weight: 0, status: 'alive', recordedAt: new Date(),
        }));
        setPigletsArray([...males, ...females]);
        setTotalLitterWeight('');
    }, [formik.values.currentMale, formik.values.currentFemale]);

    // Distribute total weight evenly across piglets
    useEffect(() => {
        if (!useIndividualWeight && totalLitterWeight !== '' && pigletsArray.length > 0) {
            const avg = Number(totalLitterWeight) / pigletsArray.length;
            setPigletsArray(pigletsArray.map(p => ({ ...p, weight: Number(avg.toFixed(2)) })));
        }
    }, [totalLitterWeight, useIndividualWeight, pigletsArray.length]);

    useEffect(() => { fetchInitialData(); }, []);

    const selectedMother = sows.find(s => s._id === formik.values.mother);
    const selectedFather = boars.find(b => b._id === formik.values.father);
    const totalCurrent = (formik.values.currentMale ?? 0) + (formik.values.currentFemale ?? 0);
    const totalAtBirth = hasBajas
        ? (formik.values.initialMale ?? 0) + (formik.values.initialFemale ?? 0)
        : totalCurrent;

    const litterAttributes: Attribute[] = [
        {
            key: 'mother', label: t('litter.standalone.motherLabel'), type: 'text',
            render: () => <span>{selectedMother ? `${selectedMother.code}` : '—'}</span>
        },
        {
            key: 'father', label: t('litter.standalone.fatherLabel'), type: 'text',
            render: () => <span>{selectedFather ? `${selectedFather.code}` : '—'}</span>
        },
        {
            key: 'birthDate', label: t('litter.standalone.birthDateLabel'), type: 'date',
            render: () => <span>{formik.values.birthDate ? new Date(formik.values.birthDate).toLocaleDateString() : '—'}</span>
        },
        {
            key: 'responsible', label: t('feeding.preparation.detail.responsible'), type: 'text',
            render: () => <span>{userLogged.name} {userLogged.lastname}</span>
        },
        {
            key: 'currentMale', label: t('litter.standalone.currentMaleLabel'), type: 'text',
            render: () => <span>{formik.values.currentMale}</span>
        },
        {
            key: 'currentFemale', label: t('litter.standalone.currentFemaleLabel'), type: 'text',
            render: () => <span>{formik.values.currentFemale}</span>
        },
        {
            key: 'totalCurrent', label: t('litter.standalone.totalCurrent'), type: 'text',
            render: () => <span><strong>{totalCurrent}</strong></span>
        },
        ...(hasBajas ? [
            {
                key: 'initialMale', label: t('litter.standalone.initialMaleLabel'), type: 'text' as const,
                render: () => <span>{formik.values.initialMale}</span>
            },
            {
                key: 'initialFemale', label: t('litter.standalone.initialFemaleLabel'), type: 'text' as const,
                render: () => <span>{formik.values.initialFemale}</span>
            },
            {
                key: 'totalAtBirth', label: t('litter.standalone.totalAtBirth'), type: 'text' as const,
                render: () => <span><strong>{totalAtBirth}</strong></span>
            },
        ] : []),
    ];

    const computedAvgWeight = pigletsArray.length > 0
        ? (pigletsArray.reduce((acc, p) => acc + Number(p.weight), 0) / pigletsArray.length).toFixed(2)
        : null;

    const additionalAttributes: Attribute[] = [
        {
            key: 'averageWeight', label: t('litter.standalone.avgWeightLabel'), type: 'text',
            render: () => <span>{computedAvgWeight && Number(computedAvgWeight) > 0 ? `${computedAvgWeight} kg` : '—'}</span>
        },
        {
            key: 'status', label: t('litter.standalone.statusLabel'), type: 'text',
            render: () => {
                const color = STATUS_COLORS[formik.values.status] || 'secondary';
                return <Badge color={color}>{t(`litter.status.${formik.values.status}`, { defaultValue: formik.values.status })}</Badge>;
            }
        },
        {
            key: 'observations', label: t('litter.standalone.observationsLabel'), type: 'text',
            render: () => <span>{formik.values.observations || '—'}</span>
        },
    ];

    if (loading) return <LoadingAnimation />;

    return (
        <>
            <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }}>
                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink href="#"
                                className={classnames({ active: activeStep === 1, done: activeStep > 1 })}
                                onClick={() => toggleArrowTab(1)} aria-selected={activeStep === 1} disabled>
                                {t('litter.standalone.step1')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="#"
                                className={classnames({ active: activeStep === 2, done: activeStep > 2 })}
                                onClick={() => toggleArrowTab(2)} aria-selected={activeStep === 2} disabled>
                                {t('litter.standalone.step2')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="#"
                                className={classnames({ active: activeStep === 3 })}
                                onClick={() => toggleArrowTab(3)} aria-selected={activeStep === 3} disabled>
                                {t('litter.standalone.step3')}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    {/* ── Step 1: Required litter data ── */}
                    <TabPane tabId={1}>
                        <h5 className="border-bottom border-2 pb-2">{t('litter.standalone.step1Title')}</h5>

                        <Row>
                            <Col md={6} className="mt-3">
                                <Label htmlFor="mother" className="form-label">{t('litter.standalone.motherLabel')}</Label>
                                <Input type="select" id="mother" name="mother"
                                    value={formik.values.mother} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    invalid={formik.touched.mother && !!formik.errors.mother}>
                                    <option value="">{t('litter.standalone.motherPlaceholder')}</option>
                                    {sows.map(sow => (
                                        <option key={sow._id} value={sow._id}>{sow.code}</option>
                                    ))}
                                </Input>
                                {formik.touched.mother && formik.errors.mother && <FormFeedback>{formik.errors.mother}</FormFeedback>}
                            </Col>
                            <Col md={6} className="mt-3">
                                <Label htmlFor="father" className="form-label">{t('litter.standalone.fatherLabel')}</Label>
                                <Input type="select" id="father" name="father"
                                    value={formik.values.father} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                                    <option value="">{t('litter.standalone.fatherPlaceholder')}</option>
                                    {boars.map(boar => (
                                        <option key={boar._id} value={boar._id}>{boar.code}</option>
                                    ))}
                                </Input>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6} className="mt-3">
                                <Label className="form-label">{t('litter.standalone.birthDateLabel')} *</Label>
                                <DatePicker
                                    className={`form-control ${formik.touched.birthDate && formik.errors.birthDate ? 'is-invalid' : ''}`}
                                    value={formik.values.birthDate ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue('birthDate', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }} />
                                {formik.touched.birthDate && formik.errors.birthDate && (
                                    <div className="invalid-feedback d-block">{formik.errors.birthDate as string}</div>
                                )}
                            </Col>
                            <Col md={6} className="mt-3">
                                <Label className="form-label">{t('feeding.preparation.detail.responsible')}</Label>
                                <Input type="text" value={`${userLogged.name} ${userLogged.lastname}`} disabled />
                            </Col>
                        </Row>

                        <h6 className="border-bottom pb-2 mt-4">{t('litter.standalone.pigletsTitle')}</h6>

                        <Row>
                            <Col md={4} className="mt-3">
                                <Label htmlFor="currentMale" className="form-label">{t('litter.standalone.currentMaleLabel')}</Label>
                                <Input type="number" id="currentMale" name="currentMale"
                                    value={formik.values.currentMale} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    min={0} />
                            </Col>
                            <Col md={4} className="mt-3">
                                <Label htmlFor="currentFemale" className="form-label">{t('litter.standalone.currentFemaleLabel')}</Label>
                                <Input type="number" id="currentFemale" name="currentFemale"
                                    value={formik.values.currentFemale} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    min={0} />
                            </Col>
                            <Col md={4} className="mt-3">
                                <Label className="form-label">{t('litter.standalone.totalCurrent')}</Label>
                                <Input type="number" value={totalCurrent} disabled />
                            </Col>
                        </Row>

                        <div className="form-check form-switch mt-4">
                            <Input
                                type="checkbox"
                                className="form-check-input"
                                id="hasBajas"
                                checked={hasBajas}
                                onChange={e => {
                                    setHasBajas(e.target.checked);
                                    if (!e.target.checked) {
                                        formik.setFieldValue('initialMale', 0);
                                        formik.setFieldValue('initialFemale', 0);
                                    }
                                }}
                            />
                            <Label className="form-check-label" htmlFor="hasBajas">
                                {t('litter.standalone.hasBajasLabel')}
                            </Label>
                            <div className="text-muted small mt-1">{t('litter.standalone.hasBajasHint')}</div>
                        </div>

                        {hasBajas && (
                            <>
                                <h6 className="border-bottom pb-2 mt-4">{t('litter.standalone.atBirthTitle')}</h6>
                                <p className="text-muted small">{t('litter.standalone.atBirthHint')}</p>
                                <Row>
                                    <Col md={4} className="mt-3">
                                        <Label htmlFor="initialMale" className="form-label">{t('litter.standalone.initialMaleLabel')}</Label>
                                        <Input type="number" id="initialMale" name="initialMale"
                                            value={formik.values.initialMale} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                            min={0} />
                                    </Col>
                                    <Col md={4} className="mt-3">
                                        <Label htmlFor="initialFemale" className="form-label">{t('litter.standalone.initialFemaleLabel')}</Label>
                                        <Input type="number" id="initialFemale" name="initialFemale"
                                            value={formik.values.initialFemale} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                            min={0} />
                                    </Col>
                                    <Col md={4} className="mt-3">
                                        <Label className="form-label">{t('litter.standalone.totalAtBirth')}</Label>
                                        <Input type="number" value={totalAtBirth} disabled />
                                    </Col>
                                </Row>
                            </>
                        )}

                        {/* ── Weight section ── */}
                        {totalCurrent > 0 && (
                            <Card className="mt-4 shadow-sm">
                                <CardHeader className="bg-light">
                                    <h6 className="mb-0 text-primary">{t('birth.form.cardWeightRecord', { defaultValue: 'Registro de Peso' })}</h6>
                                </CardHeader>
                                <CardBody>
                                    <div className="form-check form-switch mb-3">
                                        <Input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="useIndividualWeight"
                                            checked={useIndividualWeight}
                                            onChange={e => {
                                                setUseIndividualWeight(e.target.checked);
                                                setTotalLitterWeight('');
                                            }}
                                        />
                                        <Label className="form-check-label fw-semibold" htmlFor="useIndividualWeight">
                                            {t('birth.form.switchIndividualWeight', { defaultValue: 'Ingresar peso individual por lechón' })}
                                        </Label>
                                    </div>

                                    {!useIndividualWeight ? (
                                        <div>
                                            <Label className="form-label fw-semibold">
                                                <i className="ri-scales-3-line me-1 text-success"></i>
                                                {t('birth.form.litterWeight', { defaultValue: 'Peso total de la camada (kg)' })}
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={totalLitterWeight}
                                                onChange={e => setTotalLitterWeight(e.target.value === '' ? '' : Number(e.target.value))}
                                                onFocus={() => { if (totalLitterWeight === 0) setTotalLitterWeight(''); }}
                                                onBlur={() => { if (totalLitterWeight === '') setTotalLitterWeight(''); }}
                                                placeholder="0.0"
                                                min={0}
                                            />
                                            {Number(totalLitterWeight) > 0 && (
                                                <small className="text-muted d-block mt-2">
                                                    <i className="ri-calculator-line me-1"></i>
                                                    {t('birth.form.avgWeightPerPiglet', { defaultValue: 'Peso promedio por lechón:' })}{' '}
                                                    <strong>{(Number(totalLitterWeight) / pigletsArray.length).toFixed(2)} kg</strong>
                                                </small>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <Label className="form-label fw-semibold mb-3">
                                                <i className="ri-list-check me-1 text-primary"></i>
                                                {t('birth.form.individualWeight', { defaultValue: 'Peso individual de cada lechón' })}
                                            </Label>
                                            <SimpleBar style={{ maxHeight: 400, paddingRight: 10 }}>
                                                {pigletsArray.map((piglet, index) => (
                                                    <div key={index} className="border rounded p-3 mb-2 bg-light">
                                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                                            <span className="fw-bold">
                                                                {t('birth.form.pigletNumber', { number: index + 1, defaultValue: `Lechón #${index + 1}` })}
                                                            </span>
                                                            <Badge color={piglet.sex === 'male' ? 'info' : 'danger'}>
                                                                {t(`common.sex.${piglet.sex}`, { defaultValue: piglet.sex === 'male' ? '♂ Macho' : '♀ Hembra' })}
                                                            </Badge>
                                                        </div>
                                                        <Label className="form-label">{t('birth.form.weightKg', { defaultValue: 'Peso (kg)' })}</Label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="form-control"
                                                            value={pigletsArray[index].weight}
                                                            onChange={e => {
                                                                const newArray = [...pigletsArray];
                                                                newArray[index] = { ...newArray[index], weight: e.target.value === '' ? 0 : Number(e.target.value) };
                                                                setPigletsArray(newArray);
                                                            }}
                                                            min={0}
                                                        />
                                                    </div>
                                                ))}
                                            </SimpleBar>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        )}

                        <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible}
                            onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />

                        <div className="d-flex justify-content-end mt-4">
                            <Button color="primary" onClick={checkStep1}>
                                {t('common.button.next')}
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>
                        </div>
                    </TabPane>

                    {/* ── Step 2: Additional / optional data ── */}
                    <TabPane tabId={2}>
                        <h5 className="border-bottom border-2 pb-2">{t('litter.standalone.step2Title')}</h5>
                        <p className="text-muted small mb-3">{t('litter.standalone.step2Subtitle')}</p>

                        <Row>
                            <Col md={4} className="mt-3">
                                <Label htmlFor="status" className="form-label">{t('litter.standalone.statusLabel')}</Label>
                                <Input type="select" name="status"
                                    value={formik.values.status} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                                    <option value="active">{t('litter.status.active')}</option>
                                    <option value="ready_to_wean">{t('litter.status.ready_to_wean')}</option>
                                    <option value="weaned">{t('litter.status.weaned')}</option>
                                    <option value="wean_overdue">{t('litter.status.wean_overdue')}</option>
                                </Input>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12} className="mt-3">
                                <Label htmlFor="observations" className="form-label">{t('litter.standalone.observationsLabel')}</Label>
                                <Input type="textarea" id="observations" name="observations"
                                    value={formik.values.observations} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    placeholder={t('litter.standalone.observationsPlaceholder')} rows={3} />
                            </Col>
                        </Row>

                        <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible}
                            onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />

                        <div className="d-flex justify-content-between mt-4">
                            <Button color="secondary" onClick={() => toggleArrowTab(1)}>
                                <i className="ri-arrow-left-line me-1" />
                                {t('common.button.back')}
                            </Button>
                            <Button color="primary" onClick={checkStep2}>
                                {t('common.button.next')}
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>
                        </div>
                    </TabPane>

                    {/* ── Step 3: Summary ── */}
                    <TabPane tabId={3}>
                        <div className="d-flex gap-3 flex-wrap">
                            <Card className="flex-fill">
                                <CardHeader className="bg-light fw-bold fs-5">
                                    {t('litter.standalone.litterDataCard')}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={litterAttributes} object={formik.values} />
                                </CardBody>
                            </Card>
                            <Card className="flex-fill">
                                <CardHeader className="bg-light fw-bold fs-5">
                                    {t('litter.standalone.additionalDataCard')}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={additionalAttributes} object={formik.values} />
                                </CardBody>
                            </Card>
                        </div>

                        <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible}
                            onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />

                        <div className="d-flex justify-content-between mt-4">
                            <Button color="secondary" onClick={() => toggleArrowTab(2)}>
                                <i className="ri-arrow-left-line me-1" />
                                {t('common.button.back')}
                            </Button>
                            <Button color="success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                        {t('litter.standalone.saving')}
                                    </>
                                ) : (
                                    <>
                                        {t('litter.standalone.confirm')}
                                        <i className="ri-check-line ms-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <SuccessModal
                isOpen={modals.success}
                onClose={() => onSave(createdLitter)}
                message={t('litter.standalone.success', { code: createdLitter?.code ?? '' })}
            />
        </>
    );
};

export default CreateLitterStandaloneForm;
