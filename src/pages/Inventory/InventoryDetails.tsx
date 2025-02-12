import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import LineChart from "Components/Common/LineChart";
import ObjectDetails from "Components/Common/ObjectDetails";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"
import { Alert, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "reactstrap"
import ProductForm from "Components/Common/ProductForm";
import noImageUrl from '../../assets/images/no-image.png'
import { ProductData } from "common/data_interfaces";
import { ConfigContext } from "App";
import LoadingGif from '../../assets/images/loading-gif.gif'


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
    const configContext = useContext(ConfigContext);

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
    const [productImageUrl, setProductImageUrl] = useState<string>('')
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
                    <Button className="farm-primary-button btn-icon" onClick={() => handleRowClicIncomeDetails(row)}>
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
                    <Button className="farm-primary-button btn-icon" onClick={() => handleRowClicOutcomeDetails(row)}>
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
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_product_id/${productId}`);
            setProductDetails(response.data.data);
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        }
    };


    const handleFetchProductImage = async () => {
        if (!configContext) return;

        if (productDetails && productDetails.image) {
            try {
                const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/google_drive/download_file/${productDetails.image}`, { responseType: 'blob' });
                const imageUrl = URL.createObjectURL(response.data);
                setProductImageUrl(imageUrl);
            } catch (error) {
                console.error('Ha ocurrido un error al obtener la imagen del producto');
            }
        } else {
            setProductImageUrl(noImageUrl);
        }
    };


    const handleFetchProductIncomes = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_incomes/${productId}/${warehouseId}`);
            const incomes = response.data.data;
            setProductIncomes(incomes);
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        }
    };

    const handleFetchProductOutcomes = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_outcomes/${productId}/${warehouseId}`);
            const outcomes = response.data.data;
            setProductOutcomes(outcomes);
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        }
    };



    const handleProductExistences = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/product_existences/${productId}/${warehouseId}`);
            setProductExistences(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener las existencias del producto, intentelo más tarde');
        }
    };


    const handleHistoryProducts = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/history_existences/${productId}/${warehouseId}`);
            const monthlyExistence = response.data.data;

            const categories: string[] = Object.keys(monthlyExistence);
            const series: number[] = Object.values(monthlyExistence);

            setCategoriesIncomes(categories);
            setSeriesIncomes([{ name: "Existencias", data: series }]);
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        }
    };


    const handleHistoryPrices = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/history_prices/${productId}/${warehouseId}`);
            const monthlyPrices = response.data.data;

            const categories: string[] = Object.keys(monthlyPrices);
            const series: number[] = Object.values(monthlyPrices);

            setCategoriesPrices(categories);
            setSeriesPrices([{ name: 'RD$', data: series }]);

            if (Object.keys(monthlyPrices).length > 0) {
                setLastPrice(series[series.length - 1]);
            } else {
                setLastPrice(0);
            }
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        }
    };


    const handleAveragePrice = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/average_price/${productId}/${warehouseId}`);

            if (response.data.data !== null) {
                const price: number = response.data.data;
                setAveragePrice(price.toFixed(2));
            } else {
                setAveragePrice('0');
            }
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        }
    };


    const handleUpdateProduct = async (data: ProductData) => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.put(`${configContext.apiUrl}/product/update_product/${data.id}`, data);

            handleFetchProductDetails();
            toggleModal('update', false);
            setAlertConfig({ visible: true, color: "success", message: "Producto actualizado correctamente." });
            setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
        } catch (error) {
            handleError(error, 'Ha ocurrido un problema actualizando el producto, intentelo más tarde');
        }
    };


    const handleDeleteProduct = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.delete(`${configContext.apiUrl}/product/delete_product/${productId}`);

            handleFetchProductDetails();
            toggleModal('delete', false);
            setAlertConfig({ visible: true, color: "success", message: "Producto desactivado correctamente." });
            setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error desactivando el producto, intentelo más tarde');
        }
    };



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
        const fetchData = async () => {
            await Promise.all([
                handleFetchProductDetails(),
                handleFetchProductIncomes(),
                handleHistoryProducts(),
                handleHistoryPrices(),
                handleAveragePrice(),
                handleProductExistences(),
                handleFetchProductOutcomes()
            ]);
            setLoading(false);
        };

        fetchData();
    }, []);

    useEffect(() => {
        handleFetchProductImage();
    }, [productDetails])

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Detalles de Producto" pageTitle="Inventario" />

                <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                        <Button className="farm-secondary-button" onClick={handleBack}>
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
                                    <ObjectDetails attributes={displayAttributes} object={productDetails} showImage={true} imageSrc={productImageUrl} />
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
                                    <CustomTable columns={outcomesColumns} data={productOutcomes} showSearchAndFilter={false} rowsPerPage={4} />
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
                                <LineChart series={seriesIncomes} categories={categoriesIncomes} title={""} />
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
                                <LineChart series={seriesPrices} categories={categoriesPrices} title={""} />
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