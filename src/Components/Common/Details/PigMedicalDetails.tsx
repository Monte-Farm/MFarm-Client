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
import PigSicknessForm from "../Forms/PigSicknessForm";
import SicknessDetails from "./SicknessDetailsModal";
import AsignMedicationPackageForm from "../Forms/AsignMedicationPackageForm";
import AsignMedicationForm from "../Forms/AsignMedicationForm";

interface PigMedicalDetailsProps {
    pigId: string
}

const PigMedicalDetails: React.FC<PigMedicalDetailsProps> = ({ pigId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ asignSingle: false, medicationPackage: false, medicationPackageDetails: false, registerSickness: false, sicknessDetails: false });
    const [medicationPackages, setMedicationPackages] = useState<any[]>([]);
    const [medications, setMedications] = useState<any[]>([]);
    const [sickness, setSickeness] = useState<any[]>([]);
    const [medicalStats, setMedicalStats] = useState<any | null>(null);

    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<string>("")
    const [selectedSickness, setSelectedSickness] = useState<string>("");

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchMedicalInfo = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const [medicalResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/get_medical_info/${pigId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/medical_stats/${pigId}`),
            ]);
            const medicalData = medicalResponse.data.data;

            setMedicationPackages(medicalData.medicationPackagesHistory);
            setMedications(medicalData.medications);
            setSickeness(medicalData.sicknessHistory)
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
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Medicamentos"
                                value={medicalStats.kpis?.totalMedications || 0}
                                icon={<RiMedicineBottleLine size={20} style={{ color: '#0ea5e9' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Enfermedades"
                                value={medicalStats.kpis?.totalSicknesses || 0}
                                icon={<RiVirusLine size={20} style={{ color: '#ef4444' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Días desde Última Aplicación"
                                value={medicalStats.kpis?.daysSinceLastApplication ?? 0}
                                suffix="días"
                                icon={<RiTimerLine size={20} style={{ color: '#f59e0b' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg>
                            <Card className="h-100 border-0 shadow-sm" style={{ background: currentHealth.bg }}>
                                <CardBody className="d-flex flex-column justify-content-center">
                                    <div className="text-muted small fw-medium mb-1">
                                        <RiHeartPulseLine className="me-1" />
                                        Estado de Salud
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
                                            {medicalStats.activeSickness.daysInTreatment} días en tratamiento
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    )}

                    {/* Timeline */}
                    <div className="mb-3">
                        <ApplicationsTimeline
                            events={medicalStats.timeline}
                            typeConfig={{
                                medication: { color: '#0ea5e9', icon: RiMedicineBottleLine, label: 'Medicamento' },
                                sickness: { color: '#ef4444', icon: RiVirusLine, label: 'Enfermedad' },
                            }}
                        />
                    </div>
                </>
            )}

            <div className="d-flex gap-3 align-items-stretch" style={{ height: "700px" }}>
                <div className="w-100 d-flex flex-column gap-3">
                    <Card className="w-100 h-50 flex-grow-1 m-0">
                        <CardHeader className="bg-light d-flex justify-content-between">
                            <h5>Enfermedades</h5>

                            <Button className="" size="sm" onClick={() => toggleModal('registerSickness')}>
                                <i className="" />
                                Registrar enfermedad
                            </Button>
                        </CardHeader>
                        <CardBody className={sickness.length === 0 ? 'd-flex justify-content-center align-items-center' : ''} style={{ overflowY: 'auto' }}>
                            {sickness.length === 0 ? (
                                <>
                                    <FiAlertCircle className="text-muted" size={22} />
                                    <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                        No hay enfermedades registradas
                                    </span>
                                </>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {sickness.map((s, index) => {
                                        const startDate = new Date(s.startDate).toLocaleDateString("es-MX");
                                        const endDate = s.endDate
                                            ? new Date(s.endDate).toLocaleDateString("es-MX")
                                            : null;

                                        /* ===== MAPEOS ===== */
                                        const statusLabels: Record<string, string> = {
                                            active: "Activa",
                                            recovered: "Recuperada",
                                            dead: "Fallecido",
                                        };

                                        const severityLabels: Record<string, string> = {
                                            mild: "Leve",
                                            medium: "Media",
                                            severe: "Grave",
                                        };

                                        return (
                                            <div
                                                key={index}
                                                className="p-3 border rounded shadow-sm bg-light d-flex flex-column position-relative"
                                            >
                                                <Button className="btn position-absolute" size="sm" style={{ top: "10px", right: "10px", borderRadius: "4px" }} onClick={() => { setSelectedSickness(s._id); toggleModal('sicknessDetails'); }}>
                                                    <FiEye size={18} />
                                                </Button>

                                                {/* Nombre */}
                                                <strong className="fs-5 mb-2 pe-4">
                                                    {s.name}
                                                </strong>

                                                {/* Estado y severidad */}
                                                <div className="d-flex justify-content-between flex-wrap fs-6 mb-2">
                                                    <span>
                                                        <strong className="text-muted">Estado:</strong>{" "}
                                                        {statusLabels[s.status] ?? s.status}
                                                    </span>

                                                    {s.severity && (
                                                        <span>
                                                            <strong className="text-muted">Severidad:</strong>{" "}
                                                            {severityLabels[s.severity] ?? s.severity}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Fechas */}
                                                <div className="fs-6 d-flex justify-content-between flex-wrap">
                                                    <div>
                                                        <strong className="text-muted">Inicio:</strong> {startDate}
                                                    </div>

                                                    <div>
                                                        <strong className="text-muted">Fin:</strong>{" "}
                                                        {endDate ?? "—"}
                                                    </div>
                                                </div>

                                                {/* Síntomas */}
                                                {s.symptoms?.length > 0 && (
                                                    <div className="mt-2 fs-6">
                                                        <strong className="text-muted">Síntomas:</strong>{" "}
                                                        {s.symptoms.join(", ")}
                                                    </div>
                                                )}

                                                {/* Detectado por */}
                                                <div className="mt-1 fs-6">
                                                    <strong className="text-muted">Detectado por:</strong>{" "}
                                                    {s.detectedBy
                                                        ? `${s.detectedBy.name} ${s.detectedBy.lastname}`
                                                        : "Desconocido"}
                                                </div>

                                                {/* Observaciones */}
                                                {s.observations && s.observations.trim() !== "" && (
                                                    <div className="mt-2 fs-6">
                                                        <strong className="text-muted">Notas:</strong>{" "}
                                                        {s.observations}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <Card className="w-100 h-50 flex-grow-1 m-0">
                        <CardHeader className="bg-light d-flex justify-content-between">
                            <h5>Medicamentos administrados</h5>

                            <Button className="" size="sm" onClick={() => toggleModal('asignSingle')}>
                                <i className="" />
                                Administrar medicamento
                            </Button>
                        </CardHeader>
                        <CardBody className={medications.length === 0 ? 'd-flex justify-content-center align-items-center' : ''} style={{ overflowY: 'auto' }}>
                            {medications.length === 0 ? (
                                <>
                                    <FiAlertCircle className="text-muted" size={22} />
                                    <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                        No hay medicamentos administrados
                                    </span>
                                </>
                            ) : (
                                <div className="d-flex flex-column gap-2">

                                    {medications.map((m, index) => {
                                        const date = new Date(m.applicationDate).toLocaleString("es-MX", {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        });

                                        const administrationRouteLabels: Record<string, string> = {
                                            oral: "Oral",
                                            intramuscular: "Intramuscular",
                                            subcutaneous: "Subcutánea",
                                            intravenous: "Intravenosa",
                                            intranasal: "Intranasal",
                                            topical: "Tópica",
                                            rectal: "Rectal",
                                        };

                                        return (
                                            <div key={index} className="p-3 border rounded shadow-sm bg-light d-flex flex-column">

                                                <strong className="fs-5 mb-2">
                                                    {m.medication.name}
                                                </strong>

                                                <div className="d-flex justify-content-between flex-wrap fs-6 mb-2">
                                                    <span>
                                                        <strong className="text-muted">Dosis:</strong> {m.dose} {m.unit_measurement}
                                                    </span>

                                                    <span>
                                                        <strong className="text-muted">Vía:</strong>{" "}
                                                        {administrationRouteLabels[m.administration_route] ?? m.administration_route}
                                                    </span>
                                                </div>

                                                <div className="fs-6 d-flex justify-content-between">
                                                    <div>
                                                        <strong className="text-muted">Aplicado por:</strong>{" "}
                                                        {m.appliedBy ? `${m.appliedBy.name} ${m.appliedBy.lastname}` : "Desconocido"}
                                                    </div>

                                                    <div className="">
                                                        <strong className="text-muted">Fecha:</strong> {date}
                                                    </div>

                                                </div>

                                                {m.observations && m.observations.trim() !== "" && (
                                                    <div className="mt-2 fs-6">
                                                        <strong className="text-muted">Notas:</strong> {m.observations}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                <div className="w-100 h-100 d-flex flex-column">
                    <Card className="w-100 h-100 flex-grow-1 m-0">
                        <CardHeader className="bg-light d-flex justify-content-between">
                            <h5>Paquetes de medicacion administrados</h5>

                            <Button className="" size="sm" onClick={() => toggleModal('medicationPackage')}>
                                <i className="" />
                                Administrar paquete
                            </Button>
                        </CardHeader>
                        <CardBody className={medicationPackages.length === 0 ? 'd-flex justify-content-center align-items-center' : ''} style={{ overflowY: 'auto' }}>
                            {medicationPackages.length === 0 ? (
                                <>
                                    <FiAlertCircle className="text-muted" size={22} />
                                    <span className="fs-5 text-muted text-center rounded-5 ms-2">
                                        No hay paquetes administrados
                                    </span>
                                </>
                            ) : (
                                <div className="d-flex flex-column gap-3">

                                    {medicationPackages.map((p, index) => {
                                        const date = new Date(p.applicationDate).toLocaleString("es-MX", {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        });

                                        const stageLabels: Record<string, string> = {
                                            piglet: "Lechón",
                                            weaning: "Destete",
                                            fattening: "Engorda",
                                            breeder: "Reproductor",
                                            general: 'General'
                                        };

                                        return (
                                            <div key={index} className="p-3 border rounded shadow-sm bg-indigo-50 d-flex flex-column position-relative" style={{ backgroundColor: "#eef2ff" }}>

                                                <Button className="btn position-absolute" size="sm" style={{ top: "10px", right: "10px", borderRadius: "4px", }} onClick={() => { setSelectedMedicationPackage(p.packageId); toggleModal('medicationPackageDetails') }}>
                                                    <FiEye size={18} />
                                                </Button>

                                                <strong className="fs-5 mb-2 pe-4">
                                                    {p.name}
                                                </strong>

                                                <div className="d-flex flex-column gap-1 fs-6 mb-2">

                                                    <span>
                                                        <strong className="text-muted">Etapa:</strong>{" "}
                                                        {stageLabels[p.stage] ?? p.stage}
                                                    </span>
                                                </div>

                                                <div className="fs-6 d-flex justify-content-between flex-wrap gap-2">
                                                    <div>
                                                        <strong className="text-muted">Aplicado por:</strong>{" "}
                                                        {p.appliedBy ? `${p.appliedBy.name} ${p.appliedBy.lastname}` : "Desconocido"}
                                                    </div>

                                                    <div>
                                                        <strong className="text-muted">Fecha:</strong> {date}
                                                    </div>
                                                </div>

                                                {p.observations && p.observations.trim() !== "" && (
                                                    <div className="mt-2 fs-6">
                                                        <strong className="text-muted">Notas:</strong>{" "}
                                                        {p.observations}
                                                    </div>
                                                )}

                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardBody>

                    </Card>
                </div>

            </div>

            <Modal size="xl" isOpen={modals.registerSickness} toggle={() => toggleModal("registerSickness")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("registerSickness")}>Registar enfermedad</ModalHeader>
                <ModalBody>
                    <PigSicknessForm pigId={pigId ?? ""} onSave={() => { toggleModal('registerSickness'); fetchMedicalInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.medicationPackage} toggle={() => toggleModal("medicationPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("medicationPackage")}>Asignar paquete de medicacion</ModalHeader>
                <ModalBody>
                    <AsignMedicationPackageForm pigId={pigId ?? ""} onSave={() => { toggleModal('medicationPackage'); fetchMedicalInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asignSingle} toggle={() => toggleModal("asignSingle")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignSingle")}>Asignar medicacion</ModalHeader>
                <ModalBody>
                    <AsignMedicationForm pigId={pigId ?? ""} onSave={() => { toggleModal('asignSingle'); fetchMedicalInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.medicationPackageDetails} toggle={() => toggleModal("medicationPackageDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("medicationPackageDetails")}>Detalles de paquete de medicacion</ModalHeader>
                <ModalBody>
                    <MedicationPackageDetails medicationPackageId={selectedMedicationPackage} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.sicknessDetails} toggle={() => toggleModal("sicknessDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("sicknessDetails")}>Detalles de enfermedad</ModalHeader>
                <ModalBody>
                    <SicknessDetails pigId={pigId} sicknessId={selectedSickness} />
                </ModalBody>
            </Modal>


            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default PigMedicalDetails;