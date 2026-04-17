import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FaQuestionCircle } from "react-icons/fa";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import { Badge, Button, Input, Spinner } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import SimpleBar from "simplebar-react";

interface WeighGroupFormProps {
    groupId: string;
    onSave: () => void;
}

const WeighGroupForm: React.FC<WeighGroupFormProps> = ({ groupId, onSave }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ success: false, error: false });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [pigsArray, setPigsArray] = useState<any[]>([]);
    const [useIndividualWeight, setUseIndividualWeight] = useState<boolean>(false);
    const [totalGroupWeight, setTotalGroupWeight] = useState<string>('');

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchGroup = async () => {
        if (!configContext || !groupId) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${groupId}`);
            const groupDetails = response.data.data;
            const filteredPigs = groupDetails.pigsInGroup.filter((p: any) => p.status === 'alive');
            setPigsArray(filteredPigs.map((pig: any) => ({ ...pig, newWeight: '' })));
        } catch (error) {
            console.error('Error fetching group:', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al obtener los datos del grupo' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!configContext || !userLogged) return;

        if (pigsArray.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'No hay cerdos activos en el grupo' });
            return;
        }

        const hasEmptyWeights = pigsArray.some(p => p.newWeight === '' || Number(p.newWeight) <= 0);
        if (hasEmptyWeights) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, ingresa el peso de todos los cerdos' });
            return;
        }

        try {
            setIsSubmitting(true);

            const weighings = pigsArray.map(pig => ({
                pigId: pig._id,
                groupId,
                weight: Number(pig.newWeight),
                weighedAt: new Date(),
                isGroupAverage: false,
                registeredBy: userLogged._id,
            }));

            const avgWeight = pigsArray.reduce((sum, p) => sum + Number(p.newWeight), 0) / pigsArray.length;

            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_bulk`, weighings);

            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_group_average/${groupId}`, {
                avgWeight,
                pigsCount: pigsArray.length,
                weighedAt: new Date(),
                registeredBy: userLogged._id,
            });

            await configContext.axiosHelper.put(`${configContext.apiUrl}/pig/update_many_pig_weights`, pigsArray.map(pig => ({
                pigId: pig._id,
                newWeight: Number(pig.newWeight),
            })));

            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Pesaje periódico registrado para grupo ${groupId}`,
            });

            toggleModal('success');
        } catch (error) {
            console.error('Error registering weights:', { error });
            toggleModal('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!useIndividualWeight && totalGroupWeight && pigsArray.length > 0) {
            const avg = Number(totalGroupWeight) / pigsArray.length;
            setPigsArray(prev => prev.map(pig => ({ ...pig, newWeight: avg })));
        }
    }, [totalGroupWeight, useIndividualWeight, pigsArray.length]);

    useEffect(() => {
        fetchGroup();
    }, []);

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <>
            <div className="mb-4">
                <h5 className="fw-bold mb-1 text-dark">Registro de Peso</h5>
                <p className="text-muted small">Registra el pesaje periódico del grupo sin cambiar de etapa.</p>
            </div>

            <div
                className="card border-2 border-primary bg-primary-subtle mb-3"
                role="button"
                onClick={() => setUseIndividualWeight(!useIndividualWeight)}
            >
                <div className="card-body d-flex align-items-center gap-3">
                    <Input className="form-check-input mt-0" type="checkbox" checked={useIndividualWeight} readOnly />
                    <FaQuestionCircle className="text-primary" size={20} />
                    <div>
                        <div className="fw-semibold">Ingresar peso individual de cada cerdo</div>
                        <div className="small text-muted">
                            {useIndividualWeight
                                ? 'Ingresa el peso de cada cerdo individualmente'
                                : 'Ingresa el peso total del grupo y se asignará el peso promedio a cada cerdo'}
                        </div>
                    </div>
                </div>
            </div>

            {!useIndividualWeight && (
                <div className="card border-secondary-subtle mb-3">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Peso total del grupo (kg)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    value={totalGroupWeight}
                                    onChange={(e) => setTotalGroupWeight(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="col-md-6">
                                <div className="mt-4">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="ri-calculator-line text-primary"></i>
                                        <span className="text-muted">Peso promedio por cerdo:</span>
                                        <span className="fw-bold text-primary">
                                            {totalGroupWeight && pigsArray.length > 0
                                                ? (Number(totalGroupWeight) / pigsArray.length).toFixed(2)
                                                : '0.00'} kg
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 mt-1">
                                        <i className="ri-group-line text-info"></i>
                                        <span className="text-muted">Total de cerdos:</span>
                                        <span className="fw-bold text-info">{pigsArray.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {useIndividualWeight && (
                <SimpleBar style={{ maxHeight: 450, paddingRight: 12 }}>
                    {pigsArray.map((pig, index) => {
                        const isMale = pig.sex === 'male';
                        const accentColor = isMale ? 'primary' : 'danger';

                        return (
                            <div key={index} className="card border-0 shadow-sm mb-3 overflow-hidden" style={{ borderLeft: `5px solid var(--bs-${accentColor})` }}>
                                <div className="card-body p-3">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <div className={`bg-${accentColor} bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: 48, height: 48 }}>
                                                <i className={`ri-${isMale ? 'men-line' : 'women-line'} fs-4 text-${accentColor}`}></i>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <h6 className="mb-0 fw-bold text-dark">Cerdo {pig.code}</h6>
                                            <Badge color={accentColor} className="bg-opacity-25 text-uppercase px-2" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                                                {isMale ? 'Macho' : 'Hembra'}
                                            </Badge>
                                        </div>
                                        <div className="col-sm-5 col-12 mt-3 mt-sm-0">
                                            <small className="text-muted">Actual: {pig.weight} kg</small>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0 text-muted small">
                                                    <i className="ri-scales-3-line"></i>
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control border-start-0 bg-light fw-semibold text-end"
                                                    placeholder="0.00"
                                                    value={pigsArray[index].newWeight}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        const newArray = [...pigsArray];
                                                        newArray[index].newWeight = value === '' ? '' : Number(value);
                                                        setPigsArray(newArray);
                                                    }}
                                                    onFocus={() => {
                                                        if (pigsArray[index].newWeight === 0) {
                                                            const newArray = [...pigsArray];
                                                            newArray[index].newWeight = '';
                                                            setPigsArray(newArray);
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (pigsArray[index].newWeight === '') {
                                                            const newArray = [...pigsArray];
                                                            newArray[index].newWeight = 0;
                                                            setPigsArray(newArray);
                                                        }
                                                    }}
                                                />
                                                <span className="input-group-text bg-light fw-bold text-muted">kg</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </SimpleBar>
            )}

            <div className="mt-4 pt-2 border-top d-flex align-items-center justify-content-between">
                <span className="text-muted small">
                    Total cerdos: <strong>{pigsArray.length}</strong>
                </span>
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

export default WeighGroupForm;
