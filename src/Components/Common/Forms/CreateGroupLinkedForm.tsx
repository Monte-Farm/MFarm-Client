import { logger } from 'utils/logger';
import { preventEnterSubmit } from 'utils/formUtils';
import { ConfigContext } from "App";
import { GroupData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Col, FormFeedback, Input, Label, Row } from "reactstrap";
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
import { Attribute } from "common/data_interfaces";

interface PigSpecs {
    maleCount: number;
    femaleCount: number;
    birthdate: Date | null;
    breed: string;
    weight: number;
    origin: string;
    currentStage: string;
    observations?: string;
}

interface CreateGroupLinkedValues {
    code: string;
    name: string;
    farm: string;
    area: string;
    stage: string;
    status: string;
    responsible: string;
    creationDate: Date | null;
    observations: string;
    groupHistory: never[];
    pigSpecs: PigSpecs;
}

export interface CreateGroupLinkedDefaults {
    stage?: string;
    status?: string;
    area?: string;
    pigCurrentStage?: string;
}

interface CreateGroupLinkedFormProps {
    onSave: (created: GroupData) => void;
    onCancel: () => void;
    defaults?: CreateGroupLinkedDefaults;
}

const STAGE_COLORS: Record<string, string> = {
    piglet: 'info', weaning: 'warning', fattening: 'primary',
    breeder: 'success', general: 'secondary', lactation: 'danger',
    gestation: 'info', exit: 'dark', sale: 'warning',
};

