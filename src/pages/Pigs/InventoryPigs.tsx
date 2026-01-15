import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import BasicPieChart from "Components/Common/Graphics/BasicPieChart";
import KPI from "Components/Common/Graphics/Kpi";
import LineChartCard from "Components/Common/Graphics/LineChartCard";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { StatCard } from "Components/Common/Shared/StatCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { IconBaseProps } from "react-icons";
import { FaAccessibleIcon, FaArrowDown, FaArrowUp, FaBalanceScale, FaChartLine, FaPiggyBank } from "react-icons/fa";
import { Badge, Card, CardBody, CardHeader, Container } from "reactstrap";

const InventoryPigs = () => {
    document.title = 'Inventario de cerdos | Management System'
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ update: false, viewPDF: false, selectMedicationMode: false, asignSingle: false, medicationPackage: false, });
    const [pigsInventory, setPigsInventory] = useState<any[]>([])
    const [pigStats, setPigStats] = useState<any>({})

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const pigsInventoryColumns: Column<any>[] = [
        {
            header: 'Etapa',
            accessor: 'stage',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "piglet":
                        color = "info";
                        label = "Lechón";
                        break;
                    case "weaning":
                        color = "warning";
                        label = "Destete";
                        break;
                    case "fattening":
                        color = "primary";
                        label = "Engorda";
                        break;
                    case "breeder":
                        color = "success";
                        label = "Reproductor";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: 'Estado',
            accessor: 'status',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let label = '';

                switch (row.status) {
                    case "dead":
                        color = "danger";
                        label = "Muerto";
                        break;
                    case "alive":
                        color = "success";
                        label = "Vivo";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            }
        },
        { header: 'Peso actual', accessor: 'currentWeight', type: 'number' },
    ]

    const fetchData = async () => {
        if (!configContext) return
        try {
            setLoading(true)
            const pigsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig_inventory/find_by_farm/${userLogged.farm_assigned}`)
            setPigsInventory(pigsResponse.data.data);

            const statsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig_inventory/get_inventory_pig_stats/${userLogged.farm_assigned}`)
            setPigStats(statsResponse.data.data)
        } catch (error) {
            console.error('Error fetching data')
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
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
                <BreadCrumb title={'Inventario de cerdos'} pageTitle={'Cerdos'} />

                <div className="d-flex gap-3">
                    <KPI title="Total de cerdos" value={pigStats?.generalStats[0]?.total} icon={FaPiggyBank} bgColor="#EFF6FF" iconColor="#2563EB" />
                    <KPI title="Peso promedio" value={pigStats?.generalStats[0]?.avgWeight} icon={FaBalanceScale} bgColor="#E0F2FE" iconColor="#0284C7" />
                    <KPI title="Peso mínimo" value={pigStats?.generalStats[0]?.minWeight} icon={FaArrowDown} bgColor="#FEF3C7" iconColor="#D97706" />
                    <KPI title="Peso máximo" value={pigStats?.generalStats[0]?.maxWeight} icon={FaArrowUp} bgColor="#ECFDF5" iconColor="#16A34A" />

                    <StatCard
                        title="Registros este mes"
                        value={pigStats?.monthlyComparison[0].currentMonth}
                        suffix=""
                        change={pigStats?.monthlyComparison[0].percentageChange}
                        changeText="vs. mes anterior"
                        icon={<FaChartLine className="text-info" size={22} />}
                    />

                </div>

                <div>
                    <LineChartCard
                        stats={pigStats}
                        type="inventory"
                        title="Cerdos registrados"
                        yLabel="Cantidad"
                    />

                </div>

                <div className="d-flex gap-3">
                    <BasicPieChart title={"Cerdos por raza"}
                        data={pigStats?.inventoryByStage?.map((s: { stage: any; count: any }) => ({
                            id: s.stage,
                            value: s.count,
                        })) ?? []}
                    />

                    <BasicPieChart title={"Peso promedio por raza"}
                        data={pigStats?.avgWeightByStage?.map((s: { stage: any; avgWeight: any }) => ({
                            id: s.stage,
                            value: s.avgWeight,
                        })) ?? []}
                    />
                </div>

                <Card className="">
                    <CardHeader>
                        <h5>Cerdos en el inventario</h5>
                    </CardHeader>
                    <CardBody className="">
                        <CustomTable columns={pigsInventoryColumns} data={pigsInventory} showPagination={true} rowsPerPage={6} />
                    </CardBody>
                </Card>
            </Container>
        </div>
    )
}

export default InventoryPigs;