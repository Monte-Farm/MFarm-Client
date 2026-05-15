import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Card, CardBody, CardHeader, Col, Input, Row } from "reactstrap";
import SimpleBar from "simplebar-react";
import { darkenHex } from "utils/colorUtils";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useReportScope } from "hooks/useReportScope";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import ReportPageLayout from "Components/Common/Shared/ReportPageLayout";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";

interface SupplierOption {
    _id: string;
    name: string;
}

interface SupplierPurchase {
    _id: string;
    date: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalAmount: number;
    invoiceNumber: string;
}

interface SupplierProduct {
    productName: string;
    totalQuantity: number;
    unit: string;
    totalSpent: number;
    avgPrice: number;
    purchaseCount: number;
}

interface SupplierStatementKpis {
    supplierName: string;
    totalPurchases: number;
    totalSpent: number;
    avgPurchaseAmount: number;
    uniqueProducts: number;
    firstPurchaseDate: string;
    lastPurchaseDate: string;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
};

const SupplierStatementReport = () => {
    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;
    document.title = `${t("reports.supplierStatement.title")} | ${t("reports.title")} | ${t("systemName")}`;

    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const { isGlobal, farmId } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [purchases, setPurchases] = useState<SupplierPurchase[]>([]);
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [kpis, setKpis] = useState<SupplierStatementKpis>({
        supplierName: "", totalPurchases: 0, totalSpent: 0,
        avgPurchaseAmount: 0, uniqueProducts: 0,
        firstPurchaseDate: "", lastPurchaseDate: "",
    });

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const [startDate, setStartDate] = useState(monthStart.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(monthEnd.toISOString().split("T")[0]);

    const fetchSuppliers = async () => {
        if (!configContext || !farmId) return;
        setLoadingSuppliers(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/finance/supplier-statement/suppliers/${farmId}`
            );
            setSuppliers(res.data.data || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: t("reports.error.loadSuppliers") });
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const fetchStatement = async () => {
        if (!configContext || !selectedSupplierId) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/finance/supplier-statement/${selectedSupplierId}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setPurchases(data.purchases || []);
            setProducts(data.products || []);
            setKpis(data.kpis);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: t("reports.error.loadStatement") });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext || !selectedSupplierId) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/finance/supplier-statement/pdf/${selectedSupplierId}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=portrait&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchSuppliers();
        setSelectedSupplierId("");
        setPurchases([]);
        setProducts([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [farmId]);

    useEffect(() => {
        if (selectedSupplierId) {
            fetchStatement();
        }
    }, [selectedSupplierId, startDate, endDate]);

    const purchaseColumns: Column<SupplierPurchase>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        {
            header: t("reports.col.quantity"), accessor: "quantity", type: "text",
            render: (v: number, row: SupplierPurchase) => <span>{v?.toLocaleString()} {row.unit}</span>,
        },
        { header: t("reports.supplierStatement.col.unitPrice"), accessor: "unitPrice", type: "currency" },
        { header: t("reports.col.total"), accessor: "totalAmount", type: "currency", bgColor: "#e8f5e9" },
        { header: t("reports.col.invoice"), accessor: "invoiceNumber", type: "text" },
    ];

    const productColumns: Column<SupplierProduct>[] = [
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        {
            header: t("reports.supplierStatement.col.totalQuantity"), accessor: "totalQuantity", type: "text",
            render: (v: number, row: SupplierProduct) => <span>{v?.toLocaleString()} {row.unit}</span>,
        },
        { header: t("reports.supplierStatement.col.purchaseCount"), accessor: "purchaseCount", type: "number" },
        { header: t("reports.supplierStatement.col.avgPrice"), accessor: "avgPrice", type: "currency", bgColor: "#e3f2fd" },
        { header: t("reports.supplierStatement.col.totalSpent"), accessor: "totalSpent", type: "currency", bgColor: "#e8f5e9" },
    ];

    const productBarData = products.slice(0, 10).map(p => ({
        producto: p.productName,
        Gasto: p.totalSpent,
    }));

    if (loadingSuppliers) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.supplierStatement.title")}
            pageTitle={t("reports.pageTitle")}
            onGeneratePdf={selectedSupplierId ? handleGeneratePdf : undefined}
            pdfTitle="Estado de Cuenta - Proveedor"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Card className="mb-3">
                <CardBody>
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, borderRadius: "10px", backgroundColor: bg("#E8F5E9") }}>
                            <i className="ri-truck-line fs-4 text-success"></i>
                        </div>
                        <div>
                            <h6 className="mb-0 fw-semibold">{t("reports.supplierStatement.selectSupplier")}</h6>
                            <small className="text-muted">{t("reports.supplierStatement.selectSupplierHint")}</small>
                        </div>
                    </div>
                    <Input
                        type="text"
                        placeholder={t("reports.supplierStatement.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-3"
                        style={{ maxWidth: 400 }}
                    />
                    <SimpleBar style={{ maxHeight: 250 }}>
                        <div className="d-flex flex-wrap gap-2">
                            {suppliers
                                .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(s => (
                                    <div
                                        key={s._id}
                                        onClick={() => { setSelectedSupplierId(s._id); setSearchTerm(""); }}
                                        className="d-flex align-items-center gap-2 px-3 py-2 rounded"
                                        style={{
                                            cursor: "pointer",
                                            transition: "all 0.15s",
                                            border: selectedSupplierId === s._id ? "2px solid #405189" : "1.5px solid #dee2e6",
                                            backgroundColor: selectedSupplierId === s._id ? "#405189" : isDark ? "#2c3238" : "#fff",
                                        }}
                                    >
                                        <i className="ri-checkbox-blank-circle-fill" style={{ fontSize: 8, color: selectedSupplierId === s._id ? "#fff" : "#adb5bd" }}></i>
                                        <span className="fw-semibold" style={{ fontSize: 13, color: selectedSupplierId === s._id ? "#fff" : isDark ? "#ced4da" : "#333" }}>{s.name}</span>
                                    </div>
                                ))
                            }
                            {suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                <span className="text-muted fst-italic">{t("reports.supplierStatement.noSuppliersFound")}</span>
                            )}
                        </div>
                    </SimpleBar>
                </CardBody>
            </Card>

            {loading && <LoadingAnimation absolutePosition={false} />}

            {!loading && selectedSupplierId && kpis.supplierName && (
                <>
                    <Row className="g-3 mb-3">
                        <Col xl={2} md={4} sm={6}>
                            <StatKpiCard
                                title={t("reports.supplierStatement.kpi.supplier")}
                                value={kpis.supplierName}
                                icon={<i className="ri-truck-line fs-4 text-primary"></i>}
                            />
                        </Col>
                        <Col xl={2} md={4} sm={6}>
                            <StatKpiCard
                                title={t("reports.supplierStatement.kpi.totalPurchases")}
                                value={kpis.totalPurchases}
                                icon={<i className="ri-shopping-cart-line fs-4 text-info"></i>}
                                animateValue
                                iconBgColor="#E0F7FA"
                            />
                        </Col>
                        <Col xl={2} md={4} sm={6}>
                            <StatKpiCard
                                title={t("reports.supplierStatement.kpi.totalSpent")}
                                value={kpis.totalSpent}
                                icon={<i className="ri-money-dollar-circle-line fs-4 text-danger"></i>}
                                animateValue
                                prefix="$"
                                decimals={2}
                                iconBgColor="#FFEBEE"
                            />
                        </Col>
                        <Col xl={2} md={4} sm={6}>
                            <StatKpiCard
                                title={t("reports.supplierStatement.kpi.avgPerPurchase")}
                                value={kpis.avgPurchaseAmount}
                                icon={<i className="ri-price-tag-3-line fs-4 text-warning"></i>}
                                animateValue
                                prefix="$"
                                decimals={2}
                                iconBgColor="#FFF8E1"
                            />
                        </Col>
                        <Col xl={2} md={4} sm={6}>
                            <StatKpiCard
                                title={t("reports.supplierStatement.kpi.products")}
                                value={kpis.uniqueProducts}
                                icon={<i className="ri-box-3-line fs-4 text-success"></i>}
                                animateValue
                                iconBgColor="#E8F5E9"
                            />
                        </Col>
                        <Col xl={2} md={4} sm={6}>
                            <StatKpiCard
                                title={t("reports.supplierStatement.kpi.lastPurchase")}
                                value={kpis.lastPurchaseDate ? new Date(kpis.lastPurchaseDate).toLocaleDateString() : "—"}
                                icon={<i className="ri-calendar-line fs-4 text-secondary"></i>}
                                iconBgColor="#F5F5F5"
                            />
                        </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                        <Col xl={12}>
                            <BasicBarChart
                                title={t("reports.supplierStatement.chart.spendByProduct")}
                                data={productBarData}
                                indexBy="producto"
                                keys={["Gasto"]}
                                xLegend={t("reports.supplierStatement.chart.xProduct")}
                                yLegend={t("reports.supplierStatement.chart.ySpend")}
                                height={280}
                                colors={["#3b82f6"]}
                            />
                        </Col>
                    </Row>

                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0">
                                <i className="ri-box-3-line me-2"></i>
                                {t("reports.supplierStatement.productSummary", { count: products.length })}
                            </h5>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={productColumns} data={products} showSearchAndFilter={false} showPagination={false} />
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h5 className="mb-0">
                                <i className="ri-file-list-3-line me-2"></i>
                                {t("reports.supplierStatement.purchaseDetails", { count: purchases.length })}
                            </h5>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={purchaseColumns} data={purchases} showSearchAndFilter rowsPerPage={15} />
                        </CardBody>
                    </Card>
                </>
            )}

            {!selectedSupplierId && (
                <Card>
                    <CardBody className="text-center text-muted py-5">
                        <i className="ri-truck-line" style={{ fontSize: "3rem" }}></i>
                        <p className="mt-2">{t("reports.supplierStatement.selectSupplierPrompt")}</p>
                    </CardBody>
                </Card>
            )}

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </ReportPageLayout>
    );
};

export default SupplierStatementReport;
