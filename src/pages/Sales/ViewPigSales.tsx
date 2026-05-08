import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { getEffectiveUser } from "helpers/impersonation_helper";
import CustomTable from "Components/Common/Tables/CustomTable";
import SellPigsFormV2 from "Components/Common/Forms/SellPigsFormV2";
import SaleDetails from "Components/Common/Details/SaleDetails";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { useTranslation } from "react-i18next";

const paymentStatusColor: Record<string, string> = {
    pending: "warning",
    partial: "info",
    completed: "success",
};

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const ViewPigSales = () => {
    const { t } = useTranslation();
    document.title = t('finance.sale.pageTitle');

    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();

    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ newSale: false, details: false, dateRange: false, viewPDF: false });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const toggleModal = (name: keyof typeof modals, state?: boolean) =>
        setModals(prev => ({ ...prev, [name]: state ?? !prev[name] }));

    const columns: Column<any>[] = [
        {
            header: t('finance.sale.column.code'),
            accessor: "code",
            isFilterable: true,
            type: "text",
        },
        {
            header: t('finance.sale.column.date'),
            accessor: "saleDate",
            isFilterable: true,
            type: "date",
        },
        {
            header: t('finance.sale.column.buyer'),
            accessor: "buyer",
            type: "text",
            render: (_, row) => <span>{row.buyer?.name || "—"}</span>,
        },
        {
            header: t('finance.sale.column.pigs'),
            accessor: "pigs",
            type: "text",
            bgColor: "#e3f2fd",
            render: (_, row) => (
                <span className="fw-semibold text-primary">
                    {row.pigs?.length ?? row.group?.pigCount ?? "—"}
                </span>
            ),
        },
        {
            header: t('finance.sale.column.totalWeight'),
            accessor: "totalWeight",
            type: "text",
            bgColor: "#e8f5e9",
            render: (_, row) => (
                <span>{row.totalWeight != null ? `${row.totalWeight.toFixed(2)} kg` : "—"}</span>
            ),
        },
        {
            header: t('finance.sale.column.totalAmount'),
            accessor: "totalAmount",
            type: "currency",
            bgColor: "#e0f2f1",
        },
        {
            header: t('finance.sale.column.paymentMethod'),
            accessor: "paymentMethod",
            type: "text",
            render: v => <span>{t(`finance.sale.paymentMethod.${v}`, { defaultValue: v })}</span>,
        },
        {
            header: t('finance.sale.column.paymentStatus'),
            accessor: "paymentStatus",
            type: "text",
            render: v => (
                <Badge color={paymentStatusColor[v] || "secondary"}>
                    {t(`finance.sale.paymentStatus.${v}`, { defaultValue: v })}
                </Badge>
            ),
        },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (_: any, row: any) => (
                <Button
                    className="farm-primary-button btn-icon"
                    onClick={() => {
                        setSelectedSaleId(row._id);
                        toggleModal("details");
                    }}
                >
                    <i className="ri-eye-fill align-middle"></i>
                </Button>
            ),
        },
    ];

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/pig_sales/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('finance.sale.error.generatePdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    const fetchSales = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/finances/pig_sales/find_by_farm/${userLogged.farm_assigned}`
            );
            setSales(res.data.data || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: t('finance.sale.error.fetchData') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (loading) return <LoadingAnimation />;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('finance.sale.breadcrumb.title')} pageTitle={t('finance.sale.breadcrumb.parent')} />

                <Card>
                    <CardHeader>
                        <div className="d-flex align-items-center gap-2">
                            <h4 className="mb-0 me-auto">{t('finance.sale.cardTitle')}</h4>
                            <Button color="primary" onClick={() => toggleModal("dateRange")} disabled={pdfLoading}>
                                {pdfLoading ? (
                                    <><Spinner className="me-2" size="sm" />{t('common.button.generating')}</>
                                ) : (
                                    <><i className="ri-file-pdf-line me-2" />{t('common.button.exportPdf')}</>
                                )}
                            </Button>
                            <Button className="farm-primary-button" onClick={() => toggleModal("newSale")}>
                                <i className="ri-add-line me-2" />
                                {t('finance.sale.action.new')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={sales.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : ""}>
                        {sales.length === 0 ? (
                            <>
                                <i className="ri-money-dollar-circle-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t('finance.sale.empty')}</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={sales} showSearchAndFilter={true} showPagination={false} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.newSale} toggle={() => toggleModal("newSale")} backdrop="static" keyboard={false} centered scrollable fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("newSale")}>{t('finance.sale.modal.create')}</ModalHeader>
                <ModalBody>
                    <SellPigsFormV2
                        onSave={() => { toggleModal("newSale"); fetchSales(); }}
                    />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => { toggleModal("details"); setSelectedSaleId(null); }} centered scrollable fullscreen={tabletMode}>
                <ModalHeader toggle={() => { toggleModal("details"); setSelectedSaleId(null); }}>{t('finance.sale.modal.details')}</ModalHeader>
                <ModalBody>
                    {selectedSaleId && <SaleDetails saleId={selectedSaleId} />}
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>{t('finance.sale.modal.dateRange')}</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => toggleModal("dateRange")}
                    loading={pdfLoading}
                    generateButtonText={t('finance.sale.action.generatePdf')}
                />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('finance.sale.modal.pdfReport')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </div>
    );
};

export default ViewPigSales;
