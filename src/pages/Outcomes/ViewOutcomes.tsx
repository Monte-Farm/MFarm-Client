import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Container } from "reactstrap";

const ViewOutcomes = () => {
    document.title = 'Ver Salidas'
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const warehouseId = 'AG001'
    const [outcomes, setOutcomes] = useState([])

    const columns = [
        { header: 'Identificador', accessor: 'id', isFilterable: true },
        { header: 'Fecha de Salida', accessor: 'date', isFilterable: true },
        { header: 'Tipo de Salida', accessor: 'outcomeType', isFilterable: true },
        { header: 'Subalmacén de destino', accessor: 'warehouseDestiny', isFilterable: true },
        {
            header: 'Acciones', accessor: 'actions',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button color="secondary" className="btn-icon" onClick={() => handleClicOutcomeDetails(row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const handleFetchOutcomes = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_warehouse_outcomes/${warehouseId}`);
            setOutcomes(response.data.data);
        } catch (error) {
            history('/auth-500');
        }
    };


    const handleClicOutcomeDetails = (row: any) => {
        history(`/warehouse/outcomes/outcome_details/${row.id}`)
    }

    const handleClicAddOutcome = () => {
        history('/warehouse/outcomes/create_outcome')
    }

    useEffect(() => {
        handleFetchOutcomes();
    }, [])

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver Salidas"} pageTitle={"Salidas"} />

                <Card style={{ height: '80vh' }}>
                    <CardHeader>
                        <div className="d-flex ">
                            <h4>Salidas</h4>

                            <Button className="ms-auto" color="secondary" onClick={handleClicAddOutcome}>
                                <i className="ri-add-line me-2" />
                                Nueva Salida
                            </Button>
                        </div>

                    </CardHeader>
                    <CardBody>
                        <CustomTable columns={columns} data={outcomes} showSearchAndFilter={true} />
                    </CardBody>
                </Card>
            </Container>
        </div>
    )
}

export default ViewOutcomes;