import { ConfigContext } from "App";
import { Attribute, SubwarehouseData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import ObjectDetails from "Components/Common/ObjectDetails";
import ObjectDetailsHorizontal from "Components/Common/ObjectDetailsHorizontal";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Col, Container, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import classnames from "classnames";
import { Column } from "common/data/data_types";

const subwarehouseAttributes: Attribute[] = [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'manager', label: 'Responsable', type: 'text' },
    { key: 'location', label: 'Ubicación', type: 'text' },
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
    const [subwarehouseDisplay, setSubwarehouseDisplay] = useState<SubwarehouseData>();

    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 3) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }


    const inventoryColumns: Column<any>[] = [
        { header: 'Código', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
        { header: 'Existencias', accessor: 'quantity', isFilterable: true, type: 'number' },
        { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true, type: 'text' },
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

    const incomesColumns: Column<any>[] = [
        { header: 'Identificador', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Fecha de entrada', accessor: 'date', isFilterable: true, type: 'text' },
        { header: 'Origen', accessor: 'originName', isFilterable: true, type: 'text' },
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

    const outcomesColumns: Column<any>[] = [
        { header: 'Identificador', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Fecha de Salida', accessor: 'date', isFilterable: true, type: 'text' },
        { header: 'Destino', accessor: 'warehouseDestiny', isFilterable: true, type: 'text' },
        { header: 'Tipo de Salida', accessor: 'outcomeType', isFilterable: true, type: 'text' },
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

    const handleFetchSubwarehouseDisplay = async () => {
        if (!configContext || !subwarehouseDetails) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_id/${subwarehouseDetails?.manager}`);
            const manager = response.data.data
            if (subwarehouseDetails) {
                setSubwarehouseDisplay({ ...subwarehouseDetails, manager: manager.name });
            }
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

    const handlePrintInventory = async () => {
        if (!configContext) return;

        try {

            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/generate_inventory_report/${id_subwarehouse}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'inventario.pdf');
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al generar el reporte, inténtelo más tarde.');
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

    useEffect(() => {
        handleFetchSubwarehouseDisplay()
    }, [subwarehouseDetails])


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
                <BreadCrumb title={`Detalles de ${subwarehouseDetails?.name}`} pageTitle={"Subalmacénes"} />

                <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                        <Button className="farm-secondary-button" onClick={handleReturn}>
                            <i className=" ri-arrow-left-line me-3"></i>
                            Regresar
                        </Button>
                    </div>
                </div>

                <Card className="mt-3 pt-2" style={{ backgroundColor: '#A3C293' }}>
                    <CardBody>
                        <ObjectDetailsHorizontal attributes={subwarehouseAttributes} object={subwarehouseDisplay || {}} />
                    </CardBody>
                </Card>

                <Card>


                    <div className="step-arrow-nav mb-4">
                        <Nav className="nav-pills custom-nav nav-justified fs-4">
                            <NavItem>
                                <NavLink
                                    href="#"
                                    id="step-inventory-tab"
                                    className={classnames({
                                        active: activeStep === 1,
                                        done: activeStep > 1,
                                    })}
                                    onClick={() => toggleArrowTab(1)}
                                    aria-selected={activeStep === 1}
                                    aria-controls="step-inventory-tab"
                                >
                                    Inventario
                                </NavLink>
                            </NavItem>

                            <NavItem>
                                <NavLink
                                    href="#"
                                    id="step-incomes-tab"
                                    className={classnames({
                                        active: activeStep === 2,
                                        done: activeStep > 2,
                                    })}
                                    onClick={() => toggleArrowTab(2)}
                                    aria-selected={activeStep === 2}
                                    aria-controls="step-incomes-tab"
                                >
                                    Entradas
                                </NavLink>
                            </NavItem>

                            <NavItem>
                                <NavLink
                                    href="#"
                                    id="step-outcomes-tab"
                                    className={classnames({
                                        active: activeStep === 3,
                                    })}
                                    onClick={() => toggleArrowTab(3)}
                                    aria-selected={activeStep === 3}
                                    aria-controls="step-outcomes-tab"
                                >
                                    Salidas
                                </NavLink>
                            </NavItem>
                        </Nav>
                    </div>

                    <TabContent activeTab={activeStep}>
                        <TabPane id="step-inventory-tab" tabId={1}>
                            <div className="d-flex gap-2 me-3">
                                <Button className="farm-primary-button ms-auto" onClick={handlePrintInventory}>
                                    Imprimir Inventario
                                </Button>
                            </div>
                            <div className="d-flex-column gap-3">
                                <Card style={{ height: '50vh' }}>
                                    <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                                        <CustomTable columns={inventoryColumns} data={subwarehouseInventory} showPagination={false} />
                                    </CardBody>
                                </Card>
                            </div>
                        </TabPane>

                        <TabPane id="step-incomes-tab" tabId={2}>
                            <Card style={{ height: '50vh' }}>
                                <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                                    <CustomTable columns={incomesColumns} data={subwarehouseIncomes} rowsPerPage={5} showPagination={false} />
                                </CardBody>
                            </Card>
                        </TabPane>

                        <TabPane id="step-outcomes-tab" tabId={3}>
                            <Card style={{ height: '50vh' }}>
                                <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                                    <CustomTable columns={outcomesColumns} data={subwarehouseOutcomes} rowsPerPage={5} showPagination={false} />
                                </CardBody>
                            </Card>
                        </TabPane>

                    </TabContent>

                </Card>

            </Container>
        </div>
    )
}


export default SubwarehouseDetails;