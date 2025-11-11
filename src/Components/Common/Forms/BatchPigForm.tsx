import { ConfigContext } from "App";
import { PigData } from "common/data_interfaces";
import { getLoggedinUser } from "helpers/api_helper";
import React, { useContext, useEffect, useState } from "react";
import DatePicker from "react-flatpickr";
import { Alert, Button, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane, FormFeedback, Badge, Card, CardHeader, CardBody, } from "reactstrap";
import * as Yup from 'yup';
import classnames from "classnames";
import SimpleBar from "simplebar-react";
import { FiAlertCircle } from "react-icons/fi";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { FaMars, FaVenus } from "react-icons/fa";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";


interface BatchPigFormProps {
    onSave: () => void;
    onCancel: () => void;
}

const BatchPigForm: React.FC<BatchPigFormProps> = ({ onSave, onCancel }) => {

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ success: false, error: false });
    const [activeStep, setActiveStep] = useState<number>(1);
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
    const [pigsBatch, setPigsBatch] = useState<PigData[]>([]);
    const [pigsBatchLength, setPigsBatchLength] = useState<number>(0);
    const [pigsErrors, setPigsErrors] = useState<Record<number, any>>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const pigColumns: Column<any>[] = [
        { header: 'Raza', accessor: 'breed', type: 'text' },
        { header: 'Fecha de N.', accessor: 'birthdate', type: 'date' },
        {
            header: 'Sexo',
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'macho' ? "info" : "danger"}>
                    {value === 'macho' ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
        { header: 'Peso actual', accessor: 'weight', type: 'number' },
    ]

    const pigSchema = Yup.object().shape({
        birthdate: Yup.date()
            .typeError("Fecha inválida")
            .required("La fecha de nacimiento es obligatoria"),

        breed: Yup.string()
            .required("La raza es obligatoria"),

        currentStage: Yup.string()
            .oneOf(
                ["lechón", "destete", "engorda", "reproductor"],
                "Selecciona una etapa válida"
            )
            .required("La etapa es obligatoria"),

        sex: Yup.string()
            .oneOf(
                ["macho", "hembra"],
                "Selecciona un sexo válido"
            )
            .required("El sexo es obligatorio"),

        weight: Yup.number()
            .typeError("El peso debe ser un número válido")
            .min(0.01, "El peso debe ser mayor a 0")
            .required("El peso es obligatorio"),

        observations: Yup.string().optional(),
    });

    const pigsBatchSchema = Yup.array().of(pigSchema);

    const isBatchInfoComplete = () => {
        if (!sharedBatchAttributes?.origin) return false;
        if (pigsBatchLength <= 0) return false;

        if (sharedBatchAttributes.origin === "otro" && !sharedBatchAttributes.originDetail) return false;
        if (sharedBatchAttributes.origin !== "nacido" && !sharedBatchAttributes.arrivalDate) return false;

        if (
            (sharedBatchAttributes.origin === "comprado" ||
                sharedBatchAttributes.origin === "donado") &&
            !sharedBatchAttributes.sourceFarm
        ) return false;

        return true;
    };

    const handleCreatePigBatch = async () => {
        if (!configContext) return;
        try {
            setIsSubmitting(true)
            const pigBatchResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/pig/create_pig_batch`, pigsBatch);

            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Registro de cerdos por lote`
            });

            toggleModal('success')
        } catch (error) {
            console.error('Error creating pig batch:', { error });
            toggleModal('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        if (isBatchInfoComplete()) {
            const pigs: PigData[] = Array.from({ length: Number(pigsBatchLength) }, () => ({
                _id: '',
                code: '',
                farmId: userLogged.farm_assigned,
                birthdate: new Date(),
                breed: '',
                origin: sharedBatchAttributes.origin,
                originDetail: sharedBatchAttributes.originDetail,
                sourceFarm: sharedBatchAttributes.sourceFarm,
                arrivalDate: sharedBatchAttributes.arrivalDate,
                status: 'vivo',
                currentStage: 'lechón',
                sex: '',
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
    }, [pigsBatchLength, sharedBatchAttributes]);


    const validatePigsBatch = async () => {
        try {
            await pigsBatchSchema.validate(pigsBatch, { abortEarly: false });
            setPigsErrors({});
            return true;

        } catch (err: any) {
            if (err.inner) {
                const formattedErrors: Record<number, any> = {};

                err.inner.forEach((validationError: any) => {
                    const index = validationError.path.match(/\[(\d+)\]/)?.[1];
                    if (index === undefined) return;

                    if (!formattedErrors[index]) formattedErrors[index] = {};
                    const field = validationError.path.split(".").pop();
                    formattedErrors[index][field] = validationError.message;
                });

                setPigsErrors(formattedErrors);
            }
            return false;
        }
    };

    return (
        <>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            href="#"
                            className={classnames({ active: activeStep === 1 })}
                        >
                            Datos de cerdos
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href="#"
                            className={classnames({ active: activeStep === 2 })}
                        >
                            Resumen
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>


            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    <>
                        {/* CONTENEDOR GENERAL */}
                        <div className="border rounded p-3 shadow-sm bg-light mb-3">

                            {/* CABECERA CON BADGE DEL ORIGEN */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0 fw-bold">Información del lote</h5>

                                <span className="badge bg-info text-dark px-3 py-2 fs-6">
                                    {sharedBatchAttributes.origin === "nacido" && "Nacidos en granja"}
                                    {sharedBatchAttributes.origin === "comprado" && "Comprados"}
                                    {sharedBatchAttributes.origin === "donado" && "Donados"}
                                    {sharedBatchAttributes.origin === "otro" && "Otro origen"}
                                </span>
                            </div>

                            {/* INPUTS DEL LOTE */}
                            <div className="d-flex gap-3">
                                <div className="w-50">
                                    <Label className="form-label fw-semibold">Número de cerdos</Label>
                                    <Input
                                        type="number"
                                        value={pigsBatchLength}
                                        onChange={(e) => setPigsBatchLength(Number(e.target.value))}
                                        className="shadow-sm"
                                    />
                                </div>

                                <div className="w-50">
                                    <Label className="form-label fw-semibold">Origen</Label>
                                    <Input
                                        type="select"
                                        className="shadow-sm"
                                        value={sharedBatchAttributes.origin}
                                        onChange={(e) =>
                                            setSharedBatchAttributes(p => ({ ...p, origin: e.target.value as any }))
                                        }
                                    >
                                        <option value="nacido">Nacido en la granja</option>
                                        <option value="comprado">Comprado</option>
                                        <option value="donado">Donado</option>
                                        <option value="otro">Otro</option>
                                    </Input>
                                </div>
                            </div>

                            {/* CAMPOS CONDICIONALES */}
                            <div className="d-flex gap-2">
                                {sharedBatchAttributes.origin === 'otro' && (
                                    <div className="mt-4 w-50">
                                        <Label className="form-label fw-semibold">Detalle del origen</Label>
                                        <Input
                                            className="shadow-sm"
                                            value={sharedBatchAttributes.originDetail}
                                            onChange={(e) =>
                                                setSharedBatchAttributes(p => ({ ...p, originDetail: e.target.value }))
                                            }
                                        />
                                    </div>
                                )}

                                {sharedBatchAttributes.origin !== 'nacido' && (
                                    <div className="mt-4 w-50">
                                        <Label className="form-label fw-semibold">Fecha de llegada</Label>
                                        <DatePicker
                                            className="form-control shadow-sm"
                                            value={sharedBatchAttributes.arrivalDate ?? undefined}
                                            onChange={(value: Date[]) => {
                                                if (value[0]) setSharedBatchAttributes(p => ({ ...p, arrivalDate: value[0] }));
                                            }}
                                            options={{ dateFormat: 'd/m/Y' }}
                                        />
                                    </div>
                                )}

                                {(sharedBatchAttributes.origin === 'comprado' ||
                                    sharedBatchAttributes.origin === 'donado') && (
                                        <div className="mt-4 w-50">
                                            <Label className="form-label fw-semibold">Granja de origen</Label>
                                            <Input
                                                className="shadow-sm"
                                                value={sharedBatchAttributes.sourceFarm}
                                                onChange={(e) =>
                                                    setSharedBatchAttributes(p => ({ ...p, sourceFarm: e.target.value }))
                                                }
                                            />
                                        </div>
                                    )}
                            </div>
                        </div>

                        {/* ESTADO DEL LOTE */}
                        {!isBatchInfoComplete() ? (
                            <div className="mt-3 p-3 border rounded text-center bg-warning-subtle">
                                <FiAlertCircle size={26} className="text-warning" />
                                <p className="mt-2 mb-0 fw-semibold">Completa la información del lote para continuar</p>
                            </div>
                        ) : (
                            pigsBatch.length > 0 && (
                                <div className="mt-3">
                                    <SimpleBar style={{ maxHeight: 400, paddingRight: 10 }}>

                                        {pigsBatch.map((pig, index) => (
                                            <div key={index} className="border rounded p-3 mb-3 shadow-sm bg-white" style={{ borderLeft: "6px solid #0d6efd" }}>

                                                <div className="d-flex justify-content-between mb-3">
                                                    <p className="fw-bold fs-5 m-0">Cerdo #{index + 1}</p>

                                                    <Badge className="" color={pig.sex === 'macho' ? "info" : pig.sex === 'hembra' ? "danger" : "secondary"}>
                                                        {pig.sex === 'macho' && (<><FaMars /> Macho</>)}
                                                        {pig.sex === 'hembra' && (<><FaVenus /> Hembra</>)}
                                                        {!pig.sex && "Sin sexo"}
                                                    </Badge>
                                                </div>

                                                {/* CAMPOS DEL CERDO */}
                                                <div className="d-flex gap-2">

                                                    {/* Birthdate */}
                                                    <div className="w-100">
                                                        <Label className="form-label fw-semibold">Fecha de nacimiento</Label>
                                                        <DatePicker
                                                            value={pig.birthdate ?? undefined}
                                                            className={`form-control shadow-sm ${pigsErrors[index]?.birthdate ? "is-invalid" : ""}`}
                                                            onChange={(date: Date[]) => {
                                                                if (date[0]) {
                                                                    const newPigs = [...pigsBatch];
                                                                    newPigs[index].birthdate = date[0];
                                                                    setPigsBatch(newPigs);
                                                                }
                                                            }}
                                                            options={{ dateFormat: 'd/m/Y' }}
                                                        />
                                                        {pigsErrors[index]?.birthdate && (
                                                            <FormFeedback>{pigsErrors[index]?.birthdate}</FormFeedback>
                                                        )}
                                                    </div>

                                                    {/* Breed */}
                                                    <div className="w-100">
                                                        <Label className="form-label fw-semibold">Raza</Label>
                                                        <Input
                                                            type="select"
                                                            className={`shadow-sm ${pigsErrors[index]?.breed ? "is-invalid" : ""}`}
                                                            value={pig.breed}
                                                            onChange={(e) => {
                                                                const newPigs = [...pigsBatch];
                                                                newPigs[index].breed = e.target.value;
                                                                setPigsBatch(newPigs);
                                                            }}
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
                                                        {pigsErrors[index]?.breed && (
                                                            <FormFeedback>{pigsErrors[index]?.breed}</FormFeedback>
                                                        )}
                                                    </div>

                                                    {/* Stage */}
                                                    <div className="w-100">
                                                        <Label className="form-label fw-semibold">Etapa actual</Label>
                                                        <Input
                                                            type="select"
                                                            className={`shadow-sm ${pigsErrors[index]?.currentStage ? "is-invalid" : ""}`}
                                                            value={pig.currentStage}
                                                            onChange={(e) => {
                                                                const newPigs = [...pigsBatch];
                                                                newPigs[index].currentStage = e.target.value as any;
                                                                setPigsBatch(newPigs);
                                                            }}
                                                        >
                                                            <option value="lechón">Lechón</option>
                                                            <option value="destete">Destete</option>
                                                            <option value="engorda">Engorda</option>
                                                            <option value="reproductor">Reproductor</option>
                                                        </Input>
                                                        {pigsErrors[index]?.currentStage && (
                                                            <FormFeedback>{pigsErrors[index]?.currentStage}</FormFeedback>
                                                        )}
                                                    </div>

                                                    {/* Sex */}
                                                    <div className="w-100">
                                                        <Label className="form-label fw-semibold">Sexo</Label>
                                                        <Input
                                                            type="select"
                                                            className={`shadow-sm ${pigsErrors[index]?.sex ? "is-invalid" : ""}`}
                                                            value={pig.sex}
                                                            onChange={(e) => {
                                                                const newPigs = [...pigsBatch];
                                                                newPigs[index].sex = e.target.value as any;
                                                                setPigsBatch(newPigs);
                                                            }}
                                                        >
                                                            <option value="">Seleccionar</option>
                                                            <option value="macho">Macho</option>
                                                            <option value="hembra">Hembra</option>
                                                        </Input>
                                                        {pigsErrors[index]?.sex && (
                                                            <FormFeedback>{pigsErrors[index]?.sex}</FormFeedback>
                                                        )}
                                                    </div>

                                                    {/* Weight */}
                                                    <div className="w-100">
                                                        <Label className="form-label fw-semibold">Peso (kg)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className={`shadow-sm ${pigsErrors[index]?.weight ? "is-invalid" : ""}`}
                                                            value={pig.weight}
                                                            onChange={(e) => {
                                                                const newPigs = [...pigsBatch];
                                                                newPigs[index].weight = parseFloat(e.target.value) || 0;
                                                                setPigsBatch(newPigs);
                                                            }}
                                                        />
                                                        {pigsErrors[index]?.weight && (
                                                            <FormFeedback>{pigsErrors[index]?.weight}</FormFeedback>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>
                                        ))}

                                    </SimpleBar>
                                </div>
                            )
                        )}

                        {alertConfig.visible && (
                            <Alert color={alertConfig.color} className="mt-3 shadow-sm">
                                {alertConfig.message}
                            </Alert>
                        )}

                        <div className="mt-4 d-flex">
                            <Button className="ms-auto px-4 py-2 fs-6 shadow-sm" onClick={async () => {
                                if (!isBatchInfoComplete()) return;

                                const valid = await validatePigsBatch();
                                if (!valid) {
                                    setAlertConfig({
                                        visible: true,
                                        color: "danger",
                                        message: "Corrige los datos marcados antes de continuar.",
                                    });
                                    return;
                                }

                                setAlertConfig({ visible: false, color: "", message: "" });
                                setActiveStep(2);
                            }}
                            >
                                Siguiente
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>
                    </>
                </TabPane>

                <TabPane tabId={2}>
                    <div className="d-flex gap-3">

                        <Card className="w-25 shadow-sm">
                            <CardHeader>
                                <h5 className="m-0">Datos compartidos</h5>
                            </CardHeader>

                            <CardBody className="d-flex flex-column gap-3">
                                <div>
                                    <span className="text-muted d-block">Número de cerdos</span>
                                    <span className="fw-bold fs-5">{pigsBatchLength}</span>
                                </div>

                                <div>
                                    <span className="text-muted d-block">Origen</span>
                                    <Badge
                                        color={
                                            sharedBatchAttributes.origin === "nacido"
                                                ? "success"
                                                : sharedBatchAttributes.origin === "comprado"
                                                    ? "info"
                                                    : sharedBatchAttributes.origin === "donado"
                                                        ? "primary"
                                                        : "secondary"
                                        }
                                        className="px-3 py-2"
                                    >
                                        {sharedBatchAttributes.origin === "nacido" && "Nacido en la granja"}
                                        {sharedBatchAttributes.origin === "comprado" && "Comprado"}
                                        {sharedBatchAttributes.origin === "donado" && "Donado"}
                                        {sharedBatchAttributes.origin === "otro" && "Otro origen"}
                                    </Badge>
                                </div>

                                {sharedBatchAttributes.origin === "otro" && (
                                    <div>
                                        <span className="text-muted d-block">Detalle del origen</span>
                                        <span className="fw-semibold">{sharedBatchAttributes.originDetail || "-"}</span>
                                    </div>
                                )}

                                {/* Fecha de llegada */}
                                {sharedBatchAttributes.origin !== "nacido" && (
                                    <div>
                                        <span className="text-muted d-block">Fecha de llegada</span>
                                        <span className="fw-semibold">
                                            {sharedBatchAttributes.arrivalDate
                                                ? sharedBatchAttributes.arrivalDate.toLocaleDateString()
                                                : "-"}
                                        </span>
                                    </div>
                                )}

                                {(sharedBatchAttributes.origin === "comprado" ||
                                    sharedBatchAttributes.origin === "donado") && (
                                        <div>
                                            <span className="text-muted d-block">Granja de origen</span>
                                            <span className="fw-semibold">{sharedBatchAttributes.sourceFarm || "-"}</span>
                                        </div>
                                    )}

                            </CardBody>
                        </Card>

                        <Card className="w-100 shadow-sm">
                            <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                <span className="text-black">Información de los cerdos</span>
                            </CardHeader>

                            <CardBody className="flex-fill p-0">
                                <SimpleBar style={{ maxHeight: 400 }}>
                                    <CustomTable
                                        columns={pigColumns}
                                        data={pigsBatch}
                                        showPagination={false}
                                        showSearchAndFilter={false}
                                    />
                                </SimpleBar>
                            </CardBody>
                        </Card>

                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => setActiveStep(1)}>
                            <i className="ri-arrow-left-line me-2" />
                            Atrás
                        </Button>

                        <Button className="ms-auto btn-success" onClick={() => handleCreatePigBatch()} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Spinner size="sm" />
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

            <SuccessModal isOpen={modals.success} onClose={onSave} message={"Datos registrados con éxito"} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={"Ocurrió un error. Inténtalo más tarde."} />
        </>
    );
};

export default BatchPigForm;