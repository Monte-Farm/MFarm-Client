import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Badge, Button, Card, CardBody, CardHeader, Col, Modal, ModalBody, ModalHeader, Row } from "reactstrap";
import { FiAlertCircle, FiEye } from "react-icons/fi";
import { RiMedicineBottleLine, RiVirusLine, RiTimerLine, RiHeartPulseLine } from "react-icons/ri";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import ApplicationsTimeline from "Components/Common/Graphics/ApplicationsTimeline";
import MedicationPackageDetails from "./MedicationPackageDetails";
import VaccinationPlanDetails from "./VaccinationPlanDetails";
import HealthEventDetails from "./HealthEventDetails";
import AsignGroupMedicationPackageForm from "../Forms/AsignGroupMedicationPackageForm";
import AsignGroupVaccinationPlanForm from "../Forms/AsignGroupVaccinationPlanForm";
import AsignGroupMedicationForm from "../Forms/AsignGroupMedicationForm";
import GroupHealthEventForm from "../Forms/AsignGroupHealtEvent";
import HealthEventsCard from "../Shared/HealthEventsCard";
import AdministeredMedicationsCard from "../Shared/AdministeredMedicationsCard";
import MedicationPackagesCard from "../Shared/MedicationPackagesCard";
import VaccinationPlansCard from "../Shared/VaccinationPlansCard";

interface GroupMedicalDetailsProps {
    groupId: string
    onUpdate?: () => void
    isGroupSold?: boolean
}

