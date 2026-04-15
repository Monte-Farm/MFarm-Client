import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Badge, Card, CardBody, Col, Modal, ModalBody, ModalHeader, Row } from "reactstrap";
import { RiMedicineBottleLine, RiVirusLine, RiTimerLine, RiHeartPulseLine } from "react-icons/ri";
import MedicationPackageDetails from "./MedicationPackageDetails";
import AsignLitterMedicationPackageForm from "../Forms/AsignLitterMedicationPackage";
import AsignLitterMedicationForm from "../Forms/AsignLitterMedicationForm";
import MedicationPackagesCard from "../Shared/MedicationPackagesCard";
import StatKpiCard from "../Graphics/StatKpiCard";
import ApplicationsTimeline from "../Graphics/ApplicationsTimeline";

interface LitterMedicalDetailsProps {
    litterId: string
}

const LitterMedicalDetails: React.FC<LitterMedicalDetailsProps> = ({ litterId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ asignMedication: false, asignMedicationPackage: false, medicationPackageDetails: false });
    const [medicationPackages, setMedicationPackages] = useState<any[]>([]);
    const [litter, setLitter] = useState<any>({})
    const [medicalStats, setMedicalStats] = useState<any | null>(null);

    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<string>("")

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchMedicalInfo = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const [medicalResponse, litterResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/litter/get_medical_details/${litterId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/litter/find_by_id/${litterId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/litter/medical_stats/${litterId}`),
            ]);

            setMedicationPackages(medicalResponse.data.data.medicationPackagesHistory);
            setLitter(litterResponse.data.data);
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
        healthy: { color: 'success', label: 'Sana', bg: '#d1fae5' },
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
                                title="Enfermedades"
                                value={medicalStats.kpis?.totalSicknesses || 0}
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
                                        Estado de Salud de la Camada
                                    </div>
                                    <Badge color={currentHealth.color} className="fw-normal px-3 py-2 align-self-start" style={{ fontSize: '0.9rem' }}>
                                        {currentHealth.label}
                                    </Badge>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Alerta de tratamiento activo */}
                    {medicalStats.activeSickness && medicalStats.healthStatus === 'treatment' && (
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
                                        <div className="fw-bold text-dark">⚠ Tratamiento Activo: {medicalStats.activeSickness.name}</div>
                                        <div className="small text-muted">
                                            {medicalStats.activeSickness.daysInTreatment} días en tratamiento · Lechones afectados: <strong className="text-dark">{medicalStats.activeSickness.affectedPiglets}</strong>
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

            {/* Cards existentes */}
            <div className="d-flex gap-3 align-items-stretch" style={{ height: "700px" }}>
                <MedicationPackagesCard
                    packages={medicationPackages}
                    onAdd={() => toggleModal("asignMedicationPackage")}
                    onViewDetails={(id) => {
                        setSelectedMedicationPackage(id);
                        toggleModal("medicationPackageDetails");
                    }}
                    status={litter.status}
                />
            </div>

            <Modal size="xl" isOpen={modals.asignMedicationPackage} toggle={() => toggleModal("asignMedicationPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignMedicationPackage")}>Asignar paquete de medicacion</ModalHeader>
                <ModalBody>
                    <AsignLitterMedicationPackageForm litterId={litterId} onSave={() => { toggleModal('asignMedicationPackage'); fetchMedicalInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asignMedication} toggle={() => toggleModal("asignMedication")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignMedication")}>Asignar medicacion</ModalHeader>
                <ModalBody>
                    <AsignLitterMedicationForm litterId={litterId} onSave={() => { toggleModal('asignMedication'); fetchMedicalInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.medicationPackageDetails} toggle={() => toggleModal("medicationPackageDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("medicationPackageDetails")}>Detalles de paquete de medicacion</ModalHeader>
                <ModalBody>
                    <MedicationPackageDetails medicationPackageId={selectedMedicationPackage} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default LitterMedicalDetails;
