import BreadCrumb from 'Components/Common/Shared/BreadCrumb';
import SuccessModal from 'Components/Common/Shared/SuccessModal';
import ErrorModal from 'Components/Common/Shared/ErrorModal';
import LoadingGif from '../../assets/images/loading-gif.gif';
import systemLogo from '../../assets/images/system-logo.png';
import FileUploader from 'Components/Common/Shared/FileUploader';
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
    Container,
    FormFeedback,
    Input,
    InputGroup,
    Label,
    Row,
} from 'reactstrap';
import { deleteGlobalLogo, fetchGlobalConfig, updateGlobalConfig, uploadGlobalLogo } from 'slices/configurations/thunk';
import { DATE_FORMAT_OPTIONS, DEFAULT_GLOBAL_CONFIG } from 'common/configuration_defaults';
import { GlobalConfiguration as GlobalConfigType } from 'common/data_interfaces';
import { deriveCurrencySymbol, getCurrencyOptions, getLocaleOptions, getTimezoneOptions } from 'utils/intlHelpers';

const GlobalConfiguration = () => {
    document.title = 'Configuración Global | System Pig';
    const dispatch: any = useDispatch();
    const globalConfig: GlobalConfigType | null = useSelector((s: any) => s.Configurations.globalConfig);
    const loading: boolean = useSelector((s: any) => s.Configurations.loadingGlobal);

    const [modals, setModals] = useState({ success: false, error: false });
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('Configuración global actualizada correctamente');
    const [unitInput, setUnitInput] = useState<string>('');
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
    const [pendingLogoPreview, setPendingLogoPreview] = useState<string | null>(null);
    const [pendingLogoRemoval, setPendingLogoRemoval] = useState<boolean>(false);

    const ALLOWED_LOGO_MIME = ['image/png', 'image/jpeg', 'image/webp'];
    const MAX_LOGO_SIZE = 2 * 1024 * 1024;

    const currencyOptions = useMemo(() => getCurrencyOptions(), []);
    const timezoneOptions = useMemo(() => getTimezoneOptions(), []);
    const localeOptions = useMemo(() => getLocaleOptions(), []);

    useEffect(() => {
        dispatch(fetchGlobalConfig());
    }, [dispatch]);

    const toggleModal = (key: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [key]: state ?? !prev[key] }));
    };

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            companyName: globalConfig?.companyName ?? DEFAULT_GLOBAL_CONFIG.companyName,
            currency: globalConfig?.currency ?? DEFAULT_GLOBAL_CONFIG.currency,
            decimals: globalConfig?.decimals ?? DEFAULT_GLOBAL_CONFIG.decimals,
            locale: globalConfig?.locale ?? DEFAULT_GLOBAL_CONFIG.locale,
            timezone: globalConfig?.timezone ?? DEFAULT_GLOBAL_CONFIG.timezone,
            dateFormat: globalConfig?.dateFormat ?? DEFAULT_GLOBAL_CONFIG.dateFormat,
            unitMeasurements: globalConfig?.unitMeasurements ?? DEFAULT_GLOBAL_CONFIG.unitMeasurements,
        },
        validationSchema: Yup.object({
            companyName: Yup.string().trim().required('Ingrese el nombre de la empresa'),
            currency: Yup.string().required('Seleccione una moneda'),
            decimals: Yup.number()
                .typeError('Debe ser un número')
                .integer('Debe ser un entero')
                .min(0, 'Mínimo 0')
                .max(6, 'Máximo 6')
                .required('Ingrese los decimales'),
            locale: Yup.string().required('Seleccione un locale'),
            timezone: Yup.string().required('Seleccione una zona horaria'),
            dateFormat: Yup.string().required('Seleccione un formato de fecha'),
            unitMeasurements: Yup.array()
                .of(Yup.string().trim().min(1, 'La unidad no puede estar vacía'))
                .min(1, 'Agregue al menos una unidad de medida')
                .required('Agregue al menos una unidad de medida'),
        }),
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            const payload: Partial<GlobalConfigType> = {
                ...values,
                currencySymbol: deriveCurrencySymbol(values.currency, values.locale),
            };
            const result = await dispatch(updateGlobalConfig(payload));
            if (!result?.ok) {
                setErrorMessage(result?.error?.response?.data?.message ?? 'Error al guardar la configuración');
                toggleModal('error', true);
                return;
            }

            if (pendingLogoRemoval) {
                const delRes = await dispatch(deleteGlobalLogo());
                if (!delRes?.ok) {
                    setErrorMessage(delRes?.error?.response?.data?.message ?? 'Error al eliminar el logo');
                    toggleModal('error', true);
                    return;
                }
                setPendingLogoRemoval(false);
            } else if (pendingLogoFile) {
                const upRes = await dispatch(uploadGlobalLogo(pendingLogoFile));
                if (!upRes?.ok) {
                    setErrorMessage(upRes?.error?.response?.data?.message ?? 'Error al subir el logo');
                    toggleModal('error', true);
                    return;
                }
                if (pendingLogoPreview) URL.revokeObjectURL(pendingLogoPreview);
                setPendingLogoFile(null);
                setPendingLogoPreview(null);
            }

            setSuccessMessage('Configuración global actualizada correctamente');
            toggleModal('success', true);
        },
    });

    const handleAddUnit = () => {
        const value = unitInput.trim();
        if (!value) return;
        if (formik.values.unitMeasurements.includes(value)) {
            setUnitInput('');
            return;
        }
        formik.setFieldValue('unitMeasurements', [...formik.values.unitMeasurements, value]);
        setUnitInput('');
    };

    const handleRemoveUnit = (unit: string) => {
        formik.setFieldValue(
            'unitMeasurements',
            formik.values.unitMeasurements.filter((u) => u !== unit),
        );
    };

    const handleLogoFileSelected = (file: File) => {
        if (!ALLOWED_LOGO_MIME.includes(file.type)) {
            setErrorMessage('Formato no válido. Usa PNG, JPG o WEBP.');
            toggleModal('error', true);
            return;
        }
        if (file.size > MAX_LOGO_SIZE) {
            setErrorMessage('La imagen supera el tamaño máximo de 2 MB.');
            toggleModal('error', true);
            return;
        }

        if (pendingLogoPreview) URL.revokeObjectURL(pendingLogoPreview);
        const previewUrl = URL.createObjectURL(file);
        setPendingLogoFile(file);
        setPendingLogoPreview(previewUrl);
        setPendingLogoRemoval(false);
    };

    const handleLogoFilesUpdate = (files: File[]) => {
        if (files.length === 0 && pendingLogoFile) {
            if (pendingLogoPreview) URL.revokeObjectURL(pendingLogoPreview);
            setPendingLogoFile(null);
            setPendingLogoPreview(null);
        }
    };

    const handleMarkRemoveLogo = () => {
        if (pendingLogoPreview) URL.revokeObjectURL(pendingLogoPreview);
        setPendingLogoFile(null);
        setPendingLogoPreview(null);
        setPendingLogoRemoval(true);
    };

    const currentLogoSrc = pendingLogoPreview
        || (pendingLogoRemoval ? systemLogo : (globalConfig?.logoUrl || systemLogo));
    const hasCustomLogo = !!globalConfig?.logoUrl && !pendingLogoRemoval;
    const hasPendingLogoChanges = !!pendingLogoFile || pendingLogoRemoval;

    const derivedSymbol = deriveCurrencySymbol(formik.values.currency, formik.values.locale);

    if (loading && !globalConfig) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: '200px' }} />
            </div>
        );
    }

    return (
        <div className="page-content">
            <style>{`
                .unit-pill:hover { background-color: #D5E4FB !important; }
                .unit-pill button:hover { opacity: 0.7; }
            `}</style>
            <Container fluid>
                <BreadCrumb title="Configuración Global" pageTitle="Configuración" />

                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Datos de la empresa y preferencias regionales</h5>
                        <Button
                            type="button"
                            color="success"
                            disabled={loading}
                            onClick={() => formik.handleSubmit()}
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </CardHeader>
                    <CardBody>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                formik.handleSubmit();
                            }}
                        >
                            <Row className="g-3">
                                <Col lg={12}>
                                    <Label className="form-label">Logo de la empresa</Label>
                                    <Row className="g-3 align-items-start">
                                        <Col md={4}>
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: 180,
                                                    borderRadius: 12,
                                                    border: '1px solid #E5E7EB',
                                                    backgroundColor: '#F9FAFB',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <img
                                                    src={currentLogoSrc}
                                                    alt="Logo"
                                                    style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                                                />
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mt-2">
                                                <small className="text-muted">
                                                    {pendingLogoPreview
                                                        ? 'Vista previa (sin guardar)'
                                                        : pendingLogoRemoval
                                                            ? 'Se quitará al guardar'
                                                            : hasCustomLogo ? 'Logo actual' : 'Logo predeterminado'}
                                                </small>
                                                {hasCustomLogo && !pendingLogoPreview && (
                                                    <Button
                                                        type="button"
                                                        color="danger"
                                                        outline
                                                        size="sm"
                                                        disabled={loading}
                                                        onClick={handleMarkRemoveLogo}
                                                    >
                                                        <i className="ri-delete-bin-line me-1" />
                                                        Quitar
                                                    </Button>
                                                )}
                                            </div>
                                        </Col>
                                        <Col md={8}>
                                            <FileUploader
                                                acceptedFileTypes={['image/png', 'image/jpeg', 'image/webp']}
                                                maxFiles={1}
                                                onFileUpload={handleLogoFileSelected}
                                                onUpdateFiles={handleLogoFilesUpdate}
                                            />
                                            <small className="text-muted d-block mt-2">
                                                PNG, JPG o WEBP · máx. 2 MB · recomendado ≥ 512×512 px con fondo transparente.
                                            </small>
                                            {hasPendingLogoChanges && (
                                                <small className="text-warning d-block mt-1">
                                                    <i className="ri-information-line me-1" />
                                                    Los cambios del logo se aplicarán al guardar.
                                                </small>
                                            )}
                                        </Col>
                                    </Row>
                                </Col>

                                <Col lg={6}>
                                    <Label htmlFor="companyName" className="form-label">Nombre de la empresa</Label>
                                    <Input
                                        id="companyName"
                                        name="companyName"
                                        type="text"
                                        value={formik.values.companyName}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.companyName && !!formik.errors.companyName}
                                    />
                                    {formik.touched.companyName && formik.errors.companyName && (
                                        <FormFeedback>{formik.errors.companyName}</FormFeedback>
                                    )}
                                </Col>

                                <Col lg={6}>
                                    <Label htmlFor="currency" className="form-label">
                                        Moneda <span className="text-muted">(símbolo: {derivedSymbol})</span>
                                    </Label>
                                    <Input
                                        id="currency"
                                        name="currency"
                                        type="select"
                                        value={formik.values.currency}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.currency && !!formik.errors.currency}
                                    >
                                        {currencyOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Input>
                                    {formik.touched.currency && formik.errors.currency && (
                                        <FormFeedback>{formik.errors.currency}</FormFeedback>
                                    )}
                                </Col>

                                <Col lg={4}>
                                    <Label htmlFor="decimals" className="form-label">Decimales</Label>
                                    <Input
                                        id="decimals"
                                        name="decimals"
                                        type="number"
                                        min={0}
                                        max={6}
                                        step={1}
                                        value={formik.values.decimals}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.decimals && !!formik.errors.decimals}
                                    />
                                    <small className="text-muted">Entero entre 0 y 6</small>
                                    {formik.touched.decimals && formik.errors.decimals && (
                                        <FormFeedback>{formik.errors.decimals as string}</FormFeedback>
                                    )}
                                </Col>

                                <Col lg={4}>
                                    <Label htmlFor="locale" className="form-label">Locale</Label>
                                    <Input
                                        id="locale"
                                        name="locale"
                                        type="select"
                                        value={formik.values.locale}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.locale && !!formik.errors.locale}
                                    >
                                        {localeOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Input>
                                    {formik.touched.locale && formik.errors.locale && (
                                        <FormFeedback>{formik.errors.locale}</FormFeedback>
                                    )}
                                </Col>

                                <Col lg={4}>
                                    <Label htmlFor="dateFormat" className="form-label">Formato de fecha</Label>
                                    <Input
                                        id="dateFormat"
                                        name="dateFormat"
                                        type="select"
                                        value={formik.values.dateFormat}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.dateFormat && !!formik.errors.dateFormat}
                                    >
                                        {DATE_FORMAT_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Input>
                                    {formik.touched.dateFormat && formik.errors.dateFormat && (
                                        <FormFeedback>{formik.errors.dateFormat}</FormFeedback>
                                    )}
                                </Col>

                                <Col lg={6}>
                                    <Label htmlFor="timezone" className="form-label">Zona horaria</Label>
                                    <Input
                                        id="timezone"
                                        name="timezone"
                                        type="select"
                                        value={formik.values.timezone}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.timezone && !!formik.errors.timezone}
                                    >
                                        {timezoneOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Input>
                                    {formik.touched.timezone && formik.errors.timezone && (
                                        <FormFeedback>{formik.errors.timezone}</FormFeedback>
                                    )}
                                </Col>

                                <Col lg={12}>
                                    <Label htmlFor="unitInput" className="form-label">Unidades de medida</Label>
                                    <InputGroup>
                                        <Input
                                            id="unitInput"
                                            type="text"
                                            placeholder="Escribe una unidad (ej: kg) y presiona Enter"
                                            value={unitInput}
                                            onChange={(e) => setUnitInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddUnit();
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            color="primary"
                                            onClick={handleAddUnit}
                                            disabled={!unitInput.trim()}
                                        >
                                            <i className="ri-add-line me-1" /> Agregar
                                        </Button>
                                    </InputGroup>
                                    <div className="d-flex flex-wrap gap-2 mt-3">
                                        {formik.values.unitMeasurements.length === 0 && (
                                            <span className="text-muted small fst-italic">
                                                Aún no has agregado unidades de medida.
                                            </span>
                                        )}
                                        {formik.values.unitMeasurements.map((unit) => (
                                            <span
                                                key={unit}
                                                className="unit-pill d-inline-flex align-items-center gap-2"
                                                style={{
                                                    backgroundColor: '#E8F1FD',
                                                    color: '#0B5ED7',
                                                    borderRadius: '999px',
                                                    padding: '6px 14px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 500,
                                                    transition: 'background-color 0.15s ease',
                                                }}
                                            >
                                                {unit}
                                                <button
                                                    type="button"
                                                    aria-label={`Quitar ${unit}`}
                                                    onClick={() => handleRemoveUnit(unit)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        padding: 0,
                                                        marginLeft: '2px',
                                                        color: 'inherit',
                                                        cursor: 'pointer',
                                                        lineHeight: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <i className="ri-close-line" style={{ fontSize: '1rem' }} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    {formik.touched.unitMeasurements && formik.errors.unitMeasurements && (
                                        <div className="text-danger mt-2 small">
                                            {typeof formik.errors.unitMeasurements === 'string'
                                                ? formik.errors.unitMeasurements
                                                : 'Agregue al menos una unidad de medida'}
                                        </div>
                                    )}
                                </Col>
                            </Row>

                        </form>
                    </CardBody>
                </Card>
            </Container>

            <SuccessModal
                isOpen={modals.success}
                onClose={() => toggleModal('success', false)}
                message={successMessage}
            />
            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error', false)}
                message={errorMessage || 'Error al actualizar la configuración'}
            />
        </div>
    );
};

export default GlobalConfiguration;
