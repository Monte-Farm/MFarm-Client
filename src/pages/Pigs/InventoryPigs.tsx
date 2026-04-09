import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import PigFilters, { PigFiltersState } from "Components/Common/Filters/PigFilters";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState, useMemo } from "react";
import { FaKeyboard, FaListUl } from "react-icons/fa";
import { RiScales2Line, RiArrowUpLine, RiArrowDownLine } from "react-icons/ri";
import { GiPig } from "react-icons/gi";
import { Badge, Card, CardBody, CardHeader, Container, Row, Col, Button, Modal, ModalHeader, ModalBody, Spinner } from "reactstrap";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import SinglePigForm from "Components/Common/Forms/SinglePigForm";
import BatchPigForm from "Components/Common/Forms/BatchPigForm";
import PDFViewer from "Components/Common/Shared/PDFViewer";

// Interfaces tipadas
interface PigInventory {
    id: string;
    stage: 'piglet' | 'weaning' | 'fattening' | 'breeder';
    status: 'alive' | 'dead' | 'discarded';
    currentWeight: number;
    [key: string]: any;
}

interface GeneralStats {
    total: number;
    avgWeight: number;
    minWeight: number;
    maxWeight: number;
}

interface StageStats {
    stage: string;
    count: number;
    avgWeight?: number;
}

interface PigStats {
    generalStats: GeneralStats[];
    inventoryByStage: StageStats[];
    avgWeightByStage: StageStats[];
    [key: string]: any;
}

interface AlertConfig {
    visible: boolean;
    color: string;
    message: string;
}

