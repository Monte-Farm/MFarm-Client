import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Button, Card, CardBody, CardHeader, Col, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap";
import { FiAlertCircle, FiCheckCircle, FiEye } from "react-icons/fi";
import { RiRestaurantLine, RiCalendarCheckLine, RiCalendarEventLine, RiScales3Line, RiExchangeLine } from "react-icons/ri";
import FeedingPackageDetails from "./FeedingPackageDetails";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import DonutChartCard from "Components/Common/Graphics/DonutChartCard";

import SingleFeedingForm from "../Forms/AsignFeedingForm";
import SuccessModal from "../Shared/SuccessModal";
import MissingStockModal from "../Shared/MissingStockModal";
import ErrorModal from "../Shared/ErrorModal";
import AsignFeedingPackageForm from "../Forms/AsignFeedingPackageForm";

interface PigFeedingDetailsProps {
    pigId: string
}

const PigFeedingDetails: React.FC<PigFeedingDetailsProps> = ({ pigId }) => {
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
        unasignPackage: false,
        unasignPackageSuccess: false,
        unasignPackageError: false,
        unasignFeeding: false,
        unasignFeedingSuccess: false,
        unasignFeedingError: false,
    });
    const [feedingPackages, setFeedingPackages] = useState<any[]>([]);
    const [feedings, setFeedings] = useState<any[]>([]);
    const [feedingStats, setFeedingStats] = useState<any | null>(null);
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
            const [feedingResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/get_feeding_info/${pigId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/feeding_stats/${pigId}`),
            ]);
            const feedingData = feedingResponse.data.data;

            setFeedingPackages(feedingData.feedingPackagesHistory);
            setFeedings(feedingData.feedings);
            setFeedingStats(statsResponse.data.data);
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

    const discountFeedingStock = async () => {
        if (!configContext || !userLogged) return;
        try {
            setIsSubmitting(true);

            const feedingToDiscount = feedings.filter(f => f._id === selectedFeeding);
            const feedingData = feedingToDiscount.map((f: any) => ({
                feeding: f.feeding._id,
                quantity: f.quantity,
                unit_measurement: '',
                application_date: new Date(),
                observations: '',
                appliedBy: '',
                periodicity: '',
                is_active: true
            }))

            const stockResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/feeding_package/discount_feeding_stock/${userLogged.farm_assigned}`, feedingData)
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

    const unasignFeeding = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const packageResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/pig/unasign_feeding/${pigId}/${selectedFeeding}`, {})
            toggleModal('unasignFeedingSuccess')
        } catch (error) {
            console.error('Error: ', { error });
            toggleModal('unasignFeedingError')
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
            {feedingStats && (
                <>
                    {/* KPIs */}
                    <Row className="g-3 mb-3">
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Alimento Consumido"
                                value={feedingStats.kpis?.totalConsumed || 0}
                                suffix="kg"
                                icon={<RiRestaurantLine size={20} style={{ color: '#f59e0b' }} />}
                                animateValue={true}
                                decimals={1}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Consumo Diario Promedio"
                                value={feedingStats.kpis?.avgPerDay || 0}
                                suffix="kg/día"
                                icon={<RiScales3Line size={20} style={{ color: '#0ea5e9' }} />}
                                animateValue={true}
                                decimals={2}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Conversión Alimenticia"
                                value={feedingStats.kpis?.feedConversionRatio || 0}
                                suffix="kg/kg"
                                icon={<RiExchangeLine size={20} style={{ color: '#ef4444' }} />}
                                animateValue={true}
                                decimals={2}
                            />
                        </Col>
                    </Row>

                    {/* Gráficas */}
                    <Row className="g-3 mb-3">
                        <Col lg={8}>
                            <BasicLineChartCard
                                title="Consumo Acumulado"
                                data={[{
                                    id: 'Alimento (kg)',
                                    color: '#f59e0b',
                                    data: (feedingStats.cumulativeConsumption || []).map((p: any) => ({ x: p.date, y: p.value })),
                                }]}
                                yLabel="Kg acumulados"
                                xLabel="Fecha"
                                height={280}
                                curve="natural"
                                pointSize={5}
                                strokeWidth={2}
                                enableGrid={true}
                                enablePoints={true}
                                enableArea={true}
                                showLegend={false}
                                headerBgColor="#ffffff"
                                className="border-0 shadow-sm h-100"
                            />
                        </Col>
                        <Col lg={4}>
                            <DonutChartCard
                                title="Distribución por Tipo"
                                data={feedingStats.distributionByType || []}
                                legendItems={(feedingStats.distributionByType || []).map((d: any) => ({
                                    label: d.label,
                                    value: `${d.value} kg`,
                                    percentage: feedingStats.kpis?.totalConsumed
                                        ? `${((d.value / feedingStats.kpis.totalConsumed) * 100).toFixed(1)}%`
                                        : '0%',
                                }))}
                                className="h-100 border-0 shadow-sm"
                                headerBgColor="#ffffff"
                            />
                        </Col>
                    </Row>
                </>
            )}

            <div style={{ height: "600px" }}>

                <Card className="w-100 h-100">
                    <CardHeader className="bg-light d-flex justify-content-between">
                        <h5>Paquetes de alimentacion administrados</h5>

                        <Button className="" size="sm" onClick={() => toggleModal('asignFeedingPackage')}>
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


                                    const stageLabels: Record<string, string> = {
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
                                                <Button className="btn position-absolute btn-danger" size="sm" style={{ top: "10px", right: "83px", borderRadius: "4px", }} onClick={() => { setSelectedFeedingPackage(p._id); toggleModal('unasignPackage') }}>
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
                                                        {stageLabels[p.stage] ?? p.objective}
                                                    </span>

                                                    <span>
                                                        <strong className="text-muted">Periodicidad:</strong>{" "}
                                                        {periodicityLabels[p.periodicity] ?? p.periodicity}
                                                    </span>
                                                </div>
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

            <Modal size="xl" isOpen={modals.asignFeedingPackage} toggle={() => toggleModal("asignFeedingPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignFeedingPackage")}>Asignar paquete de alimentacion</ModalHeader>
                <ModalBody>
                    <AsignFeedingPackageForm pigId={pigId} onSave={() => { toggleModal('asignFeedingPackage'); fetchFeedingInfo(); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asignFeeding} toggle={() => toggleModal("asignFeeding")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignFeeding")}>Asignar alimento</ModalHeader>
                <ModalBody>
                    <SingleFeedingForm pigId={pigId} onSave={() => { toggleModal('asignFeeding'); fetchFeedingInfo(); }} />
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

            <Modal size="md" isOpen={modals.discountFeedingStock} toggle={() => toggleModal('discountFeedingStock')} centered>
                <ModalHeader toggle={() => toggleModal('discountFeedingStock')}>Descontar inventario de alimentacion</ModalHeader>
                <ModalBody>
                    <div className="d-flex flex-column align-items-center text-center gap-3">
                        <FiCheckCircle size={50} />
                        <div>
                            <p className="mb-1 fs-5">
                                ¿Estás seguro de que deseas descontar el inventario de la alimentacion seleccionada?
                            </p>
                            <p className="text-muted">
                                Esta acción reducirá las cantidades disponibles en el inventario según la alimentacion seleccionada.
                            </p>

                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className="d-flex gap-2 mt-3">
                        <Button color="secondary" onClick={() => toggleModal('discountFeedingStock')}>
                            Cancelar
                        </Button>
                        <Button color="success" onClick={() => discountFeedingStock()}>
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

            <Modal size="md" isOpen={modals.unasignFeeding} toggle={() => toggleModal('unasignFeeding')} centered>
                <ModalHeader toggle={() => toggleModal('unasignFeeding')}>Desasignar alimentacion</ModalHeader>
                <ModalBody>
                    <div className="d-flex flex-column align-items-center gap-3">
                        <FiCheckCircle size={50} />
                        <div>
                            <p className="mb-1 fs-5">
                                ¿Estás seguro de que deseas deasginar la alimentacion seleccionado?
                            </p>
                            <p className="text-muted">
                                Esta acción no eliminará la alimentacion, solo lo desasignará del cerdo.
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className="d-flex gap-2 mt-3">
                        <Button color="secondary" onClick={() => toggleModal('unasignFeeding')}>
                            Cancelar
                        </Button>
                        <Button color="success" onClick={() => unasignFeeding()}>
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
            <SuccessModal isOpen={modals.success} onClose={() => { toggleModal('discountFeedingPackageStock', false); toggleModal('discountFeedingStock', false); toggleModal('success', false) }} message={"Inventario descontado con exito"} />
            <ErrorModal isOpen={modals.error} onClose={() => { toggleModal('error') }} message={"Ha ocurrido un error, intentelo mas tarde"} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => { toggleModal('missingStock', false); toggleModal('discountFeedingPackageStock', false); toggleModal('discountFeedingStock', false); }} missingItems={missingItems} />

            <SuccessModal isOpen={modals.unasignPackageSuccess} onClose={() => { toggleModal('unasignPackageSuccess'); toggleModal('unasignPackage'); fetchFeedingInfo(); }} message={"Paquete de alimentacion desasignado con exito"} />
            <ErrorModal isOpen={modals.unasignPackageError} onClose={() => { toggleModal('unasignPackageError') }} message={"Ha ocurrido un error al desasignar el paquete de alimentacion, intentelo mas tarde"} />

            <SuccessModal isOpen={modals.unasignFeedingSuccess} onClose={() => { toggleModal('unasignFeedingSuccess', false); toggleModal('unasignFeeding', false); fetchFeedingInfo(); }} message={"Alimentacion desasignada con exito"} />
            <ErrorModal isOpen={modals.unasignFeedingError} onClose={() => { toggleModal('unasignFeedingError', false) }} message={"Ha ocurrido un error al desasignar la alimentacion, intentelo mas tarde"} />
        </>
    )
}

export default PigFeedingDetails;