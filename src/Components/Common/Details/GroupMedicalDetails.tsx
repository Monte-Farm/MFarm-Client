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
import GroupHealthEventForm from "../Forms/AsignGroupHealtEvent";
import HealthEventsCard from "../Shared/HealthEventsCard";
import AdministeredMedicationsCard from "../Shared/AdministeredMedicationsCard";
import MedicationPackagesCard from "../Shared/MedicationPackagesCard";
import VaccinationPlansCard from "../Shared/VaccinationPlansCard";

interface GroupMedicalDetailsProps {
    groupId: string
}

const GroupMedicalDetails: React.FC<GroupMedicalDetailsProps> = ({ groupId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ asignMedication: false, asignMedicationPackage: false, medicationPackageDetails: false, asignVaccinationPlan: false, vaccinationPlanDetails: false, registerHealthEvent: false, healthEventDetails: false });
    const [medicationPackages, setMedicationPackages] = useState<any[]>([]);
    const [medications, setMedications] = useState<any[]>([]);
    const [healthEvents, setHealthEvents] = useState<any[]>([]);
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
            setHealthEvents(medicalData.healthEvents)
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
                <div className="w-100 d-flex flex-column gap-3" style={{ minHeight: 0 }}>
                    <div className="flex-grow-1" style={{ height: "50%", minHeight: 0 }}>
                        <HealthEventsCard
                            events={healthEvents}
                            onAdd={() => toggleModal("registerHealthEvent")}
                            onViewDetails={(id) => {
                                setSelectedSickness(id);
                                toggleModal("healthEventDetails");
                            }}
                        />
                    </div>

                    <div className="flex-grow-1" style={{ height: "50%", minHeight: 0 }}>
                        <AdministeredMedicationsCard
                            medications={medications}
                            onAdd={() => toggleModal("asignMedication")}
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
                    />
                </div>

                <div className="w-100 d-flex flex-column" style={{ minHeight: 0 }}>
                    <VaccinationPlansCard
                        plans={vaccinationPlans}
                        onAdd={() => toggleModal("asignVaccinationPlan")}
                        onViewDetails={(id) => {
                            setSelectedVaccinationPlan(id);
                            toggleModal("vaccinationPlanDetails");
                        }}
                    />
                </div>
            </div>

            <Modal size="xl" isOpen={modals.registerHealthEvent} toggle={() => toggleModal("registerHealthEvent")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("registerHealthEvent")}>Registar evento sanitario</ModalHeader>
                <ModalBody>
                    <GroupHealthEventForm groupId={groupId} onSave={() => { toggleModal('registerHealthEvent'); fetchMedicalInfo(); }} />
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

            <Modal size="xl" isOpen={modals.healthEventDetails} toggle={() => toggleModal("healthEventDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("healthEventDetails")}>Detalles de enfermedad</ModalHeader>
                <ModalBody>

                </ModalBody>
            </Modal>


            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default GroupMedicalDetails;