const CreateGroupLinkedForm: React.FC<CreateGroupLinkedFormProps> = ({ onSave, onCancel: _onCancel, defaults = {} }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();

    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ success: false });
    const [createdGroup, setCreatedGroup] = useState<GroupData | null>(null);

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
        code: Yup.string().required(t('groups.validation.codeRequired'))
            .test('unique_code', t('groups.validation.codeExists'), async (value) => {
                if (!value || !configContext) return false;
                try {
                    const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/check_code_exists/${value}`);
                    return !response.data.codeExists;
                } catch (error) {
                    logger.error('Error validating unique code:', error);
                    return false;
                }
            }),
        name: Yup.string().required(t('groups.validation.nameRequired')),
        area: Yup.string().required(t('groups.validation.areaRequired')),
        stage: Yup.string().required(t('groups.validation.stageRequired')),
        observations: Yup.string().optional().max(500, t('groups.validation.observationsMax')),
    });

    const step2Schema = Yup.object({
        pigSpecs: Yup.object({
            maleCount: Yup.number().min(0).required(),
            femaleCount: Yup.number().min(0).required(),
            birthdate: Yup.date().nullable().required(t('groups.form.linked.validation.birthdateRequired')),
            breed: Yup.string().required(t('groups.form.linked.validation.breedRequired')),
            weight: Yup.number()
                .required(t('groups.form.linked.validation.weightRequired'))
                .min(0.1, t('groups.form.linked.validation.weightMin')),
            origin: Yup.string().required(t('groups.form.linked.validation.originRequired')),
            currentStage: Yup.string().required(t('groups.form.linked.validation.pigStageRequired')),
            observations: Yup.string().optional().max(500, t('groups.validation.observationsMax')),
        }).test('pig-count-min', t('groups.form.linked.validation.pigCountMin'), function (val) {
            return (val?.maleCount ?? 0) + (val?.femaleCount ?? 0) > 0;
        }),
    });

    const formik = useFormik<CreateGroupLinkedValues>({
        initialValues: {
            code: '',
            name: '',
            farm: userLogged.farm_assigned || '',
            area: defaults.area ?? '',
            stage: defaults.stage ?? '',
            status: defaults.status ?? '',
            responsible: userLogged._id || '',
            creationDate: new Date(),
            observations: '',
            groupHistory: [],
            pigSpecs: {
                maleCount: 0,
                femaleCount: 0,
                birthdate: null,
                breed: '',
                weight: 0,
                origin: '',
                currentStage: defaults.pigCurrentStage ?? '',
                observations: '',
            },
        },
        validationSchema: step1Schema.concat(step2Schema),
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const payload = {
                    code: values.code,
                    name: values.name,
                    farm: values.farm,
                    area: values.area,
                    stage: values.stage,
                    ...(values.status ? { status: values.status } : {}),
                    responsible: values.responsible,
                    creationDate: values.creationDate,
                    observations: values.observations || undefined,
                    groupMode: 'linked',
                    groupHistory: [],
                    pigSpecs: {
                        ...values.pigSpecs,
                        registered_by: userLogged._id,
                    },
                };
                const response = await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/group/create_group_linked`,
                    payload
                );
                if (response.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(
                        `${configContext.apiUrl}/user/add_user_history/${userLogged._id}`,
                        { event: `Grupo linked ${values.code} creado con ${(values.pigSpecs.maleCount + values.pigSpecs.femaleCount)} cerdos` }
                    );
                    setCreatedGroup(response.data.data);
                    toggleModal('success');
                }
            } catch (error) {
                logger.error('Error saving group linked:', { error });
                setAlertConfig({ visible: true, color: 'danger', message: t('groups.error.save') });
            } finally {
                setSubmitting(false);
            }
        },
    });

    const totalPigs = (formik.values.pigSpecs.maleCount ?? 0) + (formik.values.pigSpecs.femaleCount ?? 0);

    const fetchNextCode = async () => {
        if (!configContext) return;
        try {
            setLoading(true);
            const codeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/next_group_code`);
            formik.setFieldValue('code', codeResponse.data.data);
        } catch (error) {
            logger.error('Error fetching next group code:', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('groups.error.load') });
        } finally {
            setLoading(false);
        }
    };

    const checkStep1 = async () => {
        formik.setTouched({ code: true, name: true, area: true, stage: true, observations: true });
        try {
            await step1Schema.validate(formik.values, { abortEarly: false });
            setAlertConfig({ visible: false, color: '', message: '' });
            toggleArrowTab(2);
        } catch {
            setAlertConfig({ visible: true, color: 'danger', message: t('groups.validation.fillAllData') });
        }
    };

    const checkStep2 = async () => {
        formik.setTouched({
            pigSpecs: {
                maleCount: true, femaleCount: true, birthdate: true,
                breed: true, weight: true, origin: true, currentStage: true,
            }
        });
        try {
            await step2Schema.validate(formik.values, { abortEarly: false });
            setAlertConfig({ visible: false, color: '', message: '' });
            toggleArrowTab(3);
        } catch {
            setAlertConfig({ visible: true, color: 'danger', message: t('groups.validation.fillAllData') });
        }
    };

    useEffect(() => { fetchNextCode(); }, []);

    const groupAttributes: Attribute[] = [
        { key: 'code', label: t('common.field.code'), type: 'text' },
        { key: 'name', label: t('groups.column.name'), type: 'text' },
        { key: 'creationDate', label: t('groups.column.creationDate'), type: 'date' },
        {
            key: 'responsible', label: t('feeding.preparation.detail.responsible'), type: 'text',
            render: () => <span>{userLogged.name} {userLogged.lastname}</span>
        },
        {
            key: 'area', label: t('groups.column.area'), type: 'text',
            render: (_, row) => <span>{t(`groups.area.${row.area}`, { defaultValue: row.area })}</span>
        },
        {
            key: 'stage', label: t('groups.column.stage'), type: 'text',
            render: (_, row) => {
                const color = STAGE_COLORS[row.stage] || 'secondary';
                return <Badge color={color}>{t(`groups.stage.${row.stage}`, { defaultValue: row.stage })}</Badge>;
            }
        },
        { key: 'observations', label: t('groups.column.observations'), type: 'text' },
    ];

    const pigSpecAttributes: Attribute[] = [
        {
            key: 'maleCount', label: t('groups.kpi.males'), type: 'text',
            render: (_, row) => <span>{row.pigSpecs.maleCount}</span>
        },
        {
            key: 'femaleCount', label: t('groups.kpi.females'), type: 'text',
            render: (_, row) => <span>{row.pigSpecs.femaleCount}</span>
        },
        {
            key: 'pigCount', label: t('groups.column.total'), type: 'text',
            render: (_, row) => <span>{row.pigSpecs.maleCount + row.pigSpecs.femaleCount}</span>
        },
        {
            key: 'birthdate', label: t('groups.column.birthDate'), type: 'date',
            render: (_, row) => <span>{row.pigSpecs.birthdate ? new Date(row.pigSpecs.birthdate).toLocaleDateString() : '—'}</span>
        },
        {
            key: 'breed', label: t('groups.column.breed'), type: 'text',
            render: (_, row) => <span>{row.pigSpecs.breed}</span>
        },
        {
            key: 'weight', label: t('groups.column.weight'), type: 'text',
            render: (_, row) => <span>{row.pigSpecs.weight} kg</span>
        },
        {
            key: 'origin', label: t('groups.form.linked.originLabel'), type: 'text',
            render: (_, row) => <span>{t(`pigs.origin.${row.pigSpecs.origin}`, { defaultValue: row.pigSpecs.origin })}</span>
        },
        {
            key: 'currentStage', label: t('groups.form.linked.pigStageLabel'), type: 'text',
            render: (_, row) => <span>{t(`pigs.stage.${row.pigSpecs.currentStage}`, { defaultValue: row.pigSpecs.currentStage })}</span>
        },
    ];

    if (loading) return <LoadingAnimation />;

    const ps = formik.values.pigSpecs;
    const psErrors = formik.errors.pigSpecs as any;
    const psTouched = formik.touched.pigSpecs as any;

    return (
        <>
            <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }} onKeyDown={preventEnterSubmit}>
                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink href="#"
                                className={classnames({ active: activeStep === 1, done: activeStep > 1 })}
                                onClick={() => toggleArrowTab(1)} aria-selected={activeStep === 1} disabled>
                                {t('groups.form.linked.step1')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="#"
                                className={classnames({ active: activeStep === 2, done: activeStep > 2 })}
                                onClick={() => toggleArrowTab(2)} aria-selected={activeStep === 2} disabled>
                                {t('groups.form.linked.step2')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="#"
                                className={classnames({ active: activeStep === 3 })}
                                onClick={() => toggleArrowTab(3)} aria-selected={activeStep === 3} disabled>
                                {t('groups.form.linked.step3')}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    {/* ── Step 1: Group data ── */}
                    <TabPane tabId={1}>
                        <h5 className="border-bottom border-2 pb-2">{t('groups.form.generalData')}</h5>

                        <Row>
                            <Col md={6} className="mt-3">
                                <Label htmlFor="code" className="form-label">{t('common.field.code')} *</Label>
                                <Input type="text" id="code" name="code"
                                    value={formik.values.code} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    invalid={formik.touched.code && !!formik.errors.code}
                                    placeholder={t('groups.form.codePlaceholder')} />
                                {formik.touched.code && formik.errors.code && <FormFeedback>{formik.errors.code}</FormFeedback>}
                            </Col>
                            <Col md={6} className="mt-3">
                                <Label htmlFor="name" className="form-label">{t('groups.column.name')} *</Label>
                                <Input type="text" id="name" name="name"
                                    value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    invalid={formik.touched.name && !!formik.errors.name}
                                    placeholder={t('groups.form.namePlaceholder')} />
                                {formik.touched.name && formik.errors.name && <FormFeedback>{formik.errors.name}</FormFeedback>}
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6} className="mt-3">
                                <Label htmlFor="creationDate" className="form-label">{t('groups.column.creationDate')} *</Label>
                                <DatePicker id="creationDate"
                                    className="form-control"
                                    value={formik.values.creationDate ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue('creationDate', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }} />
                            </Col>
                            <Col md={6} className="mt-3">
                                <Label className="form-label">{t('feeding.preparation.detail.responsible')}</Label>
                                <Input type="text" value={`${userLogged.name} ${userLogged.lastname}`} disabled />
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6} className="mt-3">
                                <Label htmlFor="area" className="form-label">{t('groups.column.area')} *</Label>
                                <Input type="select" id="area" name="area"
                                    value={formik.values.area} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    invalid={formik.touched.area && !!formik.errors.area}>
                                    <option value="">{t('groups.form.selectArea')}</option>
                                    <option value="gestation">{t('groups.area.gestation')}</option>
                                    <option value="farrowing">{t('groups.area.farrowing')}</option>
                                    <option value="maternity">{t('groups.area.maternity')}</option>
                                    <option value="weaning">{t('groups.area.weaning')}</option>
                                    <option value="nursery">{t('groups.area.nursery')}</option>
                                    <option value="fattening">{t('groups.area.fattening')}</option>
                                    <option value="replacement">{t('groups.area.replacement')}</option>
                                    <option value="boars">{t('groups.area.boars')}</option>
                                    <option value="quarantine">{t('groups.area.quarantine')}</option>
                                    <option value="hospital">{t('groups.area.hospital')}</option>
                                    <option value="shipping">{t('groups.area.shipping')}</option>
                                </Input>
                                {formik.touched.area && formik.errors.area && <FormFeedback>{formik.errors.area}</FormFeedback>}
                            </Col>
                            <Col md={6} className="mt-3">
                                <Label htmlFor="stage" className="form-label">{t('groups.column.stage')} *</Label>
                                <Input type="select" id="stage" name="stage"
                                    value={formik.values.stage} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    invalid={formik.touched.stage && !!formik.errors.stage}>
                                    <option value="">{t('groups.form.selectStage')}</option>
                                    <option value="general">{t('groups.stage.general')}</option>
                                    <option value="lactation">{t('groups.stage.lactation')}</option>
                                    <option value="weaning">{t('groups.stage.weaning')}</option>
                                    <option value="fattening">{t('groups.stage.fattening')}</option>
                                    <option value="gestation">{t('groups.stage.gestation')}</option>
                                    <option value="breeder">{t('groups.stage.breeder')}</option>
                                    <option value="exit">{t('groups.stage.exit')}</option>
                                    <option value="sale">{t('groups.stage.sale')}</option>
                                </Input>
                                {formik.touched.stage && formik.errors.stage && <FormFeedback>{formik.errors.stage}</FormFeedback>}
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6} className="mt-3">
                                <Label htmlFor="status" className="form-label">{t('groups.form.linked.statusLabel')}</Label>
                                <Input type="select" name="status"
                                    value={formik.values.status} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                                    <option value="">{t('groups.form.linked.selectStatus')}</option>
                                    <option value="weaning">{t('groups.status.weaning')}</option>
                                    <option value="ready_to_grow">{t('groups.status.ready_to_grow')}</option>
                                    <option value="grow_overdue">{t('groups.status.grow_overdue')}</option>
                                    <option value="growing">{t('groups.status.growing')}</option>
                                    <option value="ready_for_sale">{t('groups.status.ready_for_sale')}</option>
                                    <option value="replacement">{t('groups.status.replacement')}</option>
                                    <option value="sale">{t('groups.status.sale')}</option>
                                    <option value="sold">{t('groups.status.sold')}</option>
                                </Input>
                            </Col>
                            <Col md={6} className="mt-3">
                                <Label htmlFor="observations" className="form-label">{t('groups.column.observations')}</Label>
                                <Input type="text" id="observations" name="observations"
                                    value={formik.values.observations} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    invalid={formik.touched.observations && !!formik.errors.observations}
                                    placeholder={t('groups.form.observationsPlaceholder')} rows={2} />
                                {formik.touched.observations && formik.errors.observations && <FormFeedback>{formik.errors.observations as string}</FormFeedback>}
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                            <Button color="primary" onClick={checkStep1}>
                                {t('common.button.next')}
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>
                        </div>
                    </TabPane>

                    {/* ── Step 2: Pig specs ── */}
                    <TabPane tabId={2}>
                        <h5 className="border-bottom border-2 pb-2">{t('groups.form.linked.pigSpecsTitle')}</h5>
                        <p className="text-muted small mb-3">{t('groups.form.linked.pigSpecsSubtitle')}</p>

                        <Row>
                            <Col md={4} className="mt-3">
                                <Label htmlFor="pigSpecs.femaleCount" className="form-label">{t('groups.form.femaleCount')}</Label>
                                <Input type="number" id="pigSpecs.femaleCount" name="pigSpecs.femaleCount"
                                    value={ps.femaleCount} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    min={0} />
                            </Col>
                            <Col md={4} className="mt-3">
                                <Label htmlFor="pigSpecs.maleCount" className="form-label">{t('groups.form.maleCount')}</Label>
                                <Input type="number" id="pigSpecs.maleCount" name="pigSpecs.maleCount"
                                    value={ps.maleCount} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    min={0} />
                            </Col>
                            <Col md={4} className="mt-3">
                                <Label className="form-label">{t('groups.form.linked.totalPigsLabel')}</Label>
                                <Input type="number" value={totalPigs} disabled />
                            </Col>
                        </Row>
                        {psTouched?.maleCount && psErrors?.pigSpecs && typeof psErrors.pigSpecs === 'string' && (
                            <div className="text-danger small mt-1">{psErrors.pigSpecs}</div>
                        )}

                        <Row>
                            <Col md={6} className="mt-3">
                                <Label className="form-label">{t('groups.form.linked.birthdateLabel')} *</Label>
                                <DatePicker
                                    className={`form-control ${psTouched?.birthdate && psErrors?.birthdate ? 'is-invalid' : ''}`}
                                    value={ps.birthdate ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue('pigSpecs.birthdate', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }} />
                                {psTouched?.birthdate && psErrors?.birthdate && (
                                    <div className="invalid-feedback d-block">{psErrors.birthdate}</div>
                                )}
                            </Col>
                            <Col md={6} className="mt-3">
                                <Label htmlFor="pigSpecs.breed" className="form-label">{t('groups.column.breed')} *</Label>
                                <Input type="select" id="pigSpecs.breed" name="pigSpecs.breed"
                                    value={ps.breed} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    invalid={psTouched?.breed && !!psErrors?.breed}>
                                    <option value="">{t('form.pig.placeholder.selectBreed')}</option>
                                    {["Yorkshire", "Landrace", "Duroc", "Hampshire", "Pietrain", "Berkshire", "Large White", "Chester White", "Poland China", "Tamworth"].map(b => <option key={b} value={b}>{b}</option>)}
                                </Input>
                                {psTouched?.breed && psErrors?.breed && <FormFeedback>{psErrors.breed}</FormFeedback>}
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4} className="mt-3">
                                <Label htmlFor="pigSpecs.weight" className="form-label">{t('groups.form.linked.weightLabel')} *</Label>
                                <Input type="number" id="pigSpecs.weight" name="pigSpecs.weight"
                                    value={ps.weight} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    invalid={psTouched?.weight && !!psErrors?.weight}
                                    min={0} step={0.1} />
                                {psTouched?.weight && psErrors?.weight && <FormFeedback>{psErrors.weight}</FormFeedback>}
                            </Col>
                            <Col md={4} className="mt-3">
                                <Label htmlFor="pigSpecs.origin" className="form-label">{t('groups.form.linked.originLabel')} *</Label>
                                <Input type="select" id="pigSpecs.origin" name="pigSpecs.origin"
                                    value={ps.origin} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    invalid={psTouched?.origin && !!psErrors?.origin}>
                                    <option value="">{t('groups.form.linked.selectOrigin')}</option>
                                    <option value="born">{t('pigs.origin.born')}</option>
                                    <option value="purchased">{t('pigs.origin.purchased')}</option>
                                    <option value="donated">{t('pigs.origin.donated')}</option>
                                    <option value="other">{t('pigs.origin.other')}</option>
                                </Input>
                                {psTouched?.origin && psErrors?.origin && <FormFeedback>{psErrors.origin}</FormFeedback>}
                            </Col>
                            <Col md={4} className="mt-3">
                                <Label htmlFor="pigSpecs.currentStage" className="form-label">{t('groups.form.linked.pigStageLabel')} *</Label>
                                <Input type="select" id="pigSpecs.currentStage" name="pigSpecs.currentStage"
                                    value={ps.currentStage} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    invalid={psTouched?.currentStage && !!psErrors?.currentStage}>
                                    <option value="">{t('groups.form.linked.selectPigStage')}</option>
                                    <option value="piglet">{t('pigs.stage.piglet')}</option>
                                    <option value="weaning">{t('pigs.stage.weaning')}</option>
                                    <option value="fattening">{t('pigs.stage.fattening')}</option>
                                    <option value="breeder">{t('pigs.stage.breeder')}</option>
                                    <option value="gestation">{t('pigs.stage.gestation')}</option>
                                    <option value="exit">{t('pigs.stage.exit')}</option>
                                    <option value="sale">{t('pigs.stage.sale')}</option>
                                </Input>
                                {psTouched?.currentStage && psErrors?.currentStage && <FormFeedback>{psErrors.currentStage}</FormFeedback>}
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12} className="mt-3">
                                <Label htmlFor="pigSpecs.observations" className="form-label">{t('groups.form.linked.pigObservationsLabel')}</Label>
                                <Input type="textarea" id="pigSpecs.observations" name="pigSpecs.observations"
                                    value={ps.observations} onChange={formik.handleChange} onBlur={formik.handleBlur}
                                    placeholder={t('groups.form.observationsPlaceholder')} rows={2} />
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
                                    {t('groups.form.groupInfoCard')}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={groupAttributes} object={formik.values} />
                                </CardBody>
                            </Card>

                            <Card className="flex-fill">
                                <CardHeader className="bg-light fw-bold fs-5">
                                    {t('groups.form.linked.pigSpecsCard')}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={pigSpecAttributes} object={formik.values} />
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
                                        {t('groups.form.saving')}
                                    </>
                                ) : (
                                    <>
                                        {t('groups.form.confirm')}
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
                onClose={() => onSave(createdGroup!)}
                message={t('groups.form.linked.success', {
                    total: totalPigs,
                    males: formik.values.pigSpecs.maleCount,
                    females: formik.values.pigSpecs.femaleCount,
                })}
            />
        </>
    );
};

export default CreateGroupLinkedForm;
