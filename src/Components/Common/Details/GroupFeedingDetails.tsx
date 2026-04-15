import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Button, Card, CardBody, CardHeader, Col, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap";
import { FiAlertCircle, FiCheckCircle, FiEye } from "react-icons/fi";
import { RiRestaurantLine, RiScales3Line, RiExchangeLine, RiGroupLine } from "react-icons/ri";
import FeedingPackageDetails from "./FeedingPackageDetails";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import DonutChartCard from "Components/Common/Graphics/DonutChartCard";

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
    onUpdate?: () => void
    isGroupSold?: boolean
}

const GroupFeedingDetails: React.FC<GroupFeedingDetailsProps> = ({ groupId, onUpdate, isGroupSold = false }) => {
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
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/get_feeding_info/${groupId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/feeding_stats/${groupId}`),
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
            onUpdate?.();
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
            onUpdate?.();
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
                                title="Promedio por Cerdo"
                                value={feedingStats.kpis?.avgPerPig || 0}
                                suffix="kg/día"
                                icon={<RiGroupLine size={20} style={{ color: '#8b5cf6' }} />}
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
                                title="Consumo Acumulado del Grupo"
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
                            {(() => {
                                const typeLabels: Record<string, string> = {
                                    nutrition: 'Nutrición',
                                    medications: 'Medicamentos',
                                    vaccines: 'Vacunas',
                                    vitamins: 'Vitaminas',
                                    minerals: 'Minerales',
                                    supplies: 'Insumos',
                                    hygiene_cleaning: 'Higiene y desinfección',
                                    equipment_tools: 'Equipamiento y herramientas',
                                    spare_parts: 'Refacciones y repuestos',
                                    office_supplies: 'Material de oficina',
                                    supplements: 'Suplementos',
                                    medicated: 'Medicados',
                                    others: 'Otros',
                                };
                                const translatedData = (feedingStats.distributionByType || []).map((d: any) => ({
                                    ...d,
                                    id: typeLabels[d.id] || typeLabels[d.label] || d.label || d.id,
                                    label: typeLabels[d.label] || typeLabels[d.id] || d.label || d.id,
                                }));
                                return (
                                    <DonutChartCard
                                        title="Distribución por Tipo"
                                        data={translatedData}
                                        legendItems={translatedData.map((d: any) => ({
                                            label: d.label,
                                            value: `${d.value} kg`,
                                            percentage: feedingStats.kpis?.totalConsumed
                                                ? `${((d.value / feedingStats.kpis.totalConsumed) * 100).toFixed(1)}%`
                                                : '0%',
                                        }))}
                                        className="h-100 border-0 shadow-sm"
                                        headerBgColor="#ffffff"
                                    />
                                );
                            })()}
                        </Col>
                    </Row>
                </>
            )}

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
                    disabled={isGroupSold}
                />
            </div>

            <Modal size="xl" isOpen={modals.asignFeedingPackage} toggle={() => toggleModal("asignFeedingPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("asignFeedingPackage")}>Asignar paquete de alimentacion</ModalHeader>
                <ModalBody>
                    <AsignGroupFeedingPackageForm groupId={groupId} onSave={() => { toggleModal('asignFeedingPackage'); fetchFeedingInfo(); onUpdate?.(); }} />
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