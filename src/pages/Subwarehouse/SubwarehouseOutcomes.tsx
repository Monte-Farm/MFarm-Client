import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'


const SubwarehouseOutcomes = () => {
    document.title = "Detalles de Subalmacén | Subalmacén"
    const history = useNavigate();
    const configContext = useContext(ConfigContext);

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [subwarehouseOutcomes, setSubwarehouseOutcomes] = useState([])
    const [loading, setLoading] = useState<boolean>(true)

    const outcomesColumns = [
        { header: 'Identificador', accessor: 'id', isFilterable: true },
        { header: 'Fecha de Salida', accessor: 'date', isFilterable: true },
        { header: 'Motivo de Salida', accessor: 'outcomeType', isFilterable: true },
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


    const handleFetchWarehouseOutcomes = async () => {
        if (!configContext || !configContext.userLogged) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_warehouse_outcomes/${configContext.userLogged.assigment}`);
            setSubwarehouseOutcomes(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener las salidas, intentelo más tarde');
        } finally {
            setLoading(false)
        }
    };

    const handleClicOutcomeDetails = (row: any) => {
        history(`/warehouse/outcomes/outcome_details/${row.id}`)
    }

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        handleFetchWarehouseOutcomes();

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
                <BreadCrumb title={"Salidas"} pageTitle={"Subalmacén"} />

                <Card className="rounded" style={{ height: '80vh' }}>
                    <CardHeader>
                        <div className="d-flex">
                            <h4>Salidas</h4>
                            <Button className="ms-auto farm-primary-button" onClick={() => history('/subwarehouse/create_subwarehouse_outcome')}>
                                <i className="ri-add-line me-3" />
                                Nueva Salida
                            </Button>
                        </div>

                    </CardHeader>
                    <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                        <CustomTable columns={outcomesColumns} data={subwarehouseOutcomes} rowsPerPage={10} showPagination={false} />
                    </CardBody>
                </Card>

            </Container>
        </div>
    )
}

export default SubwarehouseOutcomes