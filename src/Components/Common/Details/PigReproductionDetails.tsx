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
import { useTranslation } from "react-i18next";

interface Props { pigId: string; }

const stageColorMap: Record<string, string> = {
    piglet: "info", weaning: "primary", fattening: "warning", breeder: "success",
};
const resultBadgeColor: Record<string, string> = {
    successful_birth: 'success', abortion: 'danger', pending: 'warning', not_pregnant: 'secondary',
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const PigReproductionDetails = ({ pigId }: Props) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [historyFilters, setHistoryFilters] = useState({ start_date: '', end_date: '', type: '' });

    // Build configs using t() inside component so they react to language changes
    const reproductionTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
        extraction: { label: t('reproduction.type.extraction'), color: '#0ea5e9', icon: RiTestTubeLine },
        insemination: { label: t('reproduction.type.insemination'), color: '#8b5cf6', icon: RiServiceLine },
        birth: { label: t('reproduction.type.birth'), color: '#ec4899', icon: RiParentLine },
        abortion: { label: t('reproduction.type.abortion'), color: '#ef4444', icon: RiCloseCircleLine },
        heat_detected: { label: t('reproduction.type.heatDetected'), color: '#f59e0b', icon: RiFireLine },
    };

    const cycleConfig: Record<string, { color: string; label: string }> = {
        empty: { color: 'secondary', label: t('reproduction.cycle.empty') },
        inseminated: { color: 'info', label: t('reproduction.cycle.inseminated') },
        pregnant: { color: 'primary', label: t('reproduction.cycle.pregnant') },
        lactating: { color: 'warning', label: t('reproduction.cycle.lactating') },
        weaning: { color: 'success', label: t('reproduction.cycle.weaning') },
    };

    const qualityConfig: Record<string, { color: string; label: string }> = {
        excellent: { color: 'success', label: t('reproduction.quality.excellent') },
        good: { color: 'info', label: t('reproduction.quality.good') },
        regular: { color: 'warning', label: t('reproduction.quality.regular') },
        poor: { color: 'danger', label: t('reproduction.quality.poor') },
    };

    const resultConfig: Record<string, { color: string; label: string }> = {
        successful_birth: { color: 'success', label: t('reproduction.result.successfulBirth') },
        abortion: { color: 'danger', label: t('reproduction.result.abortion') },
        pending: { color: 'warning', label: t('reproduction.result.pending') },
        not_pregnant: { color: 'secondary', label: t('reproduction.result.notPregnant') },
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
                        <span>{t('reproduction.detail.boar')} <strong className="text-dark">{d.maleCode}</strong></span>
                        <span><strong className="text-dark">{d.dose}</strong> {t('reproduction.detail.doses')}</span>
                        {d.method && <Badge color="light" className="fw-normal text-dark border text-capitalize">{d.method}</Badge>}
                    </div>
                );
            case 'birth':
                return (
                    <div className="small text-muted d-flex flex-wrap gap-3">
                        <span>{t('reproduction.detail.bornAlive')} <strong className="text-success">{d.bornAlive}</strong></span>
                        <span>{t('reproduction.detail.bornDead')} <strong className="text-danger">{d.bornDead}</strong></span>
                        {d.mummified > 0 && <span>{t('reproduction.detail.mummified')} <strong className="text-dark">{d.mummified}</strong></span>}
                        <span>{t('reproduction.detail.totalWeight')} <strong className="text-dark">{d.totalWeight} kg</strong></span>
                    </div>
                );
            case 'abortion':
                return (
                    <div className="small text-muted d-flex flex-wrap gap-3">
                        <span><strong className="text-dark">{d.gestationDays}</strong> {t('reproduction.detail.gestationDays')}</span>
                        {d.cause && <span>{t('reproduction.detail.cause')} <strong className="text-dark">{d.cause}</strong></span>}
                    </div>
                );
            case 'heat_detected':
                return (
                    <div className="small text-muted">
                        {t('reproduction.detail.intensity')} <Badge color="warning" className="fw-normal text-capitalize">{d.intensity}</Badge>
                    </div>
                );
            default:
                return null;
        }
    };

    const fetchData = async () => {
        if (!configContext || !pigId) return;
        setLoading(true);
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/reproduction_details/${pigId}`);
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching reproduction details', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [pigId]);

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
    if (!data) return <div className="text-center text-muted py-5">{t('reproduction.section.noInfo')}</div>;

    const isFemale = data.sex === 'female';
    const isMale = data.sex === 'male';

    const litterColumns: Column<any>[] = [
        { header: t('reproduction.column.date'), accessor: 'birthDate', type: 'date' },
        { header: t('reproduction.column.bornAlive'), accessor: 'bornAlive', type: 'number' },
        { header: t('reproduction.column.bornDead'), accessor: 'bornDead', type: 'number' },
        { header: t('reproduction.column.mummified'), accessor: 'mummified', type: 'number' },
        { header: t('reproduction.column.totalWeight'), accessor: 'totalWeight', type: 'number' },
        { header: t('reproduction.column.avgWeight'), accessor: 'avgWeight', type: 'number' },
        { header: t('reproduction.column.weaned'), accessor: 'weaned', type: 'number' },
        {
            header: t('reproduction.column.survival'), accessor: 'survivalRate', type: 'number',
            render: (value: number) => {
                const color = value >= 90 ? 'success' : value >= 75 ? 'warning' : 'danger';
                return <Badge color={color} className="fw-normal">{value}%</Badge>;
            },
        },
    ];

    const servedFemalesColumns: Column<any>[] = [
        { header: t('reproduction.column.female'), accessor: 'femaleCode', type: 'text' },
        { header: t('reproduction.column.serviceDate'), accessor: 'serviceDate', type: 'date' },
        {
            header: t('reproduction.column.result'), accessor: 'result', type: 'text',
            render: (value: string) => {
                const cfg = resultConfig[value];
                return <Badge color={cfg?.color || 'secondary'} className="fw-normal">{cfg?.label || value}</Badge>;
            },
        },
        { header: t('reproduction.column.piglets'), accessor: 'pigletsGenerated', type: 'number' },
    ];

    return (
        <>
            {isFemale && data.femaleStats && (
                <>
                    <Row className="g-3 mb-3">
                        <Col md={6} lg><StatKpiCard title={t('reproduction.kpi.totalBirths')} value={data.femaleStats.kpis.totalBirths} icon={<RiParentLine size={20} style={{ color: '#ec4899' }} />} animateValue decimals={0} /></Col>
                        <Col md={6} lg><StatKpiCard title={t('reproduction.kpi.avgBornAlive')} value={data.femaleStats.kpis.avgBornAlivePerBirth} icon={<RiEmotionHappyLine size={20} style={{ color: '#10b981' }} />} animateValue decimals={1} /></Col>
                        <Col md={6} lg><StatKpiCard title={t('reproduction.kpi.pregnancyRate')} value={data.femaleStats.kpis.pregnancyRate} suffix="%" icon={<RiPercentLine size={20} style={{ color: '#8b5cf6' }} />} animateValue decimals={1} /></Col>
                        <Col md={6} lg><StatKpiCard title={t('reproduction.kpi.daysSinceLastService')} value={data.femaleStats.kpis.daysSinceLastService ?? 0} suffix=" días" icon={<RiTimerLine size={20} style={{ color: '#f59e0b' }} />} animateValue decimals={0} /></Col>
                        <Col md={6} lg><StatKpiCard title={t('reproduction.kpi.nextEvent')} value={(data.femaleStats.kpis.nextExpectedEvent ? `${data.femaleStats.kpis.nextExpectedEvent.label}: ${formatDate(data.femaleStats.kpis.nextExpectedEvent.date)}` : '—') as any} icon={<RiCalendarEventLine size={20} style={{ color: '#0ea5e9' }} />} /></Col>
                    </Row>

                    <Card className="border-0 shadow-sm mb-3 overflow-hidden">
                        <div style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', borderBottom: '1px solid #f9a8d4' }}>
                            <CardBody className="p-4">
                                <Row className="align-items-center g-3">
                                    <Col xs="auto">
                                        <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: 72, height: 72, border: '3px solid #fff' }}>
                                            <RiHeartPulseLine size={32} style={{ color: '#ec4899' }} />
                                        </div>
                                    </Col>
                                    <Col>
                                        <div className="text-muted small fw-medium mb-1">{t('reproduction.section.currentStatus')}</div>
                                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                            <h4 className="mb-0 fw-bold text-dark">{cycleConfig[data.femaleStats.currentStatus.cycle]?.label || data.femaleStats.currentStatus.cycleLabel}</h4>
                                            <Badge color={cycleConfig[data.femaleStats.currentStatus.cycle]?.color || 'secondary'} className="fw-normal">
                                                {data.femaleStats.currentStatus.daysInCycle} {t('reproduction.section.daysInStage')}
                                            </Badge>
                                        </div>
                                        <div className="d-flex flex-wrap gap-4 small text-muted">
                                            {data.femaleStats.currentStatus.estimatedBirthDate && (
                                                <span><RiCalendarEventLine className="me-1" />{t('reproduction.section.estimatedBirth')} <strong className="text-dark">{formatDate(data.femaleStats.currentStatus.estimatedBirthDate)}</strong></span>
                                            )}
                                            {data.femaleStats.currentStatus.lastServiceMale && (
                                                <span>{t('reproduction.section.lastService')} <strong className="text-dark">{data.femaleStats.currentStatus.lastServiceMale.code}</strong>
                                                    {data.femaleStats.currentStatus.lastServiceDate && <span className="ms-2">({formatDate(data.femaleStats.currentStatus.lastServiceDate)})</span>}
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
                            <h6 className="mb-0 fw-bold text-dark"><RiStackLine className="me-2 text-primary" />{t('reproduction.section.litterPerformance')}</h6>
                        </CardHeader>
                        <CardBody className="p-0">
                            {data.femaleStats.littersPerformance?.length > 0
                                ? <CustomTable columns={litterColumns} data={data.femaleStats.littersPerformance} showPagination rowsPerPage={5} showSearchAndFilter={false} className="fs-6" />
                                : <div className="p-4 text-center text-muted">{t('reproduction.section.noLitters')}</div>
                            }
                        </CardBody>
                    </Card>
                </>
            )}

            {isMale && data.maleStats && (
                <>
                    <Row className="g-3 mb-3">
                        <Col md={6} lg><StatKpiCard title={t('reproduction.kpi.totalExtractions')} value={data.maleStats.kpis.totalExtractions} icon={<RiTestTubeLine size={20} style={{ color: '#0ea5e9' }} />} animateValue decimals={0} /></Col>
                        <Col md={6} lg><StatKpiCard title={t('reproduction.kpi.avgVolume')} value={data.maleStats.kpis.avgVolume} suffix="ml" icon={<RiDropLine size={20} style={{ color: '#8b5cf6' }} />} animateValue decimals={1} /></Col>
                        <Col md={6} lg><StatKpiCard title={t('reproduction.kpi.avgConcentration')} value={data.maleStats.kpis.avgConcentration} suffix="M/ml" icon={<RiStackLine size={20} style={{ color: '#10b981' }} />} animateValue decimals={1} /></Col>
                        <Col md={6} lg><StatKpiCard title={t('reproduction.kpi.daysSinceLastExtraction')} value={data.maleStats.kpis.daysSinceLastExtraction ?? 0} suffix=" días" icon={<RiTimerLine size={20} style={{ color: '#f59e0b' }} />} animateValue decimals={0} /></Col>
                        <Col md={6} lg><StatKpiCard title={t('reproduction.kpi.predominantQuality')} value={(qualityConfig[data.maleStats.kpis.predominantQuality]?.label || data.maleStats.kpis.predominantQuality) as any} icon={<RiAwardLine size={20} style={{ color: '#ef4444' }} />} /></Col>
                    </Row>

                    <Row className="g-3 mb-3">
                        <Col lg={8}>
                            <BasicLineChartCard
                                title={t('reproduction.section.qualityEvolution')}
                                data={[
                                    { id: 'Volumen (ml)', color: '#8b5cf6', data: (data.maleStats.qualityEvolution || []).map((p: any) => ({ x: p.date, y: p.volume })) },
                                    { id: 'Concentración (M/ml)', color: '#10b981', data: (data.maleStats.qualityEvolution || []).map((p: any) => ({ x: p.date, y: p.concentration })) },
                                ]}
                                yLabel="Valor" xLabel={t('common.field.date')} height={320} curve="natural" pointSize={5} strokeWidth={2}
                                enableGrid enablePoints enableArea={false} showLegend legendPosition="top"
                                headerBgColor="#ffffff" className="border-0 shadow-sm h-100"
                            />
                        </Col>
                        <Col lg={4}>
                            <DonutChartCard
                                title={t('reproduction.section.qualityDistribution')}
                                data={(data.maleStats.qualityDistribution || []).map((q: any) => ({ id: q.qualityLabel, label: q.qualityLabel, value: q.count }))}
                                legendItems={(data.maleStats.qualityDistribution || []).map((q: any) => ({ label: q.qualityLabel, value: `${q.count}`, percentage: `${q.percentage}%` }))}
                                className="h-100 border-0 shadow-sm" headerBgColor="#ffffff"
                            />
                        </Col>
                    </Row>

                    <Card className="border-0 shadow-sm mb-3">
                        <CardHeader className="bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                            <h6 className="mb-0 fw-bold text-dark"><RiServiceLine className="me-2 text-primary" />{t('reproduction.section.servedFemales')}</h6>
                            <Badge color="light" className="text-dark border fw-normal">{t('reproduction.section.totalOffspring')} <strong>{data.maleStats.totalOffspring}</strong></Badge>
                        </CardHeader>
                        <CardBody className="p-0">
                            {data.maleStats.servedFemales?.length > 0
                                ? <CustomTable columns={servedFemalesColumns} data={data.maleStats.servedFemales} showPagination rowsPerPage={5} showSearchAndFilter={false} className="fs-6" />
                                : <div className="p-4 text-center text-muted">{t('reproduction.section.noFemales')}</div>
                            }
                        </CardBody>
                    </Card>
                </>
            )}

            {/* Historial reproductivo */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="bg-white border-bottom py-3">
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                        <h6 className="mb-0 fw-bold text-dark"><RiHeartPulseLine className="me-2" style={{ color: '#ec4899' }} />{t('reproduction.section.reproductiveHistory')}</h6>
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
                            <Label className="form-label small text-muted mb-1"><RiFilter3Line className="me-1" />{t('reproduction.filter.from')}</Label>
                            <DatePicker className="form-control form-control-sm" placeholder={t('reproduction.filter.selectDate')} value={historyFilters.start_date || undefined} options={{ dateFormat: 'Y-m-d', allowInput: true }} onChange={(dates: Date[]) => { const val = dates[0] ? dates[0].toISOString().slice(0, 10) : ''; setHistoryFilters({ ...historyFilters, start_date: val }); }} />
                        </Col>
                        <Col md={3}>
                            <Label className="form-label small text-muted mb-1">{t('reproduction.filter.to')}</Label>
                            <DatePicker className="form-control form-control-sm" placeholder={t('reproduction.filter.selectDate')} value={historyFilters.end_date || undefined} options={{ dateFormat: 'Y-m-d', allowInput: true }} onChange={(dates: Date[]) => { const val = dates[0] ? dates[0].toISOString().slice(0, 10) : ''; setHistoryFilters({ ...historyFilters, end_date: val }); }} />
                        </Col>
                        <Col md={3}>
                            <Label className="form-label small text-muted mb-1">{t('reproduction.filter.type')}</Label>
                            <Input type="select" bsSize="sm" value={historyFilters.type} onChange={(e) => setHistoryFilters({ ...historyFilters, type: e.target.value })}>
                                <option value="">{t('reproduction.filter.all')}</option>
                                {Object.entries(reproductionTypeConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                            </Input>
                        </Col>
                        <Col md={3}>
                            <Button size="sm" color="light" className="border" onClick={() => setHistoryFilters({ start_date: '', end_date: '', type: '' })}>{t('reproduction.filter.clear')}</Button>
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
                                        <div className="position-absolute rounded-circle d-flex align-items-center justify-content-center" style={{ width: 22, height: 22, left: -9, top: 2, background: cfg.color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${cfg.color}33` }}>
                                            <Icon size={12} color="#fff" />
                                        </div>
                                        <div className="ms-4 ps-2">
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <span className="fw-semibold text-dark">{cfg.label}</span>
                                                <span className="text-muted small">·</span>
                                                <span className="text-muted small">{formatDate(event.date)}</span>
                                            </div>
                                            <div className="text-muted small mb-1">Por <strong className="text-dark">{event.user.name} {event.user.lastname}</strong></div>
                                            {renderReproductionDetails(event)}
                                            {event.observations && <div className="text-muted small fst-italic mt-1">"{event.observations}"</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-muted py-4">
                            <RiHeartPulseLine size={36} className="mb-2 opacity-50" />
                            <div>{t('reproduction.section.noEvents')}</div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </>
    );
};

export default PigReproductionDetails;
