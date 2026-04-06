import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { GroupData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, Container, UncontrolledTooltip } from "reactstrap";
import KPI from "Components/Common/Graphics/Kpi";
import { FaArrowDown, FaArrowUp, FaBalanceScale, FaLayerGroup, FaMars, FaPiggyBank, FaVenus, FaWeight } from "react-icons/fa";

const ViewSoldGroups = () => {
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser()
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [soldGroups, setSoldGroups] = useState<GroupData[]>([])
    const [stats, setStats] = useState<any>({})

    const groupsColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        { header: 'Nombre', accessor: 'name', type: 'text', isFilterable: true },
        {
            header: 'Área',
            accessor: 'area',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.area) {
                    case "gestation":
                        color = "info";
                        text = "Gestación";
                        break;
                    case "farrowing":
                        color = "primary";
                        text = "Paridera";
                        break;
                    case "maternity":
                        color = "primary";
                        text = "Maternidad";
                        break;
                    case "weaning":
                        color = "success";
                        text = "Destete";
                        break;
                    case "nursery":
                        color = "warning";
                        text = "Preceba / Levante inicial";
                        break;
                    case "fattening":
                        color = "dark";
                        text = "Ceba / Engorda";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo / Recría";
                        break;
                    case "boars":
                        color = "info";
                        text = "Área de verracos";
                        break;
                    case "quarantine":
                        color = "danger";
                        text = "Cuarentena / Aislamiento";
                        break;
                    case "hospital":
                        color = "danger";
                        text = "Hospital / Enfermería";
                        break;
                    case "shipping":
                        color = "secondary";
                        text = "Corrales de venta / embarque";
                        break;
                    case "exit":
                        color = "secondary";
                        text = "Salida";
                        break;
                    case "sale":
                        color = "success";
                        text = "Venta";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        { header: 'Fecha de creación', accessor: 'creationDate', type: 'date', isFilterable: true },
        {
            header: 'Estado',
            accessor: 'status',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "N/A";

                switch (row.status) {
                    case "weaning":
                        color = "info";
                        text = "En destete";
                        break;
                    case "ready_to_grow":
                        color = "primary";
                        text = "Listo para crecimiento";
                        break;
                    case "grow_overdue":
                        color = "warning";
                        text = "Retradado en crecimiento";
                        break;
                    case "growing":
                        color = "success";
                        text = "En crecimiento y ceba";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo";
                        break;
                    case "ready_for_sale":
                        color = "success";
                        text = "Listo para venta";
                        break;
                    case "sale":
                        color = "success";
                        text = "En venta";
                        break;
                    case "sold":
                        color = "success";
                        text = "Vendido";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: 'No. de hembras',
            accessor: 'femaleCount',
            type: 'text',
            isFilterable: true,
            bgColor: "#fce4ec"
        },
        {
            header: 'No. de machos',
            accessor: 'maleCount',
            type: 'text',
            isFilterable: true,
            bgColor: "#e3f2fd"
        },
        {
            header: 'Total',
            accessor: 'pigCount',
            type: 'text',
            isFilterable: true,
            bgColor: "#e8f5e8"
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`details-button-${row._id}`} className="btn-icon btn-success" onClick={() => navigate(`/groups/group_details/${row._id}`)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`details-button-${row._id}`}>
                        Ver detalles
                    </UncontrolledTooltip>
                </div >
            ),
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return
        try {
            setLoading(true)
            const [groupResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/sold_groups/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/group_alive_stats/${userLogged.farm_assigned}/sold`),
            ])
            setSoldGroups(groupResponse.data.data)
            setStats(statsResponse.data.data)
        } catch (error) {
            console.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intenelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver grupos de cerdos vendidos"} pageTitle={"Vendidos"} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI title="Grupos" value={stats?.population?.totalGroups ?? 0} icon={FaLayerGroup} bgColor="#e8f4fd" iconColor="#0d6efd" />
                    <KPI title="Cerdos totales" value={stats?.population?.totalPigs ?? 0} icon={FaPiggyBank} bgColor="#fff3cd" iconColor="#ffc107" />
                    <KPI title="Cerdos promedio por grupo" value={stats?.population?.avgPigsPerGroup ?? 0} icon={FaBalanceScale} bgColor="#e6f7e6" iconColor="#28a745" />
                    <KPI title="Mínimo por grupo" value={stats?.population?.minPigsPerGroup ?? 0} icon={FaArrowDown} bgColor="#f8d7da" iconColor="#dc3545" />
                    <KPI title="Machos" value={stats?.population?.totalMales ?? 0} icon={FaMars} bgColor="#e7f1ff" iconColor="#0a58ca" />
                    <KPI title="Máximo por grupo" value={stats?.population?.maxPigsPerGroup ?? 0} icon={FaArrowUp} bgColor="#d1e7dd" iconColor="#198754" />
                    <KPI title="Hembras" value={stats?.population?.totalFemales ?? 0} icon={FaVenus} bgColor="#fde7f3" iconColor="#d63384" />
                    <KPI title="Peso promedio por cerdo (kg)" value={stats?.avgWeight?.toFixed(1) ?? 0} icon={FaWeight} bgColor="#ede9fe" iconColor="#6f42c1" />
                </div>

                <Card>
                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {soldGroups.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <CustomTable columns={groupsColumns} data={soldGroups} showPagination={true} rowsPerPage={7} />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#6c757d", padding: "2rem", flexDirection: "column", }}>
                                <FiInbox size={56} style={{ marginBottom: 12, opacity: 0.8 }} />
                                <h5 style={{ marginBottom: 6 }}>No hay grupos vendidos</h5>
                                <p style={{ maxWidth: 360, margin: 0, fontSize: 15 }}>
                                    Actualmente no existen grupos de cerdos vendidos para mostrar.
                                </p>
                            </div>
                        )}
                    </CardBody>
                </Card>

            </Container>
        </div>
    )
}

export default ViewSoldGroups;
