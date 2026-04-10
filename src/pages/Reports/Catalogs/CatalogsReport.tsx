import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader, Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import { getLoggedinUser } from "helpers/api_helper";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import ReportPageLayout from "Components/Common/Shared/ReportPageLayout";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import classnames from "classnames";

interface SupplierRecord {
    _id: string;
    name: string;
    contact: string;
    phone: string;
    email: string;
    address: string;
    totalPurchases: number;
    totalSpent: number;
    lastPurchaseDate: string;
    status: boolean;
}

interface ClientRecord {
    _id: string;
    name: string;
    contact: string;
    phone: string;
    email: string;
    address: string;
    totalSales: number;
    totalRevenue: number;
    lastSaleDate: string;
    status: boolean;
}

interface CatalogsKpis {
    totalSuppliers: number;
    activeSuppliers: number;
    totalClients: number;
    activeClients: number;
}

const CatalogsReport = () => {
    document.title = "Catalogos | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
    const [clients, setClients] = useState<ClientRecord[]>([]);
    const [kpis, setKpis] = useState<CatalogsKpis>({
        totalSuppliers: 0, activeSuppliers: 0, totalClients: 0, activeClients: 0,
    });

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/catalogs/${userLogged.farm_assigned}`
            );
            const data = res.data.data;
            setSuppliers(data.suppliers || []);
            setClients(data.clients || []);
            setKpis(data.kpis);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar los datos del reporte." });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/catalogs/pdf/${userLogged.farm_assigned}?orientation=portrait&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const supplierColumns: Column<SupplierRecord>[] = [
        { header: "Nombre", accessor: "name", type: "text", isFilterable: true },
        { header: "Contacto", accessor: "contact", type: "text", isFilterable: true },
        { header: "Telefono", accessor: "phone", type: "text" },
        { header: "Email", accessor: "email", type: "text" },
        { header: "Compras", accessor: "totalPurchases", type: "number" },
        { header: "Total Gastado", accessor: "totalSpent", type: "currency", bgColor: "#e8f5e9" },
        { header: "Ultima Compra", accessor: "lastPurchaseDate", type: "date" },
        {
            header: "Estado", accessor: "status", type: "text",
            render: (v: boolean) => (
                <Badge color={v ? "success" : "secondary"}>{v ? "Activo" : "Inactivo"}</Badge>
            ),
        },
    ];

    const clientColumns: Column<ClientRecord>[] = [
        { header: "Nombre", accessor: "name", type: "text", isFilterable: true },
        { header: "Contacto", accessor: "contact", type: "text", isFilterable: true },
        { header: "Telefono", accessor: "phone", type: "text" },
        { header: "Email", accessor: "email", type: "text" },
        { header: "Ventas", accessor: "totalSales", type: "number" },
        { header: "Total Ingreso", accessor: "totalRevenue", type: "currency", bgColor: "#e8f5e9" },
        { header: "Ultima Venta", accessor: "lastSaleDate", type: "date" },
        {
            header: "Estado", accessor: "status", type: "text",
            render: (v: boolean) => (
                <Badge color={v ? "success" : "secondary"}>{v ? "Activo" : "Inactivo"}</Badge>
            ),
        },
    ];

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Catalogos"
            pageTitle="Reportes"
            onGeneratePdf={() => handleGeneratePdf()}
            pdfTitle="Reporte - Catalogos"
            showDateFilter={false}
        >
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Total Proveedores"
                        value={kpis.totalSuppliers}
                        icon={<i className="ri-truck-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Proveedores Activos"
                        value={kpis.activeSuppliers}
                        icon={<i className="ri-check-line fs-4 text-success"></i>}
                        animateValue
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Total Clientes"
                        value={kpis.totalClients}
                        icon={<i className="ri-user-line fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Clientes Activos"
                        value={kpis.activeClients}
                        icon={<i className="ri-user-follow-line fs-4 text-success"></i>}
                        animateValue
                        iconBgColor="#E8F5E9"
                    />
                </Col>
            </Row>

            <Card>
                <CardHeader>
                    <Nav tabs className="card-header-tabs">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => setActiveTab("1")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-truck-line me-1"></i> Proveedores ({suppliers.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-user-line me-1"></i> Clientes ({clients.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={supplierColumns} data={suppliers} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={clientColumns} data={clients} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                    </TabContent>
                </CardBody>
            </Card>

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </ReportPageLayout>
    );
};

export default CatalogsReport;
