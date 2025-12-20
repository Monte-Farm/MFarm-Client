import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalHeader } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import ObjectDetails from "./ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import PDFViewer from "../Shared/PDFViewer";
import AlertMessage from "../Shared/AlertMesagge";
import { useNavigate } from "react-router-dom";
import { Attribute } from "common/data_interfaces";

interface IncomeDetailsProps {
    incomeId: string;
}

const IncomeDetails: React.FC<IncomeDetailsProps> = ({ incomeId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
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
            header: 'Código',
            accessor: 'id',
            isFilterable: true,
            type: 'text',
            // render: (_, row) => (
            //     <Button
            //         className="text-underline"
            //         color="link"
            //         onClick={(e) => {
            //             e.stopPropagation();
            //             navigate('')
            //         }}
            //     >
            //         {row.code} ↗
            //     </Button>
            // )
        },
        { header: 'Producto', accessor: 'name', isFilterable: true, type: 'text' },
        {
            header: 'Cantidad',
            accessor: 'quantity',
            isFilterable: true,
            type: 'number',
            render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>
        },
        { header: 'Precio Unitario', accessor: 'price', type: 'currency' },
        {
            header: 'Categoria',
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

    const incomeAttributes: Attribute[] = [
        { key: 'id', label: 'Codigo', type: 'text' },
        { key: 'date', label: 'Fecha', type: 'date' },
        {
            key: 'incomeType',
            label: 'Tipo de entrada',
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "internal_transfer":
                        color = "info";
                        label = "Tranferencia";
                        break;
                    case "purchase":
                        color = "warning";
                        label = "Compra";
                        break;
                    case "warehouse_order":
                        color = "warning";
                        label = "Pedido de almacen";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;

        try {
            setLoading(true)
            const incomeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_incomes_id/${incomeId}`);
            const incomeDetailsResponse = incomeResponse.data.data;
            setIncomeDetails(incomeDetailsResponse)

            const productsResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_array`, incomeDetailsResponse.products);
            setProducts(productsResponse.data.data);
        } catch (error) {
            console.error('Error fetching data: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    };

    const handlePrintIncome = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/generate_income_report/${incomeId}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setFileURL(url)
            toggleModal('viewPDF')
        } catch (error) {
            console.error('Error generating report: ', { error })
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
                <Button className="farm-primary-button" onClick={handlePrintIncome}>
                    <i className="ri-download-line me-2"></i>
                    Descargar Reporte
                </Button>
            </div>
            <div className="d-flex gap-3">
                <Card className="">
                    <CardHeader className='bg-light'>
                        <h5>Informacion de la entrada</h5>
                    </CardHeader>
                    <CardBody className="pt-4">
                        <ObjectDetails attributes={incomeAttributes} object={incomeDetails} />
                    </CardBody>
                </Card>

                <Card className="w-100">
                    <CardHeader className='bg-light'>
                        <h5>Productos de la entrada</h5>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable columns={productsColumns} data={products} showPagination={true} rowsPerPage={5} showSearchAndFilter={false} />
                    </CardBody>
                </Card>
            </div>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de entrada</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default IncomeDetails;