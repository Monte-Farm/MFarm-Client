import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import ObjectDetails from "./ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import PDFViewer from "../Shared/PDFViewer";
import AlertMessage from "../Shared/AlertMesagge";
import { useNavigate } from "react-router-dom";
import { Attribute } from "common/data_interfaces";

interface OutcomeDetailsProps {
    outcomeId: string;
}

const OutcomeDetails: React.FC<OutcomeDetailsProps> = ({ outcomeId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
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
            header: 'Código',
            accessor: 'id',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row?.id?.id}</span>
        },
        {
            header: 'Producto',
            accessor: 'id',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row?.id?.name}</span>
        },
        {
            header: 'Cantidad',
            accessor: 'quantity',
            isFilterable: true,
            type: 'number',
            render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>
        },
        { header: 'Precio Unitario', accessor: 'price', type: 'currency' },
        {
            header: 'Precio Total',
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
            header: 'Categoria',
            accessor: 'category',
            isFilterable: true,
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                let label = row.id.category;

                switch (row.id.category) {
                    case "nutrition":
                        color = "info";
                        label = "Nutrición";
                        break;
                    case "medications":
                        color = "warning";
                        label = "Medicamentos";
                        break;
                    case "vaccines":
                        color = "primary";
                        label = "Vacunas";
                        break;
                    case "vitamins":
                        color = "success";
                        label = "Vitaminas";
                        break;
                    case "minerals":
                        color = "success";
                        label = "Minerales";
                        break;
                    case "supplies":
                        color = "success";
                        label = "Insumos";
                        break;
                    case "hygiene_cleaning":
                        color = "success";
                        label = "Higiene y desinfección";
                        break;
                    case "equipment_tools":
                        color = "success";
                        label = "Equipamiento y herramientas";
                        break;
                    case "spare_parts":
                        color = "success";
                        label = "Refacciones y repuestos";
                        break;
                    case "office_supplies":
                        color = "success";
                        label = "Material de oficina";
                        break;
                    case "others":
                        color = "success";
                        label = "Otros";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
    ];

    const outcomeAttributes: Attribute[] = [
        { key: 'code', label: 'Código', type: 'text' },
        { key: 'date', label: 'Fecha', type: 'date' },
        { key: 'warehouseOrigin.name', label: 'Almacén Origen', type: 'text' },
        { key: 'warehouseDestiny.name', label: 'Almacén Destino', type: 'text' },
        { key: 'description', label: 'Descripción', type: 'text' },
        {
            key: 'outcomeType',
            label: 'Tipo de Salida',
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "internal_transfer":
                        color = "info";
                        label = "Transferencia Interna";
                        break;
                    case "purchase":
                        color = "warning";
                        label = "Compra";
                        break;
                    case "warehouse_order":
                        color = "warning";
                        label = "Pedido de Almacén";
                        break;
                    case "consumption":
                        color = "danger";
                        label = "Consumo";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: 'totalPrice', label: 'Valor Total', type: 'currency' },
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
            console.error('Error fetching data: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
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
            console.error('Error generating report: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al generar el PDF, intentelo más tarde' })
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
                    onClick={handlePrintOutcome}
                    disabled={pdfLoading}
                >
                    {pdfLoading ? (
                        <>
                            <Spinner className="me-2" size='sm' />
                            Generando PDF
                        </>
                    ) : (
                        <>
                            <i className="ri-file-pdf-line me-2"></i>
                            Ver PDF
                        </>
                    )}
                </Button>
            </div>
            <div className="d-flex flex-column gap-3">
                {/* Primera fila: Información general y detalles financieros */}
                <div className="d-flex gap-3">
                    <Card>
                        <CardHeader className='bg-gradient bg-primary-subtle'>
                            <h5 className="mb-0 text-primary">Información General</h5>
                        </CardHeader>
                        <CardBody className="pt-4">
                            <ObjectDetails attributes={outcomeAttributes} object={outcomeDetails} />
                        </CardBody>
                    </Card>

                    {/* Segunda fila: Productos */}
                    <Card className="w-100">
                        <CardHeader className='bg-gradient bg-secondary-subtle'>
                            <h5 className="mb-0 text-secondary">Productos de la Salida</h5>
                        </CardHeader>
                        <CardBody className="p-0">
                            <CustomTable columns={productsColumns} data={products} showPagination={true} rowsPerPage={5} showSearchAndFilter={false} />
                        </CardBody>
                    </Card>
                </div>
            </div>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de salida</ModalHeader>
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