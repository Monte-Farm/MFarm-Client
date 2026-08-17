import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Badge,
    Col,
    Modal,
    ModalBody,
    ModalHeader,
    Row,
    Table,
} from 'reactstrap';
import { AdjustmentDirection, AdjustmentStatus, AdjustmentType, InventoryAdjustment } from 'common/data_interfaces';

interface InventoryAdjustmentDetailProps {
    isOpen: boolean;
    onClose: () => void;
    adjustment: InventoryAdjustment | null;
}

const directionColor: Record<AdjustmentDirection, string> = {
    decrease: 'danger',
    increase: 'success',
};

const directionIcon: Record<AdjustmentDirection, string> = {
    decrease: 'ri-arrow-down-circle-fill',
    increase: 'ri-arrow-up-circle-fill',
};

const statusColor: Record<AdjustmentStatus, string> = {
    active: 'success',
    reverted: 'secondary',
};

const formatDate = (iso: string | null | undefined): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatDateShort = (iso: string | null | undefined): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const getProductName = (productId: any): string => {
    if (typeof productId === 'object' && productId !== null) return productId.name || '—';
    return productId || '—';
};

const getProductUnit = (productId: any): string => {
    if (typeof productId === 'object' && productId !== null) return productId.unit || '';
    return '';
};

const getWarehouseName = (warehouseId: any): string => {
    if (typeof warehouseId === 'object' && warehouseId !== null) {
        const { code, name } = warehouseId;
        return code ? `[${code}] ${name}` : name || '—';
    }
    return warehouseId || '—';
};

const getCreatedByName = (createdBy: any): string => {
    if (typeof createdBy === 'object' && createdBy !== null) return createdBy.name || '—';
    return '—';
};

const getRevertedByName = (revertedBy: any): string => {
    if (typeof revertedBy === 'object' && revertedBy !== null) return (revertedBy as any).name || '—';
    return '—';
};

