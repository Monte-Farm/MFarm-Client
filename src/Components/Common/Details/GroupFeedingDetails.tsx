import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import { FiAlertCircle, FiCheckCircle, FiEye } from "react-icons/fi";
import FeedingPackageDetails from "./FeedingPackageDetails";

import SingleFeedingForm from "../Forms/AsignFeedingForm";
import SuccessModal from "../Shared/SuccessModal";
import MissingStockModal from "../Shared/MissingStockModal";
import ErrorModal from "../Shared/ErrorModal";
import AsignFeedingPackageForm from "../Forms/AsignFeedingPackageForm";
import AsignGroupFeedingPackageForm from "../Forms/AsignGroupFeedingPackageForm";
import AsignGroupFeedingForm from "../Forms/AsignGroupFeedings";
import AdministeredFeedingsCard from "../Shared/AdministeredFeedingsCard";
import FeedingPackagesCard from "../Shared/FeedingPackagesCard";

interface GroupFeedingDetailsProps {
    groupId: string
}

const GroupFeedingDetails: React.FC<GroupFeedingDetailsProps> = ({ groupId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({
        asignFeeding: false,
        asignFeedingPackage: false,
        feedingPackageDetails: false,
        discountFeedingPackageStock: false,
        discountFeedingStock: false,
        missingStock: false,
        success: false,
        error: false,
        unasignGroupPackage: false,
        unasignPackageSuccess: false,
        unasignPackageError: false,
        unasignFeeding: false,
        unasignFeedingSuccess: false,
        unasignFeedingError: false
    });
    const [feedingPackages, setFeedingPackages] = useState<any[]>([]);
    const [feedings, setFeedings] = useState<any[]>([]);
    const [selectedFeedingPackage, setSelectedFeedingPackage] = useState<string>("")
    const [selectedFeeding, setSelectedFeeding] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [missingItems, setMissingItems] = useState([]);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchFeedingInfo = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const feedingResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/get_feeding_info/${groupId}`)
            const feedingData = feedingResponse.data.data;

            setFeedingPackages(feedingData.feedingPackagesHistory);
            setFeedings(feedingData.feedings);
        } catch (error) {
            console.error('Error fetching data: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al obtener la informacion medica, intentelo mas tarde' });
        } finally {
            setLoading(false)
        }
    }

    const discountPackageStock = async () => {
        if (!configContext || !userLogged) return;
        try {
            setIsSubmitting(true);

            const stockResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/feeding_package/discount_feeding_package_stock/${userLogged.farm_assigned}/${selectedFeedingPackage}`, {})
            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Alimento de paquete de alimentacion descontado del inventario`,
            });

            toggleModal('success', true)
        } catch (error: any) {
            console.error('Error saving the information: ', { error })
            if (error.response?.status === 400 && error.response?.data?.missing) {
                setMissingItems(error.response.data.missing);
                toggleModal('missingStock');
                return;
            }
            toggleModal('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const unasignGroupPackage = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const packageResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/group/unasign_feeding_package/${groupId}/${selectedFeedingPackage}`, {})
            toggleModal('unasignPackageSuccess')
        } catch (error) {
            console.error('Error: ', { error });
            toggleModal('unasignPackageError')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFeedingInfo();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }
    return (
        <>
            <div className="d-flex gap-3 align-items-stretch" style={{ height: "600px" }}>
                <FeedingPackagesCard
                    packages={feedingPackages}
                    onAdd={() => toggleModal("asignFeedingPackage")}
                    onViewDetails={(id) => {
                        setSelectedFeedingPackage(id);
                        toggleModal("feedingPackageDetails");
                    }}
                    onDiscountStock={(id) => {
                        setSelectedFeedingPackage(id);
                        toggleModal("discountFeedingPackageStock");
                    }}
                    onUnassign={(id) => {
                        setSelectedFeedingPackage(id);
                        toggleModal("unasignGroupPackage");
                    }}
                />
            </div>

            <Modal size="xl" isOpen={modals.asignFeedingPackage} toggle={() => toggleModal("asignFeedingPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignFeedingPackage")}>Asignar paquete de alimentacion</ModalHeader>
                <ModalBody>
                    <AsignGroupFeedingPackageForm groupId={groupId} onSave={() => { toggleModal('asignFeedingPackage'); fetchFeedingInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.feedingPackageDetails} toggle={() => toggleModal("feedingPackageDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("feedingPackageDetails")}>Detalles de paquete de alimentacion</ModalHeader>
                <ModalBody>
                    <FeedingPackageDetails feedingPackageId={selectedFeedingPackage} />
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.discountFeedingPackageStock} toggle={() => toggleModal('discountFeedingPackageStock')} centered>
                <ModalHeader toggle={() => toggleModal('discountFeedingPackageStock')}>Descontar inventario de paquete de alimentacion</ModalHeader>
                <ModalBody>
                    <div className="d-flex flex-column align-items-center text-center gap-3">
                        <FiCheckCircle size={50} />
                        <div>
                            <p className="mb-1 fs-5">
                                ¿Estás seguro de que deseas descontar el inventario del paquete de alimentacion seleccionado?
                            </p>
                            <p className="text-muted">
                                Esta acción reducirá las cantidades disponibles en el inventario según los componentes del paquete.
                            </p>

                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className="d-flex gap-2 mt-3">
                        <Button color="secondary" onClick={() => toggleModal('discountFeedingPackageStock')}>
                            Cancelar
                        </Button>
                        <Button color="success" onClick={() => discountPackageStock()}>
                            {isSubmitting ? (
                                <div>
                                    <Spinner size='sm' />
                                </div>
                            ) : (
                                <div>
                                    <i className="ri-check-line me-2" />
                                    Confirmar
                                </div>
                            )}
                        </Button>
                    </div>
                </ModalFooter>
            </Modal>

            <Modal size="md" isOpen={modals.unasignGroupPackage} toggle={() => toggleModal('unasignGroupPackage')} centered>
                <ModalHeader toggle={() => toggleModal('unasignGroupPackage')}>Desasignar paquete de alimentacion</ModalHeader>
                <ModalBody>
                    <div className="d-flex flex-column align-items-center gap-3">
                        <FiCheckCircle size={50} />
                        <div>
                            <p className="mb-1 fs-5">
                                ¿Estás seguro de que deseas deasginar el paquete de alimentacion seleccionado?
                            </p>
                            <p className="text-muted">
                                Esta acción no eliminará el paquete, solo lo desasignará del cerdo.
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className="d-flex gap-2 mt-3">
                        <Button color="secondary" onClick={() => toggleModal('unasignGroupPackage')}>
                            Cancelar
                        </Button>
                        <Button color="success" onClick={() => unasignGroupPackage()}>
                            {isSubmitting ? (
                                <div>
                                    <Spinner size='sm' />
                                </div>
                            ) : (
                                <div>
                                    <i className="ri-check-line me-2" />
                                    Confirmar
                                </div>
                            )}
                        </Button>
                    </div>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
                
            <SuccessModal isOpen={modals.success} onClose={() => { toggleModal('discountFeedingPackageStock', false); toggleModal('success', false); toggleModal('discountFeedingStock', false); }} message={"Inventario descontado con exito"} />
            <ErrorModal isOpen={modals.error} onClose={() => { toggleModal('error') }} message={"Ha ocurrido un error, intentelo mas tarde"} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => { toggleModal('missingStock', false); toggleModal('discountFeedingPackageStock', false); toggleModal('discountFeedingStock', false) }} missingItems={missingItems} />

            <SuccessModal isOpen={modals.unasignPackageSuccess} onClose={() => { toggleModal('unasignPackageSuccess'); toggleModal('unasignGroupPackage'); fetchFeedingInfo(); }} message={"Paquete de alimentacion desasignado con exito"} />
            <ErrorModal isOpen={modals.unasignPackageError} onClose={() => { toggleModal('unasignPackageError') }} message={"Ha ocurrido un error al deaasignar el paquete de alimentacion, intentelo mas tarde"} />
        </>
    )
}

export default GroupFeedingDetails;