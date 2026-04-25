import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import GroupsView from "Components/Common/Views/GroupsView";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { getBaseColumns, getCountColumns, getWeanedStatusColumn } from "config/groupColumnsConfig";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useState } from "react";
import { Button, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";

const ViewWeanedGroups = () => {
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();

    const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            setDateRangeModalOpen(false);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/groups/weaned/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            setPdfModalOpen(true);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al generar el PDF, intentelo más tarde' });
        } finally {
            setPdfLoading(false);
        }
    };

    const pdfButton = (
        <Button color="primary" onClick={() => setDateRangeModalOpen(true)} disabled={pdfLoading}>
            {pdfLoading ? (
                <><Spinner className="me-2" size="sm" />Generando...</>
            ) : (
                <><i className="ri-file-pdf-line me-2" />Exportar PDF</>
            )}
        </Button>
    );

    const columns: Column<any>[] = [
        ...getBaseColumns(),
        { header: 'Fecha de creación', accessor: 'creationDate', type: 'date', isFilterable: true },
        ...getCountColumns(),
        getWeanedStatusColumn(),
    ];

    return (
        <>
            <GroupsView
                stage="weaning"
                title="Ver grupos destetados"
                pageTitle="Pre-iniciacion"
                columns={columns}
                statsEndpoint="group_alive_stats"
                transferStage="weaning"
                headerActions={pdfButton}
            />

            <Modal size="md" isOpen={dateRangeModalOpen} toggle={() => setDateRangeModalOpen(false)} centered>
                <ModalHeader toggle={() => setDateRangeModalOpen(false)}>Seleccionar rango de fechas de creación</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => setDateRangeModalOpen(false)}
                    loading={pdfLoading}
                    generateButtonText="Generar PDF"
                />
            </Modal>

            <Modal size="xl" isOpen={pdfModalOpen} toggle={() => setPdfModalOpen(false)} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => setPdfModalOpen(false)}>Reporte de Grupos Destetados</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    );
};

export default ViewWeanedGroups;