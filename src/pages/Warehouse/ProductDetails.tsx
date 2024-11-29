import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import LineChart from "Components/Common/LineChart";
import ObjectDetails from "Components/Common/ObjectDetails";
import Spinners from "Components/Common/Spinner";
import { APIClient } from "helpers/api_helper";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"
import { Button, Card, CardHeader, Col, Container, Label, Row, Spinner } from "reactstrap"


interface ProductDetails {
    id: string;
    productName: string;
    quantity: number;
    category: string;
    description: string;
    status: string;
    price: string;
    unit_measurement: string;
    incomes: object[];
    outcomes: object[];
}

const displayAttributes = [
    { key: 'id', label: 'Código' },
    { key: 'productName', label: 'Producto' },
    { key: 'category', label: 'Categoría' },
    { key: 'description', label: 'Descripcion' },
    { key: 'status', label: 'Estado' },
]

const ProductDetails = () => {
    document.title = 'Product details | Warehouse'

    const { id_product } = useParams()
    const axiosHelper = new APIClient();
    const apiUrl = process.env.REACT_APP_API_URL;

    const [productDetails, setProductDetails] = useState<ProductDetails | undefined>(undefined);
    const [isError, setIsError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true)

    const getProductDetails = async () => {
        await axiosHelper.get(`${apiUrl}/product/find_product_id/${id_product}`)
            .then((response) => {
                setProductDetails(response.data.productFound)
                setLoading(false)
                setIsError(false)
            })
            .catch((error) => {
                console.error(`An error has been ocurred ${error}`)
                setIsError(true)
            })
    }

    useEffect(() => {
        getProductDetails();
    }, []);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Product Details" pageTitle="Warehouse" />

                <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                        <Button color="secondary">
                            <i className=" ri-arrow-left-line me-3"></i>
                            Regresar
                        </Button>
                    </div>
                    <Button color="danger"> Eliminar producto</Button>
                    <Button color="success"> Editar producto</Button>
                </div>
                
                <Row className="mt-4">
                    <Col lg={4}>
                        <Card className="p-2 h-100">
                            {productDetails && loading === false ? (
                                <ObjectDetails attributes={displayAttributes} object={productDetails} />
                            ) : (
                                <div className="position-relative top-50 start-50">
                                    <Spinner color="primary"></Spinner>
                                </div>
                            )}
                        </Card>
                    </Col>

                    <Col lg={4}>
                        <Card className="h-25">
                            <LineChart dataColors='["--vz-primary"]' series={[]} categories={[]} title={""} />
                        </Card>
                        <Card className="h-75">
                            <CardHeader>
                                <h5>Precio Historico</h5>
                            </CardHeader>
                            <LineChart dataColors='["--vz-primary"]' series={[]} categories={[]} title={""} />
                        </Card>
                    </Col>

                    <Col lg={4}>
                        <div className="text-bg-danger h-100">Hola</div>
                    </Col>
                </Row>

                <Row className="mt-4">
                    <Col lg={6}>
                        <Card>
                            <CustomTable columns={[]} data={[]}></CustomTable>
                        </Card>
                    </Col>

                    <Col lg={6}>
                    <Card>
                        <CustomTable columns={[]} data={[]}></CustomTable>
                    </Card>
                    </Col>
                </Row>


            </Container>
        </div>
    );
};

export default ProductDetails