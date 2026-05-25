import { ConfigContext } from "App";
import { appendLangParam } from 'helpers/reports_url_helper';
import { Column } from "common/data/data_types";
import GroupsView from "Components/Common/Views/GroupsView";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { getBaseColumns, getCountColumns, getWeanedStatusColumn } from "config/groupColumnsConfig";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useState } from "react";
import { Button, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import { useTranslation } from "react-i18next";

const ViewWeanedGroups = () => {
    const { t } = useTranslation();
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
                appendLangParam(`${configContext.apiUrl}/reports/groups/weaned/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`)
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            setPdfModalOpen(true);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('groups.error.pdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    const pdfButton = (
        <Button color="primary" onClick={() => setDateRangeModalOpen(true)} disabled={pdfLoading}>
            {pdfLoading ? (
                <><Spinner className="me-2" size="sm" />{t('groups.button.generating')}</>
            ) : (
                <><i className="ri-file-pdf-line me-2" />{t('groups.button.exportPdf')}</>
            )}
        </Button>
    );

    const columns: Column<any>[] = [
        ...getBaseColumns(t),
        { header: t('groups.column.creationDate'), accessor: 'creationDate', type: 'date', isFilterable: true },
        ...getCountColumns(t),
        getWeanedStatusColumn(t),
    ];

    return (
        <>
            <GroupsView
                stage="weaning"
                title={t('groups.view.titleWeaned')}
                pageTitle={t('groups.pageTitle.weaned')}
                columns={columns}
                statsEndpoint="group_alive_stats"
                transferStage="weaning"
                headerActions={pdfButton}
            />

            <Modal size="md" isOpen={dateRangeModalOpen} toggle={() => setDateRangeModalOpen(false)} centered>
                <ModalHeader toggle={() => setDateRangeModalOpen(false)}>{t('groups.modal.dateRange')}</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => setDateRangeModalOpen(false)}
                    loading={pdfLoading}
                    generateButtonText={t('groups.button.generatePdf')}
                />
            </Modal>

            <Modal size="xl" isOpen={pdfModalOpen} toggle={() => setPdfModalOpen(false)} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => setPdfModalOpen(false)}>{t('groups.report.weaned')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    );
};

export default ViewWeanedGroups;
