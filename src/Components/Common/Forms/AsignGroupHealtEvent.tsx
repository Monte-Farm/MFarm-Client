import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Attribute, GroupData, GroupHealthEvents, medicationPackagesEntry, PigData, SicknessHistory, VaccinationPlanEntry } from "common/data_interfaces";
import * as Yup from 'yup';
import classnames from "classnames";
import { useFormik } from "formik";
import { HttpStatusCode } from "axios";
import DatePicker from "react-flatpickr";
import SelectableCustomTable from "../Tables/SelectableTable";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import PigDetails from "pages/Pigs/PigDetails";
import CustomTable from "../Tables/CustomTable";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import MissingStockModal from "../Shared/MissingStockModal";
import noImageUrl from '../../../assets/images/no-image.png'
import SicknessSymptomsSelector from "../Shared/SicknessSymptomsSelector";
import SicknessSymptomsSummary from "../Shared/SicknessSymptomsSummary";

interface GroupHealthEventFormProps {
    groupId: string
    onSave: () => void
}

const GroupHealthEventForm: React.FC<GroupHealthEventFormProps> = ({ groupId, onSave }) => {
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);
    const { t } = useTranslation();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false });
    const [missingItems, setMissingItems] = useState([]);
    const [groupDetails, setGroupDetails] = useState<GroupData>()
    const [treatmentSelected, setTreatmentSelected] = useState<any[]>([]);
    const [treatmentErrors, setTreatmentErrors] = useState<Record<string, any>>({});
    const [products, setProducts] = useState<any[]>([])

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

    const selectedMedicationsColumns: Column<any>[] = [
        { header: t("common.field.code"), accessor: "code", type: "text", isFilterable: true },
        { header: t("medication.vaccinePlan.vaccineColumn.name"), accessor: "name", type: "text", isFilterable: true },
        {
            header: t("medication.package.medicationColumn.quantity"),
            accessor: "dose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.quantityPerPig} {row.unit_measurement}</span>
        },
        {
            header: t("medication.vaccinePlan.vaccineColumn.totalDose"),
            accessor: "totalQuantity",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.totalQuantity} {row.unit_measurement}</span>
        },
        {
            header: t("medication.package.medicationColumn.route"),
            accessor: "administrationRoute",
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

    const columns: Column<any>[] = [
        {
            header: t('medication.vaccinePlan.form.column.image'), accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="" style={{ height: "70px" }} />
            ),
        },
        { header: t("common.field.code"), accessor: "code", type: "text", isFilterable: true },
        { header: t("medication.vaccinePlan.vaccineColumn.name"), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('reports.col.category'),
            accessor: 'category',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "vaccines":
                        color = "info";
                        label = t("medication.categoryDisplay.vaccines");
                        break;
                    case "medications":
                        color = "primary";
                        label = t("medication.categoryDisplay.medications");
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: t("medical.healthEvent.column.dosePerPig"),
            accessor: "dose",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = treatmentSelected.find(f => f.medication === row._id);
                const realValue = selected?.quantityPerPig ?? "";

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.quantityPerPig === 0 ? "" : (selected?.quantityPerPig ?? "")}
                            invalid={treatmentErrors[row._id]?.quantityPerPig}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                const affectedCount = formik.values.scope.affectedCount ?? 0;
                                const totalQuantityValue = Number(newValue * affectedCount);
                                setTreatmentSelected(prev =>
                                    prev.map(f => f.medication === row._id ? { ...f, quantityPerPig: newValue, totalQuantity: totalQuantityValue } : f)
                                );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-describedby="unit-addon"
                        />
                        <span className="input-group-text" id="unit-addon">{row.unit_measurement}</span>
                    </div>

                );
            },
        },
        {
            header: t("medical.healthEvent.column.adminRoute"),
            accessor: "administration_route",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = treatmentSelected.find(m => m.medication === row._id);
                const realValue = selected?.administrationRoute ?? "";
                return (
                    <Input
                        type="select"
                        disabled={!isSelected}
                        value={realValue}
                        invalid={treatmentErrors[row._id]?.administrationRoute}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setTreatmentSelected(prev =>
                                prev.map(m => m.medication === row._id ? { ...m, administrationRoute: newValue } : m)
                            );
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">{t("medication.vaccinePlan.form.select")}</option>
                        <option value="oral">{t("medication.vaccinePlan.adminRouteDisplay.oral")}</option>
                        <option value="intramuscular">{t("medication.vaccinePlan.adminRouteDisplay.intramuscular")}</option>
                        <option value="subcutaneous">{t("medication.vaccinePlan.adminRouteDisplay.subcutaneous")}</option>
                        <option value="intravenous">{t("medication.vaccinePlan.adminRouteDisplay.intravenous")}</option>
                        <option value="intranasal">{t("medication.vaccinePlan.adminRouteDisplay.intranasal")}</option>
                        <option value="topical">{t("medication.vaccinePlan.adminRouteDisplay.topical")}</option>
                        <option value="rectal">{t("medication.vaccinePlan.adminRouteDisplay.rectal")}</option>
                    </Input>
                );
            }
        },
    ];

    const sicknessAttributes: Attribute[] = [
        { key: 'name', label: t("health.field.disease"), type: 'text' },
        {
            key: 'status',
            label: t("common.field.status"),
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "active":
                        color = "info";
                        label = t("health.status.active");
                        break;
                    case "controlled":
                        color = "success";
                        label = t("health.status.controlled");
                        break;
                    case "resulved":
                    case "resolved":
                        color = "primary";
                        label = t("health.status.resolved");
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'severity',
            label: t("health.field.severity"),
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "low":
                        color = "success";
                        label = t("health.severity.low");
                        break;
                    case "medium":
                        color = "warning";
                        label = t("health.severity.medium");
                        break;
                    case "high":
                        color = "danger";
                        label = t("health.severity.high");
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'scope.type',
            label: t("health.field.eventType"),
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "partial":
                        color = "success";
                        label = t("health.eventScope.partial");
                        break;
                    case "total":
                        color = "warning";
                        label = t("health.eventScope.total");
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'affectedCount',
            label: t("health.field.affectedPigs"),
            type: 'text',
            render: (value, object) => <span>{object.scope.affectedCount}</span>
        },
        { key: 'observations', label: t("common.field.observations"), type: 'text' },

    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const [groupResponse, productsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${groupId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_medication_products`),
            ])
            const groupData = groupResponse.data.data;
            setGroupDetails(groupData)

            const productsWithId = productsResponse.data.data.map((b: any) => ({ ...b, code: b.id, id: b._id }));
            setProducts(productsWithId)
        } catch (error) {
            logger.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t("common.error.loadData") })
        } finally {
            setLoading(false)
        }
    }

    const validationSchema = Yup.object({
        name: Yup.string().required('El nombre de la enfermedad es obligatoria'),
        status: Yup.string().required('El estado de la enfermedad es obligatorio'),
        startDate: Yup.date().required('La fecha de inicio de la enfermedad es obligatoria'),
        endDate: Yup.date().when('status', {
            is: 'resolved',
            then: (schema) => schema.required('La fecha de término es obligatoria cuando el evento está resuelto'),
            otherwise: (schema) => schema.nullable()
        }),
        severity: Yup.string().required('La severidad de la informacion es obligatoria'),
        scope: Yup.object().shape({
            affectedCount: Yup.number()
                .min(1, 'Debe indicar al menos 1 cerdo')
                .max(groupDetails?.pigCount || 0, `No puede superar los ${groupDetails?.pigCount} cerdos del grupo`)
                .required('Requerido'),
            type: Yup.string().required('El tipo de evento es obligatorio')
        })
    })

    const treatmentValidation = Yup.object({
        medication: Yup.string().required(),
        quantityPerPig: Yup.number().moreThan(0, "Cantidad inválida").required("Cantidad requerida"),
        administrationRoute: Yup.string().required("Vía requerida").notOneOf([""], "Debe seleccionar una vía"),
    });

    const formik = useFormik<GroupHealthEvents>({
        initialValues: {
            name: '',
            status: '',
            startDate: null,
            endDate: null,
            scope: {
                type: '',
                affectedCount: 0
            },
            severity: '',
            symptoms: [],
            treatments: [],
            observations: '',
            isActive: true,
            detectedBy: userLogged._id,
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                values.treatments = treatmentSelected;
                const groupUpdates = await configContext.axiosHelper.put(`${configContext.apiUrl}/group/register_health_event/${groupId}`, values)
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Registrado evento sanitario ${values.name} al grupo ${groupDetails?.code}`
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

    const checkSicknessData = async () => {
        formik.setTouched({
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            severity: true,
            scope: {
                type: true,
                affectedCount: true
            }
        })

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(activeStep + 1);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, complete todos los campos obligatorios' })
        }
    }

    const checkSymptomsData = () => {
        if (formik.values.symptoms?.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, seleccione al menos 1 sintoma' })
        } else {
            toggleArrowTab(activeStep + 1);
        }
    }


    const validateSelectedTreatments = async () => {
        const errors: Record<string, any> = {};

        for (const treat of treatmentSelected) {
            try {
                await treatmentValidation.validate(treat, { abortEarly: false });
            } catch (err: any) {
                const treatErrors: any = {};

                err.inner.forEach((e: any) => {
                    treatErrors[e.path] = true;
                });

                errors[treat.medication] = treatErrors;
            }
        }

        setTreatmentErrors(errors);

        if (Object.keys(errors).length > 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos de los tratamientos seleccionados' })
            return false;
        }

        return true;
    };

    useEffect(() => {
        if (formik.values.scope.type === 'total') {
            formik.setFieldValue('scope.affectedCount', groupDetails?.pigCount)
        } else {
            formik.setFieldValue('scope.affectedCount', 0)
        }
    }, [formik.values.scope.type])

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
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            aria-selected={activeStep === 1}
                            aria-controls="step-packageSelect-tab"
                            disabled
                        >
                            {t("medical.healthEvent.details.title")}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            aria-selected={activeStep === 2}
                            disabled
                        >
                            {t("health.field.symptoms")}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            className={classnames({
                                active: activeStep === 3,
                                done: activeStep > 3,
                            })}
                            aria-selected={activeStep === 3}
                            disabled
                        >
                            {t("groups.form.bulkHealthEvent.step.treatment")}
                        </NavLink>
                    </NavItem>


                    <NavItem>
                        <NavLink
                            className={classnames({
                                active: activeStep === 4,
                                done: activeStep > 4,
                            })}
                            aria-selected={activeStep === 4}
                            disabled
                        >
                            {t("medication.assign.step.summary")}
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    <div className="mb-3">
                        <h5 className="mb-1">{t("groups.form.bulkHealthEvent.eventInfoTitle")}</h5>
                        <small className="text-muted">
                            {t("groups.form.bulkHealthEvent.eventInfoSubtitle")}
                        </small>
                    </div>

                    <Card className="shadow-sm">
                        <CardBody>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <Label className="form-label fw-semibold">
                                        {t("medical.healthEvent.attribute.name")} <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        name="name"
                                        placeholder={t("health.field.diseasePlaceholder")}
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.name && !!formik.errors.name}
                                    />
                                    {formik.touched.name && formik.errors.name && (
                                        <FormFeedback>{formik.errors.name}</FormFeedback>
                                    )}
                                </div>

                                <div className="col-md-3">
                                    <Label htmlFor="severityInput" className="form-label fw-semibold">
                                        {t("health.field.severity")} <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="select"
                                        id="severityInput"
                                        name="severity"
                                        value={formik.values.severity}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.severity && !!formik.errors.severity}
                                    >
                                        <option value="">{t("common.select")}</option>
                                        <option value="low">{t("health.severity.low")}</option>
                                        <option value="medium">{t("health.severity.medium")}</option>
                                        <option value="high">{t("health.severity.high")}</option>
                                    </Input>
                                    {formik.touched.severity && formik.errors.severity && (
                                        <FormFeedback>{formik.errors.severity}</FormFeedback>
                                    )}
                                </div>

                                <div className="col-md-3">
                                    <Label htmlFor="startDate" className="form-label fw-semibold">
                                        {t("medical.healthEvent.attribute.startDate")} <span className="text-danger">*</span>
                                    </Label>
                                    <DatePicker
                                        id="startDate"
                                        className={`form-control ${formik.touched.startDate && formik.errors.startDate ? 'is-invalid' : ''}`}
                                        value={formik.values.startDate ?? undefined}
                                        onChange={(date: Date[]) => {
                                            if (date[0]) formik.setFieldValue('startDate', date[0]);
                                        }}
                                        options={{ dateFormat: 'd/m/Y' }}
                                        placeholder={t("common.placeholder.selectDate")}
                                    />
                                    {formik.touched.startDate && formik.errors.startDate && (
                                        <FormFeedback className="d-block">{formik.errors.startDate as string}</FormFeedback>
                                    )}
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <Label htmlFor="typeInput" className="form-label fw-semibold">
                                        {t("health.field.eventType")} <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="select"
                                        id="typeInput"
                                        name="scope.type"
                                        value={formik.values.scope.type}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.scope?.type && !!formik.errors.scope?.type}
                                    >
                                        <option value="">{t("common.select")}</option>
                                        <option value="partial">{t("health.eventScope.partialDesc")}</option>
                                        <option value="total">{t("health.eventScope.totalDesc")}</option>
                                    </Input>
                                    {formik.touched.scope?.type && formik.errors.scope?.type && (
                                        <FormFeedback>{formik.errors.scope.type}</FormFeedback>
                                    )}
                                </div>

                                <div className="col-md-4">
                                    <Label className="form-label fw-semibold">
                                        {t("health.field.affectedPigs")} <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        name="scope.affectedCount"
                                        placeholder={t("health.field.pigCountPlaceholder")}
                                        value={formik.values.scope.affectedCount === 0 ? '' : formik.values.scope.affectedCount}
                                        onChange={(e) => {
                                            const value = e.target.value === '' ? 0 : Number(e.target.value);
                                            const maxPigs = groupDetails?.pigCount ?? 0;
                                            const finalValue = value > maxPigs ? maxPigs : value;
                                            formik.setFieldValue('scope.affectedCount', finalValue);
                                        }}
                                        onFocus={(e) => {
                                            if (formik.values.scope.affectedCount === 0) {
                                                e.target.select();
                                            }
                                        }}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.scope?.affectedCount && !!formik.errors.scope?.affectedCount}
                                        disabled={formik.values.scope.type === 'total'}
                                        min={1}
                                        max={groupDetails?.pigCount}
                                    />
                                    {formik.touched.scope?.affectedCount && formik.errors.scope?.affectedCount && (
                                        <FormFeedback>{formik.errors.scope.affectedCount}</FormFeedback>
                                    )}
                                    {formik.values.scope.type === 'total' && (
                                        <small className="text-muted d-block mt-1">
                                            <i className="ri-information-line" /> Se asignará a todos los cerdos del grupo
                                        </small>
                                    )}
                                    {formik.values.scope.type === 'partial' && groupDetails?.pigCount && (
                                        <small className="text-muted d-block mt-1">
                                            <i className="ri-information-line" /> Máximo: {groupDetails.pigCount} cerdos
                                        </small>
                                    )}
                                </div>

                                <div className="col-md-4">
                                    <Label htmlFor="statusInput" className="form-label fw-semibold">
                                        {t("common.field.status")} <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="select"
                                        id="statusInput"
                                        name="status"
                                        value={formik.values.status}
                                        onChange={(e) => {
                                            formik.handleChange(e);
                                            if (e.target.value !== 'resolved') {
                                                formik.setFieldValue('endDate', null);
                                            }
                                        }}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.status && !!formik.errors.status}
                                    >
                                        <option value="">{t("common.select")}</option>
                                        <option value="active">{t("health.status.active")}</option>
                                        <option value="controlled">{t("health.status.controlled")}</option>
                                        <option value="resolved">{t("health.status.resolved")}</option>
                                    </Input>
                                    {formik.touched.status && formik.errors.status && (
                                        <FormFeedback>{formik.errors.status}</FormFeedback>
                                    )}
                                </div>
                            </div>

                            {formik.values.status === 'resolved' && (
                                <div className="w-100 mt-2">
                                    <Label htmlFor="endDate" className="form-label fw-semibold">
                                        {t("medical.healthEvent.attribute.endDate")} <span className="text-danger">*</span>
                                    </Label>
                                    <DatePicker
                                        id="endDate"
                                        className={`form-control ${formik.touched.endDate && formik.errors.endDate ? 'is-invalid' : ''}`}
                                        value={formik.values.endDate ?? undefined}
                                        onChange={(date: Date[]) => {
                                            if (date[0]) formik.setFieldValue('endDate', date[0]);
                                        }}
                                        options={{ dateFormat: 'd/m/Y' }}
                                        placeholder={t("common.placeholder.selectDate")}
                                    />
                                    {formik.touched.endDate && formik.errors.endDate && (
                                        <FormFeedback className="d-block">{formik.errors.endDate as string}</FormFeedback>
                                    )}
                                    <small className="text-muted d-block mt-1">
                                        <i className="ri-information-line" /> Fecha en que el evento fue resuelto
                                    </small>
                                </div>
                            )}

                            <div className="row g-3 mt-2">
                                <div className="col-md-6">
                                    <Label htmlFor="user" className="form-label fw-semibold">{t("medical.healthEvent.attribute.detectedBy")}</Label>
                                    <Input
                                        type="text"
                                        id="user"
                                        name="user"
                                        value={'' + userLogged.name + ' ' + userLogged.lastname}
                                        disabled
                                    />
                                </div>

                                <div className="col-md-6">
                                    <Label className="form-label fw-semibold">{t("common.field.observations")}</Label>
                                    <Input
                                        type="textarea"
                                        name="observations"
                                        rows={1}
                                        placeholder={t("health.field.observationsPlaceholder")}
                                        value={formik.values.observations}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.observations && !!formik.errors.observations}
                                    />
                                    {formik.touched.observations && formik.errors.observations && (
                                        <FormFeedback>{formik.errors.observations}</FormFeedback>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn btn-primary ms-auto" onClick={() => checkSicknessData()}>
                            {t("common.button.next")}
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={2}>
                    <div className="mb-3">
                        <h5 className="mb-1">{t("health.field.observedSymptoms")}</h5>
                        <small className="text-muted">
                            Seleccione todos los síntomas observados en el cerdo
                        </small>
                    </div>

                    <SicknessSymptomsSelector value={formik.values.symptoms ?? []} onChange={(symptoms) => formik.setFieldValue("symptoms", symptoms)} />

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="me-2 ri-arrow-left-line" />
                            {t("common.button.previous")}
                        </Button>

                        <Button className="btn" onClick={() => checkSymptomsData()}>
                            {t("common.button.next")}
                            <i className="ms-2 ri-arrow-right-line" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={3}>
                    <SelectableCustomTable
                        columns={columns}
                        data={products}
                        showPagination={true}
                        rowsPerPage={6}
                        onSelect={(rows) => {
                            setTreatmentSelected(prev => {
                                const newRows = rows.map(r => {
                                    const existing = prev.find(p => p.medication === r._id);
                                    if (existing) return existing;

                                    return {
                                        medication: r._id,
                                        quantityPerPig: 0,
                                        totalQuantity: 0,
                                        administrationRoute: "",
                                        appliedBy: userLogged._id,
                                    };
                                });
                                return newRows;
                            });
                        }}
                    />

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="me-2 ri-arrow-left-line" />
                            {t("common.button.previous")}
                        </Button>

                        <Button
                            className="btn btn-primary ms-auto"
                            onClick={async () => {
                                const ok = await validateSelectedTreatments();
                                if (!ok) return;
                                toggleArrowTab(activeStep + 1);
                            }}
                        >
                            {t("common.button.next")}
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={4}>
                    <div className="d-flex gap-3 align-items-stretch" style={{ minHeight: "60vh" }}>
                        <div className="d-flex flex-column flex-grow-1 gap-3">
                            <div className="d-flex gap-3 align-items-stretch" style={{ flex: 1 }}>
                                <Card className="shadow-sm w-50 h-100">
                                    <CardHeader className="bg-light fw-bold fs-5">
                                        {t("medical.healthEvent.details.title")}
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails
                                            attributes={sicknessAttributes}
                                            object={formik.values}
                                        />
                                    </CardBody>
                                </Card>

                                <Card className="shadow-sm w-50 h-100">
                                    <CardHeader className="bg-light fw-bold fs-5">
                                        {t("health.field.symptoms")}
                                    </CardHeader>

                                    <CardBody className="d-flex flex-column">
                                        {formik.values.symptoms && formik.values.symptoms.length > 0 ? (
                                            <SicknessSymptomsSummary symptoms={formik.values.symptoms} />
                                        ) : (
                                            <div className="text-muted fst-italic d-flex align-items-center justify-content-center flex-grow-1 gap-2">
                                                <i className="fa-solid fa-circle-info" />
                                                {t("groups.form.bulkHealthEvent.noSymptoms")}
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </div>

                            <div style={{ flex: 1 }}>
                                <Card className="shadow-sm h-100">
                                    <CardHeader className="bg-light fw-bold fs-5">
                                        {t("groups.form.bulkHealthEvent.step.treatment")}
                                    </CardHeader>

                                    <CardBody className="d-flex flex-column p-0">
                                        {treatmentSelected.length > 0 ? (
                                            <CustomTable
                                                columns={selectedMedicationsColumns}
                                                data={treatmentSelected.map(ms => ({
                                                    ...products.find(p => p._id === ms.medication),
                                                    ...ms
                                                }))}
                                                showSearchAndFilter={false}
                                                rowsPerPage={4}
                                                showPagination={true}
                                            />
                                        ) : (
                                            <div className="text-muted fst-italic d-flex align-items-center justify-content-center flex-grow-1 gap-2">
                                                <i className="fa-solid fa-pills" />
                                                {t("groups.form.bulkHealthEvent.noTreatment")}
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t("common.button.back")}
                        </Button>

                        <Button className="ms-auto btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                            {formik.isSubmitting ? (
                                <Spinner size="sm" />
                            ) : (
                                <>
                                    <i className="ri-check-line me-2" />
                                    {t("medication.assign.button.assign")}
                                </>
                            )}
                        </Button>
                    </div>
                </TabPane>


            </TabContent>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t("common.error.generic")} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Evento sanitario registrado correctamente"} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
        </>
    )
}

export default GroupHealthEventForm;