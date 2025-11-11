import { ConfigContext } from "App";
import { HttpStatusCode } from "axios";
import { PigData, PigMedicationEntry } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import React, { useContext, useEffect, useState } from "react";
import DatePicker from "react-flatpickr";
import { Alert, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import * as Yup from 'yup';
import classnames from "classnames";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { FaKeyboard, FaListUl } from "react-icons/fa";
import { create } from "lodash";
import ObjectDetails from "../Details/ObjectDetails";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import SimpleBar from "simplebar-react";
import { FiAlertCircle } from "react-icons/fi";


interface PigFormProps {
    onSave: () => void;
    onCancel: () => void;
}

const PigForm: React.FC<PigFormProps> = ({ onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ success: false, error: false })
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [createMode, setCreateMode] = useState<'batch' | 'single' | null>(null);
    const [singlePig, setSinglePig] = useState<PigData>({
        _id: '',
        code: '',
        farmId: userLogged.farm_assigned,
        birthdate: new Date(),
        breed: '',
        origin: 'nacido', //
        originDetail: '', //
        sourceFarm: '', //
        arrivalDate: null, //
        status: 'vivo',
        currentStage: 'lechón',
        sex: '',
        weight: 1,
        observations: '',
        historyChanges: [],
        discarded: false,
        feedings: [],
        medications: [],
        reproduction: [],
    });
    const [sharedBatchAttributes, setSharedBatchAttributes] = useState<{
        origin: 'nacido' | 'comprado' | 'donado' | 'otro';
        originDetail?: string;
        sourceFarm?: string;
        arrivalDate?: Date | null;
    }>({
        origin: 'nacido',
        originDetail: '',
        sourceFarm: '',
        arrivalDate: null,
    })
    const [pigsBatch, setPigsBatch] = useState<PigData[]>([])
    const [pigsBatchLength, setPigsBatchLength] = useState<number>(0)
    const [errors, setErrors] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

    const validationSchema = Yup.object({
        code: Yup.string()
            .required('Por favor ingrese el código del cerdo')
            .test('unique_code', 'Este codigo ya existe, por favor ingrese otro', async (value) => {
                if (!value) return false
                if (!configContext) return true
                try {
                    const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/check_code_exists/${value}`)
                    return !response.data.data
                } catch (error) {
                    console.error('Error checking farm code:', error);
                    return false;
                }
            }),
        birthdate: Yup.date()
            .max(new Date(), 'La fecha de nacimiento no puede ser futura')
            .required('Por favor ingrese la fecha de nacimiento'),
        breed: Yup.string()
            .required('Por favor seleccione la raza'),
        origin: Yup.mixed<'nacido' | 'comprado' | 'donado' | 'otro'>()
            .oneOf(['nacido', 'comprado', 'donado', 'otro'], 'Origen inválido')
            .required('Por favor seleccione el origen'),
        originDetail: Yup.string().when('origin', {
            is: 'otro',
            then: schema => schema.required('Por favor especifique el origen'),
            otherwise: schema => schema.notRequired(),
        }),
        arrivalDate: Yup.date().when('origin', {
            is: (val: string) => val !== 'nacido',
            then: schema => schema
                .max(new Date(), 'La fecha no puede ser futura')
                .required('Por favor ingrese la fecha de llegada'),
            otherwise: schema => schema.notRequired(),
        }),
        sourceFarm: Yup.string().when('origin', {
            is: (val: string) => val === 'comprado' || val === 'donado',
            then: schema => schema.required('Por favor ingrese la granja de origen'),
            otherwise: schema => schema.notRequired(),
        }),
        status: Yup.mixed<'vivo' | 'vendido' | 'sacrificado' | 'muerto' | 'descartado'>()
            .oneOf(['vivo', 'vendido', 'sacrificado', 'muerto', 'descartado'], 'Estado inválido')
            .required('Por favor seleccione el estado'),
        currentStage: Yup.mixed<'lechón' | 'destete' | 'engorda' | 'reproductor'>()
            .oneOf(['lechón', 'destete', 'engorda', 'reproductor'], 'Etapa inválida')
            .required('Por favor seleccione la etapa'),
        sex: Yup.mixed<'macho' | 'hembra'>()
            .oneOf(['macho', 'hembra'], 'Sexo inválido')
            .required('Por favor seleccione el sexo'),
        weight: Yup.number()
            .min(1, 'El peso deber ser mayor a 0')
            .max(300, 'El peso no puede ser mayor a 500')
            .required('Por favor ingrese el peso'),
        observations: Yup.string().notRequired(),
    });

    const fetchNextPigCode = async () => {
        if (!configContext) return;
        try {
            setLoading(true)
            const nextResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/get_next_pig_code`)
            const nextCode = nextResponse.data.data;
            setSinglePig({ ...singlePig, code: nextCode })
            setLoading(false)
        } catch (error) {
            console.error('Error fetching the next code', { error })
        }
    }

    const handleSavePig = async () => {
        if (!configContext) return;
        try {
            setIsSubmitting(true);
            const singlePigResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/pig/create`, singlePig)

            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Registro de cerdo ${singlePig.code}`
            });

            toggleModal('success')
        } catch (error) {
            console.error('Error saving pig', { error })
            toggleModal('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function validateSinglePig() {
        try {
            await validationSchema.validate(singlePig, { abortEarly: false });
            setErrors({});
            return true;
        } catch (err: any) {
            const formatted: any = {};
            err.inner.forEach((e: any) => {
                formatted[e.path] = e.message;
            });
            setErrors(formatted);
            return false;
        }
    }

    const isBatchInfoComplete = () => {
        if (!sharedBatchAttributes?.origin) return false;
        if (pigsBatchLength <= 0) return false;

        if (sharedBatchAttributes.origin === "otro" && !sharedBatchAttributes.originDetail) return false;
        if (sharedBatchAttributes.origin !== "nacido" && !sharedBatchAttributes.arrivalDate) return false;
        if ((sharedBatchAttributes.origin === "comprado" || sharedBatchAttributes.origin === "donado")
            && !sharedBatchAttributes.sourceFarm) return false;

        return true;
    };

    const handleCheckSinglePigData = async () => {
        const isValid = await validateSinglePig();

        if (isValid) {
            toggleArrowTab(activeStep + 1)
        } else {
            return
        }
    }


    useEffect(() => {
        if (createMode === 'batch' && isBatchInfoComplete()) {
            const pigs: PigData[] = Array.from({ length: Number(pigsBatchLength) }, () => ({
                _id: '',
                code: '',
                farmId: userLogged.farm_assigned,
                birthdate: null,
                breed: '',
                origin: 'nacido',
                originDetail: '',
                sourceFarm: '',
                arrivalDate: null,
                status: 'vivo',
                currentStage: 'lechón',
                sex: 'macho',
                weight: 0,
                observations: '',
                historyChanges: [],
                discarded: false,
                feedings: [],
                medications: [],
                reproduction: [],
            }));

            setPigsBatch(pigs);
        }
    }, [pigsBatchLength])


    useEffect(() => {
        fetchNextPigCode();
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
                            href='#'
                            id="step-pigdate-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            onClick={() => toggleArrowTab(1)}
                            aria-selected={activeStep === 1}
                            aria-controls="step-pigdate-tab"
                            disabled
                        >
                            Datos de cerdos
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
                            onClick={() => toggleArrowTab(2)}
                            aria-selected={activeStep === 2}
                            aria-controls="step-summary-tab"
                            disabled
                        >
                            Resumen
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane id="step-pigdate-tab" tabId={1}>
                    {createMode === null ? (
                        <div className="text-center py-5">
                            <h5 className="mb-4 text-muted">¿Qué tipo de registro quieres realizar?</h5>
                            <div className="d-flex justify-content-center gap-4">
                                <Button color="secondary" size="lg" className="d-flex flex-column align-items-center p-4" onClick={() => setCreateMode("single")}>
                                    <FaKeyboard size={32} className="mb-2" />
                                    <span>Registro individual</span>
                                </Button>

                                <Button color="primary" size="lg" className="d-flex flex-column align-items-center p-4" onClick={() => setCreateMode("batch")}>
                                    <FaListUl size={32} className="mb-2" />
                                    <span>Registro por lote</span>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {createMode === 'batch' ? (
                                <>
                                    <div className="d-flex gap-3">
                                        <div className="w-50">
                                            <Label htmlFor="pigsBatchLength" className="form-label">Número de cerdos</Label>
                                            <Input
                                                type="number"
                                                id="pigsBatchLength"
                                                name="pigsBatchLength"
                                                value={pigsBatchLength}
                                                onChange={(e) => setPigsBatchLength(Number(e.target.value))}
                                            />
                                        </div>

                                        <div className="w-50">
                                            <Label htmlFor="origin" className="form-label">Origen</Label>
                                            <Input
                                                type="select"
                                                id="origin"
                                                value={sharedBatchAttributes?.origin || ""}
                                                onChange={(e) => setSharedBatchAttributes(p => ({ ...p!, origin: e.target.value as any }))}
                                            >
                                                <option value="nacido">Nacido en la granja</option>
                                                <option value="comprado">Comprado</option>
                                                <option value="donado">Donado</option>
                                                <option value="otro">Otro</option>
                                            </Input>
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2">
                                        {sharedBatchAttributes?.origin === 'otro' && (
                                            <div className="mt-4 w-50">
                                                <Label htmlFor="originDetail" className="form-label">Detalle del origen</Label>
                                                <Input
                                                    type="text"
                                                    id="originDetail"
                                                    value={sharedBatchAttributes?.originDetail || ""}
                                                    onChange={(e) =>
                                                        setSharedBatchAttributes(p => ({ ...p!, originDetail: e.target.value }))
                                                    }
                                                />
                                            </div>
                                        )}

                                        {sharedBatchAttributes?.origin !== 'nacido' && (
                                            <div className="mt-4 w-50">
                                                <Label htmlFor="arrivalDate" className="form-label">Fecha de llegada</Label>
                                                <DatePicker
                                                    id="arrivalDate"
                                                    className={`form-control ${errors.arrivalDate ? 'is-invalid' : ''}`}
                                                    value={sharedBatchAttributes?.arrivalDate ?? undefined}
                                                    onChange={(value: Date[]) => {
                                                        if (value[0]) setSharedBatchAttributes(p => ({ ...p!, arrivalDate: value[0] }));
                                                    }}
                                                    options={{ dateFormat: 'd/m/Y' }}
                                                />
                                            </div>
                                        )}

                                        {(sharedBatchAttributes?.origin === 'comprado' || sharedBatchAttributes?.origin === 'donado') && (
                                            <div className="mt-4 w-50">
                                                <Label htmlFor="sourceFarm" className="form-label">Granja de origen</Label>
                                                <Input
                                                    type="text"
                                                    id="sourceFarm"
                                                    value={sharedBatchAttributes?.sourceFarm || ""}
                                                    onChange={(e) =>
                                                        setSharedBatchAttributes(p => ({ ...p!, sourceFarm: e.target.value }))
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {createMode === 'batch' && (
                                        <>
                                            {!isBatchInfoComplete() ? (
                                                <div className="mt-3 p-3 border rounded text-center text-muted">
                                                    <FiAlertCircle className="text-muted" size={22} />
                                                    <p className="mt-2 mb-0">Completa la información del lote para continuar</p>
                                                </div>
                                            ) : (
                                                pigsBatch.length > 0 && (
                                                    <div className="mt-3">
                                                        <SimpleBar style={{ maxHeight: 400, paddingRight: 10 }}>
                                                            {pigsBatch.map((pig, index) => (
                                                                <div key={index} className="border rounded p-3 mb-2">
                                                                    <p className="fw-bold">Cerdo #{index + 1}</p>

                                                                    <div className="row">
                                                                        <div className="col-md-4">
                                                                            <label className="form-label">Sexo</label>
                                                                            <select
                                                                                className="form-select"
                                                                                value={pig.sex}
                                                                                onChange={(e) => {
                                                                                    const newArray = [...pigsBatch];
                                                                                    newArray[index].sex = e.target.value as "" | 'macho' | 'hembra';
                                                                                    setPigsBatch(newArray);
                                                                                }}
                                                                            >
                                                                                <option value="">Seleccionar</option>
                                                                                <option value="macho">Macho</option>
                                                                                <option value="hembra">Hembra</option>
                                                                            </select>
                                                                        </div>

                                                                        <div className="col-md-4">
                                                                            <label className="form-label">Peso (kg)</label>
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                className="form-control"
                                                                                value={pig.weight}
                                                                                onChange={(e) => {
                                                                                    const newArray = [...pigsBatch];
                                                                                    newArray[index].weight = parseFloat(e.target.value) || 0;
                                                                                    setPigsBatch(newArray);
                                                                                }}
                                                                            />
                                                                        </div>

                                                                        <div className="col-md-4">
                                                                            <label className="form-label">Observaciones</label>
                                                                            <input
                                                                                type="text"
                                                                                className="form-control"
                                                                                value={pig.observations}
                                                                                onChange={(e) => {
                                                                                    const newArray = [...pigsBatch];
                                                                                    newArray[index].observations = e.target.value;
                                                                                    setPigsBatch(newArray);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </SimpleBar>
                                                    </div>
                                                )
                                            )}
                                        </>
                                    )}
                                </>
                            ) : createMode === 'single' ? (
                                <>
                                    <div className="d-flex gap-3">

                                        <div className="mt-4 w-50">
                                            <Label htmlFor="code" className="form-label">Código</Label>
                                            <Input
                                                type="text"
                                                id="code"
                                                value={singlePig?.code || ""}
                                                onChange={(e) =>
                                                    setSinglePig(p => ({ ...p!, code: e.target.value }))
                                                }
                                                onBlur={validateSinglePig}
                                                invalid={!!errors.code}
                                                placeholder="Ej: C001"
                                            />
                                            {errors.code && (
                                                <FormFeedback>{errors.code}</FormFeedback>
                                            )}
                                        </div>

                                        <div className="mt-4 w-50">
                                            <Label htmlFor="birthdate" className="form-label">Fecha de nacimiento</Label>
                                            <DatePicker
                                                id="birthdate"
                                                className={`form-control ${errors.birthdate ? 'is-invalid' : ''}`}
                                                value={singlePig?.birthdate ?? undefined}
                                                onChange={(value: Date[]) => {
                                                    if (value[0]) setSinglePig(p => ({ ...p!, birthdate: value[0] }));
                                                }}
                                                onClose={validateSinglePig}
                                                options={{ dateFormat: 'd/m/Y' }}
                                            />
                                            {errors.birthdate && (
                                                <FormFeedback className="d-block">{errors.birthdate}</FormFeedback>
                                            )}
                                        </div>

                                    </div>

                                    <div className="d-flex gap-3">

                                        <div className="mt-4 w-100">
                                            <Label htmlFor="breedInput" className="form-label">Raza</Label>
                                            <Input
                                                type="select"
                                                id="breedInput"
                                                value={singlePig?.breed || ""}
                                                onChange={(e) => setSinglePig(p => ({ ...p!, breed: e.target.value }))}
                                                onBlur={validateSinglePig}
                                                invalid={!!errors.breed}
                                            >
                                                <option value="">Seleccione una raza</option>
                                                <option value="Yorkshire">Yorkshire</option>
                                                <option value="Landrace">Landrace</option>
                                                <option value="Duroc">Duroc</option>
                                                <option value="Hampshire">Hampshire</option>
                                                <option value="Pietrain">Pietrain</option>
                                                <option value="Berkshire">Berkshire</option>
                                                <option value="Large White">Large White</option>
                                                <option value="Chester White">Chester White</option>
                                                <option value="Poland China">Poland China</option>
                                                <option value="Tamworth">Tamworth</option>
                                            </Input>
                                            {errors.breed && <FormFeedback>{errors.breed}</FormFeedback>}
                                        </div>

                                        <div className="mt-4 w-100">
                                            <Label htmlFor="currentStage" className="form-label">Etapa actual</Label>
                                            <Input
                                                type="select"
                                                id="currentStage"
                                                value={singlePig?.currentStage || ""}
                                                onChange={(e) => setSinglePig(p => ({ ...p, currentStage: e.target.value as PigData['currentStage'] }))}
                                                onBlur={validateSinglePig}
                                                invalid={!!errors.currentStage}
                                            >
                                                <option value="lechón">Lechón</option>
                                                <option value="destete">Destete</option>
                                                <option value="engorda">Engorda</option>
                                                <option value="reproductor">Reproductor</option>
                                            </Input>
                                            {errors.currentStage && <FormFeedback>{errors.currentStage}</FormFeedback>}
                                        </div>

                                        <div className="mt-4 w-100">
                                            <Label htmlFor="origin" className="form-label">Origen</Label>
                                            <Input
                                                type="select"
                                                id="origin"
                                                value={singlePig?.origin || ""}
                                                onChange={(e) => setSinglePig(p => ({ ...p!, origin: e.target.value as any }))}
                                                onBlur={validateSinglePig}
                                                invalid={!!errors.origin}
                                            >
                                                <option value="nacido">Nacido en la granja</option>
                                                <option value="comprado">Comprado</option>
                                                <option value="donado">Donado</option>
                                                <option value="otro">Otro</option>
                                            </Input>
                                            {errors.origin && <FormFeedback>{errors.origin}</FormFeedback>}
                                        </div>

                                    </div>

                                    {singlePig?.origin === 'otro' && (
                                        <div className="mt-4">
                                            <Label htmlFor="originDetail" className="form-label">Detalle del origen</Label>
                                            <Input
                                                type="text"
                                                id="originDetail"
                                                value={singlePig?.originDetail || ""}
                                                onChange={(e) =>
                                                    setSinglePig(p => ({ ...p!, originDetail: e.target.value }))
                                                }
                                                onBlur={validateSinglePig}
                                                invalid={!!errors.originDetail}
                                            />
                                            {errors.originDetail && (
                                                <FormFeedback>{errors.originDetail}</FormFeedback>
                                            )}
                                        </div>
                                    )}

                                    {singlePig?.origin !== 'nacido' && (
                                        <div className="mt-4">
                                            <Label htmlFor="arrivalDate" className="form-label">Fecha de llegada</Label>
                                            <DatePicker
                                                id="arrivalDate"
                                                className={`form-control ${errors.arrivalDate ? 'is-invalid' : ''}`}
                                                value={singlePig?.arrivalDate ?? undefined}
                                                onChange={(value: Date[]) => {
                                                    if (value[0]) setSinglePig(p => ({ ...p!, arrivalDate: value[0] }));
                                                }}
                                                onClose={validateSinglePig}
                                                options={{ dateFormat: 'd/m/Y' }}
                                            />
                                            {errors.arrivalDate && (
                                                <FormFeedback className="d-block">{errors.arrivalDate}</FormFeedback>
                                            )}
                                        </div>
                                    )}

                                    {(singlePig?.origin === 'comprado' || singlePig?.origin === 'donado') && (
                                        <div className="mt-4">
                                            <Label htmlFor="sourceFarm" className="form-label">Granja de origen</Label>
                                            <Input
                                                type="text"
                                                id="sourceFarm"
                                                value={singlePig?.sourceFarm || ""}
                                                onChange={(e) =>
                                                    setSinglePig(p => ({ ...p!, sourceFarm: e.target.value }))
                                                }
                                                onBlur={validateSinglePig}
                                                invalid={!!errors.sourceFarm}
                                            />
                                            {errors.sourceFarm && (
                                                <FormFeedback>{errors.sourceFarm}</FormFeedback>
                                            )}
                                        </div>
                                    )}

                                    <div className="d-flex gap-3">

                                        <div className="mt-4 w-50">
                                            <Label htmlFor="sex" className="form-label">Sexo</Label>
                                            <Input
                                                type="select"
                                                id="sex"
                                                value={singlePig?.sex || ""}
                                                onChange={(e) =>
                                                    setSinglePig(p => ({ ...p!, sex: e.target.value as any }))
                                                }
                                                onBlur={validateSinglePig}
                                                invalid={!!errors.sex}
                                            >
                                                <option value="">Seleccione un sexo</option>
                                                <option value="macho">Macho</option>
                                                <option value="hembra">Hembra</option>
                                            </Input>
                                            {errors.sex && <FormFeedback>{errors.sex}</FormFeedback>}
                                        </div>

                                        {/* Peso */}
                                        <div className="mt-4 w-50">
                                            <Label htmlFor="weight" className="form-label">Peso (kg)</Label>
                                            <Input
                                                type="number"
                                                id="weight"
                                                value={singlePig?.weight}
                                                onChange={(e) =>
                                                    setSinglePig(p => ({ ...p!, weight: Number(e.target.value) }))
                                                }
                                                onBlur={validateSinglePig}
                                                invalid={!!errors.weight}
                                            />
                                            {errors.weight && (
                                                <FormFeedback>{errors.weight}</FormFeedback>
                                            )}
                                        </div>

                                    </div>

                                    {/* Observaciones */}
                                    <div className="mt-4">
                                        <Label htmlFor="observations" className="form-label">Características físicas</Label>
                                        <Input
                                            type="textarea"
                                            id="observations"
                                            value={singlePig?.observations || ""}
                                            onChange={(e) =>
                                                setSinglePig(p => ({ ...p!, observations: e.target.value }))
                                            }
                                            placeholder="Ej: Marca de nacimiento"
                                        />
                                    </div>

                                    <div className="d-flex mt-3 justify-content-end">
                                        <Button type="button" onClick={() => handleCheckSinglePigData()}>
                                            Siguiente
                                            <i className="ri-arrow-right-line ms-2" />
                                        </Button>
                                    </div>
                                </>
                            ) : null}
                        </>
                    )}
                </TabPane>

                <TabPane id="step-summary-tab" tabId={2}>
                    <>
                        {createMode === 'single' ? (
                            <>
                                <Card>
                                    <CardHeader>
                                        <h5>Informacion del cerdo</h5>
                                    </CardHeader>
                                    <CardBody>
                                        <CardBody>
                                            <div className="row gy-3">

                                                {/* Código */}
                                                <div className="col-md-6">
                                                    <div className="pb-2 border-bottom">
                                                        <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Código</h6>
                                                        <span className="fw-semibold" style={{ fontSize: "1.15rem" }}>
                                                            {singlePig.code || '—'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Fecha de nacimiento */}
                                                <div className="col-md-6">
                                                    <div className="pb-2 border-bottom">
                                                        <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Fecha de nacimiento</h6>
                                                        <span className="fw-semibold" style={{ fontSize: "1.15rem" }}>
                                                            {singlePig.birthdate ? new Date(singlePig.birthdate).toLocaleDateString() : '—'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Raza */}
                                                <div className="col-md-6">
                                                    <div className="pb-2 border-bottom">
                                                        <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Raza</h6>
                                                        <span className="fw-semibold" style={{ fontSize: "1.15rem" }}>
                                                            {singlePig.breed || '—'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Origen */}
                                                <div className="col-md-6">
                                                    <div className="pb-2 border-bottom">
                                                        <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Origen</h6>
                                                        <span className="fw-semibold" style={{ fontSize: "1.15rem" }}>
                                                            {singlePig.origin || '—'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Detalle del origen */}
                                                {singlePig.origin === 'otro' && (
                                                    <div className="col-md-6">
                                                        <div className="pb-2 border-bottom">
                                                            <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Detalle del origen</h6>
                                                            <span className="fw-semibold" style={{ fontSize: "1.15rem" }}>
                                                                {singlePig.originDetail || '—'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Fecha de llegada */}
                                                {singlePig.origin !== 'nacido' && (
                                                    <div className="col-md-6">
                                                        <div className="pb-2 border-bottom">
                                                            <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Fecha de llegada</h6>
                                                            <span className="fw-semibold" style={{ fontSize: "1.15rem" }}>
                                                                {singlePig.arrivalDate ? new Date(singlePig.arrivalDate).toLocaleDateString() : '—'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Granja de origen */}
                                                {(singlePig.origin === 'comprado' || singlePig.origin === 'donado') && (
                                                    <div className="col-md-6">
                                                        <div className="pb-2 border-bottom">
                                                            <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Granja de origen</h6>
                                                            <span className="fw-semibold" style={{ fontSize: "1.15rem" }}>
                                                                {singlePig.sourceFarm || '—'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Estado */}
                                                <div className="col-md-6">
                                                    <div className="pb-2 border-bottom">
                                                        <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Estado</h6>

                                                        <span
                                                            className={`badge  ${singlePig.status === 'vivo' ? 'bg-success' :
                                                                singlePig.status === 'muerto' ? 'bg-dark' :
                                                                    singlePig.status === 'descartado' ? 'bg-warning text-dark' :
                                                                        singlePig.status === 'vendido' ? 'bg-primary' :
                                                                            singlePig.status === 'sacrificado' ? 'bg-danger' :
                                                                                'bg-secondary'
                                                                }`
                                                            }
                                                            style={{
                                                                fontSize: "1.05rem",
                                                                padding: "0.55rem 0.9rem",
                                                            }}
                                                        >
                                                            {singlePig.status || '—'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Etapa actual */}
                                                <div className="col-md-6">
                                                    <div className="pb-2 border-bottom">
                                                        <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Etapa actual</h6>

                                                        <span
                                                            className="badge bg-info text-dark"
                                                            style={{
                                                                fontSize: "1.05rem",
                                                                padding: "0.55rem 0.9rem",
                                                            }}
                                                        >
                                                            {singlePig.currentStage || '—'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Sexo */}
                                                <div className="col-md-6">
                                                    <div className="pb-2 border-bottom">
                                                        <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Sexo</h6>

                                                        <span
                                                            className={`badge bg-${singlePig.sex === 'macho' ? 'primary' : 'danger'}`}
                                                            style={{
                                                                fontSize: "1.05rem",
                                                                padding: "0.55rem 0.9rem",
                                                            }}
                                                        >
                                                            {singlePig.sex === 'macho' ? "♂ Macho" :
                                                                singlePig.sex === 'hembra' ? "♀ Hembra" : "—"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Peso */}
                                                <div className="col-md-6">
                                                    <div className="pb-2 border-bottom">
                                                        <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Peso (kg)</h6>
                                                        <span className="fw-semibold" style={{ fontSize: "1.15rem" }}>
                                                            {singlePig.weight || '—'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Observaciones */}
                                                <div className="col-12">
                                                    <div className="pb-2 border-bottom">
                                                        <h6 className="text-muted mb-1" style={{ fontSize: "1rem" }}>Observaciones</h6>
                                                        <span className="fw-semibold" style={{ fontSize: "1.15rem" }}>
                                                            {singlePig.observations || '—'}
                                                        </span>
                                                    </div>
                                                </div>

                                            </div>
                                        </CardBody>
                                    </CardBody>
                                </Card>
                            </>
                        ) : (
                            <>
                            </>
                        )}
                        <div className="d-flex gap-2 mt-3">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atrás
                            </Button>

                            <Button className="ms-auto" color="primary" type="submit" disabled={isSubmitting} onClick={() => handleSavePig()} >
                                {isSubmitting ? (
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
                    </>
                </TabPane>
            </TabContent>
            <SuccessModal isOpen={modals.success} onClose={onSave} message={"Datos registrados con éxito"} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={"Ha ocurrido un error al registrar los datos, intentelo mas tarde"} />
        </>
    );
};

export default PigForm;