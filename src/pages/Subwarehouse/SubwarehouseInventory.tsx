import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button, Card, CardHeader, CardBody, Row, Col, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { getLoggedinUser } from "helpers/api_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import AlertMessage from "Components/Common/Shared/AlertMesagge";


const SubwarehouseInventory = () => {
    document.title = 'Inventario de Subalmacen | Subalmacen';
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(true)
    const [subwarehouseInventory, setSubwarehouseInventory] = useState([])
    const [loadingPDF, setLoadingPDF] = useState<boolean>(false);
    const [pdfUrl, setPdfUrl] = useState<string>('')
    const [modals, setModals] = useState({ viewPDF: false });
    const [warehouseStatistics, setWarehouseStatistics] = useState<any>({});

    const inventoryColumns: Column<any>[] = [
        {
            header: "Código",
            accessor: "id",
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span className="text-black">{row.product?.id || row.id}</span>
        },
        {
            header: "Producto",
            accessor: "name",
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span className="text-black">{row.product?.name || row.name}</span>
        },
        {
            header: 'Existencias',
            accessor: 'quantity',
            isFilterable: true,
            type: 'number',
            render: (_, row) => <span>{row.quantity} {row.product?.unit_measurement || row.unit_measurement}</span>,
            bgColor: '#E8F5E9'
        },
        {
            header: 'Precio Promedio',
            accessor: 'averagePrice',
            isFilterable: true,
            type: 'currency',
            bgColor: '#E3F2FD'
        },
        {
            header: 'Valor Total',
            accessor: 'totalValue',
            isFilterable: true,
            type: 'currency',
            render: (_, row) => {
                const totalValue = row.quantity * (row.averagePrice || 0);
                return <span>${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
            },
            bgColor: '#FFF3E0'
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleClicProductDetails(row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleClicProductDetails = (row: any) => {
        history(`/warehouse/inventory/product_details?warehouse=${userLogged.assigment}&product=${row.id}`)
    }

    const handleFetchWarehouseInventory = async () => {
        if (!configContext || !userLogged) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${userLogged.assigment}`);
            setSubwarehouseInventory(response.data.data);
        } catch (error) {
            console.error('Error fetching data', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        }
    };

    const fetchWarehouseStatistics = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/warehouse_statistics/${userLogged.assigment}`);
            setWarehouseStatistics(response.data.data.statistics);
        } catch (error) {
            console.error('Error fetching warehouse statistics:', error);
        }
    };


    const handlePrintInventory = async () => {
        if (!configContext || !configContext.userLogged) return;

        try {
            setLoadingPDF(true)
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/generate_inventory_report/${configContext.userLogged.assigment}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setPdfUrl(url)
            toggleModal('viewPDF')
        } catch (error) {
            console.error('Error generating report', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al generar el reporte, intentelo mas tarde' })
        } finally {
            setLoadingPDF(false)
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([
                handleFetchWarehouseInventory(),
                fetchWarehouseStatistics(),
            ]);
            setLoading(false);
        };

        fetchData();
    }, [])



    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Inventario"} pageTitle={"Subalmacén"} />

                {/* KPIs Section */}
                <div className="row mb-3">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Valor Total del Inventario"
                            value={warehouseStatistics.totalValue || 0}
                            prefix="$"
                            decimals={2}
                            icon={<i className="ri-money-dollar-circle-line fs-20 text-primary"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Total de Productos"
                            value={warehouseStatistics.uniqueProducts || 0}
                            icon={<i className="ri-archive-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Total de Unidades"
                            value={warehouseStatistics.totalUnits || 0}
                            icon={<i className="ri-stack-line fs-20 text-success"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Valor Promedio por Producto"
                            value={warehouseStatistics.averageValuePerProduct || 0}
                            prefix="$"
                            decimals={2}
                            icon={<i className="ri-bar-chart-line fs-20 text-warning"></i>}
                            iconBgColor="#FFF3E0"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <h4 className="me-auto">Productos</h4>
                            <Button className="farm-primary-button" onClick={handlePrintInventory} disabled={loadingPDF}>
                                {loadingPDF ? (
                                    <>
                                        <Spinner size='sm' /> Generando
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-download-line me-2"></i>
                                        Imprimir Inventario
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={subwarehouseInventory.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {subwarehouseInventory.length === 0 ? (
                            <>
                                <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay productos registrados en el inventario</span>
                            </>
                        ) : (
                            <CustomTable
                                columns={inventoryColumns}
                                data={subwarehouseInventory}
                                showSearchAndFilter={true}
                                rowClickable={false}
                                showPagination={false}
                            />
                        )}
                    </CardBody>
                </Card>

            </Container>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Inventario </ModalHeader>
                <ModalBody>
                    {pdfUrl && <PDFViewer fileUrl={pdfUrl} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default SubwarehouseInventory