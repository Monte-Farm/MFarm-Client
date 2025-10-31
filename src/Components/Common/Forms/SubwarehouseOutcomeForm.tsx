import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, CardBody, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from 'reactstrap';
import * as Yup from 'yup'
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { OutcomeData, ProductData } from 'common/data_interfaces';
import { ConfigContext } from 'App';
import classnames from "classnames";
import ObjectDetailsHorizontal from '../ObjectDetailsHorizontal';

import { Column } from 'common/data/data_types';
import DatePicker from 'react-flatpickr';
import CustomTable from '../Tables/CustomTable';
import SelectTable from '../Tables/SelectTable';

interface OutcomeFormProps {
    initialData?: OutcomeData;
    onSubmit: (data: OutcomeData) => Promise<void>
    onCancel: () => void;
}

const outcomeAttributes = [
    { key: 'id', label: 'Identificador' },
    { key: 'date', label: 'Fecha' },
    { key: 'warehouseDestiny', label: 'Almacén de destino' },
    { key: 'outcomeType', label: 'Motivo de salida' },
    { key: 'description', label: 'Descripción' },
]

const productColumns: Column<any>[] = [
    { header: 'Código', accessor: 'id', isFilterable: true, type: 'text' },
    { header: 'Producto', accessor: 'name', isFilterable: true, type: 'text' },
    { header: 'Cantidad', accessor: 'quantity', isFilterable: true, type: 'number' },
    { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true, type: 'text' },
    { header: 'Precio Unitario', accessor: 'price', type: 'currency' },
    { header: 'Categoría', accessor: 'category', isFilterable: true, type: 'text' },
];


const SubwarehouseOutcomeForm: React.FC<OutcomeFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const history = useNavigate()
    const [modals, setModals] = useState({ createWarehouse: false, cancel: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const configContext = useContext(ConfigContext);
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState([])

    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);

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
        id: Yup.string()
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
        date: Yup.string().required('Por favor, ingrese la fecha'),
        outcomeType: Yup.string().required('Por favor, seleccione el tipo de salida'),
        description: Yup.string().required('Por favor, ingrese la descripción de la salida')
    })

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        showAlert('danger', message);
    }

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
            warehouseDestiny: "",
            warehouseOrigin: configContext?.userLogged?.assigment,
            description: ""
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                setSubmitting(true);
                await onSubmit(values);
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
        console.log(updatedSelectedProducts)
    };

    const fetchNextId = async () => {
        if (!configContext) return;

        try {
            const response = await configContext?.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_next_id`);
            const nextId = response.data.data;
            formik.setFieldValue('id', nextId);
        } catch (error) {
            console.error('Ha ocurrido un error obteniendo el id');
        }
    };


    const handleFetchWarehouseProducts = async () => {
        if (!configContext || !configContext.userLogged) return;

        try {
            const response = await configContext?.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${configContext.userLogged.assigment}`);
            const products = response.data.data;

            const productsWithExistences = products.filter((obj: any) => obj.quantity !== 0);
            setProducts(productsWithExistences);
        } catch (error) {
            console.error(error);
            history('/auth-500');
        }
    };


    useEffect(() => {
        if (!configContext || !configContext.userLogged) return;
        handleFetchWarehouseProducts();
        fetchNextId();
    }, [configContext])

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
                                <Label htmlFor="idInput" className="form-label">Identificador</Label>
                                <Input
                                    type="text"
                                    id="idInput"
                                    name="id"
                                    value={formik.values.code}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.code && !!formik.errors.code}
                                />
                                {formik.touched.code && formik.errors.code && <FormFeedback>{formik.errors.code}</FormFeedback>}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="date" className="form-label">Fecha</Label>

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
                                {configContext?.configurationData?.outcomeTypes.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </Input>
                            {formik.touched.outcomeType && formik.errors.outcomeType && <FormFeedback>{formik.errors.outcomeType}</FormFeedback>}
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

                            <Button className='farm-primary-button ms-auto' type='submit' disabled={formik.isSubmitting}>
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

            {/* Alerta */}
            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </>
    )
}

export default SubwarehouseOutcomeForm;