import { logger } from 'utils/logger';
import { ConfigContext } from "App"
import { useFormik } from "formik"
import { getEffectiveUser } from "helpers/impersonation_helper"
import { useContext, useEffect, useState } from "react"
import * as Yup from 'yup';
import classnames from "classnames";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import SelectableTable from "../Tables/SelectableTable";
import { use } from "i18next";
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

interface DiscardPigInGroupFormProps {
    groupId: string
    onSave: () => void
    onCancel: () => void
}

const DiscardPigInGroupForm: React.FC<DiscardPigInGroupFormProps> = ({ groupId, onSave, onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext)
    const userLogged = getEffectiveUser()
    const [modals, setModals] = useState({ pigDetails: false, success: false, error: false })
    const [selectedPig, setSelectedPig] = useState<any>()
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(false);
    const [pigs, setPigs] = useState<any[]>([])
    const [detailsSelectedPig, setDetailsSelectedPigs] = useState<string>('')

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];
            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const pigsColumns: Column<any>[] = [
        {
            header: t('groups.column.code', { defaultValue: 'Codigo' }),
            accessor: 'code',
            render: (_, row) => (
                <Button
                    className="text-underline"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDetailsSelectedPigs(row._id)
                        toggleModal('pigDetails')
                    }}
                >
                    {row.code} ↗
                </Button>
            )
        },
        { header: t('groups.column.breed', { defaultValue: 'Raza' }), accessor: 'breed', type: 'text', isFilterable: true },
        {
            header: t('groups.column.sex', { defaultValue: 'Sexo' }),
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? `♂ ${t('pigs.sex.male', { defaultValue: 'Macho' })}` : `♀ ${t('pigs.sex.female', { defaultValue: 'Hembra' })}`}
                </Badge>
            ),
        },
        { header: t('groups.column.weight', { defaultValue: 'Peso actual' }), accessor: 'weight', type: 'number', isFilterable: true },
        {
            header: t('groups.column.stage', { defaultValue: 'Etapa' }),
            accessor: 'currentStage',
            render: (value: string) => {
                let color = "secondary";
                return <Badge color={color}>{t(`pigs.stage.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        { header: t('groups.column.birthDate', { defaultValue: 'Fecha de N.' }), accessor: 'birthdate', type: 'date' },
    ];

    const pigsAttributes: Attribute[] = [
        { key: "code", label: t('common.field.code', { defaultValue: 'Código' }), type: "text" },
        { key: "birthdate", label: t('common.field.birthdate', { defaultValue: 'Fecha de nacimiento' }), type: "date" },
        { key: "breed", label: t('groups.column.breed', { defaultValue: 'Raza' }), type: "text" },
        {
            key: "origin",
            label: t('common.field.origin', { defaultValue: 'Origen' }),
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'born':
                        color = 'success';
                        label = t('pigs.origin.born', { defaultValue: 'Nacido en la granja' });
                        break;
                    case 'purchased':
                        color = 'warning';
                        label = t('pigs.origin.purchased', { defaultValue: 'Comprado' });
                        break;
                    case 'donated':
                        color = 'info';
                        label = t('pigs.origin.donated', { defaultValue: 'Donado' });
                        break;
                    case 'other':
                        color = 'dark';
                        label = t('pigs.origin.other', { defaultValue: 'Otro' });
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "weight", label: t('groups.column.weight', { defaultValue: 'Peso actual' }), type: "text" },
        {
            key: 'currentStage',
            label: t('groups.column.stage', { defaultValue: 'Etapa' }),
            render: (value: string) => {
                let color = "secondary";
                return <Badge color={color}>{t(`pigs.stage.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        { key: "observations", label: t('groups.column.observations', { defaultValue: 'Observaciones' }), type: "text" },
    ];

    const discardAttributes: Attribute[] = [
        {
            key: "reason",
            label: t('common.field.reason', { defaultValue: 'Razón' }),
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "lameness": color = "warning"; label = t('pigs.discard.reason.lameness', { defaultValue: 'Cojeras' }); break;
                    case "poor_body_condition": color = "warning"; label = t('pigs.discard.reason.poor_body_condition', { defaultValue: 'Condición corporal deficiente' }); break;
                    case "reproductive_failure": color = "danger"; label = t('pigs.discard.reason.reproductive_failure', { defaultValue: 'Falla reproductiva' }); break;
                    case "low_milk_production": color = "info"; label = t('pigs.discard.reason.low_milk_production', { defaultValue: 'Baja producción de leche' }); break;
                    case "disease": color = "danger"; label = t('pigs.discard.reason.disease', { defaultValue: 'Enfermedad' }); break;
                    case "injury": color = "warning"; label = t('pigs.discard.reason.injury', { defaultValue: 'Lesión' }); break;
                    case "aggressive_behavior": color = "primary"; label = t('pigs.discard.reason.aggressive_behavior', { defaultValue: 'Comportamiento agresivo' }); break;
                    case "old_age": color = "secondary"; label = t('pigs.discard.reason.old_age', { defaultValue: 'Edad avanzada' }); break;
                    case "death": color = "dark"; label = t('pigs.discard.reason.death', { defaultValue: 'Muerte' }); break;
                    case "poor_growth": color = "info"; label = t('pigs.discard.reason.poor_growth', { defaultValue: 'Bajo crecimiento / rendimiento' }); break;
                    case "hernias": color = "warning"; label = t('pigs.discard.reason.hernias', { defaultValue: 'Hernias' }); break;
                    case "prolapse": color = "danger"; label = t('pigs.discard.reason.prolapse', { defaultValue: 'Prolapso' }); break;
                    case "non_ambulatory": color = "danger"; label = t('pigs.discard.reason.non_ambulatory', { defaultValue: 'No puede caminar' }); break;
                    case "respiratory_failure": color = "danger"; label = t('pigs.discard.reason.respiratory_failure', { defaultValue: 'Problemas respiratorios severos' }); break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: "destination",
            label: t('common.field.destination', { defaultValue: 'Destino' }),
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "slaughterhouse": color = "primary"; label = t('pigs.discard.destination.slaughterhouse', { defaultValue: 'Rastro' }); break;
                    case "on_farm_euthanasia": color = "danger"; label = t('pigs.discard.destination.on_farm_euthanasia', { defaultValue: 'Eutanasia en granja' }); break;
                    case "sale": color = "success"; label = t('pigs.discard.destination.sale', { defaultValue: 'Venta' }); break;
                    case "research": color = "info"; label = t('pigs.discard.destination.research', { defaultValue: 'Investigación' }); break;
                    case "rendering": color = "secondary"; label = t('pigs.discard.destination.rendering', { defaultValue: 'Procesadora / despojos' }); break;
                    case "composting": color = "warning"; label = t('pigs.discard.destination.composting', { defaultValue: 'Compostaje' }); break;
                    case "burial": color = "dark"; label = t('pigs.discard.destination.burial', { defaultValue: 'Enterrado' }); break;
                    case "incineration": color = "danger"; label = t('pigs.discard.destination.incineration', { defaultValue: 'Incineración' }); break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "date", label: t('common.field.date', { defaultValue: 'Fecha' }), type: "date" },
        { key: "observations", label: t('groups.column.observations', { defaultValue: 'Observaciones' }), type: "text" },
    ];

    const validationSchema = Yup.object({
        reason: Yup.string().required(t('groups.form.discardPig.validation.reason', { defaultValue: 'Seleccione la razon del descarte' })),
        destination: Yup.string().required(t('groups.form.discardPig.validation.destination', { defaultValue: 'Seleccione el destino del cerdo descartado' })),
        date: Yup.date().required(t('groups.form.discardPig.validation.date', { defaultValue: 'Por favor ingrese la fecha del parto' })),
    })

    const formik = useFormik({
        initialValues: {
            reason: 'death',
            destination: '',
            date: null,
            responsible: userLogged._id,
            observations: '',
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext || !userLogged) return
            try {
                setSubmitting(true)

                const discardResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/pig/discard_pig/${selectedPig._id}`, values)
                if (discardResponse.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Cerdo: ${selectedPig.code} descartado`
                    });
                    toggleModal('success')
                }
            } catch (error) {
                logger.error('An error has ocurred', { error })
                toggleModal('error')
            } finally {
                setSubmitting(false)
            }
        }
    })

    const fetchPigs = async () => {
        if (!configContext || !userLogged) return
        try {
            setLoading(true);
            const pigResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_pigs/${groupId}`)
            const pigsWithId = pigResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            const pigsFiltered = pigsWithId.filter((p: any) => p.status === 'alive')
            setPigs(pigsFiltered)
        } catch (error) {
            logger.error('Error fetching data: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('groups.form.discardPig.loadError', { defaultValue: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' }) })
        } finally {
            setLoading(false)
        }
    }

    const checkSelectedPig = () => {
        if (selectedPig) {
            toggleArrowTab(activeStep + 1)
        } else {
            setAlertConfig({ visible: true, color: 'danger', message: t('groups.form.discardPig.validationPig', { defaultValue: 'Seleccione un cerdo antes de continuar' }) })
        }
    }

    const checkDiscardData = async () => {
        setAlertConfig({ ...alertConfig, visible: false })

        formik.setTouched({
            reason: true,
            destination: true,
            date: true,
        });

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(3);
        } catch (err) {

        }
    };

    useEffect(() => {
        fetchPigs();
        formik.setFieldValue('date', new Date())
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>

                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-pigSelect-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-pigSelect-tab"
                            >
                                {t('groups.form.discardPig.step.pigSelect', { defaultValue: 'Selección de cerdo' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-discardInfo-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-discardInfo-tab"
                            >
                                {t('groups.form.discardPig.step.discardInfo', { defaultValue: 'Información de muerte' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                    done: activeStep > 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-summary-tab"
                            >
                                {t('groups.form.step3', { defaultValue: 'Resumen' })}
                            </NavLink>
                        </NavItem>

                    </Nav>
                </div>


                <TabContent activeTab={activeStep}>
                    <TabPane id="step-pigSelect-tab" tabId={1}>
                        <SelectableTable data={pigs} columns={pigsColumns} selectionMode="single" showPagination={true} rowsPerPage={7} onSelect={(rows) => setSelectedPig(rows?.[0])} />

                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkSelectedPig()}>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-discardInfo-tab" tabId={2}>
                        <div className="d-flex gap-2 mt-4">
                            <div className="w-100">
                                <Label htmlFor="destination" className="form-label">{t('groups.form.discardPig.destinationLabel', { defaultValue: 'Destino del cerdo' })}</Label>
                                <Input
                                    type="select"
                                    id="destination"
                                    name="destination"
                                    value={formik.values.destination}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.destination && !!formik.errors.destination}
                                >
                                    <option value="">{t('groups.form.discardPig.destinationPlaceholder', { defaultValue: 'Selecciona un destino' })}</option>
                                    <option value="rendering">{t('pigs.discard.destination.rendering', { defaultValue: 'Procesadora / despojos' })}</option>
                                    <option value="composting">{t('pigs.discard.destination.composting', { defaultValue: 'Compostaje' })}</option>
                                    <option value="burial">{t('pigs.discard.destination.burial', { defaultValue: 'Enterrado' })}</option>
                                    <option value="incineration">{t('pigs.discard.destination.incineration', { defaultValue: 'Incineración' })}</option>
                                </Input>

                                {formik.touched.destination && formik.errors.destination && (
                                    <FormFeedback>{formik.errors.destination}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="discard_date" className="form-label">{t('groups.form.discardPig.dateLabel', { defaultValue: 'Fecha de muerte' })}</Label>
                                <DatePicker
                                    id="discard_date"
                                    className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                                    value={formik.values.date ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue('date', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {formik.touched.date && formik.errors.date && (
                                    <FormFeedback className="d-block">{formik.errors.date as string}</FormFeedback>
                                )}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="responsible" className="form-label">{t('groups.form.discardPig.responsibleLabel', { defaultValue: 'Responsable de registro' })}</Label>
                                <Input
                                    type="text"
                                    id="responsible"
                                    name="responsible"
                                    value={`${userLogged?.name} ${userLogged?.lastname}`}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-100">
                                <Label htmlFor="observations" className="form-label">{t('groups.form.discardPig.observationsLabel', { defaultValue: 'Observaciones' })}</Label>
                                <Input
                                    type="text"
                                    id="observations"
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

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t('common.button.back', { defaultValue: 'Atras' })}
                            </Button>

                            <Button className="ms-auto" type="button" onClick={() => checkDiscardData()}>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>

                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={3}>
                        <Card className="mb-4 shadow-sm bg-light">
                            <CardBody className="d-flex justify-content-between align-items-center">
                                <span className="text-black fs-5">
                                    <strong>{t('groups.form.discardPig.responsible', { defaultValue: 'Responsable del registro: ' })}</strong>
                                    {userLogged.name}{" "}
                                    {userLogged.lastname}
                                </span>
                            </CardBody>
                        </Card>

                        <div className="d-flex gap-3 align-items-stretch">
                            <Card className="shadow-sm w-50">
                                <CardHeader className="bg-light fw-bold fs-5">
                                    {t('groups.form.discardPig.discardInfo', { defaultValue: 'Información del descarte' })}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={discardAttributes} object={formik.values} />
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm w-50">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    {t('groups.form.discardPig.pigInfo', { defaultValue: 'Información del cerdo' })}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={pigsAttributes} object={selectedPig} />
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
                                        {t('common.button.register', { defaultValue: 'Registrar' })}
                                    </div>
                                )}

                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <Modal isOpen={modals.pigDetails} toggle={() => toggleModal('pigDetails')} size="lg" centered className="border-0">
                <ModalHeader toggle={() => toggleModal('pigDetails')} className="border-0 pb-0">
                    <h4 className="modal-title text-primary fw-bold">{t('groups.form.discardPig.pigDetailsTitle', { defaultValue: 'Detalles de la extracción' })}</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    <PigDetailsModal pigId={detailsSelectedPig} showAllDetailsButton={false} />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('groups.form.discardPig.success', { defaultValue: 'Cerdo descartado con exito' })} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t('groups.form.discardPig.error', { defaultValue: 'Ha ocurrido un error al descartar el cerdo, intentelo mas tarde' })} />

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    )
}

export default DiscardPigInGroupForm
