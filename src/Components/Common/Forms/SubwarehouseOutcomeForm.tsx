import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, CardBody, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from 'reactstrap';
import * as Yup from 'yup'
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { Attribute, OutcomeData, ProductData } from 'common/data_interfaces';
import { ConfigContext } from 'App';
import classnames from "classnames";
import ObjectDetailsHorizontal from '../Details/ObjectDetailsHorizontal';
import { Column } from 'common/data/data_types';
import DatePicker from "react-flatpickr";
import CustomTable from '../Tables/CustomTable';
import SelectTable from '../Tables/SelectTable';
import { getLoggedinUser } from 'helpers/api_helper';
import SuccessModal from '../Shared/SuccessModal';
import ErrorModal from '../Shared/ErrorModal';
import AlertMessage from '../Shared/AlertMesagge';
import LoadingAnimation from '../Shared/LoadingAnimation';

interface OutcomeFormProps {
    initialData?: OutcomeData;
    onSave: () => void;
    onCancel: () => void;
}

const outcomeAttributes: Attribute[] = [
    { key: 'code', label: 'Identificador', type: 'text' },
    { key: 'date', label: 'Fecha', type: 'date' },
    { key: 'warehouseDestiny', label: 'Almacén de destino', type: 'text' },
    { key: 'outcomeType', label: 'Motivo de salida', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'text' },
]

const productColumns: Column<any>[] = [
    { header: 'Código', accessor: 'id', isFilterable: true, type: 'text' },
    { header: 'Producto', accessor: 'name', isFilterable: true, type: 'text' },
    { header: 'Cantidad', accessor: 'quantity', isFilterable: true, type: 'number' },
    { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true, type: 'text' },
    { header: 'Precio Unitario', accessor: 'price', type: 'currency' },
    { header: 'Categoría', accessor: 'category', isFilterable: true, type: 'text' },
];


