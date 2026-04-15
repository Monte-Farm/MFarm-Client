import { useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Col, Input, Label, Row } from "reactstrap";
import DatePicker from "react-flatpickr";
import {
    RiAddCircleLine, RiArrowLeftRightLine, RiCheckboxCircleLine, RiCloseCircleLine,
    RiExchangeLine, RiFilter3Line, RiHistoryLine, RiRefreshLine, RiShoppingCartLine,
    RiSkullLine, RiUploadLine
} from "react-icons/ri";
import { IconType } from "react-icons";

export interface GroupHistoryItem {
    date: string;
    userId?: any;
    action: string;
    description: string;
}

interface ActionConfig {
    color: string;
    label: string;
    icon: IconType;
}

const actionConfig: Record<string, ActionConfig> = {
    created: { color: '#10b981', label: 'Creación', icon: RiAddCircleLine },
    add: { color: '#3b82f6', label: 'Ingreso', icon: RiCheckboxCircleLine },
    withdraw: { color: '#ef4444', label: 'Retiro', icon: RiUploadLine },
    transfer: { color: '#f59e0b', label: 'Transferencia', icon: RiArrowLeftRightLine },
    death: { color: '#1f2937', label: 'Muerte', icon: RiSkullLine },
    discard: { color: '#dc2626', label: 'Descarte', icon: RiCloseCircleLine },
    stage_change: { color: '#8b5cf6', label: 'Cambio de etapa', icon: RiExchangeLine },
    replacement: { color: '#0ea5e9', label: 'Reemplazo', icon: RiRefreshLine },
    sale: { color: '#059669', label: 'Venta', icon: RiShoppingCartLine },
    partial_sale: { color: '#0891b2', label: 'Venta parcial', icon: RiShoppingCartLine },
    sold: { color: '#059669', label: 'Vendido', icon: RiShoppingCartLine },
};

const translateDescription = (item: GroupHistoryItem): string => {
    const desc = item.description || '';

    // Venta parcial: "X pig(s) sold from group. Remaining: Y"
    const partialSaleMatch = desc.match(/(\d+)\s*pig\(s\)\s*sold from group\.\s*Remaining:\s*(\d+)/i);
    if (partialSaleMatch) {
        return `${partialSaleMatch[1]} cerdo(s) vendido(s) del grupo. Restantes: ${partialSaleMatch[2]}`;
    }

    // Creación: "Grupo X-0001 creado" ya está en español
    if (/creado|creación/i.test(desc)) return desc;

    // Traducciones genéricas
    const replacements: Array<[RegExp, string]> = [
        [/\bsold\b/gi, 'vendidos'],
        [/\bfrom group\b/gi, 'del grupo'],
        [/\bfrom\b/gi, 'de'],
        [/\bto\b/gi, 'a'],
        [/\bremaining\b/gi, 'restantes'],
        [/\btransferred\b/gi, 'transferido(s)'],
        [/\bwithdrawn\b/gi, 'retirado(s)'],
        [/\badded\b/gi, 'agregado(s)'],
        [/\bdied\b/gi, 'muerto(s)'],
        [/\bdiscarded\b/gi, 'descartado(s)'],
        [/\bpig\(s\)\b/gi, 'cerdo(s)'],
        [/\bpigs\b/gi, 'cerdos'],
        [/\bpig\b/gi, 'cerdo'],
        [/\bgroup\b/gi, 'grupo'],
    ];

    let translated = desc;
    for (const [regex, replacement] of replacements) {
        translated = translated.replace(regex, replacement);
    }
    return translated;
};

interface Props {
    data: GroupHistoryItem[];
}

