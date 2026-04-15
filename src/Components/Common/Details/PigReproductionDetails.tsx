import { ConfigContext } from "App";
import { useContext, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Col, Input, Label, Row } from "reactstrap";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import DonutChartCard from "Components/Common/Graphics/DonutChartCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import { Column } from "common/data/data_types";
import DatePicker from "react-flatpickr";
import {
    RiHeartPulseLine, RiTestTubeLine, RiServiceLine, RiParentLine, RiCloseCircleLine, RiFireLine,
    RiCalendarEventLine, RiPercentLine, RiTimerLine, RiDropLine, RiStackLine, RiEmotionHappyLine,
    RiAwardLine, RiFilter3Line
} from "react-icons/ri";

interface Props {
    pigId: string;
}

const reproductionTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
    extraction: { label: 'Extracción', color: '#0ea5e9', icon: RiTestTubeLine },
    insemination: { label: 'Inseminación', color: '#8b5cf6', icon: RiServiceLine },
    birth: { label: 'Parto', color: '#ec4899', icon: RiParentLine },
    abortion: { label: 'Aborto', color: '#ef4444', icon: RiCloseCircleLine },
    heat_detected: { label: 'Celo detectado', color: '#f59e0b', icon: RiFireLine },
};

const cycleConfig: Record<string, { color: string; label: string }> = {
    empty: { color: 'secondary', label: 'Vacía' },
    inseminated: { color: 'info', label: 'Inseminada' },
    pregnant: { color: 'primary', label: 'Gestante' },
    lactating: { color: 'warning', label: 'Lactando' },
    weaning: { color: 'success', label: 'Destete' },
};

const qualityConfig: Record<string, { color: string; label: string }> = {
    excellent: { color: 'success', label: 'Excelente' },
    good: { color: 'info', label: 'Buena' },
    regular: { color: 'warning', label: 'Regular' },
    poor: { color: 'danger', label: 'Baja' },
};

const resultConfig: Record<string, { color: string; label: string }> = {
    successful_birth: { color: 'success', label: 'Parto exitoso' },
    abortion: { color: 'danger', label: 'Aborto' },
    pending: { color: 'warning', label: 'Pendiente' },
    not_pregnant: { color: 'secondary', label: 'No preñó' },
};

