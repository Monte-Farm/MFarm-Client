import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import SimpleBar from "simplebar-react";

interface BulkGroupStageChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedGroups: any[];
    onSuccess: () => void;
}

interface GroupWeightData {
    groupId: string;
    groupCode: string;
    groupName: string;
    pigsCount: number;
    currentStage: string;
    currentStatus: string;
    nextStage: string;
    totalWeight: string;
    avgWeight: number;
    newStageData: {
        area: string;
        stage: string;
        status: string;
    };
}

const BulkGroupStageChangeModal: React.FC<BulkGroupStageChangeModalProps> = ({
    isOpen,
    onClose,
    selectedGroups,
    onSuccess
}) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ success: false, error: false });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validGroups, setValidGroups] = useState<GroupWeightData[]>([]);
    const [invalidGroups, setInvalidGroups] = useState<Array<{ code: string; reason: string }>>([]);
    const [errorMessage, setErrorMessage] = useState('');

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const getStageTransition = (status: string) => {
        if (status === 'ready_to_grow' || status === 'grow_overdue') {
            return {
                nextStage: 'Crecimiento y Ceba',
                newStageData: {
                    area: 'fattening',
                    stage: 'fattening',
                    status: 'growing'
                }
            };
        } else if (status === 'ready_for_sale') {
            return {
                nextStage: 'Venta',
                newStageData: {
                    area: 'shipping',
                    stage: 'sale',
                    status: 'sale'
                }
            };
        }
        return null;
    };

    const getCurrentStageName = (stage: string) => {
        switch (stage) {
            case 'weaning': return 'Destete';
            case 'fattening': return 'Crecimiento y Ceba';
            case 'sale': return 'Venta';
            default: return stage;
        }
    };

    const validateAndPrepareGroups = () => {
        const valid: GroupWeightData[] = [];
        const invalid: Array<{ code: string; reason: string }> = [];

        selectedGroups.forEach(group => {
            const transition = getStageTransition(group.status);

            if (!transition) {
                invalid.push({
                    code: group.code,
                    reason: `Estado "${group.status}" no permite cambio de etapa`
                });
                return;
            }

            if (!group.pigCount || group.pigCount === 0) {
                invalid.push({
                    code: group.code,
                    reason: 'No tiene cerdos en el grupo'
                });
                return;
            }

            valid.push({
                groupId: group._id,
                groupCode: group.code,
                groupName: group.name,
                pigsCount: group.pigCount,
                currentStage: getCurrentStageName(group.stage),
                currentStatus: group.status,
                nextStage: transition.nextStage,
                totalWeight: '',
                avgWeight: 0,
                newStageData: transition.newStageData
            });
        });

        setValidGroups(valid);
        setInvalidGroups(invalid);
    };

    const handleWeightChange = (groupId: string, value: string) => {
        setValidGroups(prev => prev.map(g => {
            if (g.groupId === groupId) {
                const totalWeight = Number(value) || 0;
                const avgWeight = g.pigsCount > 0 ? totalWeight / g.pigsCount : 0;
                return { ...g, totalWeight: value, avgWeight };
            }
            return g;
        }));
    };

    const handleConfirm = async () => {
        if (!configContext || !userLogged) return;

        // Validar que todos los grupos válidos tengan peso
        const missingWeights = validGroups.filter(g => !g.totalWeight || Number(g.totalWeight) <= 0);
        if (missingWeights.length > 0) {
            setErrorMessage('Por favor, ingresa el peso total para todos los grupos');
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage('');

            // Procesar cada grupo individualmente
            for (const group of validGroups) {
                // 1. Obtener los cerdos del grupo
                const groupResponse = await configContext.axiosHelper.get(
                    `${configContext.apiUrl}/group/find_by_id/${group.groupId}`
                );
                const groupDetails = groupResponse.data.data;
                const alivePigs = groupDetails.pigsInGroup.filter((p: any) => p.status === 'alive');

                // 2. Crear pesajes individuales (todos con peso promedio)
                const weighings = alivePigs.map((pig: any) => ({
                    pigId: pig._id,
                    groupId: group.groupId,
                    weight: group.avgWeight,
                    weighedAt: new Date(),
                    isGroupAverage: false,
                    registeredBy: userLogged._id
                }));

                await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/weighing/create_bulk`,
                    weighings
                );

                // 3. Crear promedio del grupo
                await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/weighing/create_group_average/${group.groupId}`,
                    {
                        avgWeight: group.avgWeight,
                        pigsCount: alivePigs.length,
                        weighedAt: new Date(),
                        registeredBy: userLogged._id
                    }
                );

                // 4. Actualizar pesos de los cerdos
                const pigUpdates = alivePigs.map((pig: any) => ({
                    pigId: pig._id,
                    newWeight: group.avgWeight
                }));

                await configContext.axiosHelper.put(
                    `${configContext.apiUrl}/pig/update_many_pig_weights`,
                    pigUpdates
                );

                // 5. Cambiar etapa del grupo
                await configContext.axiosHelper.put(
                    `${configContext.apiUrl}/group/change_stage/${group.groupId}`,
                    {
                        ...group.newStageData,
                        userId: userLogged._id
                    }
                );
            }

            // 6. Registrar en historial
            await configContext.axiosHelper.create(
                `${configContext.apiUrl}/user/add_user_history/${userLogged._id}`,
                {
                    event: `Cambio de etapa aplicado a ${validGroups.length} grupos`
                }
            );

            toggleModal('success', true);
        } catch (error: any) {
            console.error('Error bulk changing group stages:', error);
            toggleModal('error', true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        toggleModal('success', false);
        onClose();
        onSuccess();
        setValidGroups([]);
        setInvalidGroups([]);
    };

    const handleClose = () => {
        onClose();
        setValidGroups([]);
        setInvalidGroups([]);
        setErrorMessage('');
    };

    useEffect(() => {
        if (isOpen) {
            validateAndPrepareGroups();
        }
    }, [isOpen, selectedGroups]);

    return (
        <>
            <Modal isOpen={isOpen} toggle={handleClose} size="lg" backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={handleClose}>
                    Cambiar Etapa a {selectedGroups.length} Grupos
                </ModalHeader>
                <ModalBody>
                    <div className="mb-3">
                        <small className="text-muted">
                            Esta acción cambiará la etapa de los grupos seleccionados que cumplan los criterios necesarios.
                        </small>
                    </div>

                    {errorMessage && (
                        <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                            <i className="ri-error-warning-line fs-4 me-2"></i>
                            <div>{errorMessage}</div>
                        </div>
                    )}

                    {validGroups.length > 0 && (
                        <>

                            <SimpleBar style={{ maxHeight: 400 }}>
                                {validGroups.map((group, index) => (
                                    <div key={group.groupId} className="card border-success border-opacity-25 mb-3">
                                        <div className="card-body">
                                            {/* Header con código y nombre */}
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0 fw-bold text-dark">
                                                    <i className="ri-folder-3-line text-success me-2"></i>
                                                    {group.groupCode} - {group.groupName}
                                                </h6>
                                                <Badge color="light" className="text-dark border px-3 py-2">
                                                    <i className="ri-group-line me-1"></i>
                                                    <strong>{group.pigsCount}</strong> cerdos
                                                </Badge>
                                            </div>

                                            {/* Transición de etapa */}
                                            <div className="bg-light rounded p-3 mb-3">
                                                <div className="d-flex align-items-center justify-content-center gap-3">
                                                    <div className="text-center">
                                                        <small className="text-muted d-block mb-1">Etapa actual</small>
                                                        <Badge color="info" className="px-3 py-2">{group.currentStage}</Badge>
                                                    </div>
                                                    <i className="ri-arrow-right-line fs-3 text-success"></i>
                                                    <div className="text-center">
                                                        <small className="text-muted d-block mb-1">Nueva etapa</small>
                                                        <Badge color="success" className="px-3 py-2">{group.nextStage}</Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Inputs de peso */}
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <Label className="form-label fw-semibold">
                                                        <i className="ri-scales-3-line text-primary me-1"></i>
                                                        Peso total del grupo (kg)
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={group.totalWeight}
                                                        onChange={(e) => handleWeightChange(group.groupId, e.target.value)}
                                                        placeholder="Ingresa el peso total"
                                                        className={!group.totalWeight || Number(group.totalWeight) <= 0 ? 'border-danger' : ''}
                                                    />
                                                    {(!group.totalWeight || Number(group.totalWeight) <= 0) && (
                                                        <small className="text-danger">
                                                            <i className="ri-error-warning-line me-1"></i>
                                                            Campo requerido
                                                        </small>
                                                    )}
                                                </div>
                                                <div className="col-md-6">
                                                    <Label className="form-label fw-semibold">
                                                        <i className="ri-calculator-line text-success me-1"></i>
                                                        Peso promedio por cerdo
                                                    </Label>
                                                    <div className="form-control bg-light d-flex align-items-center justify-content-between">
                                                        <span className="text-muted">Calculado automáticamente</span>
                                                        <strong className="text-success fs-5">
                                                            {group.avgWeight.toFixed(2)} kg
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </SimpleBar>
                        </>
                    )}

                    {invalidGroups.length > 0 && (
                        <div className="mt-3">
                            <h6 className="fw-semibold text-danger">
                                <i className="ri-close-circle-line me-1"></i>
                                Grupos no válidos ({invalidGroups.length})
                            </h6>
                            <div className="alert alert-warning">
                                <ul className="mb-0">
                                    {invalidGroups.map((group, index) => (
                                        <li key={index}>
                                            <strong>{group.code}:</strong> {group.reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {validGroups.length === 0 && invalidGroups.length > 0 && (
                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                            <i className="ri-error-warning-line fs-4 me-2"></i>
                            <div>
                                <strong>No hay grupos válidos para cambio de etapa</strong>
                                <p className="mb-0 mt-1">Todos los grupos seleccionados no cumplen los criterios necesarios.</p>
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={handleClose}>Cancelar</Button>
                    <Button
                        className="farm-primary-button"
                        onClick={handleConfirm}
                        disabled={isSubmitting || validGroups.length === 0 || validGroups.some(g => !g.totalWeight || Number(g.totalWeight) <= 0)}
                    >
                        {isSubmitting ? <Spinner size="sm" /> : `Confirmar Cambio de Etapa (${validGroups.length})`}
                    </Button>
                </ModalFooter>
            </Modal>

            <SuccessModal
                isOpen={modals.success}
                onClose={handleSuccessClose}
                message={`El cambio de etapa ha sido aplicado exitosamente a ${validGroups.length} grupo${validGroups.length !== 1 ? 's' : ''}.`}
            />

            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error', false)}
                message="Ha ocurrido un error al cambiar la etapa de los grupos. Por favor, inténtelo más tarde."
            />
        </>
    );
};

export default BulkGroupStageChangeModal;
