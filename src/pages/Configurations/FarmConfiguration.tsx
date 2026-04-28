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
import { useTranslation } from 'react-i18next';

type SectionKey = 'gestation' | 'lactation' | 'weaning' | 'fattening' | 'replacement' | 'notifications';

const FarmConfiguration = () => {
    const { t } = useTranslation();
    document.title = t('config.farm.pageTitle');
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
                closeToFarrowDays: Yup.number().integer().min(1).required(t('config.farm.validation.required')),
                farrowingPendingDays: Yup.number().integer().min(1).required(t('config.farm.validation.required')),
                overdueFarrowingDays: Yup.number().integer().min(1).required(t('config.farm.validation.required')),
            }).test('gestation-order', 'closeToFarrow < farrowingPending < overdueFarrowing', (v) => {
                if (!v) return true;
                return v.closeToFarrowDays < v.farrowingPendingDays && v.farrowingPendingDays < v.overdueFarrowingDays;
            }),
            lactation: Yup.object({
                weanReadyDays: Yup.number().integer().min(1).required(t('config.farm.validation.required')),
                weanOverdueDays: Yup.number().integer().min(1).required(t('config.farm.validation.required')),
            }).test('lactation-order', 'weanReady < weanOverdue', (v) => {
                if (!v) return true;
                return v.weanReadyDays < v.weanOverdueDays;
            }),
            weaning: Yup.object({
                fatteningReadyDays: Yup.number().integer().min(1).required(t('config.farm.validation.required')),
                fatteningOverdueDays: Yup.number().integer().min(1).required(t('config.farm.validation.required')),
            }).test('weaning-order', 'fatteningReady < fatteningOverdue', (v) => {
                if (!v) return true;
                return v.fatteningReadyDays < v.fatteningOverdueDays;
            }),
            fattening: Yup.object({
                saleReadyDays: Yup.number().integer().min(1).required(t('config.farm.validation.required')),
                saleOverdueDays: Yup.number().integer().min(1).required(t('config.farm.validation.required')),
            }).test('fattening-order', 'saleReady < saleOverdue', (v) => {
                if (!v) return true;
                return v.saleReadyDays < v.saleOverdueDays;
            }),
            replacement: Yup.object({
                minAge: Yup.number().integer().min(1).required(t('config.farm.validation.required')),
                maxAge: Yup.number().integer().min(1).required(t('config.farm.validation.required')),
            }).test('replacement-order', 'minAge < maxAge', (v) => {
                if (!v) return true;
                return v.minAge < v.maxAge;
            }),
        }),
        notifications: Yup.object({
            farrowingAdvanceNotificationDays: Yup.number().integer().min(0).required(t('config.farm.validation.required')),
            stageChangeAdvanceNotificationDays: Yup.number().integer().min(0).required(t('config.farm.validation.required')),
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
                setErrorMessage(result?.error?.response?.data?.message ?? t('config.farm.error.save'));
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
                    <BreadCrumb title={t('config.farm.breadcrumb')} pageTitle={t('config.farm.breadcrumbParent')} />
                    <Card>
                        <CardBody className="text-center py-5">
                            <i className="ri-alert-line fs-1 text-warning"></i>
                            <h5 className="mt-3">{t('config.farm.noFarm.title')}</h5>
                            <p className="text-muted">{t('config.farm.noFarm.message')}</p>
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
                <BreadCrumb title={t('config.farm.breadcrumb')} pageTitle={t('config.farm.breadcrumbParent')} />

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        formik.handleSubmit();
                    }}
                >
                    <Card className="mb-3">
                        <CardBody className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-1">{t('config.farm.header.title')}</h5>
                                <small className="text-muted">
                                    {t('config.farm.header.subtitle')}
                                </small>
                            </div>
                            <div className="d-flex gap-2">
                                <Button type="button" color="primary" onClick={restoreDefaults}>
                                    <i className="ri-refresh-line me-1" /> {t('config.farm.button.restoreDefaults')}
                                </Button>
                                <Button type="submit" color="success" disabled={loading}>
                                    {loading ? t('common.button.saving') : t('common.button.save')}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="mb-3">
                        {renderSectionHeader('gestation', t('config.farm.section.gestation'), t('config.farm.section.gestationHelper'))}
                        <Collapse isOpen={openSections.gestation}>
                            <CardBody>
                                <Row className="g-3">
                                    {numberField(
                                        'productionCycles.gestation.closeToFarrowDays',
                                        t('config.farm.field.closeToFarrowDays'),
                                        t('config.farm.field.closeToFarrowDaysHelper'),
                                        fieldError('gestation', 'closeToFarrowDays'),
                                    )}
                                    {numberField(
                                        'productionCycles.gestation.farrowingPendingDays',
                                        t('config.farm.field.farrowingPendingDays'),
                                        t('config.farm.field.farrowingPendingDaysHelper'),
                                        fieldError('gestation', 'farrowingPendingDays'),
                                    )}
                                    {numberField(
                                        'productionCycles.gestation.overdueFarrowingDays',
                                        t('config.farm.field.overdueFarrowingDays'),
                                        t('config.farm.field.overdueFarrowingDaysHelper'),
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
                        {renderSectionHeader('lactation', t('config.farm.section.lactation'), t('config.farm.section.lactationHelper'))}
                        <Collapse isOpen={openSections.lactation}>
                            <CardBody>
                                <Row className="g-3">
                                    {numberField(
                                        'productionCycles.lactation.weanReadyDays',
                                        t('config.farm.field.weanReadyDays'),
                                        t('config.farm.field.weanReadyDaysHelper'),
                                        fieldError('lactation', 'weanReadyDays'),
                                    )}
                                    {numberField(
                                        'productionCycles.lactation.weanOverdueDays',
                                        t('config.farm.field.weanOverdueDays'),
                                        t('config.farm.field.weanOverdueDaysHelper'),
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
                        {renderSectionHeader('weaning', t('config.farm.section.weaning'), t('config.farm.section.weaningHelper'))}
                        <Collapse isOpen={openSections.weaning}>
                            <CardBody>
                                <Row className="g-3">
                                    {numberField(
                                        'productionCycles.weaning.fatteningReadyDays',
                                        t('config.farm.field.fatteningReadyDays'),
                                        t('config.farm.field.fatteningReadyDaysHelper'),
                                        fieldError('weaning', 'fatteningReadyDays'),
                                    )}
                                    {numberField(
                                        'productionCycles.weaning.fatteningOverdueDays',
                                        t('config.farm.field.fatteningOverdueDays'),
                                        t('config.farm.field.fatteningOverdueDaysHelper'),
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
                        {renderSectionHeader('fattening', t('config.farm.section.fattening'), t('config.farm.section.fatteningHelper'))}
                        <Collapse isOpen={openSections.fattening}>
                            <CardBody>
                                <Row className="g-3">
                                    {numberField(
                                        'productionCycles.fattening.saleReadyDays',
                                        t('config.farm.field.saleReadyDays'),
                                        t('config.farm.field.saleReadyDaysHelper'),
                                        fieldError('fattening', 'saleReadyDays'),
                                    )}
                                    {numberField(
                                        'productionCycles.fattening.saleOverdueDays',
                                        t('config.farm.field.saleOverdueDays'),
                                        t('config.farm.field.saleOverdueDaysHelper'),
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
                        {renderSectionHeader('replacement', t('config.farm.section.replacement'), t('config.farm.section.replacementHelper'))}
                        <Collapse isOpen={openSections.replacement}>
                            <CardBody>
                                <Row className="g-3">
                                    {numberField(
                                        'productionCycles.replacement.minAge',
                                        t('config.farm.field.minAge'),
                                        t('config.farm.field.minAgeHelper'),
                                        fieldError('replacement', 'minAge'),
                                    )}
                                    {numberField(
                                        'productionCycles.replacement.maxAge',
                                        t('config.farm.field.maxAge'),
                                        t('config.farm.field.maxAgeHelper'),
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
                        {renderSectionHeader('notifications', t('config.farm.section.notifications'), t('config.farm.section.notificationsHelper'))}
                        <Collapse isOpen={openSections.notifications}>
                            <CardBody>
                                <Row className="g-3">
                                    <Col md={6} lg={4}>
                                        <Label htmlFor="notifications.farrowingAdvanceNotificationDays" className="form-label">
                                            {t('config.farm.field.farrowingAdvanceNotificationDays')}
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
                                        <small className="text-muted">{t('config.farm.field.farrowingAdvanceNotificationDaysHelper')}</small>
                                        {notifError('farrowingAdvanceNotificationDays') && (
                                            <FormFeedback>{notifError('farrowingAdvanceNotificationDays')}</FormFeedback>
                                        )}
                                    </Col>
                                    <Col md={6} lg={4}>
                                        <Label htmlFor="notifications.stageChangeAdvanceNotificationDays" className="form-label">
                                            {t('config.farm.field.stageChangeAdvanceNotificationDays')}
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
                                        <small className="text-muted">{t('config.farm.field.stageChangeAdvanceNotificationDaysHelper')}</small>
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
                message={t('config.farm.success')}
            />
            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error', false)}
                message={errorMessage || t('config.farm.error.update')}
            />
        </div>
    );
};

export default FarmConfiguration;
