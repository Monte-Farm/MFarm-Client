import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useState } from "react";
import { Button, Input, Label, Spinner } from "reactstrap";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import AlertMessage from "../Shared/AlertMesagge";

interface WeighSinglePigFormProps {
    pigId: string;
    currentWeight: number;
    onSave: () => void;
}

const WeighSinglePigForm: React.FC<WeighSinglePigFormProps> = ({ pigId, currentWeight, onSave }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ success: false, error: false });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [newWeight, setNewWeight] = useState<string>('');

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleSubmit = async () => {
        if (!configContext || !userLogged) return;

        if (!newWeight || Number(newWeight) <= 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, ingresa un peso válido' });
            return;
        }

        try {
            setIsSubmitting(true);

            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_individual`, {
                pigId,
                weight: Number(newWeight),
                weighedAt: new Date(),
                isGroupAverage: false,
                registeredBy: userLogged._id,
            });

            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Pesaje periódico registrado para cerdo ${pigId}`,
            });

            toggleModal('success');
        } catch (error) {
            console.error('Error registering weight:', { error });
            toggleModal('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="mb-4">
                <h5 className="fw-bold mb-1 text-dark">Registro de Peso</h5>
                <p className="text-muted small">Registra un pesaje periódico para este cerdo.</p>
            </div>

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-3 p-2 rounded" style={{ background: '#f8f9fa' }}>
                        <i className="ri-scales-3-line text-primary fs-5"></i>
                        <span className="text-muted">Peso actual:</span>
                        <span className="fw-bold text-dark">{currentWeight} kg</span>
                    </div>

                    <Label htmlFor="newWeight" className="form-label fw-semibold">Nuevo peso (kg)</Label>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 text-muted">
                            <i className="ri-scales-3-line"></i>
                        </span>
                        <Input
                            id="newWeight"
                            type="number"
                            step="0.01"
                            className="border-start-0 bg-light fw-semibold"
                            placeholder="0.00"
                            value={newWeight}
                            onChange={(e) => setNewWeight(e.target.value)}
                            onFocus={(e) => { if (e.target.value === '0') setNewWeight(''); }}
                            onBlur={(e) => { if (e.target.value === '') setNewWeight(''); }}
                        />
                        <span className="input-group-text bg-light fw-bold text-muted">kg</span>
                    </div>

                    {newWeight && Number(newWeight) > 0 && (
                        <div className="mt-3 p-2 rounded" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <div className="d-flex align-items-center gap-2">
                                <i className="ri-arrow-up-line text-success"></i>
                                <span className="text-muted small">Diferencia:</span>
                                <span className={`fw-bold small ${Number(newWeight) >= currentWeight ? 'text-success' : 'text-danger'}`}>
                                    {Number(newWeight) >= currentWeight ? '+' : ''}{(Number(newWeight) - currentWeight).toFixed(2)} kg
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="d-flex justify-content-end">
                <Button color="success" disabled={isSubmitting} onClick={handleSubmit}>
                    {isSubmitting ? (
                        <>
                            <Spinner size="sm" className="me-2" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <i className="ri-check-line me-2" />
                            Guardar pesaje
                        </>
                    )}
                </Button>
            </div>

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message="Pesaje registrado con éxito" />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message="Ha ocurrido un error al registrar el pesaje, inténtelo más tarde" />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    );
};

export default WeighSinglePigForm;
