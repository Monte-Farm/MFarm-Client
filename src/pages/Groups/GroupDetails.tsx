import { ConfigContext } from "App";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import KPI from "Components/Common/Graphics/Kpi";
import { FaMars, FaPiggyBank, FaVenus } from "react-icons/fa";
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";

const GroupDetails = () => {
    document.title = 'Detalles de grupo | Management System';
    const { group_id } = useParams();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [groupData, setGroupData] = useState<any>({});
    const [activeTab, setActiveTab] = useState("1");

    const toggleTab = (tab: string) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const groupAttibutes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        {
            key: 'area',
            label: 'Area',
            type: 'text',
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
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        { key: 'creation_date', label: 'Fecha de creacion', type: 'date' },
        { key: 'observations', label: 'Observaciones', type: 'text' },
    ]

    const pigColumns: Column<any>[] = [
            { header: 'Codigo', accessor: 'code', type: 'text' },
            { header: 'Raza', accessor: 'breed', type: 'text' },
            { header: 'Fecha de N.', accessor: 'birthdate', type: 'date' },
            {
                header: 'Sexo',
                accessor: 'sex',
                render: (value: string) => (
                    <Badge color={value === 'macho' ? "info" : "danger"}>
                        {value === 'macho' ? "♂ Macho" : "♀ Hembra"}
                    </Badge>
                ),
            },
            { header: 'Peso actual', accessor: 'weight', type: 'number' },
            {
                header: 'Estado',
                accessor: 'status',
                isFilterable: true,
                render: (value: string) => {
                    let color = 'secondary';
                    let label = value;
    
                    switch (value) {
                        case 'vivo':
                            color = 'success';
                            label = 'Vivo';
                            break;
                        case 'descartado':
                            color = 'warning';
                            label = 'Descartado';
                            break;
                        case 'muerto':
                            color = 'danger';
                            label = 'Muerto';
                            break;
                    }
    
                    return <Badge color={color}>{label}</Badge>;
                },
            },
        ]


    const fetchData = async () => {
        if (!configContext || !userLogged) return
        try {
            const groupResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${group_id}`)
            setGroupData(groupResponse.data.data)
        } catch (error) {
            console.error('Error fetching data: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false);
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
                <BreadCrumb title={"Detalles de grupo"} pageTitle={"Grupos"} />

                <div className="w-100 mb-4">
                    <Button className="btn-danger" onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-2" />
                        Regresar
                    </Button>
                </div>

                <div className="p-3 bg-white rounded">
                    <Nav tabs className="nav-tabs nav-justified">
                        <NavItem>
                            <NavLink style={{ cursor: "pointer" }} className={classnames({ active: activeTab === "1", })} onClick={() => { toggleTab("1"); }} >
                                Información del grupo
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink style={{ cursor: "pointer" }} className={classnames({ active: activeTab === "2", })} onClick={() => { toggleTab("2"); }} >
                                Alimentación
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink style={{ cursor: "pointer" }} className={classnames({ active: activeTab === "3", })} onClick={() => { toggleTab("3"); }} >
                                Medicación
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>



                <TabContent activeTab={activeTab} className="justified-tabs mt-3">
                    <TabPane tabId="1">
                        <div className="d-flex gap-2">
                            <div className="w-100">
                                <Card className="">
                                    <CardHeader className="bg-light">
                                        <h5>Datos del grupo</h5>
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={groupAttibutes} object={groupData} />
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="w-100">
                                <Card className="">
                                    <CardHeader className="bg-light">
                                        <h5>Datos del grupo</h5>
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={groupAttibutes} object={groupData} />
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="w-100">
                                <div className="d-flex gap-3">
                                    <KPI title={"Machos"} value={groupData.maleCount} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                    <KPI title={"Hembras"} value={groupData.femaleCount} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                    <KPI title={"Total"} value={groupData.pigCount} icon={FaPiggyBank} bgColor="#F0F0F0" iconColor="#6C757D" />
                                </div>

                                <Card className="m-0">
                                    <CardBody>
                                        <CustomTable columns={pigColumns} data={groupData.pigsInGroup} showSearchAndFilter={false} />
                                    </CardBody>
                                </Card>
                            </div>
                        </div>

                    </TabPane>
                </TabContent>

            </Container>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default GroupDetails;