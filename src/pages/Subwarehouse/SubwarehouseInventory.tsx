import { logger } from 'utils/logger';
import { useTranslation } from "react-i18next";
import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button, Card, CardHeader, CardBody, Row, Col, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { getEffectiveUser } from "helpers/impersonation_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import AlertMessage from "Components/Common/Shared/AlertMesagge";


const SubwarehouseInventory = () => {
    const { t } = useTranslation();
    document.title = 'Inventario de Subalmacen | Subalmacen';
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(true)
    const [subwarehouseInventory, setSubwarehouseInventory] = useState([])
    const [loadingPDF, setLoadingPDF] = useState<boolean>(false);
    const [pdfUrl, setPdfUrl] = useState<string>('')
    const [modals, setModals] = useState({ viewPDF: false });
    const [warehouseStatistics, setWarehouseStatistics] = useState<any>({});

    const inventoryColumns: Column<any>[] = [
        {
            header: t('common.field.code'),
            accessor: "id",
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span className="text-black">{row.product?.id || row.id}</span>
        },
        {
            header: t('common.field.name'),
            accessor: "name",
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span className="text-black">{row.product?.name || row.name}</span>
        },
        {
            header: t('warehouse.inventoryDetails.kpi.stock'),
            accessor: 'quantity',
            isFilterable: true,
            type: 'number',
            render: (_, row) => <span>{row.quantity} {row.product?.unit_measurement || row.unit_measurement}</span>,
            bgColor: '#E8F5E9'
        },
        {
            header: t('warehouse.inventoryDetails.kpi.avgPrice'),
            accessor: 'averagePrice',
            isFilterable: true,
            type: 'currency',
            bgColor: '#E3F2FD'
        },
        {
            header: t('warehouse.inventory.kpi.totalValue'),
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
            header: t('common.field.actions'),
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
            logger.error('Error fetching data', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.subwarehouseDetails.error.fetchInventory') })
        }
    };

    const fetchWarehouseStatistics = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/warehouse_statistics/${userLogged.assigment}`);
            setWarehouseStatistics(response.data.data.statistics);
        } catch (error) {
            logger.error('Error fetching warehouse statistics:', error);
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
            logger.error('Error generating report', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.subwarehouseDetails.error.generateReport') })
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
                <BreadCrumb title={t('warehouse.subwarehouseDetails.tab.inventory')} pageTitle={t('warehouse.subwarehouse.breadcrumb')} />

                {/* KPIs Section */}
                <div className="row mb-3">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.subwarehouseDetails.kpi.inventory.totalValue')}
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
                            title={t('warehouse.subwarehouseDetails.kpi.inventory.totalProducts')}
                            value={warehouseStatistics.uniqueProducts || 0}
                            icon={<i className="ri-archive-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.subwarehouseDetails.kpi.inventory.totalUnits')}
                            value={warehouseStatistics.totalUnits || 0}
                            icon={<i className="ri-stack-line fs-20 text-success"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.subwarehouseDetails.kpi.inventory.avgValuePerProduct')}
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
                                        <Spinner size='sm' /> {t('common.button.generating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-download-line me-2"></i>
                                        {t('warehouse.subwarehouseDetails.button.report')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={subwarehouseInventory.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {subwarehouseInventory.length === 0 ? (
                            <>
                                <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t('warehouse.subwarehouseDetails.empty.inventory')}</span>
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

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.subwarehouseDetails.modal.report')}</ModalHeader>
                <ModalBody>
                    {pdfUrl && <PDFViewer fileUrl={pdfUrl} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default SubwarehouseInventory
