import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import BasicPieChart from "Components/Common/Graphics/BasicPieChart";
import KPI from "Components/Common/Graphics/Kpi";
import LineChartCard from "Components/Common/Graphics/LineChartCard";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import StatCard from "Components/Common/Shared/StatCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import PigFilters, { PigFiltersState } from "Components/Common/Filters/PigFilters";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState, useMemo } from "react";
import { FaArrowDown, FaArrowUp, FaBalanceScale, FaChartLine, FaPiggyBank, FaKeyboard, FaListUl } from "react-icons/fa";
import { Badge, Card, CardBody, CardHeader, Container, Alert, Button, Modal, ModalHeader, ModalBody, Spinner } from "reactstrap";
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

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={'Inventario de cerdos'} pageTitle={'Cerdos'} />

                {/* Alerta de errores */}
                {alertConfig.visible && (
                    <Alert color={alertConfig.color} className="mb-3" toggle={() => setAlertConfig({ visible: false, color: '', message: '' })}>
                        {alertConfig.message}
                    </Alert>
                )}

                <div className="d-flex gap-3">
                    <KPI title="Total de cerdos" value={pigStats?.generalStats[0]?.total ?? 0} icon={FaPiggyBank} bgColor="#EFF6FF" iconColor="#2563EB" />
                    <KPI title="Peso promedio" value={pigStats?.generalStats[0]?.avgWeight ?? 0} icon={FaBalanceScale} bgColor="#E0F2FE" iconColor="#0284C7" />
                    <KPI title="Peso mínimo" value={pigStats?.generalStats[0]?.minWeight ?? 0} icon={FaArrowDown} bgColor="#FEF3C7" iconColor="#D97706" />
                    <KPI title="Peso máximo" value={pigStats?.generalStats[0]?.maxWeight ?? 0} icon={FaArrowUp} bgColor="#ECFDF5" iconColor="#16A34A" />
                </div>

                <div className="d-flex gap-3">
                    {pigStats?.inventoryByStage && pigStats.inventoryByStage.length > 0 ? (
                        <>
                            <BasicPieChart title={"Cerdos por etapa"}
                                data={pigStats.inventoryByStage.map((s: StageStats) => ({
                                    id: (() => {
                                        switch (s.stage) {
                                            case "piglet": return "Lechón";
                                            case "weaning": return "Destete";
                                            case "fattening": return "Engorda";
                                            case "breeder": return "Reproductor";
                                            default: return s.stage;
                                        }
                                    })(),
                                    value: s.count,
                                }))}
                            />

                            <BasicPieChart title={"Peso promedio por etapa"}
                                data={pigStats.avgWeightByStage?.map((s: StageStats) => ({
                                    id: (() => {
                                        switch (s.stage) {
                                            case "piglet": return "Lechón";
                                            case "weaning": return "Destete";
                                            case "fattening": return "Engorda";
                                            case "breeder": return "Reproductor";
                                            default: return s.stage;
                                        }
                                    })(),
                                    value: s.avgWeight || 0,
                                })) || []}
                            />
                        </>
                    ) : (
                        <Card className="flex-grow-1">
                            <CardBody className="text-center">
                                <h5 className="text-muted">No hay datos por etapa disponibles</h5>
                            </CardBody>
                        </Card>
                    )}
                </div>

                <Card className="">
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5>Cerdos en el inventario</h5>
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
                    <CardBody className="">
                        {/* Filtros */}
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
                            <CustomTable columns={pigsInventoryColumns} data={filteredPigs} showPagination={true} rowsPerPage={10} showSearchAndFilter={false} />
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