import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
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
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { darkenHex } from "utils/colorUtils";

interface PigMedicalDetailsProps { pigId: string }

const PigMedicalDetails: React.FC<PigMedicalDetailsProps> = ({ pigId }) => {
    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
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
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchMedicalInfo(); }, [])

    if (loading) return <LoadingAnimation />;

    const healthStatusConfig: Record<string, { color: string; bg: string }> = {
        healthy: { color: 'success', bg: '#d1fae5' },
        treatment: { color: 'danger', bg: '#fee2e2' },
        observation: { color: 'warning', bg: '#fef3c7' },
    };
    const currentHealth = medicalStats ? healthStatusConfig[medicalStats.healthStatus] || healthStatusConfig.healthy : healthStatusConfig.healthy;

    return (
        <>
            {medicalStats && (
                <>
                    <Row className="g-3 mb-3">
                        <Col md={6} lg>
                            <StatKpiCard title={t('pigs.kpi.medications')} value={medicalStats.kpis?.totalMedications || 0} icon={<RiMedicineBottleLine size={20} style={{ color: '#0ea5e9' }} />} animateValue decimals={0} />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard title={t('pigs.kpi.diseases')} value={medicalStats.kpis?.totalSicknesses || 0} icon={<RiVirusLine size={20} style={{ color: '#ef4444' }} />} animateValue decimals={0} />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard title={t('pigs.kpi.daysSinceLastApp')} value={medicalStats.kpis?.daysSinceLastApplication ?? 0} suffix=" días" icon={<RiTimerLine size={20} style={{ color: '#f59e0b' }} />} animateValue decimals={0} />
                        </Col>
                        <Col md={6} lg>
                            <Card className="h-100 border-0 shadow-sm" style={{ background: currentHealth.bg }}>
                                <CardBody className="d-flex flex-column justify-content-center">
                                    <div className="text-muted small fw-medium mb-1"><RiHeartPulseLine className="me-1" />{t('pigs.kpi.healthStatus')}</div>
                                    <Badge color={currentHealth.color} className="fw-normal px-3 py-2 align-self-start" style={{ fontSize: '0.9rem' }}>
                                        {t(`pigs.health.${medicalStats.healthStatus}`, { defaultValue: medicalStats.healthStatus })}
                                    </Badge>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {medicalStats.activeSickness && medicalStats.healthStatus === 'treatment' && (
                        <Card className="border-0 shadow-sm mb-3" style={{ borderLeft: '4px solid #ef4444' }}>
                            <CardBody className="py-3">
                                <Row className="align-items-center g-3">
                                    <Col xs="auto">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#fee2e2' }}>
                                            <RiVirusLine size={24} style={{ color: '#ef4444' }} />
                                        </div>
                                    </Col>
                                    <Col>
                                        <div className="fw-bold text-dark">{t('medical.medication.activeAlert')} {medicalStats.activeSickness.name}</div>
                                        <div className="small text-muted">{medicalStats.activeSickness.daysInTreatment} {t('medical.medication.daysInTreatment')}</div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    )}

                    <div className="mb-3">
                        <ApplicationsTimeline
                            events={medicalStats.timeline}
                            typeConfig={{
                                medication: { color: '#0ea5e9', icon: RiMedicineBottleLine, label: t('medical.medication.title') },
                                sickness: { color: '#ef4444', icon: RiVirusLine, label: t('medical.sickness.details') },
                            }}
                        />
                    </div>
                </>
            )}

            <div className="d-flex gap-3 align-items-stretch" style={{ height: "700px" }}>
                <div className="w-100 d-flex flex-column gap-3">
                    <Card className="w-100 h-50 flex-grow-1 m-0">
                        <CardHeader className="bg-light d-flex justify-content-between">
                            <h5>{t('pigs.kpi.diseases')}</h5>
                            <Button size="sm" onClick={() => toggleModal('registerSickness')}>{t('medical.sickness.action.register')}</Button>
                        </CardHeader>
                        <CardBody className={sickness.length === 0 ? 'd-flex justify-content-center align-items-center' : ''} style={{ overflowY: 'auto' }}>
                            {sickness.length === 0 ? (
                                <><FiAlertCircle className="text-muted" size={22} /><span className="fs-5 text-muted ms-2">{t('medical.sickness.action.noRecords')}</span></>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {sickness.map((s, index) => (
                                        <div key={index} className="p-3 border rounded shadow-sm bg-light d-flex flex-column position-relative">
                                            <Button className="btn position-absolute" size="sm" style={{ top: "10px", right: "10px", borderRadius: "4px" }} onClick={() => { setSelectedSickness(s._id); toggleModal('sicknessDetails'); }}>
                                                <FiEye size={18} />
                                            </Button>
                                            <strong className="fs-5 mb-2 pe-4">{s.name}</strong>
                                            <div className="d-flex justify-content-between flex-wrap fs-6 mb-2">
                                                <span><strong className="text-muted">{t('medical.sickness.field.status')}:</strong> {t(`medical.sickness.status.${s.status}`, { defaultValue: s.status })}</span>
                                                {s.severity && <span><strong className="text-muted">{t('medical.sickness.field.severity')}:</strong> {t(`medical.sickness.severity.${s.severity}`, { defaultValue: s.severity })}</span>}
                                            </div>
                                            <div className="fs-6 d-flex justify-content-between flex-wrap">
                                                <div><strong className="text-muted">{t('medical.sickness.field.start')}:</strong> {new Date(s.startDate).toLocaleDateString("es-MX")}</div>
                                                <div><strong className="text-muted">{t('medical.sickness.field.end')}:</strong> {s.endDate ? new Date(s.endDate).toLocaleDateString("es-MX") : "—"}</div>
                                            </div>
                                            {s.symptoms?.length > 0 && <div className="mt-2 fs-6"><strong className="text-muted">{t('medical.sickness.field.symptoms')}:</strong> {s.symptoms.join(", ")}</div>}
                                            <div className="mt-1 fs-6"><strong className="text-muted">{t('medical.sickness.field.detectedBy')}:</strong> {s.detectedBy ? `${s.detectedBy.name} ${s.detectedBy.lastname}` : t('medical.sickness.field.unknown')}</div>
                                            {s.observations?.trim() && <div className="mt-2 fs-6"><strong className="text-muted">{t('medical.sickness.field.notes')}:</strong> {s.observations}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <Card className="w-100 h-50 flex-grow-1 m-0">
                        <CardHeader className="bg-light d-flex justify-content-between">
                            <h5>{t('medical.medication.title')}</h5>
                            <Button size="sm" onClick={() => toggleModal('asignSingle')}>{t('medical.medication.action.administer')}</Button>
                        </CardHeader>
                        <CardBody className={medications.length === 0 ? 'd-flex justify-content-center align-items-center' : ''} style={{ overflowY: 'auto' }}>
                            {medications.length === 0 ? (
                                <><FiAlertCircle className="text-muted" size={22} /><span className="fs-5 text-muted ms-2">{t('medical.medication.action.noRecords')}</span></>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {medications.map((m, index) => (
                                        <div key={index} className="p-3 border rounded shadow-sm bg-light d-flex flex-column">
                                            <strong className="fs-5 mb-2">{m.medication.name}</strong>
                                            <div className="d-flex justify-content-between flex-wrap fs-6 mb-2">
                                                <span><strong className="text-muted">{t('medical.medication.field.dose')}:</strong> {m.dose} {m.unit_measurement}</span>
                                                <span><strong className="text-muted">{t('medical.medication.field.route')}:</strong> {t(`medical.medication.route.${m.administration_route}`, { defaultValue: m.administration_route })}</span>
                                            </div>
                                            <div className="fs-6 d-flex justify-content-between">
                                                <div><strong className="text-muted">{t('medical.medication.field.appliedBy')}:</strong> {m.appliedBy ? `${m.appliedBy.name} ${m.appliedBy.lastname}` : t('medical.medication.field.unknown')}</div>
                                                <div><strong className="text-muted">{t('medical.medication.field.date')}:</strong> {new Date(m.applicationDate).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</div>
                                            </div>
                                            {m.observations?.trim() && <div className="mt-2 fs-6"><strong className="text-muted">{t('medical.medication.field.notes')}:</strong> {m.observations}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                <div className="w-100 h-100 d-flex flex-column">
                    <Card className="w-100 h-100 flex-grow-1 m-0">
                        <CardHeader className="bg-light d-flex justify-content-between">
                            <h5>{t('medical.medication.packagesTitle')}</h5>
                            <Button size="sm" onClick={() => toggleModal('medicationPackage')}>{t('medical.medication.action.adminPackage')}</Button>
                        </CardHeader>
                        <CardBody className={medicationPackages.length === 0 ? 'd-flex justify-content-center align-items-center' : ''} style={{ overflowY: 'auto' }}>
                            {medicationPackages.length === 0 ? (
                                <><FiAlertCircle className="text-muted" size={22} /><span className="fs-5 text-muted ms-2">{t('medical.medication.action.noPackages')}</span></>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {medicationPackages.map((p, index) => (
                                        <div key={index} className="p-3 border rounded shadow-sm d-flex flex-column position-relative" style={{ backgroundColor: bg("#eef2ff") }}>
                                            <Button className="btn position-absolute" size="sm" style={{ top: "10px", right: "10px", borderRadius: "4px" }} onClick={() => { setSelectedMedicationPackage(p.packageId); toggleModal('medicationPackageDetails') }}>
                                                <FiEye size={18} />
                                            </Button>
                                            <strong className="fs-5 mb-2 pe-4">{p.name}</strong>
                                            <div className="d-flex flex-column gap-1 fs-6 mb-2">
                                                <span><strong className="text-muted">{t('medical.medication.field.stage')}:</strong> {t(`pigs.stage.${p.stage}`, { defaultValue: p.stage })}</span>
                                            </div>
                                            <div className="fs-6 d-flex justify-content-between flex-wrap gap-2">
                                                <div><strong className="text-muted">{t('medical.medication.field.appliedBy')}:</strong> {p.appliedBy ? `${p.appliedBy.name} ${p.appliedBy.lastname}` : t('medical.medication.field.unknown')}</div>
                                                <div><strong className="text-muted">{t('medical.medication.field.date')}:</strong> {new Date(p.applicationDate).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</div>
                                            </div>
                                            {p.observations?.trim() && <div className="mt-2 fs-6"><strong className="text-muted">{t('medical.medication.field.notes')}:</strong> {p.observations}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            <Modal size="xl" isOpen={modals.registerSickness} toggle={() => toggleModal("registerSickness")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("registerSickness")}>{t('medical.sickness.action.register')}</ModalHeader>
                <ModalBody><PigSicknessForm pigId={pigId ?? ""} onSave={() => { toggleModal('registerSickness'); fetchMedicalInfo(); }} /></ModalBody>
            </Modal>
            <Modal size="xl" isOpen={modals.medicationPackage} toggle={() => toggleModal("medicationPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("medicationPackage")}>{t('medical.medication.packageAssign')}</ModalHeader>
                <ModalBody><AsignMedicationPackageForm pigId={pigId ?? ""} onSave={() => { toggleModal('medicationPackage'); fetchMedicalInfo(); }} /></ModalBody>
            </Modal>
            <Modal size="xl" isOpen={modals.asignSingle} toggle={() => toggleModal("asignSingle")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignSingle")}>{t('medical.medication.assign')}</ModalHeader>
                <ModalBody><AsignMedicationForm pigId={pigId ?? ""} onSave={() => { toggleModal('asignSingle'); fetchMedicalInfo(); }} /></ModalBody>
            </Modal>
            <Modal size="xl" isOpen={modals.medicationPackageDetails} toggle={() => toggleModal("medicationPackageDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("medicationPackageDetails")}>{t('medical.medication.packageDetails')}</ModalHeader>
                <ModalBody><MedicationPackageDetails medicationPackageId={selectedMedicationPackage} /></ModalBody>
            </Modal>
            <Modal size="xl" isOpen={modals.sicknessDetails} toggle={() => toggleModal("sicknessDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("sicknessDetails")}>{t('medical.sickness.details')}</ModalHeader>
                <ModalBody><SicknessDetails pigId={pigId} sicknessId={selectedSickness} /></ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default PigMedicalDetails;
