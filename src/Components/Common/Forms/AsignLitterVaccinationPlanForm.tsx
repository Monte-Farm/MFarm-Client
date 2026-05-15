import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Attribute, GroupData, GroupVaccinationPlansHistory, LitterEvent } from "common/data_interfaces";
import * as Yup from 'yup';
import classnames from "classnames";
import { useFormik } from "formik";
import DatePicker from "react-flatpickr";
import SelectableCustomTable from "../Tables/SelectableTable";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import ErrorModal from "../Shared/ErrorModal";
import { useTranslation } from "react-i18next";
import SuccessModal from "../Shared/SuccessModal";
import MissingStockModal from "../Shared/MissingStockModal";

interface AsignLitterVaccinationPlanFormProps {
    litterId: string
    onSave: () => void
}

const AsignLitterVaccinationPlanForm: React.FC<AsignLitterVaccinationPlanFormProps> = ({ litterId, onSave }) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ vaccinationDetails: false, success: false, error: false, missingStock: false });
    const [vaccinationPlans, setVaccinationPlans] = useState<any[]>([]);
    const [litterDetails, setLitterDetails] = useState<any>()
    const [selectedVaccinationPlan, setSelectedVaccinationPlan] = useState<any>();
    const [vaccinationPlanItems, setVaccinationPlanItems] = useState<any[]>();
    const [missingItems, setMissingItems] = useState([]);

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 5) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const vaccinationPlanColumns: Column<any>[] = [
        { header: t('groups.column.code'), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('groups.column.name'), accessor: 'name', type: 'text', isFilterable: true },
        { header: t('groups.column.creationDate'), accessor: 'creation_date', type: 'date', isFilterable: true },
        {
            header: t('common.field.stage'),
            accessor: 'stage',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = t("groups.area.unknown");

                switch (row.stage) {
                    case "general":
                        color = "info";
                        text = t("groups.stage.general");
                        break;
                    case "piglet":
                        color = "info";
                        text = t("groups.stage.piglet");
                        break;
                    case "weaning":
                        color = "warning";
                        text = t("groups.stage.weaning");
                        break;
                    case "fattening":
                        color = "primary";
                        text = t("groups.stage.fattening");
                        break;
                    case "breeder":
                        color = "success";
                        text = t("groups.stage.breeder");
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
    ]

    const litterAttributes: Attribute[] = [
        { key: 'code', label: t('litter.attr.code'), type: 'text' },
        { key: 'birthDate', label: t('litter.attr.birthDate'), type: 'date' },
        { key: 'currentMale', label: t('litter.column.males'), type: 'text' },
        { key: 'currentFemale', label: t('litter.column.females'), type: 'text' },
        {
            key: 'status',
            label: t('litter.attr.status'),
            type: 'text',
            render: (value, object) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'active':
                        color = 'warning';
                        label = t('litter.status.active');
                        break;
                    case 'weaned':
                        color = 'success';
                        label = t('litter.status.weaned');
                        break;
                }

                return <Badge color={color}>{label}</Badge>;

            }
        },
        {
            key: 'responsible',
            label: t('litter.attr.registeredBy'),
            type: 'text',
            render: (value, object) => <span>{object.responsible?.name} {object.responsible?.lastname}</span>
        },
    ]

    const selectedVaccinesColumns: Column<any>[] = [
        { header: t("groups.column.code"), accessor: "id", type: "text", isFilterable: true },
        { header: t("medication.vaccinePlan.form.column.product"), accessor: "name", type: "text", isFilterable: true },
        {
            header: t("medication.vaccinePlan.vaccineColumn.dose"),
            accessor: "dose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.dose} {row.unit_measurement}</span>
        },
        {
            header: t("medication.vaccinePlan.vaccineColumn.totalDose"),
            accessor: "totalDose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.totalDose} {row.unit_measurement}</span>
        },
        {
            header: t("medication.vaccinePlan.vaccineColumn.route"),
            accessor: "administration_route",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "oral":
                        color = "info";
                        label = t("medication.vaccinePlan.adminRouteDisplay.oral");
                        break;
                    case "intramuscular":
                        color = "primary";
                        label = t("medication.vaccinePlan.adminRouteDisplay.intramuscular");
                        break;
                    case "subcutaneous":
                        color = "primary";
                        label = t("medication.vaccinePlan.adminRouteDisplay.subcutaneous");
                        break;
                    case "intravenous":
                        color = "primary";
                        label = t("medication.vaccinePlan.adminRouteDisplay.intravenous");
                        break;
                    case "intranasal":
                        color = "primary";
                        label = t("medication.vaccinePlan.adminRouteDisplay.intranasal");
                        break;
                    case "topical":
                        color = "primary";
                        label = t("medication.vaccinePlan.adminRouteDisplay.topical");
                        break;
                    case "rectal":
                        color = "primary";
                        label = t("medication.vaccinePlan.adminRouteDisplay.rectal");
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
    ]

    const vaccinationPlanAttributes: Attribute[] = [
        { label: t('groups.column.code'), key: 'code', type: 'text' },
        { label: t('groups.column.name'), key: 'name', type: 'text', },
        { label: t('groups.column.creationDate'), key: 'creation_date', type: 'date', },
        {
            label: t('common.field.stage'),
            key: 'stage',
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                let text = t("groups.area.unknown");

                switch (row.stage) {
                    case "general":
                        color = "info";
                        text = t("groups.stage.general");
                        break;
                    case "piglet":
                        color = "info";
                        text = t("groups.stage.piglet");
                        break;
                    case "weaning":
                        color = "warning";
                        text = t("groups.stage.weaning");
                        break;
                    case "fattening":
                        color = "primary";
                        text = t("groups.stage.fattening");
                        break;
                    case "breeder":
                        color = "success";
                        text = t("groups.stage.breeder");
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const litterResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/litter/find_by_id/${litterId}`)
            const litterData = litterResponse.data.data;
            setLitterDetails(litterData)

            const vaccinationResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/vaccination_plan/find_by_stage/${userLogged.farm_assigned}/piglet`)
            const plansWithId = vaccinationResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            setVaccinationPlans(plansWithId)
        } catch (error) {
            logger.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.vaccination.assign.errorGeneric') })
        } finally {
            setLoading(false)
        }
    }

    const fetchVaccinationItems = async (vaccines: any[]) => {
        if (!configContext || !userLogged || !vaccines) return;
        try {
            const vaccinesIds = vaccines.map(v => v.vaccine)
            const vaccinationsResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_ids`, vaccinesIds)

            const products = vaccinationsResponse.data.data;

            const combined = vaccines.map(vac => {
                const product = products.find((p: any) => p._id === vac.vaccine);
                const productFormik = formik.values.vaccines.find((v: any) => v.vaccine === vac.vaccine)
                return { ...product, ...vac, totalDose: productFormik?.totalDose };
            });
            setVaccinationPlanItems(combined)
        } catch (error) {
            logger.error('Error fetching data:', error);
        }
    }

    const validationSchema = Yup.object({
        applicationDate: Yup.date().required('La fecha de aplicacion es obligatoria'),
        appliedBy: Yup.string().required('El area de destino es obligatoria'),
    })

    const formik = useFormik<GroupVaccinationPlansHistory>({
        initialValues: {
            planId: '',
            name: '',
            vaccines: [],
            applicationDate: null,
            appliedBy: userLogged._id,
            observations: '',
            isActive: true
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const vaccinationResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/vaccination_plan/asign_litter_vaccination_plan/${userLogged.farm_assigned}/${litterId}`, values)

                const litterEvent: LitterEvent = {
                    type: "GROUP_TREATMENT",
                    date: new Date(),
                    data: `Plan de vacunacion ${selectedVaccinationPlan.code} asignado`,
                    registeredBy: userLogged._id
                }

                await configContext.axiosHelper.put(`${configContext.apiUrl}/litter/add_event/${litterId}`, litterEvent)

                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Plan de vacunacion asignado a la camada ${litterDetails?.code}`
                });

                toggleModal('success', true)
            } catch (error: any) {
                logger.error('Error saving the information: ', { error })
                if (error.response?.status === 400 && error.response?.data?.missing) {
                    setMissingItems(error.response.data.missing);
                    toggleModal('missingStock');
                    return;
                }
                toggleModal('error')
            }
        }
    })

    const checkVaccinationPlanData = async () => {
        if (formik.values.planId === '') {
            setAlertConfig({ visible: true, color: 'danger', message: t('groups.form.vaccinationPlan.validationPlan') })
        } else {
            toggleArrowTab(activeStep + 1);
        }
    }

    useEffect(() => {
        fetchData();
        formik.setFieldValue('applicationDate', new Date())
    }, [])

    useEffect(() => {
        if (selectedVaccinationPlan) {
            const vaccinesFull = selectedVaccinationPlan.vaccines.map((v: any) => ({
                vaccine: v.vaccine,
                dosePerPig: v.dose,
                administrationRoute: v.administration_route,
                ageObjective: v.age_objective,
                frequency: v.frequency,
                totalDose: Number(v.dose * (litterDetails.currentMale + litterDetails.currentFemale))
            }))

            formik.setFieldValue('planId', selectedVaccinationPlan._id)
            formik.setFieldValue('name', selectedVaccinationPlan.name)
            formik.setFieldValue('vaccines', vaccinesFull)
        }
    }, [selectedVaccinationPlan])

    useEffect(() => {
        if (!formik.values.vaccines?.length) return;

        fetchVaccinationItems(selectedVaccinationPlan.vaccines);
    }, [formik.values.vaccines]);

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-packageSelect-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            aria-selected={activeStep === 1}
                            aria-controls="step-packageSelect-tab"
                            disabled
                        >
                            {t('medication.vaccination.assign.stepSelectPlan')}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-summary-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            aria-selected={activeStep === 2}
                            aria-controls="step-summary-tab"
                            disabled
                        >
                            {t('medication.vaccination.assign.stepSummary')}
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane id="step-planSelect-tab" tabId={1}>
                    <div className="d-flex gap-2 mt-4">
                        <div className="w-50">
                            <Label htmlFor="applicationDate" className="form-label">{t('medication.vaccination.assign.fieldApplicationDate')}</Label>
                            <DatePicker
                                id="applicationDate"
                                className={`form-control ${formik.touched.applicationDate && formik.errors.applicationDate ? 'is-invalid' : ''}`}
                                value={formik.values.applicationDate ?? undefined}
                                onChange={(date: Date[]) => {
                                    if (date[0]) formik.setFieldValue('applicationDate', date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                            {formik.touched.applicationDate && formik.errors.applicationDate && (
                                <FormFeedback className="d-block">{formik.errors.applicationDate as string}</FormFeedback>
                            )}
                        </div>

                        <div className="w-50">
                            <Label htmlFor="user" className="form-label">{t('medication.vaccination.assign.fieldResponsible')}</Label>
                            <Input
                                type="text"
                                id="user"
                                name="user"
                                value={'' + userLogged.name + ' ' + userLogged.lastname}
                                disabled
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <Label htmlFor="observations" className="form-label">{t('medication.vaccination.assign.fieldObservations')}</Label>
                        <Input
                            type="text"
                            id="observations"
                            name="observations"
                            value={formik.values.observations}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.observations && !!formik.errors.observations}
                            placeholder={t('medication.vaccination.assign.placeholderObservations')}
                        />
                        {formik.touched.observations && formik.errors.observations && (
                            <FormFeedback>{formik.errors.observations}</FormFeedback>
                        )}
                    </div>

                    <div className="mt-4">
                        <Label htmlFor="observations" className="form-label">{t('medication.vaccination.assign.fieldSelectPlan')}</Label>

                        <SelectableCustomTable
                            columns={vaccinationPlanColumns}
                            data={vaccinationPlans}
                            showPagination={true}
                            rowsPerPage={6}
                            selectionMode="single"
                            showSearchAndFilter={false}
                            onSelect={(rows) => setSelectedVaccinationPlan(rows[0])}
                        />
                    </div>


                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn btn-primary ms-auto" onClick={() => checkVaccinationPlanData()}>
                            {t('common.button.next')}
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane id="step-summary-tab" tabId={2}>
                    <div className="d-flex gap-3 align-items-stretch">
                        <div className="">
                            <Card className="shadow-sm h-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    {t('medication.vaccination.assign.cardLitterInfo')}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={litterAttributes}
                                        object={litterDetails ?? {}}
                                    />
                                </CardBody>
                            </Card>
                        </div>

                        <div className="w-100 align-items-stretch d-flex flex-column gap-1">
                            <Card className="shadow-sm h-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    {t('medication.vaccination.assign.cardPlanInfo')}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={vaccinationPlanAttributes}
                                        object={selectedVaccinationPlan ?? {}}
                                    />
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm h-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5>{t('medication.vaccination.assign.cardVaccines')}</h5>
                                </CardHeader>
                                <CardBody className="p-0">
                                    <CustomTable
                                        columns={selectedVaccinesColumns}
                                        data={vaccinationPlanItems || []}
                                        showSearchAndFilter={false}
                                        rowsPerPage={4}
                                        showPagination={true}
                                    />
                                </CardBody>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back')}
                        </Button>

                        <Button className="ms-auto btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                            {formik.isSubmitting ? (
                                <div>
                                    <Spinner size='sm' />
                                </div>
                            ) : (
                                <div>
                                    <i className="ri-check-line me-2" />
                                    {t('medication.vaccination.assign.btnAssign')}
                                </div>
                            )}

                        </Button>
                    </div>
                </TabPane>

            </TabContent>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t('medication.vaccination.assign.errorGeneric')} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('medication.vaccination.assign.successGroup')} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
        </>
    )
}

export default AsignLitterVaccinationPlanForm;