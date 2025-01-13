import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import LineChart from "Components/Common/LineChart";
import ObjectDetails from "Components/Common/ObjectDetails";
import { APIClient } from "helpers/api_helper";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Alert, Button, Card, CardBody, CardHeader, Col, Container, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap"
import exampleImage from '../../assets/images/alimento.png'
import ProductForm, { ProductData } from "Components/Common/ProductForm";
import { SupplierData } from "Components/Common/SupplierForm";


const displayAttributes = [
    { key: 'id', label: 'Código' },
    { key: 'name', label: 'Producto' },
    { key: 'category', label: 'Categoría' },
    { key: 'description', label: 'Descripcion' },
    { key: 'unit_measurement', label: 'Unidad de medida' },
    { key: 'status', label: 'Estado' },
]

const ProductDetails = () => {
    document.title = 'Product details | Warehouse'
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('product');
    const warehouseId = searchParams.get('warehouse')

    const history = useNavigate();
    const axiosHelper = new APIClient();
    const apiUrl = process.env.REACT_APP_API_URL;

    const [productDetails, setProductDetails] = useState<ProductData | undefined>(undefined);
    const [productIncomes, setProductIncomes] = useState([]);
    const [productOutcomes, setProductOutcomes] = useState([]);
    const [categoriesIncomes, setCategoriesIncomes] = useState<string[]>([]);
    const [categoriesPrices, setCategoriesPrices] = useState<string[]>([]);
    const [seriesIncomes, setSeriesIncomes] = useState<{ name: string, data: number[] }[]>([]);
    const [seriesPrices, setSeriesPrices] = useState<{ name: string, data: number[] }[]>([]);
    const [lastPrice, setLastPrice] = useState<number>(0);
    const [averagePrice, setAveragePrice] = useState<string>('');
    const [productExistences, setProductExistences] = useState<string>('')

    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ update: false, delete: false });
    const incomesColumns = [
        { header: 'Identificador', accessor: 'id' },
        { header: 'Fecha de entrada', accessor: 'date' },
        { header: 'Proveedor', accessor: 'originName' },
        { header: 'Tipo de entrada', accessor: 'incomeType' },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="btn-secondary btn-icon" onClick={() => handleRowClicIncomeDetails(row)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const outcomesColumns = [
        { header: 'Identificador', accessor: 'id' },
        { header: 'Fecha de salida', accessor: 'date' },
        { header: 'Subalmacén destino', accessor: 'warehouseDestiny' },
        { header: 'Tipo de salida', accessor: 'outcomeType' },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="btn-secondary btn-icon" onClick={() => handleRowClicOutcomeDetails(row)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleFetchProductDetails = async () => {
        await axiosHelper.get(`${apiUrl}/product/find_product_id/${productId}`)
            .then((response) => {
                setProductDetails(response.data.data)
                setLoading(false)
            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde');
            })
    }

    const handleFetchProductIncomes = async () => {
        await axiosHelper.get(`${apiUrl}/product/find_incomes/${productId}/${warehouseId}`)
            .then((response) => {
                const incomes = response.data.data;
                setProductIncomes(incomes)
            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde');
            })
    }

    const handleFetchProductOutcomes = async () => {
        await axiosHelper.get(`${apiUrl}/product/find_outcomes/${productId}/${warehouseId}`)
            .then((response) => {
                const outcomes = response.data.data;
                setProductOutcomes(outcomes)
            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde');
            })
    }


    const handleProductExistences = async () => {
        await axiosHelper.get(`${apiUrl}/product/product_existences/${productId}/${warehouseId}`)
            .then((response) => {
                console.log(response.data.data)
                setProductExistences(response.data.data)
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al obtener las existencias del producto, intentelo más tarde')
            })
    }


    const handleHistoryProducts = async () => {
        await axiosHelper.get(`${apiUrl}/product/history_existences/${productId}/${warehouseId}`)
            .then((response) => {
                const monthlyExistence = response.data.data;

                const categories: string[] = Object.keys(monthlyExistence);
                const series: number[] = Object.values(monthlyExistence);

                setCategoriesIncomes(categories);
                setSeriesIncomes([{ name: "Existencias", data: series }]);

            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde');
            })
    }

    const handleHistoryPrices = async () => {
        await axiosHelper.get(`${apiUrl}/product/history_prices/${productId}/${warehouseId}`)
            .then((response) => {
                const monthlyPrices = response.data.data;

                const categories: string[] = Object.keys(monthlyPrices);
                const series: number[] = Object.values(monthlyPrices);

                setCategoriesPrices(categories);
                setSeriesPrices([{ name: 'RD$', data: series }])
                if (Object.keys(monthlyPrices).length > 0) {
                    setLastPrice(series[series.length - 1])
                } else {
                    setLastPrice(0)
                }

            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde')
            })
    }

    const handleAveragePrice = async () => {
        await axiosHelper.get(`${apiUrl}/product/average_price/${productId}/${warehouseId}`)
            .then((response) => {
                if (response.data.data !== null) {
                    const price: number = response.data.data;
                    setAveragePrice(price.toFixed(2))
                } else {
                    setAveragePrice('0');
                }

            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde')
            })
    }

    const handleUpdateProduct = async (data: ProductData) => {
        await axiosHelper.put(`${apiUrl}/product/update_product/${data.id}`, data)
            .then((response) => {
                handleFetchProductDetails()
                toggleModal('update', false)
                setAlertConfig({ visible: true, color: "success", message: "Product actualizado correctamente." });
                setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un problema actualizando el producto, intentelo más tarde');
            })
    };

    const handleDeleteProduct = async () => {
        await axiosHelper.delete(`${apiUrl}/product/delete_product/${productId}`)
            .then((response) => {
                handleFetchProductDetails()
                toggleModal('delete', false)
                setAlertConfig({ visible: true, color: "success", message: "Producto desactivado correctamente." });
                setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error desactivando el producto, intenlo más tarde');
            })
    }


    const handleRowClicIncomeDetails = (row: any) => {
        history(`/warehouse/incomes/income_details/${row.id}`)
    }

    const handleRowClicOutcomeDetails = (row: any) => {
        history(`/warehouse/outcomes/outcome_details/${row.id}`)
    }

    const handleBack = () => {
        if (window.history.length > 1) {
            history(-1)
        } else {
            history('/warehouse/inventory/view_inventory');
        }

    }

    useEffect(() => {
        handleFetchProductDetails();
        handleFetchProductIncomes();
        handleHistoryProducts();
        handleHistoryPrices();
        handleAveragePrice();
        handleProductExistences();
        handleFetchProductOutcomes();
    }, []);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Product Details" pageTitle="Inventory" />

                <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                        <Button color="secondary" onClick={handleBack}>
                            <i className=" ri-arrow-left-line me-3"></i>
                            Regresar
                        </Button>
                    </div>
                </div>

                <Row className="mt-4">
                    <Col lg={4}>
                        <Card className="h-100">
                            <CardBody>
                                {productDetails && loading === false ? (
                                    <ObjectDetails attributes={displayAttributes} object={productDetails} showImage={true} imageSrc={exampleImage} />
                                ) : null
                                }
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        <div className="d-flex flex-column gap-3 h-100">
                            <div className="d-flex gap-3 h-25">
                                <Card className="m-0 h-100 w-50">
                                    <CardHeader>
                                        <h4>Existencias</h4>
                                    </CardHeader>
                                    <CardBody>
                                        <h3 className="pt-3">{productExistences}</h3>
                                    </CardBody>
                                </Card>

                                <Card className="m-0 h-100 w-50">
                                    <CardHeader>
                                        <h4>Último precio</h4>
                                    </CardHeader>
                                    <CardBody>
                                        <h3 className="pt-3">RD$ {lastPrice}</h3>
                                    </CardBody>
                                </Card>
                            </div>


                            <Card className='m-0 h-75'>
                                <CardHeader> <h4>Entradas</h4></CardHeader>
                                <CardBody>
                                    <CustomTable columns={incomesColumns} data={productIncomes} showSearchAndFilter={false} rowClickable={false} rowsPerPage={4} />
                                </CardBody>
                            </Card>
                        </div>
                    </Col>

                    <Col lg={4}>
                        <div className="d-flex flex-column gap-3 h-100">
                            <Card className="m-0 h-25">
                                <CardHeader><h4>Precio Promedio</h4></CardHeader>
                                <CardBody>
                                    <h3 className="pt-3">RD$ {averagePrice}</h3>
                                </CardBody>
                            </Card>

                            <Card className="m-0 h-75">
                                <CardHeader> <h4>Salidas</h4></CardHeader>
                                <CardBody>
                                    <CustomTable columns={outcomesColumns} data={productOutcomes} showSearchAndFilter={false} rowsPerPage={4}/>
                                </CardBody>
                            </Card>
                        </div>

                    </Col>
                </Row>

                <Row className="mt-4">
                    <Col lg={6}>
                        <Card className="h-auto">
                            <CardHeader>
                                <h4>Existencias Historicas</h4>
                            </CardHeader>
                            {seriesIncomes && categoriesIncomes && seriesIncomes.length > 0 && categoriesIncomes.length > 0 ? (
                                <LineChart dataColors='["--vz-primary"]' series={seriesIncomes} categories={categoriesIncomes} title={""} />
                            ) : (
                                <div className="pt-4 pb-4" style={{ textAlign: "center" }}><h4>No hay datos disponibles para mostrar</h4> </div>
                            )}
                        </Card>
                    </Col>

                    <Col lg={6}>
                        <Card className="h-auto">
                            <CardHeader>
                                <h4>Precios Historicos</h4>
                            </CardHeader>
                            {seriesPrices && categoriesPrices && seriesPrices.length > 0 && categoriesPrices.length > 0 ? (
                                <LineChart dataColors='["--vz-primary"]' series={seriesPrices} categories={categoriesPrices} title={""} />
                            ) : (
                                <div className="pt-4 pb-4" style={{ textAlign: "center" }}><h4>No hay datos disponibles para mostrar</h4> </div>
                            )}
                        </Card>
                    </Col>
                </Row>


                <Modal size="lg" isOpen={modals.update} toggle={() => toggleModal('update')} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal('update')}>Modificar Producto</ModalHeader>
                    <ModalBody>
                        <ProductForm initialData={productDetails} onSubmit={handleUpdateProduct} onCancel={() => toggleModal("update", false)} isCodeDisabled={true}></ProductForm>
                    </ModalBody>
                </Modal>

                <Modal isOpen={modals.delete} toggle={() => toggleModal("delete")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("delete")}>Desactivar Proveedor</ModalHeader>
                    <ModalBody>¿Desea desactivar este producto?</ModalBody>
                    <ModalFooter>
                        <Button color="danger" onClick={() => toggleModal("delete", false)}>Cancelar</Button>
                        <Button color="success" onClick={() => handleDeleteProduct()}>Confirmar</Button>
                    </ModalFooter>
                </Modal>

                {/* Alerta */}
                {alertConfig.visible && (
                    <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                        {alertConfig.message}
                    </Alert>
                )}
            </Container>
            {/*<LineChart dataColors='["--vz-primary"]' series={[]} categories={[]} title={""} />*/}
        </div>
    );
};

export default ProductDetails