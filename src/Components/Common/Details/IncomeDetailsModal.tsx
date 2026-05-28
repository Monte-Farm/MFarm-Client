import { logger } from 'utils/logger';
import { appendLangParam } from 'helpers/reports_url_helper';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import ObjectDetails from "./ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import PDFViewer from "../Shared/PDFViewer";
import AlertMessage from "../Shared/AlertMesagge";
import ConfirmModal from "../Shared/ConfirmModal";
import MissingStockModal from "../Shared/MissingStockModal";
import { getApprovalErrorMessage } from "helpers/income_error_helper";
import { useNavigate } from "react-router-dom";
import { Attribute } from "common/data_interfaces";
import { useTranslation } from "react-i18next";

const approvalStatusColor: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    released: 'info',
};

interface IncomeDetailsProps {
    incomeId: string;
    onApproveOrRelease?: () => void;
}

const IncomeDetails: React.FC<IncomeDetailsProps> = ({ incomeId, onApproveOrRelease }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; action: 'approve' | 'release' | 'cancel' | null }>({ open: false, action: null });
    const [missingStockModal, setMissingStockModal] = useState<{ open: boolean; items: Array<{ product: string; required: number; available: number }> }>({ open: false, items: [] });
    const [modals, setModals] = useState({ viewPDF: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [fileURL, setFileURL] = useState<string>('')
    const [incomeDetails, setIncomeDetails] = useState<any>({});
    const [products, setProducts] = useState<any[]>([])

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const productsColumns: Column<any>[] = [
        {
            header: t('common.field.code'),
            accessor: 'id',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row?.id?.id}</span>
        },
        {
            header: t('common.field.name', { defaultValue: 'Producto' }),
            accessor: 'id',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row?.id?.name}</span>
        },
        {
            header: t('common.field.qty', { defaultValue: 'Cantidad' }),
            accessor: 'quantity',
            isFilterable: true,
            type: 'number',
            render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>
        },
        { header: t('common.field.unitPrice', { defaultValue: 'Precio Unitario' }), accessor: 'price', type: 'currency' },
        {
            header: t('common.field.totalPrice', { defaultValue: 'Precio Total' }),
            accessor: 'totalPrice',
            type: 'text',
            render: (_, row) => {
                const totalPrice = (row.quantity || 0) * (row.price || 0);
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                }).format(totalPrice);
            }
        },
        {
            header: t('warehouse.products.attr.category', { defaultValue: 'Categoria' }),
            accessor: 'category',
            isFilterable: true,
            type: 'text',
            render: (_, row) => {
                let color = "secondary";

                switch (row.id.category) {
                    case "nutrition":
                        color = "info";
                        break;
                    case "medications":
                        color = "warning";
                        break;
                    case "vaccines":
                        color = "primary";
                        break;
                    case "vitamins":
                    case "minerals":
                    case "supplies":
                    case "hygiene_cleaning":
                    case "equipment_tools":
                    case "spare_parts":
                    case "office_supplies":
                    case "others":
                        color = "success";
                        break;
                }

                return <Badge color={color}>{t(`warehouse.common.productCategory.${row.id.category}`, { defaultValue: row.id.category })}</Badge>;
            },
        },
    ];

    const incomeAttributes: Attribute[] = [
        { key: 'id', label: t('common.field.code'), type: 'text' },
        { key: 'date', label: t('common.field.date', { defaultValue: 'Fecha de Registro' }), type: 'date' },
        { key: 'emissionDate', label: t('warehouse.incomeForm.attr.emissionDate', { defaultValue: 'Fecha de Emisión' }), type: 'date' },
        { key: 'warehouse.name', label: t('warehouse.orderDetails.attr.destWarehouse', { defaultValue: 'Almacén' }), type: 'text', },
        { key: 'origin.id.name', label: t('warehouse.suppliers.col.supplier', { defaultValue: 'Proveedor' }), type: 'text', },
        {
            key: 'incomeType',
            label: t('warehouse.incomeForm.attr.incomeType', { defaultValue: 'Tipo de Entrada' }),
            type: 'text',
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case "internal_transfer":
                        color = "info";
                        break;
                    case "purchase":
                        color = "warning";
                        break;
                    case "warehouse_order":
                        color = "warning";
                        break;
                }

                return <Badge color={color}>{t(`warehouse.common.incomeType.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        {
            key: 'approvalStatus',
            label: t('finance.income.column.approvalStatus'),
            type: 'text',
            render: (value: string) => {
                const status = value ?? 'pending';
                const color = approvalStatusColor[status] || 'secondary';
                return <Badge color={color}>{t(`finance.income.approvalStatus.${status}`, { defaultValue: status })}</Badge>;
            },
        },
    ]

    const financialAttributes: Attribute[] = [
        { key: 'totalPrice', label: t('common.field.totalPrice', { defaultValue: 'Total' }), type: 'currency' },
        {
            key: 'tax',
            label: t('warehouse.incomeForm.attr.tax', { defaultValue: 'Impuesto' }),
            type: 'text',
            render: (value: number) => `${value}%`
        },
        {
            key: 'discount',
            label: t('warehouse.incomeForm.attr.discount', { defaultValue: 'Descuento' }),
            type: 'text',
            render: (value: number) => `${value}%`
        },
        { key: 'currency', label: t('warehouse.incomeDetailsModal.attr.currency', { defaultValue: 'Moneda' }), type: 'text' },
        { key: 'invoiceNumber', label: t('warehouse.incomeForm.attr.invoiceNumber', { defaultValue: 'Número de Factura' }), type: 'text' },
        { key: 'fiscalRecord', label: t('warehouse.incomeForm.attr.fiscalRecord', { defaultValue: 'Registro Fiscal' }), type: 'text' },
    ]

    const purchaseOrderAttributes: Attribute[] = [
        { key: 'code', label: t('warehouse.purchaseOrders.col.orderNumber', { defaultValue: 'Código de Orden' }), type: 'text' },
        { key: 'date', label: t('common.field.date', { defaultValue: 'Fecha de Orden' }), type: 'date' },
        {
            key: 'status',
            label: t('common.field.status'),
            type: 'text',
            render: (value: boolean) => (
                <Badge color={value ? 'success' : 'warning'}>
                    {value
                        ? t('warehouse.incomeDetailsModal.purchaseOrder.completed', { defaultValue: 'Completada' })
                        : t('warehouse.incomeDetailsModal.purchaseOrder.pending', { defaultValue: 'Pendiente' })}
                </Badge>
            ),
        },
    ]

    const handleApprove = () => setConfirmModal({ open: true, action: 'approve' });

    const handleRelease = () => setConfirmModal({ open: true, action: 'release' });

    const handleCancel = () => setConfirmModal({ open: true, action: 'cancel' });

    const handleConfirmAction = async () => {
        if (!configContext || !confirmModal.action) return;
        try {
            setActionLoading(true);
            if (confirmModal.action === 'cancel') {
                await configContext.axiosHelper.update(`${configContext.apiUrl}/incomes/cancel/${incomeId}`, {});
                setAlertConfig({ visible: true, color: 'success', message: t('finance.income.success.cancelled') });
                await fetchData();
                onApproveOrRelease?.();
            } else {
                const endpoint = confirmModal.action === 'approve'
                    ? `${configContext.apiUrl}/incomes/approve/${incomeId}`
                    : `${configContext.apiUrl}/incomes/release/${incomeId}`;
                await configContext.axiosHelper.update(endpoint, {});
                setAlertConfig({
                    visible: true,
                    color: 'success',
                    message: confirmModal.action === 'approve'
                        ? t('finance.income.success.approved')
                        : t('finance.income.success.released'),
                });
                await fetchData();
                onApproveOrRelease?.();
            }
        } catch (error: any) {
            if (confirmModal.action === 'cancel' && error?.response?.data?.missing) {
                const missing = error.response.data.missing as Array<{ id: string; required: number; available: number }>;
                const items = missing.map((item) => ({
                    product: products.find((p: any) => p.id?._id === item.id)?.id?.name ?? item.id,
                    required: item.required,
                    available: item.available,
                }));
                setMissingStockModal({ open: true, items });
            } else {
                setAlertConfig({
                    visible: true,
                    color: 'danger',
                    message: confirmModal.action === 'cancel'
                        ? t('finance.income.error.cancel')
                        : getApprovalErrorMessage(error, confirmModal.action as 'approve' | 'release', t),
                });
            }
        } finally {
            setActionLoading(false);
            setConfirmModal({ open: false, action: null });
        }
    };

    const fetchData = async () => {
        if (!configContext || !userLogged) return;

        try {
            setLoading(true)
            const incomeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_incomes_id/${incomeId}`);
            const incomeDetailsResponse = incomeResponse.data.data;
            setIncomeDetails(incomeDetailsResponse)
            setProducts(incomeDetailsResponse.products)
        } catch (error) {
            logger.error('Error fetching data: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.incomeDetailsModal.error.fetch') })
        } finally {
            setLoading(false)
        }
    };

    const handlePrintIncome = async () => {
        if (!configContext) return;

        try {
            setPdfLoading(true);

            // Usar axiosHelper.getBlob para mantener consistencia
            const response = await configContext.axiosHelper.getBlob(appendLangParam(`${configContext.apiUrl}/reports/incomes/${incomeId}`));

            // Crear blob con tipo MIME explícito para PDF
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            // Debug: Verificar la URL creada
            logger.log('PDF URL created:', url);

            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating report: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.incomeDetailsModal.error.pdf') })
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    const approvalStatus = incomeDetails?.approvalStatus ?? 'pending';
    const isCancelled = incomeDetails?.cancelled === true;
    const canManage = (userLogged?.role ?? []).includes('farm_manager') || (userLogged?.role ?? []).includes('finance_manager');

    return (
        <>
            {isCancelled && (
                <div
                    className="d-flex align-items-center gap-3 mb-4 px-4 py-3 rounded-3 text-white"
                    style={{ background: '#b91c1c' }}
                >
                    <i className="ri-close-circle-fill fs-3" />
                    <div>
                        <div className="fw-bold fs-5">{t('finance.income.status.cancelled')}</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                            {t('finance.income.cancelledNote', { defaultValue: 'Esta entrada fue cancelada. El impacto en el inventario ha sido revertido.' })}
                        </div>
                    </div>
                </div>
            )}
            <div className="d-flex gap-2 mb-4 flex-wrap align-items-center">
                <Button
                    color="primary"
                    className="btn-pdf"
                    onClick={handlePrintIncome}
                    disabled={pdfLoading}
                >
                    {pdfLoading ? (
                        <>
                            <Spinner className="me-2" size='sm' />
                            {t('warehouse.incomeDetailsModal.generatingPdf', { defaultValue: 'Generando PDF' })}
                        </>
                    ) : (
                        <>
                            <i className="ri-file-pdf-line me-2"></i>
                            {t('warehouse.incomeDetailsModal.viewPdf', { defaultValue: 'Ver PDF' })}
                        </>
                    )}
                </Button>
                {canManage && approvalStatus !== 'approved' && !isCancelled && (
                    <Button color="success" onClick={handleApprove} disabled={actionLoading}>
                        {actionLoading ? <Spinner size="sm" className="me-2" /> : <i className="ri-check-double-line me-2" />}
                        {t('finance.income.action.approve')}
                    </Button>
                )}
                {canManage && approvalStatus === 'approved' && !isCancelled && (
                    <Button color="info" onClick={handleRelease} disabled={actionLoading}>
                        {actionLoading ? <Spinner size="sm" className="me-2" /> : <i className="ri-lock-unlock-line me-2" />}
                        {t('finance.income.action.release')}
                    </Button>
                )}
                {!isCancelled && approvalStatus === 'pending' && (
                    <Button color="danger" onClick={handleCancel} disabled={actionLoading}>
                        {actionLoading ? <Spinner size="sm" className="me-2" /> : <i className="ri-close-circle-line me-2" />}
                        {t('finance.income.action.cancel')}
                    </Button>
                )}
            </div>
            <div className="d-flex flex-column gap-3">
                <div className="d-flex gap-3">
                    <Card>
                        <CardHeader className='bg-gradient bg-primary-subtle'>
                            <h5 className="mb-0 text-primary">{t('warehouse.incomeDetailsModal.section.generalInfo', { defaultValue: 'Información General' })}</h5>
                        </CardHeader>
                        <CardBody className="pt-4">
                            <ObjectDetails attributes={incomeAttributes} object={incomeDetails} />
                        </CardBody>
                    </Card>

                    <Card className="flex-fill">
                        <CardHeader className='bg-gradient bg-success-subtle'>
                            <h5 className="mb-0 text-success">{t('warehouse.incomeDetailsModal.section.financialDetails', { defaultValue: 'Detalles Financieros' })}</h5>
                        </CardHeader>
                        <CardBody className="pt-4">
                            <ObjectDetails attributes={financialAttributes} object={incomeDetails} />
                        </CardBody>
                    </Card>

                    {incomeDetails.purchaseOrder && (
                        <Card>
                            <CardHeader className='bg-gradient bg-info-subtle'>
                                <h5 className="mb-0 text-info">{t('warehouse.incomeDetailsModal.section.purchaseOrder', { defaultValue: 'Orden de Compra' })}</h5>
                            </CardHeader>
                            <CardBody className="pt-4">
                                <ObjectDetails attributes={purchaseOrderAttributes} object={incomeDetails.purchaseOrder} />
                            </CardBody>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader className='bg-gradient bg-secondary-subtle'>
                        <h5 className="mb-0 text-secondary">{t('warehouse.incomeDetailsModal.section.products', { defaultValue: 'Productos de la Entrada' })}</h5>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable columns={productsColumns} data={products} showPagination={true} rowsPerPage={5} showSearchAndFilter={false} />
                    </CardBody>
                </Card>

                {/* Quinta fila: Documentos (si existen) */}
                {incomeDetails.documents && incomeDetails.documents.length > 0 && (
                    <Card>
                        <CardHeader className='bg-gradient bg-dark-subtle'>
                            <h5 className="mb-0 text-dark">{t('warehouse.incomeDetailsModal.section.documents', { defaultValue: 'Documentos Adjuntos' })}</h5>
                        </CardHeader>
                        <CardBody>
                            <div className="d-flex flex-wrap gap-2">
                                {incomeDetails.documents.map((doc: any, index: number) => (
                                    <Badge key={index} color="info" className="p-2">
                                        <i className="ri-file-line me-1"></i>
                                        {doc.name || `${t('warehouse.incomeDetailsModal.document', { defaultValue: 'Documento' })} ${index + 1}`}
                                    </Badge>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.incomeDetailsModal.pdfModal.title', { defaultValue: 'Reporte de entrada' })}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <ConfirmModal
                isOpen={confirmModal.open}
                title={
                    confirmModal.action === 'approve' ? t('finance.income.confirm.approveTitle') :
                    confirmModal.action === 'cancel' ? t('finance.income.confirm.cancelTitle') :
                    t('finance.income.confirm.releaseTitle')
                }
                message={
                    confirmModal.action === 'approve' ? t('finance.income.confirm.approveMessage') :
                    confirmModal.action === 'cancel' ? t('finance.income.confirm.cancelMessage') :
                    t('finance.income.confirm.releaseMessage')
                }
                confirmLabel={
                    confirmModal.action === 'approve' ? t('finance.income.action.approve') :
                    confirmModal.action === 'cancel' ? t('finance.income.action.cancel') :
                    t('finance.income.action.release')
                }
                cancelLabel={t('common.button.cancel')}
                confirmColor={
                    confirmModal.action === 'approve' ? 'success' :
                    confirmModal.action === 'cancel' ? 'danger' :
                    'info'
                }
                loading={actionLoading}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmModal({ open: false, action: null })}
            />

            <MissingStockModal
                isOpen={missingStockModal.open}
                onClose={() => setMissingStockModal({ open: false, items: [] })}
                missingItems={missingStockModal.items}
            />

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default IncomeDetails;
