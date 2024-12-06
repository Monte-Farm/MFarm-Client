import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import LineChart from "Components/Common/LineChart";
import ObjectDetails from "Components/Common/ObjectDetails";
import Spinners from "Components/Common/Spinner";
import { APIClient } from "helpers/api_helper";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"
import { Button, Card, CardBody, CardHeader, Col, Container, Label, Row, Spinner } from "reactstrap"
import exampleImage from '../../assets/images/alimento.png'


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
                setProductDetails(response.data.data)
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
                    <Col lg={2}>
                        <Card className="h-100">
                            <CardBody>
                                {productDetails && loading === false ? (
                                    <ObjectDetails attributes={displayAttributes} object={productDetails} showImage={true} imageSrc={exampleImage} />
                                ) : (
                                    <div className="position-relative top-50 start-50">
                                        <Spinner color="primary"></Spinner>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={5}>
                        <Card className="h-100">
                            <CardHeader> <h4>Compras | Altas</h4></CardHeader>
                            <CardBody>
                                <CustomTable columns={[]} data={[]} showSearchAndFilter={false} />
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={5}>
                        <Card className="h-100">
                            <CardHeader> <h4>Ventas | Bajas</h4></CardHeader>
                            <CardBody>
                                <CustomTable columns={[]} data={[]} showSearchAndFilter={false} />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row className="mt-4">
                    <Col lg={6}>
                        <Card>
                            <CardHeader>
                                <div className="d-flex">
                                    <h4>Proveedor más reciente</h4>
                                    <Button className="ms-auto" color="secondary">
                                        Detalles de Proveedor
                                    </Button>
                                </div>

                            </CardHeader>

                            <CardBody>
                                <ObjectDetails attributes={[]} object={{}}></ObjectDetails>
                            </CardBody>
                        </Card>

                    </Col>

                    <Col lg={6}>

                    </Col>
                </Row>


            </Container>
            {/*<LineChart dataColors='["--vz-primary"]' series={[]} categories={[]} title={""} />*/}
        </div>
    );
};

export default ProductDetails