const GroupMedicalDetails: React.FC<GroupMedicalDetailsProps> = ({ groupId, onUpdate, isGroupSold = false }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ asignMedication: false, asignMedicationPackage: false, medicationPackageDetails: false, asignVaccinationPlan: false, vaccinationPlanDetails: false, registerHealthEvent: false, healthEventDetails: false });
    const [medicationPackages, setMedicationPackages] = useState<any[]>([]);
    const [medications, setMedications] = useState<any[]>([]);
    const [healthEvents, setHealthEvents] = useState<any[]>([]);
    const [vaccinationPlans, setVaccinationPlans] = useState<any[]>([])
    const [medicalStats, setMedicalStats] = useState<any | null>(null);

    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<string>("")
    const [selectedVaccinationPlan, setSelectedVaccinationPlan] = useState<string>("")
    const [selectedSickness, setSelectedSickness] = useState<string>("");

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleResolveEvent = async (eventId: string, endDate: Date) => {
        if (!configContext || !userLogged) return;
        await configContext.axiosHelper.put(`${configContext.apiUrl}/group/resolve_health_event/${groupId}`, {
            eventId,
            endDate,
        });
        await fetchMedicalInfo();
        onUpdate?.();
    };

    const fetchMedicalInfo = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const [medicalResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/get_medical_info/${groupId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/medical_stats/${groupId}`),
            ]);
            const medicalData = medicalResponse.data.data;
            setMedicationPackages(medicalData.medicationPackagesHistory);
            setVaccinationPlans(medicalData.vaccinationPlansHistory)
            setMedications(medicalData.medications)
            const reversedHealthEvents = [...medicalData.healthEvents].reverse();
            setHealthEvents(reversedHealthEvents)
            setMedicalStats(statsResponse.data.data);
        } catch (error) {
            console.error('Error fetching data: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al obtener la informacion medica, intentelo mas tarde' });
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMedicalInfo();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    const healthStatusConfig: Record<string, { color: string; label: string; bg: string }> = {
        healthy: { color: 'success', label: 'Sano', bg: '#d1fae5' },
        treatment: { color: 'danger', label: 'En Tratamiento', bg: '#fee2e2' },
        observation: { color: 'warning', label: 'En Observación', bg: '#fef3c7' },
    };

    const currentHealth = medicalStats ? healthStatusConfig[medicalStats.healthStatus] || healthStatusConfig.healthy : healthStatusConfig.healthy;

    return (
        <>
            {medicalStats && (
                <>
                    {/* KPIs */}
                    <Row className="g-3 mb-3">
                        <Col md={6} lg={3}>
                            <StatKpiCard
                                title="Medicamentos"
                                value={medicalStats.kpis?.totalMedications || 0}
                                icon={<RiMedicineBottleLine size={20} style={{ color: '#0ea5e9' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg={3}>
                            <StatKpiCard
                                title="Eventos Sanitarios"
                                value={medicalStats.kpis?.totalHealthEvents || 0}
                                icon={<RiVirusLine size={20} style={{ color: '#ef4444' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg={3}>
                            <StatKpiCard
                                title="Días desde Última Aplicación"
                                value={medicalStats.kpis?.daysSinceLastApplication ?? 0}
                                suffix="días"
                                icon={<RiTimerLine size={20} style={{ color: '#f59e0b' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg={3}>
                            <Card className="h-100 border-0 shadow-sm" style={{ background: currentHealth.bg }}>
                                <CardBody className="d-flex flex-column justify-content-center">
                                    <div className="text-muted small fw-medium mb-1">
                                        <RiHeartPulseLine className="me-1" />
                                        Estado de Salud del Grupo
                                    </div>
                                    <Badge color={currentHealth.color} className="fw-normal px-3 py-2 align-self-start" style={{ fontSize: '0.9rem' }}>
                                        {currentHealth.label}
                                    </Badge>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Alerta de evento sanitario activo */}
                    {medicalStats.activeHealthEvent && medicalStats.healthStatus === 'treatment' && (
                        <Card className="border-0 shadow-sm mb-3" style={{ borderLeft: '4px solid #ef4444' }}>
                            <CardBody className="py-3">
                                <Row className="align-items-center g-3">
                                    <Col xs="auto">
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: 48, height: 48, background: '#fee2e2' }}
                                        >
                                            <RiVirusLine size={24} style={{ color: '#ef4444' }} />
                                        </div>
                                    </Col>
                                    <Col>
                                        <div className="fw-bold text-dark">⚠ Evento Sanitario Activo: {medicalStats.activeHealthEvent.name}</div>
                                        <div className="small text-muted">
                                            {medicalStats.activeHealthEvent.daysInTreatment} días en tratamiento · Cerdos afectados: <strong className="text-dark">{medicalStats.activeHealthEvent.affectedPigs}</strong>
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    )}

                    {/* Timeline */}
                    <div className="mb-3">
                        <ApplicationsTimeline events={medicalStats.timeline || []} />
                    </div>
                </>
            )}

            <div className="d-flex gap-3 align-items-stretch" style={{ height: "700px" }}>
                <div className="w-100 d-flex flex-column gap-3" style={{ minHeight: 0 }}>
                    <div className="flex-grow-1" style={{ height: "50%", minHeight: 0 }}>
                        <HealthEventsCard
                            events={healthEvents}
                            onAdd={() => toggleModal("registerHealthEvent")}
                            onViewDetails={(id) => {
                                setSelectedSickness(id);
                                toggleModal("healthEventDetails");
                            }}
                            onResolve={handleResolveEvent}
                            disabled={isGroupSold}
                        />
                    </div>
                </div>

                <div className="w-100 d-flex flex-column" style={{ minHeight: 0 }}>
                    <MedicationPackagesCard
                        packages={medicationPackages}
                        onAdd={() => toggleModal("asignMedicationPackage")}
                        onViewDetails={(id) => {
                            setSelectedMedicationPackage(id);
                            toggleModal("medicationPackageDetails");
                        }}
                        disabled={isGroupSold}
                    />
                </div>
            </div>

            <Modal size="xl" isOpen={modals.registerHealthEvent} toggle={() => toggleModal("registerHealthEvent")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("registerHealthEvent")}>Registar evento sanitario</ModalHeader>
                <ModalBody>
                    <GroupHealthEventForm groupId={groupId} onSave={() => { toggleModal('registerHealthEvent'); fetchMedicalInfo(); onUpdate?.(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asignMedicationPackage} toggle={() => toggleModal("asignMedicationPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignMedicationPackage")}>Asignar paquete de medicacion</ModalHeader>
                <ModalBody>
                    <AsignGroupMedicationPackageForm groupId={groupId} onSave={() => { toggleModal('asignMedicationPackage'); fetchMedicalInfo(); onUpdate?.(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.medicationPackageDetails} toggle={() => toggleModal("medicationPackageDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("medicationPackageDetails")}>Detalles de paquete de medicacion</ModalHeader>
                <ModalBody>
                    <MedicationPackageDetails medicationPackageId={selectedMedicationPackage} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.healthEventDetails} toggle={() => toggleModal("healthEventDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("healthEventDetails")}>Detalles del evento sanitario</ModalHeader>
                <ModalBody>
                    <HealthEventDetails eventId={selectedSickness} groupId={groupId} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default GroupMedicalDetails;