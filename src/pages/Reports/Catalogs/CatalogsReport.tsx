import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Card, CardBody, CardHeader, Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import { useReportScope } from "hooks/useReportScope";
import { buildReportUrl } from "helpers/reports_url_helper";
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
    const { t } = useTranslation();

    document.title = `${t("reports.catalogs.title")} | ${t("reports.title")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
    const [clients, setClients] = useState<ClientRecord[]>([]);
    const [kpis, setKpis] = useState<CatalogsKpis>({
        totalSuppliers: 0, activeSuppliers: 0, totalClients: 0, activeClients: 0,
    });

    const fetchData = async () => {
        if (!configContext) return;
        setLoading(true);
        try {
            const url = buildReportUrl({
                apiUrl: configContext.apiUrl,
                basePath: "reports/catalogs",
                isGlobal,
                farmId,
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setSuppliers(data.suppliers || []);
            setClients(data.clients || []);
            setKpis(data.kpis);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: t("reports.error.loadData") });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const url = buildReportUrl({
            apiUrl: configContext.apiUrl,
            basePath: "reports/catalogs",
            isGlobal,
            farmId,
            variant: "pdf",
            query: { orientation: "portrait", format: "A4" },
        });
        const response = await configContext.axiosHelper.getBlob(url);
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scopeKey]);

    const supplierColumns: Column<SupplierRecord>[] = [
        { header: t("reports.col.name"), accessor: "name", type: "text", isFilterable: true },
        { header: t("reports.col.contact"), accessor: "contact", type: "text", isFilterable: true },
        { header: t("reports.col.phone"), accessor: "phone", type: "text" },
        { header: t("reports.col.email"), accessor: "email", type: "text" },
        { header: t("reports.catalogs.col.purchases"), accessor: "totalPurchases", type: "number" },
        { header: t("reports.catalogs.col.totalSpent"), accessor: "totalSpent", type: "currency", bgColor: "#e8f5e9" },
        { header: t("reports.catalogs.col.lastPurchase"), accessor: "lastPurchaseDate", type: "date" },
        {
            header: t("reports.col.status"), accessor: "status", type: "text",
            render: (v: boolean) => (
                <Badge color={v ? "success" : "secondary"}>{v ? t("reports.status.active") : t("reports.status.inactive")}</Badge>
            ),
        },
    ];

    const clientColumns: Column<ClientRecord>[] = [
        { header: t("reports.col.name"), accessor: "name", type: "text", isFilterable: true },
        { header: t("reports.col.contact"), accessor: "contact", type: "text", isFilterable: true },
        { header: t("reports.col.phone"), accessor: "phone", type: "text" },
        { header: t("reports.col.email"), accessor: "email", type: "text" },
        { header: t("reports.catalogs.col.sales"), accessor: "totalSales", type: "number" },
        { header: t("reports.catalogs.col.totalRevenue"), accessor: "totalRevenue", type: "currency", bgColor: "#e8f5e9" },
        { header: t("reports.catalogs.col.lastSale"), accessor: "lastSaleDate", type: "date" },
        {
            header: t("reports.col.status"), accessor: "status", type: "text",
            render: (v: boolean) => (
                <Badge color={v ? "success" : "secondary"}>{v ? t("reports.status.active") : t("reports.status.inactive")}</Badge>
            ),
        },
    ];

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.catalogs.title")}
            pageTitle={t("reports.title")}
            onGeneratePdf={() => handleGeneratePdf()}
            pdfTitle={t("reports.catalogs.pdfTitle")}
            showDateFilter={false}
        >
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.catalogs.kpi.totalSuppliers")}
                        value={kpis.totalSuppliers}
                        icon={<i className="ri-truck-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.catalogs.kpi.activeSuppliers")}
                        value={kpis.activeSuppliers}
                        icon={<i className="ri-check-line fs-4 text-success"></i>}
                        animateValue
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.catalogs.kpi.totalClients")}
                        value={kpis.totalClients}
                        icon={<i className="ri-user-line fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.catalogs.kpi.activeClients")}
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
                                <i className="ri-truck-line me-1"></i> {t("reports.catalogs.tab.suppliers")} ({suppliers.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-user-line me-1"></i> {t("reports.catalogs.tab.clients")} ({clients.length})
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
