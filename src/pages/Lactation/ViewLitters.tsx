import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getLoggedinUser } from "helpers/api_helper";
import { config } from "process";
import { useContext, useEffect, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container } from "reactstrap";

const ViewLitters = () => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true)
    const [litters, setLitters] = useState<any[]>([])
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });

    const litterColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        { header: 'Fecha de nacimiento', accessor: 'birthDate', type: 'date', isFilterable: true },
        {
            header: 'Madre',
            accessor: 'mother',
            type: 'text',
            isFilterable: true,
            render: (_, row) => (
                <Button
                    className="text-underline fs-5"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/pigs/pig_details/${row.mother._id}`)
                    }}
                >
                    {row.mother.code} ↗
                </Button>
            )
        },
        { header: 'Machos', accessor: 'currentMale', type: 'text', isFilterable: true },
        { header: 'Hembras', accessor: 'currentFemale', type: 'text', isFilterable: true },
        {
            header: 'Registrada por',
            accessor: '',
            type: 'text',
            isFilterable: true,
            render: (_, row) => <span>{row.responsible.name} {row.responsible.lastname}</span>
        },
        {
            header: 'Estado',
            accessor: 'status',
            type: 'text',
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "active":
                        color = "warning";
                        label = "Lactando";
                        break;
                    case "weaned":
                        color = "success";
                        label = "Destetada";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => navigate(`/lactation/litter_details/${row._id}`)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const fetchLitter = async () => {
        if (!configContext || !userLogged) return
        try {
            setLoading(true)
            const litterResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/litter/found_by_farm/${userLogged.farm_assigned}`)
            setLitters(litterResponse.data.data)
        } catch (error) {
            console.error('Error fetching data: ', error)
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLitter()
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Camadas"} pageTitle={"Lactancia"} />

                <Card>
                    <CardHeader className="d-flex">
                        <h4>Camadas</h4>
                    </CardHeader>

                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {litters && litters.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <CustomTable columns={litterColumns} data={litters} showPagination={true} rowsPerPage={7} />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#888", }}>
                                <div>
                                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                                    <div>No hay camadas registradas</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>
        </div>
    )
}

export default ViewLitters;