const InventoryAdjustmentDetail: React.FC<InventoryAdjustmentDetailProps> = ({
    isOpen,
    onClose,
    adjustment,
}) => {
    const { t } = useTranslation();

    if (!adjustment) return null;

    const sign = adjustment.direction === 'decrease' ? '-' : '+';
    const impactColor = adjustment.direction === 'decrease' ? '#dc3545' : '#198754';
    const dirIcon = directionIcon[adjustment.direction];

    const totalProducts = adjustment.products.reduce(
        (acc, p) => acc + p.adjustedQuantity,
        0
    );

    return (
        <Modal size="lg" isOpen={isOpen} toggle={onClose} backdrop="static" keyboard={false} centered>
            <ModalHeader toggle={onClose}>
                <div className="d-flex align-items-center gap-2">
                    <i className={`${dirIcon} fs-5`} style={{ color: adjustment.direction === 'decrease' ? '#dc3545' : '#198754' }} />
                    {t('inventoryAdjustments.detail.title')}
                </div>
            </ModalHeader>
            <ModalBody>
                {/* ── Badges de estado ── */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                    <Badge color={directionColor[adjustment.direction]} className="px-3 py-2 fs-6">
                        <i className={`${dirIcon} me-1`} />
                        {t(`inventoryAdjustments.direction.${adjustment.direction}`)}
                    </Badge>
                    <Badge color={statusColor[adjustment.status]} className="px-3 py-2 fs-6">
                        {t(`inventoryAdjustments.status.${adjustment.status}`)}
                    </Badge>
                    <Badge color="light" className="text-dark px-3 py-2 fs-6 border">
                        {t(`inventoryAdjustments.adjustmentType.${adjustment.adjustmentType as AdjustmentType}`)}
                    </Badge>
                </div>

                {/* ── KPI: Impacto financiero ── */}
                <div
                    className="rounded-3 p-3 mb-4 text-center"
                    style={{
                        background: adjustment.direction === 'decrease' ? '#fff5f5' : '#f0fff4',
                        border: `1.5px solid ${impactColor}`,
                    }}
                >
                    <div className="text-muted small mb-1">
                        {t('inventoryAdjustments.detail.financialImpact')}
                    </div>
                    <div className="fw-bold" style={{ fontSize: '2rem', color: impactColor }}>
                        {sign}${Math.abs(adjustment.totalFinancialImpact).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                    <div className="text-muted small mt-1">
                        {adjustment.direction === 'decrease'
                            ? t('inventoryAdjustments.detail.impactHintDecrease')
                            : t('inventoryAdjustments.detail.impactHintIncrease')}
                    </div>
                </div>

                {/* ── Info general ── */}
                <Row className="g-3 mb-4">
                    <Col xs={6} md={4}>
                        <div className="text-muted small mb-1">{t('inventoryAdjustments.detail.field.date')}</div>
                        <div className="fw-semibold">{formatDateShort(adjustment.date)}</div>
                    </Col>
                    <Col xs={6} md={4}>
                        <div className="text-muted small mb-1">{t('inventoryAdjustments.detail.field.warehouse')}</div>
                        <div className="fw-semibold">{getWarehouseName(adjustment.warehouseId)}</div>
                    </Col>
                    <Col xs={6} md={4}>
                        <div className="text-muted small mb-1">{t('inventoryAdjustments.detail.field.createdBy')}</div>
                        <div className="fw-semibold">{getCreatedByName(adjustment.createdBy)}</div>
                    </Col>
                    <Col xs={6} md={4}>
                        <div className="text-muted small mb-1">{t('inventoryAdjustments.detail.field.createdAt')}</div>
                        <div className="fw-semibold">{formatDate(adjustment.createdAt)}</div>
                    </Col>
                    <Col xs={6} md={4}>
                        <div className="text-muted small mb-1">{t('inventoryAdjustments.detail.field.products')}</div>
                        <div className="fw-semibold">
                            {adjustment.products.length} {t('inventoryAdjustments.detail.field.productsCount')}
                        </div>
                    </Col>
                    <Col xs={6} md={4}>
                        <div className="text-muted small mb-1">{t('inventoryAdjustments.detail.field.totalQty')}</div>
                        <div className="fw-semibold">{totalProducts.toFixed(2)}</div>
                    </Col>
                </Row>

                {/* ── Motivo ── */}
                <div className="mb-4 p-3 rounded" style={{ background: '#f8f9fa', borderLeft: '4px solid #dee2e6' }}>
                    <div className="text-muted small mb-1 fw-semibold">{t('inventoryAdjustments.detail.field.reason')}</div>
                    <div>{adjustment.reason}</div>
                </div>

                {/* ── Productos ── */}
                <div className="mb-4">
                    <div className="fw-semibold mb-2">{t('inventoryAdjustments.detail.productsTitle')}</div>
                    <Table bordered size="sm" responsive className="mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>{t('inventoryAdjustments.detail.col.product')}</th>
                                <th className="text-end">{t('inventoryAdjustments.detail.col.quantity')}</th>
                                <th className="text-end">{t('inventoryAdjustments.detail.col.unitCost')}</th>
                                <th className="text-end">{t('inventoryAdjustments.detail.col.totalCost')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adjustment.products.map((p, idx) => (
                                <tr key={idx}>
                                    <td>{getProductName(p.productId)}</td>
                                    <td className="text-end">
                                        {p.adjustedQuantity.toFixed(2)} {getProductUnit(p.productId)}
                                    </td>
                                    <td className="text-end">
                                        {p.unitCost != null
                                            ? `$${p.unitCost.toFixed(2)}`
                                            : '—'}
                                    </td>
                                    <td className="text-end fw-semibold">
                                        {p.totalCost != null
                                            ? `$${p.totalCost.toFixed(2)}`
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="table-light">
                            <tr>
                                <td colSpan={3} className="text-end fw-bold">
                                    {t('inventoryAdjustments.detail.col.total')}
                                </td>
                                <td className="text-end fw-bold" style={{ color: impactColor }}>
                                    {sign}${Math.abs(adjustment.totalFinancialImpact).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>

                {/* ── Notas ── */}
                {adjustment.notes && (
                    <div className="mb-4 p-3 rounded" style={{ background: '#f8f9fa' }}>
                        <div className="text-muted small mb-1 fw-semibold">{t('inventoryAdjustments.detail.field.notes')}</div>
                        <div className="small">{adjustment.notes}</div>
                    </div>
                )}

                {/* ── Info reversión ── */}
                {adjustment.status === 'reverted' && (
                    <div className="p-3 rounded" style={{ background: '#fff8e1', border: '1px solid #ffc107' }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <i className="ri-arrow-go-back-line text-warning fs-5" />
                            <span className="fw-semibold">{t('inventoryAdjustments.detail.revertSection')}</span>
                        </div>
                        <Row className="g-2">
                            <Col xs={6}>
                                <div className="text-muted small">{t('inventoryAdjustments.detail.field.revertedAt')}</div>
                                <div className="fw-semibold small">{formatDate(adjustment.revertedAt)}</div>
                            </Col>
                            <Col xs={6}>
                                <div className="text-muted small">{t('inventoryAdjustments.detail.field.revertedBy')}</div>
                                <div className="fw-semibold small">{getRevertedByName(adjustment.revertedBy)}</div>
                            </Col>
                            {adjustment.revertReason && (
                                <Col xs={12}>
                                    <div className="text-muted small">{t('inventoryAdjustments.detail.field.revertReason')}</div>
                                    <div className="small">{adjustment.revertReason}</div>
                                </Col>
                            )}
                        </Row>
                    </div>
                )}
            </ModalBody>
        </Modal>
    );
};

export default InventoryAdjustmentDetail;
