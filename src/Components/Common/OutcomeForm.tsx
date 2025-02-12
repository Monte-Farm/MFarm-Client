import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Col, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from 'reactstrap';
import * as Yup from 'yup'
import Flatpickr from 'react-flatpickr';
import { useFormik } from 'formik';
import SubwarehouseForm from './SubwarehouseForm';
import { useNavigate } from 'react-router-dom';
import SelectTable from './SelectTable';
import { OutcomeData, SubwarehouseData } from 'common/data_interfaces';
import { ConfigContext } from 'App';

interface OutcomeFormProps {
    initialData?: OutcomeData;
    onSubmit: (data: OutcomeData) => Promise<void>
    onCancel: () => void;
}

const OutcomeForm: React.FC<OutcomeFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const history = useNavigate()
    const warehouseId = 'AG001'
    const [modals, setModals] = useState({ createWarehouse: false, cancel: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const configContext = useContext(ConfigContext);
    const [subwarehouses, setSubwarehouses] = useState<SubwarehouseData[]>([])
    const [selectedSubwarehouse, setSelectedSubwarehouse] = useState<SubwarehouseData | null>(null)
    const [products, setProducts] = useState([])

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
        warehouseDestiny: Yup.string().required('Por favor, seleccione un subalmacén')
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
            id: "",
            date: "",
            products: [],
            totalPrice: 0,
            outcomeType: "",
            status: true,
            warehouseDestiny: "",
            warehouseOrigin: warehouseId
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

    const handleSubwarehouseChange = (subwarehouseId: string) => {
        const subwarehouse = subwarehouses.find((s) => s.id === subwarehouseId) || null;
        setSelectedSubwarehouse(subwarehouse);
        formik.setFieldValue("warehouseDestiny", subwarehouseId);
    };

    const handleProductSelect = (selectedProducts: Array<{ id: string; quantity: number; price: number }>) => {
        formik.setFieldValue("products", selectedProducts);
    };

    const handleFetchsubwarehouses = async () => {
        if (!configContext) return;

        try {
            const response = await configContext?.axiosHelper.get(`${configContext.apiUrl}/warehouse`);
            const warehouses = response.data.data;

            setSubwarehouses(
                warehouses.filter((obj: any) => obj.id !== warehouseId && obj.status !== false)
            );
        } catch (error) {
            console.error(error);
            history('/auth-500');
        }
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
        if (!configContext) return;

        try {
            const response = await configContext?.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${warehouseId}`);
            const products = response.data.data;

            const productsWithExistences = products.filter((obj: any) => obj.quantity !== 0);
            setProducts(productsWithExistences);
        } catch (error) {
            console.error(error);
            history('/auth-500');
        }
    };


    const handleCreateWarehouse = async (data: SubwarehouseData) => {
        if (!configContext) return;

        try {
            const response = await configContext?.axiosHelper.create(`${configContext.apiUrl}/warehouse/create_warehouse`, data);

            showAlert('success', 'Subalmacén agregado con éxito');
            await handleFetchsubwarehouses();
            const newWarehouse = response.data.data;
            setSelectedSubwarehouse(newWarehouse);
            formik.setFieldValue('warehouseDestiny', newWarehouse.id);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al agregar el nuevo subalmacén, intentelo más tarde');
        } finally {
            toggleModal('createWarehouse', false);
        }
    };


    useEffect(() => {
        handleFetchsubwarehouses();
        handleFetchWarehouseProducts();
        fetchNextId();
    }, [])

    useEffect(() => {
        const subwarehouse = subwarehouses.find((s) => s.id === formik.values.warehouseDestiny) || null;
        setSelectedSubwarehouse(subwarehouse)
    }, [formik.values.warehouseDestiny, subwarehouses])

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
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

                {/* Datos del subalmacen */}
                <div className="d-flex mt-4">
                    <h5 className="me-auto">Datos del Subalmacén</h5>
                    <Button className="h-50 mb-2 farm-primary-button" onClick={() => toggleModal('createWarehouse')}>
                        <i className="ri-add-line me-2"></i>
                        Nuevo Subalmacén
                    </Button>
                </div>

                <div className="border"></div>

                <div className="mt-3">
                    <Label htmlFor="warehouseDestinyInput" className="form-label">Subalmacén</Label>
                    <Input
                        type="select"
                        id="warehouseDestinyInput"
                        name="warehouseDestiny"
                        value={formik.values.warehouseDestiny} // Valor controlado por formik
                        onChange={(e) => handleSubwarehouseChange(e.target.value)}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.warehouseDestiny && !!formik.errors.warehouseDestiny}
                    >
                        <option value=''>Seleccione un subalmacén</option>
                        {subwarehouses.map((subwarehouse) => (
                            <option key={subwarehouse.id} value={subwarehouse.id}>
                                {subwarehouse.name}
                            </option>
                        ))}
                    </Input>

                    {formik.touched.warehouseDestiny && formik.errors.warehouseDestiny && <FormFeedback>{formik.errors.warehouseDestiny}</FormFeedback>}
                </div>

                <Row className="mt-4">
                    <Col lg={6}>
                        <Label htmlFor="warehouseManager" className="form-label">Responsable</Label>
                        <Input type="text" className="form-control" id="warehouseManager" value={selectedSubwarehouse?.manager} disabled></Input>
                    </Col>

                    <Col lg={6}>
                        <Label htmlFor="warehouseLocation" className="form-label">Ubicación</Label>
                        <Input type="text" className="form-control" id="warehouseLocation" value={selectedSubwarehouse?.location} disabled></Input>
                    </Col>
                </Row>

                {/* Productos */}
                <div className="d-flex mt-5">
                    <h5 className="me-auto">Productos</h5>
                </div>
                <div className="border"></div>

                <div className="mt-3 border border-0">
                    <SelectTable data={products} onProductSelect={handleProductSelect} showStock={true}></SelectTable>
                </div>

                <div className='d-flex justify-content-end mt-4 gap-2'>
                    <Button className='farm-secondary-button' disabled={formik.isSubmitting} onClick={() => toggleModal('cancel')}>
                        Cancelar
                    </Button>

                    <Button className='farm-primary-button' type='submit' disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? <Spinner /> : "Guardar"}
                    </Button>
                </div>
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

            <Modal size='lg' isOpen={modals.createWarehouse} toggle={() => toggleModal('createWarehouse', false)} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal('createWarehouse')}>Nuevo Subalmacén</ModalHeader>
                <ModalBody>
                    <SubwarehouseForm onSubmit={handleCreateWarehouse} onCancel={() => toggleModal('createWarehouse', false)} />
                </ModalBody>
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

export default OutcomeForm;