import { ConfigContext } from "App";
import { PigData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import React, { useContext, useEffect, useState } from "react";
import DatePicker from "react-flatpickr";
import { Button, FormFeedback, Input, Label, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import * as Yup from 'yup';
import classnames from "classnames";
import LoadingAnimation from "../Shared/LoadingAnimation";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { darkenHex } from "utils/colorUtils";

interface SinglePigFormProps {
    onSave: () => void;
    onCancel: () => void;
}

const SinglePigForm: React.FC<SinglePigFormProps> = ({ onSave, onCancel }) => {
    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [modals, setModals] = useState({ success: false, error: false });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            const modifiedSteps = [...passedarrowSteps, tab];
            if (tab >= 1 && tab <= 4) { setActiveStep(tab); setPassedarrowSteps(modifiedSteps); }
        }
    }

    const validationSchema = Yup.object({
        code: Yup.string().required(t('pigs.field.code')).test('unique_code', t('pigs.field.code'), async (value) => {
            if (!value || !configContext) return !!value;
            try {
                const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/check_code_exists/${value}`);
                return !response.data.data;
            } catch { return false; }
        }),
        birthdate: Yup.date().max(new Date()).required(t('pigs.field.birthDate')),
        breed: Yup.string().required(t('pigs.field.breed')),
        origin: Yup.mixed<'born' | 'purchased' | 'donated' | 'other'>().oneOf(['born', 'purchased', 'donated', 'other']).required(t('pigs.field.origin')),
        originDetail: Yup.string().when('origin', { is: 'otro', then: schema => schema.required(t('pigs.field.originDetail')), otherwise: schema => schema.notRequired() }),
        arrivalDate: Yup.date().when('origin', { is: (val: string) => val !== 'born', then: schema => schema.max(new Date()).required(t('pigs.field.arrivalDate')), otherwise: schema => schema.notRequired() }),
        sourceFarm: Yup.string().when('origin', { is: (val: string) => val === 'purchased' || val === 'donated', then: schema => schema.required(t('pigs.field.originFarm')), otherwise: schema => schema.notRequired() }),
        purchasePrice: Yup.number().when('origin', { is: 'purchased', then: schema => schema.min(0.01).required(t('form.pig.field.purchasePrice')), otherwise: schema => schema.notRequired() }),
        status: Yup.mixed<'alive' | 'sold' | 'slaughtered' | 'dead' | 'discarded'>().oneOf(['alive', 'sold', 'slaughtered', 'dead', 'discarded']).required(t('pigs.field.status')),
        currentStage: Yup.mixed<'piglet' | 'weaning' | 'fattening' | 'breeder'>().oneOf(['piglet', 'weaning', 'fattening', 'breeder']).required(t('pigs.field.stage')),
        sex: Yup.mixed<'male' | 'female'>().oneOf(['male', 'female']).required(t('pigs.field.sex')),
        weight: Yup.number().min(1).max(300).required(t('common.field.weight')),
        observations: Yup.string().notRequired(),
    });

    const formik = useFormik<PigData>({
        initialValues: {
            _id: '', code: '', farmId: '', breed: '', birthdate: null, origin: '', originDetail: '',
            sourceFarm: '', arrivalDate: null, purchasePrice: 0, status: 'alive', currentStage: 'piglet',
            sex: 'male', weight: 0, observations: '', historyChanges: [], feedings: [], medications: [],
            medicationPackagesHistory: [], vaccinationPlansHistory: [], sicknessHistory: [], reproduction: [],
            registered_by: userLogged._id, registration_date: null, feedAdministrationHistory: [],
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            if (!configContext) return;
            try {
                values.farmId = userLogged.farm_assigned;
                await configContext.axiosHelper.create(`${configContext.apiUrl}/pig/create`, values);
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, { event: `Registro de cerdo ${values.code}` });
                toggleModal('success');
            } catch { toggleModal('error'); }
        }
    });

    const fetchNextPigCode = async () => {
        if (!configContext) return;
        try {
            setLoading(true);
            const nextResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/get_next_pig_code`);
            formik.setFieldValue('code', nextResponse.data.data);
        } catch (error) {
            console.error('Error fetching the next code', { error });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNextPigCode();
        formik.setFieldValue('birthdate', new Date());
        formik.setFieldValue('registration_date', new Date());
    }, []);

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    const statusBadgeColor: Record<string, string> = { alive: "success", sold: "info", slaughtered: "warning", dead: "danger", discarded: "secondary" };
    const stageBadgeColor: Record<string, string> = { '': '', piglet: "primary", weaning: "info", fattening: "warning", breeder: "success" };
    const originBadgeColor: Record<string, string> = { '': '', born: "success", purchased: "info", donated: "primary", other: "secondary" };

    return (
        <>
            <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }}>
                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink href='#' id="step-pigdate-tab" className={classnames({ active: activeStep === 1, done: activeStep > 1 })} onClick={() => toggleArrowTab(1)} disabled>
                                {t('form.pig.step.pigData')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href='#' id="step-summary-tab" className={classnames({ active: activeStep === 2, done: activeStep > 2 })} onClick={() => toggleArrowTab(2)} disabled>
                                {t('form.pig.step.summary')}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane tabId={1}>
                        {/* Identificación */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header fw-semibold" style={{ backgroundColor: bg('#e3f2fd') }}>
                                <i className="ri-fingerprint-line me-2 text-primary"></i>{t('form.pig.section.identification')}
                            </div>
                            <div className="card-body">
                                <div className="d-flex gap-3">
                                    <div className="w-50">
                                        <Label htmlFor="code" className="form-label">{t('pigs.field.code')}</Label>
                                        <Input type="text" id="code" name="code" value={formik.values.code} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.code && !!formik.errors.code} placeholder="Ej: C001" />
                                        {formik.touched.code && formik.errors.code && <FormFeedback>{formik.errors.code}</FormFeedback>}
                                    </div>
                                    <div className="w-50">
                                        <Label htmlFor="birthdate" className="form-label">{t('pigs.field.birthDate')}</Label>
                                        <DatePicker id="birthdate" className={`form-control ${formik.touched.birthdate && formik.errors.birthdate ? 'is-invalid' : ''}`} value={formik.values.birthdate ?? undefined} onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue('birthdate', date[0]); }} options={{ dateFormat: 'd/m/Y' }} />
                                        {formik.touched.birthdate && formik.errors.birthdate && <FormFeedback className="d-block">{formik.errors.birthdate as string}</FormFeedback>}
                                    </div>
                                </div>
                                <div className="d-flex gap-3 mt-3">
                                    <div className="w-50">
                                        <Label htmlFor="breedInput" className="form-label">{t('pigs.field.breed')}</Label>
                                        <Input type="select" id="breedInput" name="breed" value={formik.values.breed} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.breed && !!formik.errors.breed}>
                                            <option value="">{t('form.pig.placeholder.selectBreed')}</option>
                                            {["Yorkshire","Landrace","Duroc","Hampshire","Pietrain","Berkshire","Large White","Chester White","Poland China","Tamworth"].map(b => <option key={b} value={b}>{b}</option>)}
                                        </Input>
                                        {formik.touched.breed && formik.errors.breed && <FormFeedback>{formik.errors.breed}</FormFeedback>}
                                    </div>
                                    <div className="w-50">
                                        <Label htmlFor="currentStage" className="form-label">{t('form.pig.field.currentStage')}</Label>
                                        <Input type="select" id="currentStage" name="currentStage" value={formik.values.currentStage} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.currentStage && !!formik.errors.currentStage}>
                                            <option value="piglet">{t('pigs.stage.piglet')}</option>
                                            <option value="weaning">{t('pigs.stage.weaning')}</option>
                                            <option value="fattening">{t('pigs.stage.fattening')}</option>
                                            <option value="breeder">{t('pigs.stage.breeder')}</option>
                                        </Input>
                                        {formik.touched.currentStage && formik.errors.currentStage && <FormFeedback>{formik.errors.currentStage}</FormFeedback>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Origen */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header fw-semibold" style={{ backgroundColor: bg('#e8f5e9') }}>
                                <i className="ri-map-pin-line me-2 text-success"></i>{t('form.pig.section.origin')}
                            </div>
                            <div className="card-body">
                                <div className="d-flex gap-3">
                                    <div className="w-50">
                                        <Label htmlFor="origin" className="form-label">{t('form.pig.field.originType')}</Label>
                                        <Input type="select" id="origin" name="origin" value={formik.values.origin} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.origin && !!formik.errors.origin}>
                                            <option value="">{t('form.pig.placeholder.selectOption')}</option>
                                            <option value="purchased">{t('pigs.origin.purchased')}</option>
                                            <option value="donated">{t('pigs.origin.donated')}</option>
                                            <option value="other">{t('pigs.origin.other')}</option>
                                        </Input>
                                        {formik.touched.origin && formik.errors.origin && <FormFeedback>{formik.errors.origin}</FormFeedback>}
                                    </div>
                                    {formik.values.origin !== '' && formik.values.origin !== 'born' && (
                                        <div className="w-50">
                                            <Label htmlFor="arrivalDate" className="form-label">{t('pigs.field.arrivalDate')}</Label>
                                            <DatePicker id="arrivalDate" className={`form-control ${formik.touched.arrivalDate && formik.errors.arrivalDate ? 'is-invalid' : ''}`} value={formik.values.arrivalDate ?? undefined} onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue('arrivalDate', date[0]); }} options={{ dateFormat: 'd/m/Y' }} />
                                            {formik.touched.arrivalDate && formik.errors.arrivalDate && <FormFeedback className="d-block">{formik.errors.arrivalDate as string}</FormFeedback>}
                                        </div>
                                    )}
                                </div>
                                {formik.values.origin !== '' && (
                                    <div className="d-flex gap-3 mt-3">
                                        {formik.values.origin === 'other' && (
                                            <div className="w-50">
                                                <Label htmlFor="originDetail" className="form-label">{t('pigs.field.originDetail')}</Label>
                                                <Input type="text" id="originDetail" name="originDetail" value={formik.values.originDetail} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.originDetail && !!formik.errors.originDetail} />
                                                {formik.touched.originDetail && formik.errors.originDetail && <FormFeedback>{formik.errors.originDetail as string}</FormFeedback>}
                                            </div>
                                        )}
                                        {(formik.values.origin === 'purchased' || formik.values.origin === 'donated') && (
                                            <div className="w-50">
                                                <Label htmlFor="sourceFarm" className="form-label">{t('pigs.field.originFarm')}</Label>
                                                <Input type="text" id="sourceFarm" name="sourceFarm" value={formik.values.sourceFarm} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.sourceFarm && !!formik.errors.sourceFarm} />
                                                {formik.touched.sourceFarm && formik.errors.sourceFarm && <FormFeedback>{formik.errors.sourceFarm as string}</FormFeedback>}
                                            </div>
                                        )}
                                        {formik.values.origin === 'purchased' && (
                                            <div className="w-50">
                                                <Label htmlFor="purchasePrice" className="form-label">{t('form.pig.field.purchasePrice')}</Label>
                                                <Input type="number" step="0.01" id="purchasePrice" name="purchasePrice" value={formik.values.purchasePrice} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.purchasePrice && !!formik.errors.purchasePrice} />
                                                {formik.touched.purchasePrice && formik.errors.purchasePrice && <FormFeedback>{formik.errors.purchasePrice as string}</FormFeedback>}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Características físicas */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header fw-semibold" style={{ backgroundColor: bg('#ede7f6') }}>
                                <i className="ri-scales-3-line me-2" style={{ color: '#7c4dff' }}></i>{t('form.pig.section.physicalTraits')}
                            </div>
                            <div className="card-body">
                                <div className="d-flex gap-3">
                                    <div className="w-50">
                                        <Label htmlFor="sex" className="form-label">{t('pigs.field.sex')}</Label>
                                        <Input type="select" id="sex" name="sex" value={formik.values.sex} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.sex && !!formik.errors.sex}>
                                            <option value="male">{t('pigs.sex.maleShort')}</option>
                                            <option value="female">{t('pigs.sex.femaleShort')}</option>
                                        </Input>
                                        {formik.touched.sex && formik.errors.sex && <FormFeedback>{formik.errors.sex}</FormFeedback>}
                                    </div>
                                    <div className="w-50">
                                        <Label htmlFor="weight" className="form-label">{t('form.pig.field.weightKg')}</Label>
                                        <Input type="number" id="weight" name="weight" value={formik.values.weight} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.weight && !!formik.errors.weight} />
                                        {formik.touched.weight && formik.errors.weight && <FormFeedback>{formik.errors.weight}</FormFeedback>}
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <Label htmlFor="observations" className="form-label">{t('pigs.field.observations')}</Label>
                                    <Input type="textarea" id="observations" name="observations" value={formik.values.observations} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                                </div>
                            </div>
                        </div>

                        <div className="d-flex mt-3 justify-content-end">
                            <Button type="button" onClick={async () => {
                                const valid = await formik.validateForm();
                                if (Object.keys(valid).length === 0) {
                                    toggleArrowTab(2);
                                } else {
                                    formik.setTouched(Object.keys(formik.values).reduce((acc, key) => ({ ...acc, [key]: true }), {}), true);
                                }
                            }}>
                                {t('form.pig.action.next')}<i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane tabId={2}>
                        <div className="p-2 fs-5">
                            <h4 className="fw-bold mb-4">{t('form.pig.section.summaryTitle')}</h4>
                            {(() => {
                                const sex = formik.values.sex;
                                const status = formik.values.status;
                                const stage = formik.values.currentStage;
                                const origin = formik.values.origin as string;
                                return (
                                    <>
                                        <div className="card mb-4 shadow-sm">
                                            <div className="card-header bg-light fw-semibold">{t('form.pig.section.generalData')}</div>
                                            <div className="card-body">
                                                <div className="row g-3">
                                                    <div className="col-md-4"><label className="fw-semibold">{t('pigs.field.code')}</label><div>{formik.values.code}</div></div>
                                                    <div className="col-md-4"><label className="fw-semibold">{t('pigs.field.birthDate')}</label><div>{formik.values.birthdate?.toLocaleDateString("es-MX")}</div></div>
                                                    <div className="col-md-4"><label className="fw-semibold">{t('pigs.field.breed')}</label><div>{formik.values.breed}</div></div>
                                                    <div className="col-md-4"><label className="fw-semibold">{t('form.pig.field.currentStage')}</label><div><span className={`badge bg-${stageBadgeColor[stage]} px-3 py-2`}>{t(`pigs.stage.${stage}`, { defaultValue: stage })}</span></div></div>
                                                    <div className="col-md-4"><label className="fw-semibold">{t('pigs.field.sex')}</label><div><span className={`badge px-3 py-2 ${sex === "male" ? "bg-primary" : "bg-pink"}`}><i className={`me-1 ${sex === "male" ? "ri-men-fill" : "ri-women-fill"}`} />{t(`pigs.sex.${sex}Short`, { defaultValue: sex })}</span></div></div>
                                                    <div className="col-md-4"><label className="fw-semibold">{t('form.pig.field.weightKg')}</label><div>{formik.values.weight} kg</div></div>
                                                    <div className="col-md-12"><label className="fw-semibold">{t('form.pig.section.physicalTraits')}</label><div>{formik.values.observations || t('form.pig.field.noSpecified')}</div></div>
                                                    <div className="col-md-4"><label className="fw-semibold">{t('form.pig.field.registeredBy')}</label><div>{userLogged.name} {userLogged.lastname}</div></div>
                                                    <div className="col-md-4"><label className="fw-semibold">{t('form.pig.field.registrationDate')}</label><div>{formik.values.registration_date ? (formik.values.registration_date as Date).toLocaleDateString("es") : t('form.pig.field.noSpecified')}</div></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card mb-4 shadow-sm">
                                            <div className="card-header bg-light fw-semibold">{t('form.pig.section.origin')}</div>
                                            <div className="card-body">
                                                <div className="row g-3">
                                                    <div className="col-md-6"><label className="fw-semibold">{t('form.pig.field.originType')}</label><div><span className={`badge bg-${originBadgeColor[origin]} px-3 py-2`}>{t(`pigs.origin.${origin}`, { defaultValue: origin })}</span></div></div>
                                                    {formik.values.origin === "other" && <div className="col-md-6"><label className="fw-semibold">{t('pigs.field.originDetail')}</label><div>{formik.values.originDetail}</div></div>}
                                                    {formik.values.origin !== "born" && <div className="col-md-6"><label className="fw-semibold">{t('pigs.field.arrivalDate')}</label><div>{formik.values.arrivalDate?.toLocaleDateString("es-MX")}</div></div>}
                                                    {(formik.values.origin === "purchased" || formik.values.origin === "donated") && <div className="col-md-6"><label className="fw-semibold">{t('pigs.field.originFarm')}</label><div>{formik.values.sourceFarm}</div></div>}
                                                    {formik.values.origin === "purchased" && <div className="col-md-6"><label className="fw-semibold">{t('form.pig.field.purchasePrice')}</label><div>${formik.values.purchasePrice?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div></div>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card mb-4 shadow-sm">
                                            <div className="card-header bg-light fw-semibold">{t('form.pig.section.pigStatus')}</div>
                                            <div className="card-body"><label className="fw-semibold">{t('pigs.field.status')}</label><div><span className={`badge bg-${statusBadgeColor[status]} px-3 py-2`}>{t(`pigs.status.${status}`, { defaultValue: status })}</span></div></div>
                                        </div>
                                        <div className="d-flex justify-content-between mt-4">
                                            <Button type="button" color="secondary" onClick={() => toggleArrowTab(1)}>
                                                <i className="ri-arrow-left-line me-2" />{t('form.pig.action.back')}
                                            </Button>
                                            <Button type="submit" color="primary" disabled={formik.isSubmitting}>
                                                {formik.isSubmitting
                                                    ? <>{t('form.pig.action.saving')}<span className="spinner-border spinner-border-sm ms-2" /></>
                                                    : <>{t('form.pig.action.saveRecord')}<i className="ri-save-3-fill ms-2" /></>
                                                }
                                            </Button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </TabPane>
                </TabContent>

                <SuccessModal isOpen={modals.success} onClose={onSave} message={t('form.pig.success.registered')} />
                <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t('form.pig.error.register')} />
            </form>
        </>
    );
};

export default SinglePigForm;
