import { logger } from 'utils/logger';
import { preventEnterSubmit } from 'utils/formUtils';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { InseminationData, PigData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, CardText, CardTitle, Col, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Row, Spinner, TabContent, TabPane } from "reactstrap";
import * as Yup from 'yup';
import classnames from "classnames";
import { FiXCircle } from "react-icons/fi";
import DatePicker from "react-flatpickr";
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd";
import SimpleBar from "simplebar-react";
import SuccessModal from "../Shared/SuccessModal";
import { HttpStatusCode } from "axios";
import PigDetailsModal from "../Details/DetailsPigModal";
import SelectableTable from "../Tables/SelectableTable";
import { useTranslation } from "react-i18next";


interface InseminationFormProps {
    initialData?: InseminationData;
    onSave: () => void;
    onCancel: () => void;
}

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const InseminationForm: React.FC<InseminationFormProps> = ({ initialData, onSave, onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(false)
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [alertSowEmpty, setAlertSowEmpty] = useState<boolean>(false)
    const [alertInseminationDataEmpty, setAlertInseminationDataEmpty] = useState<boolean>(false)
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false)
    const [sows, setSows] = useState<PigData[]>([])
    const [doses, setDoses] = useState<any[]>([])
    const [modalOpen, setModalOpen] = useState(false);
    const [extractionData, setExtractionData] = useState<any>(null);
    const [selectedDoses, setSelectedDoses] = useState<any[]>([]);
    const [alertDosesIncomplete, setAlertDosesIncomplete] = useState(false);
    const [pigDetailsmodalOpen, setPigDetailsModalOpen] = useState(false);
    const [idSelectedPig, setIdSelectedPig] = useState<string>("");
    const [semenProducts, setSemenProducts] = useState<{ product_id: string; product_name: string; warehouse_id: string; warehouse_name: string; unit_measurement: string }[]>([]);
    const [selectedSemenProductId, setSelectedSemenProductId] = useState<string>("");

    const sowsColumns: Column<any>[] = [
        {
            header: t('insemination.form.columnCode', { defaultValue: 'Codigo' }),
            accessor: 'code',
            render: (_, row) => (
                <Button
                    className="text-underline"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIdSelectedPig(row._id);
                        togglePigDetailsModal();
                    }}
                >
                    {row.code} ↗
                </Button>
            )
        },
        { header: t('insemination.form.columnEarTag', { defaultValue: 'Arete' }), accessor: 'earTag', type: 'text', isFilterable: true },
        { header: t('insemination.form.columnBreed', { defaultValue: 'Raza' }), accessor: 'breed', type: 'text', isFilterable: true },
        { header: t('insemination.form.columnWeight', { defaultValue: 'Peso actual' }), accessor: 'weight', type: 'number', isFilterable: true },
        {
            header: t('insemination.form.columnStage', { defaultValue: 'Etapa' }),
            accessor: 'currentStage',
            render: (value: string) => {
                const color = value === 'piglet' ? 'info' : value === 'weaning' ? 'warning' : value === 'fattening' ? 'primary' : value === 'breeder' ? 'success' : 'secondary';
                const label = t(`pigs.stage.${value}`, { defaultValue: value });
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: t('insemination.form.columnBirthdate', { defaultValue: 'Fecha de N.' }), accessor: 'birthdate', type: 'date' },
    ]

    const dosesColumns: Column<any>[] = [
        { header: t('insemination.form.columnCode', { defaultValue: 'Codigo' }), accessor: 'code', type: 'text', isFilterable: true },
        {
            header: t('insemination.form.columnGeneticLiquid', { defaultValue: 'Genetica liquida' }),
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.semen_volume} ${row.unit_measurement}` || 0
        },
        {
            header: t('insemination.form.columnDiluentVolume', { defaultValue: 'Volumen diluyente' }),
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.diluent_volume} ${row.unit_measurement}` || 0
        },
        {
            header: t('insemination.form.columnTotalVolume', { defaultValue: 'Volumen total' }),
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.total_volume} ${row.unit_measurement}` || 0
        },
        {
            header: t('insemination.form.columnBoar', { defaultValue: 'Verraco' }),
            accessor: 'boar_code',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                if (row.origin === 'external' || !row.boar_code) {
                    if (row.supplier) {
                        return <span>{row.supplier.name} <small className="text-muted">({t('insemination.form.lot', { defaultValue: 'Lote' })}: {row.supplier.lot})</small></span>;
                    }
                    return <span className="text-muted">-</span>;
                }
                return <span>{row.boar_code}</span>;
            }
        },
        {
            header: t('insemination.form.columnExtractionDetails', { defaultValue: 'Detalles de extracción' }),
            accessor: 'action',
            render: (_, row) => {
                if (row.origin === 'external' || !row.extraction_id) {
                    return <span className="text-muted">-</span>;
                }
                return (
                    <Button
                        className="text-underline"
                        color="link"
                        onClick={(e) => {
                            e.stopPropagation();
                            fetchExtractionDetails(row.extraction_id, row.semen_sample_id);
                        }}
                    >
                        {t('common.button.viewDetails', { defaultValue: 'Ver detalles' })} ↗
                    </Button>
                );
            }
        }
    ]


    const toggleModal = () => setModalOpen(!modalOpen);
    const togglePigDetailsModal = () => setPigDetailsModalOpen(!pigDetailsmodalOpen);


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

    const inseminationValidationSchema = Yup.object({
        date: Yup.date().required(t('insemination.form.validationDate', { defaultValue: 'Por favor ingrese la fecha de la inseminación' })),
    });

    const formik = useFormik<InseminationData>({
        initialValues: initialData || {
            sow: '',
            date: null,
            responsible: userLogged._id || "",
            status: 'active',
            notes: '',
            doses: [],
            heats: [],
            warehouseSource: '',
        },
        enableReinitialize: true,
        validationSchema: inseminationValidationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/insemination/create`, values);
                if (response.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Inseminacion registrada`
                    });
                    setSuccessModalOpen(true)
                }
            } catch (err: any) {

            } finally {
                setSubmitting(false);
            }
        }
    })

    const checkSowSelected = () => {
        if (formik.values.sow === "") {
            setAlertSowEmpty(true)
            setTimeout(() => {
                setAlertSowEmpty(false)
            }, 4000);
            return
        }
        toggleArrowTab(2)
    }

    const checkInseminationData = async () => {
        if (selectedDoses.length === 0) {
            setAlertInseminationDataEmpty(true)
            setTimeout(() => {
                setAlertInseminationDataEmpty(false)
            }, 4000);
            return
        }
        toggleArrowTab(3)
    };

    const validateAndSaveDoses = () => {
        const incomplete = selectedDoses.some(dose => !dose.time);

        if (incomplete) {
            setAlertDosesIncomplete(true);
            setTimeout(() => setAlertDosesIncomplete(false), 4000);
            return;
        }

        const selectedProduct = semenProducts.find(p => p.product_id === selectedSemenProductId);

        const formattedDoses = selectedDoses.map((dose, index) => ({
            dose: dose._id,
            order: index + 1,
            time: dose.time,
            notes: dose.notes,
            ...(selectedProduct ? {
                semen_product_id: selectedProduct.product_id,
                total_volume: dose.total_volume,
            } : {}),
        }));

        formik.setFieldValue('doses', formattedDoses);
        if (selectedProduct) {
            formik.setFieldValue('warehouseSource', selectedProduct.warehouse_id);
        }

        toggleArrowTab(activeStep + 1);
    };


    const fetchSows = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_sows_not_inseminated/${userLogged.farm_assigned}`)
            const sowsWithId = response.data.data.map((b: any) => ({ ...b, id: b._id }));
            setSows(sowsWithId)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos de los verracos, intentelo mas tarde')
        } finally {
            setLoading(false)
        }
    }

    const fetchDoses = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/semen_sample/find_doses_available/${userLogged.farm_assigned}`)
            const dosesWithId = response.data.data.map((b: any) => ({ ...b, id: b._id }));
            setDoses(dosesWithId)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos de los verracos, intentelo mas tarde')
        } finally {
            setLoading(false)
        }
    }

    const fetchSemenProducts = async () => {
        if (!configContext || !userLogged) return;
        try {
            const [mainWhRes, subWhRes] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`),
            ]);
            const mainWarehouseId: string = mainWhRes.data.data;
            const subwarehouses: any[] = subWhRes.data.data || [];
            const allWarehouses = [
                { _id: mainWarehouseId, name: t('insemination.form.generalWarehouse', { defaultValue: 'Almacén general' }) },
                ...subwarehouses,
            ];
            const inventoryResults = await Promise.all(
                allWarehouses.map(w =>
                    configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${w._id}`)
                        .then(r => ({ warehouse: w, items: r.data.data || [] }))
                        .catch(() => ({ warehouse: w, items: [] }))
                )
            );
            const products: typeof semenProducts = [];
            inventoryResults.forEach(({ warehouse, items }) => {
                items
                    .filter((p: any) => p.product?.category === 'laboratory' && p.quantity > 0)
                    .forEach((p: any) => {
                        products.push({
                            product_id: p.product._id,
                            product_name: p.product.name,
                            warehouse_id: warehouse._id,
                            warehouse_name: warehouse.name,
                            unit_measurement: p.product.unit_measurement,
                        });
                    });
            });
            setSemenProducts(products);
        } catch (error) {
            handleError(error, t('insemination.form.errorLoadSemenProducts', { defaultValue: 'Error al cargar los productos de semen' }));
        }
    };

    const fetchExtractionDetails = async (extractionId: string, sampleId: string) => {
        if (!configContext || !userLogged) return;

        try {
            const [extractionRes, sampleRes] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/find_by_id/${extractionId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/semen_sample/find_by_id/${sampleId}`),
            ]);

            setExtractionData({
                extraction: extractionRes.data.data,
                sample: sampleRes.data.data,
            });

            toggleModal();
        } catch (error) {
            logger.error("Error fetching details", error);
        }
    };

    useEffect(() => {
        fetchSows();
        fetchDoses();
        fetchSemenProducts();
        formik.setFieldValue('date', new Date())
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
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
                                id="step-sowselect-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-sowselect-tab"
                            >
                                {t('insemination.form.step1', { defaultValue: 'Selección de cerda' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-inseminationinfo-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-inseminationinfo-tab"
                            >
                                {t('insemination.form.step2', { defaultValue: 'Información de la inseminación' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-doses-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                    done: activeStep > 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-doses-tab"
                            >
                                {t('insemination.form.step3', { defaultValue: 'Datos de dosis' })}
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
                                {t('insemination.form.step4', { defaultValue: 'Resumen' })}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-sowselect-tab" tabId={1}>
                        <SelectableTable data={sows} columns={sowsColumns} selectionMode="single" showPagination={true} rowsPerPage={15} onSelect={(rows) => formik.setFieldValue('sow', rows[0]?._id)} />
                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkSowSelected()}>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line" />
                            </Button>
                        </div>
                        {alertSowEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">{t('insemination.form.alertSelectPig', { defaultValue: 'Por favor, seleccione una cerda' })}</span>

                                <Button close onClick={() => setAlertSowEmpty(false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-inseminationinfo-tab" tabId={2}>
                        <div className="d-flex gap-2">
                            <div className="w-50">
                                <Label htmlFor="date" className="form-label">{t('insemination.form.date', { defaultValue: 'Fecha de inseminación' })}</Label>
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

                            <div className="w-50">
                                <Label htmlFor="notes" className="form-label">{t('insemination.form.notes', { defaultValue: 'Notas' })}</Label>
                                <Input
                                    type="text"
                                    id="notes"
                                    name="notes"
                                    value={formik.values.notes}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.notes && !!formik.errors.notes}
                                    placeholder={t('insemination.form.notesPlaceholder', { defaultValue: 'Ej: Extraccion parcial' })}
                                />
                                {formik.touched.notes && formik.errors.notes && (
                                    <FormFeedback>{formik.errors.notes}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 border-top border-3 pt-3">
                            <div className="mb-3">
                                <Label htmlFor="semenProductSelect" className="form-label">
                                    {t('insemination.form.semenProduct', { defaultValue: 'Producto de semen (descuento de inventario)' })}
                                    <small className="text-muted ms-2">{t('insemination.form.semenProductHint', { defaultValue: '(Opcional — seleccione para descontar del almacén)' })}</small>
                                </Label>
                                <Input
                                    type="select"
                                    id="semenProductSelect"
                                    value={selectedSemenProductId}
                                    onChange={(e) => setSelectedSemenProductId(e.target.value)}
                                >
                                    <option value="">{t('insemination.form.semenProductNone', { defaultValue: 'Sin descuento de inventario' })}</option>
                                    {semenProducts.map((p, i) => (
                                        <option key={`${p.product_id}-${p.warehouse_id}-${i}`} value={p.product_id}>
                                            {p.product_name} — {t('insemination.form.warehouseLabel', { defaultValue: 'Almacén' })}: {p.warehouse_name}
                                        </option>
                                    ))}
                                </Input>
                                {!selectedSemenProductId && (
                                    <div className="alert alert-warning d-flex align-items-center gap-2 mt-2 mb-0 py-2">
                                        <i className="ri-error-warning-fill fs-5 flex-shrink-0" />
                                        <span>{t('insemination.form.semenProductWarning', { defaultValue: 'No se descontará ningún producto del inventario. Seleccione un producto si desea registrar el consumo.' })}</span>
                                    </div>
                                )}
                            </div>
                            <Label className="form-label">{t('insemination.form.doses', { defaultValue: 'Dosis de semen' })}</Label>
                            <SelectableTable
                                data={doses}
                                columns={dosesColumns}
                                selectionMode="multiple"
                                showPagination={true}
                                rowsPerPage={7}
                                onSelect={(rows) => {
                                    setSelectedDoses(rows);
                                }}
                            />
                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t('common.button.back', { defaultValue: 'Volver' })}
                            </Button>

                            <Button className="ms-auto" onClick={() => checkInseminationData()}>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>

                        {alertInseminationDataEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">{t('insemination.form.alertSelectDose', { defaultValue: 'Por favor, seleccione al menos una dosis' })}</span>

                                <Button close onClick={() => setAlertSowEmpty(false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-doses-tab" tabId={3}>
                        <DragDropContext
                            onDragEnd={(result: DropResult) => {
                                if (!result.destination) return;
                                const items = Array.from(selectedDoses);
                                const [reordered] = items.splice(result.source.index, 1);
                                items.splice(result.destination.index, 0, reordered);
                                setSelectedDoses(items);
                            }}
                        >
                            <Droppable droppableId="dosesList">
                                {(provided) => (
                                    <SimpleBar style={{ maxHeight: 700 }} {...provided.droppableProps}>
                                        <div ref={provided.innerRef} {...provided.droppableProps}>
                                            {selectedDoses.map((dose, index) => (
                                                <Draggable
                                                    key={dose._id || index}
                                                    draggableId={dose._id || index.toString()}
                                                    index={index}
                                                >
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            <Card className="mb-2 shadow-sm">
                                                                <CardHeader className="bg-primary text-white d-flex justify-content-between align-items-center">
                                                                    <span className="fs-5">{t('insemination.form.doseCode', { code: dose.code, defaultValue: `Dosis: ${dose.code}` })}</span>
                                                                    <span className="badge bg-light text-dark fs-5">{t('insemination.form.doseOrder', { number: index + 1, defaultValue: `Orden ${index + 1}` })}</span>
                                                                </CardHeader>
                                                                <CardBody className="d-flex flex-column gap-3">
                                                                    <div className="d-flex gap-2">
                                                                        <div className="w-50">
                                                                            <Label>{t('insemination.form.doseDateTime', { defaultValue: 'Fecha y hora de aplicación' })}</Label>
                                                                            <DatePicker
                                                                                className="form-control"
                                                                                value={dose.time ?? undefined}
                                                                                onChange={(date: Date[]) => {
                                                                                    const updated = [...selectedDoses];
                                                                                    updated[index].time = date[0];
                                                                                    setSelectedDoses(updated);
                                                                                }}
                                                                                options={{ enableTime: true, dateFormat: 'd/m/Y H:i' }}
                                                                            />
                                                                        </div>
                                                                        <div className="w-50">
                                                                            <Label>{t('insemination.form.doseNotes', { defaultValue: 'Notas' })}</Label>
                                                                            <Input
                                                                                type="text"
                                                                                value={dose.notes ?? ''}
                                                                                onChange={(e) => {
                                                                                    const updated = [...selectedDoses];
                                                                                    updated[index].notes = e.target.value;
                                                                                    setSelectedDoses(updated);
                                                                                }}
                                                                                placeholder={t('insemination.form.dosesOptionalPlaceholder', { defaultValue: 'Opcional' })}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </CardBody>
                                                            </Card>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </SimpleBar>
                                )}
                            </Droppable>
                        </DragDropContext>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t('common.button.back', { defaultValue: 'Volver' })}
                            </Button>

                            <Button className="ms-auto" onClick={validateAndSaveDoses}>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>

                        {alertDosesIncomplete && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">{t('insemination.form.alertFillDoses', { defaultValue: 'Por favor complete todos los campos de las dosis' })}</span>
                                <Button close onClick={() => setAlertDosesIncomplete(false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={4}>
                        <div className="row g-4 mt-4">

                            {/* Datos de la cerda */}
                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-primary text-white fs-5 d-flex align-items-center justify-content-center">
                                        {t('insemination.form.pigCard', { defaultValue: 'Datos de la cerda' })}
                                    </div>
                                    <div className="card-body">
                                        {(() => {
                                            const selectedSow = sows.find(s => s._id === formik.values.sow);
                                            if (!selectedSow) return <p className="text-muted text-center">{t('insemination.form.noSowSelected', { defaultValue: 'No se seleccionó ninguna cerda' })}</p>;
                                            return (
                                                <ul className="list-group list-group-flush fs-5">
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>{t('insemination.form.summaryCode_label', { defaultValue: 'Código:' })}</strong></span>
                                                        <span className="text-black">{selectedSow.code}</span>
                                                    </li>
                                                    {selectedSow.earTag && (
                                                        <li className="list-group-item d-flex justify-content-between">
                                                            <span className="text-black"><strong>{t('insemination.form.summaryEarTag_label', { defaultValue: 'Arete:' })}</strong></span>
                                                            <span className="text-black">{selectedSow.earTag}</span>
                                                        </li>
                                                    )}
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>{t('insemination.form.summaryBreed_label', { defaultValue: 'Raza:' })}</strong></span>
                                                        <span className="text-black">{selectedSow.breed}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>{t('insemination.form.summaryWeight_label', { defaultValue: 'Peso actual:' })}</strong></span>
                                                        <span className="text-black">{selectedSow.weight} kg</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>{t('insemination.form.summaryStage_label', { defaultValue: 'Etapa actual:' })}</strong></span>
                                                        <span className="text-black">{t(`pigs.stage.${selectedSow.currentStage}`, { defaultValue: selectedSow.currentStage })}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>{t('insemination.form.summaryBirthdate_label', { defaultValue: 'Fecha de nacimiento:' })}</strong></span>
                                                        <span className="text-black">{selectedSow.birthdate ? new Date(selectedSow.birthdate).toLocaleDateString() : "-"}</span>
                                                    </li>
                                                </ul>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Información de la inseminación */}
                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-success text-white fs-5 d-flex align-items-center justify-content-center">
                                        {t('insemination.form.inseminationCard', { defaultValue: 'Información de la inseminación' })}
                                    </div>
                                    <div className="card-body">
                                        <ul className="list-group list-group-flush fs-5">
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>{t('insemination.form.summaryDate_label', { defaultValue: 'Fecha:' })}</strong></span>
                                                <span className="text-black">{formik.values.date ? new Date(formik.values.date).toLocaleDateString() : "-"}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>{t('insemination.form.summaryResponsible_label', { defaultValue: 'Responsable:' })}</strong></span>
                                                <span className="text-black">{userLogged.name} {userLogged.lastname}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>{t('insemination.form.summaryNotes_label', { defaultValue: 'Notas:' })}</strong></span>
                                                <span className="text-black">{formik.values.notes || t('insemination.form.noNotes', { defaultValue: 'Sin notas' })}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>{t('insemination.form.summaryFarrowing_label', { defaultValue: 'Fecha de parto (tentativa)' })}</strong></span>
                                                <span className="text-black">
                                                    {formik.values.date ? new Date(new Date(formik.values.date).getTime() + 115 * 24 * 60 * 60 * 1000).toLocaleDateString() : t('insemination.form.noDate', { defaultValue: 'Sin fecha' })}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Dosis */}
                            <div className="col-12">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-info text-white fs-5 d-flex align-items-center justify-content-center">
                                        {t('insemination.form.dosesCard', { defaultValue: 'Dosis' })}
                                    </div>
                                    <div className="card-body" style={{ maxHeight: "300px", overflowY: "auto" }}>
                                        {formik.values.doses.length === 0 ? (
                                            <p className="text-muted text-center fs-5">{t('insemination.form.noDoses', { defaultValue: 'No se han agregado dosis' })}</p>
                                        ) : (
                                            <ul className="list-group list-group-flush fs-5">
                                                {formik.values.doses.map((dose, idx) => {

                                                    const doseInfo = selectedDoses.find(d => d._id === dose.dose);
                                                    const displayCode = doseInfo?.code || dose.dose;

                                                    return (
                                                        <li key={idx} className="list-group-item d-flex justify-content-between">
                                                            <span className="text-black"><strong>{displayCode}</strong></span>
                                                            <span className="text-black">
                                                                {dose.time ? new Date(dose.time).toLocaleString() : "-"} | {dose.notes || t('insemination.form.noNotes', { defaultValue: 'Sin notas' })}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t('common.button.back', { defaultValue: 'Volver' })}
                            </Button>

                            <Button className="ms-auto btn-success" type="submit" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <>
                                        <i className="ri-check-line me-2" />
                                        {t('insemination.form.register', { defaultValue: 'Registrar' })}
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <Modal isOpen={modalOpen} toggle={toggleModal} size="lg" centered className="border-0" fullscreen={tabletMode}>
                <ModalHeader toggle={toggleModal} className="border-0 pb-0">
                    <h4 className="modal-title text-primary fw-bold">{t('insemination.form.modalExtraction', { defaultValue: 'Detalles de la extracción' })}</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    {extractionData ? (
                        <Row className="d-flex align-items-stretch g-3">
                            {/* Información de la extracción */}
                            <Col md={6} className="d-flex">
                                <div className="card shadow-sm border-0 rounded-3 w-100 h-100 d-flex flex-column">
                                    <div className="card-header bg-primary text-white fs-5 d-flex align-items-center justify-content-center">
                                        {t('insemination.form.extractionCardTitle', { defaultValue: 'Datos de la extracción' })}
                                    </div>
                                    <div className="card-body p-0 d-flex flex-column flex-grow-1">
                                        <ul className="list-group list-group-flush flex-grow-1">
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.extractionDate', { defaultValue: 'Fecha:' })}</strong> <span className="text-black">{new Date(extractionData.extraction.date).toLocaleString()}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.extractionTechnician', { defaultValue: 'Técnico:' })}</strong> <span className="text-black">{extractionData.extraction.technician.name} {extractionData.extraction.technician.lastname}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.extractionBoar', { defaultValue: 'Verraco:' })}</strong> <span className="text-black">{extractionData.extraction.boar.code} ({extractionData.extraction.boar.breed})</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.extractionLocation', { defaultValue: 'Ubicación:' })}</strong> <span className="text-black">{extractionData.extraction.extraction_location}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.extractionBatch', { defaultValue: 'Lote:' })}</strong> <span className="text-black">{extractionData.extraction.batch}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.extractionTotalVolume', { defaultValue: 'Volumen total:' })}</strong> <span className="text-black">{extractionData.extraction.volume} {extractionData.extraction.unit_measurement}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.extractionNotes', { defaultValue: 'Notas:' })}</strong> <span className="text-black">{extractionData.extraction.notes || 'N/A'}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.extractionAppearance', { defaultValue: 'Apariencia:' })}</strong> <span className="text-black">{extractionData.extraction.appearance}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </Col>

                            {/* Información de la muestra */}
                            <Col md={6} className="d-flex">
                                <div className="card shadow-sm border-0 rounded-3 w-100 h-100 d-flex flex-column">
                                    <div className="card-header bg-success text-white fs-5 d-flex align-items-center justify-content-center">
                                        {t('insemination.form.sampleCardTitle', { defaultValue: 'Información de la muestra' })}
                                    </div>
                                    <div className="card-body p-0 d-flex flex-column flex-grow-1">
                                        <ul className="list-group list-group-flush flex-grow-1">
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.sampleDiluent', { defaultValue: 'Insumos:' })}</strong> <span className="text-black">{extractionData.sample.lab_supplies?.map((s: any) => s.product_name).join(', ') || '-'}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.sampleConcentration', { defaultValue: 'Concentración (millones):' })}</strong> <span className="text-black">{extractionData.sample.concentration_million}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.sampleMotility', { defaultValue: 'Motilidad (%):' })}</strong> <span className="text-black">{extractionData.sample.motility_percent}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.sampleVitality', { defaultValue: 'Vitalidad (%):' })}</strong> <span className="text-black">{extractionData.sample.vitality_percent}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.sampleAbnormal', { defaultValue: 'Anomalías (%):' })}</strong> <span className="text-black">{extractionData.sample.abnormal_percent}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.samplePH', { defaultValue: 'pH:' })}</strong> <span className="text-black">{extractionData.sample.pH}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.sampleTemperature', { defaultValue: 'Temperatura (°C):' })}</strong> <span className="text-black">{extractionData.sample.temperature}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.sampleConservation', { defaultValue: 'Método de conservación:' })}</strong> <span className="text-black">{extractionData.sample.conservation_method}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>{t('insemination.form.sampleExpiration', { defaultValue: 'Fecha de expiración:' })}</strong> <span className="text-black">{new Date(extractionData.sample.expiration_date).toLocaleDateString()}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    ) : (
                        <div className="text-center py-5 d-flex flex-column align-items-center">
                            <Spinner color="primary" className="mb-3" />
                            <p className="text-muted mb-0">{t('insemination.form.loadingInfo', { defaultValue: 'Cargando información...' })}</p>
                        </div>
                    )}
                </ModalBody>
            </Modal>

            <Modal isOpen={pigDetailsmodalOpen} toggle={togglePigDetailsModal} size="lg" centered className="border-0" fullscreen={tabletMode}>
                <ModalHeader toggle={togglePigDetailsModal} className="border-0 pb-0">
                    <h4 className="modal-title text-primary fw-bold">{t('insemination.form.sowDetailsTitle', { defaultValue: 'Detalles de la cerda' })}</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    <PigDetailsModal pigId={idSelectedPig} showAllDetailsButton={false} />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={successModalOpen} onClose={onSave} message={t('insemination.form.success', { defaultValue: 'Inseminación registrada con éxito' })} />

        </>
    )
}

export default InseminationForm;
