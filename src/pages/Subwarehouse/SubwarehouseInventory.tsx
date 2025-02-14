import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button, Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'


const SubwarehouseInventory = () => {
    document.title = 'Inventario de Subalmacen | Subalmacen';
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(true)
    const [subwarehouseInventory, setSubwarehouseInventory] = useState([])

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


    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const handleFetchWarehouseInventory = async () => {
        if (!configContext || !configContext.userLogged) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${configContext.userLogged.assigment}`);
            setSubwarehouseInventory(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener el inventario del subalmacén, intentelo más tarde');
        } finally {
            setLoading(false)
        }
    };


    const handleClicProductDetails = (row: any) => {
        if (!configContext || !configContext.userLogged) return;
        history(`/warehouse/inventory/product_details?warehouse=${configContext?.userLogged.assigment}&product=${row.id}`)
    }

    useEffect(() => {
        if (!configContext || !configContext.userLogged) return;
        document.body.style.overflow = 'hidden';
        handleFetchWarehouseInventory();

        return () => {
            document.body.style.overflow = '';
        };
    }, [configContext])



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
                <BreadCrumb title={"Inventario"} pageTitle={"Subalmacén"} />


                <div className="d-flex-column gap-3 mt-4">
                    <Card className="rounded" style={{ height: '80vh' }}>
                        <CardHeader>
                            <h4>Inventario</h4>
                        </CardHeader>
                        <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                            <CustomTable columns={inventoryColumns} data={subwarehouseInventory} rowsPerPage={10} showPagination={false}/>
                        </CardBody>
                    </Card>
                </div>

            </Container>
        </div>
    )
}

export default SubwarehouseInventory