const InventoryPigs = () => {
    document.title = 'Inventario de cerdos | Management System'
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ update: false, viewPDF: false, selectMedicationMode: false, asignSingle: false, medicationPackage: false, selectCreationMode: false, createSingle: false, createBatch: false });
    const [pigsInventory, setPigsInventory] = useState<PigInventory[]>([])
    const [pigStats, setPigStats] = useState<PigStats | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [filters, setFilters] = useState<PigFiltersState>({
        status: '',
        currentStage: '',
        origin: '',
        sex: '',
        breed: '',
        weightRange: [0, 500]
    })
    const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleFilterChange = (filterName: string, value: any) => {
        setFilters(prev => ({ ...prev, [filterName]: value }))
    }

    const handleWeightRangeChange = (value: number | number[]) => {
        setFilters(prev => ({ ...prev, weightRange: value as [number, number] }))
    }

    const handleClearFilters = () => {
        setFilters({
            status: '',
            currentStage: '',
            origin: '',
            sex: '',
            breed: '',
            weightRange: [0, 500]
        })
        setSearchTerm('')
    }

    const filteredPigs = useMemo(() => {
        return pigsInventory.filter(pig => {

            const matchesSearch = searchTerm === '' ||
                pig.stage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pig.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pig.currentWeight?.toString().includes(searchTerm)

            const matchesStatus = filters.status === '' || pig.status === filters.status

            const matchesStage = filters.currentStage === '' || pig.stage === filters.currentStage

            const matchesWeight = pig.currentWeight >= filters.weightRange[0] &&
                pig.currentWeight <= filters.weightRange[1]

            return matchesSearch && matchesStatus && matchesStage && matchesWeight
        })
    }, [pigsInventory, searchTerm, filters])

    const pigsInventoryColumns: Column<PigInventory>[] = [
        {
            header: 'Etapa',
            accessor: 'stage',
            render: (value: string, row: PigInventory) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "piglet":
                        color = "info";
                        label = "Lechón";
                        break;
                    case "weaning":
                        color = "warning";
                        label = "Destete";
                        break;
                    case "fattening":
                        color = "primary";
                        label = "Engorda";
                        break;
                    case "breeder":
                        color = "success";
                        label = "Reproductor";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: 'Estado',
            accessor: 'status',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let label = '';

                switch (row.status) {
                    case "dead":
                        color = "danger";
                        label = "Muerto";
                        break;
                    case "alive":
                        color = "success";
                        label = "Vivo";
                        break;
                    case "discarded":
                        color = "warning";
                        label = "Descartado";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            }
        },
        { header: 'Peso actual', accessor: 'currentWeight', type: 'number' },
    ]

    const fetchData = async () => {
        if (!configContext) return
        try {
            setLoading(true)
            setAlertConfig({ visible: false, color: '', message: '' })

            // Validar que el usuario tenga granja asignada
            if (!userLogged?.farm_assigned) {
                throw new Error('No hay una granja asignada al usuario')
            }

            const [pigsResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig_inventory/find_by_farm/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig_inventory/get_inventory_pig_stats/${userLogged.farm_assigned}`)
            ])

            // Validar respuestas
            if (!pigsResponse.data?.data) {
                throw new Error('No se pudieron obtener los datos del inventario')
            }

            if (!statsResponse.data?.data) {
                throw new Error('No se pudieron obtener las estadísticas')
            }

            setPigsInventory(pigsResponse.data.data)
            setPigStats(statsResponse.data.data)

        } catch (error: any) {
            console.error('Error fetching data:', error)

            let errorMessage = 'Ha ocurrido un error al obtener los datos, inténtelo más tarde'
            let alertColor = 'danger'

            if (error.response?.status === 404) {
                errorMessage = 'No se encontró información para esta granja'
                alertColor = 'warning'
            } else if (error.response?.status === 403) {
                errorMessage = 'No tiene permisos para ver esta información'
                alertColor = 'warning'
            } else if (error.message) {
                errorMessage = error.message
            }

            setAlertConfig({
                visible: true,
                color: alertColor,
                message: errorMessage
            })
        } finally {
            setLoading(false)
        }
    }

    const handleGeneratePDF = async () => {
        if (!configContext) return;

        try {
            setPdfLoading(true);

            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/pig_inventory?farm_id=${userLogged.farm_assigned}`
            );

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            console.error('Error generating PDF: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al generar el PDF, intentelo más tarde' });
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    const stageLabel = (stage: string) => {
        switch (stage) {
            case "piglet": return "Lechón";
            case "weaning": return "Destete";
            case "fattening": return "Engorda";
            case "breeder": return "Reproductor";
            default: return stage;
        }
    };

    const stageColors: Record<string, string> = {
        piglet: "#38bdf8",
        weaning: "#fbbf24",
        fattening: "#818cf8",
        breeder: "#34d399",
    };

    const generalStats = pigStats?.generalStats[0];
    const monthlyComparison = pigStats?.monthlyComparison?.[0];
    const trendPercent = monthlyComparison?.percentageChange ?? 0;

    // Donut data for inventory by stage
    const stageDonutData: DonutDataItem[] = (pigStats?.inventoryByStage ?? []).map((s: StageStats) => ({
        id: stageLabel(s.stage),
        label: stageLabel(s.stage),
        value: s.count,
        color: stageColors[s.stage] || "#94a3b8",
    }));

    const stageLegendItems: DonutLegendItem[] = (pigStats?.inventoryByStage ?? []).map((s: StageStats) => {
        const total = generalStats?.total || 1;
        return {
            label: stageLabel(s.stage),
            value: s.count,
            percentage: `${((s.count / total) * 100).toFixed(1)}%`,
        };
    });

    // Bar data for avg weight by stage
    const weightBarData = (pigStats?.avgWeightByStage ?? []).map((s: StageStats) => ({
        stage: stageLabel(s.stage),
        "Peso promedio": Number((s.avgWeight || 0).toFixed(1)),
    }));

    // Line chart data for inventory over time
    const inventoryByDay = pigStats?.inventoryByDay ?? [];
    const lineChartData = inventoryByDay.length > 0
        ? [{
            id: "Inventario",
            data: inventoryByDay.map((d: any) => ({
                x: d._id,
                y: d.count,
            })),
        }]
        : [];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={'Inventario de cerdos'} pageTitle={'Cerdos'} />

                <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />

                {/* KPI Cards */}
                <Row className="g-3 mb-3" style={{ minHeight: "140px" }}>
                    <Col xs={12} sm={6} xl={3} className="d-flex">
                        <StatKpiCard
                            title="Total de cerdos"
                            value={generalStats?.total ?? 0}
                            icon={<GiPig size={22} color="#2563EB" />}
                            iconBgColor="#EFF6FF"
                            animateValue
                            trendPercent={trendPercent}
                            trendLabel="vs. mes anterior"
                            trendVariant={trendPercent >= 0 ? "success" : "danger"}
                            className="w-100"
                        />
                    </Col>
                    <Col xs={12} sm={6} xl={3} className="d-flex">
                        <StatKpiCard
                            title="Peso promedio"
                            value={generalStats?.avgWeight ?? 0}
                            suffix=" kg"
                            icon={<RiScales2Line size={22} color="#0284C7" />}
                            iconBgColor="#E0F2FE"
                            animateValue
                            decimals={1}
                            className="w-100"
                        />
                    </Col>
                    <Col xs={12} sm={6} xl={3} className="d-flex">
                        <StatKpiCard
                            title="Peso mínimo"
                            value={generalStats?.minWeight ?? 0}
                            suffix=" kg"
                            icon={<RiArrowDownLine size={22} color="#D97706" />}
                            iconBgColor="#FEF3C7"
                            animateValue
                            decimals={1}
                            className="w-100"
                        />
                    </Col>
                    <Col xs={12} sm={6} xl={3} className="d-flex">
                        <StatKpiCard
                            title="Peso máximo"
                            value={generalStats?.maxWeight ?? 0}
                            suffix=" kg"
                            icon={<RiArrowUpLine size={22} color="#16A34A" />}
                            iconBgColor="#ECFDF5"
                            animateValue
                            decimals={1}
                            className="w-100"
                        />
                    </Col>
                </Row>

                {/* Charts row */}
                <Row className="g-3 mb-3" style={{ minHeight: "420px" }}>
                    <Col xs={12} lg={4} className="d-flex">
                        <DonutChartCard
                            title="Distribución por etapa"
                            data={stageDonutData}
                            legendItems={stageLegendItems}
                            height={260}
                            className="w-100"
                        />
                    </Col>
                    <Col xs={12} lg={4} className="d-flex">
                        <BasicBarChart
                            title="Peso promedio por etapa"
                            data={weightBarData}
                            indexBy="stage"
                            keys={["Peso promedio"]}
                            xLegend="Etapa"
                            yLegend="Kg"
                            height={320}
                            colors={({ index }: { index: number }) => {
                                const stages = pigStats?.avgWeightByStage ?? [];
                                return stageColors[stages[index]?.stage] || "#94a3b8";
                            }}
                        />
                    </Col>
                    <Col xs={12} lg={4} className="d-flex">
                        <BasicLineChartCard
                            title="Inventario en el tiempo"
                            data={lineChartData}
                            yLabel="Cerdos"
                            xLabel="Fecha"
                            height={320}
                            color="#6366f1"
                            enableArea
                            areaOpacity={0.15}
                            curve="monotoneX"
                            emptyMessage="No hay datos de tendencia disponibles"
                        />
                    </Col>
                </Row>

                {/* Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Cerdos en el inventario</h5>
                        <div className="d-flex gap-2">
                            <Button
                                color="primary"
                                onClick={handleGeneratePDF}
                                disabled={pdfLoading}
                            >
                                {pdfLoading ? (
                                    <>
                                        <Spinner className="me-2" size='sm' />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-file-pdf-line me-2"></i>
                                        Ver PDF
                                    </>
                                )}
                            </Button>
                            <Button className="farm-primary-button" onClick={() => toggleModal('selectCreationMode')}>
                                <i className="ri ri-add-line me-2" />
                                Registrar cerdo
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="mb-3">
                            <PigFilters
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onWeightRangeChange={handleWeightRangeChange}
                                onClearFilters={handleClearFilters}
                                popoverOpen={popoverOpen}
                                onTogglePopover={() => setPopoverOpen(!popoverOpen)}
                            />
                        </div>

                        {filteredPigs.length > 0 ? (
                            <CustomTable columns={pigsInventoryColumns} data={filteredPigs} showPagination={true} rowsPerPage={10} showSearchAndFilter={false} fontSize={13} />
                        ) : (
                            <div className="text-center py-4">
                                <h5 className="text-muted">
                                    {pigsInventory.length > 0 ? 'No hay cerdos que coincidan con los filtros' : 'No hay cerdos en el inventario'}
                                </h5>
                                <p className="text-muted">
                                    {pigsInventory.length > 0 ? 'Intente ajustar los filtros o la búsqueda' : 'No se encontraron registros de cerdos para esta granja'}
                                </p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.selectCreationMode} toggle={() => toggleModal("selectCreationMode")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("selectCreationMode")}>Seleccion modo de registro</ModalHeader>
                <ModalBody>
                    <div className="text-center py-5">
                        <h5 className="mb-4 text-muted">¿Qué tipo de registro quieres realizar?</h5>
                        <div className="d-flex justify-content-center gap-4">
                            <Button color="secondary" size="lg" className="d-flex flex-column align-items-center p-4" onClick={() => { toggleModal('selectCreationMode'); toggleModal('createSingle') }}>
                                <FaKeyboard size={32} className="mb-2" />
                                <span>Registro individual</span>
                            </Button>

                            <Button color="primary" size="lg" className="d-flex flex-column align-items-center p-4" onClick={() => { toggleModal('selectCreationMode'); toggleModal('createBatch') }}>
                                <FaListUl size={32} className="mb-2" />
                                <span>Registro por lote</span>
                            </Button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.createSingle} toggle={() => toggleModal("createSingle")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createSingle")}>Registro individual de cerdo</ModalHeader>
                <ModalBody>
                    <SinglePigForm onSave={() => { toggleModal('createSingle'); fetchData(); }} onCancel={() => toggleModal('createSingle')} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.createBatch} toggle={() => toggleModal("createBatch")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createBatch")}>Registro de cerdos por lote</ModalHeader>
                <ModalBody>
                    <BatchPigForm onSave={() => { toggleModal('createBatch'); fetchData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            {/* Modal PDF */}
            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de inventario de cerdos</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

        </div>
    )
}

export default InventoryPigs;