const SubwarehouseOutcomeForm: React.FC<OutcomeFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ createWarehouse: false, cancel: false, success: false, error: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState([])
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(true);

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 3) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const validationSchema = Yup.object({
        code: Yup.string()
            .required('Por favor, ingrese el ID')
            .test('unique_id', 'Este identificador ya existe, por favor ingrese otro', async (value) => {
                if (!value) return false
                try {
                    const result = await configContext?.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_id_exists/${value}`)
                    return !result?.data.data
                } catch (error) {
                    console.error(`Error al validar el ID: ${error}`)
                    return false
                }
            }),
        date: Yup.date().required('Por favor, ingrese la fecha'),
        outcomeType: Yup.string().required('Por favor, seleccione el tipo de salida'),
        description: Yup.string().required('Por favor, ingrese la descripción de la salida')
    })

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const formik = useFormik({
        initialValues: initialData || {
            code: "",
            date: null,
            products: [],
            totalPrice: 0,
            outcomeType: "",
            status: true,
            warehouseDestiny: null,
            warehouseOrigin: userLogged?.assigment,
            description: ""
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            if (!configContext || !userLogged) return;
            try {
                setSubmitting(true);
                try {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/outcomes/create_outcome/${false}/${values.outcomeType}`, values);
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Registro de salida de inventario ${values.code}`
                    });

                    toggleModal('success')
                } catch (error) {
                    console.error(error, 'Ha ocurrido un error creando la salida')
                    toggleModal('error')
                }
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleProductSelect = (selectedProductsData: Array<{ id: string; quantity: number; price: number }>) => {
        formik.setFieldValue("products", selectedProductsData);

        const updatedSelectedProducts: any = selectedProductsData.map((selectedProduct) => {
            const productData = products.find((p: any) => p.id === selectedProduct.id) as ProductData | undefined;

            return productData
                ? { ...productData, ...selectedProduct }
                : selectedProduct;
        });

        setSelectedProducts(updatedSelectedProducts);
    };

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const [productsResponse, nextCodeResponse] = await Promise.all([
                configContext?.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${configContext.userLogged.assigment}`),
                configContext?.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_next_id`),
            ])

            formik.setFieldValue('code', nextCodeResponse.data.data);
            const productsWithExistences = productsResponse.data.data.filter((obj: any) => obj.quantity !== 0);
            setProducts(productsWithExistences);
        } catch (error) {
            console.error('Error fetching data: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData();
        formik.setFieldValue('date', new Date());
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }} className='form-steps'>

                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-outcomeData-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-outcomeData-tab"
                                disabled
                            >
                                Información de salida
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-products-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-products-tab"
                                disabled
                            >
                                Selección de productos
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-summary-tab"
                                disabled
                            >
                                Resumen
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id='step-outcomeData-tab' tabId={1}>
                        <div className='d-flex gap-3'>
                            <div className="w-50">
                                <Label htmlFor="codeInput" className="form-label">Identificador</Label>
                                <Input
                                    type="text"
                                    id="codeInput"
                                    name="code"
                                    value={formik.values.code}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.code && !!formik.errors.code}
                                />
                                {formik.touched.code && formik.errors.code && <FormFeedback>{formik.errors.code}</FormFeedback>}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="date" className="form-label">Fecha de extracción</Label>
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

                        {/* Tipo de salida */}
                        <div className='mt-4'>
                            <Label htmlFor='outcomeTypeInput' className='form-label'>Motivo de Salida</Label>
                            <Input
                                type='select'
                                id='outcomeTypeInput'
                                name='outcomeType'
                                value={formik.values.outcomeType}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.outcomeType && !!formik.errors.outcomeType}
                            >
                                <option value=''>Seleccione un motivo</option>

                                <option value='consumption'>Consumo interno</option>
                                <option value='treatment'>Tratamiento veterinario</option>
                                <option value='mortality'>Baja por mortalidad</option>
                                <option value='sale'>Venta</option>
                                <option value='transfer'>Transferencia a otra área</option>
                                <option value='production_use'>Uso en producción</option>
                                <option value='waste'>Desecho / Caducado</option>
                                <option value='loss'>Pérdida / Extraviado</option>
                                <option value='adjustment'>Ajuste de inventario</option>

                            </Input>
                            {formik.touched.outcomeType && formik.errors.outcomeType && (
                                <FormFeedback>{formik.errors.outcomeType}</FormFeedback>
                            )}
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="descriptionInput" className="form-label">Descripción</Label>
                            <Input
                                type="text"
                                id="descriptionInput"
                                name="description"
                                value={formik.values.description}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.description && !!formik.errors.description}
                            />
                            {formik.touched.description && formik.errors.description && <FormFeedback>{formik.errors.description}</FormFeedback>}
                        </div>

                        <div className="d-flex mt-4">
                            <Button
                                className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button"
                                onClick={() => {
                                    toggleArrowTab(activeStep + 1);
                                }}
                                disabled={
                                    !formik.values.code ||
                                    !formik.values.date ||
                                    !formik.values.outcomeType ||
                                    !formik.values.description
                                }
                            >
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                Siguiente
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id='step-products-tab' tabId={2}>
                        {/* Productos */}
                        <div className="d-flex">
                            <h5 className="me-auto">Productos</h5>
                        </div>
                        <div className="border"></div>

                        <div className="border border-0 d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(65vh - 100px)', overflowY: 'hidden' }}>
                            <SelectTable data={products} onProductSelect={handleProductSelect} showStock={true} showPagination={false} />
                        </div>

                        <div className="d-flex mt-4">
                            <Button
                                className="btn btn-light btn-label previestab farm-secondary-button"
                                onClick={() => {
                                    toggleArrowTab(activeStep - 1);
                                }}
                            >
                                <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                Atras
                            </Button>

                            <Button
                                className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button"
                                onClick={() => toggleArrowTab(activeStep + 1)}
                                disabled={
                                    formik.values.products.length === 0 ||
                                    formik.values.products.some(product => !product.quantity || product.quantity <= 0 || !product.price || product.price <= 0)
                                }
                            >
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                Siguiente
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id='step-summary-tab' tabId={3}>
                        <Card style={{ backgroundColor: '#A3C293' }}>
                            <CardBody className="pt-4">
                                <ObjectDetailsHorizontal attributes={outcomeAttributes} object={formik.values} />
                            </CardBody>
                        </Card>

                        <Card style={{ height: '49vh' }}>
                            <CardBody className="border border-0 d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(64vh - 100px)', overflowY: 'auto' }}>
                                <CustomTable columns={productColumns} data={selectedProducts} showSearchAndFilter={false} showPagination={false} />
                            </CardBody>
                        </Card>

                        <div className='d-flex mt-4 gap-2'>
                            <Button
                                className="btn btn-light btn-label previestab farm-secondary-button"
                                onClick={() => {
                                    toggleArrowTab(activeStep - 1);
                                }}
                            >
                                <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                Atras
                            </Button>

                            <Button className='farm-primary-button ms-auto' type='submit' onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? <Spinner /> : "Guardar"}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            {/* Modal de Cancelar */}
            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal('cancel', false)}>
                <ModalHeader>Confirmación</ModalHeader>
                <ModalBody>¿Estás seguro de que deseas cancelar? Los datos no se guardarán.</ModalBody>
                <ModalFooter>
                    <Button className='farm-secondary-button' onClick={onCancel}>Sí, cancelar</Button>
                    <Button className='farm-primary-button' onClick={() => toggleModal('cancel', false)}>No, continuar</Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Salida creada exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message="Ha ocurrido un error creando la salida, intentelo mas tarde" />
        </>
    )
}

export default SubwarehouseOutcomeForm;