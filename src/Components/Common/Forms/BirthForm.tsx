import { logger } from 'utils/logger';
import { ConfigContext } from "App"
import { Column } from "common/data/data_types"
import { useFormik } from "formik"

import { useContext, useEffect, useState } from "react"
import { Button, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Alert, Modal, ModalHeader, ModalBody, Label, Input, FormFeedback, Spinner, Card, CardHeader, CardBody } from "reactstrap"
import * as Yup from 'yup';
import classnames from "classnames";
import { getEffectiveUser } from "helpers/impersonation_helper"
import { FiXCircle } from "react-icons/fi"
import PigDetailsModal from "../Details/DetailsPigModal"
import DatePicker from "react-flatpickr"
import SuccessModal from "../Shared/SuccessModal"
import ErrorModal from "../Shared/ErrorModal"
import { Attribute, Litter, PigletSnapshot } from "common/data_interfaces"
import ObjectDetails from "../Details/ObjectDetails"
import SimpleBar from "simplebar-react"
import CustomTable from "../Tables/CustomTable"
import SelectableTable from "../Tables/SelectableTable"
import AlertMessage from "../Shared/AlertMesagge"
import { useTranslation } from "react-i18next"

interface BirthFormProps {
    pregnancy?: any
    onSave: () => void
    onCancel: () => void
}

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const BirthForm: React.FC<BirthFormProps> = ({ pregnancy, onSave, onCancel }) => {
    const { t } = useTranslation()
    const configContext = useContext(ConfigContext)
    const userLogged = getEffectiveUser()
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [upcomingBirths, setUpcomingBirths] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true)
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [alerts, setAlerts] = useState({ inseminationEmpty: false, birthDataEmpty: false, litterEmpty: false })
    const [modals, setModals] = useState({ sowDetails: false })
    const [selectedSow, setSelectedSow] = useState<string>('')
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false)
    const [errorModalOpen, setErrorModalOpen] = useState<boolean>(false)
    const [selectedPregnancy, setSelectedPregnancy] = useState<any>()
    const [sowDetails, setSowDetails] = useState<any>({})
    const [pigletsArray, setPigletsArray] = useState<PigletSnapshot[]>([])

    const [maleCount, setMaleCount] = useState<number | "">(0);
    const [femaleCount, setFemaleCount] = useState<number | "">(0);
    const [avgWeight, setAvgWeight] = useState<number | "">(0);
    const [useIndividualWeight, setUseIndividualWeight] = useState<boolean>(false);
    const [totalLitterWeight, setTotalLitterWeight] = useState<number | "">(0);

    const toggleAlerts = (alertName: keyof typeof alerts, state?: boolean) => {
        setAlerts((prev) => ({ ...prev, [alertName]: state ?? !prev[alertName] }));
    };

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

    const upcomingBirthsColumns: Column<any>[] = [
        {
            header: t('birth.column.sow', { defaultValue: 'Cerda' }),
            accessor: 'sow',
            type: 'text',
            isFilterable: true,
            render: (_, row) => (
                <Button
                    className="text-underline fs-6 p-0"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSow(row.sow._id);
                        toggleModal('sowDetails')
                    }}
                >
                    {row.sow?.code} ↗
                </Button>
            )
        },
        { header: t('birth.column.inseminationDate', { defaultValue: 'Fecha de inseminación' }), accessor: 'start_date', type: 'date', isFilterable: true },
        { header: t('birth.column.estimatedFarrowing', { defaultValue: 'Fecha estimada de parto' }), accessor: 'estimated_farrowing_date', type: 'date', isFilterable: true },
    ]

    const BirthAttributes: Attribute[] = [
        { key: 'birth_date', label: t('birth.form.birthDate', { defaultValue: 'Fecha de parto' }), type: 'date' },
        {
            key: 'birth_type',
            label: t('birth.form.birthType', { defaultValue: 'Tipo de parto' }),
            type: 'text',
            render: (value: string) => {
                let color = '';
                const label = t(`birth.type.${value}`, { defaultValue: value });

                switch (value) {
                    case 'normal': color = 'success'; break;
                    case 'cesarean': color = 'primary'; break;
                    case 'abortive': color = 'danger'; break;
                    case 'dystocia': color = 'warning'; break;
                    case 'induced': color = 'info'; break;
                    default: color = 'secondary';
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'assisted',
            label: t('birth.form.assisted', { defaultValue: 'Asistido' }),
            type: 'boolean',
            render: (_, obj) => (
                <Badge color={obj.assisted ? 'success' : 'warning'}>
                    {obj.assisted ? t('birth.assisted.yes', { defaultValue: 'Si' }) : t('birth.assisted.no', { defaultValue: 'No' })}
                </Badge>
            )
        },
        { key: 'observations', label: t('birth.form.observations', { defaultValue: 'Observaciones' }), type: 'text' },
        {
            key: 'responsible',
            label: t('birth.field.responsible', { defaultValue: 'Responsable' }),
            type: 'text',
            render: (_, obj) => (
                <span className="text-black">{userLogged.name} {userLogged.lastname}</span>
            )
        },
        { key: 'stillborn', label: t('birth.form.stillborn', { defaultValue: 'Nacidos muertos' }), type: 'text' },
        { key: 'mummies', label: t('birth.form.mummies', { defaultValue: 'Momias' }), type: 'text' },
    ]

    const sowAttributes: Attribute[] = [
        { key: "code", label: t('common.field.code', { defaultValue: 'Código' }), type: "text" },
        { key: "birthdate", label: t('common.field.birthDate', { defaultValue: 'Fecha de nacimiento' }), type: "date" },
        { key: "breed", label: t('common.field.breed', { defaultValue: 'Raza' }), type: "text" },
        { key: "origin", label: t('pigs.field.origin', { defaultValue: 'Origen' }), type: "text" },
        { key: "weight", label: t('common.field.weightCurrent', { defaultValue: 'Peso actual' }), type: "text" },
    ]

    const pigletsColumns: Column<any>[] = [
        {
            header: t('birth.form.pigletNumber', { number: '', defaultValue: 'Lechón' }),
            accessor: '',
            type: 'text',
            render: (_, row,) => <span className="text-black">{t('birth.form.pigletNumber', { number: pigletsArray.indexOf(row) + 1, defaultValue: `Lechón #${pigletsArray.indexOf(row) + 1}` })}</span>
        },
        {
            header: t('litter.pigletColumn.sex', { defaultValue: 'Sexo' }),
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {t(`common.sex.${value}`, { defaultValue: value === 'male' ? '♂ Macho' : '♀ Hembra' })}
                </Badge>
            ),
        },
        { header: t('litter.pigletColumn.weight', { defaultValue: 'Peso (kg)' }), accessor: 'weight', type: 'text' },
    ]

    const validationSchema = Yup.object({
        birth_date: Yup.date().required(t('birth.form.validationBirthDate', { defaultValue: 'Por favor ingrese la fecha del parto' })),
        birth_type: Yup.string().required(t('birth.form.validationBirthType', { defaultValue: 'Por favor, seleccione el tipo de parto' })),
        responsible: Yup.string().required(t('birth.form.validationResponsible', { defaultValue: 'Por favor, seleccione al responsable del parto' })),
        assisted: Yup.boolean(),
        observations: Yup.string(),
    })

    const formik = useFormik({
        initialValues: {
            sow: '',
            pregnancy: '',
            birth_date: null,
            birth_type: '',
            assisted: false,
            observations: '',
            responsible: userLogged._id,
            born_alive: 0,
            stillborn: 0,
            mummies: 0,
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext || !userLogged) return
            try {
                setSubmitting(true)

                const birthResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/births/create`, values);
                const birthData = birthResponse.data.data;

                const avgWeight = pigletsArray.reduce((acc, p) => Number(acc) + Number(p.weight), 0) / pigletsArray.length
                const litterData: Litter = {
                    code: "",
                    farm: userLogged.farm_assigned,
                    mother: birthData.sow,
                    birth: birthData._id,
                    birthDate: birthData.birth_date,
                    initialMale: Number(maleCount),
                    initialFemale: Number(femaleCount),
                    currentMale: Number(maleCount),
                    currentFemale: Number(femaleCount),
                    averageWeight: Number(avgWeight.toFixed(2)),
                    status: 'active',
                    piglets: pigletsArray,
                    responsible: userLogged._id,
                    events: [],
                    feedAdministrationHistory: [],
                    medications: [],
                    medicationPackagesHistory: [],
                    vaccinationPlansHistory: [],
                }

                const reproductionItem = {
                    date: new Date(),
                    type: 'birth',
                    responsible: userLogged._id,
                    description: 'Parto registrado',
                    eventRef: birthResponse.data.data._id,
                    eventModel: 'births'
                }

                await configContext.axiosHelper.create(`${configContext.apiUrl}/litter/create`, litterData)
                await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/add_reproduction_item/${values.sow}`, reproductionItem)
                await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update/${sowDetails._id}/${userLogged._id}`, {
                    currentStage: 'breeder'
                });
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Parto de la cerda ${values.sow} registrado`
                });

                setSuccessModalOpen(true)
            } catch (error) {
                logger.error('An error has ocurred', { error })
                setErrorModalOpen(true)
            } finally {
                setSubmitting(false)
            }
        }
    })

    const checkInseminationSelected = () => {
        toggleAlerts('inseminationEmpty', false)

        if (!formik.values.pregnancy || !formik.values.sow) {
            toggleAlerts('inseminationEmpty', true)
            return
        }
        toggleArrowTab(2)
    }

    const checkBirthData = async () => {
        toggleAlerts('birthDataEmpty', false)

        formik.setTouched({
            birth_date: true,
            birth_type: true,
            assisted: true,
            observations: true,
            responsible: true
        });

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(3);
        } catch (err) {

        }
    };

    const checkLitterData = () => {
        toggleAlerts('litterEmpty', false)
        pigletsArray.length === 0 ? toggleAlerts('litterEmpty') : toggleArrowTab(4)
    }

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            const [upcomingBirthsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pregnancies/find_available_births/${userLogged.farm_assigned}`),
            ])

            const birthsWithId = upcomingBirthsResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            setUpcomingBirths(birthsWithId);

        } catch (error) {
            logger.error(`Error fetching data: ${error}`)
        } finally {
            setLoading(false)
        }
    }

    const fetchSowDetails = async () => {
        if (!configContext) return;

        const sowId = pregnancy ? pregnancy.sow?._id : selectedPregnancy?.sow?._id;

        if (!sowId) return;

        try {
            const { data } = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${sowId}`);
            setSowDetails(data.data);
        } catch (error) {
            logger.error('Error fetching sow details', error);
        }
    };

    useEffect(() => {
        fetchSowDetails();
    }, [selectedPregnancy])

    useEffect(() => {
        if (!pregnancy) {
            fetchData();
        }
        if (pregnancy) {
            formik.setFieldValue('sow', pregnancy.sow._id);
            formik.setFieldValue('pregnancy', pregnancy._id);
            toggleArrowTab(2)
        }

        formik.setFieldValue('birth_date', new Date())
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [])

    useEffect(() => {
        const malePiglets: PigletSnapshot[] = Array.from({ length: Number(maleCount) }, () => ({
            sex: 'male',
            weight: 0,
            status: 'alive',
            recordedAt: new Date()
        }));

        const femalePiglets: PigletSnapshot[] = Array.from({ length: Number(femaleCount) }, () => ({
            sex: 'female',
            weight: 0,
            status: 'alive',
            recordedAt: new Date()
        }));

        setPigletsArray([...malePiglets, ...femalePiglets]);

    }, [maleCount, femaleCount])

    useEffect(() => {
        const pigCount = Number(maleCount) + Number(femaleCount);
        formik.setFieldValue('born_alive', pigCount)
    }, [maleCount, femaleCount])

    useEffect(() => {
        if (!useIndividualWeight && totalLitterWeight && pigletsArray.length > 0) {
            const averageWeight = Number(totalLitterWeight) / pigletsArray.length;
            const newArray = pigletsArray.map(piglet => ({
                ...piglet,
                weight: Number(averageWeight.toFixed(2))
            }));
            setPigletsArray(newArray);
        }
    }, [totalLitterWeight, useIndividualWeight, pigletsArray.length])

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        {!pregnancy && (
                            <NavItem>
                                <NavLink
                                    href='#'
                                    id="step-inseminationSelect-tab"
                                    className={classnames({
                                        active: activeStep === 1,
                                        done: activeStep > 1,
                                    })}
                                    onClick={() => toggleArrowTab(1)}
                                    aria-selected={activeStep === 1}
                                    aria-controls="step-inseminationSelect-tab"
                                >
                                    {t('birth.form.step1', { defaultValue: 'Selección inseminación' })}
                                </NavLink>
                            </NavItem>
                        )}

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-birthinfo-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-birthinfo-tab"
                            >
                                {t('birth.form.step2', { defaultValue: 'Información del parto' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-litter-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                    done: activeStep > 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-birthinfo-tab"
                            >
                                {t('birth.form.step3', { defaultValue: 'Camada' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 4,
                                    done: activeStep > 4,
                                })}
                                onClick={() => toggleArrowTab(4)}
                                aria-selected={activeStep === 4}
                                aria-controls="step-summary-tab"
                            >
                                {t('birth.form.step4', { defaultValue: 'Resumen' })}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-inseminationSelect-tab" tabId={1}>
                        <SelectableTable data={upcomingBirths} columns={upcomingBirthsColumns} selectionMode="single" showPagination={true} rowsPerPage={10} onSelect={(rows) => { formik.setFieldValue('sow', rows[0]?.sow?._id); formik.setFieldValue('pregnancy', rows[0]?._id); setSelectedPregnancy(rows[0]) }} />

                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkInseminationSelected()}>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line" />
                            </Button>
                        </div>

                        <AlertMessage color={"danger"} message={t('birth.form.alertSelectInsemination', { defaultValue: 'Debe seleccionar una inseminación de la tabla para poder avanzar al siguiente paso' })} visible={alerts.inseminationEmpty} onClose={() => toggleAlerts('inseminationEmpty', false)} autoClose={3000} absolutePosition={false} />
                    </TabPane>

                    <TabPane id="step-birthinfo-tab" tabId={2}>
                        <div className="mt-4 w-100">
                            <Label htmlFor="date" className="form-label">{t('birth.form.birthDate', { defaultValue: 'Fecha de parto' })}</Label>
                            <DatePicker
                                id="date"
                                className={`form-control ${formik.touched.birth_date && formik.errors.birth_date ? 'is-invalid' : ''}`}
                                value={formik.values.birth_date ?? undefined}
                                onChange={(date: Date[]) => {
                                    if (date[0]) formik.setFieldValue('birth_date', date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                            {formik.touched.birth_date && formik.errors.birth_date && (
                                <FormFeedback className="d-block">{formik.errors.birth_date as string}</FormFeedback>
                            )}
                        </div>

                        <div className="d-flex gap-2">
                            <div className="mt-4 w-50">
                                <Label htmlFor="birth_type" className="form-label">{t('birth.form.birthType', { defaultValue: 'Tipo de parto' })}</Label>
                                <Input
                                    type="select"
                                    id="birth_type"
                                    name="birth_type"
                                    value={formik.values.birth_type}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.birth_type && !!formik.errors.birth_type}
                                >
                                    <option value="">{t('birth.form.birthTypeSelect', { defaultValue: 'Seleccione un tipo' })}</option>
                                    <option value="normal">{t('birth.type.normal', { defaultValue: 'Normal' })}</option>
                                    <option value="cesarean">{t('birth.type.cesarean', { defaultValue: 'Cesárea' })}</option>
                                    <option value="abortive">{t('birth.type.abortive', { defaultValue: 'Abortivo' })}</option>
                                    <option value="dystocia">{t('birth.type.dystocia', { defaultValue: 'Distócico' })}</option>
                                    <option value="induced">{t('birth.type.induced', { defaultValue: 'Inducido' })}</option>
                                </Input>
                                {formik.touched.birth_type && formik.errors.birth_type && (
                                    <FormFeedback>{formik.errors.birth_type}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-50">
                                <Label htmlFor="assisted" className="form-label">{t('birth.form.assisted', { defaultValue: 'Parto asistido' })}</Label>
                                <Input
                                    type="select"
                                    id="assisted"
                                    name="assisted"
                                    value={formik.values.assisted ? 'true' : 'false'}
                                    onChange={(e) =>
                                        formik.setFieldValue('assisted', e.target.value === 'true')
                                    }
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.assisted && !!formik.errors.assisted}
                                >
                                    <option value="">{t('birth.form.assistedSelect', { defaultValue: 'Seleccione una opción' })}</option>
                                    <option value="true">{t('birth.form.assistedYes', { defaultValue: 'Sí' })}</option>
                                    <option value="false">{t('birth.form.assistedNo', { defaultValue: 'No' })}</option>
                                </Input>
                                {formik.touched.assisted && formik.errors.assisted && (
                                    <FormFeedback>{formik.errors.assisted}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="observations" className="form-label">{t('birth.form.observations', { defaultValue: 'Observaciones' })}</Label>
                            <Input
                                type="textarea"
                                id="observations"
                                name="observations"
                                value={formik.values.observations}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.observations && !!formik.errors.observations}
                                placeholder={t('birth.form.observationsPlaceholder', { defaultValue: 'Ej: Parto normal' })}
                            />
                            {formik.touched.observations && formik.errors.observations && (
                                <FormFeedback>{formik.errors.observations}</FormFeedback>
                            )}
                        </div>


                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t('common.button.back', { defaultValue: 'Volver' })}
                            </Button>

                            <Button className="ms-auto" onClick={() => checkBirthData()}>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>

                        {alerts.birthDataEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">{t('birth.form.alertFillData', { defaultValue: 'Por favor, llene todos los datos requeridos' })}</span>
                                <Button close onClick={() => toggleAlerts('birthDataEmpty')} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-litter-tab" tabId={3}>
                        <Card className="shadow-sm mb-3">
                            <CardHeader className="bg-light">
                                <h5 className="mb-0 text-primary">{t('birth.form.cardLitterInfo', { defaultValue: 'Información de la Camada' })}</h5>
                            </CardHeader>
                            <CardBody>
                                <div className="d-flex gap-2 mb-3">
                                    <div className="w-50">
                                        <Label htmlFor="femaleCount" className="form-label fw-semibold">
                                            <i className="ri-women-line me-1 text-danger"></i>
                                            {t('birth.form.femaleLive', { defaultValue: 'Hembras vivas' })}
                                        </Label>
                                        <Input
                                            type="number"
                                            id="femaleCount"
                                            name="femaleCount"
                                            value={femaleCount}
                                            onChange={(e) => setFemaleCount(Number(e.target.value))}
                                            onFocus={() => {
                                                if (femaleCount === 0) setFemaleCount("");
                                            }}
                                            onBlur={() => {
                                                if (femaleCount === "") setFemaleCount(0);
                                            }}
                                            placeholder={t("common.placeholder.exNumber", { n: "5" })}
                                            min="0"
                                        />
                                    </div>

                                    <div className="w-50">
                                        <Label htmlFor="maleCount" className="form-label fw-semibold">
                                            <i className="ri-men-line me-1 text-info"></i>
                                            {t('birth.form.maleLive', { defaultValue: 'Machos vivos' })}
                                        </Label>
                                        <Input
                                            type="number"
                                            id="maleCount"
                                            name="maleCount"
                                            value={maleCount}
                                            onChange={(e) => setMaleCount(Number(e.target.value))}
                                            onFocus={() => {
                                                if (maleCount === 0) setMaleCount("");
                                            }}
                                            onBlur={() => {
                                                if (maleCount === "") setMaleCount(0);
                                            }}
                                            placeholder={t("common.placeholder.exNumber", { n: "6" })}
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-2">
                                    <div className="w-50">
                                        <Label htmlFor="stillborn" className="form-label fw-semibold">
                                            <i className="ri-close-circle-line me-1 text-secondary"></i>
                                            {t('birth.form.stillborn', { defaultValue: 'Nacidos muertos' })}
                                        </Label>
                                        <Input
                                            type="number"
                                            id="stillborn"
                                            name="stillborn"
                                            value={formik.values.stillborn}
                                            onChange={formik.handleChange}
                                            placeholder={t("common.placeholder.exNumber", { n: "0" })}
                                            min="0"
                                        />
                                    </div>

                                    <div className="w-50">
                                        <Label htmlFor="mummies" className="form-label fw-semibold">
                                            <i className="ri-skull-line me-1 text-warning"></i>
                                            {t('birth.form.mummies', { defaultValue: 'Momias' })}
                                        </Label>
                                        <Input
                                            type="number"
                                            id="mummies"
                                            name="mummies"
                                            value={formik.values.mummies}
                                            onChange={formik.handleChange}
                                            placeholder={t("common.placeholder.exNumber", { n: "0" })}
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {(Number(maleCount) + Number(femaleCount)) > 0 && (
                                    <div className="alert alert-info mt-3 mb-0">
                                        <i className="ri-information-line me-2"></i>
                                        <strong>{t('birth.form.totalLivePiglets', { count: Number(maleCount) + Number(femaleCount), defaultValue: `Total de lechones vivos: ${Number(maleCount) + Number(femaleCount)}` })}</strong>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {(Number(maleCount) + Number(femaleCount)) > 0 && (
                            <Card className="shadow-sm mb-3">
                                <CardHeader className="bg-light">
                                    <h5 className="mb-0 text-primary">{t('birth.form.cardWeightRecord', { defaultValue: 'Registro de Peso' })}</h5>
                                </CardHeader>
                                <CardBody>
                                    <div className="form-check form-switch mb-3">
                                        <Input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="useIndividualWeight"
                                            checked={useIndividualWeight}
                                            onChange={(e) => setUseIndividualWeight(e.target.checked)}
                                        />
                                        <Label className="form-check-label fw-semibold" htmlFor="useIndividualWeight">
                                            {t('birth.form.switchIndividualWeight', { defaultValue: 'Ingresar peso individual por lechón' })}
                                        </Label>
                                    </div>

                                    {!useIndividualWeight ? (
                                        <div>
                                            <Label htmlFor="totalLitterWeight" className="form-label fw-semibold">
                                                <i className="ri-scales-3-line me-1 text-success"></i>
                                                {t('birth.form.litterWeight', { defaultValue: 'Peso total de la camada (kg)' })}
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                id="totalLitterWeight"
                                                name="totalLitterWeight"
                                                value={totalLitterWeight}
                                                onChange={(e) => setTotalLitterWeight(e.target.value === '' ? '' : Number(e.target.value))}
                                                onFocus={() => {
                                                    if (totalLitterWeight === 0) setTotalLitterWeight("");
                                                }}
                                                onBlur={() => {
                                                    if (totalLitterWeight === "") setTotalLitterWeight(0);
                                                }}
                                                placeholder={t("common.placeholder.exNumber", { n: "15.5" })}
                                                min="0"
                                            />
                                            {Number(totalLitterWeight) > 0 && (
                                                <small className="text-muted d-block mt-2">
                                                    <i className="ri-calculator-line me-1"></i>
                                                    {t('birth.form.avgWeightPerPiglet', { defaultValue: 'Peso promedio por lechón:' })} <strong>{(Number(totalLitterWeight) / pigletsArray.length).toFixed(2)} kg</strong>
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
                                                            <Badge color={piglet.sex === 'male' ? "info" : "danger"}>
                                                                {t(`common.sex.${piglet.sex}`, { defaultValue: piglet.sex === 'male' ? '♂ Macho' : '♀ Hembra' })}
                                                            </Badge>
                                                        </div>

                                                        <div>
                                                            <label className="form-label">{t('birth.form.weightKg', { defaultValue: 'Peso (kg)' })}</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="form-control"
                                                                value={pigletsArray[index].weight}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const newArray = [...pigletsArray];

                                                                    if (value === '') {
                                                                        newArray[index].weight = '';
                                                                    } else {
                                                                        newArray[index].weight = Number(value);
                                                                    }

                                                                    setPigletsArray(newArray);
                                                                }}
                                                                onFocus={() => {
                                                                    const newArray = [...pigletsArray];
                                                                    if (newArray[index].weight === 0) {
                                                                        newArray[index].weight = '';
                                                                        setPigletsArray(newArray);
                                                                    }
                                                                }}
                                                                onBlur={() => {
                                                                    const newArray = [...pigletsArray];
                                                                    if (newArray[index].weight === '') {
                                                                        newArray[index].weight = 0;
                                                                        setPigletsArray(newArray);
                                                                    }
                                                                }}
                                                                placeholder={t("common.placeholder.exNumber", { n: "1.2" })}
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </SimpleBar>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        )}

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t('common.button.back', { defaultValue: 'Volver' })}
                            </Button>

                            <Button className="ms-auto" onClick={() => checkLitterData()}>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>

                        <AlertMessage color={"danger"} message={t('birth.form.alertMinPiglet', { defaultValue: 'Debe registrar al menos 1 lechón vivo' })} visible={alerts.litterEmpty} onClose={() => toggleAlerts('litterEmpty')} autoClose={3000} absolutePosition={false} />
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={4}>
                        <div className="d-flex gap-3">
                            <Card className="w-100">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">{t('birth.form.cardSumBirthInfo', { defaultValue: 'Información del parto' })}</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    <ObjectDetails attributes={BirthAttributes} object={formik.values} />
                                </CardBody>
                            </Card>

                            <Card className="w-100">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">{t('birth.form.cardSumSowInfo', { defaultValue: 'Información de la cerda' })}</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    <ObjectDetails attributes={sowAttributes} object={sowDetails} />
                                </CardBody>
                            </Card>
                        </div>

                        <Card className="w-100 mt-3">
                            <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                <span className="text-black">{t('birth.form.cardSumLitter', { defaultValue: 'Resumen de la Camada' })}</span>
                            </CardHeader>
                            <CardBody>
                                <div className="row g-3">
                                    <div className="col-md-3">
                                        <div className="border rounded p-3 text-center bg-light">
                                            <div className="d-flex align-items-center justify-content-center mb-2">
                                                <i className="ri-parent-line fs-4 text-primary me-2"></i>
                                                <h6 className="mb-0 text-muted">{t('birth.form.summaryTotalAlive', { defaultValue: 'Total Vivos' })}</h6>
                                            </div>
                                            <h3 className="mb-0 text-primary fw-bold">{Number(maleCount) + Number(femaleCount)}</h3>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded p-3 text-center bg-light">
                                            <div className="d-flex align-items-center justify-content-center mb-2">
                                                <i className="ri-men-line fs-4 text-info me-2"></i>
                                                <h6 className="mb-0 text-muted">{t('birth.form.summaryMales', { defaultValue: 'Machos' })}</h6>
                                            </div>
                                            <h3 className="mb-0 text-info fw-bold">{maleCount}</h3>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded p-3 text-center bg-light">
                                            <div className="d-flex align-items-center justify-content-center mb-2">
                                                <i className="ri-women-line fs-4 text-danger me-2"></i>
                                                <h6 className="mb-0 text-muted">{t('birth.form.summaryFemales', { defaultValue: 'Hembras' })}</h6>
                                            </div>
                                            <h3 className="mb-0 text-danger fw-bold">{femaleCount}</h3>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded p-3 text-center bg-light">
                                            <div className="d-flex align-items-center justify-content-center mb-2">
                                                <i className="ri-scales-3-line fs-4 text-success me-2"></i>
                                                <h6 className="mb-0 text-muted">{t('birth.form.summaryAvgWeight', { defaultValue: 'Peso Promedio' })}</h6>
                                            </div>
                                            <h3 className="mb-0 text-success fw-bold">
                                                {pigletsArray.length > 0
                                                    ? (pigletsArray.reduce((acc, p) => Number(acc) + Number(p.weight), 0) / pigletsArray.length).toFixed(2)
                                                    : '0.00'
                                                } kg
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-3 mt-2">
                                    <div className="col-md-4">
                                        <div className="border rounded p-3 text-center">
                                            <div className="d-flex align-items-center justify-content-center mb-2">
                                                <i className="ri-close-circle-line fs-5 text-secondary me-2"></i>
                                                <span className="text-muted">{t('birth.form.summaryStillborn', { defaultValue: 'Nacidos Muertos' })}</span>
                                            </div>
                                            <h4 className="mb-0 fw-bold">{formik.values.stillborn}</h4>
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="border rounded p-3 text-center">
                                            <div className="d-flex align-items-center justify-content-center mb-2">
                                                <i className="ri-skull-line fs-5 text-warning me-2"></i>
                                                <span className="text-muted">{t('birth.form.summaryMummies', { defaultValue: 'Momias' })}</span>
                                            </div>
                                            <h4 className="mb-0 fw-bold">{formik.values.mummies}</h4>
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="border rounded p-3 text-center">
                                            <div className="d-flex align-items-center justify-content-center mb-2">
                                                <i className="ri-calculator-line fs-5 text-primary me-2"></i>
                                                <span className="text-muted">{t('birth.form.summaryTotalWeight', { defaultValue: 'Peso Total' })}</span>
                                            </div>
                                            <h4 className="mb-0 fw-bold">
                                                {pigletsArray.reduce((acc, p) => Number(acc) + Number(p.weight), 0).toFixed(2)} kg
                                            </h4>
                                        </div>
                                    </div>
                                </div>

                                {pigletsArray.length > 0 && (
                                    <div className="mt-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <small className="text-muted fw-semibold">{t('birth.form.weightDistribution', { defaultValue: 'Distribución de pesos:' })}</small>
                                            <small className="text-muted">{t('birth.form.litterRegistered', { count: pigletsArray.length, defaultValue: `${pigletsArray.length} lechones registrados` })}</small>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {pigletsArray.map((piglet, index) => (
                                                <div key={index} className="badge bg-light text-dark border" style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}>
                                                    <span className={piglet.sex === 'male' ? 'text-info' : 'text-danger'}>
                                                        {piglet.sex === 'male' ? '♂' : '♀'}
                                                    </span>
                                                    {' '}{Number(piglet.weight).toFixed(2)}kg
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>


                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t('common.button.back', { defaultValue: 'Volver' })}
                            </Button>

                            <Button className="ms-auto btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <div>
                                        <Spinner size='sm' />
                                    </div>
                                ) : (
                                    <div>
                                        <i className="ri-check-line me-2" />
                                        {t('birth.form.register', { defaultValue: 'Registrar' })}
                                    </div>
                                )}

                            </Button>
                        </div>
                    </TabPane>
                </TabContent>

            </form >

            <Modal isOpen={modals.sowDetails} toggle={() => toggleModal('sowDetails')} size="lg" centered className="border-0" fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('sowDetails')} className="border-0 pb-0">
                    <h4 className="modal-title text-primary fw-bold">{t('birth.form.modalExtractionTitle', { defaultValue: 'Detalles de la extracción' })}</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    <PigDetailsModal pigId={selectedSow} showAllDetailsButton={false} />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={successModalOpen} onClose={onSave} message={t('birth.form.success', { defaultValue: 'Parto registrado con éxito' })} />
            <ErrorModal isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} message={t('birth.form.error', { defaultValue: 'Ha ocurrido un error al registrar el parto, intentelo mas tarde' })} />
        </>
    )
}

export default BirthForm
