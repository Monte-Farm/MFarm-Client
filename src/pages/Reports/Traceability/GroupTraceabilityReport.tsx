import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Badge, Card, CardBody, CardHeader, Col, Input, Row } from "reactstrap";
import SimpleBar from "simplebar-react";
import { darkenHex } from "utils/colorUtils";
import { useReportScope } from "hooks/useReportScope";
import { buildReportUrl } from "helpers/reports_url_helper";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import ReportPageLayout from "Components/Common/Shared/ReportPageLayout";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CustomTable from "Components/Common/Tables/CustomTable";

interface GroupOption {
    _id: string;
    name: string;
    stage: string;
}

interface TimelineEvent {
    _id: string;
    date: string;
    eventType: string;
    description: string;
    details: string;
    user: string;
}

interface GroupInfo {
    name: string;
    stage: string;
    pigCount: number;
    entryDate: string;
    avgWeight: number;
    totalFeedConsumed: number;
    totalMedications: number;
    totalDeaths: number;
    totalSales: number;
}

const GroupTraceabilityReport = () => {
    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;

    const eventTypeLabels: Record<string, { label: string; color: string; icon: string }> = {
        creation: { label: t("reports.traceability.event.creation"), color: "primary", icon: "ri-add-circle-line" },
        movement: { label: t("reports.traceability.event.movement"), color: "info", icon: "ri-arrow-left-right-line" },
        feeding: { label: t("reports.traceability.event.feeding"), color: "success", icon: "ri-plant-line" },
        medication: { label: t("reports.traceability.event.medication"), color: "warning", icon: "mdi mdi-heart-pulse" },
        vaccination: { label: t("reports.traceability.event.vaccination"), color: "secondary", icon: "ri-syringe-line" },
        weighing: { label: t("reports.traceability.event.weighing"), color: "primary", icon: "ri-scales-3-line" },
        death: { label: t("reports.traceability.event.death"), color: "danger", icon: "ri-skull-line" },
        sale: { label: t("reports.traceability.event.sale"), color: "success", icon: "ri-money-dollar-circle-line" },
        health_event: { label: t("reports.traceability.event.health_event"), color: "danger", icon: "ri-stethoscope-line" },
        stage_change: { label: t("reports.traceability.event.stage_change"), color: "info", icon: "ri-arrow-right-line" },
    };

    document.title = `${t("reports.traceability.title")} | ${t("reports.title")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const [groups, setGroups] = useState<GroupOption[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

    const fetchGroups = async () => {
        if (!configContext) return;
        setLoadingGroups(true);
        try {
            const url = buildReportUrl({
                apiUrl: configContext.apiUrl,
                basePath: "reports/traceability/groups",
                isGlobal,
                farmId,
            });
            const res = await configContext.axiosHelper.get(url);
            if (isGlobal) {
                const flat: GroupOption[] = [];
                const farms = res.data.data || [];
                farms.forEach((farm: any) => {
                    (farm.groups || []).forEach((g: any) => {
                        flat.push({ _id: g._id, name: `${g.name} — ${farm.farmName}`, stage: g.stage });
                    });
                });
                setGroups(flat);
            } else {
                setGroups(res.data.data || []);
            }
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: t("reports.error.loadGroups") });
        } finally {
            setLoadingGroups(false);
        }
    };

    const fetchTraceability = async () => {
        if (!configContext || !selectedGroupId) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/traceability/group/${selectedGroupId}`
            );
            const data = res.data.data;
            setGroupInfo(data.groupInfo);
            setTimeline(data.timeline || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: t("reports.error.loadTraceability") });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (): Promise<string> => {
        if (!configContext || !selectedGroupId) throw new Error("No config");
        const url = buildReportUrl({
            apiUrl: configContext.apiUrl,
            basePath: "reports/traceability/group",
            isGlobal: false,
            farmId: selectedGroupId,
            variant: "pdf",
            query: { orientation: "portrait", format: "A4" },
        });
        const response = await configContext.axiosHelper.getBlob(url);
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchGroups();
        setSelectedGroupId("");
        setGroupInfo(null);
        setTimeline([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scopeKey]);

    useEffect(() => {
        if (selectedGroupId) {
            fetchTraceability();
        }
    }, [selectedGroupId]);

    const timelineColumns: Column<TimelineEvent>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        {
            header: t("reports.traceability.col.eventType"), accessor: "eventType", type: "text",
            render: (value: string) => {
                const e = eventTypeLabels[value] || { label: value, color: "secondary", icon: "ri-information-line" };
                return (
                    <Badge color={e.color} className="d-flex align-items-center gap-1" style={{ width: "fit-content" }}>
                        <i className={e.icon}></i> {e.label}
                    </Badge>
                );
            },
        },
        { header: t("reports.traceability.col.description"), accessor: "description", type: "text", isFilterable: true },
        { header: t("reports.traceability.col.details"), accessor: "details", type: "text" },
        { header: t("reports.col.user"), accessor: "user", type: "text" },
    ];

    if (loadingGroups) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.traceability.title")}
            pageTitle={t("reports.title")}
            onGeneratePdf={selectedGroupId ? () => handleGeneratePdf() : undefined}
            pdfTitle={t("reports.traceability.pdfTitle")}
            showDateFilter={false}
        >
            {/* Group selector */}
            <Card className="mb-3">
                <CardBody>
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, borderRadius: "10px", backgroundColor: bg("#EEF2FF") }}>
                            <i className="ri-group-line fs-4 text-primary"></i>
                        </div>
                        <div>
                            <h6 className="mb-0 fw-semibold">{t("reports.traceability.selectGroup")}</h6>
                            <small className="text-muted">{t("reports.traceability.selectGroupHint")}</small>
                        </div>
                    </div>
                    <Input
                        type="text"
                        placeholder={t("reports.traceability.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-3"
                        style={{ maxWidth: 400 }}
                    />
                    <SimpleBar style={{ maxHeight: 250 }}>
                        <div className="d-flex flex-wrap gap-2">
                            {groups
                                .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.stage.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(g => (
                                    <div
                                        key={g._id}
                                        onClick={() => { setSelectedGroupId(g._id); setSearchTerm(""); }}
                                        className="d-flex align-items-center gap-2 px-3 py-2 rounded"
                                        style={{
                                            cursor: "pointer",
                                            transition: "all 0.15s",
                                            border: selectedGroupId === g._id ? "2px solid #405189" : "1.5px solid #dee2e6",
                                            backgroundColor: selectedGroupId === g._id ? "#405189" : isDark ? "#2c3238" : "#fff",
                                        }}
                                    >
                                        <i className="ri-checkbox-blank-circle-fill" style={{ fontSize: 8, color: selectedGroupId === g._id ? "#fff" : "#adb5bd" }}></i>
                                        <span className="fw-semibold" style={{ fontSize: 13, color: selectedGroupId === g._id ? "#fff" : isDark ? "#ced4da" : "#333" }}>{g.name}</span>
                                        <Badge
                                            className="ms-1"
                                            style={{
                                                fontSize: 11,
                                                backgroundColor: selectedGroupId === g._id ? "rgba(255,255,255,0.2)" : "#405189",
                                                color: "#fff",
                                            }}
                                        >
                                            {g.stage}
                                        </Badge>
                                    </div>
                                ))
                            }
                            {groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.stage.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                <span className="text-muted fst-italic">{t("reports.traceability.noGroupsFound")}</span>
                            )}
                        </div>
                    </SimpleBar>
                </CardBody>
            </Card>

            {loading && <LoadingAnimation absolutePosition={false} />}

            {!loading && groupInfo && (
                <>
                    <Row className="g-3 mb-3">
                        <Col xl={3} md={6}>
                            <StatKpiCard
                                title={t("reports.traceability.kpi.group")}
                                value={groupInfo.name}
                                subtext={groupInfo.stage}
                                icon={<i className="ri-group-line fs-4 text-primary"></i>}
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatKpiCard
                                title={t("reports.traceability.kpi.pigs")}
                                value={groupInfo.pigCount}
                                icon={<i className="bx bxs-dog fs-4 text-info"></i>}
                                animateValue
                                iconBgColor="#E0F7FA"
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatKpiCard
                                title={t("reports.traceability.kpi.avgWeight")}
                                value={groupInfo.avgWeight}
                                icon={<i className="ri-scales-3-line fs-4 text-warning"></i>}
                                animateValue
                                decimals={1}
                                suffix=" kg"
                                iconBgColor="#FFF8E1"
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatKpiCard
                                title={t("reports.traceability.kpi.entryDate")}
                                value={groupInfo.entryDate ? new Date(groupInfo.entryDate).toLocaleDateString() : "—"}
                                icon={<i className="ri-calendar-line fs-4 text-secondary"></i>}
                                iconBgColor="#F5F5F5"
                            />
                        </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                        <Col xl={3} md={6}>
                            <StatKpiCard
                                title={t("reports.traceability.kpi.feedConsumed")}
                                value={groupInfo.totalFeedConsumed}
                                icon={<i className="ri-plant-line fs-4 text-success"></i>}
                                animateValue
                                decimals={0}
                                suffix=" kg"
                                iconBgColor="#E8F5E9"
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatKpiCard
                                title={t("reports.traceability.kpi.medications")}
                                value={groupInfo.totalMedications}
                                icon={<i className="mdi mdi-heart-pulse fs-4 text-warning"></i>}
                                animateValue
                                iconBgColor="#FFF8E1"
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatKpiCard
                                title={t("reports.traceability.kpi.deaths")}
                                value={groupInfo.totalDeaths}
                                icon={<i className="ri-skull-line fs-4 text-danger"></i>}
                                animateValue
                                iconBgColor="#FFEBEE"
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatKpiCard
                                title={t("reports.traceability.kpi.sales")}
                                value={groupInfo.totalSales}
                                icon={<i className="ri-money-dollar-circle-line fs-4 text-success"></i>}
                                animateValue
                                iconBgColor="#E8F5E9"
                            />
                        </Col>
                    </Row>

                    <Card>
                        <CardHeader>
                            <h5 className="mb-0">
                                <i className="ri-time-line me-2"></i>
                                {t("reports.traceability.historyTitle")} ({timeline.length} eventos)
                            </h5>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={timelineColumns} data={timeline} showSearchAndFilter rowsPerPage={20} />
                        </CardBody>
                    </Card>
                </>
            )}

            {!loading && !groupInfo && selectedGroupId && (
                <Card>
                    <CardBody className="text-center text-muted py-5">
                        <i className="ri-file-search-line" style={{ fontSize: "3rem" }}></i>
                        <p className="mt-2">{t("reports.traceability.noDataForGroup")}</p>
                    </CardBody>
                </Card>
            )}

            {!selectedGroupId && (
                <Card>
                    <CardBody className="text-center text-muted py-5">
                        <i className="ri-group-line" style={{ fontSize: "3rem" }}></i>
                        <p className="mt-2">{t("reports.traceability.selectGroupPrompt")}</p>
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

export default GroupTraceabilityReport;