const GroupHistoryTimeline: React.FC<Props> = ({ data }) => {
    const [filters, setFilters] = useState({ start_date: '', end_date: '', action: '', user: '' });

    const sortedData = useMemo(
        () => [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [data]
    );

    const users = useMemo(() => {
        const unique = new Map<string, { id: string; name: string }>();
        sortedData.forEach((item) => {
            if (item.userId?._id) {
                unique.set(item.userId._id, {
                    id: item.userId._id,
                    name: `${item.userId.name} ${item.userId.lastname}`,
                });
            }
        });
        return Array.from(unique.values());
    }, [sortedData]);

    const filtered = useMemo(() => {
        return sortedData.filter((item) => {
            if (filters.action && item.action !== filters.action) return false;
            if (filters.user && item.userId?._id !== filters.user) return false;
            if (filters.start_date && new Date(item.date) < new Date(filters.start_date)) return false;
            if (filters.end_date && new Date(item.date) > new Date(filters.end_date)) return false;
            return true;
        });
    }, [sortedData, filters]);

    const countByAction = useMemo(() => {
        const counts: Record<string, number> = {};
        sortedData.forEach((item) => { counts[item.action] = (counts[item.action] || 0) + 1; });
        return Object.entries(counts).map(([action, count]) => ({ action, count }));
    }, [sortedData]);

    const availableActions = useMemo(() => {
        const set = new Set<string>();
        sortedData.forEach((item) => set.add(item.action));
        return Array.from(set);
    }, [sortedData]);

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
            d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white border-bottom py-3">
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <h6 className="mb-0 fw-bold text-dark">
                        <RiHistoryLine className="me-2 text-primary" />
                        Historial del Grupo
                    </h6>
                    {countByAction.length > 0 && (
                        <div className="d-flex gap-2 flex-wrap">
                            {countByAction.map(({ action, count }) => {
                                const cfg = actionConfig[action] || { color: '#64748b', label: action };
                                return (
                                    <Badge key={action} color="light" className="text-dark border fw-normal">
                                        <span className="rounded-circle d-inline-block me-2" style={{ width: 8, height: 8, background: cfg.color }} />
                                        {cfg.label}: <strong>{count}</strong>
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
                            value={filters.start_date || undefined}
                            options={{ dateFormat: 'Y-m-d', allowInput: true }}
                            onChange={(dates: Date[]) => {
                                const val = dates[0] ? dates[0].toISOString().slice(0, 10) : '';
                                setFilters({ ...filters, start_date: val });
                            }}
                        />
                    </Col>
                    <Col md={3}>
                        <Label className="form-label small text-muted mb-1">Hasta</Label>
                        <DatePicker
                            className="form-control form-control-sm"
                            placeholder="Seleccione fecha"
                            value={filters.end_date || undefined}
                            options={{ dateFormat: 'Y-m-d', allowInput: true }}
                            onChange={(dates: Date[]) => {
                                const val = dates[0] ? dates[0].toISOString().slice(0, 10) : '';
                                setFilters({ ...filters, end_date: val });
                            }}
                        />
                    </Col>
                    <Col md={2}>
                        <Label className="form-label small text-muted mb-1">Tipo</Label>
                        <Input
                            type="select"
                            bsSize="sm"
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                        >
                            <option value="">Todos</option>
                            {availableActions.map((a) => (
                                <option key={a} value={a}>{actionConfig[a]?.label || a}</option>
                            ))}
                        </Input>
                    </Col>
                    <Col md={2}>
                        <Label className="form-label small text-muted mb-1">Usuario</Label>
                        <Input
                            type="select"
                            bsSize="sm"
                            value={filters.user}
                            onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                        >
                            <option value="">Todos</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </Input>
                    </Col>
                    <Col md={2}>
                        <Button
                            size="sm"
                            color="light"
                            className="border w-100"
                            onClick={() => setFilters({ start_date: '', end_date: '', action: '', user: '' })}
                        >
                            Limpiar filtros
                        </Button>
                    </Col>
                </Row>
            </CardHeader>
            <CardBody>
                {filtered.length > 0 ? (
                    <div className="position-relative ps-4">
                        <div className="position-absolute" style={{ left: 10, top: 8, bottom: 8, width: 2, background: '#e9ecef' }} />
                        {filtered.map((item, idx) => {
                            const cfg = actionConfig[item.action] || { color: '#64748b', label: item.action, icon: RiHistoryLine };
                            const Icon = cfg.icon;
                            return (
                                <div key={idx} className="position-relative mb-3 pb-2" style={{ marginLeft: -6 }}>
                                    <div
                                        className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: 22, height: 22, left: -9, top: 2, background: cfg.color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${cfg.color}33` }}
                                    >
                                        <Icon size={12} color="#fff" />
                                    </div>
                                    <div className="ms-4 ps-2">
                                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                            <Badge color="light" className="fw-normal text-dark border" style={{ background: `${cfg.color}15` }}>
                                                <span style={{ color: cfg.color }}>{cfg.label}</span>
                                            </Badge>
                                            <span className="text-muted small">·</span>
                                            <span className="text-muted small">{formatDate(item.date)}</span>
                                        </div>
                                        <div className="fw-semibold text-dark mb-1">{translateDescription(item)}</div>
                                        {item.userId?.name && (
                                            <div className="text-muted small">
                                                Por <strong className="text-dark">{item.userId.name} {item.userId.lastname}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-muted py-5">
                        <RiHistoryLine size={36} className="mb-2 opacity-50" />
                        <div>Sin eventos registrados</div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default GroupHistoryTimeline;
