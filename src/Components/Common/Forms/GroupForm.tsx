import { logger } from 'utils/logger';
import { preventEnterSubmit } from 'utils/formUtils';
import { ConfigContext } from "App";
import { Attribute, GroupData, PigData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import * as Yup from "yup";
import classnames from "classnames";
import { Column } from "common/data/data_types";
import DatePicker from "react-flatpickr";
import { HttpStatusCode } from "axios";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import PigDetailsModal from "../Details/DetailsPigModal";
import SuccessModal from "../Shared/SuccessModal";
import LoadingAnimation from "../Shared/LoadingAnimation";
import CustomTable from "../Tables/CustomTable";
import SelectableTable from "../Tables/SelectableTable";
import { useTranslation } from "react-i18next";

interface GroupFormProps {
    initialData?: GroupData;
    onSave: () => void;
    onCancel: () => void;
}

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const GroupForm: React.FC<GroupFormProps> = ({ initialData, onSave, onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [pigs, setPigs] = useState<PigData[]>([]);
    const [loading, setLoading] = useState(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [pigManualSelection, setPigManualSelection] = useState<boolean>(false);
    const [selectedPigs, setSelectecPigs] = useState<any[]>([])
    const [modals, setModals] = useState({ pigDetails: false, success: false });
    const [selectedPig, setSelectedPig] = useState<any>({})

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];
            if (tab >= 1 && tab <= 5) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const STAGE_COLORS: Record<string, string> = {
        piglet: 'info', weaning: 'warning', fattening: 'primary',
        finishing: 'primary', breeder: 'success', general: 'secondary',
    };

    const pigsColumns: Column<any>[] = [
        {
            header: t('groups.column.code'),
            accessor: 'code',
            render: (_, row) => (
                <Button className="text-underline" color="link" onClick={(e) => { e.stopPropagation(); setSelectedPig(row._id); toggleModal('pigDetails'); }}>
                    {row.code} ↗
                </Button>
            )
        },
        { header: t('groups.column.breed'), accessor: 'breed', type: 'text', isFilterable: true },
        {
            header: t('common.field.sex'),
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? `♂ ${t('common.sex.male')}` : `♀ ${t('common.sex.female')}`}
                </Badge>
            ),
        },
        { header: t('groups.column.weight'), accessor: 'weight', type: 'number', isFilterable: true },
        {
            header: t('groups.column.stage'),
            accessor: 'currentStage',
            render: (value: string) => {
                const color = STAGE_COLORS[value] || 'secondary';
                const label = t(`groups.stage.${value}`, { defaultValue: value });
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: t('groups.column.birthDate'), accessor: 'birthdate', type: 'date' },
    ];

    const groupAttributes: Attribute[] = [
        { key: 'code', label: t('groups.column.code'), type: 'text' },
        { key: 'name', label: t('groups.column.name'), type: 'text' },
        { key: 'creation_date', label: t('groups.column.creationDate'), type: 'date' },
        {
            key: 'responsible',
            label: t('feeding.preparation.detail.responsible'),
            type: 'text',
            render: () => <span>{userLogged.name} {userLogged.lastname}</span>
        },
        {
            key: 'area',
            label: t('groups.column.area'),
            type: 'text',
            render: (_, row) => <span>{t(`groups.area.${row.area}`, { defaultValue: row.area })}</span>
        },
        {
            label: t('groups.column.stage'),
            key: 'currentStage',
            render: (_, obj) => {
                const color = STAGE_COLORS[obj.stage] || 'secondary';
                const label = t(`groups.stage.${obj.stage}`, { defaultValue: obj.stage });
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: 'observations', label: t('groups.column.observations'), type: 'text' },
    ];

    const pigsAttributes: Attribute[] = [
        { key: 'maleCount', label: t('groups.kpi.males'), type: 'text' },
        { key: 'femaleCount', label: t('groups.kpi.females'), type: 'text' },
        { key: 'pigCount', label: t('groups.column.total'), type: 'text' },
    ];

    const selectedPigColumns: Column<any>[] = [
        {
            header: t('groups.column.code'),
            accessor: 'code',
            render: (_, row) => (
                <Button className="text-underline" color="link" onClick={(e) => { e.stopPropagation(); setSelectedPig(row._id); toggleModal('pigDetails'); }}>
                    {row.code} ↗
                </Button>
            )
        },
        { header: t('groups.column.breed'), accessor: 'breed', type: 'text', isFilterable: true },
        {
            header: t('common.field.sex'),
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? `♂ ${t('common.sex.male')}` : `♀ ${t('common.sex.female')}`}
                </Badge>
            ),
        },
        { header: t('groups.column.weight'), accessor: 'weight', type: 'number', isFilterable: true },
    ];

    const validationSchema = Yup.object({
        code: Yup.string().required(t('groups.validation.codeRequired'))
            .test('unique_code', t('groups.validation.codeExists'), async (value) => {
                if (initialData) return true;
                if (!value) return false;
                if (!configContext) return true;
                try {
                    const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/check_code_exists/${value}`);
                    return !response.data.codeExists;
                } catch (error) {
                    logger.error('Error validating unique code: ', error);
                    return false;
                }
            }),
        name: Yup.string().required(t('groups.validation.nameRequired')),
        area: Yup.string().required(t('groups.validation.areaRequired')),
        stage: Yup.string().required(t('groups.validation.stageRequired')),
        observations: Yup.string().optional().max(500, t('groups.validation.observationsMax')),
        pigCount: Yup.number().required(t('groups.validation.pigCountRequired'))
            .min(0, t('groups.validation.pigCountMin'))
    });

    const formik = useFormik<GroupData>({
        initialValues: initialData || {
            code: '',
            name: '',
            area: '',
            stage: '',
            observations: '',
            creationDate: null,
            observationsHistory: [],
            responsible: userLogged._id || '',
            farm: userLogged.farm_assigned || '',
            groupHistory: [],
            pigCount: 0,
            maleCount: 0,
            femaleCount: 0,
            pigsInGroup: [],
            medications: [],
            groupMode: 'count',
            avgWeight: 0,
            feedAdministrationHistory: [],
            medicationPackagesHistory: [],
            vaccinationPlansHistory: [],
            isActive: true,
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/group/create_group`, values);
                if (response.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Grupo de cerdos ${values.code} registrados en area ${values.area}`
                    });
                }
                toggleModal('success');
            } catch (error) {
                logger.error('Error saving the information: ', { error });
                setAlertConfig({ visible: true, color: 'danger', message: t('groups.error.save') });
            }
        }
    });

    const fetchData = async () => {
        if (!configContext) return;
        try {
            setLoading(true);
            const codeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/next_group_code`);
            formik.setFieldValue('code', codeResponse.data.data);
        } catch (error) {
            logger.error('Error fetching information: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('groups.error.load') });
        } finally {
            setLoading(false);
        }
    };

    const fetchPigs = async () => {
        if (!configContext || !formik.values.stage) return;
        try {
            const pigsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_stage/${userLogged.farm_assigned}/${formik.values.stage}`);
            const pigsWithId = pigsResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            setPigs(pigsWithId);
        } catch (error) {
            logger.error('Error fetching information: ', { error });
        }
    };

    const checkGroupData = async () => {
        formik.setTouched({ code: true, name: true, creationDate: true, responsible: true, area: true, stage: true });
        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(activeStep + 1);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('groups.validation.fillAllData') });
        }
    };

    const checkSelectionPig = () => {
        if (pigManualSelection && formik.values.pigsInGroup?.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: t('groups.validation.selectOnePig') });
            return;
        }
        toggleArrowTab(3);
    };

    const updateSelectedPigs = (pigs: any[]) => {
        if (pigManualSelection) {
            setSelectecPigs(pigs);
            formik.setFieldValue('pigsInGroup', pigs.map((pig) => pig._id));
            formik.setFieldValue('femaleCount', pigs.filter((pig) => pig.sex === 'female').length);
            formik.setFieldValue('maleCount', pigs.filter((pig) => pig.sex === 'male').length);
            formik.setFieldValue('pigCount', pigs.length);
        }
    };

    useEffect(() => {
        fetchData();
        formik.setFieldValue('creation_date', new Date());
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        fetchPigs();
    }, [formik.values.stage]);

    useEffect(() => {
        if (!pigManualSelection) {
            formik.setFieldValue('pigCount', (formik.values.maleCount ?? 0) + (formik.values.femaleCount ?? 0));
        }
    }, [formik.values.maleCount, formik.values.femaleCount]);

    useEffect(() => {
        formik.setFieldValue('groupMode', pigManualSelection ? 'linked' : 'count');
    }, [pigManualSelection]);

    if (loading) return <LoadingAnimation />;

    return (
        <>
            <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }} onKeyDown={preventEnterSubmit}>
                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink href="#" id="step-groupData-tab"
                                className={classnames({ active: activeStep === 1, done: activeStep > 1 })}
                                onClick={() => toggleArrowTab(1)} aria-selected={activeStep === 1} disabled>
                                {t('groups.form.step1')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="#" id="step-pigs-tab"
                                className={classnames({ active: activeStep === 2, done: activeStep > 2 })}
                                onClick={() => toggleArrowTab(2)} aria-selected={activeStep === 2} disabled>
                                {t('groups.form.step2')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="#" id="step-summary-tab"
                                className={classnames({ active: activeStep === 3 })}
                                onClick={() => toggleArrowTab(3)} aria-selected={activeStep === 3} disabled>
                                {t('groups.form.step3')}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-groupData-tab" tabId={1}>
                        <h5 className="border-bottom border-2 pb-2">{t('groups.form.generalData')}</h5>

                        <div className="mt-4">
                            <Label htmlFor="code" className="form-label">{t('common.field.code')} *</Label>
                            <Input type="text" id="code" name="code" value={formik.values.code} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.code && !!formik.errors.code} placeholder={t('groups.form.codePlaceholder')} />
                            {formik.touched.code && formik.errors.code && <FormFeedback>{formik.errors.code}</FormFeedback>}
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="name" className="form-label">{t('groups.column.name')} *</Label>
                            <Input type="text" id="name" name="name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.name && !!formik.errors.name} placeholder={t('groups.form.namePlaceholder')} />
                            {formik.touched.name && formik.errors.name && <FormFeedback>{formik.errors.name}</FormFeedback>}
                        </div>

                        <div className="d-flex gap-2">
                            <div className="mt-4 w-50">
                                <Label htmlFor="creationDate" className="form-label">{t('groups.column.creationDate')} *</Label>
                                <DatePicker id="creationDate"
                                    className={`form-control ${formik.touched.creationDate && formik.errors.creationDate ? 'is-invalid' : ''}`}
                                    value={formik.values.creationDate ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue('creationDate', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {formik.touched.creationDate && formik.errors.creationDate && <FormFeedback className="d-block">{formik.errors.creationDate as string}</FormFeedback>}
                            </div>

                            <div className="mt-4 w-50">
                                <Label htmlFor="user" className="form-label">{t('feeding.preparation.detail.responsible')} *</Label>
                                <Input type="text" id="user" name="user" value={'' + userLogged.name + ' ' + userLogged.lastname} disabled />
                            </div>
                        </div>

                        <div className="d-flex gap-3">
                            <div className="mt-4 w-50">
                                <Label htmlFor="area" className="form-label">{t('groups.column.area')} *</Label>
                                <Input type="select" id="area" name="area" value={formik.values.area} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.area && !!formik.errors.area}>
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
                            </div>

                            <div className="mt-4 w-50">
                                <Label htmlFor="stage" className="form-label">{t('groups.column.stage')}</Label>
                                <Input type="select" id="stage" name="stage" value={formik.values.stage} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.stage && !!formik.errors.stage}>
                                    <option value="">{t('groups.form.selectStage')}</option>
                                    <option value="general">{t('groups.stage.general')}</option>
                                    <option value="piglet">{t('groups.stage.piglet')}</option>
                                    <option value="weaning">{t('groups.stage.weaning')}</option>
                                    <option value="fattening">{t('groups.stage.fattening')}</option>
                                    <option value="breeder">{t('groups.stage.breeder')}</option>
                                </Input>
                                {formik.touched.stage && formik.errors.stage && <FormFeedback>{formik.errors.stage}</FormFeedback>}
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="observations" className="form-label">{t('groups.column.observations')}</Label>
                            <Input type="textarea" id="observations" name="observations" value={formik.values.observations} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.observations && !!formik.errors.observations} placeholder={t('groups.form.observationsPlaceholder')} />
                            {formik.touched.observations && formik.errors.observations && <FormFeedback>{formik.errors.observations}</FormFeedback>}
                        </div>

                        <div className="d-flex justify-content-between mt-4">
                            <Button className="btn btn-primary ms-auto" onClick={() => checkGroupData()}>
                                {t('common.button.next')}
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-pigs-tab" tabId={2}>
                        <div className="d-flex gap-3">
                            <div className="mt-4 w-100">
                                <Label htmlFor="femaleCount" className="form-label">{t('groups.form.femaleCount')}</Label>
                                <Input type="number" value={formik.values.femaleCount} onChange={formik.handleChange} onBlur={formik.handleBlur} name="femaleCount" id="femaleCount" invalid={formik.touched.femaleCount && !!formik.errors.femaleCount} disabled={pigManualSelection} />
                            </div>
                            <div className="mt-4 w-100">
                                <Label htmlFor="maleCount" className="form-label">{t('groups.form.maleCount')}</Label>
                                <Input type="number" value={formik.values.maleCount} onChange={formik.handleChange} onBlur={formik.handleBlur} name="maleCount" id="maleCount" invalid={formik.touched.maleCount && !!formik.errors.maleCount} disabled={pigManualSelection} />
                            </div>
                            <div className="mt-4 w-100">
                                <Label htmlFor="pigCount" className="form-label">{t('groups.form.pigCount')}</Label>
                                <Input type="number" value={formik.values.pigCount} onChange={formik.handleChange} onBlur={formik.handleBlur} name="pigCount" id="pigCount" invalid={formik.touched.pigCount && !!formik.errors.pigCount} disabled />
                            </div>
                        </div>

                        <div className="form-check mt-4">
                            <Input className="form-check-input" type="checkbox" id="check-count" checked={pigManualSelection}
                                onChange={e => {
                                    const checked = e.target.checked;
                                    setPigManualSelection(checked);
                                    if (!checked) {
                                        formik.setFieldValue("maleCount", 0);
                                        formik.setFieldValue("femaleCount", 0);
                                        formik.setFieldValue("pigsInGroup", []);
                                    }
                                }} />
                            <Label className="form-check-label" for="check-count">{t('groups.form.selectPigs')}</Label>
                        </div>

                        <fieldset disabled={!pigManualSelection}>
                            <div className={`mt-4 ${!pigManualSelection ? "opacity-50" : ""}`}>
                                <h5 className="border-bottom border-2 pb-2">{t('groups.form.availablePigs')}</h5>
                                {pigs.length === 0 ? (
                                    <div className="text-center text-muted mt-4">
                                        <p className="fs-5">{t('groups.form.noPigsAvailable')}</p>
                                    </div>
                                ) : (
                                    <SelectableTable columns={pigsColumns} data={pigs} selectionMode="multiple" onSelect={(pigs) => updateSelectedPigs(pigs)} resetSelectionTrigger={!pigManualSelection} disabled={!pigManualSelection} />
                                )}
                            </div>
                        </fieldset>

                        <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />

                        <div className="d-flex justify-content-between mt-4">
                            <Button className="btn btn-secondary" onClick={() => toggleArrowTab(1)}>
                                <i className="ri-arrow-left-line me-1"></i>
                                {t('common.button.back')}
                            </Button>
                            <Button className="btn btn-primary" onClick={() => checkSelectionPig()}>
                                {t('common.button.next')}
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={3}>
                        <div className="d-flex gap-3">
                            <Card className="w-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5>{t('groups.form.groupInfoCard')}</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={groupAttributes} object={formik.values} />
                                </CardBody>
                            </Card>

                            <Card className="w-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5>{t('groups.form.pigsCard')}</h5>
                                </CardHeader>
                                <CardBody className={`${(formik.values.pigsInGroup?.length ?? 0) === 0 ? '' : 'p-0'}`}>
                                    {(formik.values.pigsInGroup?.length ?? 0) === 0 ? (
                                        <ObjectDetails attributes={pigsAttributes} object={formik.values} />
                                    ) : (
                                        <CustomTable columns={selectedPigColumns} data={selectedPigs} showSearchAndFilter={false} showPagination={false} />
                                    )}
                                </CardBody>
                            </Card>
                        </div>

                        <div className="d-flex justify-content-between">
                            <Button className="btn btn-secondary" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-1"></i>
                                {t('common.button.back')}
                            </Button>
                            <Button className="btn btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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

            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>{t('groups.modal.pigDetails')}</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedPig} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('groups.form.success')} />
        </>
    );
};

export default GroupForm;
