import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalHeader } from "reactstrap";
import { FiAlertCircle, FiEye } from "react-icons/fi";
import MedicationPackageDetails from "./MedicationPackageDetails";
import VaccinationPlanDetails from "./VaccinationPlanDetails";
import AsignLitterMedicationPackageForm from "../Forms/AsignLitterMedicationPackage";
import AsignLitterVaccinationPlanForm from "../Forms/AsignLitterVaccinationPlanForm";
import AsignLitterMedicationForm from "../Forms/AsignLitterMedicationForm";

interface LitterMedicalDetailsProps {
    litterId: string
}

const LitterMedicalDetails: React.FC<LitterMedicalDetailsProps> = ({ litterId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ asignMedication: false, asignMedicationPackage: false, medicationPackageDetails: false, asignVaccinationPlan: false, vaccinationPlanDetails: false });
    const [medicationPackages, setMedicationPackages] = useState<any[]>([]);
    const [medications, setMedications] = useState<any[]>([]);
    const [vaccinationPlans, setVaccinationPlans] = useState<any[]>([])

    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<string>("")
    const [selectedVaccinationPlan, setSelectedVaccinationPlan] = useState<string>("")

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchMedicalInfo = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const medicalResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/litter/get_medical_details/${litterId}`)
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
                <div className="w-100 d-flex flex-column">
                    <Card className="w-100 h-50 flex-grow-1 m-0">
                        <CardHeader className="bg-light d-flex justify-content-between">
                            <h5>Medicamentos administrados</h5>

                            <Button className="" size="sm" onClick={() => toggleModal('asignMedication')}>
                                <i className="" />
                                Administrar medicamento
                            </Button>
                        </CardHeader>
                        <CardBody className={medications?.length === 0 ? 'd-flex justify-content-center align-items-center' : ''} style={{ overflowY: 'auto' }}>
                            {medications?.length === 0 ? (
                                <>
                                    <FiAlertCircle className="text-muted" size={22} />
                                    <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                        No hay medicamentos administrados
                                    </span>
                                </>
                            ) : (
                                <div className="d-flex flex-column gap-2">

                                    {medications?.map((m, index) => {
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
                        <CardBody className={medicationPackages?.length === 0 ? 'd-flex justify-content-center align-items-center' : ''} style={{ overflowY: 'auto' }}>
                            {medicationPackages?.length === 0 ? (
                                <>
                                    <FiAlertCircle className="text-muted" size={22} />
                                    <span className="fs-5 text-muted text-center rounded-5 ms-2">
                                        No hay paquetes administrados
                                    </span>
                                </>
                            ) : (
                                <div className="d-flex flex-column gap-3">

                                    {medicationPackages?.map((p, index) => {
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
                        <CardBody className={vaccinationPlans?.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                            {vaccinationPlans?.length === 0 ? (
                                <>
                                    <FiAlertCircle className="text-muted" size={22} />
                                    <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                        No hay planes de vacunacion asignados
                                    </span>
                                </>
                            ) : (
                                <div className="d-flex flex-column gap-3">

                                    {vaccinationPlans?.map((p, index) => {
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

            <Modal size="xl" isOpen={modals.asignVaccinationPlan} toggle={() => toggleModal("asignVaccinationPlan")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignVaccinationPlan")}>Asignar plan de vacunacion</ModalHeader>
                <ModalBody>
                    <AsignLitterVaccinationPlanForm litterId={litterId} onSave={() => { toggleModal('asignVaccinationPlan'); fetchMedicalInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.vaccinationPlanDetails} toggle={() => toggleModal("vaccinationPlanDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("vaccinationPlanDetails")}>Detalles del plan de vacunacion</ModalHeader>
                <ModalBody>
                    <VaccinationPlanDetails vaccinationPlanId={selectedVaccinationPlan} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default LitterMedicalDetails;