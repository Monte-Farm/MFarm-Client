import { ConfigContext } from "App";
import { Attribute, MedicationPackage, ProductData, VaccinationPlan } from "common/data_interfaces";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import * as Yup from "yup";
import classnames from "classnames";
import DatePicker from "react-flatpickr";
import AlertMessage from "../Shared/AlertMesagge";
import { Column } from "common/data/data_types";
import SelectTable from "../Tables/SelectTable";
import SelectableCustomTable from "../Tables/SelectableTable";
import noImageUrl from '../../../assets/images/no-image.png'
import ObjectDetails from "../Details/ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import SuccessModal from "../Shared/SuccessModal";
import { HttpStatusCode } from "axios";
import { useTranslation } from "react-i18next";

interface VaccinationPlanFormProps {
    onSave: () => void;
    onCancel: () => void;
}

const VaccinationPlanForm: React.FC<VaccinationPlanFormProps> = ({ onSave, onCancel }) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [products, setProducts] = useState<any[]>([])
    const [vaccinesSelected, setVaccinesSelected] = useState<any[]>([])
    const [vaccinesErrors, setVaccinesErrors] = useState<Record<string, any>>({});
    const [modals, setModals] = useState({ success: false, error: false });

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

    const columns: Column<any>[] = [
        {
            header: t('medication.vaccinePlan.form.column.image', { defaultValue: 'Imagen' }), accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="Imagen del Producto" style={{ height: "70px" }} />
            ),
        },
        { header: t('medication.vaccinePlan.form.column.code', { defaultValue: 'Codigo' }), accessor: "code", type: "text", isFilterable: true },
        { header: t('medication.vaccinePlan.form.column.vaccine', { defaultValue: 'Vacuna' }), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('medication.vaccinePlan.form.column.dose', { defaultValue: 'Dosis' }),
            accessor: "dose",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = vaccinesSelected.find(m => m.vaccine === row._id);
                const realValue = selected?.quantity ?? "";

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.dose === 0 ? "" : (selected?.dose ?? "")}
                            invalid={vaccinesErrors[row._id]?.dose}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                setVaccinesSelected(prev =>
                                    prev.map(m => m.vaccine === row._id ? { ...m, dose: newValue } : m)
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
            header: t('medication.vaccinePlan.form.column.ageObjective', { defaultValue: 'Edad objetivo' }),
            accessor: "age_objetive",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = vaccinesSelected.find(m => m.vaccine === row._id);
                const realValue = selected?.quantity ?? "";

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.age_objective === 0 ? "" : (selected?.age_objective ?? "")}
                            invalid={vaccinesErrors[row._id]?.age_objective}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                setVaccinesSelected(prev =>
                                    prev.map(m => m.vaccine === row._id ? { ...m, age_objective: newValue } : m)
                                );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-describedby="age-addon"
                        />
                        <span className="input-group-text" id="age-addon">{t('medication.vaccinePlan.form.days', { defaultValue: 'dias' })}</span>
                    </div>
                );
            },
        },
        {
            header: t('medication.vaccinePlan.form.column.adminRoute', { defaultValue: 'Vía de administración' }),
            accessor: "administration_route",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = vaccinesSelected.find(m => m.vaccine === row._id);
                const realValue = selected?.administration_route ?? "";
                return (
                    <Input
                        type="select"
                        disabled={!isSelected}
                        value={realValue}
                        invalid={vaccinesErrors[row._id]?.administration_route}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setVaccinesSelected(prev =>
                                prev.map(m => m.vaccine === row._id ? { ...m, administration_route: newValue } : m)
                            );
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">{t('medication.vaccinePlan.form.select', { defaultValue: 'Seleccione...' })}</option>
                        <option value="intramuscular">{t('medication.vaccinePlan.form.adminRoute.intramuscular', { defaultValue: 'Intramuscular' })}</option>
                        <option value="subcutaneous">{t('medication.vaccinePlan.form.adminRoute.subcutaneous', { defaultValue: 'Subcutánea' })}</option>
                        <option value="intranasal">{t('medication.vaccinePlan.form.adminRoute.intranasal', { defaultValue: 'Intranasal' })}</option>
                        <option value="oral">{t('medication.vaccinePlan.form.adminRoute.oral', { defaultValue: 'Oral' })}</option>
                    </Input>
                );
            }
        },
        {
            header: t('medication.vaccinePlan.form.column.frequency', { defaultValue: 'Frecuencia' }),
            accessor: "frequency",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = vaccinesSelected.find(m => m.vaccine === row._id);
                const realValue = selected?.frequency ?? "";
                return (
                    <Input
                        type="select"
                        disabled={!isSelected}
                        value={realValue}
                        invalid={vaccinesErrors[row._id]?.frequency}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setVaccinesSelected(prev =>
                                prev.map(m => m.vaccine === row._id ? { ...m, frequency: newValue } : m)
                            );
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">{t('medication.vaccinePlan.form.select', { defaultValue: 'Seleccione...' })}</option>
                        <option value="single">{t('medication.vaccinePlan.form.frequency.single', { defaultValue: 'Única dosis' })}</option>
                        <option value="single_booster">{t('medication.vaccinePlan.form.frequency.single_booster', { defaultValue: 'Única dosis + refuerzo' })}</option>
                        <option value="3_weeks">{t('medication.vaccinePlan.form.frequency.3_weeks', { defaultValue: 'Cada 3 semanas' })}</option>
                        <option value="4_weeks">{t('medication.vaccinePlan.form.frequency.4_weeks', { defaultValue: 'Cada 4 semanas' })}</option>
                        <option value="6_months">{t('medication.vaccinePlan.form.frequency.6_months', { defaultValue: 'Cada 6 meses' })}</option>
                        <option value="12_months">{t('medication.vaccinePlan.form.frequency.12_months', { defaultValue: 'Cada 12 meses' })}</option>
                        <option value="protocol">{t('medication.vaccinePlan.form.frequency.protocol', { defaultValue: 'Según protocolo' })}</option>
                    </Input>
                );
            }
        },
    ];

    const selectedVaccinesColumns: Column<any>[] = [
        { header: t('medication.vaccinePlan.form.column.code', { defaultValue: 'Codigo' }), accessor: "code", type: "text", isFilterable: true },
        { header: t('medication.vaccinePlan.form.column.product', { defaultValue: 'Producto' }), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('medication.vaccinePlan.form.column.quantity', { defaultValue: 'Cantidad' }),
            accessor: "quantity",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.dose} {row.unit_measurement}</span>
        },
        {
            header: t('medication.vaccinePlan.form.column.adminRouteDisplay', { defaultValue: 'Administracion' }),
            accessor: "administration_route",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                const label = t(`medication.vaccinePlan.form.adminRouteDisplay.${value}`, { defaultValue: value });

                switch (value) {
                    case "oral": color = "info"; break;
                    case "intramuscular":
                    case "subcutaneous":
                    case "intravenous":
                    case "intranasal":
                    case "topical":
                    case "protocol":
                        color = "primary"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: t('medication.vaccinePlan.form.column.ageObjectiveDisplay', { defaultValue: 'Edad objetivo' }),
            accessor: "age_objective",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.age_objective} {t('medication.vaccinePlan.form.days', { defaultValue: 'dias' })}</span>
        },
        {
            header: t('medication.vaccinePlan.form.column.frequency', { defaultValue: 'Frecuencia' }),
            accessor: "frequency",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                const label = t(`medication.vaccinePlan.form.frequencyDisplay.${value}`, { defaultValue: value });

                switch (value) {
                    case "single": color = "info"; break;
                    case "single_booster":
                    case "3_weeks":
                    case "4_weeks":
                    case "6_weeks":
                    case "12_weeks":
                    case "rectal":
                        color = "primary"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
    ]

    const vaccinationPlanAttributes: Attribute[] = [
        { key: 'code', label: t('medication.vaccinePlan.form.planAttribute.code', { defaultValue: 'Codigo' }), type: 'text' },
        { key: 'name', label: t('medication.vaccinePlan.form.planAttribute.name', { defaultValue: 'Nombre' }), type: 'text' },
        { key: 'creation_date', label: t('medication.vaccinePlan.form.planAttribute.creationDate', { defaultValue: 'Fecha de creacion' }), type: 'date' },
        {
            key: 'stage',
            label: t('medication.vaccinePlan.form.planAttribute.stage', { defaultValue: 'Etapa' }),
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                let text = t('medication.vaccinePlan.form.planAttribute.stageUnknown', { defaultValue: 'Desconocido' });

                switch (row.stage) {
                    case "piglet":
                        color = "info";
                        text = t('medication.vaccinePlan.form.planAttribute.stage_piglet', { defaultValue: 'Lechon' });
                        break;
                    case "weaning":
                        color = "info";
                        text = t('medication.vaccinePlan.form.planAttribute.stage_weaning', { defaultValue: 'Destete' });
                        break;
                    case "fattening":
                        color = "primary";
                        text = t('medication.vaccinePlan.form.planAttribute.stage_fattening', { defaultValue: 'Engorda' });
                        break;
                    case "breeder":
                        color = "primary";
                        text = t('medication.vaccinePlan.form.planAttribute.stage_breeder', { defaultValue: 'Reproductor' });
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            key: 'creation_responsible',
            label: t('medication.vaccinePlan.form.planAttribute.responsible', { defaultValue: 'Responsable de registo' }),
            type: 'text',
            render: (_, obj) => (<span className="text-black">{userLogged.name} {userLogged.lastname}</span>)
        },

    ]

    const validationSchema = Yup.object({
        code: Yup.string().required(t('medication.vaccinePlan.form.validation.codeRequired', { defaultValue: 'El código es obligatorio' })).test('unique_code', t('medication.vaccinePlan.form.validation.codeExists', { defaultValue: 'Este codigo ya existe, por favor ingrese otro' }), async (value) => {
            if (!value) return false;
            if (!configContext) return true;
            try {
                const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/vaccination_plan/check_code_exists/${value}`);
                return !response.data.codeExists
            } catch (error) {
                console.error('Error validating unique code: ', error);
                return false;
            }
        }),
        name: Yup.string().required(t('medication.vaccinePlan.form.validation.nameRequired', { defaultValue: 'El nombre es obligatorio' })),
        stage: Yup.string().required(t('medication.vaccinePlan.form.validation.stageRequired', { defaultValue: 'El area de destino es obligatoria' })),
    })

    const vaccineValidation = Yup.object({
        vaccine: Yup.string().required(),
        dose: Yup.number().moreThan(0, t('medication.vaccinePlan.form.validation.doseInvalid', { defaultValue: 'Dosis inválida' })).required(t('medication.vaccinePlan.form.validation.doseRequired', { defaultValue: 'Dosis requerida' })),
        administration_route: Yup.string().required(t('medication.vaccinePlan.form.validation.routeRequired', { defaultValue: 'Vía requerida' })).notOneOf([""], t('medication.vaccinePlan.form.validation.routeSelect', { defaultValue: 'Debe seleccionar una vía' })),
        age_objective: Yup.number().moreThan(0, t('medication.vaccinePlan.form.validation.ageInvalid', { defaultValue: 'Edad invalida' })).required(t('medication.vaccinePlan.form.validation.ageRequired', { defaultValue: 'Edad requerida' })),
        frequency: Yup.string().required(t('medication.vaccinePlan.form.validation.frequencyRequired', { defaultValue: 'Frecuencia requerida' })).notOneOf([""], t('medication.vaccinePlan.form.validation.frequencySelect', { defaultValue: 'Debe seleccionar una frecuencia' })),
    });

    const formik = useFormik<VaccinationPlan>({
        initialValues: {
            code: '',
            name: '',
            description: '',
            farm: userLogged.farm_assigned || '',
            creation_date: null,
            creation_responsible: userLogged._id || '',
            is_active: true,
            stage: '',
            vaccines: [],
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const values = {
                    ...formik.values,
                    vaccines: vaccinesSelected
                }
                const medicationResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/vaccination_plan/create`, values)

                if (medicationResponse.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Plan de vacunacion ${values.code} creado`
                    });

                    toggleModal('success', true)
                }
            } catch (error) {
                console.error('Error saving the information: ', { error })
                setAlertConfig({ visible: true, color: 'danger', message: t('medication.vaccinePlan.form.error.save', { defaultValue: 'Ha ocurrido un error al guardar los datos, intentelo mas tarde' }) })
            }
        }
    })

    const fetchData = async () => {
        if (!configContext) return
        try {
            setLoading(true)

            const [codeResponse, productsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/vaccination_plan/next_plan_code`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_vaccines_products`),
            ])

            formik.setFieldValue('code', codeResponse.data.data)
            const productsWithId = productsResponse.data.data.map((b: any) => ({ ...b, code: b.id, id: b._id }));
            setProducts(productsWithId)
        } catch (error) {
            console.error('Error fetching information: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.vaccinePlan.form.error.load', { defaultValue: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' }) })
        } finally {
            setLoading(false)
        }
    }

    const checkVaccinationData = async () => {
        formik.setTouched({
            code: true,
            name: true,
            creation_date: true,
            stage: true,
        })

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(activeStep + 1);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.vaccinePlan.form.validation.fillAll', { defaultValue: 'Por favor, llene todos los datos' }) })
        }
    }

    const validateSelectedVaccines = async () => {
        const errors: Record<string, any> = {};

        for (const plan of vaccinesSelected) {
            try {
                await vaccineValidation.validate(plan, { abortEarly: false });
            } catch (err: any) {
                const vacErrors: any = {};

                err.inner.forEach((e: any) => {
                    vacErrors[e.path] = true;
                });

                errors[plan.vaccine] = vacErrors;
            }
        }

        setVaccinesErrors(errors);

        if (Object.keys(errors).length > 0) {
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.vaccinePlan.form.validation.fillVaccines', { defaultValue: 'Por favor, llene todos los datos de las vacunas seleccionadas' }) })
            return false;
        }

        return true;
    };

    useEffect(() => {
        fetchData();
        formik.setFieldValue('creation_date', new Date())
    }, [])


    return (
        <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }}>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-medicationPackageData-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            onClick={() => toggleArrowTab(1)}
                            aria-selected={activeStep === 1}
                            aria-controls="step-medicationPackageData-tab"
                            disabled
                        >
                            {t('medication.vaccinePlan.form.step.info', { defaultValue: 'Información del paquete de medicación' })}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-selecMedication-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            onClick={() => toggleArrowTab(2)}
                            aria-selected={activeStep === 2}
                            aria-controls="step-selecMedication-tab"
                            disabled
                        >
                            {t('medication.vaccinePlan.form.step.vaccines', { defaultValue: 'Seleccion de medicacion' })}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-summary-tab"
                            className={classnames({
                                active: activeStep === 3,
                                done: activeStep > 3,
                            })}
                            onClick={() => toggleArrowTab(3)}
                            aria-selected={activeStep === 3}
                            aria-controls="step-summary-tab"
                            disabled
                        >
                            {t('medication.vaccinePlan.form.step.summary', { defaultValue: 'Resumen' })}
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane id="step-medicationPackageData-tab" tabId={1}>
                    <div className="d-flex gap-3">
                        <div className="mt-4 w-50">
                            <Label htmlFor="code" className="form-label">{t('medication.vaccinePlan.form.field.code', { defaultValue: 'Código' })}</Label>
                            <Input
                                type="text"
                                id="code"
                                name="code"
                                value={formik.values.code}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.code && !!formik.errors.code}
                                placeholder="Ej: GRP-001"
                            />
                            {formik.touched.code && formik.errors.code && (
                                <FormFeedback>{formik.errors.code}</FormFeedback>
                            )}
                        </div>

                        <div className="mt-4 w-50">
                            <Label htmlFor="name" className="form-label">{t('medication.vaccinePlan.form.field.name', { defaultValue: 'Nombre del plan de vacunacion' })}</Label>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.name && !!formik.errors.name}
                                placeholder={t('medication.vaccinePlan.form.field.namePlaceholder', { defaultValue: 'Ej: Vacunacion inicial' })}
                            />
                            {formik.touched.name && formik.errors.name && (
                                <FormFeedback>{formik.errors.name}</FormFeedback>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <Label htmlFor="stage" className="form-label">{t('medication.vaccinePlan.form.field.stage', { defaultValue: 'Etapa' })}</Label>
                        <Input
                            type="select"
                            id="stage"
                            name="stage"
                            value={formik.values.stage}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.stage && !!formik.errors.stage}
                        >
                            <option value="">{t('medication.vaccinePlan.form.field.selectStage', { defaultValue: 'Seleccione una etapa' })}</option>
                            <option value="general">{t('medication.vaccinePlan.form.stage.general', { defaultValue: 'General' })}</option>
                            <option value="piglet">{t('medication.vaccinePlan.form.stage.piglet', { defaultValue: 'Lechón' })}</option>
                            <option value="weaning">{t('medication.vaccinePlan.form.stage.weaning', { defaultValue: 'Destete' })}</option>
                            <option value="fattening">{t('medication.vaccinePlan.form.stage.fattening', { defaultValue: 'Engorda' })}</option>
                            <option value="breeder">{t('medication.vaccinePlan.form.stage.breeder', { defaultValue: 'Reproductor' })}</option>
                        </Input>
                        {formik.touched.stage && formik.errors.stage && (
                            <FormFeedback>{formik.errors.stage}</FormFeedback>
                        )}
                    </div>

                    <div className="d-flex gap-3">
                        <div className="mt-4 w-50">
                            <Label htmlFor="creation_date" className="form-label">{t('medication.vaccinePlan.form.field.creationDate', { defaultValue: 'Fecha de registro *' })}</Label>
                            <DatePicker
                                id="creation_date"
                                className={`form-control ${formik.touched.creation_date && formik.errors.creation_date ? 'is-invalid' : ''}`}
                                value={formik.values.creation_date ?? undefined}
                                onChange={(date: Date[]) => {
                                    if (date[0]) formik.setFieldValue('date', date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                            {formik.touched.creation_date && formik.errors.creation_date && (
                                <FormFeedback className="d-block">{formik.errors.creation_date as string}</FormFeedback>
                            )}
                        </div>

                        <div className="mt-4 w-50">
                            <Label htmlFor="user" className="form-label">{t('medication.vaccinePlan.form.field.responsible', { defaultValue: 'Responsable del registro *' })}</Label>
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
                        <Label htmlFor="description" className="form-label">{t('medication.vaccinePlan.form.field.description', { defaultValue: 'Descripción' })}</Label>
                        <Input
                            type="text"
                            id="description"
                            name="description"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.description && !!formik.errors.description}
                            placeholder={t('medication.vaccinePlan.form.field.descriptionPlaceholder', { defaultValue: 'Observaciones sobre el grupo' })}
                        />
                        {formik.touched.description && formik.errors.description && (
                            <FormFeedback>{formik.errors.description}</FormFeedback>
                        )}
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn btn-primary ms-auto" onClick={() => checkVaccinationData()}>
                            {t('common.button.next', { defaultValue: 'Siguiente' })}
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane id="step-selecMedication-tab" tabId={2}>
                    <SelectableCustomTable
                        columns={columns}
                        data={products}
                        showPagination={true}
                        rowsPerPage={6}
                        onSelect={(rows) => setVaccinesSelected(rows.map(r => ({ vaccine: r._id, dose: 0, administration_route: "", age_objective: 0, frequency: "" })))}
                    />

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back', { defaultValue: 'Atrás' })}
                        </Button>


                        <Button
                            className="btn btn-primary ms-auto"
                            onClick={async () => {
                                const ok = await validateSelectedVaccines();
                                if (!ok) return;
                                toggleArrowTab(3);
                            }}
                        >
                            {t('common.button.next', { defaultValue: 'Siguiente' })}
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane id="step-summary-tab" tabId={3}>
                    <div className="d-flex gap-3">
                        <Card className="">
                            <CardHeader>
                                <h5>{t('medication.vaccinePlan.form.summary.planInfo', { defaultValue: 'Informacion del paquete de medicacion' })}</h5>
                            </CardHeader>
                            <CardBody>
                                <ObjectDetails attributes={vaccinationPlanAttributes} object={formik.values} />
                            </CardBody>
                        </Card>

                        <Card className="w-100">
                            <CardHeader>
                                <h5>{t('medication.vaccinePlan.form.summary.vaccinesSelected', { defaultValue: 'Medicamentos seleccionados' })}</h5>
                            </CardHeader>
                            <CardBody className="p-0">
                                <CustomTable
                                    columns={selectedVaccinesColumns}
                                    data={vaccinesSelected.map(ms => ({
                                        ...products.find(p => p._id === ms.vaccine),
                                        ...ms
                                    }))}
                                    showSearchAndFilter={false}
                                />
                            </CardBody>
                        </Card>
                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back', { defaultValue: 'Atrás' })}
                        </Button>

                        <Button className="ms-auto btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                            {formik.isSubmitting ? (
                                <div>
                                    <Spinner size='sm' />
                                </div>
                            ) : (
                                <div>
                                    <i className="ri-check-line me-2" />
                                    {t('medication.vaccinePlan.form.register', { defaultValue: 'Registrar' })}
                                </div>
                            )}

                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <SuccessModal isOpen={modals.success} onClose={onSave} message={t('medication.vaccinePlan.form.success', { defaultValue: 'Paquete de medicamentos registrado con exito' })} />
            <SuccessModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t('medication.vaccinePlan.form.errorSuccess', { defaultValue: 'Ha ocurrido un error al registrar el paquete de medicamentos, intentelo mas tarde' })} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
        </form>
    )
}

export default VaccinationPlanForm
