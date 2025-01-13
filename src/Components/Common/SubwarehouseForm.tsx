import { useFormik } from 'formik';
import { useState } from 'react';
import { Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap';
import * as Yup from 'yup';

interface SubwarehouseFormProps {
    initialData?: SubwarehouseData;
    onSubmit: (data: SubwarehouseData) => Promise<void>;
    onCancel: () => void;
    isCodeDisabled?: boolean
}

interface Product {
    id: string;
    name: string;
    quantity: string;
    category: string;
    description: string;
    status: boolean;
    unit_measurement: string
}

export interface SubwarehouseData {
    id: string;
    name: string;
    location: string;
    manager: string;
    status: boolean;
    products: Product[]
    incomes: string[]
    outcomes: string[]
    isSubwarehouse: boolean
}

const validationSchema = Yup.object({
    id: Yup.string().required('Por favor, ingrese el código'),
    name: Yup.string().required('Por favor, ingrese el nombre'),
    location: Yup.string().required('Por favor, ingrese la ubicación'),
    manager: Yup.string().required('Por favor, ingrese el nombre del responsable')
})

const SubwarehouseForm: React.FC<SubwarehouseFormProps> = ({ initialData, onSubmit, onCancel, isCodeDisabled }) => {
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    const formik = useFormik({
        initialValues: initialData || {
            id: '',
            name: '',
            location: '',
            manager: '',
            status: true,
            products: [],
            incomes: [],
            outcomes: [],
            isSubwarehouse: true
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setSubmitting(true);
                await onSubmit(values);
            } catch (error) {
                console.error(`Error al enviar formulario: ${error}`)
                setShowErrorAlert(true);
                setTimeout(() => {
                    setShowErrorAlert(false)
                }, 5000);
            } finally {
                setSubmitting(false)
            }
        }
    })
    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>

                <div className="mt-4">
                    <Label htmlFor="idInput" className="form-label">Identificador</Label>
                    <Input
                        type="text"
                        id="idInput"
                        className="form-control w-50"
                        name="id"
                        value={formik.values.id}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.id && !!formik.errors.id}
                        disabled={isCodeDisabled}
                    />
                    {formik.touched.id && formik.errors.id && (
                        <FormFeedback>{formik.errors.id}</FormFeedback>
                    )}
                </div>

                <div className='mt-4'>
                    <Label htmlFor='nameInput' className='form-input'>Nombre</Label>
                    <Input
                        type='text'
                        id='nameInput'
                        className='form-control'
                        name='name'
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.name && !!formik.errors.name}
                    />
                    {formik.touched.name && formik.errors.name && (
                        <FormFeedback>{formik.errors.name}</FormFeedback>
                    )}
                </div>

                <div className='d-flex gap-2'>

                    <div className='mt-4 w-50'>
                        <Label htmlFor='managerInput' className='form-input'>Responsable</Label>
                        <Input
                            type='text'
                            id='managerInput'
                            className='form-control'
                            name='manager'
                            value={formik.values.manager}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.manager && !!formik.errors.manager}
                        />
                        {formik.touched.manager && formik.errors.manager && (
                            <FormFeedback>{formik.errors.manager}</FormFeedback>
                        )}
                    </div>

                    <div className='mt-4 w-50'>
                        <Label htmlFor='locationInput' className='form-input'>Ubicación</Label>
                        <Input
                            type='text'
                            id='locationInput'
                            className='form-control'
                            name='location'
                            value={formik.values.location}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.location && !!formik.errors.location}
                        />
                        {formik.touched.location && formik.errors.location && (
                            <FormFeedback>{formik.errors.location}</FormFeedback>
                        )}
                    </div>
                </div>

                <div className="d-flex justify-content-end mt-4 gap-2">
                    <Button color="danger" onClick={() => setCancelModalOpen(true)} disabled={formik.isSubmitting}>
                        Cancelar
                    </Button>
                    <Button color="success" type="submit" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? <Spinner></Spinner> : initialData ? "Actualizar Subalmacén" : "Registrar Subalmacén"}
                    </Button>
                </div>
            </form>

            {showErrorAlert && (
                <div
                    className="position-fixed bottom-0 start-50 translate-middle-x bg-danger text-white text-center p-3 rounded"
                    style={{
                        zIndex: 1050,
                        width: "90%",
                        maxWidth: "500px",
                    }}
                >
                    <span>El servicio no está disponible. Inténtelo de nuevo más tarde.</span>
                </div>
            )}


            <Modal isOpen={cancelModalOpen} centered toggle={() => setCancelModalOpen(!cancelModalOpen)}>
                <ModalHeader>Confirmación de Cancelación</ModalHeader>
                <ModalBody>
                    ¿Estás seguro de que deseas cancelar? Los datos no se guardarán.
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>
                        Sí, cancelar
                    </Button>
                    <Button color="success" onClick={() => setCancelModalOpen(false)}>
                        No, continuar
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    )
}

export default SubwarehouseForm;