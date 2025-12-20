import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import { FiAlertCircle, FiCheckCircle, FiEye } from "react-icons/fi";
import FeedingPackageDetails from "./FeedingPackageDetails";
import IndividualFeedingPackageForm from "../Forms/IndividualFeedingPackageForm";
import SingleFeedingForm from "../Forms/SingleFeedingForm";
import SuccessModal from "../Shared/SuccessModal";
import MissingStockModal from "../Shared/MissingStockModal";
import ErrorModal from "../Shared/ErrorModal";

interface PigFeedingDetailsProps {
    pigId: string
}

const PigFeedingDetails: React.FC<PigFeedingDetailsProps> = ({ pigId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({
        asignSingle: false,
        feedingPackage: false,
        feedingPackageDetails: false,
        discountFeedingPackageStock: false,
        discountSingleFeedingStock: false,
        missingStock: false,
        success: false,
        error: false,
        unasignPackage: false,
        unasignPackageSuccess: false,
        unasignPackageError: false
    });
    const [feedingPackages, setFeedingPackages] = useState<any[]>([]);
    const [feedings, setFeedings] = useState<any[]>([]);
    const [selectedFeedingPackage, setSelectedFeedingPackage] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [missingItems, setMissingItems] = useState([]);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchFeedingInfo = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const feedingResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/get_feeding_info/${pigId}`)
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

    const unasignPackage = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const packageResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/pig/unasign_feeding_package/${pigId}/${selectedFeedingPackage}`, {})
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

                <Card className="w-50 h-100 flex-grow-1">
                    <CardHeader className="bg-light d-flex justify-content-between">
                        <h5>Alimentos administrados</h5>

                        <Button className="" size="sm" onClick={() => toggleModal('asignSingle')}>
                            <i className="" />
                            Administrar alimentos
                        </Button>
                    </CardHeader>
                    <CardBody className={feedings.length === 0 ? 'd-flex justify-content-center align-items-center' : ''} style={{ overflowY: 'auto' }}>
                        {feedings.length === 0 ? (
                            <>
                                <FiAlertCircle className="text-muted" size={22} />
                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                    No hay alimentos administrados
                                </span>
                            </>
                        ) : (
                            <div className="d-flex flex-column gap-2">

                                {feedings.map((f, index) => {
                                    const date = new Date(f.applicationDate).toLocaleString("es-MX", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                    });

                                    const periodicityLabels: Record<string, string> = {
                                        once_day: '1 vez al dia',
                                        twice_day: '2 veces al dia',
                                        three_times_day: '3 veces al dia',
                                        ad_libitum: 'Libre acceso',
                                        weekly: '1 vez a la semana',
                                        biweekly: '2 veces a la semana',
                                        montly: 'Mensual',
                                        specific_days: 'Dias especificos',
                                        by_event: 'Por evento',
                                    }

                                    return (
                                        <div key={index} className="p-3 border rounded shadow-sm bg-light d-flex flex-column">

                                            <strong className="fs-5 mb-2">
                                                {f.feeding.name}
                                            </strong>

                                            <div className="d-flex justify-content-between flex-wrap fs-6 mb-2">
                                                <span>
                                                    <strong className="text-muted">Cantidad</strong> {f.quantity} {f.unit_measurement}
                                                </span>

                                                <span>
                                                    <strong className="text-muted">Periodicidad: </strong>{periodicityLabels[f.periodicity] ?? f.periodicity}
                                                </span>
                                            </div>

                                            <div className="fs-6 d-flex justify-content-between">
                                                <div>
                                                    <strong className="text-muted">Aplicado por:</strong>{" "}
                                                    {f.appliedBy ? `${f.appliedBy.name} ${f.appliedBy.lastname}` : "Desconocido"}
                                                </div>

                                                <div className="">
                                                    <strong className="text-muted">Fecha:</strong> {date}
                                                </div>

                                            </div>

                                            {f.observations && f.observations.trim() !== "" && (
                                                <div className="mt-2 fs-6">
                                                    <strong className="text-muted">Notas:</strong> {f.observations}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardBody>
                </Card>

                <Card className="w-50 h-100 flex-grow-1">
                    <CardHeader className="bg-light d-flex justify-content-between">
                        <h5>Paquetes de alimentacion administrados</h5>

                        <Button className="" size="sm" onClick={() => toggleModal('feedingPackage')}>
                            <i className="" />
                            Asignar paquete
                        </Button>
                    </CardHeader>
                    <CardBody className={feedingPackages.length === 0 ? 'd-flex justify-content-center align-items-center' : ''} style={{ overflowY: 'auto' }}>
                        {feedingPackages.length === 0 ? (
                            <>
                                <FiAlertCircle className="text-muted" size={22} />
                                <span className="fs-5 text-muted text-center rounded-5 ms-2">
                                    No hay paquetes administrados
                                </span>
                            </>
                        ) : (
                            <div className="d-flex flex-column gap-3">

                                {feedingPackages.map((p, index) => {
                                    const date = new Date(p.applicationDate).toLocaleString("es-MX", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                    });

                                    const objectiveLabels: Record<string, string> = {
                                        individual: "Individual",
                                        collective: "Colectivo",
                                        mass: "Masivo",
                                    };

                                    const destinationLabels: Record<string, string> = {
                                        piglet: "Lechón",
                                        sow: "Cerda",
                                        nursery: "Destete",
                                        grower: "Crecimiento",
                                        finisher: "Finalización",
                                    };

                                    const periodicityLabels: Record<string, string> = {
                                        once_day: '1 vez al dia',
                                        twice_day: '2 veces al dia',
                                        three_times_day: '3 veces al dia',
                                        ad_libitum: 'Libre acceso',
                                        weekly: '1 vez a la semana',
                                        biweekly: '2 veces a la semana',
                                        montly: 'Mensual',
                                        specific_days: 'Dias especificos',
                                        by_event: 'Por evento',
                                    }

                                    return (
                                        <div key={index} className="p-3 border rounded shadow-sm d-flex flex-column position-relative" style={{ backgroundColor: "#eef2ff" }}>

                                            <Button className="btn position-absolute" size="sm" style={{ top: "10px", right: "10px", borderRadius: "4px", }} onClick={() => { setSelectedFeedingPackage(p.packageId); toggleModal('feedingPackageDetails') }}>
                                                <FiEye size={18} />
                                            </Button>

                                            <Button className="btn position-absolute" size="sm" style={{ top: "10px", right: "50px", borderRadius: "4px", }} onClick={() => { setSelectedFeedingPackage(p.packageId); toggleModal('discountFeedingPackageStock') }} disabled={!p.is_active}>
                                                <i className="bx bx-trending-down" />
                                            </Button>

                                            {p.is_active === true ? (
                                                <Button className="btn position-absolute btn-danger" size="sm" style={{ top: "10px", right: "83px", borderRadius: "4px", }} onClick={() => { setSelectedFeedingPackage(p.packageId); toggleModal('unasignPackage') }}>
                                                    <i className="ri-forbid-line" />
                                                </Button>
                                            ) : null}

                                            <strong className="fs-5 mb-2 pe-4">
                                                {p.name}
                                            </strong>

                                            <div className="d-flex flex-column gap-1 fs-6 mb-2">
                                                <div className="fs-6 d-flex justify-content-between flex-wrap gap-2">
                                                    <span>
                                                        <strong className="text-muted">Objetivo:</strong>{" "}
                                                        {objectiveLabels[p.objective] ?? p.objective}
                                                    </span>

                                                    <span>
                                                        <strong className="text-muted">Periodicidad:</strong>{" "}
                                                        {periodicityLabels[p.periodicity] ?? p.periodicity}
                                                    </span>
                                                </div>

                                                <span>
                                                    <strong className="text-muted">Área destino:</strong>{" "}
                                                    {destinationLabels[p.destinationArea] ?? p.destinationArea}
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

            <Modal size="xl" isOpen={modals.feedingPackage} toggle={() => toggleModal("feedingPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("feedingPackage")}>Asignar paquete de alimentacion</ModalHeader>
                <ModalBody>
                    <IndividualFeedingPackageForm pigId={pigId} onSave={() => { toggleModal('feedingPackage'); fetchFeedingInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asignSingle} toggle={() => toggleModal("asignSingle")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignSingle")}>Asignar alimento</ModalHeader>
                <ModalBody>
                    <SingleFeedingForm pigId={pigId} onSave={() => { toggleModal('asignSingle'); fetchFeedingInfo(); }} />
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

            <Modal size="md" isOpen={modals.unasignPackage} toggle={() => toggleModal('unasignPackage')} centered>
                <ModalHeader toggle={() => toggleModal('unasignPackage')}>Desasignar paquete de alimentacion</ModalHeader>
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
                        <Button color="secondary" onClick={() => toggleModal('unasignPackage')}>
                            Cancelar
                        </Button>
                        <Button color="success" onClick={() => unasignPackage()}>
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
            <SuccessModal isOpen={modals.success} onClose={() => { toggleModal('discountFeedingPackageStock'); toggleModal('success') }} message={"Inventario descontado con exito"} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => { toggleModal('missingStock', false); toggleModal('discountFeedingPackageStock', false) }} missingItems={missingItems} />

            <SuccessModal isOpen={modals.unasignPackageSuccess} onClose={() => { toggleModal('unasignPackageSuccess'); toggleModal('unasignPackage'); fetchFeedingInfo(); }} message={"Paquete de alimentacion desasignado con exito"} />
            <ErrorModal isOpen={modals.unasignPackageError} onClose={() => { toggleModal('unasignPackageError') }} message={"Ha ocurrido un error al deaasignar el paquete de alimentacion, intentelo mas tarde"} />
        </>
    )
}

export default PigFeedingDetails;