import { ConfigContext } from "App";
import { SubwarehouseData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import ObjectDetails from "Components/Common/ObjectDetails";
import ObjectDetailsHorizontal from "Components/Common/ObjectDetailsHorizontal";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'

const subwarehouseAttributes = [
    { key: 'id', label: 'Identificador' },
    { key: 'name', label: 'Nombre' },
    { key: 'manager', label: 'Responsable' },
    { key: 'location', label: 'Ubicación' },
    { key: 'status', label: 'Estado' }
]

const SubwarehouseDetails = () => {
    document.title = "Detalles de Subalmacén | Subalmacén"
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const { id_subwarehouse } = useParams();
    const [subwarehouseDetails, setSubwarehouseDetails] = useState<SubwarehouseData>();
    const [subwarehouseInventory, setSubwarehouseInventory] = useState([])
    const [subwarehouseIncomes, setSubwarehouseIncomes] = useState([])
    const [subwarehouseOutcomes, setSubwarehouseOutcomes] = useState([])
    const [loading, setLoading] = useState<boolean>(true);


    const inventoryColumns = [
        { header: 'Código', accessor: 'id', isFilterable: true },
        { header: 'Nombre', accessor: 'name', isFilterable: true },
        { header: 'Existencias', accessor: 'quantity', isFilterable: true },
        { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true },
        {
            header: 'Acciones',
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleClicProductDetails(row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const incomesColumns = [
        { header: 'Identificador', accessor: 'id', isFilterable: true },
        { header: 'Fecha de entrada', accessor: 'date', isFilterable: true },
        { header: 'Origen', accessor: 'originName', isFilterable: true },
        {
            header: 'Acciones',
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleClicIncomeDetails(row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const outcomesColumns = [
        { header: 'Identificador', accessor: 'id', isFilterable: true },
        { header: 'Fecha de Salida', accessor: 'date', isFilterable: true },
        { header: 'Destino', accessor: 'warehouseDestiny', isFilterable: true },
        {
            header: 'Acciones',
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleClicOutcomeDetails(row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]


    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const handleFetchSubwarehouseDetails = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${id_subwarehouse}`);
            setSubwarehouseDetails(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener la información del subalmacén, intentelo más tarde');
        }
    };


    const handleFetchWarehouseInventory = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${id_subwarehouse}`);
            setSubwarehouseInventory(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener el inventario del subalmacén, intentelo más tarde');
        }
    };


    const handleFetchWarehouseIncomes = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_warehouse_incomes/${id_subwarehouse}`);
            setSubwarehouseIncomes(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener las entradas, intentelo más tarde');
        }
    };


    const handleFetchWarehouseOutcomes = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_warehouse_outcomes/${id_subwarehouse}`);
            setSubwarehouseOutcomes(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener las salidas, intentelo más tarde');
        }
    };


    const handleClicProductDetails = (row: any) => {
        history(`/warehouse/inventory/product_details?warehouse=${id_subwarehouse}&product=${row.id}`)
    }

    const handleClicIncomeDetails = (row: any) => {
        history(`/warehouse/incomes/income_details/${row.id}`)
    }

    const handleClicOutcomeDetails = (row: any) => {
        history(`/warehouse/outcomes/outcome_details/${row.id}`)
    }

    const handleReturn = () => {
        if (window.history.length > 1) {
            history(-1);
        } else {
            history('/subwarehouse/view_subwarehouse')
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([
                handleFetchSubwarehouseDetails(),
                handleFetchWarehouseInventory(),
                handleFetchWarehouseIncomes(),
                handleFetchWarehouseOutcomes(),
            ])

            setLoading(false);
        }

        fetchData();
    }, [])


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
                <BreadCrumb title={"Detalles de Subalmacén"} pageTitle={"Subalmacénes"} />

                <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                        <Button className="farm-secondary-button" onClick={handleReturn}>
                            <i className=" ri-arrow-left-line me-3"></i>
                            Regresar
                        </Button>
                    </div>
                </div>

                <div className="d-flex-column gap-3 mt-4">
                    <Card style={{ height: '40vh' }}>
                        <CardHeader>
                            <h4>Inventario</h4>
                        </CardHeader>
                        <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                            <CustomTable columns={inventoryColumns} data={subwarehouseInventory} showPagination={false} />
                        </CardBody>
                    </Card>
                </div>

                <div className=" mt-4">
                    <Row>
                        <Col lg={6}>
                            <Card style={{ height: '35vh' }}>
                                <CardHeader>
                                    <h4>Entradas</h4>
                                </CardHeader>
                                <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                                    <CustomTable columns={incomesColumns} data={subwarehouseIncomes} rowsPerPage={5} showPagination={false} />
                                </CardBody>
                            </Card>
                        </Col>

                        <Col lg={6}>
                        <Card style={{ height: '35vh' }}>
                                <CardHeader>
                                    <h4>Salidas</h4>
                                </CardHeader>
                                <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                                    <CustomTable columns={outcomesColumns} data={subwarehouseOutcomes} rowsPerPage={5} showPagination={false} />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>

            </Container>
        </div>
    )
}


export default SubwarehouseDetails;