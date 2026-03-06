import { ConfigContext } from "App";
import { Attribute, PurchaseOrderData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import ObjectDetailsHorizontal from "Components/Common/Details/ObjectDetailsHorizontal";
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { getLoggedinUser } from "helpers/api_helper";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "./ObjectDetails";

interface PurchaseOrderDetailsProps {
    purchaseId: string;
}

const PurchaseOrderDetails: React.FC<PurchaseOrderDetailsProps> = ({ purchaseId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [purchaseOrderDetails, setPurchaseOrderDetails] = useState<PurchaseOrderData>();
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState<boolean>(true);
    const [fileURL, setFileURL] = useState<string>('')
    const [modals, setModals] = useState({ viewPDF: false });

    const purchaseOrderAttributes: Attribute[] = [
        { key: 'code', label: 'Código', type: 'text' },
        { key: 'date', label: 'Fecha', type: 'date' },
        { key: 'supplier.name', label: 'Proveedor', type: 'text' },
        {
            key: 'status',
            label: 'Estado',
            type: 'text',
            render: (value: boolean) => (
                <Badge color={value ? 'warning' : 'success'}>
                    {value ? 'No ingresada' : 'Ingresada'}
                </Badge>
            ),
        },
    ]

    const supplierAttributes: Attribute[] = [
        { key: 'id', label: 'Código', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'address', label: 'Dirección', type: 'text' },
        { key: 'phone_number', label: 'Teléfono', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'rnc', label: 'RNC', type: 'text' },
        { key: 'supplier_type', label: 'Tipo de Proveedor', type: 'text' },
    ]

    const productColumns: Column<any>[] = [
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
            render: (_, row) => <span>{row.quantity} {row.id.unit_measurement}</span>
        },
        {
            header: 'Categoría',
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
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const handlePrintPurchaseOrder = async () => {
        if (!configContext) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/reports/generate_purchase_order_report/${purchaseId}`, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setFileURL(url);
            toggleModal('viewPDF')
        } catch (error) {
            console.error('Error generating report:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrio un error al generar el reporte, intentelo mas tarde' })
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
            <div className="d-flex flex-column gap-3">
                {/* Primera fila: Información general y detalles del proveedor */}
                <div className="d-flex gap-3">
                    <Card>
                        <CardHeader className='bg-gradient bg-primary-subtle'>
                            <h5 className="mb-0 text-primary">Información General</h5>
                        </CardHeader>
                        <CardBody className="pt-4">
                            <ObjectDetails attributes={purchaseOrderAttributes} object={purchaseOrderDetails ?? {}} />
                        </CardBody>
                    </Card>

                    {purchaseOrderDetails?.supplier && (
                        <Card className="flex-fill">
                            <CardHeader className='bg-gradient bg-info-subtle'>
                                <h5 className="mb-0 text-info">Detalles del Proveedor</h5>
                            </CardHeader>
                            <CardBody className="pt-4">
                                <ObjectDetails attributes={supplierAttributes} object={purchaseOrderDetails.supplier as unknown as Record<string, any>} />
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Segunda fila: Productos */}
                <Card>
                    <CardHeader className='bg-gradient bg-secondary-subtle'>
                        <h5 className="mb-0 text-secondary">Productos de la Orden</h5>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable columns={productColumns} data={products} rowClickable={false} showPagination={true} rowsPerPage={5} showSearchAndFilter={false} />
                    </CardBody>
                </Card>
            </div>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Orden de Compra</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default PurchaseOrderDetails;