const renderReproductionDetails = (event: any) => {
    const d = event.details || {};
    switch (event.type) {
        case 'extraction':
            return (
                <div className="small text-muted d-flex flex-wrap gap-3">
                    <span><strong className="text-dark">{d.volume}</strong> ml</span>
                    <span><strong className="text-dark">{d.concentration}</strong> M/ml</span>
                    {d.quality && <Badge color="light" className="fw-normal text-dark border text-capitalize">{qualityConfig[d.quality]?.label || d.quality}</Badge>}
                    {d.destinationFemale && <span>→ <strong className="text-dark">{d.destinationFemale.code}</strong></span>}
                </div>
            );
        case 'insemination':
            return (
                <div className="small text-muted d-flex flex-wrap gap-3">
                    <span>Verraco: <strong className="text-dark">{d.maleCode}</strong></span>
                    <span><strong className="text-dark">{d.dose}</strong> dosis</span>
                    {d.method && <Badge color="light" className="fw-normal text-dark border text-capitalize">{d.method}</Badge>}
                </div>
            );
        case 'birth':
            return (
                <div className="small text-muted d-flex flex-wrap gap-3">
                    <span>Vivos: <strong className="text-success">{d.bornAlive}</strong></span>
                    <span>Muertos: <strong className="text-danger">{d.bornDead}</strong></span>
                    {d.mummified > 0 && <span>Momificados: <strong className="text-dark">{d.mummified}</strong></span>}
                    <span>Peso total: <strong className="text-dark">{d.totalWeight} kg</strong></span>
                </div>
            );
        case 'abortion':
            return (
                <div className="small text-muted d-flex flex-wrap gap-3">
                    <span><strong className="text-dark">{d.gestationDays}</strong> días gestación</span>
                    {d.cause && <span>Causa: <strong className="text-dark">{d.cause}</strong></span>}
                </div>
            );
        case 'heat_detected':
            return (
                <div className="small text-muted">
                    Intensidad: <Badge color="warning" className="fw-normal text-capitalize">{d.intensity}</Badge>
                </div>
            );
        default:
            return null;
    }
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const PigReproductionDetails = ({ pigId }: Props) => {
    const configContext = useContext(ConfigContext);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [historyFilters, setHistoryFilters] = useState({ start_date: '', end_date: '', type: '' });

    const fetchData = async () => {
        if (!configContext || !pigId) return;
        setLoading(true);
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/reproduction_details/${pigId}`);
            setData(response.data.data);
        } catch (error) {
            console.error('Error al cargar detalles reproductivos', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [pigId]);

    const filteredHistory = useMemo(() => {
        if (!data?.reproductionHistory) return [];
        return data.reproductionHistory.filter((ev: any) => {
            if (historyFilters.type && ev.type !== historyFilters.type) return false;
            if (historyFilters.start_date && new Date(ev.date) < new Date(historyFilters.start_date)) return false;
            if (historyFilters.end_date && new Date(ev.date) > new Date(historyFilters.end_date)) return false;
            return true;
        });
    }, [data, historyFilters]);

    const historyCountByType = useMemo(() => {
        if (!data?.reproductionHistory) return [];
        const counts: Record<string, number> = {};
        data.reproductionHistory.forEach((ev: any) => { counts[ev.type] = (counts[ev.type] || 0) + 1; });
        return Object.entries(counts).map(([type, count]) => ({ type, count }));
    }, [data]);

    if (loading) return <LoadingAnimation />;
    if (!data) return <div className="text-center text-muted py-5">Sin información reproductiva</div>;

    const isFemale = data.sex === 'female';
    const isMale = data.sex === 'male';

    return (
        <>
            {/* ============ HEMBRA ============ */}
            {isFemale && data.femaleStats && (
                <>
                    <Row className="g-3 mb-3">
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Total de Partos"
                                value={data.femaleStats.kpis.totalBirths}
                                icon={<RiParentLine size={20} style={{ color: '#ec4899' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Lechones Vivos / Parto"
                                value={data.femaleStats.kpis.avgBornAlivePerBirth}
                                icon={<RiEmotionHappyLine size={20} style={{ color: '#10b981' }} />}
                                animateValue={true}
                                decimals={1}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Tasa de Preñez"
                                value={data.femaleStats.kpis.pregnancyRate}
                                suffix="%"
                                icon={<RiPercentLine size={20} style={{ color: '#8b5cf6' }} />}
                                animateValue={true}
                                decimals={1}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Días desde último servicio"
                                value={data.femaleStats.kpis.daysSinceLastService ?? 0}
                                suffix="días"
                                icon={<RiTimerLine size={20} style={{ color: '#f59e0b' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Próximo Evento"
                                value={(data.femaleStats.kpis.nextExpectedEvent
                                    ? `${data.femaleStats.kpis.nextExpectedEvent.label}: ${formatDate(data.femaleStats.kpis.nextExpectedEvent.date)}`
                                    : 'Ninguno') as any}
                                icon={<RiCalendarEventLine size={20} style={{ color: '#0ea5e9' }} />}
                            />
                        </Col>
                    </Row>

                    <Card className="border-0 shadow-sm mb-3 overflow-hidden">
                        <div style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', borderBottom: '1px solid #f9a8d4' }}>
                            <CardBody className="p-4">
                                <Row className="align-items-center g-3">
                                    <Col xs="auto">
                                        <div
                                            className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm"
                                            style={{ width: 72, height: 72, border: '3px solid #fff' }}
                                        >
                                            <RiHeartPulseLine size={32} style={{ color: '#ec4899' }} />
                                        </div>
                                    </Col>
                                    <Col>
                                        <div className="text-muted small fw-medium mb-1">Estado Reproductivo Actual</div>
                                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                            <h4 className="mb-0 fw-bold text-dark">
                                                {cycleConfig[data.femaleStats.currentStatus.cycle]?.label || data.femaleStats.currentStatus.cycleLabel}
                                            </h4>
                                            <Badge color={cycleConfig[data.femaleStats.currentStatus.cycle]?.color || 'secondary'} className="fw-normal">
                                                {data.femaleStats.currentStatus.daysInCycle} días en etapa
                                            </Badge>
                                        </div>
                                        <div className="d-flex flex-wrap gap-4 small text-muted">
                                            {data.femaleStats.currentStatus.estimatedBirthDate && (
                                                <span>
                                                    <RiCalendarEventLine className="me-1" />
                                                    Parto estimado: <strong className="text-dark">{formatDate(data.femaleStats.currentStatus.estimatedBirthDate)}</strong>
                                                </span>
                                            )}
                                            {data.femaleStats.currentStatus.lastServiceMale && (
                                                <span>
                                                    Último servicio: <strong className="text-dark">{data.femaleStats.currentStatus.lastServiceMale.code}</strong>
                                                    {data.femaleStats.currentStatus.lastServiceDate && (
                                                        <span className="ms-2">({formatDate(data.femaleStats.currentStatus.lastServiceDate)})</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </div>
                    </Card>

                    <Card className="border-0 shadow-sm mb-3">
                        <CardHeader className="bg-white border-bottom py-3">
                            <h6 className="mb-0 fw-bold text-dark">
                                <RiStackLine className="me-2 text-primary" />
                                Rendimiento por Camada
                            </h6>
                        </CardHeader>
                        <CardBody className="p-0">
                            {data.femaleStats.littersPerformance?.length > 0 ? (
                                <CustomTable
                                    columns={[
                                        { header: 'Fecha', accessor: 'birthDate', type: 'date' },
                                        { header: 'Vivos', accessor: 'bornAlive', type: 'number' },
                                        { header: 'Muertos', accessor: 'bornDead', type: 'number' },
                                        { header: 'Momificados', accessor: 'mummified', type: 'number' },
                                        { header: 'Peso Total (kg)', accessor: 'totalWeight', type: 'number' },
                                        { header: 'Peso Prom. (kg)', accessor: 'avgWeight', type: 'number' },
                                        { header: 'Destetados', accessor: 'weaned', type: 'number' },
                                        {
                                            header: 'Supervivencia',
                                            accessor: 'survivalRate',
                                            type: 'number',
                                            render: (value: number) => {
                                                const color = value >= 90 ? 'success' : value >= 75 ? 'warning' : 'danger';
                                                return <Badge color={color} className="fw-normal">{value}%</Badge>;
                                            },
                                        },
                                    ] as Column<any>[]}
                                    data={data.femaleStats.littersPerformance}
                                    showPagination={true}
                                    rowsPerPage={5}
                                    showSearchAndFilter={false}
                                    className="fs-6"
                                />
                            ) : (
                                <div className="p-4 text-center text-muted">Sin camadas registradas</div>
                            )}
                        </CardBody>
                    </Card>
                </>
            )}

            {/* ============ MACHO ============ */}
            {isMale && data.maleStats && (
                <>
                    <Row className="g-3 mb-3">
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Total Extracciones"
                                value={data.maleStats.kpis.totalExtractions}
                                icon={<RiTestTubeLine size={20} style={{ color: '#0ea5e9' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Volumen Promedio"
                                value={data.maleStats.kpis.avgVolume}
                                suffix="ml"
                                icon={<RiDropLine size={20} style={{ color: '#8b5cf6' }} />}
                                animateValue={true}
                                decimals={1}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Concentración Promedio"
                                value={data.maleStats.kpis.avgConcentration}
                                suffix="M/ml"
                                icon={<RiStackLine size={20} style={{ color: '#10b981' }} />}
                                animateValue={true}
                                decimals={1}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Días desde última extracción"
                                value={data.maleStats.kpis.daysSinceLastExtraction ?? 0}
                                suffix="días"
                                icon={<RiTimerLine size={20} style={{ color: '#f59e0b' }} />}
                                animateValue={true}
                                decimals={0}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title="Calidad Predominante"
                                value={(qualityConfig[data.maleStats.kpis.predominantQuality]?.label || data.maleStats.kpis.predominantQuality) as any}
                                icon={<RiAwardLine size={20} style={{ color: '#ef4444' }} />}
                            />
                        </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                        <Col lg={8}>
                            <BasicLineChartCard
                                title="Evolución de Calidad"
                                data={[
                                    {
                                        id: 'Volumen (ml)',
                                        color: '#8b5cf6',
                                        data: (data.maleStats.qualityEvolution || []).map((p: any) => ({ x: p.date, y: p.volume })),
                                    },
                                    {
                                        id: 'Concentración (M/ml)',
                                        color: '#10b981',
                                        data: (data.maleStats.qualityEvolution || []).map((p: any) => ({ x: p.date, y: p.concentration })),
                                    },
                                ]}
                                yLabel="Valor"
                                xLabel="Fecha"
                                height={320}
                                curve="natural"
                                pointSize={5}
                                strokeWidth={2}
                                enableGrid={true}
                                enablePoints={true}
                                enableArea={false}
                                showLegend={true}
                                legendPosition="top"
                                headerBgColor="#ffffff"
                                className="border-0 shadow-sm h-100"
                            />
                        </Col>
                        <Col lg={4}>
                            <DonutChartCard
                                title="Distribución de Calidad"
                                data={(data.maleStats.qualityDistribution || []).map((q: any) => ({
                                    id: q.qualityLabel,
                                    label: q.qualityLabel,
                                    value: q.count,
                                }))}
                                legendItems={(data.maleStats.qualityDistribution || []).map((q: any) => ({
                                    label: q.qualityLabel,
                                    value: `${q.count}`,
                                    percentage: `${q.percentage}%`,
                                }))}
                                className="h-100 border-0 shadow-sm"
                                headerBgColor="#ffffff"
                            />
                        </Col>
                    </Row>

                    <Card className="border-0 shadow-sm mb-3">
                        <CardHeader className="bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                            <h6 className="mb-0 fw-bold text-dark">
                                <RiServiceLine className="me-2 text-primary" />
                                Hembras Servidas
                            </h6>
                            <Badge color="light" className="text-dark border fw-normal">
                                Descendencia total: <strong>{data.maleStats.totalOffspring}</strong>
                            </Badge>
                        </CardHeader>
                        <CardBody className="p-0">
                            {data.maleStats.servedFemales?.length > 0 ? (
                                <CustomTable
                                    columns={[
                                        { header: 'Hembra', accessor: 'femaleCode', type: 'text' },
                                        { header: 'Fecha Servicio', accessor: 'serviceDate', type: 'date' },
                                        {
                                            header: 'Resultado',
                                            accessor: 'result',
                                            type: 'text',
                                            render: (value: string) => {
                                                const cfg = resultConfig[value];
                                                return <Badge color={cfg?.color || 'secondary'} className="fw-normal">{cfg?.label || value}</Badge>;
                                            },
                                        },
                                        { header: 'Lechones', accessor: 'pigletsGenerated', type: 'number' },
                                    ] as Column<any>[]}
                                    data={data.maleStats.servedFemales}
                                    showPagination={true}
                                    rowsPerPage={5}
                                    showSearchAndFilter={false}
                                    className="fs-6"
                                />
                            ) : (
                                <div className="p-4 text-center text-muted">Sin hembras registradas</div>
                            )}
                        </CardBody>
                    </Card>
                </>
            )}

            {/* ============ HISTORIAL ============ */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="bg-white border-bottom py-3">
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                        <h6 className="mb-0 fw-bold text-dark">
                            <RiHeartPulseLine className="me-2" style={{ color: '#ec4899' }} />
                            Historial Reproductivo
                        </h6>
                        {historyCountByType.length > 0 && (
                            <div className="d-flex gap-2 flex-wrap">
                                {historyCountByType.map(({ type, count }) => {
                                    const cfg = reproductionTypeConfig[type];
                                    return (
                                        <Badge key={type} color="light" className="text-dark border fw-normal">
                                            <span className="rounded-circle d-inline-block me-2" style={{ width: 8, height: 8, background: cfg?.color || '#64748b' }} />
                                            {cfg?.label || type}: <strong>{count}</strong>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <Row className="g-2 align-items-end">
                        <Col md={3}>
                            <Label className="form-label small text-muted mb-1"><RiFilter3Line className="me-1" />Desde</Label>
                            <DatePicker
                                className="form-control form-control-sm"
                                placeholder="Seleccione fecha"
                                value={historyFilters.start_date || undefined}
                                options={{ dateFormat: 'Y-m-d', allowInput: true }}
                                onChange={(dates: Date[]) => {
                                    const val = dates[0] ? dates[0].toISOString().slice(0, 10) : '';
                                    setHistoryFilters({ ...historyFilters, start_date: val });
                                }}
                            />
                        </Col>
                        <Col md={3}>
                            <Label className="form-label small text-muted mb-1">Hasta</Label>
                            <DatePicker
                                className="form-control form-control-sm"
                                placeholder="Seleccione fecha"
                                value={historyFilters.end_date || undefined}
                                options={{ dateFormat: 'Y-m-d', allowInput: true }}
                                onChange={(dates: Date[]) => {
                                    const val = dates[0] ? dates[0].toISOString().slice(0, 10) : '';
                                    setHistoryFilters({ ...historyFilters, end_date: val });
                                }}
                            />
                        </Col>
                        <Col md={3}>
                            <Label className="form-label small text-muted mb-1">Tipo</Label>
                            <Input
                                type="select"
                                bsSize="sm"
                                value={historyFilters.type}
                                onChange={(e) => setHistoryFilters({ ...historyFilters, type: e.target.value })}
                            >
                                <option value="">Todos</option>
                                {Object.entries(reproductionTypeConfig).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                ))}
                            </Input>
                        </Col>
                        <Col md={3}>
                            <Button
                                size="sm"
                                color="light"
                                className="border"
                                onClick={() => setHistoryFilters({ start_date: '', end_date: '', type: '' })}
                            >
                                Limpiar filtros
                            </Button>
                        </Col>
                    </Row>
                </CardHeader>
                <CardBody>
                    {filteredHistory.length > 0 ? (
                        <div className="position-relative ps-4">
                            <div className="position-absolute" style={{ left: 10, top: 8, bottom: 8, width: 2, background: '#e9ecef' }} />
                            {filteredHistory.map((event: any, idx: number) => {
                                const cfg = reproductionTypeConfig[event.type] || { label: event.typeLabel, color: '#64748b', icon: RiHeartPulseLine };
                                const Icon = cfg.icon;
                                return (
                                    <div key={event._id || idx} className="position-relative mb-3 pb-2" style={{ marginLeft: -6 }}>
                                        <div
                                            className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: 22, height: 22, left: -9, top: 2, background: cfg.color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${cfg.color}33` }}
                                        >
                                            <Icon size={12} color="#fff" />
                                        </div>
                                        <div className="ms-4 ps-2">
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <span className="fw-semibold text-dark">{cfg.label}</span>
                                                <span className="text-muted small">·</span>
                                                <span className="text-muted small">{formatDate(event.date)}</span>
                                            </div>
                                            <div className="text-muted small mb-1">
                                                Por <strong className="text-dark">{event.user.name} {event.user.lastname}</strong>
                                            </div>
                                            {renderReproductionDetails(event)}
                                            {event.observations && (
                                                <div className="text-muted small fst-italic mt-1">"{event.observations}"</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-muted py-4">
                            <RiHeartPulseLine size={36} className="mb-2 opacity-50" />
                            <div>Sin eventos reproductivos</div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </>
    );
};

export default PigReproductionDetails;
