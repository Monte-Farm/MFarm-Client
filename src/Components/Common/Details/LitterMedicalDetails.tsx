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
import AdministeredMedicationsCard from "../Shared/AdministeredMedicationsCard";
import MedicationPackagesCard from "../Shared/MedicationPackagesCard";
import VaccinationPlansCard from "../Shared/VaccinationPlansCard";

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
    const [litter, setLitter] = useState<any>({})

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

            const litterResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/litter/find_by_id/${litterId}`)
            setLitter(litterResponse.data.data);
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

                <AdministeredMedicationsCard
                    medications={medications}
                    onAdd={() => toggleModal("asignMedication")}
                    status={litter.status}
                />

                <MedicationPackagesCard
                    packages={medicationPackages}
                    onAdd={() => toggleModal("asignMedicationPackage")}
                    onViewDetails={(id) => {
                        setSelectedMedicationPackage(id);
                        toggleModal("medicationPackageDetails");
                    }}
                    status={litter.status}
                />

                <VaccinationPlansCard
                    plans={vaccinationPlans}
                    onAdd={() => toggleModal("asignVaccinationPlan")}
                    onViewDetails={(id) => {
                        setSelectedVaccinationPlan(id);
                        toggleModal("vaccinationPlanDetails");
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