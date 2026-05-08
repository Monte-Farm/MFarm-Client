import { logger } from 'utils/logger';
import { ConfigContext } from "App"
import { useFormik } from "formik"
import { getEffectiveUser } from "helpers/impersonation_helper"
import { useContext, useEffect, useState } from "react"
import * as Yup from 'yup';
import classnames from "classnames";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import SelectableTable from "../Tables/SelectableTable";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Column } from "common/data/data_types";
import PigDetailsModal from "../Details/DetailsPigModal";
import AlertMessage from "../Shared/AlertMesagge";
import DatePicker from "react-flatpickr";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { HttpStatusCode } from "axios";
import ObjectDetails from "../Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import { useTranslation } from "react-i18next";

interface DiscardPigFormProps {
    pig?: any;
    onSave: () => void;
    onCancel: () => void;
}

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const DiscardPigForm: React.FC<DiscardPigFormProps> = ({ pig, onSave, onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ pigDetails: false, success: false, error: false });
    const [selectedPig, setSelectedPig] = useState<any>();
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(false);
    const [pigs, setPigs] = useState<any[]>([]);
    const [detailsSelectedPig, setDetailsSelectedPigs] = useState<string>('');

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            const modifiedSteps = [...passedarrowSteps, tab];
            if (tab >= 1 && tab <= 4) { setActiveStep(tab); setPassedarrowSteps(modifiedSteps); }
        }
    }

    const stageColorMap: Record<string, string> = { piglet: "info", weaning: "warning", fattening: "primary", breeder: "success" };
    const originColorMap: Record<string, string> = { born: 'success', purchased: 'warning', donated: 'info', other: 'dark' };
    const reasonColorMap: Record<string, string> = {
        lameness: "warning", poor_body_condition: "warning", reproductive_failure: "danger",
        low_milk_production: "info", disease: "danger", injury: "warning", aggressive_behavior: "primary",
        old_age: "secondary", death: "dark", poor_growth: "info", hernias: "warning",
        prolapse: "danger", non_ambulatory: "danger", respiratory_failure: "danger",
    };
    const destColorMap: Record<string, string> = {
        slaughterhouse: "primary", on_farm_euthanasia: "danger", sale: "success", research: "info",
        rendering: "secondary", composting: "warning", burial: "dark", incineration: "danger",
    };

    // camelCase converter for locale key lookup (poor_body_condition → poorBodyCondition)
    const toCamel = (s: string) => s.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase());

    const pigsColumns: Column<any>[] = [
        {
            header: t('pigs.field.code'), accessor: 'code',
            render: (_, row) => (
                <Button className="text-underline" color="link" onClick={(e) => { e.stopPropagation(); setDetailsSelectedPigs(row._id); toggleModal('pigDetails'); }}>
                    {row.code} ↗
                </Button>
            )
        },
        { header: t('pigs.field.breed'), accessor: 'breed', type: 'text', isFilterable: true },
        {
            header: t('pigs.field.sex'), accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? t('pigs.sex.male') : t('pigs.sex.female')}
                </Badge>
            ),
        },
        { header: t('pigs.field.currentWeight'), accessor: 'weight', type: 'number', isFilterable: true },
        {
            header: t('pigs.field.stage'), accessor: 'currentStage',
            render: (value: string) => (
                <Badge color={stageColorMap[value] || "secondary"}>{t(`pigs.stage.${value}`, { defaultValue: value })}</Badge>
            ),
        },
        { header: t('pigs.field.birthDateShort'), accessor: 'birthdate', type: 'date' },
    ];

    const pigsAttributes: Attribute[] = [
        { key: "code", label: t('pigs.field.code'), type: "text" },
        { key: "birthdate", label: t('pigs.field.birthDate'), type: "date" },
        { key: "breed", label: t('pigs.field.breed'), type: "text" },
        {
            key: "origin", label: t('pigs.field.origin'), type: "text",
            render: (value: string) => <Badge color={originColorMap[value] || 'secondary'}>{t(`pigs.origin.${value}`, { defaultValue: value })}</Badge>,
        },
        { key: "weight", label: t('pigs.field.currentWeight'), type: "text" },
        {
            key: 'currentStage', label: t('pigs.field.stage'),
            render: (value: string) => <Badge color={stageColorMap[value] || "secondary"}>{t(`pigs.stage.${value}`, { defaultValue: value })}</Badge>,
        },
        { key: "observations", label: t('pigs.field.observations'), type: "text" },
    ];

    const discardAttributes: Attribute[] = [
        {
            key: "reason", label: t('form.pig.field.discardReason'),
            render: (value: string) => <Badge color={reasonColorMap[value] || "secondary"}>{t(`pigs.discard.reason.${toCamel(value)}`, { defaultValue: value })}</Badge>,
        },
        {
            key: "destination", label: t('form.pig.field.discardDestination'),
            render: (value: string) => <Badge color={destColorMap[value] || "secondary"}>{t(`pigs.discard.destination.${toCamel(value)}`, { defaultValue: value })}</Badge>,
        },
        { key: "date", label: t('form.pig.field.discardDate'), type: "date" },
        { key: "observations", label: t('pigs.field.observations'), type: "text" },
    ];

    const validationSchema = Yup.object({
        reason: Yup.string().required(t('form.pig.field.discardReason')),
        destination: Yup.string().required(t('form.pig.field.discardDestination')),
        date: Yup.date().required(t('form.pig.field.discardDate')),
    });

    const formik = useFormik({
        initialValues: { reason: '', destination: '', date: null, responsible: userLogged._id, observations: '' },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext || !userLogged) return;
            try {
                setSubmitting(true);
                const discardResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/pig/discard_pig/${selectedPig._id}`, values);
                if (discardResponse.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, { event: `Cerdo: ${selectedPig.code} descartado` });
                    toggleModal('success');
                }
            } catch (error) {
                logger.error('Error discarding pig:', { error });
                toggleModal('error');
            } finally {
                setSubmitting(false);
            }
        }
    });

    const fetchPigs = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const pigResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_available_by_farm/${userLogged.farm_assigned}`);
            setPigs(pigResponse.data.data.map((b: any) => ({ ...b, id: b._id })));
        } catch (error) {
            logger.error('Error fetching pigs:', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoading(false);
        }
    };

    const checkSelectedPig = () => {
        if (selectedPig) { toggleArrowTab(activeStep + 1); }
        else { setAlertConfig({ visible: true, color: 'danger', message: t('form.pig.action.selectPigFirst') }); }
    };

    const checkDiscardData = async () => {
        setAlertConfig({ ...alertConfig, visible: false });
        formik.setTouched({ reason: true, destination: true, date: true });
        try { await validationSchema.validate(formik.values, { abortEarly: false }); toggleArrowTab(3); } catch {}
    };

    useEffect(() => {
        fetchPigs();
        formik.setFieldValue('date', new Date());
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        {!pig && (
                            <NavItem>
                                <NavLink href='#' id="step-pigSelect-tab" className={classnames({ active: activeStep === 1, done: activeStep > 1 })} onClick={() => toggleArrowTab(1)}>
                                    {t('form.pig.step.selectPig')}
                                </NavLink>
                            </NavItem>
                        )}
                        <NavItem>
                            <NavLink href='#' id="step-discardInfo-tab" className={classnames({ active: activeStep === 2, done: activeStep > 2 })} onClick={() => toggleArrowTab(2)}>
                                {t('form.pig.step.discardInfo')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href='#' id="step-summary-tab" className={classnames({ active: activeStep === 3, done: activeStep > 3 })} onClick={() => toggleArrowTab(3)}>
                                {t('form.pig.step.summary')}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane tabId={1}>
                        <SelectableTable data={pigs} columns={pigsColumns} selectionMode="single" showPagination rowsPerPage={7} onSelect={(rows) => setSelectedPig(rows?.[0])} />
                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkSelectedPig()}>
                                {t('form.pig.action.next')}<i className="ri-arrow-right-line" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane tabId={2}>
                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="discard_reason" className="form-label">{t('form.pig.field.discardReason')}</Label>
                                <Input type="select" id="discard_reason" name="reason" value={formik.values.reason} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.reason && !!formik.errors.reason}>
                                    <option value="">{t('form.pig.placeholder.selectReason')}</option>
                                    <option value="lameness">{t('pigs.discard.reason.lameness')}</option>
                                    <option value="poor_body_condition">{t('pigs.discard.reason.poorBodyCondition')}</option>
                                    <option value="reproductive_failure">{t('pigs.discard.reason.reproductiveFailure')}</option>
                                    <option value="low_milk_production">{t('pigs.discard.reason.lowMilkProduction')}</option>
                                    <option value="disease">{t('pigs.discard.reason.disease')}</option>
                                    <option value="injury">{t('pigs.discard.reason.injury')}</option>
                                    <option value="aggressive_behavior">{t('pigs.discard.reason.aggressiveBehavior')}</option>
                                    <option value="old_age">{t('pigs.discard.reason.oldAge')}</option>
                                    <option value="death">{t('pigs.discard.reason.death')}</option>
                                    <option value="poor_growth">{t('pigs.discard.reason.lowGrowth')}</option>
                                    <option value="hernias">{t('pigs.discard.reason.hernia')}</option>
                                    <option value="prolapse">{t('pigs.discard.reason.prolapse')}</option>
                                    <option value="non_ambulatory">{t('pigs.discard.reason.cannotWalk')}</option>
                                    <option value="respiratory_failure">{t('pigs.discard.reason.respiratoryProblems')}</option>
                                </Input>
                                {formik.touched.reason && formik.errors.reason && <FormFeedback>{formik.errors.reason}</FormFeedback>}
                            </div>
                            <div className="w-50">
                                <Label htmlFor="destination" className="form-label">{t('form.pig.field.discardDestination')}</Label>
                                <Input type="select" id="destination" name="destination" value={formik.values.destination} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.destination && !!formik.errors.destination}>
                                    <option value="">{t('form.pig.placeholder.selectDestination')}</option>
                                    <option value="slaughterhouse">{t('pigs.discard.destination.slaughterhouse')}</option>
                                    <option value="on_farm_euthanasia">{t('pigs.discard.destination.euthanasia')}</option>
                                    <option value="sale">{t('pigs.discard.destination.sale')}</option>
                                    <option value="research">{t('pigs.discard.destination.research')}</option>
                                    <option value="rendering">{t('pigs.discard.destination.processing')}</option>
                                    <option value="composting">{t('pigs.discard.destination.composting')}</option>
                                    <option value="burial">{t('pigs.discard.destination.burial')}</option>
                                    <option value="incineration">{t('pigs.discard.destination.incineration')}</option>
                                </Input>
                                {formik.touched.destination && formik.errors.destination && <FormFeedback>{formik.errors.destination}</FormFeedback>}
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="discard_date" className="form-label">{t('form.pig.field.discardDate')}</Label>
                                <DatePicker id="discard_date" className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`} value={formik.values.date ?? undefined} onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue('date', date[0]); }} options={{ dateFormat: 'd/m/Y' }} />
                                {formik.touched.date && formik.errors.date && <FormFeedback className="d-block">{formik.errors.date as string}</FormFeedback>}
                            </div>
                            <div className="w-50">
                                <Label htmlFor="responsible" className="form-label">{t('form.pig.field.discardResponsible')}</Label>
                                <Input type="text" id="responsible" name="responsible" value={`${userLogged?.name} ${userLogged?.lastname}`} disabled />
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-100">
                                <Label htmlFor="observations" className="form-label">{t('pigs.field.observations')}</Label>
                                <Input type="text" id="observations" name="observations" value={formik.values.observations} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.observations && !!formik.errors.observations} />
                                {formik.touched.observations && formik.errors.observations && <FormFeedback>{formik.errors.observations}</FormFeedback>}
                            </div>
                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />{t('form.pig.action.prev')}
                            </Button>
                            <Button className="ms-auto" type="button" onClick={() => checkDiscardData()}>
                                {t('form.pig.action.next')}<i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane tabId={3}>
                        <Card className="mb-4 shadow-sm bg-light">
                            <CardBody className="d-flex justify-content-between align-items-center">
                                <span className="text-black fs-5">
                                    <strong>{t('form.pig.field.responsibleRegistry')}</strong> {userLogged.name} {userLogged.lastname}
                                </span>
                            </CardBody>
                        </Card>
                        <div className="d-flex gap-3 align-items-stretch">
                            <Card className="shadow-sm w-50">
                                <CardHeader className="bg-light fw-bold fs-5">{t('form.pig.section.discardSummary')}</CardHeader>
                                <CardBody><ObjectDetails attributes={discardAttributes} object={formik.values} /></CardBody>
                            </Card>
                            <Card className="shadow-sm w-50">
                                <CardHeader className="bg-light fw-bold fs-5">{t('form.pig.section.pigInfo')}</CardHeader>
                                <CardBody><ObjectDetails attributes={pigsAttributes} object={pig ? pig : selectedPig} /></CardBody>
                            </Card>
                        </div>
                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />{t('form.pig.action.prev')}
                            </Button>
                            <Button className="ms-auto btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? <Spinner size='sm' /> : <><i className="ri-check-line me-2" />{t('form.pig.action.register')}</>}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <Modal isOpen={modals.pigDetails} toggle={() => toggleModal('pigDetails')} size="lg" centered className="border-0" fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('pigDetails')} className="border-0 pb-0">
                    <h4 className="modal-title text-primary fw-bold">{t('pigs.page.detailTitle')}</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    <PigDetailsModal pigId={detailsSelectedPig} showAllDetailsButton={false} />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('form.pig.success.discarded')} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t('form.pig.error.discard')} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    );
};

export default DiscardPigForm;
