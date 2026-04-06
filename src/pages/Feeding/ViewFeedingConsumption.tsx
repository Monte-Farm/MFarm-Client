import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import SelectableCustomTable from "Components/Common/Tables/SelectableTable";
import { Column } from "common/data/data_types";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import BasicPieChart from "Components/Common/Graphics/BasicPieChart";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FiCalendar, FiFilter, FiTrendingUp, FiDollarSign, FiPackage, FiPieChart, FiBarChart2, FiUsers } from "react-icons/fi";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import Select from "react-select";
import {
    Alert,
    Button,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Input,
    Label,
    Row,
    Table,
    Badge,
    FormGroup,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "reactstrap";

interface GroupOption {
    value: string;
    label: string;
    code: string;
    stage: string;
    pigCount: number;
    status?: string;
}

interface LitterOption {
    value: string;
    label: string;
    code: string;
    pigCount: number;
    status: string;
    sowId: string;
}

type ViewMode = 'farm' | 'multiple' | 'litters';

const ViewFeedingConsumption = () => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    
    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    
    const [viewMode, setViewMode] = useState<ViewMode>('farm');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [dateModalOpen, setDateModalOpen] = useState<boolean>(false);
    const [groupModalOpen, setGroupModalOpen] = useState<boolean>(false);
    const [tempSelectedGroups, setTempSelectedGroups] = useState<GroupOption[]>([]);
    const [litterModalOpen, setLitterModalOpen] = useState<boolean>(false);
    const [tempSelectedLitters, setTempSelectedLitters] = useState<LitterOption[]>([]);
    
    const [availableGroups, setAvailableGroups] = useState<GroupOption[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<GroupOption[]>([]);
    
    const [availableLitters, setAvailableLitters] = useState<LitterOption[]>([]);
    const [selectedLitters, setSelectedLitters] = useState<LitterOption[]>([]);
    
    const [consumptionData, setConsumptionData] = useState<any>(null);

    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        setDateFrom(firstDay.toISOString().split('T')[0]);
        setDateTo(lastDay.toISOString().split('T')[0]);
        
        fetchAvailableGroups();
        fetchAvailableLitters();
    }, []);

    useEffect(() => {
        if (dateFrom && dateTo) {
            fetchConsumptionData();
        }
    }, [viewMode, selectedGroups, selectedLitters, dateFrom, dateTo]);

    const fetchAvailableGroups = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/group/find_by_farm/${userLogged.farm_assigned}`
            );
            
            console.log('Groups data:', response.data.data); // Debug log
            
            const groups = response.data.data.map((g: any) => ({
                value: g._id,
                label: `${g.code} - ${g.name} (${g.pig_count || g.pigCount || 0} cerdos)`,
                code: g.code,
                stage: g.stage,
                pigCount: g.pig_count || g.pigCount || 0,
                status: g.status || 'active'
            }));
            
            setAvailableGroups(groups);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchAvailableLitters = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/litter/found_by_farm/${userLogged.farm_assigned}`
            );
            
            console.log('Litters data:', response.data.data); // Debug log
            
            // Filter litters with status 'active' or 'ready_to_wean'
            const filteredLitters = response.data.data.filter((l: any) => 
                l.status === 'active' || l.status === 'ready_to_wean'
            );
            
            const litters = filteredLitters.map((l: any) => ({
                value: l._id,
                label: `${l.code} - ${l.sowCode} (${l.currentMale + l.currentFemale} lechones)`,
                code: l.code,
                pigCount: l.currentMale + l.currentFemale,
                status: l.status,
                sowId: l.sow
            }));
            
            setAvailableLitters(litters);
        } catch (error) {
            console.error('Error fetching litters:', error);
        }
    };

    const fetchConsumptionData = async () => {
        if (!configContext || !userLogged) return;
        
        setLoading(true);
        try {
            let response;
            const params = `?from=${dateFrom}&to=${dateTo}`;
            
            if (viewMode === 'farm') {
                response = await configContext.axiosHelper.get(
                    `${configContext.apiUrl}/feeding_consumption/farm/${userLogged.farm_assigned}${params}`
                );
            } else if (viewMode === 'multiple' && selectedGroups.length > 0) {
                const groupIds = selectedGroups.map(g => g.value);
                response = await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/feeding_consumption/multiple_groups${params}`,
                    { groupIds }
                );
            } else if (viewMode === 'litters' && selectedLitters.length > 0) {
                // For litters, use the multiple_litters endpoint
                const litterIds = selectedLitters.map(l => l.value);
                response = await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/feeding_consumption/multiple_litters${params}`,
                    { litterIds }
                );
            } else if ((viewMode === 'multiple' && selectedGroups.length === 0) || (viewMode === 'litters' && selectedLitters.length === 0)) {
                const entityType = viewMode === 'multiple' ? 'grupos' : 'camadas';
                setAlertConfig({
                    visible: true,
                    color: 'warning',
                    message: `Por favor selecciona uno o más ${entityType} para ver los datos`
                });
                return;
            }
            
            if (response) {
                setConsumptionData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching consumption data:', error);
            setAlertConfig({
                visible: true,
                color: 'danger',
                message: 'Error al cargar los datos de consumo'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        if (mode === 'farm') {
            setSelectedGroups([]);
            setSelectedLitters([]);
        }
        setConsumptionData(null);
    };

    const handleGroupSelection = (selected: any) => {
        setTempSelectedGroups(selected || []);
    };

    const handleGroupModalConfirm = () => {
        setSelectedGroups(tempSelectedGroups);
        setGroupModalOpen(false);
    };

    const handleGroupModalCancel = () => {
        setTempSelectedGroups(selectedGroups);
        setGroupModalOpen(false);
    };

    const handleGroupModalOpen = () => {
        setTempSelectedGroups(selectedGroups);
        setGroupModalOpen(true);
    };

    const handleSelectAllGroups = () => {
        setTempSelectedGroups(availableGroups);
    };

    const handleDeselectAllGroups = () => {
        setTempSelectedGroups([]);
    };

    const handleLitterSelection = (selected: any) => {
        setTempSelectedLitters(selected || []);
    };

    const handleLitterModalConfirm = () => {
        setSelectedLitters(tempSelectedLitters);
        setLitterModalOpen(false);
    };

    const handleLitterModalCancel = () => {
        setTempSelectedLitters(selectedLitters);
        setLitterModalOpen(false);
    };

    const handleLitterModalOpen = () => {
        setTempSelectedLitters(selectedLitters);
        setLitterModalOpen(true);
    };

    const handleSelectAllLitters = () => {
        setTempSelectedLitters(availableLitters);
    };

    const handleDeselectAllLitters = () => {
        setTempSelectedLitters([]);
    };

    const formatGroupsSelectedText = () => {
        if (selectedGroups.length === 0) return 'Seleccionar grupos';
        if (selectedGroups.length === 1) return `${selectedGroups[0].code} - ${selectedGroups[0].label.split(' - ')[1]?.split(' (')[0]}`;
        return `${selectedGroups.length} grupos seleccionados`;
    };

    const formatLittersSelectedText = () => {
        if (selectedLitters.length === 0) return 'Seleccionar camadas';
        if (selectedLitters.length === 1) return `${selectedLitters[0].code} - ${selectedLitters[0].label.split(' - ')[1]?.split(' (')[0]}`;
        return `${selectedLitters.length} camadas seleccionadas`;
    };

    const getStageColor = (stage: string) => {
        const colors: any = {
            'piglet': 'info',
            'weaning': 'primary',
            'fattening': 'success',
            'sale': 'warning',
            'sold': 'secondary',
            'lactation': 'secondary',
            'gestation': 'purple'
        };
        return colors[stage] || 'secondary';
    };

    const getStageName = (stage: string) => {
        const names: any = {
            'piglet': 'Lechón',
            'weaning': 'Destete',
            'fattening': 'Engorde',
            'sale': 'Venta',
            'sold': 'Vendido',
            'lactation': 'Lactancia',
            'gestation': 'Gestación'
        };
        return names[stage] || stage;
    };

    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatNumber = (value: number, decimals: number = 2) => {
        return value.toFixed(decimals);
    };

    const formatDateRange = () => {
        if (!dateFrom || !dateTo) return 'Seleccionar rango de fechas';
        
        const formatDate = (dateStr: string) => {
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('es-DO', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            });
        };
        
        return `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
    };

    const handleDateRangeSelect = (startDate: string, endDate: string) => {
        setDateFrom(startDate);
        setDateTo(endDate);
        setDateModalOpen(false);
    };

    const prepareProductChartData = () => {
        if (!consumptionData) return [];
        
        if (viewMode === 'farm') {
            return consumptionData.consumptionByProduct?.map((p: any) => ({
                id: p.productName,
                label: p.productName,
                value: p.totalKg
            })) || [];
        } else {
            return consumptionData.consolidatedProducts?.map((p: any) => ({
                id: p.productName,
                label: p.productName,
                value: p.totalKg
            })) || [];
        }
    };

    const prepareStageChartData = () => {
        if (!consumptionData || viewMode !== 'farm') return [];
        
        return consumptionData.consumptionByStage?.map((s: any) => ({
            stage: getStageName(s.stage),
            'Kg': s.totalKg,
            'Costo': s.totalCost
        })) || [];
    };

    const prepareTimelineChartData = () => {
        if (!consumptionData) return [];
        
        if (viewMode === 'farm' && consumptionData.monthlyTrend) {
            return [{
                id: 'Consumo (Kg)',
                data: consumptionData.monthlyTrend.map((m: any) => ({
                    x: m.month,
                    y: m.totalKg
                }))
            }];
        } else if (viewMode === 'multiple' && consumptionData.groupsDetail) {
            // Consolidar todos los consumptionTimeline de todos los grupos
            const allTimeline: any[] = [];
            
            consumptionData.groupsDetail.forEach((group: any) => {
                if (group.consumptionTimeline) {
                    group.consumptionTimeline.forEach((timeline: any) => {
                        allTimeline.push({
                            date: timeline.date,
                            totalKg: timeline.totalKg,
                            groupCode: group.groupCode,
                            packageName: timeline.packageName
                        });
                    });
                }
            });
            
            // Ordenar por fecha
            allTimeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            return [{
                id: 'Consumo (Kg)',
                data: allTimeline.map((t: any) => ({
                    x: new Date(t.date).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' }),
                    y: t.totalKg
                }))
            }];
        } else if (viewMode === 'litters' && consumptionData.littersDetail) {
            // Consolidar todos los consumptionTimeline de todas las camadas
            const allTimeline: any[] = [];
            
            consumptionData.littersDetail.forEach((litter: any) => {
                if (litter.consumptionTimeline) {
                    litter.consumptionTimeline.forEach((timeline: any) => {
                        allTimeline.push({
                            date: timeline.date,
                            totalKg: timeline.totalKg,
                            litterCode: litter.litterCode,
                            packageName: timeline.packageName
                        });
                    });
                }
            });
            
            // Ordenar por fecha
            allTimeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            return [{
                id: 'Consumo (Kg)',
                data: allTimeline.map((t: any) => ({
                    x: new Date(t.date).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' }),
                    y: t.totalKg
                }))
            }];
        } else {
            return [];
        }
    };

    const renderKPICards = () => {
        if (!consumptionData) return null;

        let totalKg = 0;
        let totalCost = 0;
        let avgKgPerPig = 0;
        let totalPigs = 0;
        let avgCostPerPig = 0;
        let avgPricePerKg = 0;

        if (viewMode === 'farm') {
            console.log('Farm mode consumptionData:', consumptionData); // Debug log
            totalKg = consumptionData.totalConsumption?.totalKg || 0;
            totalCost = consumptionData.totalConsumption?.totalCost || 0;
            avgKgPerPig = consumptionData.totalConsumption?.avgKgPerPig || 0;
            totalPigs = consumptionData.totalConsumption?.totalPigs || 0;
            avgCostPerPig = consumptionData.totalConsumption?.avgCostPerPig || 0;
            avgPricePerKg = consumptionData.totalConsumption?.avgPricePerKg || 0;
        } else if ((viewMode === 'multiple' || viewMode === 'litters') && consumptionData.summary) {
            totalKg = consumptionData.summary.totalKg || 0;
            totalCost = consumptionData.summary.totalCost || 0;
            avgKgPerPig = consumptionData.summary.avgKgPerPig || 0;
            totalPigs = consumptionData.summary.totalPigs || 0;
            avgCostPerPig = consumptionData.summary.avgCostPerPig || 0;
            avgPricePerKg = consumptionData.summary.avgPricePerKg || 0;
        }

        return (
            <Row className="g-3">
                <Col xl={3} md={6}>
                    <Card className="card-animate">
                        <CardBody>
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <p className="text-uppercase fw-medium text-muted mb-0">Consumo Total</p>
                                    <h4 className="fs-22 fw-semibold mb-0">
                                        <span className="counter-value">{formatNumber(totalKg)} Kg</span>
                                    </h4>
                                </div>
                                <div className="avatar-sm flex-shrink-0">
                                    <span className="avatar-title bg-soft-success text-success rounded fs-3">
                                        <FiPackage />
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                
                <Col xl={3} md={6}>
                    <Card className="card-animate">
                        <CardBody>
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <p className="text-uppercase fw-medium text-muted mb-0">Costo Total</p>
                                    <h4 className="fs-22 fw-semibold mb-0">
                                        <span className="counter-value">{formatCurrency(totalCost)}</span>
                                    </h4>
                                </div>
                                <div className="avatar-sm flex-shrink-0">
                                    <span className="avatar-title bg-soft-danger text-danger rounded fs-3">
                                        <FiDollarSign />
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                
                <Col xl={3} md={6}>
                    <Card className="card-animate">
                        <CardBody>
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <p className="text-uppercase fw-medium text-muted mb-0">Promedio por {viewMode === 'litters' ? 'Lechón' : 'Cerdo'}</p>
                                    <h4 className="fs-22 fw-semibold mb-0">
                                        <span className="counter-value">{formatNumber(avgKgPerPig)} Kg</span>
                                    </h4>
                                </div>
                                <div className="avatar-sm flex-shrink-0">
                                    <span className="avatar-title bg-soft-info text-info rounded fs-3">
                                        <FiTrendingUp />
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                
                <Col xl={3} md={6}>
                    <Card className="card-animate">
                        <CardBody>
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <p className="text-uppercase fw-medium text-muted mb-0">Total {viewMode === 'litters' ? 'Lechones' : 'Cerdos'}</p>
                                    <h4 className="fs-22 fw-semibold mb-0">
                                        <span className="counter-value">{formatNumber(totalPigs)}</span>
                                    </h4>
                                </div>
                                <div className="avatar-sm flex-shrink-0">
                                    <span className="avatar-title bg-soft-primary text-primary rounded fs-3">
                                        <FiUsers />
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        );
    };

    const renderProductsTable = () => {
        if (!consumptionData) return null;

        let products: any[] = [];
        
        if (viewMode === 'farm') {
            products = consumptionData.consumptionByProduct || [];
        } else {
            products = consumptionData.consolidatedProducts || [];
        }

        if (products.length === 0) return null;

        const columns: Column<any>[] = [
            { 
                header: 'Producto', 
                accessor: 'productName', 
                type: 'text',
                render: (_, row) => (
                    <div>
                        <h6 className="mb-0">{row.productName}</h6>
                        {row.productCode && (
                            <small className="text-muted">{row.productCode}</small>
                        )}
                    </div>
                )
            },
            { 
                header: 'Cantidad (Kg)', 
                accessor: 'totalKg', 
                type: 'number',
                bgColor: '#e3f2fd',
                render: (_, row) => (
                    <span className="fw-medium">
                        {formatNumber(row.totalKg)}
                    </span>
                )
            },
            { 
                header: 'Precio/Kg', 
                accessor: 'avgPricePerKg', 
                type: 'number',
                bgColor: '#f3e5f5',
                render: (_, row) => formatCurrency(row.avgPricePerKg)
            },
            { 
                header: 'Costo Total', 
                accessor: 'totalCost', 
                type: 'number',
                bgColor: '#e8f5e9',
                render: (_, row) => (
                    <span className="fw-medium">
                        {formatCurrency(row.totalCost)}
                    </span>
                )
            },
            { 
                header: '% del Total', 
                accessor: 'percentage', 
                type: 'number',
                render: (_, row) => `${formatNumber(row.percentage, 1)}%`
            }
        ];

        return (
            <Card>
                <CardHeader>
                    <h5 className="card-title mb-0">
                        <FiBarChart2 className="me-2" />
                        Consumo por Producto
                    </h5>
                </CardHeader>
                <CardBody>
                    <CustomTable
                        columns={columns}
                        data={products}
                        showSearchAndFilter={false}
                        showPagination={products.length > 10}
                        rowsPerPage={10}
                    />
                </CardBody>
            </Card>
        );
    };

    const renderGroupsDetailTable = () => {
        if (viewMode !== 'multiple' || !consumptionData?.groupsDetail) return null;

        const columns: Column<any>[] = [
            { 
                header: 'Grupo', 
                accessor: 'groupCode', 
                type: 'text',
                render: (_, row) => (
                    <div>
                        <h6 className="mb-0">{row.groupCode}</h6>
                        <small className="text-muted">{row.groupName}</small>
                    </div>
                )
            },
            { 
                header: 'Etapa', 
                accessor: 'stage', 
                type: 'text',
                render: (_, row) => (
                    <Badge color={getStageColor(row.stage)}>
                        {getStageName(row.stage)}
                    </Badge>
                )
            },
            { 
                header: 'Cerdos', 
                accessor: 'pigCount', 
                type: 'number'
            },
            { 
                header: 'Total Kg', 
                accessor: 'totalKg', 
                type: 'number',
                bgColor: '#e3f2fd',
                render: (_, row) => (
                    <span className="fw-medium">
                        {formatNumber(row.totalKg)}
                    </span>
                )
            },
            { 
                header: 'Costo Total', 
                accessor: 'totalCost', 
                type: 'number',
                bgColor: '#e8f5e9',
                render: (_, row) => formatCurrency(row.totalCost)
            },
            { 
                header: 'Kg/Cerdo', 
                accessor: 'avgKgPerPig', 
                type: 'number',
                render: (_, row) => formatNumber(row.avgKgPerPig)
            }
        ];

        return (
            <Card>
                <CardHeader>
                    <h5 className="card-title mb-0">
                        <FiUsers className="me-2" />
                        Detalle por Grupo
                    </h5>
                </CardHeader>
                <CardBody>
                    <CustomTable
                        columns={columns}
                        data={consumptionData.groupsDetail}
                        showSearchAndFilter={false}
                        showPagination={consumptionData.groupsDetail.length > 10}
                        rowsPerPage={10}
                    />
                </CardBody>
            </Card>
        );
    };

    const renderStageConsumption = () => {
        if (viewMode !== 'farm' || !consumptionData?.consumptionByStage) return null;

        const columns: Column<any>[] = [
            { 
                header: 'Etapa', 
                accessor: 'stage', 
                type: 'text',
                render: (_, row) => getStageName(row.stage)
            },
            { 
                header: 'Grupos', 
                accessor: 'groupCount', 
                type: 'number'
            },
            { 
                header: 'Cerdos', 
                accessor: 'pigCount', 
                type: 'number'
            },
            { 
                header: 'Total Kg', 
                accessor: 'totalKg', 
                type: 'number',
                bgColor: '#e3f2fd',
                render: (_, row) => (
                    <span className="fw-medium">
                        {formatNumber(row.totalKg)}
                    </span>
                )
            },
            { 
                header: 'Costo Total', 
                accessor: 'totalCost', 
                type: 'number',
                bgColor: '#e8f5e9',
                render: (_, row) => formatCurrency(row.totalCost)
            },
            { 
                header: '% del Total', 
                accessor: 'percentage', 
                type: 'number',
                render: (_, row) => `${formatNumber(row.percentage, 1)}%`
            }
        ];

        return (
            <Card>
                <CardHeader>
                    <h5 className="card-title mb-0">
                        <FiPieChart className="me-2" />
                        Consumo por Etapa
                    </h5>
                </CardHeader>
                <CardBody>
                    <CustomTable
                        columns={columns}
                        data={consumptionData.consumptionByStage}
                        showSearchAndFilter={false}
                        showPagination={false}
                    />
                </CardBody>
            </Card>
        );
    };

    const renderTopConsumingGroups = () => {
        if (viewMode !== 'farm' || !consumptionData?.topConsumingGroups || consumptionData.topConsumingGroups.length === 0) return null;

        const columns: Column<any>[] = [
            { 
                header: 'Grupo', 
                accessor: 'groupCode', 
                type: 'text',
                render: (_, row) => (
                    <div>
                        <h6 className="mb-0">{row.groupCode}</h6>
                        <small className="text-muted">{row.groupName}</small>
                    </div>
                )
            },
            { 
                header: 'Etapa', 
                accessor: 'stage', 
                type: 'text',
                render: (_, row) => (
                    <Badge color={getStageColor(row.stage)}>
                        {getStageName(row.stage)}
                    </Badge>
                )
            },
            { 
                header: 'Estado', 
                accessor: 'status', 
                type: 'text',
                render: (_, row) => {
                    const statusColors: any = {
                        'active': 'success',
                        'sold': 'secondary',
                        'inactive': 'warning'
                    };
                    const statusNames: any = {
                        'active': 'Activo',
                        'sold': 'Vendido',
                        'inactive': 'Inactivo'
                    };
                    return (
                        <Badge color={statusColors[row.status] || 'secondary'}>
                            {statusNames[row.status] || row.status}
                        </Badge>
                    );
                }
            },
            { 
                header: 'Cerdos', 
                accessor: 'pigCount', 
                type: 'number'
            },
            { 
                header: 'Total Kg', 
                accessor: 'totalKg', 
                type: 'number',
                bgColor: '#e3f2fd',
                render: (_, row) => (
                    <span className="fw-medium">
                        {formatNumber(row.totalKg)}
                    </span>
                )
            },
            { 
                header: 'Costo Total', 
                accessor: 'totalCost', 
                type: 'number',
                bgColor: '#e8f5e9',
                render: (_, row) => formatCurrency(row.totalCost)
            },
            { 
                header: 'Kg/Cerdo', 
                accessor: 'avgKgPerPig', 
                type: 'number',
                render: (_, row) => formatNumber(row.totalKg / row.pigCount)
            }
        ];

        return (
            <Card>
                <CardHeader>
                    <h5 className="card-title mb-0">
                        <FiTrendingUp className="me-2" />
                        Top Grupos Consumidores
                    </h5>
                </CardHeader>
                <CardBody>
                    <CustomTable
                        columns={columns}
                        data={consumptionData.topConsumingGroups}
                        showSearchAndFilter={false}
                        showPagination={consumptionData.topConsumingGroups.length > 10}
                        rowsPerPage={10}
                    />
                </CardBody>
            </Card>
        );
    };

    const renderEfficiencyMetrics = () => {
        if (viewMode !== 'multiple' || !consumptionData?.efficiency) return null;

        const efficiency = consumptionData.efficiency;

        return (
            <Card>
                <CardHeader>
                    <h5 className="card-title mb-0">
                        <FiTrendingUp className="me-2" />
                        Métricas de Eficiencia
                    </h5>
                </CardHeader>
                <CardBody>
                    <Row>
                        <Col md={6} lg={3}>
                            <div className="text-center p-3 border rounded">
                                <p className="text-muted mb-2">FCR (Conversión)</p>
                                <h4 className="mb-0">{formatNumber(efficiency.fcr)}</h4>
                            </div>
                        </Col>
                        <Col md={6} lg={3}>
                            <div className="text-center p-3 border rounded">
                                <p className="text-muted mb-2">Costo/Kg Ganancia</p>
                                <h4 className="mb-0">{formatCurrency(efficiency.feedCostPerKgGain)}</h4>
                            </div>
                        </Col>
                        <Col md={6} lg={3}>
                            <div className="text-center p-3 border rounded">
                                <p className="text-muted mb-2">Ganancia Total (Kg)</p>
                                <h4 className="mb-0">{formatNumber(efficiency.totalWeightGain)}</h4>
                            </div>
                        </Col>
                        <Col md={6} lg={3}>
                            <div className="text-center p-3 border rounded">
                                <p className="text-muted mb-2">Alimento Estimado (Kg)</p>
                                <h4 className="mb-0">{formatNumber(efficiency.estimatedFeedKg)}</h4>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>
        );
    };

    const renderLittersDetail = () => {
        if (viewMode !== 'litters' || !consumptionData?.littersDetail || consumptionData.littersDetail.length === 0) return null;

        const columns: Column<any>[] = [
            { 
                header: 'Camada', 
                accessor: 'litterCode', 
                type: 'text',
                render: (_, row) => (
                    <div>
                        <h6 className="mb-0">{row.litterCode}</h6>
                        <small className="text-muted">{row.litterName}</small>
                    </div>
                )
            },
            { 
                header: 'Estado', 
                accessor: 'status', 
                type: 'text',
                render: (_, row) => {
                    const statusColors: any = {
                        'active': 'success',
                        'ready_to_wean': 'warning'
                    };
                    const statusNames: any = {
                        'active': 'Activa',
                        'ready_to_wean': 'Lista para Destete'
                    };
                    return (
                        <Badge color={statusColors[row.status] || 'secondary'}>
                            {statusNames[row.status] || row.status}
                        </Badge>
                    );
                }
            },
            { 
                header: 'Lechones', 
                accessor: 'pigCount', 
                type: 'number'
            },
            { 
                header: 'Total Kg', 
                accessor: 'totalKg', 
                type: 'number',
                bgColor: "#e3f2fd"
            },
            { 
                header: 'Costo Total', 
                accessor: 'totalCost', 
                type: 'currency',
                bgColor: "#f3e5f5"
            },
            { 
                header: 'Kg/Lechón', 
                accessor: 'avgKgPerPig', 
                type: 'number',
                bgColor: "#e8f5e9"
            }
        ];

        return (
            <Card>
                <CardHeader>
                    <h5 className="card-title mb-0">
                        <FiPackage className="me-2" />
                        Desglose por Camadas
                    </h5>
                </CardHeader>
                <CardBody>
                    <CustomTable
                        columns={columns}
                        data={consumptionData.littersDetail}
                        showSearchAndFilter={false}
                        showPagination={consumptionData.littersDetail.length > 10}
                        rowsPerPage={10}
                    />
                </CardBody>
            </Card>
        );
    };

    if (loading && !consumptionData) {
        return <LoadingAnimation />;
    }

    return (
        <>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Consumo de Alimentos" pageTitle="Alimentación" />
                    
                    {alertConfig.visible && (
                        <Alert color={alertConfig.color} toggle={() => setAlertConfig({ ...alertConfig, visible: false })}>
                            {alertConfig.message}
                        </Alert>
                    )}

                    <Card>
                        <CardHeader>
                            <Row className="align-items-center g-3">
                                <Col md={12} lg={4}>
                                    <div>
                                        <h5 className="card-title mb-1">
                                            <FiFilter className="me-2" />
                                            Filtros de Visualización
                                        </h5>
                                        <p className="text-muted mb-0 small">Configura cómo deseas ver los datos</p>
                                    </div>
                                </Col>
                                <Col md={6} lg={4}>
                                    <FormGroup className="mb-0">
                                        <Label className="form-label small fw-medium text-muted">Rango de Fechas</Label>
                                        <div className="position-relative">
                                            <Button
                                                color="white"
                                                className="w-100 text-start d-flex align-items-center justify-content-between shadow-sm border-0"
                                                onClick={() => setDateModalOpen(true)}
                                                style={{ 
                                                    backgroundColor: '#f8f9fa',
                                                    padding: '0.6rem 1rem',
                                                    fontSize: '0.875rem',
                                                    minHeight: '42px'
                                                }}
                                            >
                                                <div className="d-flex align-items-center flex-grow-1">
                                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 me-2" style={{ width: '28px', height: '28px' }}>
                                                        <FiCalendar className="text-primary" style={{ fontSize: '14px' }} />
                                                    </div>
                                                    <span className="text-dark fw-medium">
                                                        {formatDateRange()}
                                                    </span>
                                                </div>
                                                <i className="ri-calendar-line text-muted"></i>
                                            </Button>
                                        </div>
                                    </FormGroup>
                                </Col>
                                <Col md={6} lg={4}>
                                    <FormGroup className="mb-0">
                                        <Label className="form-label small fw-medium text-muted">Modo de Vista</Label>
                                        <div className="d-flex bg-light rounded p-1" style={{ minHeight: '42px' }}>
                                            <Button
                                                color="transparent"
                                                className={`flex-fill rounded border-0 ${viewMode === 'farm' ? 'bg-white shadow-sm' : ''}`}
                                                onClick={() => handleViewModeChange('farm')}
                                                style={{ 
                                                    fontSize: '0.875rem',
                                                    fontWeight: viewMode === 'farm' ? '600' : '400',
                                                    color: viewMode === 'farm' ? '#0f6efd' : '#6c757d'
                                                }}
                                            >
                                                General
                                            </Button>
                                            <Button
                                                color="transparent"
                                                className={`flex-fill rounded border-0 ${viewMode === 'multiple' ? 'bg-white shadow-sm' : ''}`}
                                                onClick={() => handleViewModeChange('multiple')}
                                                style={{ 
                                                    fontSize: '0.875rem',
                                                    fontWeight: viewMode === 'multiple' ? '600' : '400',
                                                    color: viewMode === 'multiple' ? '#0f6efd' : '#6c757d'
                                                }}
                                            >
                                                Grupos
                                            </Button>
                                            <Button
                                                color="transparent"
                                                className={`flex-fill rounded border-0 ${viewMode === 'litters' ? 'bg-white shadow-sm' : ''}`}
                                                onClick={() => handleViewModeChange('litters')}
                                                style={{ 
                                                    fontSize: '0.875rem',
                                                    fontWeight: viewMode === 'litters' ? '600' : '400',
                                                    color: viewMode === 'litters' ? '#0f6efd' : '#6c757d'
                                                }}
                                            >
                                                Camadas
                                            </Button>
                                        </div>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </CardHeader>
                        
                        {viewMode === 'multiple' && (
                            <CardBody className="border-top">
                                <FormGroup className="mb-0">
                                    <Label className="form-label fw-medium">Selección de Grupos</Label>
                                    <Button
                                        color="white"
                                        className="w-100 text-start d-flex align-items-center justify-content-between shadow-sm border-0"
                                        onClick={handleGroupModalOpen}
                                        style={{ 
                                            backgroundColor: '#f8f9fa',
                                            padding: '0.6rem 1rem',
                                            fontSize: '0.875rem',
                                            minHeight: '42px'
                                        }}
                                    >
                                        <div className="d-flex align-items-center flex-grow-1">
                                            <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 me-2" style={{ width: '28px', height: '28px' }}>
                                                <FiUsers className="text-primary" style={{ fontSize: '14px' }} />
                                            </div>
                                            <span className="text-dark fw-medium">
                                                {formatGroupsSelectedText()}
                                            </span>
                                        </div>
                                        <i className="ri-arrow-down-s-line text-muted"></i>
                                    </Button>
                                </FormGroup>
                            </CardBody>
                        )}

                        {viewMode === 'litters' && (
                            <CardBody className="border-top">
                                <FormGroup className="mb-0">
                                    <Label className="form-label fw-medium">Selección de Camadas</Label>
                                    <Button
                                        color="white"
                                        className="w-100 text-start d-flex align-items-center justify-content-between shadow-sm border-0"
                                        onClick={handleLitterModalOpen}
                                        style={{ 
                                            backgroundColor: '#f8f9fa',
                                            padding: '0.6rem 1rem',
                                            fontSize: '0.875rem',
                                            minHeight: '42px'
                                        }}
                                    >
                                        <div className="d-flex align-items-center flex-grow-1">
                                            <div className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 me-2" style={{ width: '28px', height: '28px' }}>
                                                <FiPackage className="text-success" style={{ fontSize: '14px' }} />
                                            </div>
                                            <span className="text-dark fw-medium">
                                                {formatLittersSelectedText()}
                                            </span>
                                        </div>
                                        <i className="ri-arrow-down-s-line text-muted"></i>
                                    </Button>
                                </FormGroup>
                            </CardBody>
                        )}
                    </Card>

                    {loading ? (
                        <LoadingAnimation />
                    ) : consumptionData ? (
                        <>
                            {renderKPICards()}

                            <Row className="mb-3">
                                <Col xl={6}>
                                    <BasicPieChart
                                        title="Distribución por Producto"
                                        data={prepareProductChartData()}
                                        height={400}
                                    />
                                </Col>
                                <Col xl={6}>
                                    {viewMode === 'farm' ? (
                                        <BasicBarChart
                                            title="Consumo por Etapa"
                                            data={prepareStageChartData()}
                                            indexBy="stage"
                                            keys={['Kg']}
                                            xLegend="Etapa"
                                            yLegend="Kilogramos (Kg)"
                                            height={400}
                                        />
                                    ) : (
                                        <BasicLineChartCard
                                            title="Evolución del Consumo"
                                            data={prepareTimelineChartData()}
                                            yLabel="Kilogramos (Kg)"
                                            xLabel="Fecha"
                                            height={400}
                                            enableArea={true}
                                            areaOpacity={0.2}
                                        />
                                    )}
                                </Col>
                            </Row>

                            {viewMode === 'farm' && prepareTimelineChartData().length > 0 && (
                                <Row className="mb-3">
                                    <Col xl={12}>
                                        <BasicLineChartCard
                                            title="Tendencia Mensual de Consumo"
                                            data={prepareTimelineChartData()}
                                            yLabel="Kilogramos (Kg)"
                                            xLabel="Mes"
                                            height={350}
                                            enableArea={true}
                                            areaOpacity={0.2}
                                        />
                                    </Col>
                                </Row>
                            )}

                            {renderEfficiencyMetrics()}

                            <Row className="mb-3">
                                <Col xl={12}>
                                    {renderProductsTable()}
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col xl={12}>
                                    {renderStageConsumption()}
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col xl={12}>
                                    {renderTopConsumingGroups()}
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col xl={12}>
                                    {renderGroupsDetailTable()}
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col xl={12}>
                                    {renderLittersDetail()}
                                </Col>
                            </Row>
                        </>
                    ) : (
                        <Card>
                            <CardBody className="text-center py-5">
                                <FiPackage size={48} className="text-muted mb-3" />
                                <h5 className="text-muted">No hay datos disponibles</h5>
                                <p className="text-muted">
                                    {viewMode !== 'farm' && ((viewMode === 'multiple' && selectedGroups.length === 0) || (viewMode === 'litters' && selectedLitters.length === 0))
                                        ? viewMode === 'litters' 
                                            ? 'Selecciona una o más camadas para ver los datos de consumo'
                                            : 'Selecciona uno o más grupos para ver los datos de consumo'
                                        : 'Ajusta los filtros para ver los datos de consumo'}
                                </p>
                            </CardBody>
                        </Card>
                    )}

                    <Modal isOpen={dateModalOpen} toggle={() => setDateModalOpen(false)} centered>
                        <ModalHeader toggle={() => setDateModalOpen(false)}>
                            <FiCalendar className="me-2" />
                            Seleccionar Rango de Fechas
                        </ModalHeader>
                        <ReportDateRangeSelector
                            onGenerate={handleDateRangeSelect}
                            onCancel={() => setDateModalOpen(false)}
                            generateButtonText="Aplicar Filtro"
                        />
                    </Modal>

                    <Modal isOpen={groupModalOpen} toggle={handleGroupModalCancel} size="lg" centered>
                        <ModalHeader toggle={handleGroupModalCancel}>
                            <FiUsers className="me-2" />
                            Seleccionar Grupos
                        </ModalHeader>
                        <ModalBody style={{ maxHeight: '500px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0">
                                    {tempSelectedGroups.length} de {availableGroups.length} grupos seleccionados
                                </h6>
                                <div className="d-flex gap-2">
                                    <Button 
                                        size="sm" 
                                        color="outline-primary"
                                        onClick={handleSelectAllGroups}
                                        disabled={tempSelectedGroups.length === availableGroups.length}
                                    >
                                        Seleccionar Todo
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        color="outline-secondary"
                                        onClick={handleDeselectAllGroups}
                                        disabled={tempSelectedGroups.length === 0}
                                    >
                                        Deseleccionar Todo
                                    </Button>
                                </div>
                            </div>
                            <SelectableCustomTable
                                columns={[
                                    { 
                                        header: 'Grupo', 
                                        accessor: 'value', 
                                        type: 'text',
                                        render: (_, row) => (
                                            <div>
                                                <h6 className="mb-0">{row.code}</h6>
                                                <small className="text-muted">{row.label.split(' - ')[1]?.split(' (')[0]}</small>
                                            </div>
                                        )
                                    },
                                    { 
                                        header: 'Etapa', 
                                        accessor: 'value', 
                                        type: 'text',
                                        render: (_, row) => (
                                            <Badge color={getStageColor(row.stage)} className="badge-soft">
                                                {getStageName(row.stage)}
                                            </Badge>
                                        )
                                    },
                                    { 
                                        header: 'Cerdos', 
                                        accessor: 'value', 
                                        type: 'number',
                                        render: (_, row) => row.pigCount
                                    },
                                    { 
                                        header: 'Estado', 
                                        accessor: 'value', 
                                        type: 'text',
                                        render: (_, row) => {
                                            const statusColors: any = {
                                                'active': 'success',
                                                'sold': 'secondary',
                                                'inactive': 'warning'
                                            };
                                            const statusNames: any = {
                                                'active': 'Activo',
                                                'sold': 'Vendido',
                                                'inactive': 'Inactivo'
                                            };
                                            const status = row.status || 'active';
                                            return (
                                                <Badge color={statusColors[status] || 'secondary'}>
                                                    {statusNames[status] || status}
                                                </Badge>
                                            );
                                        }
                                    }
                                ]}
                                data={availableGroups.map(g => ({ ...g, id: g.value }))}
                                selectionMode="multiple"
                                onSelect={(selected) => handleGroupSelection(selected.map(s => ({ ...s, value: s.id, code: availableGroups.find(g => g.value === s.id)?.code || '', label: availableGroups.find(g => g.value === s.id)?.label || '', stage: availableGroups.find(g => g.value === s.id)?.stage || '', pigCount: availableGroups.find(g => g.value === s.id)?.pigCount || 0 })))}
                                showSearchAndFilter={false}
                                showPagination={true}
                                rowsPerPage={10}
                                resetSelectionTrigger={groupModalOpen}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" onClick={handleGroupModalCancel}>
                                Cancelar
                            </Button>
                            <Button 
                                color="primary" 
                                onClick={handleGroupModalConfirm}
                                disabled={tempSelectedGroups.length === 0}
                            >
                                Aceptar ({tempSelectedGroups.length})
                            </Button>
                        </ModalFooter>
                    </Modal>

                    <Modal isOpen={litterModalOpen} toggle={handleLitterModalCancel} size="lg" centered>
                        <ModalHeader toggle={handleLitterModalCancel}>
                            <FiPackage className="me-2" />
                            Seleccionar Camadas
                        </ModalHeader>
                        <ModalBody style={{ maxHeight: '500px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0">
                                    {tempSelectedLitters.length} de {availableLitters.length} camadas seleccionadas
                                </h6>
                                <div className="d-flex gap-2">
                                    <Button 
                                        size="sm" 
                                        color="outline-primary"
                                        onClick={handleSelectAllLitters}
                                        disabled={tempSelectedLitters.length === availableLitters.length}
                                    >
                                        Seleccionar Todo
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        color="outline-secondary"
                                        onClick={handleDeselectAllLitters}
                                        disabled={tempSelectedLitters.length === 0}
                                    >
                                        Deseleccionar Todo
                                    </Button>
                                </div>
                            </div>
                            <SelectableCustomTable
                                columns={[
                                    { 
                                        header: 'Camada', 
                                        accessor: 'value', 
                                        type: 'text',
                                        render: (_, row) => (
                                            <div>
                                                <h6 className="mb-0">{row.code}</h6>
                                                <small className="text-muted">{row.label.split(' - ')[1]?.split(' (')[0]}</small>
                                            </div>
                                        )
                                    },
                                    { 
                                        header: 'Estado', 
                                        accessor: 'value', 
                                        type: 'text',
                                        render: (_, row) => {
                                            const statusColors: any = {
                                                'active': 'success',
                                                'ready_to_wean': 'warning'
                                            };
                                            const statusNames: any = {
                                                'active': 'Activa',
                                                'ready_to_wean': 'Lista para Destete'
                                            };
                                            return (
                                                <Badge color={statusColors[row.status] || 'secondary'}>
                                                    {statusNames[row.status] || row.status}
                                                </Badge>
                                            );
                                        }
                                    },
                                    { 
                                        header: 'Lechones', 
                                        accessor: 'value', 
                                        type: 'number',
                                        render: (_, row) => row.pigCount
                                    }
                                ]}
                                data={availableLitters.map(l => ({ ...l, id: l.value }))}
                                selectionMode="multiple"
                                onSelect={(selected) => handleLitterSelection(selected.map(s => ({ ...s, value: s.id, code: availableLitters.find(l => l.value === s.id)?.code || '', label: availableLitters.find(l => l.value === s.id)?.label || '', pigCount: availableLitters.find(l => l.value === s.id)?.pigCount || 0, status: availableLitters.find(l => l.value === s.id)?.status || '', sowId: availableLitters.find(l => l.value === s.id)?.sowId || '' })))}
                                showSearchAndFilter={false}
                                showPagination={true}
                                rowsPerPage={10}
                                resetSelectionTrigger={litterModalOpen}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" onClick={handleLitterModalCancel}>
                                Cancelar
                            </Button>
                            <Button 
                                color="primary" 
                                onClick={handleLitterModalConfirm}
                                disabled={tempSelectedLitters.length === 0}
                            >
                                Aceptar ({tempSelectedLitters.length})
                            </Button>
                        </ModalFooter>
                    </Modal>
                </Container>
            </div>
        </>
    );
};

export default ViewFeedingConsumption;
