import BreadCrumb from 'Components/Common/Shared/BreadCrumb';
import SuccessModal from 'Components/Common/Shared/SuccessModal';
import ErrorModal from 'Components/Common/Shared/ErrorModal';
import LoadingGif from '../../assets/images/loading-gif.gif';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Col,
    Collapse,
    Container,
    FormFeedback,
    Input,
    Label,
    Row,
} from 'reactstrap';
import { fetchFarmConfig, updateFarmConfig } from 'slices/configurations/thunk';
import { DEFAULT_FARM_CONFIG } from 'common/configuration_defaults';
import { FarmConfiguration as FarmConfigType } from 'common/data_interfaces';
import { getEffectiveUser } from "helpers/impersonation_helper";

type SectionKey = 'gestation' | 'lactation' | 'weaning' | 'fattening' | 'replacement' | 'notifications';

const FarmConfiguration = () => {
    document.title = 'Configuración de Granja | System Pig';
    const dispatch: any = useDispatch();
    const farmConfig: FarmConfigType | null = useSelector((s: any) => s.Configurations.farmConfig);
    const loading: boolean = useSelector((s: any) => s.Configurations.loadingFarm);

    const user = useMemo(() => getEffectiveUser(), []);
    const farmId: string | null = user?.farm_assigned ?? null;

    const [modals, setModals] = useState({ success: false, error: false });
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
        gestation: true,
        lactation: true,
        weaning: true,
        fattening: true,
        replacement: true,
        notifications: true,
    });

    useEffect(() => {
        if (farmId) {
            dispatch(fetchFarmConfig(farmId));
        }
    }, [dispatch, farmId]);

    const toggleModal = (key: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [key]: state ?? !prev[key] }));
    };

    const toggleSection = (key: SectionKey) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const initialValues = useMemo(() => ({
        productionCycles: farmConfig?.productionCycles ?? DEFAULT_FARM_CONFIG.productionCycles,
        notifications: farmConfig?.notifications ?? DEFAULT_FARM_CONFIG.notifications,
    }), [farmConfig]);

    const validationSchema = Yup.object({
        productionCycles: Yup.object({
            gestation: Yup.object({
                closeToFarrowDays: Yup.number().integer().min(1).required('Requerido'),
                farrowingPendingDays: Yup.number().integer().min(1).required('Requerido'),
                overdueFarrowingDays: Yup.number().integer().min(1).required('Requerido'),
            }).test('gestation-order', 'closeToFarrow < farrowingPending < overdueFarrowing', (v) => {
                if (!v) return true;
                return v.closeToFarrowDays < v.farrowingPendingDays && v.farrowingPendingDays < v.overdueFarrowingDays;
            }),
            lactation: Yup.object({
                weanReadyDays: Yup.number().integer().min(1).required('Requerido'),
                weanOverdueDays: Yup.number().integer().min(1).required('Requerido'),
            }).test('lactation-order', 'weanReady < weanOverdue', (v) => {
                if (!v) return true;
                return v.weanReadyDays < v.weanOverdueDays;
            }),
            weaning: Yup.object({
                fatteningReadyDays: Yup.number().integer().min(1).required('Requerido'),
                fatteningOverdueDays: Yup.number().integer().min(1).required('Requerido'),
            }).test('weaning-order', 'fatteningReady < fatteningOverdue', (v) => {
                if (!v) return true;
                return v.fatteningReadyDays < v.fatteningOverdueDays;
            }),
            fattening: Yup.object({
                saleReadyDays: Yup.number().integer().min(1).required('Requerido'),
                saleOverdueDays: Yup.number().integer().min(1).required('Requerido'),
            }).test('fattening-order', 'saleReady < saleOverdue', (v) => {
                if (!v) return true;
                return v.saleReadyDays < v.saleOverdueDays;
            }),
            replacement: Yup.object({
                minAge: Yup.number().integer().min(1).required('Requerido'),
                maxAge: Yup.number().integer().min(1).required('Requerido'),
            }).test('replacement-order', 'minAge < maxAge', (v) => {
                if (!v) return true;
                return v.minAge < v.maxAge;
            }),
        }),
        notifications: Yup.object({
            farrowingAdvanceNotificationDays: Yup.number().integer().min(0).required('Requerido'),
            stageChangeAdvanceNotificationDays: Yup.number().integer().min(0).required('Requerido'),
        }),
    });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            if (!farmId) return;
            const result = await dispatch(updateFarmConfig(farmId, values));
            if (result?.ok) {
                toggleModal('success', true);
            } else {
                setErrorMessage(result?.error?.response?.data?.message ?? 'Error al guardar la configuración');
                toggleModal('error', true);
            }
        },
    });

    const restoreDefaults = () => {
        formik.setValues({
            productionCycles: DEFAULT_FARM_CONFIG.productionCycles,
            notifications: DEFAULT_FARM_CONFIG.notifications,
        });
    };

    const sectionError = (path: string): string | null => {
        const err = (formik.errors as any)?.productionCycles?.[path];
        if (!err) return null;
        if (typeof err === 'string') return err;
        return null;
    };

    const fieldError = (section: string, field: string): string | null => {
        const err = (formik.errors as any)?.productionCycles?.[section]?.[field];
        const touched = (formik.touched as any)?.productionCycles?.[section]?.[field];
        return touched && typeof err === 'string' ? err : null;
    };

    const notifError = (field: string): string | null => {
        const err = (formik.errors as any)?.notifications?.[field];
        const touched = (formik.touched as any)?.notifications?.[field];
        return touched && typeof err === 'string' ? err : null;
    };

    if (!farmId) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Configuración de Granja" pageTitle="Configuración" />
                    <Card>
                        <CardBody className="text-center py-5">
                            <i className="ri-alert-line fs-1 text-warning"></i>
                            <h5 className="mt-3">No tienes una granja asignada</h5>
                            <p className="text-muted">Contacta al Superadmin para que te asigne una granja.</p>
                        </CardBody>
                    </Card>
                </Container>
            </div>
        );
    }

    if (loading && !farmConfig) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: '200px' }} />
            </div>
        );
    }

    const SECTION_COLORS: Record<SectionKey, string> = {
        gestation: '#E8F4FD',
        lactation: '#E8F8F0',
        weaning: '#F0EBFB',
        fattening: '#E6F7F5',
        replacement: '#FDF1E8',
        notifications: '#F0F4F8',
    };

    const renderSectionHeader = (key: SectionKey, title: string, helper?: string) => (
        <CardHeader
            className="d-flex justify-content-between align-items-center cursor-pointer"
            onClick={() => toggleSection(key)}
            style={{ cursor: 'pointer', backgroundColor: SECTION_COLORS[key] }}
        >
            <div>
                <h6 className="mb-0">{title}</h6>
                {helper && <small className="text-muted">{helper}</small>}
            </div>
            <i className={`ri-arrow-${openSections[key] ? 'up' : 'down'}-s-line fs-4`} />
        </CardHeader>
    );

    const numberField = (
        name: string,
        label: string,
        helper: string,
        error: string | null,
        min: number = 1,
    ) => (
        <Col md={6} lg={4}>
            <Label htmlFor={name} className="form-label">{label}</Label>
            <Input
                id={name}
                name={name}
                type="number"
                min={min}
                step={1}
                value={((): number | string => {
                    const parts = name.split('.');
                    let v: any = formik.values;
                    for (const p of parts) v = v?.[p];
                    return v ?? '';
                })()}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={!!error}
            />
            <small className="text-muted">{helper}</small>
            {error && <FormFeedback>{error}</FormFeedback>}
        </Col>
    );

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Configuración de Granja" pageTitle="Configuración" />

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        formik.handleSubmit();
                    }}
                >
                    <Card className="mb-3">
                        <CardBody className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-1">Umbrales por ciclo productivo</h5>
                                <small className="text-muted">
                                    Estos valores controlan cuándo el sistema actualiza estados y dispara notificaciones.
                                </small>
                            </div>
                            <div className="d-flex gap-2">
                                <Button type="button" color="primary" onClick={restoreDefaults}>
                                    <i className="ri-refresh-line me-1" /> Restaurar valores por defecto
                                </Button>
                                <Button type="submit" color="success" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="mb-3">
                        {renderSectionHeader('gestation', 'Gestación', 'Días desde la inseminación')}
                        <Collapse isOpen={openSections.gestation}>
                            <CardBody>
                                <Row className="g-3">
                                    {numberField(
                                        'productionCycles.gestation.closeToFarrowDays',
                                        'Cerca de parir (días)',
                                        'Valor por defecto: 107',
                                        fieldError('gestation', 'closeToFarrowDays'),
                                    )}
                                    {numberField(
                                        'productionCycles.gestation.farrowingPendingDays',
                                        'Parto pendiente (días)',
                                        'Valor por defecto: 112',
                                        fieldError('gestation', 'farrowingPendingDays'),
                                    )}
                                    {numberField(
                                        'productionCycles.gestation.overdueFarrowingDays',
                                        'Parto retrasado (días)',
                                        'Valor por defecto: 117',
                                        fieldError('gestation', 'overdueFarrowingDays'),
                                    )}
                                </Row>
                                {sectionError('gestation') && (
                                    <div className="text-danger mt-2 small">{sectionError('gestation')}</div>
                                )}
                            </CardBody>
                        </Collapse>
                    </Card>

                    <Card className="mb-3">
                        {renderSectionHeader('lactation', 'Lactancia', 'Días desde el parto')}
                        <Collapse isOpen={openSections.lactation}>
                            <CardBody>
                                <Row className="g-3">
                                    {numberField(
                                        'productionCycles.lactation.weanReadyDays',
                                        'Lista para destete (días)',
                                        'Valor por defecto: 21',
                                        fieldError('lactation', 'weanReadyDays'),
                                    )}
                                    {numberField(
                                        'productionCycles.lactation.weanOverdueDays',
                                        'Destete retrasado (días)',
                                        'Valor por defecto: 28',
                                        fieldError('lactation', 'weanOverdueDays'),
                                    )}
                                </Row>
                                {sectionError('lactation') && (
                                    <div className="text-danger mt-2 small">{sectionError('lactation')}</div>
                                )}
                            </CardBody>
                        </Collapse>
                    </Card>

                    <Card className="mb-3">
                        {renderSectionHeader('weaning', 'Destete → Engorda', 'Días desde que el grupo entró a la etapa weaning')}
                        <Collapse isOpen={openSections.weaning}>
                            <CardBody>
                                <Row className="g-3">
                                    {numberField(
                                        'productionCycles.weaning.fatteningReadyDays',
                                        'Listo para engorda (días)',
                                        'Valor por defecto: 42',
                                        fieldError('weaning', 'fatteningReadyDays'),
                                    )}
                                    {numberField(
                                        'productionCycles.weaning.fatteningOverdueDays',
                                        'Paso a engorda retrasado (días)',
                                        'Valor por defecto: 56',
                                        fieldError('weaning', 'fatteningOverdueDays'),
                                    )}
                                </Row>
                                {sectionError('weaning') && (
                                    <div className="text-danger mt-2 small">{sectionError('weaning')}</div>
                                )}
                            </CardBody>
                        </Collapse>
                    </Card>

                    <Card className="mb-3">
                        {renderSectionHeader('fattening', 'Engorda → Venta', 'Días desde que el grupo entró a la etapa fattening')}
                        <Collapse isOpen={openSections.fattening}>
                            <CardBody>
                                <Row className="g-3">
                                    {numberField(
                                        'productionCycles.fattening.saleReadyDays',
                                        'Listo para venta (días)',
                                        'Valor por defecto: 84',
                                        fieldError('fattening', 'saleReadyDays'),
                                    )}
                                    {numberField(
                                        'productionCycles.fattening.saleOverdueDays',
                                        'Venta retrasada (días)',
                                        'Valor por defecto: 112',
                                        fieldError('fattening', 'saleOverdueDays'),
                                    )}
                                </Row>
                                {sectionError('fattening') && (
                                    <div className="text-danger mt-2 small">{sectionError('fattening')}</div>
                                )}
                            </CardBody>
                        </Collapse>
                    </Card>

                    <Card className="mb-3">
                        {renderSectionHeader('replacement', 'Reemplazo', 'Edad del cerdo desde el nacimiento (no días en etapa)')}
                        <Collapse isOpen={openSections.replacement}>
                            <CardBody>
                                <Row className="g-3">
                                    {numberField(
                                        'productionCycles.replacement.minAge',
                                        'Edad mínima (días)',
                                        'Valor por defecto: 140',
                                        fieldError('replacement', 'minAge'),
                                    )}
                                    {numberField(
                                        'productionCycles.replacement.maxAge',
                                        'Edad máxima (días)',
                                        'Valor por defecto: 170',
                                        fieldError('replacement', 'maxAge'),
                                    )}
                                </Row>
                                {sectionError('replacement') && (
                                    <div className="text-danger mt-2 small">{sectionError('replacement')}</div>
                                )}
                            </CardBody>
                        </Collapse>
                    </Card>

                    <Card className="mb-3">
                        {renderSectionHeader('notifications', 'Notificaciones', 'Días de anticipación para avisos visuales')}
                        <Collapse isOpen={openSections.notifications}>
                            <CardBody>
                                <Row className="g-3">
                                    <Col md={6} lg={4}>
                                        <Label htmlFor="notifications.farrowingAdvanceNotificationDays" className="form-label">
                                            Anticipación de parto (días)
                                        </Label>
                                        <Input
                                            id="notifications.farrowingAdvanceNotificationDays"
                                            name="notifications.farrowingAdvanceNotificationDays"
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={formik.values.notifications.farrowingAdvanceNotificationDays}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            invalid={!!notifError('farrowingAdvanceNotificationDays')}
                                        />
                                        <small className="text-muted">Valor por defecto: 5</small>
                                        {notifError('farrowingAdvanceNotificationDays') && (
                                            <FormFeedback>{notifError('farrowingAdvanceNotificationDays')}</FormFeedback>
                                        )}
                                    </Col>
                                    <Col md={6} lg={4}>
                                        <Label htmlFor="notifications.stageChangeAdvanceNotificationDays" className="form-label">
                                            Anticipación de cambio de etapa (días)
                                        </Label>
                                        <Input
                                            id="notifications.stageChangeAdvanceNotificationDays"
                                            name="notifications.stageChangeAdvanceNotificationDays"
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={formik.values.notifications.stageChangeAdvanceNotificationDays}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            invalid={!!notifError('stageChangeAdvanceNotificationDays')}
                                        />
                                        <small className="text-muted">Valor por defecto: 3</small>
                                        {notifError('stageChangeAdvanceNotificationDays') && (
                                            <FormFeedback>{notifError('stageChangeAdvanceNotificationDays')}</FormFeedback>
                                        )}
                                    </Col>
                                </Row>
                            </CardBody>
                        </Collapse>
                    </Card>

                </form>
            </Container>

            <SuccessModal
                isOpen={modals.success}
                onClose={() => toggleModal('success', false)}
                message="Configuración de granja actualizada correctamente"
            />
            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error', false)}
                message={errorMessage || 'Error al actualizar la configuración'}
            />
        </div>
    );
};

export default FarmConfiguration;
