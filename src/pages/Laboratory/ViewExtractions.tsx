import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb"
import { getLoggedinUser } from "helpers/api_helper"
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap"
import { FiCheckCircle, FiAlertCircle, FiInfo, FiInbox } from "react-icons/fi";
import CustomTable from "Components/Common/CustomTable";
import { ExtractionData } from "common/data_interfaces";
import ExtractionForm from "Components/Common/ExtractionForm";
import { Column } from "common/data/data_types";
import PigDetailsModal from "Components/Common/DetailsPigModal";
import { useNavigate } from "react-router-dom";
import LoadingAnimation from "Components/Common/LoadingAnimation";
import ExtractionDetails from "Components/Common/ExtractionDetails";
import AlertMessage from "Components/Common/AlertMesagge";
import KPI from "Components/Common/Graphics/Kpi";
import LineChartCard from "Components/Common/Graphics/LineChartCard";
import BoarVolumeRadar from "Components/Common/Graphics/BoarVolumeRadar";

const ViewExtractions = () => {
    document.title = 'Ver extracciones | Management System'
    const userLoggged = getLoggedinUser();
    const configContext = useContext(ConfigContext)
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [extractions, setExtractions] = useState<ExtractionData[] | null>(null)
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false, pigDetails: false, extractionDetails: false });
    const [stats, setStats] = useState<any>({})
    const [selectedExtraction, setSelectedExtraction] = useState<any>({})

    const extractionsColumns: Column<any>[] = [
        { header: 'Lote', accessor: 'batch', type: 'text', isFilterable: true },
        { header: 'Fecha de extracción', accessor: 'date', type: 'date', isFilterable: false },
        {
            header: 'Verraco',
            accessor: 'boar',
            render: (_, row) => (
                <Button
                    className="text-underline fs-5"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExtraction(row);
                        toggleModal('extractionDetails')
                    }}
                >
                    {row.boar?.code} ↗
                </Button>
            )
        },
        {
            header: 'Responsable',
            accessor: 'technician',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.technician ? `${row.technician.name} ${row.technician.lastname}` : "Sin responsable"
        },
        { header: 'Ubicacion de la extracción', accessor: 'extraction_location', type: 'text', isFilterable: true },
        {
            header: 'Muestra registrada',
            accessor: 'is_sample_registered',
            type: 'text',
            isFilterable: true,
            render: (_, obj) => (
                <Badge color={obj.is_sample_registered ? 'success' : 'warning'}>{obj.is_sample_registered ? 'Si' : 'No'}</Badge>
            )
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`details-button-${row._id}`} className="farm-primary-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedExtraction(row); toggleModal('extractionDetails') }} >
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`details-button-${row._id}`}>
                        Ver detalles
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext || !userLoggged) return;
        try {
            setLoading(true);
            const [extractionsResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/find_by_farm/${userLoggged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/stadistics/${userLoggged.farm_assigned}`)
            ])

            setExtractions(extractionsResponse.data.data)
            setStats(statsResponse.data.data)
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al obtener los datos, intentelo mas tarde.' })
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [])


    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver extracciones"} pageTitle={"Extracciones"} />

                <div className="d-flex flex-wrap gap-3">
                    {stats.extractionsByDay && (
                        <KPI
                            title="Total de extracciones"
                            value={stats.extractionsByDay.reduce((sum: number, e: any) => sum + e.count, 0)}
                            icon={FiAlertCircle}
                            bgColor="#e6f0ff"
                            iconColor="#0d6efd"
                        />
                    )}

                    {stats.volumeByDay && (
                        <KPI
                            title="Volumen total extraído"
                            value={`${stats.volumeByDay.reduce((sum: number, v: any) => sum + v.totalVolume, 0)} ml`}
                            icon={FiInfo}
                            bgColor="#fff4e6"
                            iconColor="#ffc107"
                        />
                    )}

                    {stats.volumeByDay && stats.extractionsByDay && (
                        <KPI
                            title="Volumen promedio por extracción"
                            value={(() => {
                                const totalVol = stats.volumeByDay.reduce((sum: number, v: any) => sum + v.totalVolume, 0);
                                const totalExt = stats.extractionsByDay.reduce((sum: number, e: any) => sum + e.count, 0);
                                return totalExt > 0 ? `${(totalVol / totalExt).toFixed(1)} ml` : "0 ml";
                            })()}
                            icon={FiInfo}
                            bgColor="#eaf9ff"
                            iconColor="#0dcaf0"
                        />
                    )}

                    {stats.volumeByDay && stats.volumeByDay.length > 0 && (() => {
                        const maxDay = stats.volumeByDay.reduce((prev: any, curr: any) => curr.totalVolume > prev.totalVolume ? curr : prev);
                        return (
                            <KPI
                                title="Día con mayor volumen"
                                value={`${maxDay.totalVolume} ml`}
                                subtext={maxDay._id}
                                icon={FiInfo}
                                bgColor="#f3e6ff"
                                iconColor="#6f42c1"
                            />
                        );
                    })()}

                    {stats.volumeByDay && stats.volumeByDay.length > 0 && (() => {
                        const minDay = stats.volumeByDay.reduce((prev: any, curr: any) => curr.totalVolume < prev.totalVolume ? curr : prev);
                        return (
                            <KPI
                                title="Día con menor volumen"
                                value={`${minDay.totalVolume} ml`}
                                subtext={minDay._id}
                                icon={FiInfo}
                                bgColor="#ffe6e6"
                                iconColor="#dc3545"
                            />
                        );
                    })()}
                </div>

                <div className="d-flex gap-3">
                    <LineChartCard
                        stats={stats}
                        type="volume"
                        title="Volumen"
                        yLabel="Mililitros"
                        color="#ffc107"
                    />

                    <LineChartCard
                        stats={stats}
                        type="extractions"
                        title="Extracciones"
                        yLabel="Número de extracciones"
                        color="#198754"
                    />

                    <BoarVolumeRadar data={stats.volumeStatsByBoar} />
                </div>

                <Card style={{ height: '65vh' }}>
                    <CardHeader className="d-flex">
                        <h4>Extracciones</h4>
                        <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                            <i className="ri-add-line me-2" />
                            Nueva extracción
                        </Button>
                    </CardHeader>

                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {extractions && extractions.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <CustomTable
                                    columns={extractionsColumns}
                                    data={extractions}
                                    showPagination={true}
                                    rowsPerPage={7}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#888", }}>
                                <div>
                                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                                    <div>No hay datos disponibles</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nueva extracción</ModalHeader>
                <ModalBody>
                    <ExtractionForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={function (): void {
                        throw new Error("Function not implemented.");
                    }} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>Detalles del verraco</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedExtraction.boar?._id} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.extractionDetails} toggle={() => toggleModal("extractionDetails")} centered>
                <ModalHeader toggle={() => toggleModal("extractionDetails")}>Detalles de la extracción</ModalHeader>
                <ModalBody>
                    <ExtractionDetails extractionId={selectedExtraction?._id} />
                </ModalBody>
            </Modal>


            {alertConfig.visible && (
                <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            )}
        </div>
    )
}

export default ViewExtractions
