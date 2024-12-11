import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import LineChart from "Components/Common/LineChart";
import ObjectDetails from "Components/Common/ObjectDetails";
import Spinners from "Components/Common/Spinner";
import { APIClient } from "helpers/api_helper";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { Alert, Button, Card, CardBody, CardHeader, Col, Container, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap"
import exampleImage from '../../assets/images/alimento.png'
import ProductForm, { ProductData } from "Components/Common/ProductForm";
import { IncomeData } from "Components/Common/IncomeForm";
import { SupplierData } from "Components/Common/SupplierForm";
import { error } from "console";


const displayAttributes = [
    { key: 'id', label: 'Código' },
    { key: 'productName', label: 'Producto' },
    { key: 'category', label: 'Categoría' },
    { key: 'description', label: 'Descripcion' },
    { key: 'unit_measurement', label: 'Unidad de medida' },
    { key: 'status', label: 'Estado' },
]

const supplierAttributes = [
    { key: 'name', label: 'Nombre de proveedor' },
    { key: 'email', label: 'Correo Electrónico' },
    { key: 'phone_number', label: 'Telefono' },
    { key: 'address', label: 'Dirección' }
]

const incomesColumns = [
    { header: 'Identificador', accessor: 'id' },
    { header: 'Fecha de entrada', accessor: 'date' },
    { header: 'Proveedor', accessor: 'supplier' },
    { header: 'Tipo de entrada', accessor: 'incomeType' }
]

const outcomesColumns = [
    { header: 'Identificador', accessor: 'id' },
    { header: 'Fecha de salida', accessor: 'date' },
    { header: 'Destino', accessor: 'supplier' },
    { header: 'Motivo', accessor: 'incomeType' }
]

const ProductDetails = () => {
    document.title = 'Product details | Warehouse'
    const { id_product } = useParams()

    const history = useNavigate();
    const axiosHelper = new APIClient();
    const apiUrl = process.env.REACT_APP_API_URL;

    const [productDetails, setProductDetails] = useState<ProductData | undefined>(undefined);
    const [productIncomes, setProductIncomes] = useState([]);
    const [productSupplier, setProductSupplier] = useState<SupplierData | undefined>(undefined);
    const [categories, setCategories] = useState<string[]>([]);
    const [series, setSeries] = useState<{ name: string, data: number[] }[]>([]);
    const [isError, setIsError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ update: false, delete: false });

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleFetchProductDetails = async () => {
        await axiosHelper.get(`${apiUrl}/product/find_product_id/${id_product}`)
            .then((response) => {
                setProductDetails(response.data.data)
                setLoading(false)
            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde');
            })
    }

    const handleFetchProductIncomes = async () => {
        await axiosHelper.get(`${apiUrl}/product/find_incomes/${id_product}`)
            .then((response) => {
                const incomes = response.data.data;
                setProductIncomes(incomes)
            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde');
            })
    }

    const handleFetchSupplierProduct = async () => {
        const lastIncome: IncomeData = productIncomes[0]
        if (lastIncome) {
            await axiosHelper.get(`${apiUrl}/supplier/find_supplier/name/${lastIncome.supplier}`)
                .then((response) => {
                    setProductSupplier(response.data.data)
                })
                .catch((error) => {
                    handleError(error, 'El servicio no esta disponible, intentelo más tarde')
                })
        }
    }

    const handleHistoryProducts = async () => {
        await axiosHelper.get(`${apiUrl}/product/history_existences/${id_product}`)
            .then((response) => {
                const monthlyExistence = response.data.data;

                const categories: string[] = Object.keys(monthlyExistence);
                const series: number[] = Object.values(monthlyExistence);

                setCategories(categories);
                setSeries([{ name: "Ingresos", data: series }]);
            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde');
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
        await axiosHelper.delete(`${apiUrl}/product/delete_product/${id_product}`)
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

    const handleClickSupplierDetails = () => {
        history(`/warehouse/suppliers/supplier_details/${productSupplier?.id}`)
    }

    const handleRowClicIncomeDetails = (row: any) => {
        history(`/warehouse/incomes/income_details/${row.id}`)
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
    }, []);

    useEffect(() => {
        handleFetchSupplierProduct()
    }, [productIncomes])

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
                    <Button color="danger" onClick={() => toggleModal('delete')} disabled={!productDetails?.status}>
                        <i className="ri-delete-bin-fill align-middle me-3"></i>
                        Desactivar producto
                    </Button>
                    <Button color="success" onClick={() => toggleModal('update')}>
                        <i className="ri-pencil-fill align-middle me-3"></i>
                        Editar producto
                    </Button>
                </div>

                <Row className="mt-4">
                    <Col lg={2}>
                        <Card className="">
                            <CardBody>
                                {productDetails && loading === false ? (
                                    <ObjectDetails attributes={displayAttributes} object={productDetails} showImage={true} imageSrc={exampleImage} />
                                ) : null
                                }
                            </CardBody>
                        </Card>
                        <Card className="h-auto">
                            <CardHeader>
                                <h4>Existencias</h4>
                            </CardHeader>
                            <CardBody>
                                <h3>{productDetails?.quantity} {productDetails?.unit_measurement}</h3>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={5}>
                        <Card className="h-100">
                            <CardHeader> <h4>Compras | Altas</h4></CardHeader>
                            <CardBody>
                                <CustomTable columns={incomesColumns} data={productIncomes} showSearchAndFilter={false} rowClickable={true} onRowClick={handleRowClicIncomeDetails} />
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={5}>
                        <Card className="h-100">
                            <CardHeader> <h4>Ventas | Bajas</h4></CardHeader>
                            <CardBody>
                                <CustomTable columns={outcomesColumns} data={[]} showSearchAndFilter={false} />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row className="mt-4">
                    <Col lg={6}>
                        <Card className="h-100">
                            <CardHeader>
                                <div className="d-flex">
                                    <h4>Proveedor más reciente</h4>
                                    <Button className="ms-auto" color="secondary" onClick={handleClickSupplierDetails} disabled={!productSupplier}>
                                        Detalles de Proveedor
                                    </Button>
                                </div>

                            </CardHeader>

                            <CardBody>
                                {productSupplier ? (
                                    <ObjectDetails attributes={supplierAttributes} object={productSupplier}></ObjectDetails>
                                ) : (
                                    <div style={{ textAlign: "center" }}>No hay proveedores recientes</div>
                                )}
                            </CardBody>

                        </Card>

                    </Col>

                    <Col lg={6}>
                        <Card className="h-100">
                            <CardHeader>
                                <h4>Existencias Historicas - Últimos 12 meses</h4>
                            </CardHeader>
                            {series && categories && series.length > 0 && categories.length > 0 ? (
                                <LineChart dataColors='["--vz-primary"]' series={series} categories={categories} title={""} />
                            ) : (
                                <div style={{ textAlign: "center" }}>No hay datos disponibles para mostrar</div>
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