import { ConfigContext } from "App";
import { Attribute, IncomeData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import ObjectDetailsHorizontal from "Components/Common/ObjectDetailsHorizontal";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import PDFViewer from "Components/Common/PDFViewer";
import { Column } from "common/data/data_types";

const incomeAttributes: Attribute[] = [
    { key: 'id', label: 'Identificador', type: 'text' },
    { key: 'warehouse', label: 'Almacén', type: 'text'  },
    { key: 'date', label: 'Fecha de registro', type: 'date'  },
    { key: 'emissionDate', label: 'Fecha de emisión', type: 'date'  },
    { key: 'origin.id', label: '', type: 'text'  },
    { key: 'totalPrice', label: 'Precio Total', type: 'currency'  },
    { key: 'incomeType', label: 'Tipo de alta', type: 'text'  }
];

const IncomeDetails = () => {
    document.title = 'Detalles de entrada | Almacén';
    const history = useNavigate();
    const { id_income } = useParams();
    const configContext = useContext(ConfigContext);

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ update: false, delete: false, viewPDF: false });
    const [incomeDetails, setIncomeDetails] = useState<IncomeData>();
    const [incomeDisplay, setIncomeDisplay] = useState({});
    const [productsIncome, setProductsIncome] = useState([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [fileURL, setFileURL] = useState<string>('')


    const productColumns: Column<any>[]= [
        { header: 'Código', accessor: 'id', isFilterable: true, type: 'text'  },
        { header: 'Producto', accessor: 'name', isFilterable: true, type: 'text'  },
        { header: 'Cantidad', accessor: 'quantity', isFilterable: true, type: 'number'  },
        { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true, type: 'text'  },
        { header: 'Precio Unitario', accessor: 'price', type: 'currency'  },
        { header: 'Categoría', accessor: 'category', isFilterable: true, type: 'text'  },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleClicProductDetails(row)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ];

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleFetchIncome = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_incomes_id/${id_income}`);
            const incomeFound = response.data.data;
            setIncomeDetails(incomeFound);
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        }
    };

    const handleFetchIncomeDisplay = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/income_display_details/${id_income}`);
            const incomeFound = response.data.data;

            if (incomeFound.origin.originType === 'supplier') {
                incomeAttributes[4].label = 'Proveedor';
            } else {
                incomeAttributes[4].label = 'Almacén de origen';
            }

            setIncomeDisplay(incomeFound);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos de la entrada, intentelo más tarde');
        }
    };

    const handleFetchIncomeProducts = async () => {
        if (!configContext || !incomeDetails) return;

        try {
            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_array`, incomeDetails?.products);
            setProductsIncome(response.data.data);
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        }
    };

    const handlePrintIncome = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/generate_income_report/${id_income}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setFileURL(url)
            toggleModal('viewPDF')
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al generar el reporte, inténtelo más tarde.');
        }
    };

    const handleClicProductDetails = (row: any) => {
        history(`/warehouse/inventory/product_details?warehouse=${incomeDetails?.warehouse}&product=${row.id}`);
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            history(-1);
        } else {
            history('/#');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([
                handleFetchIncome(),
                handleFetchIncomeDisplay()
            ]);
            setLoading(false);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (incomeDetails) {
            handleFetchIncomeProducts();
        }
    }, [incomeDetails]);


    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
        );
    }

    return (
        <div className="page-content min-vh-100">
            <Container fluid>
                <BreadCrumb title={"Detalles de entrada"} pageTitle={"Entradas"} />

                <div className="d-flex gap-2 mb-3">
                    <Button className="me-auto farm-secondary-button" onClick={handleBack}>
                        <i className="ri-arrow-left-line me-3"></i>
                        Regresar
                    </Button>
                </div>

                <div className="d-flex-column gap-3">
                    <Card className="w-100 h-100 pt-2" style={{ backgroundColor: '#A3C293' }}>
                        <CardBody>
                            {incomeDetails && (
                                <ObjectDetailsHorizontal attributes={incomeAttributes} object={incomeDisplay} />
                            )}
                        </CardBody>
                    </Card>

                    <Card className="w-100" style={{ height: '55vh' }}>
                        <CardHeader>
                            <div className="d-flex gap-2">
                                <h4>Productos</h4>

                                <Button className="ms-auto farm-primary-button" onClick={handlePrintIncome}>
                                    <i className="ri-download-line me-2"></i>
                                    Descargar Reporte
                                </Button>
                            </div>

                        </CardHeader>
                        <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                            <CustomTable columns={productColumns} data={productsIncome} rowClickable={false} showPagination={false} />
                        </CardBody>
                    </Card>
                </div>


                <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Entrada </ModalHeader>
                    <ModalBody>
                        {fileURL && <PDFViewer fileUrl={fileURL} />}
                    </ModalBody>
                </Modal>


                {alertConfig.visible && (
                    <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                        {alertConfig.message}
                    </Alert>
                )}
            </Container>
        </div>
    );
};

export default IncomeDetails;
