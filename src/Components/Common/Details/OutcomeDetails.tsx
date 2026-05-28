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
import { useNavigate } from "react-router-dom";
import { Attribute } from "common/data_interfaces";
import { useTranslation } from "react-i18next";

interface OutcomeDetailsProps {
    outcomeId: string;
    onCancelled?: () => void;
}

const OutcomeDetails: React.FC<OutcomeDetailsProps> = ({ outcomeId, onCancelled }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const [missingStockModal, setMissingStockModal] = useState<{ open: boolean; items: Array<{ product: string; required: number; available: number }> }>({ open: false, items: [] });
    const [modals, setModals] = useState({ viewPDF: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [fileURL, setFileURL] = useState<string>('')
    const [outcomeDetails, setOutcomeDetails] = useState<any>({});
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

    const outcomeAttributes: Attribute[] = [
        { key: 'code', label: t('common.field.code'), type: 'text' },
        { key: 'date', label: t('common.field.date'), type: 'date' },
        { key: 'warehouseOrigin.name', label: t('warehouse.outcomeDetails.attr.warehouseOrigin', { defaultValue: 'Almacén Origen' }), type: 'text' },
        { key: 'warehouseDestiny.name', label: t('warehouse.outcomeDetails.attr.warehouseDestiny', { defaultValue: 'Almacén Destino' }), type: 'text' },
        { key: 'description', label: t('warehouse.outcomeForm.attr.description', { defaultValue: 'Descripción' }), type: 'text' },
        {
            key: 'outcomeType',
            label: t('warehouse.outcomeDetails.attr.outcomeType', { defaultValue: 'Tipo de Salida' }),
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
                    case "consumption":
                        color = "danger";
                        break;
                }

                return <Badge color={color}>{t(`warehouse.common.outcomeType.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        { key: 'totalPrice', label: t('warehouse.outcomeForm.attr.totalValue', { defaultValue: 'Valor Total' }), type: 'currency' },
    ]



    const handleConfirmCancel = async () => {
        if (!configContext) return;
        try {
            setActionLoading(true);
            await configContext.axiosHelper.update(`${configContext.apiUrl}/outcomes/cancel_outcome/${outcomeId}`, {});
            setAlertConfig({ visible: true, color: 'success', message: t('finance.outcome.success.cancelled') });
            await fetchData();
            onCancelled?.();
        } catch (error: any) {
            if (error?.response?.data?.missing) {
                const missing = error.response.data.missing as Array<{ id: string; required: number; available: number }>;
                const items = missing.map((item) => ({
                    product: products.find((p: any) => p.id?._id === item.id)?.id?.name ?? item.id,
                    required: item.required,
                    available: item.available,
                }));
                setMissingStockModal({ open: true, items });
            } else {
                setAlertConfig({ visible: true, color: 'danger', message: t('finance.outcome.error.cancel') });
            }
        } finally {
            setActionLoading(false);
            setConfirmCancelOpen(false);
        }
    };

    const fetchData = async () => {
        if (!configContext || !userLogged) return;

        try {
            setLoading(true)
            const outcomeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_outcome_id/${outcomeId}`);
            const outcomeDetailsResponse = outcomeResponse.data.data;
            setOutcomeDetails(outcomeDetailsResponse)

            setProducts(outcomeDetailsResponse.products)
        } catch (error) {
            logger.error('Error fetching data: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.outcomeDetails.error.fetch') })
        } finally {
            setLoading(false)
        }
    };

    const handlePrintOutcome = async () => {
        if (!configContext) return;

        try {
            setPdfLoading(true);

            // Usar axiosHelper.getBlob para mantener consistencia
            const response = await configContext.axiosHelper.getBlob(appendLangParam(`${configContext.apiUrl}/reports/outcomes/${outcomeId}`));

            // Crear blob con tipo MIME explícito para PDF
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating report: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.outcomeDetails.error.pdf') })
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

    const isCancelled = outcomeDetails?.cancelled === true;
    const isTransfer = outcomeDetails?.outcomeType === 'transfer';

    return (
        <>
            {isCancelled && (
                <div className="d-flex align-items-center gap-3 mb-4 px-4 py-3 rounded-3 text-white" style={{ background: '#b91c1c' }}>
                    <i className="ri-close-circle-fill fs-3" />
                    <div>
                        <div className="fw-bold fs-5">{t('finance.outcome.status.cancelled')}</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                            {t('finance.outcome.cancelledNote', { defaultValue: 'Esta salida ha sido cancelada y no puede modificarse.' })}
                        </div>
                    </div>
                </div>
            )}
            <div className="d-flex gap-2 mb-4 flex-wrap align-items-center">
                <Button
                    color="primary"
                    className="btn-pdf"
                    onClick={handlePrintOutcome}
                    disabled={pdfLoading}
                >
                    {pdfLoading ? (
                        <>
                            <Spinner className="me-2" size='sm' />
                            {t('warehouse.outcomeDetails.generatingPdf', { defaultValue: 'Generando PDF' })}
                        </>
                    ) : (
                        <>
                            <i className="ri-file-pdf-line me-2"></i>
                            {t('warehouse.outcomeDetails.viewPdf', { defaultValue: 'Ver PDF' })}
                        </>
                    )}
                </Button>
                {!isCancelled && (
                    <Button color="danger" onClick={() => setConfirmCancelOpen(true)} disabled={actionLoading}>
                        {actionLoading ? <Spinner size="sm" className="me-2" /> : <i className="ri-close-circle-line me-2" />}
                        {t('finance.outcome.action.cancel')}
                    </Button>
                )}
            </div>
            <div className="d-flex flex-column gap-3">
                {/* Primera fila: Información general y detalles financieros */}
                <div className="d-flex gap-3">
                    <Card>
                        <CardHeader className='bg-gradient bg-primary-subtle'>
                            <h5 className="mb-0 text-primary">{t('warehouse.outcomeDetails.section.generalInfo', { defaultValue: 'Información General' })}</h5>
                        </CardHeader>
                        <CardBody className="pt-4">
                            <ObjectDetails attributes={outcomeAttributes} object={outcomeDetails} />
                        </CardBody>
                    </Card>

                    {/* Segunda fila: Productos */}
                    <Card className="w-100">
                        <CardHeader className='bg-gradient bg-secondary-subtle'>
                            <h5 className="mb-0 text-secondary">{t('warehouse.outcomeDetails.section.products', { defaultValue: 'Productos de la Salida' })}</h5>
                        </CardHeader>
                        <CardBody className="p-0">
                            <CustomTable columns={productsColumns} data={products} showPagination={true} rowsPerPage={5} showSearchAndFilter={false} />
                        </CardBody>
                    </Card>
                </div>
            </div>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.outcomeDetails.pdfModal.title', { defaultValue: 'Reporte de salida' })}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <ConfirmModal
                isOpen={confirmCancelOpen}
                title={t('finance.outcome.confirm.cancelTitle')}
                message={isTransfer ? t('finance.outcome.confirm.cancelTransferMessage') : t('finance.outcome.confirm.cancelMessage')}
                confirmLabel={t('finance.outcome.action.cancel')}
                cancelLabel={t('common.button.cancel')}
                confirmColor="danger"
                loading={actionLoading}
                onConfirm={handleConfirmCancel}
                onCancel={() => setConfirmCancelOpen(false)}
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

export default OutcomeDetails;
;
