import { ConfigContext } from "App";
import { SubwarehouseData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import SubwarehouseForm from "Components/Common/Forms/SubwarehouseForm";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import { getLoggedinUser } from "helpers/api_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import CustomTable from "Components/Common/Tables/CustomTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";

const getSubwarehouseTypeLabel = (type: string) => {
    switch (type) {
        case "medical":
            return "Medico";
        case "feed":
            return "Alimento";
        case "cleaning":
            return "Limpieza";
        case "supplies":
            return "Insumos";
        default:
            return type;
    }
};


const ViewSubwarehouse = () => {
    document.title = "Ver Subalmacénes | Subalmacén"
    const history = useNavigate();
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser();

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, details: false, update: false, delete: false });
    const [subwarehouses, setSubwarehouses] = useState([])
    const [loading, setLoading] = useState<boolean>(true);
    const [subwarehouseStatistics, setSubwarehouseStatistics] = useState({
        totalSubwarehouses: 0,
        activeSubwarehouses: 0,
        inactiveSubwarehouses: 0,
        activationRate: 0
    });
    const [chartData, setChartData] = useState({
        statusData: [] as DonutDataItem[],
        statusLegendItems: [] as DonutLegendItem[],
        typeData: [] as DonutDataItem[],
        typeLegendItems: [] as DonutLegendItem[]
    });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const subWarehousesColumns: Column<any>[] = [
        { header: 'Código', accessor: 'code', isFilterable: true, type: 'text' },
        { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
        {
            header: 'Responsable',
            accessor: 'manager',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.manager.name} {row.manager.lastname}</span>
        },
        {
            header: 'Tipo de subalmacen',
            accessor: 'type',
            isFilterable: true,
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "medical":
                        color = "info";
                        label = "Medico";
                        break;
                    case "feed":
                        color = "success";
                        label = "Alimento";
                        break;
                    case "cleaning":
                        color = "primary";
                        label = "Limpieza";
                        break;
                    case "supplies":
                        color = "warning";
                        label = "Insumos";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Estado",
            accessor: "status",
            render: (value: boolean) => (
                <Badge color={value === true ? "success" : "danger"}>
                    {value === true ? "Activo" : "Inactivo"}
                </Badge>
            ),
            isFilterable: true,
        },
        {
            header: 'Acciones',
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => history(`/subwarehouse/subwarehouse_details/${row._id}`)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>

                    {/* <Button className="farm-primary-button btn-icon" disabled={!row.status} onClick={() => { setSelectedSubwarehouse(row); toggleModal('update'); }}>
                        <i className="ri-pencil-fill align-middle" />
                    </Button> */}
                </div>
            )
        }
    ]

    const fetchSubwarehouses = async () => {
        if (!configContext || !userLogged) return;

        try {
            setLoading(true)
            const [subwarehousesResponse, statisticsResponse, chartsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/farm_subwarehouse_statistics/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/farm_subwarehouse_charts/${userLogged.farm_assigned}`)
            ]);

            const warehouses = subwarehousesResponse.data.data;
            setSubwarehouses(warehouses)

            setSubwarehouseStatistics(statisticsResponse.data.data.data)

            const chartsData = chartsResponse.data.data.data;

            const statusData: DonutDataItem[] = [
                { id: 'active', label: 'Activos', value: chartsData.statusData.active || 0, color: '#10b981' },
                { id: 'inactive', label: 'Inactivos', value: chartsData.statusData.inactive || 0, color: '#ef4444' }
            ];

            const totalSubwarehouses = (chartsData.statusData.active || 0) + (chartsData.statusData.inactive || 0);

            const statusLegendItems: DonutLegendItem[] = [
                {
                    label: 'Activos',
                    value: (chartsData.statusData.active || 0).toString(),
                    percentage: totalSubwarehouses > 0 ? `${(((chartsData.statusData.active || 0) / totalSubwarehouses) * 100).toFixed(1)}%` : '0%'
                },
                {
                    label: 'Inactivos',
                    value: (chartsData.statusData.inactive || 0).toString(),
                    percentage: totalSubwarehouses > 0 ? `${(((chartsData.statusData.inactive || 0) / totalSubwarehouses) * 100).toFixed(1)}%` : '0%'
                }
            ];

            const typeData: DonutDataItem[] = [];
            const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#f43f5e', '#a855f7', '#6b7280'];

            if (chartsData.typeData) {
                Object.entries(chartsData.typeData).forEach(([type, count], index) => {
                    const countValue = Number(count);
                    if (countValue > 0) { // Solo incluir tipos con datos
                        typeData.push({
                            id: type,
                            label: getSubwarehouseTypeLabel(type),
                            value: countValue,
                            color: colors[index % colors.length]
                        });
                    }
                });
            }

            const typeLegendItems: DonutLegendItem[] = typeData.map(item => ({
                label: item.label,
                value: item.value.toString(),
                percentage: totalSubwarehouses > 0 ? `${((item.value / totalSubwarehouses) * 100).toFixed(1)}%` : '0%'
            }));

            setChartData({
                statusData,
                statusLegendItems,
                typeData,
                typeLegendItems
            });

        } catch (error) {
            console.error('Error fetching subwarehouses:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al obtener los datos de los subalmacenes.' });
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        fetchSubwarehouses();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Subalmacénes"} pageTitle={"Ver Subalmacénes"}></BreadCrumb>

                {/* KPIs Section */}
                <div className="row">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Total de Subalmacenes"
                            value={subwarehouseStatistics?.totalSubwarehouses}
                            icon={<i className="ri-store-2-line fs-20 text-primary"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Subalmacenes Activos"
                            value={subwarehouseStatistics?.activeSubwarehouses}
                            icon={<i className="ri-checkbox-circle-line fs-20 text-success"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Subalmacenes Inactivos"
                            value={subwarehouseStatistics?.inactiveSubwarehouses}
                            icon={<i className="ri-close-circle-line fs-20 text-danger"></i>}
                            iconBgColor="#FEE2E2"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Tasa de Activación"
                            value={subwarehouseStatistics?.activationRate}
                            suffix="%"
                            decimals={1}
                            icon={<i className="ri-percent-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                </div>

                {/* Charts Section */}
                <div className="row mb-4">
                    <div className="col-xl-6">
                        <DonutChartCard
                            title="Subalmacenes por Tipo"
                            data={chartData.typeData}
                            legendItems={chartData.typeLegendItems}
                            height={200}
                        />
                    </div>
                    <div className="col-xl-6">
                        <DonutChartCard
                            title="Estado de Subalmacenes"
                            data={chartData.statusData}
                            legendItems={chartData.statusLegendItems}
                            height={200}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2" />
                                Agregar Subalmacén
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={subwarehouses.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {subwarehouses.length === 0 ? (
                            <>
                                <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay productos registrados en el inventario</span>
                            </>
                        ) : (
                            <CustomTable columns={subWarehousesColumns} data={subwarehouses} showPagination={false} />
                        )}
                    </CardBody>
                </Card>

                {/* Modal Create */}
                <Modal size="lg" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("create")}>Nuevo Subalmacén</ModalHeader>
                    <ModalBody>
                        <SubwarehouseForm onCancel={() => toggleModal("create", false)} onSave={() => { toggleModal('create'); fetchSubwarehouses(); }} />
                    </ModalBody>
                </Modal>

                {/* Modal Update
                <Modal size="lg" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("update")}>Modificar Subalmacén</ModalHeader>
                    <ModalBody>
                        <SubwarehouseForm onSave={() => { toggleModal('update'); fetchSubwarehouses(); }} onCancel={() => toggleModal("update", false)} isCodeDisabled={true} />
                    </ModalBody>
                </Modal> */}

            </Container>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewSubwarehouse;