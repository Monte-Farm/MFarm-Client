import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useState } from "react";
import { Button, Input, Label, Spinner } from "reactstrap";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import AlertMessage from "../Shared/AlertMesagge";
import { useTranslation } from "react-i18next";

interface WeighSinglePigFormProps {
    pigId: string;
    currentWeight: number;
    onSave: () => void;
}

const WeighSinglePigForm: React.FC<WeighSinglePigFormProps> = ({ pigId, currentWeight, onSave }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
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
            setAlertConfig({ visible: true, color: 'danger', message: t('form.pig.error.invalidWeight') });
            return;
        }
        try {
            setIsSubmitting(true);
            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_individual`, {
                pigId, weight: Number(newWeight), weighedAt: new Date(), isGroupAverage: false, registeredBy: userLogged._id,
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
                <h5 className="fw-bold mb-1 text-dark">{t('pigs.weight.title')}</h5>
                <p className="text-muted small">{t('pigs.weight.description')}</p>
            </div>

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-3 p-2 rounded" style={{ background: '#f8f9fa' }}>
                        <i className="ri-scales-3-line text-primary fs-5"></i>
                        <span className="text-muted">{t('pigs.weight.current')}</span>
                        <span className="fw-bold text-dark">{currentWeight} kg</span>
                    </div>

                    <Label htmlFor="newWeight" className="form-label fw-semibold">{t('pigs.weight.new')}</Label>
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
                                <span className="text-muted small">{t('pigs.weight.diff')}</span>
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
                        <><Spinner size="sm" className="me-2" />{t('form.pig.action.saving')}</>
                    ) : (
                        <><i className="ri-check-line me-2" />{t('form.pig.action.saveWeight')}</>
                    )}
                </Button>
            </div>

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('form.pig.success.weightRegistered')} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t('form.pig.error.weight')} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    );
};

export default WeighSinglePigForm;
