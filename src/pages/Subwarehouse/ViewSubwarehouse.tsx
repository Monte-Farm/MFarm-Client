import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { SubwarehouseData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import SubwarehouseForm from "Components/Common/Forms/SubwarehouseForm";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import { getEffectiveUser } from "helpers/impersonation_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import CustomTable from "Components/Common/Tables/CustomTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { useTranslation } from "react-i18next";


const ViewSubwarehouse = () => {
    const { t } = useTranslation();
    document.title = t('warehouse.subwarehouse.pageTitle')
    const history = useNavigate();
    const configContext = useContext(ConfigContext)
    const userLogged = getEffectiveUser();

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, details: false, update: false, delete: false, viewPDF: false });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
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
        { header: t('common.field.code'), accessor: 'code', isFilterable: true, type: 'text' },
        { header: t('common.field.name'), accessor: 'name', isFilterable: true, type: 'text' },
        {
            header: t('warehouse.subwarehouse.col.manager'),
            accessor: 'manager',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.manager.name} {row.manager.lastname}</span>
        },
        {
            header: t('warehouse.subwarehouse.col.type'),
            accessor: 'type',
            isFilterable: true,
            type: 'text',
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case "medical":
                        color = "info";
                        break;
                    case "feed":
                        color = "success";
                        break;
                    case "cleaning":
                        color = "primary";
                        break;
                    case "supplies":
                        color = "warning";
                        break;
                }

                return <Badge color={color}>{t(`warehouse.common.subwarehouseType.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        {
            header: t('common.field.status'),
            accessor: "status",
            render: (value: boolean) => (
                <Badge color={value === true ? "success" : "danger"}>
                    {value === true ? t('common.status.active') : t('common.status.inactive')}
                </Badge>
            ),
            isFilterable: true,
        },
        {
            header: t('common.field.actions'),
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

    const handleGeneratePDF = async () => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/subwarehouses/all?farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.subwarehouse.error.generatePdf') });
        } finally {
            setPdfLoading(false);
        }
    };

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
                { id: 'active', label: t('common.status.active'), value: chartsData.statusData.active || 0, color: '#10b981' },
                { id: 'inactive', label: t('common.status.inactive'), value: chartsData.statusData.inactive || 0, color: '#ef4444' }
            ];

            const totalSubwarehouses = (chartsData.statusData.active || 0) + (chartsData.statusData.inactive || 0);

            const statusLegendItems: DonutLegendItem[] = [
                {
                    label: t('common.status.active'),
                    value: (chartsData.statusData.active || 0).toString(),
                    percentage: totalSubwarehouses > 0 ? `${(((chartsData.statusData.active || 0) / totalSubwarehouses) * 100).toFixed(1)}%` : '0%'
                },
                {
                    label: t('common.status.inactive'),
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
                            label: t(`warehouse.common.subwarehouseType.${type}`, { defaultValue: type }),
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
            logger.error('Error fetching subwarehouses:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.subwarehouse.error.fetch') });
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
                <BreadCrumb title={t('warehouse.subwarehouse.breadcrumb')} pageTitle={t('warehouse.subwarehouse.pageHeader')}></BreadCrumb>

                {/* KPIs Section */}
                <div className="row mb-3">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.subwarehouse.kpi.total')}
                            value={subwarehouseStatistics?.totalSubwarehouses}
                            icon={<i className="ri-store-2-line fs-20 text-primary"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.subwarehouse.kpi.active')}
                            value={subwarehouseStatistics?.activeSubwarehouses}
                            icon={<i className="ri-checkbox-circle-line fs-20 text-success"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.subwarehouse.kpi.inactive')}
                            value={subwarehouseStatistics?.inactiveSubwarehouses}
                            icon={<i className="ri-close-circle-line fs-20 text-danger"></i>}
                            iconBgColor="#FEE2E2"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.subwarehouse.kpi.activationRate')}
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
                            title={t('warehouse.subwarehouse.chart.byType')}
                            data={chartData.typeData}
                            legendItems={chartData.typeLegendItems}
                            height={200}
                        />
                    </div>
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('warehouse.subwarehouse.chart.status')}
                            data={chartData.statusData}
                            legendItems={chartData.statusLegendItems}
                            height={200}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <div className="ms-auto d-flex gap-2">
                                <Button color="primary" onClick={handleGeneratePDF} disabled={pdfLoading}>
                                    {pdfLoading ? (
                                        <><Spinner className="me-2" size="sm" />{t('common.button.generating')}</>
                                    ) : (
                                        <><i className="ri-file-pdf-line me-2" />{t('common.button.exportPdf')}</>
                                    )}
                                </Button>
                                <Button className="farm-primary-button" onClick={() => toggleModal('create')}>
                                    <i className="ri-add-line me-2" />
                                    {t('warehouse.subwarehouse.button.add')}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody className={subwarehouses.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {subwarehouses.length === 0 ? (
                            <>
                                <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t('warehouse.subwarehouse.empty')}</span>
                            </>
                        ) : (
                            <CustomTable columns={subWarehousesColumns} data={subwarehouses} showPagination={false} />
                        )}
                    </CardBody>
                </Card>

                {/* Modal Create */}
                <Modal size="lg" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("create")}>{t('warehouse.subwarehouse.modal.create')}</ModalHeader>
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

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.subwarehouse.modal.report')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewSubwarehouse;
