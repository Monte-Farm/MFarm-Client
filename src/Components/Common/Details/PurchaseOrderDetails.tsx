import { ConfigContext } from "App";
import { Attribute, PurchaseOrderData } from "common/data_interfaces";
import { SUPPLIER_TYPES } from "common/enums/suppliers.enums";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { darkenHex } from "utils/colorUtils";
import { Badge, Button, Card, CardBody, CardHeader, Col, Modal, ModalBody, ModalHeader, Row, Spinner } from "reactstrap";
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { getEffectiveUser } from "helpers/impersonation_helper";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "./ObjectDetails";

interface PurchaseOrderDetailsProps {
    purchaseId: string;
}

const PurchaseOrderDetails: React.FC<PurchaseOrderDetailsProps> = ({ purchaseId }) => {
    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [purchaseOrderDetails, setPurchaseOrderDetails] = useState<PurchaseOrderData>();
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState<boolean>(true);
    const [pdfLoading, setPdfLoading] = useState<boolean>(false);
    const [fileURL, setFileURL] = useState<string>('')
    const [modals, setModals] = useState({ viewPDF: false });

    const purchaseOrderAttributes: Attribute[] = [
        { key: 'code', label: t('common.field.code'), type: 'text' },
        { key: 'date', label: t('common.field.date'), type: 'date' },
        { key: 'supplier.name', label: t('warehouse.suppliers.col.supplier', { defaultValue: 'Proveedor' }), type: 'text' },
        {
            key: 'status',
            label: t('common.field.status'),
            type: 'text',
            render: (value: boolean) => (
                <Badge color={value ? 'warning' : 'success'}>
                    {t(`warehouse.purchaseOrders.status.${value ? 'not_entered' : 'entered'}`, { defaultValue: value ? 'No ingresada' : 'Ingresada' })}
                </Badge>
            ),
        },
    ]

    const supplierAttributes: Attribute[] = [
        { key: 'id', label: t('common.field.code'), type: 'text' },
        { key: 'name', label: t('common.field.name'), type: 'text' },
        { key: 'address', label: t('warehouse.supplierForm.field.address', { defaultValue: 'Dirección' }), type: 'text' },
        { key: 'phone_number', label: t('warehouse.supplierForm.field.phone', { defaultValue: 'Teléfono' }), type: 'text' },
        { key: 'email', label: t('warehouse.supplierForm.field.email', { defaultValue: 'Email' }), type: 'text' },
        { key: 'rnc', label: t('warehouse.supplierForm.field.rnc', { defaultValue: 'RNC' }), type: 'text' },
        {
            key: 'supplier_type',
            label: t('warehouse.suppliers.attr.supplierType', { defaultValue: 'Tipo de Proveedor' }),
            type: 'text',
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case SUPPLIER_TYPES.CLEANING_PRODUCTS:
                        color = "info";
                        break;
                    case SUPPLIER_TYPES.FOOD_AND_FEED:
                        color = "success";
                        break;
                    case SUPPLIER_TYPES.MEDICINES_AND_VETERINARY:
                        color = "warning";
                        break;
                    case SUPPLIER_TYPES.EQUIPMENT_AND_TOOLS:
                        color = "primary";
                        break;
                    case SUPPLIER_TYPES.SERVICES:
                        color = "secondary";
                        break;
                    default:
                        color = "secondary";
                        break;
                }

                return <Badge color={color}>{t(`warehouse.common.supplierType.${value}`, { defaultValue: value })}</Badge>;
            },
        },
    ]

    const productColumns: Column<any>[] = [
        {
            header: t('common.field.code'),
            accessor: 'id',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row?.id?.id}</span>
        },
        {
            header: t('common.field.name'),
            accessor: 'id',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row?.id?.name}</span>
        },
        {
            header: t('warehouse.purchaseOrders.col.quantity', { defaultValue: 'Cantidad' }),
            accessor: 'quantity',
            isFilterable: true,
            type: 'number',
            render: (_, row) => <span>{row.quantity} {row.id.unit_measurement}</span>,
            bgColor: '#f0f0ff'
        },
        {
            header: t('warehouse.purchaseOrders.col.unitPrice', { defaultValue: 'Precio Unitario' }),
            accessor: 'unitPrice',
            type: 'currency',
            bgColor: '#e6f0ff'
        },
        {
            header: t('warehouse.purchaseOrders.col.totalPrice', { defaultValue: 'Precio Total' }),
            accessor: 'totalPrice',
            type: 'currency',
            bgColor: '#e6ffe6'
        },
        {
            header: t('warehouse.purchaseOrders.col.category', { defaultValue: 'Categoría' }),
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

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchPurchaseOrder = async () => {
        if (!configContext || !purchaseId) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/find_purchase_order_id/${purchaseId}`)
            const purchaseOrderFound = response.data.data;
            setPurchaseOrderDetails(purchaseOrderFound);
            setProducts(purchaseOrderFound.products);
        } catch (error) {
            console.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.purchaseOrders.error.fetch', { defaultValue: 'Error al obtener los datos, intentelo mas tarde' }) })
        } finally {
            setLoading(false)
        }
    }

    const handlePrintPurchaseOrder = async () => {
        if (!configContext) return;

        try {
            setPdfLoading(true);

            const response = await configContext.axiosHelper.getBlob(`${configContext.apiUrl}/reports/purchase_orders/${purchaseId}`);

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            console.error('Error generating report:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.purchaseOrders.error.fetch', { defaultValue: 'Error al generar el PDF, intentelo más tarde' }) })
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchaseOrder()
    }, []);

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        );
    }

    return (
        <>
            <div className="d-flex gap-2 mb-4">
                <Button
                    color="primary"
                    onClick={handlePrintPurchaseOrder}
                    disabled={pdfLoading}
                >
                    {pdfLoading ? (
                        <>
                            <Spinner className="me-2" size='sm' />
                            {t('common.button.generating', { defaultValue: 'Generando PDF' })}
                        </>
                    ) : (
                        <>
                            <i className="ri-file-pdf-line me-2"></i>
                            {t('common.button.exportPdf', { defaultValue: 'Ver PDF' })}
                        </>
                    )}
                </Button>
            </div>
            <div className="d-flex flex-column gap-3">
                {/* Primera fila: Información general y detalles del proveedor */}
                <div className="d-flex gap-3">
                    <Card>
                        <CardHeader className='bg-gradient bg-primary-subtle'>
                            <h5 className="mb-0 text-primary">{t('warehouse.purchaseOrders.attr.generalInfo', { defaultValue: 'Información General' })}</h5>
                        </CardHeader>
                        <CardBody className="pt-4">
                            <ObjectDetails attributes={purchaseOrderAttributes} object={purchaseOrderDetails ?? {}} />
                        </CardBody>
                    </Card>

                    {purchaseOrderDetails?.supplier && (
                        <Card className="flex-fill">
                            <CardHeader className='bg-gradient bg-info-subtle'>
                                <h5 className="mb-0 text-info">{t('warehouse.purchaseOrders.attr.supplierDetails', { defaultValue: 'Detalles del Proveedor' })}</h5>
                            </CardHeader>
                            <CardBody className="pt-4">
                                <ObjectDetails attributes={supplierAttributes} object={purchaseOrderDetails.supplier as unknown as Record<string, any>} />
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Segunda fila: Productos */}
                <Card>
                    <CardHeader className='bg-gradient bg-secondary-subtle d-flex justify-content-between align-items-center'>
                        <h5 className="mb-0 text-secondary">{t('warehouse.purchaseOrders.attr.orderProducts', { defaultValue: 'Productos de la Orden' })}</h5>

                        <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ backgroundColor: bg('#f0f8ff') }}>
                            <h5 className="mb-0 me-2 fw-bold">{t('warehouse.purchaseOrders.attr.total', { defaultValue: 'Total:' })}</h5>
                            <h4 className="mb-0 text-primary fw-bold">
                                {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                }).format(
                                    products.reduce((sum: number, product: any) => sum + (product.totalPrice || 0), 0)
                                )}
                            </h4>
                        </div>

                    </CardHeader>
                    <CardBody className="p-0 pb-2">
                        <CustomTable columns={productColumns} data={products} rowClickable={false} showPagination={true} rowsPerPage={5} showSearchAndFilter={false} />

                    </CardBody>
                </Card>
            </div>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.purchaseOrders.modal.report', { defaultValue: 'Reporte de Orden de Compra' })}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default PurchaseOrderDetails;
