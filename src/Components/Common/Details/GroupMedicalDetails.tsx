import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Badge, Button, Card, CardBody, CardHeader, Col, Modal, ModalBody, ModalHeader, Row } from "reactstrap";
import { FiAlertCircle, FiEye } from "react-icons/fi";
import { RiMedicineBottleLine, RiVirusLine, RiTimerLine, RiHeartPulseLine } from "react-icons/ri";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import ApplicationsTimeline from "Components/Common/Graphics/ApplicationsTimeline";
import MedicationPackageDetails from "./MedicationPackageDetails";
import HealthEventDetails from "./HealthEventDetails";
import AsignGroupMedicationCombinedForm from "../Forms/AsignGroupMedicationCombinedForm";
import GroupHealthEventForm from "../Forms/AsignGroupHealtEvent";
import HealthEventsCard from "../Shared/HealthEventsCard";
import { useSelector } from "react-redux";
import { darkenHex } from "utils/colorUtils";

interface GroupMedicalDetailsProps {
    groupId: string
    onUpdate?: () => void
    isGroupSold?: boolean
}

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const GroupMedicalDetails: React.FC<GroupMedicalDetailsProps> = ({ groupId, onUpdate, isGroupSold = false }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ asignMedication: false, medicationPackageDetails: false, registerHealthEvent: false, healthEventDetails: false });
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [medicationPackages, setMedicationPackages] = useState<any[]>([]);
    const [medications, setMedications] = useState<any[]>([]);
    const [healthEvents, setHealthEvents] = useState<any[]>([]);
    const [medicalStats, setMedicalStats] = useState<any | null>(null);

    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<string>("")
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
            setMedications(medicalData.medications)
            const reversedHealthEvents = [...medicalData.healthEvents].reverse();
            setHealthEvents(reversedHealthEvents)
            setMedicalStats(statsResponse.data.data);
        } catch (error) {
            logger.error('Error fetching data: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('medical.error.load') });
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMedicalInfo();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    const healthStatusConfig: Record<string, { color: string; label: string; bg: string }> = {
        healthy: { color: 'success', label: t('medical.health.status.healthy'), bg: '#d1fae5' },
        treatment: { color: 'danger', label: t('medical.health.status.treatment'), bg: '#fee2e2' },
        observation: { color: 'warning', label: t('medical.health.status.observation'), bg: '#fef3c7' },
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
                                title={t('medical.kpi.medications')}
                                value={medicalStats.kpis?.totalMedications || 0}
                                icon={<RiMedicineBottleLine size={20} style={{ color: '#0ea5e9' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg={3}>
                            <StatKpiCard
                                title={t('medical.kpi.healthEvents')}
                                value={medicalStats.kpis?.totalHealthEvents || 0}
                                icon={<RiVirusLine size={20} style={{ color: '#ef4444' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg={3}>
                            <StatKpiCard
                                title={t('medical.kpi.daysSinceLastApplication')}
                                value={medicalStats.kpis?.daysSinceLastApplication ?? 0}
                                suffix={t('medical.kpi.days')}
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
                                        {t('medical.health.groupLabel')}
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
                                        <div className="fw-bold text-dark">{t('medical.healthEvent.active')} {medicalStats.activeHealthEvent.name}</div>
                                        <div className="small text-muted">
                                            {medicalStats.activeHealthEvent.daysInTreatment} {t('medical.healthEvent.days')} <strong className="text-dark">{medicalStats.activeHealthEvent.affectedPigs}</strong>
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
                <div className="w-50 d-flex flex-column" style={{ minHeight: 0 }}>
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

                <Card className="w-50 h-100 m-0">
                    <CardHeader className="bg-light d-flex justify-content-between">
                        <h5>{t('medical.medication.applicationsTitle')}</h5>
                        <Button size="sm" onClick={() => toggleModal('asignMedication')} disabled={isGroupSold}>{t('medical.medication.action.administer')}</Button>
                    </CardHeader>
                    <CardBody className={(medications.length === 0 && medicationPackages.length === 0) ? 'd-flex justify-content-center align-items-center' : ''} style={{ overflowY: 'auto' }}>
                        {medications.length === 0 && medicationPackages.length === 0 ? (
                            <><FiAlertCircle className="text-muted" size={22} /><span className="fs-5 text-muted ms-2">{t('medical.medication.action.noRecords')}</span></>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {[
                                    ...medicationPackages.map((p: any) => ({ ...p, _type: 'package' as const, _date: p.applicationDate })),
                                    ...medications.map((m: any) => ({ ...m, _type: 'individual' as const, _date: m.applicationDate })),
                                ]
                                    .sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime())
                                    .map((item: any, index: number) => item._type === 'package' ? (
                                        <div key={`p-${index}`} className="p-3 border rounded shadow-sm d-flex flex-column position-relative" style={{ backgroundColor: bg("#eef2ff") }}>
                                            <Button className="btn position-absolute" size="sm" style={{ top: "10px", right: "10px", borderRadius: "4px" }} onClick={() => { setSelectedMedicationPackage(item.packageId?._id || item.packageId); toggleModal('medicationPackageDetails') }}>
                                                <FiEye size={18} />
                                            </Button>
                                            <div className="d-flex align-items-center gap-2 mb-2 pe-5">
                                                <Badge color="info">{t('medical.medication.type.package')}</Badge>
                                                <strong className="fs-5">{item.name}</strong>
                                            </div>
                                            {item.stage && (
                                                <div className="fs-6 mb-2">
                                                    <strong className="text-muted">{t('medical.medication.field.stage')}:</strong>{' '}
                                                    {t(`pigs.stage.${item.stage}`, { defaultValue: item.stage })}
                                                </div>
                                            )}
                                            <div className="fs-6 d-flex justify-content-between flex-wrap gap-2">
                                                <div><strong className="text-muted">{t('medical.medication.field.appliedBy')}:</strong> {item.appliedBy ? `${item.appliedBy.name} ${item.appliedBy.lastname}` : t('medical.medication.field.unknown')}</div>
                                                <div><strong className="text-muted">{t('medical.medication.field.date')}:</strong> {new Date(item.applicationDate).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</div>
                                            </div>
                                            {item.observations?.trim() && <div className="mt-2 fs-6"><strong className="text-muted">{t('medical.medication.field.notes')}:</strong> {item.observations}</div>}
                                        </div>
                                    ) : (
                                        <div key={`m-${index}`} className="p-3 border rounded shadow-sm bg-light d-flex flex-column">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <Badge color="success">{t('medical.medication.type.individual')}</Badge>
                                                <strong className="fs-5">{item.medication?.name}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between flex-wrap fs-6 mb-2">
                                                <span><strong className="text-muted">{t('medication.card.medications.perHead')}</strong> {item.dosePerPig} {item.medication?.unit_measurement}</span>
                                                <span><strong className="text-muted">{t('medication.card.medications.totalDose')}</strong> {item.totalDose} {item.medication?.unit_measurement}</span>
                                                <span><strong className="text-muted">{t('medical.medication.field.route')}:</strong> {t(`medical.medication.route.${item.administrationRoute}`, { defaultValue: item.administrationRoute })}</span>
                                            </div>
                                            <div className="fs-6 d-flex justify-content-between flex-wrap gap-2">
                                                <div><strong className="text-muted">{t('medical.medication.field.appliedBy')}:</strong> {item.appliedBy ? `${item.appliedBy.name} ${item.appliedBy.lastname}` : t('medical.medication.field.unknown')}</div>
                                                <div><strong className="text-muted">{t('medical.medication.field.date')}:</strong> {new Date(item.applicationDate).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</div>
                                            </div>
                                            {item.observations?.trim() && <div className="mt-2 fs-6"><strong className="text-muted">{t('medical.medication.field.notes')}:</strong> {item.observations}</div>}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <Modal size="xl" isOpen={modals.registerHealthEvent} toggle={() => toggleModal("registerHealthEvent")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("registerHealthEvent")}>{t('medical.healthEvent.register')}</ModalHeader>
                <ModalBody>
                    <GroupHealthEventForm groupId={groupId} onSave={() => { toggleModal('registerHealthEvent'); fetchMedicalInfo(); onUpdate?.(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asignMedication} toggle={() => toggleModal("asignMedication")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("asignMedication")}>{t('medical.medication.assign')}</ModalHeader>
                <ModalBody>
                    <AsignGroupMedicationCombinedForm groupId={groupId} onSave={() => { toggleModal('asignMedication'); fetchMedicalInfo(); onUpdate?.(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.medicationPackageDetails} toggle={() => toggleModal("medicationPackageDetails")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("medicationPackageDetails")}>{t('medical.medication.packageDetails')}</ModalHeader>
                <ModalBody>
                    <MedicationPackageDetails medicationPackageId={selectedMedicationPackage} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.healthEventDetails} toggle={() => toggleModal("healthEventDetails")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("healthEventDetails")}>{t('medical.healthEvent.details')}</ModalHeader>
                <ModalBody>
                    <HealthEventDetails eventId={selectedSickness} groupId={groupId} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default GroupMedicalDetails;