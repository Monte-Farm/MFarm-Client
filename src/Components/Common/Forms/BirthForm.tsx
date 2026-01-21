import { ConfigContext } from "App"
import { Column } from "common/data/data_types"
import { useFormik } from "formik"

import { useContext, useEffect, useState } from "react"
import { Button, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Alert, Modal, ModalHeader, ModalBody, Label, Input, FormFeedback, Spinner, Card, CardHeader, CardBody } from "reactstrap"
import * as Yup from 'yup';
import classnames from "classnames";
import { getLoggedinUser } from "helpers/api_helper"
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

interface BirthFormProps {
    pregnancy?: any
    onSave: () => void
    onCancel: () => void
}

const BirthForm: React.FC<BirthFormProps> = ({ pregnancy, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser()
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
            header: 'Cerda',
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
        { header: 'Fecha de inseminación', accessor: 'start_date', type: 'date', isFilterable: true },
        { header: 'Fecha estimada de parto', accessor: 'estimated_farrowing_date', type: 'date', isFilterable: true },
    ]

    const BirthAttributes: Attribute[] = [
        { key: 'birth_date', label: 'Fecha de parto', type: 'date' },
        {
            key: 'birth_type',
            label: 'Tipo de parto',
            type: 'text',
            render: (value: string) => {
                let color = '';
                let label = '';

                switch (value) {
                    case 'normal':
                        color = 'success';
                        label = 'Normal';
                        break;
                    case 'cesarean':
                        color = 'primary';
                        label = 'Cesárea';
                        break;
                    case 'abortive':
                        color = 'danger';
                        label = 'Abortivo';
                        break;
                    case 'dystocia':
                        color = 'warning';
                        label = 'Distócico';
                        break;
                    case 'induced':
                        color = 'info';
                        label = 'Inducido';
                        break;
                    default:
                        color = 'secondary';
                        label = 'Sin especificar';
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'assisted',
            label: 'Asistido',
            type: 'boolean',
            render: (_, obj) => (
                <Badge color={obj.assisted ? 'success' : 'warning'}>{obj.assisted ? 'Si' : 'No'}</Badge>
            )
        },
        { key: 'observations', label: 'Observaciones', type: 'text' },
        {
            key: 'responsible',
            label: 'Responsable',
            type: 'text',
            render: (_, obj) => (
                <span className="text-black">{userLogged.name} {userLogged.lastname}</span>
            )
        },
        { key: 'stillborn', label: 'Nacidos muertos', type: 'text' },
        { key: 'mummies', label: 'Momias', type: 'text' },

    ]

    const sowAttributes: Attribute[] = [
        { key: "code", label: "Código", type: "text" },
        { key: "birthdate", label: "Fecha de nacimiento", type: "date" },
        { key: "breed", label: "Raza", type: "text" },
        { key: "origin", label: "Origen", type: "text" },
        { key: "weight", label: "Peso actual", type: "text" },
    ]

    const pigletsColumns: Column<any>[] = [
        {
            header: 'Lechón',
            accessor: '',
            type: 'text',
            render: (_, row,) => <span className="text-black">Lechón #{pigletsArray.indexOf(row) + 1}</span>
        },
        {
            header: 'Sexo',
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
        { header: 'Peso', accessor: 'weight', type: 'text' },
    ]

    const validationSchema = Yup.object({
        birth_date: Yup.date().required('Por favor ingrese la fecha del parto'),
        birth_type: Yup.string().required('Por favor, seleccione el tipo de parto'),
        responsible: Yup.string().required('Por favor, seleccione al responsable del parto'),
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
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Parto de la cerda ${values.sow} registrado`
                });

                setSuccessModalOpen(true)
            } catch (error) {
                console.error('An error has ocurred', { error })
                setErrorModalOpen(true)
            } finally {
                setSubmitting(false)
            }
        }
    })

    const checkInseminationSelected = () => {
        toggleAlerts('inseminationEmpty', false)

        if (formik.values.pregnancy === "" || formik.values.sow === "") {
            toggleAlerts('inseminationEmpty')
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
            console.error(`Error fetching data: ${error}`)
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
            console.error('Error fetching sow details', error);
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
                                    Selección inseminación
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
                                Información del parto
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
                                Camada
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
                                Resumen
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-inseminationSelect-tab" tabId={1}>
                        <SelectableTable data={upcomingBirths} columns={upcomingBirthsColumns} selectionMode="single" showPagination={true} rowsPerPage={10} onSelect={(rows) => { formik.setFieldValue('sow', rows[0]?.sow?._id); formik.setFieldValue('pregnancy', rows[0]?._id); setSelectedPregnancy(rows[0]) }} />

                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkInseminationSelected()}>
                                Siguiente
                                <i className="ri-arrow-right-line" />
                            </Button>
                        </div>
                        {alerts.inseminationEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">Por favor, seleccione un embarazo</span>

                                <Button close onClick={() => toggleAlerts('inseminationEmpty', false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-birthinfo-tab" tabId={2}>
                        <div className="mt-4 w-100">
                            <Label htmlFor="date" className="form-label">Fecha de parto</Label>
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
                                <Label htmlFor="birth_type" className="form-label">Tipo de parto</Label>
                                <Input
                                    type="select"
                                    id="birth_type"
                                    name="birth_type"
                                    value={formik.values.birth_type}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.birth_type && !!formik.errors.birth_type}
                                >
                                    <option value="">Seleccione un tipo</option>
                                    <option value="normal">Normal</option>
                                    <option value="cesarean">Cesárea</option>
                                    <option value="abortive">Abortivo</option>
                                    <option value="dystocia">Distócico</option>
                                    <option value="induced">Inducido</option>
                                </Input>
                                {formik.touched.birth_type && formik.errors.birth_type && (
                                    <FormFeedback>{formik.errors.birth_type}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-50">
                                <Label htmlFor="assisted" className="form-label">Parto asistido</Label>
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
                                    <option value="">Seleccione una opción</option>
                                    <option value="true">Sí</option>
                                    <option value="false">No</option>
                                </Input>
                                {formik.touched.assisted && formik.errors.assisted && (
                                    <FormFeedback>{formik.errors.assisted}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="observations" className="form-label">Observaciones</Label>
                            <Input
                                type="textarea"
                                id="observations"
                                name="observations"
                                value={formik.values.observations}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.observations && !!formik.errors.observations}
                                placeholder="Ej: Parto normal"
                            />
                            {formik.touched.observations && formik.errors.observations && (
                                <FormFeedback>{formik.errors.observations}</FormFeedback>
                            )}
                        </div>


                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atras
                            </Button>

                            <Button className="ms-auto" onClick={() => checkBirthData()}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>

                        {alerts.birthDataEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">Por favor, llene todos los datos requeridos</span>
                                <Button close onClick={() => toggleAlerts('birthDataEmpty')} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-litter-tab" tabId={3}>
                        <div className="d-flex gap-2 mb-4">
                            <div className="w-50">
                                <Label htmlFor="femaleCount" className="form-label">Hembras vivas</Label>
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
                                    placeholder="Ej: 0"
                                />
                            </div>

                            <div className="w-50">
                                <Label htmlFor="maleCount" className="form-label">Machos vivos</Label>
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
                                    placeholder="Ej: 0"
                                />
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <div className="w-50">
                                <Label htmlFor="stillborn" className="form-label">Nacidos muertos</Label>
                                <Input
                                    type="number"
                                    id="stillborn"
                                    name="stillborn"
                                    value={formik.values.stillborn}
                                    onChange={formik.handleChange}
                                    placeholder="Ej: 0"
                                />
                            </div>

                            <div className="w-50">
                                <Label htmlFor="mummies" className="form-label">Momias</Label>
                                <Input
                                    type="number"
                                    id="mummies"
                                    name="mummies"
                                    value={formik.values.mummies}
                                    onChange={formik.handleChange}
                                    placeholder="Ej: 0"
                                />
                            </div>
                        </div>

                        <div className="mt-3">
                            <SimpleBar style={{ maxHeight: 400, paddingRight: 10 }}>
                                {pigletsArray.map((piglet, index) => (
                                    <div key={index} className="border rounded p-3 mb-2">
                                        <p className="fw-bold">Lechón #{index + 1}</p>

                                        <div className="d-flex gap-3">
                                            <div className="w-50">
                                                <label className="form-label">Sexo</label>
                                                <select
                                                    className="form-select"
                                                    value={piglet.sex}
                                                    onChange={(e) => {
                                                        const newArray = [...pigletsArray];
                                                        newArray[index].sex = e.target.value as 'male' | 'female';
                                                        setPigletsArray(newArray);
                                                    }}
                                                    disabled
                                                >
                                                    <option value="">Seleccionar</option>
                                                    <option value="male">Macho</option>
                                                    <option value="female">Hembra</option>
                                                </select>
                                            </div>

                                            <div className="w-50">
                                                <label className="form-label">Peso (kg)</label>
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
                                                />

                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </SimpleBar>
                        </div>


                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atrás
                            </Button>

                            <Button className="ms-auto" onClick={() => checkLitterData()}>
                                Siguiente
                                < i className="ri-arrow-right-line ms-2" />
                            </Button>

                        </div>

                        <AlertMessage color={"danger"} message={"Debe registrar al menos 1 lechon"} visible={alerts.litterEmpty} onClose={() => toggleAlerts('litterEmpty')} autoClose={3000} absolutePosition={false} />
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={4}>
                        <div className="d-flex gap-3">
                            <Card className="w-100">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">Información del parto</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    <ObjectDetails attributes={BirthAttributes} object={formik.values} />
                                </CardBody>
                            </Card>

                            <Card className="w-100">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">Información de la cerda</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    <ObjectDetails attributes={sowAttributes} object={sowDetails} />
                                </CardBody>
                            </Card>
                        </div>

                        <div className="d-flex gap-2">
                            <Card className="w-100">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">Información de la camada</span>
                                </CardHeader>
                                <CardBody className='flex-fill p-0'>
                                    <SimpleBar style={{ maxHeight: 300 }}>
                                        <CustomTable
                                            columns={pigletsColumns}
                                            data={pigletsArray}
                                            showPagination={false}
                                            showSearchAndFilter={false}
                                        />
                                    </SimpleBar>
                                </CardBody>
                            </Card>
                        </div>


                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atrás
                            </Button>

                            <Button className="ms-auto btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <div>
                                        <Spinner size='sm' />
                                    </div>
                                ) : (
                                    <div>
                                        <i className="ri-check-line me-2" />
                                        Registrar
                                    </div>
                                )}

                            </Button>
                        </div>
                    </TabPane>
                </TabContent>

            </form >

            <Modal isOpen={modals.sowDetails} toggle={() => toggleModal('sowDetails')} size="lg" centered className="border-0">
                <ModalHeader toggle={() => toggleModal('sowDetails')} className="border-0 pb-0">
                    <h4 className="modal-title text-primary fw-bold">Detalles de la extracción</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    <PigDetailsModal pigId={selectedSow} showAllDetailsButton={false} />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={successModalOpen} onClose={onSave} message={"Parto registrado con éxito"} />
            <ErrorModal isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} message={"Ha ocurrido un error al registrar el parto, intentelo mas tarde"} />
        </>
    )
}

export default BirthForm