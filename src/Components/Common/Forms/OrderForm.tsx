import { useContext, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from 'reactstrap';
import * as Yup from 'yup'
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { Attribute, OrderData, ProductData } from 'common/data_interfaces';
import { ConfigContext } from 'App';
import classnames from "classnames";
import ObjectDetailsHorizontal from '../Details/ObjectDetailsHorizontal';
import { Column } from 'common/data/data_types';
import DatePicker from 'react-flatpickr';
import CreateOrderTable from '../Tables/CreateOrderTable';
import CustomTable from '../Tables/CustomTable';
import { getLoggedinUser } from 'helpers/api_helper';
import LoadingAnimation from '../Shared/LoadingAnimation';
import AlertMessage from '../Shared/AlertMesagge';
import SuccessModal from '../Shared/SuccessModal';
import ErrorModal from '../Shared/ErrorModal';
import ObjectDetails from '../Details/ObjectDetails';


interface OrderFormProps {
    initialData?: OrderData;
    onSave: () => void;
    onCancel: () => void;
}

const productsColumns: Column<any>[] = [
    { header: 'Codigo', accessor: 'id', isFilterable: true, type: 'text' },
    { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
    {
        header: 'Cantidad Solicitada',
        accessor: 'quantity',
        isFilterable: true,
        type: 'number',
        render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>
    },
    {
        header: 'Categoria',
        accessor: 'category',
        isFilterable: true,
        type: 'text',
        render: (value: string) => {
            let color = "secondary";
            let label = value;

            switch (value) {
                case "nutrition":
                    color = "info";
                    label = "Nutrición";
                    break;
                case "medications":
                    color = "warning";
                    label = "Medicamentos";
                    break;
                case "vaccines":
                    color = "primary";
                    label = "Vacunas";
                    break;
                case "vitamins":
                    color = "success";
                    label = "Vitaminas";
                    break;
                case "minerals":
                    color = "success";
                    label = "Minerales";
                    break;
                case "supplies":
                    color = "success";
                    label = "Insumos";
                    break;
                case "hygiene_cleaning":
                    color = "success";
                    label = "Higiene y desinfección";
                    break;
                case "equipment_tools":
                    color = "success";
                    label = "Equipamiento y herramientas";
                    break;
                case "spare_parts":
                    color = "success";
                    label = "Refacciones y repuestos";
                    break;
                case "office_supplies":
                    color = "success";
                    label = "Material de oficina";
                    break;
                case "others":
                    color = "success";
                    label = "Otros";
                    break;
            }

            return <Badge color={color}>{label}</Badge>;
        },
    },
    {
        header: 'Observaciones',
        accessor: 'observations',
        isFilterable: true,
        type: 'text',
        render: (_, row) => row.observations === '' ? <span>Sin observaciones</span> : <span>{row.observations}</span>
    },
]

const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ createWarehouse: false, cancel: false, success: false, error: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [orderOrigin, setOrderOrigin] = useState<string>('')
    const [orderDestiny, setOrderDestiny] = useState<string>('')
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

    const orderAttributes: Attribute[] = [
        { key: 'id', label: 'No. de Pedido', type: 'text' },
        { key: 'date', label: 'Fecha de pedido', type: 'date' },
        {
            key: 'user',
            label: 'Pedido por',
            type: 'text',
            render: (value) => <span>{userLogged.name} {userLogged.lastname}</span>
        },
        {
            key: 'orderOrigin',
            label: 'Pedido para',
            type: 'text',
            render: (value) => <span>{orderOrigin}</span>
        },
        {
            key: 'orderDestiny',
            label: 'Pedido hacia',
            type: 'text',
            render: (value) => <span>{orderDestiny}</span>
        },
    ]

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
            date: null,
            user: userLogged._id,
            productsRequested: [],
            status: 'pending',
            orderOrigin: "",
            orderDestiny: "",
            productsDelivered: []
        },
        enableReinitialize: true,
        validateOnBlur: false,
        validateOnChange: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                if (!configContext || !userLogged) return
                setSubmitting(true);

                await configContext.axiosHelper.create(`${configContext.apiUrl}/orders/create_order`, values);
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Pedido ${values.id} creado`
                });

                toggleModal('success')
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
                toggleModal('error');
            } finally {
                setSubmitting(false);
            }
        },
    });


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
    };

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)

            const [nextIdResponse, farmResponse, orderDestinyResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/orders/order_next_id`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/farm/find_by_id/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${userLogged.assigment}`),
            ])

            formik.setFieldValue('id', nextIdResponse.data.data);
            const main_warehouse = farmResponse.data.data.main_warehouse;

            setOrderDestiny(orderDestinyResponse.data.data.name);
            formik.setFieldValue('orderDestiny', orderDestinyResponse.data.data._id);

            const [orderOriginResponse, productsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${main_warehouse}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${main_warehouse}`),
            ])

            const productsWithExistences = productsResponse.data.data.filter((obj: any) => obj.quantity !== 0);
            setProducts(productsWithExistences);

            setOrderOrigin(orderOriginResponse.data.data.name);
            formik.setFieldValue('orderOrigin', orderOriginResponse.data.data._id);
        } catch (error) {
            console.error('Error fetching data:', { error });
            toggleModal('error');
        } finally {
            setLoading(false)
        }
    }

    const checkOrderData = async () => {
        formik.setTouched({
            id: true,
            date: true,
        });

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(2);
        } catch (err) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor ingrese todos los datos' })
        }
    }

    const checkProductsSelected = () => {
        if (formik.values.productsRequested.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Seleccione al menos 1 producto' })
        } else {
            toggleArrowTab(activeStep + 1)
        }
    }

    useEffect(() => {
        fetchData();
        formik.setFieldValue('date', new Date())
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
                                id="step-orderData-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-orderData-tab"
                                disabled
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

                        <div className="mt-4">
                            <Label htmlFor="userInput" className="form-label">¿Quién hace el pedido?</Label>
                            <Input
                                type="text"
                                id="userInput"
                                name="userDisplay"
                                value={`${userLogged?.name} ${userLogged?.lastname}` || ''}
                                disabled
                            />
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
                            <Button className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button" onClick={() => checkOrderData()}>
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                Siguiente
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id='step-products-tab' tabId={2}>
                        <Label>Seleccion de productos para el pedido</Label>
                        <div className="border border-0 d-flex flex-column flex-grow-1">
                            <CreateOrderTable data={products} onProductSelect={handleProductSelect} showStock={true} showPagination={false} />
                        </div>

                        <div className="d-flex mt-4">
                            <Button className="btn btn-light btn-label previestab farm-secondary-button" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                Atras
                            </Button>

                            <Button className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button" onClick={() => checkProductsSelected()}>
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                Siguiente
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id='step-summary-tab' tabId={3}>
                        <div className='d-flex gap-3'>
                            <Card>
                                <CardHeader className='bg-light'>
                                    <h5>Informacion del pedido</h5>
                                </CardHeader>
                                <CardBody className="pt-4">
                                    <ObjectDetails attributes={orderAttributes} object={formik.values} />
                                </CardBody>
                            </Card>

                            <Card className='w-100'>
                                <CardHeader className='bg-light'>
                                    <h5>Productos seleccionados</h5>
                                </CardHeader>
                                <CardBody className="p-0">
                                    <CustomTable columns={productsColumns} data={selectedProducts} showSearchAndFilter={false} showPagination={true} rowsPerPage={6} />
                                </CardBody>
                            </Card>
                        </div>


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
            </form >


            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal('cancel', false)}>
                <ModalHeader>Confirmación</ModalHeader>
                <ModalBody>¿Estás seguro de que deseas cancelar? Los datos no se guardarán.</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>Sí, cancelar</Button>
                    <Button color="success" onClick={() => toggleModal('cancel', false)}>No, continuar</Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={'Pedido creado con exito'} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={'El servicio no esta disponible, intentelo mas tarde'} />
        </>
    )
}

export default OrderForm