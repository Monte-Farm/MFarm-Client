import { ConfigContext } from "App";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import { FEED_ADMINISTRATION_URLS, PREPARED_FEED_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useMemo, useState } from "react";
import { Badge, Button, FormFeedback, Input, Label, Spinner } from "reactstrap";
import * as Yup from "yup";
import DatePicker from "react-flatpickr";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { HttpStatusCode } from "axios";

type TargetType = 'group' | 'litter' | 'pig';
type Stage = 'piglet' | 'sow' | 'nursery' | 'grower' | 'finisher' | 'general';

interface FeedAdministrationFormProps {
    targetType: TargetType;
    targetId?: string;            // requerido si NO es bulk
    bulkTargets?: string[];       // requerido si bulk
    isBulk?: boolean;
    targetStage?: Stage;          // etapa del target (para filtrar preparados); litter siempre 'piglet'
    onSave: () => void;
    onCancel: () => void;
}

const FeedAdministrationForm: React.FC<FeedAdministrationFormProps> = ({
    targetType,
    targetId,
    bulkTargets = [],
    isBulk = false,
    targetStage,
    onSave,
    onCancel,
}) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);

    const [loading, setLoading] = useState<boolean>(true);
    const [preparedProducts, setPreparedProducts] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = (m: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [m]: state ?? !prev[m] }));
    };

    const validationSchema = Yup.object({
        preparedProductId: Yup.string().required('Seleccione un alimento preparado'),
        quantity: Yup.number()
            .typeError('Debe ser un número')
            .positive('Debe ser mayor a 0')
            .required('Requerido'),
        date: Yup.date().required('Seleccione una fecha').nullable(),
    });

    const formik = useFormik({
        initialValues: {
            preparedProductId: '',
            quantity: 0,
            date: new Date() as Date | null,
            observations: '',
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            if (!configContext) return;

            const basePayload = {
                farmId: userLogged.farm_assigned,
                preparedProductId: values.preparedProductId,
                quantity: values.quantity,
                date: values.date,
                responsibleId: userLogged._id,
                observations: values.observations,
            };

            try {
                let url: string;
                let payload: any = basePayload;

                if (isBulk) {
                    if (targetType === 'group') {
                        url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.bulkGroups}`;
                    } else if (targetType === 'litter') {
                        url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.bulkLitters}`;
                    } else {
                        throw new Error('Bulk no soportado para cerdos individuales');
                    }
                    payload = { ...basePayload, targets: bulkTargets };
                } else {
                    if (!targetId) throw new Error('targetId requerido en modo individual');
                    if (targetType === 'group') {
                        url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.createForGroup(targetId)}`;
                    } else if (targetType === 'litter') {
                        url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.createForLitter(targetId)}`;
                    } else {
                        url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.createForPig(targetId)}`;
                    }
                }

                const response = await configContext.axiosHelper.create(url, payload);
                if (response.status === HttpStatusCode.Created || response.status === HttpStatusCode.Ok) {
                    const targetLabel = isBulk
                        ? `${bulkTargets.length} ${targetType === 'group' ? 'grupos' : 'camadas'}`
                        : `1 ${targetType}`;
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Administración de alimento registrada (${targetLabel})`,
                    });
                    toggleModal('success', true);
                }
            } catch (error: any) {
                console.error('Error creating administration:', error);
                const msg = error?.response?.data?.message || 'Ha ocurrido un error al registrar la administración';
                setAlertConfig({ visible: true, color: 'danger', message: msg });
                toggleModal('error', true);
            }
        }
    });

    const fetchPreparedProducts = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const stage: Stage = targetType === 'litter' ? 'piglet' : (targetStage || 'general');
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/${PREPARED_FEED_URLS.byStage(userLogged.farm_assigned, stage)}`
            );
            setPreparedProducts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching prepared products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al cargar alimentos preparados' });
        } finally {
            setLoading(false);
        }
    };

    const selectedProduct = useMemo(
        () => preparedProducts.find(p => (p._id || p.id) === formik.values.preparedProductId),
        [preparedProducts, formik.values.preparedProductId]
    );

    const stockAvailable = selectedProduct?.totalStock ?? selectedProduct?.quantity ?? 0;
    const exceedsStock = formik.values.quantity > stockAvailable;

    useEffect(() => {
        fetchPreparedProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
            {isBulk && (
                <div className="alert alert-info py-2 mb-3 small">
                    <i className="ri-information-line me-1" />
                    Se aplicará la misma cantidad a <strong>{bulkTargets.length}</strong> {targetType === 'group' ? 'grupos' : 'camadas'} seleccionados.
                </div>
            )}

            <div className="d-flex gap-3">
                <div className="w-50">
                    <Label className="form-label">Alimento preparado *</Label>
                    <Input
                        type="select"
                        name="preparedProductId"
                        value={formik.values.preparedProductId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.preparedProductId && !!formik.errors.preparedProductId}
                    >
                        <option value="">Seleccione un alimento preparado</option>
                        {preparedProducts.map(p => (
                            <option key={p._id || p.id} value={p._id || p.id}>
                                {p.name} — Stock: {(p.totalStock ?? p.quantity ?? 0).toFixed(2)} {p.unit_measurement || 'kg'}
                            </option>
                        ))}
                    </Input>
                    {formik.touched.preparedProductId && formik.errors.preparedProductId && (
                        <FormFeedback>{formik.errors.preparedProductId}</FormFeedback>
                    )}
                    {preparedProducts.length === 0 && (
                        <div className="text-warning small mt-1">
                            <i className="ri-alert-line me-1" />
                            No hay alimentos preparados disponibles. Realice una preparación primero.
                        </div>
                    )}
                </div>

                <div className="w-50">
                    <Label className="form-label">Cantidad a administrar *</Label>
                    <div className="input-group">
                        <Input
                            type="number"
                            name="quantity"
                            min={0}
                            step="0.01"
                            value={formik.values.quantity || ''}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={(formik.touched.quantity && !!formik.errors.quantity) || exceedsStock}
                        />
                        <span className="input-group-text">kg</span>
                    </div>
                    {formik.touched.quantity && formik.errors.quantity && (
                        <div className="text-danger small mt-1">{formik.errors.quantity as string}</div>
                    )}
                    {exceedsStock && selectedProduct && !isBulk && (
                        <div className="text-danger small mt-1">
                            La cantidad supera el stock disponible ({stockAvailable.toFixed(2)} kg).
                        </div>
                    )}
                </div>
            </div>

            {selectedProduct && (
                <div className="mt-3">
                    <div className="bg-light rounded p-3 d-flex justify-content-between align-items-center">
                        <div>
                            <small className="text-muted">Stock disponible</small>
                            <div className="fs-5 fw-bold">{stockAvailable.toFixed(2)} kg</div>
                        </div>
                        <i className="ri-archive-line fs-3 text-muted opacity-75" />
                    </div>
                </div>
            )}

            <div className="d-flex gap-3 mt-3">
                <div className="w-50">
                    <Label className="form-label">Fecha *</Label>
                    <DatePicker
                        className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                        value={formik.values.date ?? undefined}
                        onChange={(d: Date[]) => { if (d[0]) formik.setFieldValue('date', d[0]); }}
                        options={{ dateFormat: 'd/m/Y' }}
                    />
                </div>
                <div className="w-50">
                    <Label className="form-label">Responsable</Label>
                    <Input type="text" value={`${userLogged.name} ${userLogged.lastname}`} disabled />
                </div>
            </div>

            <div className="mt-3">
                <Label className="form-label">Observaciones</Label>
                <Input
                    type="textarea"
                    name="observations"
                    rows={2}
                    value={formik.values.observations}
                    onChange={formik.handleChange}
                    placeholder="Notas sobre la administración (opcional)"
                />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
                <Button color="secondary" outline onClick={onCancel}>Cancelar</Button>
                <Button
                    color="success"
                    onClick={() => formik.handleSubmit()}
                    disabled={formik.isSubmitting || preparedProducts.length === 0 || (exceedsStock && !isBulk)}
                >
                    {formik.isSubmitting ? <Spinner size="sm" /> : (
                        <><i className="ri-check-line me-2" />Registrar administración</>
                    )}
                </Button>
            </div>

            <SuccessModal
                isOpen={modals.success}
                onClose={onSave}
                message={isBulk
                    ? `Administración registrada en ${bulkTargets.length} ${targetType === 'group' ? 'grupos' : 'camadas'}`
                    : "Administración registrada con éxito"}
            />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message="Ha ocurrido un error al registrar la administración" />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={4000} />
        </form>
    );
};

export default FeedAdministrationForm;
