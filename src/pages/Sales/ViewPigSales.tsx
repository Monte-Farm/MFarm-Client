import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { getLoggedinUser } from "helpers/api_helper";
import CustomTable from "Components/Common/Tables/CustomTable";
import SellPigsFormV2 from "Components/Common/Forms/SellPigsFormV2";
import SaleDetails from "Components/Common/Details/SaleDetails";

const paymentMethodLabel: Record<string, string> = {
    cash: "Efectivo",
    transfer: "Transferencia",
    check: "Cheque",
    credit: "Crédito",
    other: "Otro",
};

const paymentStatusColor: Record<string, string> = {
    pending: "warning",
    partial: "info",
    completed: "success",
};

const paymentStatusLabel: Record<string, string> = {
    pending: "Pendiente",
    partial: "Parcial",
    completed: "Completado",
};

const ViewPigSales = () => {
    document.title = "Ver Ventas | Ventas";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modals, setModals] = useState({ newSale: false, details: false });
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const toggleModal = (name: keyof typeof modals, state?: boolean) =>
        setModals(prev => ({ ...prev, [name]: state ?? !prev[name] }));

    const columns: Column<any>[] = [
        {
            header: "Código",
            accessor: "code",
            isFilterable: true,
            type: "text",
        },
        {
            header: "Fecha",
            accessor: "saleDate",
            isFilterable: true,
            type: "date",
        },
        {
            header: "Comprador",
            accessor: "buyer",
            type: "text",
            render: (_, row) => <span>{row.buyer?.name || "—"}</span>,
        },
        {
            header: "Cerdos",
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
            header: "Peso total",
            accessor: "totalWeight",
            type: "text",
            bgColor: "#e8f5e9",
            render: (_, row) => (
                <span>{row.totalWeight != null ? `${row.totalWeight.toFixed(2)} kg` : "—"}</span>
            ),
        },
        {
            header: "Monto total",
            accessor: "totalAmount",
            type: "currency",
            bgColor: "#e0f2f1",
        },
        {
            header: "Método de pago",
            accessor: "paymentMethod",
            type: "text",
            render: v => <span>{paymentMethodLabel[v] || v}</span>,
        },
        {
            header: "Estado de pago",
            accessor: "paymentStatus",
            type: "text",
            render: v => (
                <Badge color={paymentStatusColor[v] || "secondary"}>
                    {paymentStatusLabel[v] || v}
                </Badge>
            ),
        },
        {
            header: "Acciones",
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

    const fetchSales = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/finances/pig_sales/find_by_farm/${userLogged.farm_assigned}`
            );
            setSales(res.data.data || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al obtener las ventas, intente nuevamente." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    if (loading) return <LoadingAnimation />;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Ver Ventas" pageTitle="Ventas" />

                <Card>
                    <CardHeader>
                        <div className="d-flex align-items-center">
                            <h4 className="mb-0">Ventas de cerdos</h4>
                            <Button
                                className="ms-auto farm-primary-button"
                                onClick={() => toggleModal("newSale")}
                            >
                                <i className="ri-add-line me-2" />
                                Nueva Venta
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={sales.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : ""}>
                        {sales.length === 0 ? (
                            <>
                                <i className="ri-money-dollar-circle-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay ventas registradas</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={sales} showSearchAndFilter={true} showPagination={false} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.newSale} toggle={() => toggleModal("newSale")} backdrop="static" keyboard={false} centered scrollable>
                <ModalHeader toggle={() => toggleModal("newSale")}>Nueva venta de cerdos</ModalHeader>
                <ModalBody>
                    <SellPigsFormV2
                        onSave={() => { toggleModal("newSale"); fetchSales(); }}
                    />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => { toggleModal("details"); setSelectedSaleId(null); }} centered scrollable>
                <ModalHeader toggle={() => { toggleModal("details"); setSelectedSaleId(null); }}>Detalles de la venta</ModalHeader>
                <ModalBody>
                    {selectedSaleId && <SaleDetails saleId={selectedSaleId} />}
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
