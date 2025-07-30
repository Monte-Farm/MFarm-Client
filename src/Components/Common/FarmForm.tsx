import React, { useContext, useEffect, useState } from 'react';
import { Button, Form, FormGroup, Label, Input, Spinner, FormFeedback, Row, Col, Card, CardBody, CardImg, CardText, Badge, Modal, ModalBody, ModalHeader, Alert } from 'reactstrap';
import axios from 'axios';
import { FarmData, UserData } from 'common/data_interfaces';
import { ConfigContext } from 'App';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import defaultProfile from '../../assets/images/default-profile-mage.jpg';
import UserForm from './UserForm';
import { getLoggedinUser } from 'helpers/api_helper';

interface FarmFormProps {
    data?: Partial<FarmData> & { _id?: string };
    onSave: () => void;
    onCancel: () => void;
}

const FarmForm: React.FC<FarmFormProps> = ({ data, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [managers, setManagers] = useState<UserData[]>([]);
    const [modals, setModals] = useState({ details: false, create: false, update: false, delete: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });


    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }


    const validationSchema = Yup.object({
        name: Yup.string().required('El nombre es obligatorio'),
        code: Yup.string()
            .required('El código es obligatorio')
            .test('unique_code', 'Este codigo ya existe, por favor ingrese otro', async (value) => {
                if (data) return true
                if (!value) return false
                if (!configContext) return true
                try {
                    const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/check_code_exists/${value}`)
                    return !response.data.data.exists
                } catch (error) {
                    console.error('Error checking farm code:', error);
                    return false;
                }
            }),
        location: Yup.string().required('La ubicación es obligatoria'),
    });

    const formik = useFormik({
        initialValues: {
            name: data?.name || '',
            code: data?.code || '',
            location: data?.location || '',
            status: data?.status ?? true,
            manager: data?.manager || '',
        },
        enableReinitialize: true,
        validationSchema,
        validateOnBlur: true,
        validateOnChange: false,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;

            if (!values.manager) {
                handleError(null, "Debes seleccionar un encargado para la granja");
                setSubmitting(false);
                return;
            }

            try {
                if (data && data._id) {
                    await configContext.axiosHelper.update(`${configContext.apiUrl}/farm/update/${data?._id}`, values);
                } else {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/farm/create`, values);
                }
                onSave();
            } catch (error) {
                console.error('Error al guardar la granja:', error);
                handleError(error, 'Ha ocurrido un error al guardar la granja, intentelo más tarde');
            } finally {
                setSubmitting(false);
            }
        },

    });

    const fetchManagerUsers = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_role/farm_manager`);
            const filteredManagers = response.data.data.filter((manager: UserData) => manager.status === true && manager.farm_assigned === null);
            setManagers(filteredManagers);
        } catch (error) {
            console.error('Error fetching manager users:', error);
        }
    };

    const handleCreateUser = async (data: UserData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/create_user`, data);
            showAlert('success', 'Usuario creado con éxito');
            fetchManagerUsers();
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al crear el usuario, intentelo más tarde');
        } finally {
            toggleModal('create', false);
        }
    };

    useEffect(() => {
        fetchManagerUsers();
    }, []);

    const isSelected = (id: string) => formik.values.manager === id;

    return (
        <Form onSubmit={formik.handleSubmit}>
            <Row>
                <Col lg={6}>
                    <div className='d-flex justify-content-between align-items-center mb-3'>
                        <h5>Información de la granja</h5>
                    </div>

                    <FormGroup className="">
                        <Label>Código</Label>
                        <Input
                            name="code"
                            value={formik.values.code}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.code && !!formik.errors.code}
                        />
                        {formik.touched.code && formik.errors.code && (
                            <FormFeedback>{formik.errors.code}</FormFeedback>
                        )}
                    </FormGroup>

                    <FormGroup className="">
                        <Label>Nombre</Label>
                        <Input
                            name="name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.name && !!formik.errors.name}
                        />
                        {formik.touched.name && formik.errors.name && (
                            <FormFeedback>{formik.errors.name}</FormFeedback>
                        )}
                    </FormGroup>


                    <FormGroup>
                        <Label>Ubicación</Label>
                        <Input
                            name="location"
                            value={formik.values.location}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.location && !!formik.errors.location}
                        />
                        {formik.touched.location && formik.errors.location && (
                            <FormFeedback>{formik.errors.location}</FormFeedback>
                        )}
                    </FormGroup>
                </Col>

                <Col lg={6}>
                    <div className='d-flex align-items-center mb-3'>
                        <h5 className="me-auto">Selecciona un encargado</h5>
                        <Button size='sm' onClick={() => toggleModal('create')}>
                            <i className="ri-add-line me-2" />
                            Nuevo Encargado
                        </Button>
                    </div>

                    <div className="managers-grid" style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {managers.length === 0 && <div>No se encontraron encargados</div>}
                        {managers.map(manager => (
                            <Card
                                key={manager._id}
                                className={`manager-card ${isSelected(manager._id || "") ? 'selected' : ''}`}
                                style={{ cursor: 'pointer', position: 'relative' }}
                                onClick={() => formik.setFieldValue('manager', manager._id)}
                            >
                                <CardImg
                                    top
                                    src={manager.profile_image || defaultProfile}
                                    alt={`${manager.name} ${manager.lastname}`}
                                    onError={e => { (e.target as HTMLImageElement).src = defaultProfile; }}
                                    style={{ height: 120, objectFit: 'cover' }}
                                />
                                <CardBody>
                                    <CardText className="fw-bold">{manager.username}</CardText>
                                    <CardText className="fw-bold">{manager.name} {manager.lastname}</CardText>
                                    <CardText className='fw-lighter'><small>{manager.email}</small></CardText>

                                </CardBody>
                                {isSelected(manager._id || "") && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        backgroundColor: '#0d6efd',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: 22,
                                        height: 22,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        fontWeight: 'bold',
                                        fontSize: 14,
                                        userSelect: 'none',
                                    }}>
                                        ✓
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </Col>
            </Row>

            <div className="d-flex gap-2 mt-3">
                <Button className='ms-auto' color="secondary" type="button" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button color="primary" type="submit" disabled={formik.isSubmitting}>
                    {formik.isSubmitting ? <Spinner size="sm" /> : 'Guardar'}
                </Button>
            </div>

            {/* Modal Create */}
            <Modal isOpen={modals.create} toggle={() => toggleModal('create')} size="xl" keyboard={false} backdrop='static' centered>
                <ModalHeader toggle={() => toggleModal('create')}>Nuevo Usuario</ModalHeader>
                <ModalBody>
                    <UserForm onSubmit={(data: UserData) => handleCreateUser(data)} onCancel={() => toggleModal('create', false)} defaultRole="farm_manager" currentUserRole={userLogged.role} />
                </ModalBody>
            </Modal>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="mt-3">
                    {alertConfig.message}
                </Alert>
            )}
        </Form>
    );
};

export default FarmForm;
