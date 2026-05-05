import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Attribute, medicationPackagesEntry, PigData, SicknessHistory, VaccinationPlanEntry } from "common/data_interfaces";
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
import { useTranslation } from "react-i18next";

interface PigSicknessFormProps {
    pigId: string
    onSave: () => void
}

const PigSicknessForm: React.FC<PigSicknessFormProps> = ({ pigId, onSave }) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false });
    const [missingItems, setMissingItems] = useState([]);
    const [pigDetails, setPigDetails] = useState<any>({})
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

    const PigAttributes: Attribute[] = [
        { key: "code", label: t('medical.sickness.form.pig.code', { defaultValue: 'Código' }), type: "text" },
        { key: "birthdate", label: t('medical.sickness.form.pig.birthdate', { defaultValue: 'Fecha de nacimiento' }), type: "date" },
        { key: "breed", label: t('medical.sickness.form.pig.breed', { defaultValue: 'Raza' }), type: "text" },
        {
            key: "origin",
            label: t('medical.sickness.form.pig.origin', { defaultValue: 'Origen' }),
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'born':
                        color = 'success';
                        label = t('medical.sickness.form.pig.origin_born', { defaultValue: 'Nacido en la granja' });
                        break;

                    case 'purchased':
                        color = 'warning';
                        label = t('medical.sickness.form.pig.origin_purchased', { defaultValue: 'Comprado' });
                        break;

                    case 'donated':
                        color = 'info';
                        label = t('medical.sickness.form.pig.origin_donated', { defaultValue: 'Donado' });
                        break;

                    case 'other':
                        color = 'dark';
                        label = t('medical.sickness.form.pig.origin_other', { defaultValue: 'Otro' });
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'sex',
            label: t('medical.sickness.form.pig.sex', { defaultValue: 'Sexo' }),
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male'
                        ? t('medical.sickness.form.pig.male', { defaultValue: '♂ Macho' })
                        : t('medical.sickness.form.pig.female', { defaultValue: '♀ Hembra' })}
                </Badge>
            ),
        },
        {
            key: 'currentStage',
            label: t('medical.sickness.form.pig.stage', { defaultValue: 'Etapa' }),
            render: (value: string) => {
                let color = "secondary";
                let label = t(`pigs.stage.${value}`, { defaultValue: value });
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "weight", label: t('medical.sickness.form.pig.weight', { defaultValue: 'Peso actual' }), type: "text" },
        { key: "observations", label: t('medical.sickness.form.pig.observations', { defaultValue: 'Observaciones' }), type: "text" },
    ];

    const selectedMedicationsColumns: Column<any>[] = [
        { header: t('medical.sickness.form.column.code', { defaultValue: 'Codigo' }), accessor: "code", type: "text", isFilterable: true },
        { header: t('medical.sickness.form.column.product', { defaultValue: 'Producto' }), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('medical.sickness.form.column.dose', { defaultValue: 'Dosis' }),
            accessor: "dose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.dose} {row.unit_measurement}</span>
        },
        {
            header: t('medical.sickness.form.column.adminRoute', { defaultValue: 'Administracion' }),
            accessor: "administration_route",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                return <Badge color="primary">{t(`medical.medication.route.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        { header: t('medical.sickness.form.column.startDate', { defaultValue: 'Inicio' }), accessor: 'startDate', type: 'date', },
        { header: t('medical.sickness.form.column.endDate', { defaultValue: 'Fin' }), accessor: 'endDate', type: 'date', },
    ]

    const columns: Column<any>[] = [
        {
            header: t('medical.sickness.form.column.image', { defaultValue: 'Imagen' }), accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="Imagen del Producto" style={{ height: "70px" }} />
            ),
        },
        { header: t('medical.sickness.form.column.code', { defaultValue: 'Codigo' }), accessor: "code", type: "text", isFilterable: true },
        { header: t('medical.sickness.form.column.product', { defaultValue: 'Producto' }), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('medical.sickness.form.column.category', { defaultValue: 'Categoria' }),
            accessor: 'category',
            render: (value: string) => {
                let color = "secondary";
                let label = t(`medical.sickness.form.category.${value}`, { defaultValue: value });

                switch (value) {
                    case "vaccines":
                        color = "info";
                        break;
                    case "medications":
                        color = "primary";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: t('medical.sickness.form.column.dose', { defaultValue: 'Dosis' }),
            accessor: "dose",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = treatmentSelected.find(f => f.medication === row._id);
                const realValue = selected?.dose ?? "";

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.dose === 0 ? "" : (selected?.dose ?? "")}
                            invalid={treatmentErrors[row._id]?.dose}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                setTreatmentSelected(prev =>
                                    prev.map(f => f.medication === row._id ? { ...f, dose: newValue } : f)
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
            header: t('medical.sickness.form.column.adminRouteSelect', { defaultValue: 'Vía de administración' }),
            accessor: "administration_route",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = treatmentSelected.find(m => m.medication === row._id);
                const realValue = selected?.administration_route ?? "";
                return (
                    <Input
                        type="select"
                        disabled={!isSelected}
                        value={realValue}
                        invalid={treatmentErrors[row._id]?.administration_route}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setTreatmentSelected(prev =>
                                prev.map(m => m.medication === row._id ? { ...m, administration_route: newValue } : m)
                            );
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">{t('medical.sickness.form.select', { defaultValue: 'Seleccione' })}...</option>
                        <option value="oral">{t('medical.medication.route.oral', { defaultValue: 'Oral' })}</option>
                        <option value="intramuscular">{t('medical.medication.route.intramuscular', { defaultValue: 'Intramuscular' })}</option>
                        <option value="subcutaneous">{t('medical.medication.route.subcutaneous', { defaultValue: 'Subcutánea' })}</option>
                        <option value="intravenous">{t('medical.medication.route.intravenous', { defaultValue: 'Intravenosa' })}</option>
                        <option value="intranasal">{t('medical.medication.route.intranasal', { defaultValue: 'Intranasal' })}</option>
                        <option value="topical">{t('medical.medication.route.topical', { defaultValue: 'Tópica' })}</option>
                        <option value="rectal">{t('medical.medication.route.rectal', { defaultValue: 'Rectal' })}</option>
                    </Input>
                );
            }
        },
        {
            header: t('medical.sickness.form.column.startDateSelect', { defaultValue: 'Fecha de inicio' }),
            accessor: "startDate",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = treatmentSelected.find(m => m.medication === row._id);
                const realValue = selected?.startDate ?? null;
                return (
                    <DatePicker
                        id="startDate"
                        className={`form-control ${treatmentErrors[row._id]?.startDate ? 'is-invalid' : ''}`}
                        value={realValue ?? undefined}
                        onChange={(date: Date[]) => {
                            if (date[0]) {
                                setTreatmentSelected(prev =>
                                    prev.map(m => m.medication === row._id ? { ...m, startDate: date[0] } : m)
                                );
                            }
                        }}
                        options={{ dateFormat: 'd/m/Y' }}
                        disabled={!isSelected}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={t('medical.sickness.form.select', { defaultValue: 'Seleccione' })}
                    />
                );
            }
        },
        {
            header: t('medical.sickness.form.column.endDateSelect', { defaultValue: 'Fecha de fin' }),
            accessor: "endDate",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = treatmentSelected.find(m => m.medication === row._id);
                const realValue = selected?.endDate ?? null;
                return (
                    <DatePicker
                        id="endDate"
                        className={`form-control ${treatmentErrors[row._id]?.endDate ? 'is-invalid' : ''}`}
                        value={realValue ?? undefined}
                        onChange={(date: Date[]) => {
                            if (date[0]) {
                                setTreatmentSelected(prev =>
                                    prev.map(m => m.medication === row._id ? { ...m, endDate: date[0] } : m)
                                );
                            }
                        }}
                        options={{ dateFormat: 'd/m/Y' }}
                        disabled={!isSelected}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={t('medical.sickness.form.select', { defaultValue: 'Seleccione' })}
                    />
                );
            }
        },
    ];

    const sicknessAttributes: Attribute[] = [
        { key: 'name', label: t('medical.sickness.form.field.disease', { defaultValue: 'Enfermedad' }), type: 'text' },
        {
            key: 'status',
            label: t('medical.sickness.form.field.status', { defaultValue: 'Estado' }),
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                const label = t(`medical.sickness.form.status.${value}`, { defaultValue: value });

                switch (value) {
                    case "suspected": color = "info"; break;
                    case "confirmed": color = "success"; break;
                    case "recovered": color = "primary"; break;
                    case "chronic": color = "warning"; break;
                    case "dead": color = "black"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'severity',
            label: t('medical.sickness.form.field.severity', { defaultValue: 'Severidad' }),
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                const label = t(`medical.sickness.form.severity.${value}`, { defaultValue: value });

                switch (value) {
                    case "low": color = "success"; break;
                    case "medium": color = "warning"; break;
                    case "high": color = "danger"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: 'observations', label: t('medical.sickness.form.field.observations', { defaultValue: 'Observaciones' }), type: 'text' },

    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const [pigResponse, productsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${pigId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_medication_products`),
            ])
            const pigData = pigResponse.data.data;
            setPigDetails(pigData)

            const productsWithId = productsResponse.data.data.map((b: any) => ({ ...b, code: b.id, id: b._id }));
            setProducts(productsWithId)
        } catch (error) {
            logger.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('medical.sickness.form.error.load', { defaultValue: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' }) })
        } finally {
            setLoading(false)
        }
    }

    const validationSchema = Yup.object({
        name: Yup.string().required(t('medical.sickness.form.validation.nameRequired', { defaultValue: 'El nombre de la enfermedad es obligatoria' })),
        status: Yup.string().required(t('medical.sickness.form.validation.statusRequired', { defaultValue: 'El estado de la enfermedad es obligatorio' })),
        startDate: Yup.date().required(t('medical.sickness.form.validation.startDateRequired', { defaultValue: 'La fecha de inicio de la enfermedad es obligatoria' })),
        severity: Yup.string().required(t('medical.sickness.form.validation.severityRequired', { defaultValue: 'La severidad de la informacion es obligatoria' })),
    })

    const treatmentValidation = Yup.object({
        medication: Yup.string().required(),
        dose: Yup.number().moreThan(0, t('medical.sickness.form.validation.doseInvalid', { defaultValue: 'Cantidad inválida' })).required(t('medical.sickness.form.validation.doseRequired', { defaultValue: 'Cantidad requerida' })),
        administration_route: Yup.string().required(t('medical.sickness.form.validation.routeRequired', { defaultValue: 'Vía requerida' })).notOneOf([""], t('medical.sickness.form.validation.routeSelect', { defaultValue: 'Debe seleccionar una vía' })),
        startDate: Yup.date().required(t('medical.sickness.form.validation.dateRequired', { defaultValue: 'Fecha requerida' })),
        endDate: Yup.date().required(t('medical.sickness.form.validation.dateRequired', { defaultValue: 'Fecha requerida' })),
    });

    const formik = useFormik<SicknessHistory>({
        initialValues: {
            name: "",
            status: "",
            startDate: null,
            endDate: null,
            symptoms: [],
            severity: '',
            detectedBy: userLogged._id,
            treatment: [],
            observations: '',
            is_active: true
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                values.treatment = treatmentSelected;

                const pigUpdates = await configContext.axiosHelper.put(`${configContext.apiUrl}/pig/register_sickness/${pigId}`, values)
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Plan de vacunacion asignado al cerdo ${pigDetails?.code}`
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
            severity: true,
        })

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(activeStep + 1);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('medical.sickness.form.validation.fillAll', { defaultValue: 'Por favor, llene todos los datos' }) })
        }
    }

    const checkSymptomsData = () => {
        if (formik.values.symptoms?.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: t('medical.sickness.form.validation.selectSymptom', { defaultValue: 'Por favor, seleccione al menos 1 sintoma' }) })
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
            setAlertConfig({ visible: true, color: 'danger', message: t('medical.sickness.form.validation.fillTreatments', { defaultValue: 'Por favor, llene todos los datos de los tratamientos seleccionados' }) })
            return false;
        }

        return true;
    };

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
                            {t('medical.sickness.form.step.info', { defaultValue: 'Informacion de enfermedad' })}
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
                            {t('medical.sickness.form.step.symptoms', { defaultValue: 'Sintomas' })}
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
                            {t('medical.sickness.form.step.treatment', { defaultValue: 'Tratamiento' })}
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
                            {t('medical.sickness.form.step.summary', { defaultValue: 'Resumen' })}
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    <div className="d-flex gap-3">
                        <div className="w-100">
                            <Label className="form-label">{t('medical.sickness.form.field.disease', { defaultValue: 'Enfermedad' })}</Label>
                            <Input
                                type="text"
                                name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.name && !!formik.errors.name}
                            />
                            {formik.touched.name && formik.errors.name && (
                                <FormFeedback>{formik.errors.name}</FormFeedback>
                            )}
                        </div>

                        <div className="w-100">
                            <Label htmlFor="severityInput" className="form-label">{t('medical.sickness.form.field.severity', { defaultValue: 'Severidad' })}</Label>
                            <Input
                                type="select"
                                id="severityInput"
                                name="severity"
                                value={formik.values.severity}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.severity && !!formik.errors.severity}
                            >
                                <option value="">{t('medical.sickness.form.field.selectStatus', { defaultValue: 'Seleccione un estado' })}</option>
                                <option value="low">{t('medical.sickness.form.severity.low', { defaultValue: 'Baja' })}</option>
                                <option value="medium">{t('medical.sickness.form.severity.medium', { defaultValue: 'Media' })}</option>
                                <option value="high">{t('medical.sickness.form.severity.high', { defaultValue: 'Alta' })}</option>
                            </Input>
                            {formik.touched.severity && formik.errors.severity && (
                                <FormFeedback>{formik.errors.severity}</FormFeedback>
                            )}
                        </div>

                        <div className="w-100">
                            <Label htmlFor="startDate" className="form-label">{t('medical.sickness.form.field.startDate', { defaultValue: 'Fecha de inicio' })}</Label>
                            <DatePicker
                                id="startDate"
                                className={`form-control ${formik.touched.startDate && formik.errors.startDate ? 'is-invalid' : ''}`}
                                value={formik.values.startDate ?? undefined}
                                onChange={(date: Date[]) => {
                                    if (date[0]) formik.setFieldValue('startDate', date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                            {formik.touched.startDate && formik.errors.startDate && (
                                <FormFeedback className="d-block">{formik.errors.startDate as string}</FormFeedback>
                            )}
                        </div>
                    </div>

                    <div className="d-flex gap-3 mt-4">
                        <div className="w-50">
                            <Label htmlFor="statusInput" className="form-label">{t('medical.sickness.form.field.status', { defaultValue: 'Estado' })}</Label>
                            <Input
                                type="select"
                                id="statusInput"
                                name="status"
                                value={formik.values.status}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.status && !!formik.errors.status}
                            >
                                <option value="">{t('medical.sickness.form.field.selectStatus', { defaultValue: 'Seleccione un estado' })}</option>
                                <option value="suspected">{t('medical.sickness.form.status.suspected', { defaultValue: 'Sospecha' })}</option>
                                <option value="confirmed">{t('medical.sickness.form.status.confirmed', { defaultValue: 'Confirmada' })}</option>
                                <option value="recovered">{t('medical.sickness.form.status.recovered', { defaultValue: 'Recuperada' })}</option>
                                <option value="chronic">{t('medical.sickness.form.status.chronic', { defaultValue: 'Cronica' })}</option>
                                <option value="dead">{t('medical.sickness.form.status.dead', { defaultValue: 'Muerta' })}</option>
                            </Input>
                            {formik.touched.status && formik.errors.status && (
                                <FormFeedback>{formik.errors.status}</FormFeedback>
                            )}
                        </div>

                        <div className="w-50">
                            <Label htmlFor="endDate" className="form-label">{t('medical.sickness.form.field.endDate', { defaultValue: 'Fecha de termino' })}</Label>
                            <DatePicker
                                id="endDate"
                                className={`form-control ${formik.touched.endDate && formik.errors.endDate ? 'is-invalid' : ''}`}
                                value={formik.values.endDate ?? undefined}
                                onChange={(date: Date[]) => {
                                    if (date[0]) formik.setFieldValue('endDate', date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                            {formik.touched.endDate && formik.errors.endDate && (
                                <FormFeedback className="d-block">{formik.errors.endDate as string}</FormFeedback>
                            )}
                        </div>
                    </div>

                    <div className="d-flex gap-3 mt-4">
                        <div className="w-50">
                            <Label htmlFor="user" className="form-label">{t('medical.sickness.form.field.detectedBy', { defaultValue: 'Detectada por' })}</Label>
                            <Input
                                type="text"
                                id="user"
                                name="user"
                                value={'' + userLogged.name + ' ' + userLogged.lastname}
                                disabled
                            />
                        </div>

                        <div className="w-50">
                            <Label className="form-label">{t('medical.sickness.form.field.observations', { defaultValue: 'Observaciones' })}</Label>
                            <Input
                                type="text"
                                name="observations"
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


                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn btn-primary ms-auto" onClick={() => checkSicknessData()}>
                            {t('common.button.next', { defaultValue: 'Siguiente' })}
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={2}>
                    <div className="mb-3">
                        <h5 className="mb-1">{t('medical.sickness.form.symptoms.title', { defaultValue: 'Síntomas observados' })}</h5>
                        <small className="text-muted">
                            {t('medical.sickness.form.symptoms.subtitle', { defaultValue: 'Seleccione todos los síntomas observados en el cerdo' })}
                        </small>
                    </div>

                    <SicknessSymptomsSelector value={formik.values.symptoms ?? []} onChange={(symptoms) => formik.setFieldValue("symptoms", symptoms)} />

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="me-2 ri-arrow-left-line" />
                            {t('common.button.back', { defaultValue: 'Anterior' })}
                        </Button>

                        <Button className="btn" onClick={() => checkSymptomsData()}>
                            {t('common.button.next', { defaultValue: 'Siguiente' })}
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
                                        dose: 0,
                                        unit_measurement: r.unit_measurement,
                                        administration_route: "",
                                        startDate: null,
                                        endDate: null
                                    };
                                });
                                return newRows;
                            });
                        }}
                    />

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="me-2 ri-arrow-left-line" />
                            {t('common.button.back', { defaultValue: 'Anterior' })}
                        </Button>

                        <Button
                            className="btn btn-primary ms-auto"
                            onClick={async () => {
                                const ok = await validateSelectedTreatments();
                                if (!ok) return;
                                toggleArrowTab(activeStep + 1);
                            }}
                        >
                            {t('common.button.next', { defaultValue: 'Siguiente' })}
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={4}>
                    <div className="d-flex gap-3 align-items-stretch" style={{ minHeight: "60vh" }}>
                        <div style={{ minWidth: 320 }}>
                            <Card className="shadow-sm h-100">
                                <CardHeader className="bg-light fw-bold fs-5">
                                    {t('medical.sickness.form.pigInfo', { defaultValue: 'Información del cerdo' })}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={PigAttributes}
                                        object={pigDetails ?? {}}
                                    />
                                </CardBody>
                            </Card>
                        </div>

                        <div className="d-flex flex-column flex-grow-1 gap-3">
                            <div className="d-flex gap-3 align-items-stretch" style={{ flex: 1 }}>
                                <Card className="shadow-sm w-50 h-100">
                                    <CardHeader className="bg-light fw-bold fs-5">
                                        {t('medical.sickness.form.sicknessInfo', { defaultValue: 'Información de enfermedad' })}
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
                                        {t('medical.sickness.form.step.symptoms', { defaultValue: 'Síntomas' })}
                                    </CardHeader>

                                    <CardBody className="d-flex flex-column">
                                        {formik.values.symptoms && formik.values.symptoms.length > 0 ? (
                                            <SicknessSymptomsSummary symptoms={formik.values.symptoms} />
                                        ) : (
                                            <div className="text-muted fst-italic d-flex align-items-center justify-content-center flex-grow-1 gap-2">
                                                <i className="fa-solid fa-circle-info" />
                                                {t('medical.sickness.form.symptoms.noSymptoms', { defaultValue: 'No se registraron síntomas' })}
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </div>

                            <div style={{ flex: 1 }}>
                                <Card className="shadow-sm h-100">
                                    <CardHeader className="bg-light fw-bold fs-5">
                                        {t('medical.sickness.form.step.treatment', { defaultValue: 'Tratamiento' })}
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
                                                {t('medical.sickness.form.treatment.noTreatment', { defaultValue: 'No se asignó tratamiento' })}
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 d-flex">
                        <Button
                            className="btn-danger"
                            onClick={() => toggleArrowTab(activeStep - 1)}
                        >
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back', { defaultValue: 'Atrás' })}
                        </Button>

                        <Button
                            className="ms-auto btn-success"
                            onClick={() => formik.handleSubmit()}
                            disabled={formik.isSubmitting}
                        >
                            {formik.isSubmitting ? (
                                <Spinner size="sm" />
                            ) : (
                                <>
                                    <i className="ri-check-line me-2" />
                                    {t('medical.sickness.form.assign', { defaultValue: 'Asignar' })}
                                </>
                            )}
                        </Button>
                    </div>
                </TabPane>


            </TabContent>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t('medical.sickness.form.errorModal', { defaultValue: 'Ha ocurrido un error, intentelo mas tarde' })} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('medical.sickness.form.success.saved', { defaultValue: 'Plan de vacunacion asignado correctamente' })} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
        </>
    )
}

export default PigSicknessForm;
