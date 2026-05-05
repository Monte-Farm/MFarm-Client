import { logger } from 'utils/logger';
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
import { useNavigate } from "react-router-dom";
import { Attribute } from "common/data_interfaces";
import { useTranslation } from "react-i18next";

interface OutcomeDetailsProps {
    outcomeId: string;
}

const OutcomeDetails: React.FC<OutcomeDetailsProps> = ({ outcomeId }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
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
            const response = await configContext.axiosHelper.getBlob(`${configContext.apiUrl}/reports/outcomes/${outcomeId}`);

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

    return (
        <>
            <div className="d-flex gap-2 mb-4">
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

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default OutcomeDetails;
;
