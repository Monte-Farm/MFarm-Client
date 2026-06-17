import { logger } from 'utils/logger';
import { preventEnterSubmit } from 'utils/formUtils';
import { ConfigContext } from "App";
import { ExtractionData, PigData, UserData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Yup from 'yup';
import { Alert, Badge, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import { Column } from "common/data/data_types";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import DatePicker from "react-flatpickr";
import { HttpStatusCode } from "axios";
import SuccessModal from "../Shared/SuccessModal";
import PigDetailsModal from "../Details/DetailsPigModal";
import SelectableTable from "../Tables/SelectableTable";
import { useGlobalConfig } from "hooks/useGlobalConfig";


interface ExtractionFormProps {
    initialData?: ExtractionData;
    onSave: () => void;
    onCancel: () => void;
}

const ExtractionForm: React.FC<ExtractionFormProps> = ({ initialData, onSave, onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const { globalConfig } = useGlobalConfig();
    const unitOptions = globalConfig?.unitMeasurements ?? [];
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(false)
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [boars, setBoars] = useState<PigData[]>([])
    const [users, setUsers] = useState<UserData[]>([])
    const [alertBoarEmpty, setAlertBoarEmpty] = useState<boolean>(false)
    const [alertExtractionDataEmpty, setAlertExtractionDataEmpty] = useState<boolean>(false)
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false)
    const [modalOpen, setModalOpen] = useState(false);
    const [idSelectedPig, setIdSelectedPig] = useState<string>("");

    const boarsColumns: Column<any>[] = [
        {
            header: t('common.field.code'),
            accessor: 'code',
            render: (_, row) => (
                <Button
                    className="text-underline"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIdSelectedPig(row._id);
                        toggleModal();
                    }}
                >
                    {row.code} ↗
                </Button>
            )
        },
        { header: t('common.field.breed', { defaultValue: 'Raza' }), accessor: 'breed', type: 'text', isFilterable: true },
        { header: t('common.field.weight'), accessor: 'weight', type: 'number', isFilterable: true },
        {
            header: t('common.field.stage', { defaultValue: 'Etapa' }),
            accessor: 'currentStage',
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case "piglet": color = "info"; break;
                    case "weaning": color = "warning"; break;
                    case "fattening": color = "primary"; break;
                    case "breeder": color = "success"; break;
                }

                return <Badge color={color}>{t(`pigs.stage.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        { header: t('common.field.birthDate'), accessor: 'birthdate', type: 'date' },
    ]

    const toggleModal = () => setModalOpen(!modalOpen);

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const handleError = (error: any, message: string) => {
        logger.error(`${message}: ${error}`)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const validationSchema = Yup.object({
        batch: Yup.string().required(t('laboratory.extraction.form.validation.batchRequired')),
        date: Yup.date().required(t('laboratory.extraction.form.validation.dateRequired')),
        technician: Yup.string().required(t('laboratory.extraction.form.validation.technicianRequired')),
        farm: Yup.string().required(t('laboratory.extraction.form.validation.farmRequired')),
        extraction_location: Yup.string().required(t('laboratory.extraction.form.validation.locationRequired')),
        notes: Yup.string(),
        unit_measurement: Yup.string().required(t('laboratory.extraction.form.validation.unitRequired')),
        appearance: Yup.string().required(t('laboratory.extraction.form.validation.appearanceRequired')),
        volume: Yup.number()
            .min(0, t('laboratory.extraction.form.validation.volumeMin'))
            .required(t('laboratory.extraction.form.validation.volumeRequired'))
    })

    const formik = useFormik<ExtractionData>({
        initialValues: initialData || {
            date: null,
            technician: userLogged._id || "",
            farm: userLogged.farm_assigned || "",
            boar: "",
            extraction_location: "",
            batch: "",
            notes: "",
            is_sample_registered: false,
            volume: 0,
            unit_measurement: '',
            appearance: '',
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/extraction/create`, values);
                if (response.status === HttpStatusCode.Created) {
                    const item = {
                        date: values.date,
                        type: 'extraction',
                        responsible: values.technician,
                        description: 'Extraccion de semen',
                        eventRef: response.data.data._id,
                        eventModel: 'extractions'
                    }

                    await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/add_reproduction_item/${values.boar}`, item)

                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Extracción del verraco ${values.boar} registrada`
                    });
                    setSuccessModalOpen(true)
                }
            } catch (err: any) {
                if (err.response && err.response.status === HttpStatusCode.BadRequest) {
                    handleError(err, t('laboratory.extraction.form.error.batchExists', { batch: values.batch }))
                } else {
                    handleError(err, t('laboratory.extraction.form.error.save'));
                }
            } finally {
                setSubmitting(false);
            }
        }
    })

    const checkBoarSelected = () => {
        if (formik.values.boar === "") {
            setAlertBoarEmpty(true)
            setTimeout(() => {
                setAlertBoarEmpty(false)
            }, 4000);
            return
        }
        toggleArrowTab(2)
    }

    const checkExtractionData = async () => {
        formik.setTouched({
            batch: true,
            date: true,
            extraction_location: true,
            technician: true,
            farm: true,
            volume: true,
            unit_measurement: true,
            appearance: true
        });

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(3);
        } catch (err) {
            setAlertExtractionDataEmpty(true);
            setTimeout(() => setAlertExtractionDataEmpty(false), 4000);
        }
    };

    const fetchBoars = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_boars/${userLogged.farm_assigned}`)
            const boarsWithId = response.data.data.map((b: any) => ({ ...b, id: b._id }));
            setBoars(boarsWithId)
        } catch (error) {
            handleError(error, t('laboratory.extraction.form.error.fetchBoars'))
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_all_by_farm/${userLogged.farm_assigned}`)
            setUsers(response.data.data)
        } catch (error) {
            handleError(error, t('laboratory.extraction.form.error.fetchUsers'));
        } finally {
            setLoading(false)
        }

    }

    const fetchNextBatch = async () => {
        if (!configContext) return
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/next_batch`);
            const nextBatch = response.data.data;
            formik.setFieldValue("batch", nextBatch);
        } catch (error) {
            logger.error("Error al obtener el siguiente lote:", error);
        }
    }

    useEffect(() => {
        fetchBoars();
        fetchUsers();
        fetchNextBatch()
        formik.setFieldValue('date', new Date())
    }, [])

    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                }}
                onKeyDown={preventEnterSubmit}
            >
                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-boarselect-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-boarselect-tab"
                            >
                                {t('laboratory.extraction.form.step.boarSelection')}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-extractioninfo-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-extractioninfo-tab"
                            >
                                {t('laboratory.extraction.form.step.extractionInfo')}
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
                                {t('laboratory.extraction.form.step.summary')}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-boarselect-tab" tabId={1}>
                        <SelectableTable data={boars} columns={boarsColumns} selectionMode="single" showPagination={true} rowsPerPage={6} onSelect={(rows) => formik.setFieldValue('boar', rows[0]?._id)} />
                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkBoarSelected()}>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line" />
                            </Button>
                        </div>
                        {alertBoarEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">{t('laboratory.extraction.form.validation.selectBoar')}</span>
                                <Button close onClick={() => setAlertBoarEmpty(false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-extractioninfo-tab" tabId={2}>
                        <div className="d-flex gap-2">
                            <div className="mt-4 w-50">
                                <Label htmlFor="batch" className="form-label">{t('laboratory.extraction.form.field.batch')}</Label>
                                <Input
                                    type="text"
                                    id="batch"
                                    name="batch"
                                    value={formik.values.batch}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.batch && !!formik.errors.batch}
                                    placeholder="Ej: L-0001"
                                    disabled={initialData ? true : false}
                                />
                                {formik.touched.batch && formik.errors.batch && (
                                    <FormFeedback>{formik.errors.batch}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-50">
                                <Label htmlFor="date" className="form-label">{t('laboratory.extraction.form.field.date')}</Label>
                                <DatePicker
                                    id="date"
                                    className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                                    value={formik.values.date ?? undefined}
                                    onChange={(date: Date[]) => {
                                        if (date[0]) formik.setFieldValue('date', date[0]);
                                    }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {formik.touched.date && formik.errors.date && (
                                    <FormFeedback className="d-block">{formik.errors.date as string}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="d-flex gap-3">
                            <div className="mt-4 w-100">
                                <Label htmlFor="volume" className="form-label">{t('laboratory.extraction.form.field.volume')}</Label>
                                <Input
                                    type="number"
                                    id="volume"
                                    name="volume"
                                    value={formik.values.volume}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.volume && !!formik.errors.volume}
                                    placeholder="Ej: 100"
                                />
                                {formik.touched.volume && formik.errors.volume && (
                                    <FormFeedback>{formik.errors.volume}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-100">
                                <Label htmlFor="unit_measurement" className="form-label">{t('laboratory.extraction.form.field.unitMeasurement')}</Label>
                                <Input
                                    type="select"
                                    id="unit_measurement"
                                    name="unit_measurement"
                                    value={formik.values.unit_measurement}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.unit_measurement && !!formik.errors.unit_measurement}
                                >
                                    <option value="">{t('laboratory.extraction.form.field.unitPlaceholder')}</option>
                                    {unitOptions.map((u) => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </Input>
                                {formik.touched.unit_measurement && formik.errors.unit_measurement && (
                                    <FormFeedback>{formik.errors.unit_measurement}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-100">
                                <Label htmlFor="appearance" className="form-label">{t('laboratory.extraction.form.field.appearance')}</Label>
                                <Input
                                    type="text"
                                    id="appearance"
                                    name="appearance"
                                    value={formik.values.appearance}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.appearance && !!formik.errors.appearance}
                                    placeholder={t('laboratory.extraction.form.field.appearancePlaceholder')}
                                />
                                {formik.touched.appearance && formik.errors.appearance && (
                                    <FormFeedback>{formik.errors.appearance}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <div className="mt-4 w-50">
                                <Label htmlFor="extraction_location" className="form-label">{t('laboratory.extraction.form.field.location')}</Label>
                                <Input
                                    type="text"
                                    id="extraction_location"
                                    name="extraction_location"
                                    value={formik.values.extraction_location}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.extraction_location && !!formik.errors.extraction_location}
                                    placeholder={t('laboratory.extraction.form.field.locationPlaceholder')}
                                />
                                {formik.touched.extraction_location && formik.errors.extraction_location && (
                                    <FormFeedback>{formik.errors.extraction_location}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-50">
                                <Label htmlFor="technician" className="form-label">
                                    {t('laboratory.extraction.form.field.technician')}
                                </Label>
                                <Input
                                    type="select"
                                    id="technician"
                                    name="technician"
                                    value={formik.values.technician}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.technician && !!formik.errors.technician}
                                >
                                    <option value="">{t('laboratory.extraction.form.field.technicianPlaceholder')}</option>
                                    {users.map((user) => (
                                        <option key={user._id} value={user._id}>
                                            {user.name} {user.lastname}
                                        </option>
                                    ))}
                                </Input>
                                {formik.touched.technician && formik.errors.technician && (
                                    <FormFeedback>{formik.errors.technician}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="notes" className="form-label">{t('laboratory.extraction.form.field.notes')}</Label>
                            <Input
                                type="textarea"
                                id="notes"
                                name="notes"
                                value={formik.values.notes}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.notes && !!formik.errors.notes}
                                placeholder={t('laboratory.extraction.form.field.notesPlaceholder')}
                            />
                            {formik.touched.notes && formik.errors.notes && (
                                <FormFeedback>{formik.errors.notes}</FormFeedback>
                            )}
                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t('common.button.back', { defaultValue: 'Atras' })}
                            </Button>

                            <Button className="ms-auto" onClick={() => checkExtractionData()}>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>

                        {alertExtractionDataEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">{t('laboratory.extraction.form.validation.fillAll')}</span>
                                <Button close onClick={() => setAlertExtractionDataEmpty(false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={3}>
                        <div className="row g-4 mt-4">
                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-primary text-white fs-5 d-flex align-items-center justify-content-center">
                                        {t('laboratory.extraction.form.summary.boarData')}
                                    </div>
                                    <div className="card-body">
                                        {(() => {
                                            const selectedBoar = boars.find(b => b._id === formik.values.boar);
                                            if (!selectedBoar) {
                                                return <p className="text-muted text-center">{t('laboratory.extraction.form.summary.noBoarSelected')}</p>;
                                            }
                                            return (
                                                <ul className="list-group list-group-flush fs-5">
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>{t('common.field.code')}:</strong></span>
                                                        <span className="text-black">{selectedBoar.code}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>{t('common.field.breed', { defaultValue: 'Raza' })}:</strong></span>
                                                        <span className="text-black">{selectedBoar.breed}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>{t('common.field.weight')}:</strong></span>
                                                        <span className="text-black">{selectedBoar.weight} kg</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>{t('common.field.stage', { defaultValue: 'Etapa' })}:</strong></span>
                                                        <span className="text-black">{t(`pigs.stage.${selectedBoar.currentStage}`, { defaultValue: selectedBoar.currentStage })}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>{t('common.field.birthDate')}:</strong></span>
                                                        <span className="text-black">{selectedBoar.birthdate ? new Date(selectedBoar.birthdate).toLocaleDateString() : t('laboratory.extraction.form.summary.noDate')}</span>
                                                    </li>
                                                </ul>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-success text-white fs-5 d-flex align-items-center justify-content-center">
                                        {t('laboratory.extraction.form.step.extractionInfo')}
                                    </div>
                                    <div className="card-body">
                                        <ul className="list-group list-group-flush fs-5">
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>{t('laboratory.extraction.form.field.batch')}:</strong></span>
                                                <span className="text-black">{formik.values.batch}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>{t('common.field.date')}:</strong></span>
                                                <span className="text-black">{formik.values.date ? new Date(formik.values.date).toLocaleDateString() : ""}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>{t('laboratory.extraction.form.field.location')}:</strong></span>
                                                <span className="text-black">{formik.values.extraction_location}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>{t('laboratory.extraction.form.field.technician')}:</strong></span>
                                                <span className="text-black">{`${userLogged.name} ${userLogged.lastname}`}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>{t('laboratory.extraction.form.field.volume')}:</strong></span>
                                                <span className="text-black">{formik.values.volume} {formik.values.unit_measurement}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>{t('laboratory.extraction.form.field.appearance')}:</strong></span>
                                                <span className="text-black">{formik.values.appearance}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>{t('laboratory.extraction.form.field.notes')}:</strong></span>
                                                <span className="text-black">{formik.values.notes || t('laboratory.extraction.form.summary.noNotes')}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
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
                                        {t('laboratory.extraction.form.button.register')}
                                    </div>
                                )}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <Modal isOpen={modalOpen} toggle={toggleModal} size="lg" centered className="border-0">
                <ModalHeader toggle={toggleModal} className="border-0 pb-0">
                    <h4 className="modal-title text-primary fw-bold">{t('laboratory.extraction.modal.pigDetails')}</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    <PigDetailsModal pigId={idSelectedPig} showAllDetailsButton={false} />
                </ModalBody>
            </Modal>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-4">
                    {alertConfig.color === "success" && <FiCheckCircle size={22} />}
                    {alertConfig.color === "danger" && <FiXCircle size={22} />}
                    {alertConfig.color === "warning" && <FiAlertCircle size={22} />}
                    {alertConfig.color === "info" && <FiInfo size={22} />}

                    <span className="flex-grow-1 text-black">{alertConfig.message}</span>

                    <Button close onClick={() => setAlertConfig({ ...alertConfig, visible: false })} />
                </Alert>
            )}

            <SuccessModal isOpen={successModalOpen} onClose={onSave} message={t('laboratory.extraction.form.success')} />
        </>
    )
}

export default ExtractionForm
