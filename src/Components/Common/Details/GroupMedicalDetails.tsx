import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalHeader } from "reactstrap";
import { FiAlertCircle, FiEye } from "react-icons/fi";
import MedicationPackageDetails from "./MedicationPackageDetails";
import VaccinationPlanDetails from "./VaccinationPlanDetails";
import AsignGroupMedicationPackageForm from "../Forms/AsignGroupMedicationPackageForm";
import AsignGroupVaccinationPlanForm from "../Forms/AsignGroupVaccinationPlanForm";
import AsignGroupMedicationForm from "../Forms/AsignGroupMedicationForm";

interface GroupMedicalDetailsProps {
    groupId: string
}

const GroupMedicalDetails: React.FC<GroupMedicalDetailsProps> = ({ groupId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ asignMedication: false, asignMedicationPackage: false, medicationPackageDetails: false, asignVaccinationPlan: false, vaccinationPlanDetails: false, registerSickness: false, sicknessDetails: false });
    const [medicationPackages, setMedicationPackages] = useState<any[]>([]);
    const [medications, setMedications] = useState<any[]>([]);
    const [sickness, setSickeness] = useState<any[]>([]);
    const [vaccinationPlans, setVaccinationPlans] = useState<any[]>([])

    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<string>("")
    const [selectedVaccinationPlan, setSelectedVaccinationPlan] = useState<string>("")
    const [selectedSickness, setSelectedSickness] = useState<string>("");

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchMedicalInfo = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const medicalResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/get_medical_info/${groupId}`)
            const medicalData = medicalResponse.data.data;
            setMedicationPackages(medicalData.medicationPackagesHistory);
            setVaccinationPlans(medicalData.vaccinationPlansHistory)
            setMedications(medicalData.medications)
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

    return (
        <>
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

                            <Button className="" size="sm" onClick={() => toggleModal('asignMedication')}>
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
                                                        <strong className="text-muted">Dosis total:</strong> {m.totalDose} {m.medication.unit_measurement}
                                                    </span>
                                                </div>

                                                <div className="d-flex justify-content-between flex-wrap fs-6 mb-2">
                                                    <span>
                                                        <strong className="text-muted">Dosis por cerdo:</strong> {m.dosePerPig} {m.medication.unit_measurement}
                                                    </span>

                                                    <span>
                                                        <strong className="text-muted">Vía:</strong>{" "}
                                                        {administrationRouteLabels[m.administrationRoute] ?? m.administrationRoute}
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

                            <Button className="" size="sm" onClick={() => toggleModal('asignMedicationPackage')}>
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

                                                <Button className="btn position-absolute" size="sm" style={{ top: "10px", right: "10px", borderRadius: "4px", }} onClick={() => { setSelectedMedicationPackage(p.packageId._id); toggleModal('medicationPackageDetails') }}>
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

                <div className="w-100 d-flex flex-column">
                    <Card className="w-100 flex-grow-1 m-0">
                        <CardHeader className="bg-light d-flex justify-content-between">
                            <h5>Planes de vacunacion asignados</h5>

                            <Button className="" size="sm" onClick={() => toggleModal('asignVaccinationPlan')}>
                                <i className="" />
                                Asignar plan
                            </Button>
                        </CardHeader>
                        <CardBody className={vaccinationPlans.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                            {vaccinationPlans.length === 0 ? (
                                <>
                                    <FiAlertCircle className="text-muted" size={22} />
                                    <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                        No hay planes de vacunacion asignados
                                    </span>
                                </>
                            ) : (
                                <div className="d-flex flex-column gap-3">

                                    {vaccinationPlans.map((p, index) => {
                                        const date = new Date(p.applicationDate).toLocaleString("es-MX", {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        });

                                        const stageLabels: Record<string, string> = {
                                            piglet: "Lechón",
                                            sow: "Cerda",
                                            nursery: "Destete",
                                            grower: "Crecimiento",
                                            finisher: "Finalización",
                                        };

                                        return (
                                            <div key={index} className="p-3 border rounded shadow-sm bg-indigo-50 d-flex flex-column position-relative" style={{ backgroundColor: "#eef2ff" }}>

                                                <Button className="btn position-absolute" size="sm" style={{ top: "10px", right: "10px", borderRadius: "4px", }} onClick={() => { setSelectedVaccinationPlan(p.planId._id); toggleModal('vaccinationPlanDetails') }}>
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

                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asignMedicationPackage} toggle={() => toggleModal("asignMedicationPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignMedicationPackage")}>Asignar paquete de medicacion</ModalHeader>
                <ModalBody>
                    <AsignGroupMedicationPackageForm groupId={groupId} onSave={() => { toggleModal('asignMedicationPackage'); fetchMedicalInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asignMedication} toggle={() => toggleModal("asignMedication")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignMedication")}>Asignar medicacion</ModalHeader>
                <ModalBody>
                    <AsignGroupMedicationForm groupId={groupId} onSave={() => { toggleModal('asignMedication'); fetchMedicalInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.medicationPackageDetails} toggle={() => toggleModal("medicationPackageDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("medicationPackageDetails")}>Detalles de paquete de medicacion</ModalHeader>
                <ModalBody>
                    <MedicationPackageDetails medicationPackageId={selectedMedicationPackage} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asignVaccinationPlan} toggle={() => toggleModal("asignVaccinationPlan")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignVaccinationPlan")}>Asignar plan de vacunacion</ModalHeader>
                <ModalBody>
                    <AsignGroupVaccinationPlanForm groupId={groupId} onSave={() => { toggleModal('asignVaccinationPlan'); fetchMedicalInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.vaccinationPlanDetails} toggle={() => toggleModal("vaccinationPlanDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("vaccinationPlanDetails")}>Detalles del plan de vacunacion</ModalHeader>
                <ModalBody>
                    <VaccinationPlanDetails vaccinationPlanId={selectedVaccinationPlan} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.sicknessDetails} toggle={() => toggleModal("sicknessDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("sicknessDetails")}>Detalles de enfermedad</ModalHeader>
                <ModalBody>

                </ModalBody>
            </Modal>


            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default GroupMedicalDetails;