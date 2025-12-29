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
        { key: 'code', label: 'No. de Orden', type: "text" },
        { key: 'date', label: 'Fecha', type: 'date' },
        {
            key: 'supplier',
            label: 'Proveedor',
            type: "text",
            render: (value, object) => <span>{object.supplier.name}</span>
        },
        { key: 'tax', label: 'Impuesto', type: "percentage" },
        { key: 'discount', label: 'Descuento', type: "percentage" },
        { key: 'subtotal', label: 'Subtotal', type: "currency" },
        { key: 'totalPrice', label: 'Total', type: "currency" },
    ];

    const productColumns: Column<any>[] = [
        { header: 'Código', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Producto', accessor: 'name', isFilterable: true, type: 'text' },
        {
            header: 'Cantidad',
            accessor: 'quantity',
            isFilterable: true,
            type: 'number',
            render: (value, row) => <span>{row.quantity} {row.unit_measurement}</span>
        },
        { header: 'Precio Unitario', accessor: 'price', type: 'currency' },
        {
            header: 'Categoría',
            accessor: 'category',
            isFilterable: true,
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
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

            const productsResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_array`, purchaseOrderFound.products);
            setProducts(productsResponse.data.data)
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

            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/generate_purchase_order_report/${purchaseId}`,
                { responseType: 'blob' }
            );

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
        <div>
            <div className="d-flex gap-3">
                <Card>
                    <CardHeader>
                        <h5>Detalles de orden</h5>
                    </CardHeader>
                    <CardBody>
                        <ObjectDetails attributes={purchaseOrderAttributes} object={purchaseOrderDetails ?? {}} />
                    </CardBody>
                </Card>

                <Card className="w-100">
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <h4>Productos</h4>

                            <Button className="ms-auto farm-primary-button" onClick={handlePrintPurchaseOrder}>
                                <i className="ri-download-line me-2"></i>
                                Descargar Reporte
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody>
                        <CustomTable columns={productColumns} data={products} rowClickable={false} showPagination={true} rowsPerPage={7} />
                    </CardBody>
                </Card>
            </div>


            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Orden de Compra </ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </div>
    )
}

export default PurchaseOrderDetails;