import { ConfigContext } from "App";
import { PigData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import React, { useContext, useEffect, useState } from "react";
import DatePicker from "react-flatpickr";
import { Button, FormFeedback, Input, Label, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import * as Yup from 'yup';
import classnames from "classnames";
import LoadingAnimation from "../Shared/LoadingAnimation";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";

interface SinglePigFormProps {
    onSave: () => void;
    onCancel: () => void;
}

const SinglePigForm: React.FC<SinglePigFormProps> = ({ onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ success: false, error: false })
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);

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
        origin: Yup.mixed<'born' | 'purchased' | 'donated' | 'other'>()
            .oneOf(['born', 'purchased', 'donated', 'other'], 'Origen inválido')
            .required('Por favor seleccione el origen'),
        originDetail: Yup.string().when('origin', {
            is: 'otro',
            then: schema => schema.required('Por favor especifique el origen'),
            otherwise: schema => schema.notRequired(),
        }),
        arrivalDate: Yup.date().when('origin', {
            is: (val: string) => val !== 'born',
            then: schema => schema
                .max(new Date(), 'La fecha no puede ser futura')
                .required('Por favor ingrese la fecha de llegada'),
            otherwise: schema => schema.notRequired(),
        }),
        sourceFarm: Yup.string().when('origin', {
            is: (val: string) => val === 'purchased' || val === 'donated',
            then: schema => schema.required('Por favor ingrese la granja de origen'),
            otherwise: schema => schema.notRequired(),
        }),
        status: Yup.mixed<'alive' | 'sold' | 'slaughtered' | 'dead' | 'discarded'>()
            .oneOf(['alive', 'sold', 'slaughtered', 'dead', 'discarded'], 'Estado inválido')
            .required('Por favor seleccione el estado'),
        currentStage: Yup.mixed<'piglet' | 'weaning' | 'fattening' | 'breeder'>()
            .oneOf(['piglet', 'weaning', 'fattening', 'breeder'], 'Etapa inválida')
            .required('Por favor seleccione la etapa'),
        sex: Yup.mixed<'male' | 'female'>()
            .oneOf(['male', 'female'], 'Sexo inválido')
            .required('Por favor seleccione el sexo'),
        weight: Yup.number()
            .min(1, 'El peso deber ser mayor a 0')
            .max(300, 'El peso no puede ser mayor a 500')
            .required('Por favor ingrese el peso'),
        observations: Yup.string().notRequired(),
    });

    const formik = useFormik<PigData>({
        initialValues: {
            _id: '',
            code: '',
            farmId: '',
            breed: '',
            birthdate: null,
            origin: 'born',
            originDetail: '',
            sourceFarm: '',
            arrivalDate: null,
            status: 'alive',
            currentStage: 'piglet',
            sex: 'male',
            weight: 0,
            observations: '',
            historyChanges: [],
            feedings: [],
            medications: [],
            medicationPackagesHistory: [],
            reproduction: [],
            registered_by: userLogged._id,
            registration_date: null
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                values.farmId = userLogged.farm_assigned;

                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/pig/create`, values);
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Registro de cerdo ${values.code}`
                });
                toggleModal('success')
            } catch (error) {
                toggleModal('error')
            }
        }
    });

    const fetchNextPigCode = async () => {
        if (!configContext) return;
        try {
            setLoading(true)
            const nextResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/get_next_pig_code`)
            const nextCode = nextResponse.data.data;
            formik.setFieldValue('code', nextCode)
        } catch (error) {
            console.error('Error fetching the next code', { error })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNextPigCode();
        formik.setFieldValue('birthdate', new Date())
        formik.setFieldValue('registration_date', new Date())
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }}>
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
                                Datos de cerdo
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
                        <div className="d-flex gap-3">
                            <div className="mt-4 w-50">
                                <Label htmlFor="code" className="form-label">Código</Label>
                                <Input
                                    type="text"
                                    id="code"
                                    name="code"
                                    value={formik.values.code}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.code && !!formik.errors.code}
                                    placeholder="Ej: C001"
                                />
                                {formik.touched.code && formik.errors.code && (
                                    <FormFeedback>{formik.errors.code}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-50">
                                <Label htmlFor="birthdate" className="form-label">Fecha de nacimiento</Label>
                                <DatePicker
                                    id="birthdate"
                                    className={`form-control ${formik.touched.birthdate && formik.errors.birthdate ? 'is-invalid' : ''}`}
                                    value={formik.values.birthdate ?? undefined}
                                    onChange={(date: Date[]) => {
                                        if (date[0]) formik.setFieldValue('birthdate', date[0]);
                                    }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {formik.touched.birthdate && formik.errors.birthdate && (
                                    <FormFeedback className="d-block">{formik.errors.birthdate as string}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="d-flex gap-3">

                            <div className="mt-4 w-100">
                                <Label htmlFor="breedInput" className="form-label">Raza</Label>
                                <Input
                                    type="select"
                                    id="breedInput"
                                    name="breed"
                                    value={formik.values.breed}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.breed && !!formik.errors.breed}
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
                                {formik.touched.breed && formik.errors.breed && (
                                    <FormFeedback>{formik.errors.breed}</FormFeedback>
                                )}
                            </div>


                            <div className="mt-4 w-100">
                                <Label htmlFor="currentStage" className="form-label">Etapa actual</Label>
                                <Input
                                    type="select"
                                    id="currentStage"
                                    name="currentStage"
                                    value={formik.values.currentStage}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.currentStage && !!formik.errors.currentStage}
                                >
                                    <option value="piglet">Lechón</option>
                                    <option value="weaning">Destete</option>
                                    <option value="fattening">Engorda</option>
                                    <option value="breeder">Reproductor</option>
                                </Input>
                                {formik.touched.currentStage && formik.errors.currentStage && (
                                    <FormFeedback>{formik.errors.currentStage}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-100">
                                <Label htmlFor="origin" className="form-label">Origen</Label>
                                <Input
                                    type="select"
                                    id="origin"
                                    name="origin"
                                    value={formik.values.origin}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.origin && !!formik.errors.origin}
                                >
                                    <option value="born">Nacido en la granja</option>
                                    <option value="purchased">Comprado</option>
                                    <option value="donated">Donado</option>
                                    <option value="other">Otro</option>
                                </Input>
                                {formik.touched.origin && formik.errors.origin && (
                                    <FormFeedback>{formik.errors.origin}</FormFeedback>
                                )}
                            </div>

                        </div>

                        {formik.values.origin === 'other' && (
                            <div className="mt-4">
                                <Label htmlFor="originDetail" className="form-label">Detalle del origen</Label>
                                <Input
                                    type="text"
                                    id="originDetail"
                                    name="originDetail"
                                    value={formik.values.originDetail}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.originDetail && !!formik.errors.originDetail}
                                />
                                {formik.touched.originDetail && formik.errors.originDetail && (
                                    <FormFeedback>{formik.errors.originDetail as string}</FormFeedback>
                                )}
                            </div>
                        )}

                        {formik.values.origin !== 'born' && (
                            <div className="mt-4">
                                <Label htmlFor="arrivalDate" className="form-label">Fecha de llegada</Label>
                                <DatePicker
                                    id="arrivalDate"
                                    className={`form-control ${formik.touched.arrivalDate && formik.errors.arrivalDate ? 'is-invalid' : ''}`}
                                    value={formik.values.arrivalDate ?? undefined}
                                    onChange={(date: Date[]) => {
                                        if (date[0]) formik.setFieldValue('arrivalDate', date[0]);
                                    }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {formik.touched.arrivalDate && formik.errors.arrivalDate && (
                                    <FormFeedback className="d-block">{formik.errors.arrivalDate as string}</FormFeedback>
                                )}
                            </div>
                        )}

                        {(formik.values.origin === 'purchased' || formik.values.origin === 'donated') && (
                            <div className="mt-4">
                                <Label htmlFor="sourceFarm" className="form-label">Granja de origen</Label>
                                <Input
                                    type="text"
                                    id="sourceFarm"
                                    name="sourceFarm"
                                    value={formik.values.sourceFarm}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.sourceFarm && !!formik.errors.sourceFarm}
                                />
                                {formik.touched.sourceFarm && formik.errors.sourceFarm && (
                                    <FormFeedback>{formik.errors.sourceFarm as string}</FormFeedback>
                                )}
                            </div>
                        )}

                        <div className="d-flex gap-3">
                            <div className="mt-4 w-50">
                                <Label htmlFor="sex" className="form-label">Sexo</Label>
                                <Input
                                    type="select"
                                    id="sex"
                                    name="sex"
                                    value={formik.values.sex}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.sex && !!formik.errors.sex}
                                >
                                    <option value="macho">Macho</option>
                                    <option value="hembra">Hembra</option>
                                </Input>
                                {formik.touched.sex && formik.errors.sex && (
                                    <FormFeedback>{formik.errors.sex}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-50">
                                <Label htmlFor="weight" className="form-label">Peso (kg)</Label>
                                <Input
                                    type="number"
                                    id="weight"
                                    name="weight"
                                    value={formik.values.weight}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.weight && !!formik.errors.weight}
                                />
                                {formik.touched.weight && formik.errors.weight && (
                                    <FormFeedback>{formik.errors.weight}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="observations" className="form-label">Caracteristicas fisicas</Label>
                            <Input
                                type="textarea"
                                id="observations"
                                name="observations"
                                value={formik.values.observations}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="Ej: Marca de nacimiento"
                            />
                        </div>

                        <div className="d-flex mt-3 justify-content-end">
                            <Button type="button"
                                onClick={async () => {
                                    const valid = await formik.validateForm();
                                    if (Object.keys(valid).length === 0) {
                                        toggleArrowTab(2);
                                    } else {
                                        formik.setTouched(
                                            Object.keys(formik.values).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
                                            true
                                        );
                                    }
                                }}
                            >
                                Siguiente
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={2}>
                        <div className="p-2 fs-5">

                            <h4 className="fw-bold mb-4">Resumen del Registro</h4>

                            {/* Helpers para badges */}
                            {(() => {
                                const BadgeSexo = () => {
                                    const s = formik.values.sex;
                                    return (
                                        <span
                                            className={`badge px-3 py-2 ${s === "male" ? "bg-primary" : "bg-pink"
                                                }`}
                                        >
                                            <i className={`me-1 ${s === "male" ? "ri-men-fill" : "ri-women-fill"
                                                }`} />
                                            {s === "male" ? "Macho" : "Hembra"}
                                        </span>
                                    );
                                };

                                const BadgeEstado = () => {
                                    const est = formik.values.status;
                                    const map = {
                                        alive: "success",
                                        sold: "info",
                                        slaughtered: "warning",
                                        dead: "danger",
                                        discarded: "secondary",
                                    };
                                    const icon = {
                                        alive: "ri-heart-3-fill",
                                        sold: "ri-money-dollar-circle-fill",
                                        slaughtered: "ri-knife-blood-fill",
                                        dead: "ri-skull-fill",
                                        discarded: "ri-delete-bin-5-fill",
                                    };

                                    return (
                                        <span className={`badge bg-${map[est]} px-3 py-2`}>
                                            <i className={`${icon[est]} me-1`} />
                                            {est.charAt(0).toUpperCase() + est.slice(1)}
                                        </span>
                                    );
                                };

                                const BadgeEtapa = () => {
                                    const etapa = formik.values.currentStage;
                                    const color = {
                                        "piglet": "primary",
                                        "weaning": "info",
                                        "fattening": "warning",
                                        "breeder": "success",
                                    };
                                    return (
                                        <span className={`badge bg-${color[etapa]} px-3 py-2`}>
                                            {etapa.charAt(0).toUpperCase() + etapa.slice(1)}
                                        </span>
                                    );
                                };

                                const BadgeOrigen = () => {
                                    const o = formik.values.origin;
                                    const map = {
                                        born: "success",
                                        purchased: "info",
                                        donated: "primary",
                                        other: "secondary",
                                    };
                                    return (
                                        <span className={`badge bg-${map[o]} px-3 py-2`}>
                                            {o === "born" ? "Nacido en la granja" : o.charAt(0).toUpperCase() + o.slice(1)}
                                        </span>
                                    );
                                };

                                return (
                                    <>
                                        {/* Card Datos Generales */}
                                        <div className="card mb-4 shadow-sm">
                                            <div className="card-header bg-light fw-semibold">Datos generales</div>
                                            <div className="card-body">
                                                <div className="row g-3">

                                                    <div className="col-md-4">
                                                        <label className="fw-semibold">Código</label>
                                                        <div>{formik.values.code}</div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="fw-semibold">Fecha de nacimiento</label>
                                                        <div>{formik.values.birthdate?.toLocaleDateString("es-MX")}</div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="fw-semibold">Raza</label>
                                                        <div>{formik.values.breed}</div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="fw-semibold">Etapa actual</label>
                                                        <div><BadgeEtapa /></div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="fw-semibold">Sexo</label>
                                                        <div><BadgeSexo /></div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="fw-semibold">Peso (kg)</label>
                                                        <div>{formik.values.weight} kg</div>
                                                    </div>

                                                    <div className="col-md-12">
                                                        <label className="fw-semibold">Características físicas</label>
                                                        <div>{formik.values.observations || "Sin especificar"}</div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="fw-semibold">Fecha de registro</label>
                                                        <div>{userLogged.name} {userLogged.lastname}</div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="fw-semibold">Fecha de registro</label>
                                                        <div>{formik.values.registration_date ? (formik.values.registration_date as Date).toLocaleDateString("es") : "Sin especificar"}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Origen */}
                                        <div className="card mb-4 shadow-sm">
                                            <div className="card-header bg-light fw-semibold">Origen</div>
                                            <div className="card-body">
                                                <div className="row g-3">

                                                    <div className="col-md-6">
                                                        <label className="fw-semibold">Tipo de origen</label>
                                                        <div><BadgeOrigen /></div>
                                                    </div>

                                                    {formik.values.origin === "other" && (
                                                        <div className="col-md-6">
                                                            <label className="fw-semibold">Detalle del origen</label>
                                                            <div>{formik.values.originDetail}</div>
                                                        </div>
                                                    )}

                                                    {formik.values.origin !== "born" && (
                                                        <div className="col-md-6">
                                                            <label className="fw-semibold">Fecha de llegada</label>
                                                            <div>{formik.values.arrivalDate?.toLocaleDateString("es-MX")}</div>
                                                        </div>
                                                    )}

                                                    {(formik.values.origin === "purchased" ||
                                                        formik.values.origin === "donated") && (
                                                            <div className="col-md-6">
                                                                <label className="fw-semibold">Granja de origen</label>
                                                                <div>{formik.values.sourceFarm}</div>
                                                            </div>
                                                        )}

                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Estado */}
                                        <div className="card mb-4 shadow-sm">
                                            <div className="card-header bg-light fw-semibold">Estado del cerdo</div>
                                            <div className="card-body">
                                                <label className="fw-semibold">Estado actual</label>
                                                <div><BadgeEstado /></div>
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="d-flex justify-content-between mt-4">
                                            <Button type="button" color="secondary" onClick={() => toggleArrowTab(1)}>
                                                <i className="ri-arrow-left-line me-2" /> Volver
                                            </Button>

                                            <Button type="submit" color="primary" disabled={formik.isSubmitting}>
                                                {formik.isSubmitting ? (
                                                    <>
                                                        Guardando...
                                                        <span className="spinner-border spinner-border-sm ms-2" />
                                                    </>
                                                ) : (
                                                    <>
                                                        Guardar Registro
                                                        <i className="ri-save-3-fill ms-2" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </TabPane>
                </TabContent>

                <SuccessModal isOpen={modals.success} onClose={onSave} message={"Datos registrados con éxito"} />
                <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={"Ha ocurrido un error al registrar los datos, intentelo mas tarde"} />
            </form>
        </>
    );
};

export default SinglePigForm;