import { getLoggedinUser } from 'helpers/api_helper';
import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, CardBody, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from 'reactstrap';
import * as Yup from 'yup'
import Flatpickr from 'react-flatpickr';
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import SelectTable from './SelectTable';
import { OrderData, ProductData } from 'common/data_interfaces';
import { ConfigContext } from 'App';
import classnames from "classnames";
import ObjectDetailsHorizontal from './ObjectDetailsHorizontal';
import CustomTable from './CustomTable';


interface OrderFormProps {
    initialData?: OrderData;
    onSubmit: (data: OrderData) => Promise<void>
    onCancel: () => void;
}

const orderAttributes = [
    { key: 'id', label: 'No. de Pedido' },
    { key: 'date', label: 'Fecha de pedido' },
]

const productsColumns = [
    { header: 'Codigo', accessor: 'id', isFilterable: true },
    { header: 'Nombre', accessor: 'name', isFilterable: true },
    { header: 'Cantidad Solicitada', accessor: 'quantity', isFilterable: true },
    { header: 'Unidad de medida', accessor: 'unit_measurement', isFilterable: true },
    { header: 'Categoria', accessor: 'category', isFilterable: true },
]


const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSubmit, onCancel }) => {

    const history = useNavigate()
    const [modals, setModals] = useState({ createWarehouse: false, cancel: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [orderOrigin, setOrderOrigin] = useState<string>('')
    const [orderDestiny, setOrderDestiny] = useState<string>('')
    const configContext = useContext(ConfigContext)
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
                    const result = await configContext?.axiosHelper.get(`${configContext.apiUrl}/orders/order_id_exists/${value}`)
                    return !result?.data.data
                } catch (error) {
                    console.error(`Error al validar el ID: ${error}`)
                    return false
                }
            }),
        date: Yup.string().required('Por favor, ingrese la fecha'),
        user: Yup.string().required('Por favor, seleccione el tipo de salida'),
    })

    const formik = useFormik({
        initialValues: initialData || {
            id: "",
            date: "",
            user: "",
            productsRequested: [],
            status: 'pending',
            orderOrigin: "AG001",
            orderDestiny: "",
            productsDelivered: []
        },
        enableReinitialize: true,
        validateOnBlur: false,
        validateOnChange: true,
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

    const handleProductSelect = (selectedProductsData: Array<{ id: string; quantity: number; price: number }>) => {
        formik.setFieldValue("productsRequested", selectedProductsData);

        const updatedSelectedProducts: any = selectedProductsData.map((selectedProduct) => {
            const productData = products.find((p: any) => p.id === selectedProduct.id) as ProductData | undefined;

            return productData
                ? { ...productData, ...selectedProduct }
                : selectedProduct;
        });

        setSelectedProducts(updatedSelectedProducts);
        console.log(updatedSelectedProducts)
    };


    const handleFetchWarehouseProducts = async () => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/AG001`);
            const products = response.data.data;

            const productsWithExistences = products.filter((obj: any) => obj.quantity !== 0);

            setProducts(productsWithExistences);
        } catch (error) {
            console.error(error);
            history("/auth-500");
        }
    };


    const fetchOrderOrigin = async () => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${formik.values.orderOrigin}`);
            const orderOrigin = response.data.data.name;

            setOrderOrigin(orderOrigin);
        } catch (error) {
            console.error('Ha ocurrido un error al obtener el origen de la orden');
        }
    };


    const fetchOrderDestiny = async () => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${configContext.userLogged.assigment}`);
            const orderDestiny = response.data.data;

            setOrderDestiny(orderDestiny.name);
            formik.setFieldValue('orderDestiny', orderDestiny.id);
        } catch (error) {
            console.error('Ha ocurrido un error al obtener el destino de la orden');
        }
    };


    const fetchNextId = async () => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/orders/order_next_id`);
            const nextId = response.data.data;
            formik.setFieldValue('id', nextId);
        } catch (error) {
            console.error('Ha ocurrido un error al obtener el id');
        }
    };

    useEffect(() => {
        handleFetchWarehouseProducts();
        fetchOrderOrigin();
        fetchOrderDestiny();
        fetchNextId();

        const today = new Date().toLocaleDateString('es-ES')
        formik.setFieldValue('date', today)

        if (configContext?.userLogged) {
            formik.setFieldValue('user', configContext.userLogged.username)
        }
    }, [])


    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }} className='form-steps'>

                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-orderData-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-orderData-tab"
                            >
                                Información de pedido
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
                            >
                                Resumen
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id='step-orderData-tab' tabId={1}>
                        <div className='d-flex gap-3'>
                            <div className="w-50">
                                <Label htmlFor="idInput" className="form-label">Identificador</Label>
                                <Input
                                    type="text"
                                    id="idInput"
                                    name="id"
                                    value={formik.values.id}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.id && !!formik.errors.id}
                                />
                                {formik.touched.id && formik.errors.id && <FormFeedback>{formik.errors.id}</FormFeedback>}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="dateInput" className="form-label">Fecha</Label>

                                <Flatpickr
                                    id="dateInput"
                                    className="form-control"
                                    value={formik.values.date}
                                    options={{
                                        dateFormat: "d-m-Y",
                                        defaultDate: formik.values.date,
                                    }}
                                    onChange={(date) => {
                                        const formattedDate = date[0].toLocaleDateString("es-ES");
                                        formik.setFieldValue("date", formattedDate);
                                    }}
                                />
                                {formik.touched.date && formik.errors.date && <FormFeedback className="d-block">{formik.errors.date}</FormFeedback>}

                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="userInput" className="form-label">¿Quién hace el pedido?</Label>
                            <Input
                                type="text"
                                id="userInput"
                                name="userDisplay"
                                value={`${configContext?.userLogged?.name} ${configContext?.userLogged?.lastname}` || ''}
                                disabled
                            />
                            <Input type="hidden" name="user" value={formik.values.user} />
                            {formik.touched.user && formik.errors.user && (
                                <FormFeedback>{formik.errors.user}</FormFeedback>
                            )}
                        </div>

                        <div className='d-flex gap-3 mt-4'>
                            <div className='w-50'>
                                <Label>Pedido desde:</Label>
                                <Input
                                    type="text"
                                    id="orderOriginInput"
                                    name="orderOrigin"
                                    value={orderOrigin || ''}
                                    disabled
                                />
                                <Input type="hidden" name="orderOrigin" value={formik.values.orderOrigin} />
                                {formik.touched.orderOrigin && formik.errors.orderOrigin && (
                                    <FormFeedback>{formik.errors.orderOrigin}</FormFeedback>
                                )}
                            </div>

                            <div className='position-relative mt-3'>
                                <i className=' ri-arrow-right-line position-absolute top-50 start-50 translate-middle'></i>
                            </div>

                            <div className='w-50'>
                                <Label>Pedido para:</Label>
                                <Input
                                    type="text"
                                    id="orderDestinyInput"
                                    name="orderDestiny"
                                    value={orderDestiny || ''}
                                    disabled
                                />
                                <Input type="hidden" name="orderDestiny" value={formik.values.orderDestiny} />
                                {formik.touched.orderDestiny && formik.errors.orderDestiny && (
                                    <FormFeedback>{formik.errors.orderDestiny}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="d-flex mt-4">
                            <Button
                                className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button"
                                onClick={() => {
                                    toggleArrowTab(activeStep + 1);
                                }}
                            >
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                Siguiente
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id='step-products-tab' tabId={2}>
                        {/* Productos */}
                        <div className="border border-0 d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(65vh - 100px)', overflowY: 'hidden' }}>
                            <SelectTable data={products} onProductSelect={handleProductSelect} showStock={true} showPagination={false}></SelectTable>
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
                                onClick={() => {
                                    toggleArrowTab(activeStep + 1);
                                }}
                            >
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                Siguiente
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id='step-summary-tab' tabId={3}>
                        <Card style={{ backgroundColor: '#A3C293' }}>
                            <CardBody className="pt-4">
                                <ObjectDetailsHorizontal attributes={orderAttributes} object={formik.values} />
                            </CardBody>
                        </Card>

                        <Card style={{ height: '49vh' }}>
                            <CardBody className="border border-0 d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(64vh - 100px)', overflowY: 'auto' }}>
                                <CustomTable columns={productsColumns} data={selectedProducts} showSearchAndFilter={false} showPagination={false} />
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
                    <Button color="danger" onClick={onCancel}>Sí, cancelar</Button>
                    <Button color="success" onClick={() => toggleModal('cancel', false)}>No, continuar</Button>
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

export default OrderForm