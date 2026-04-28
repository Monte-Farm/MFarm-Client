import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import PeriodClosingFilters from "Components/Common/Filters/PeriodClosingFilters";
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import CustomTable from "Components/Common/Tables/CustomTable";
import { Column } from "common/data/data_types";
import { PeriodClosingListItem, PeriodClosingStatus } from "common/data_interfaces";
import { fetchPeriodClosings } from "slices/periodClosing/thunk";
import { formatCurrency } from "utils/closingFormatters";
import ClosePeriodModal from "./ClosePeriodModal";
import CloseYearModal from "./CloseYearModal";

const formatDate = (iso: string): string => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const PeriodClosingList = () => {
    const { t } = useTranslation();
    document.title = t("finance.periodClosing.list.pageTitle");

    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();

    const { items, loadingList, error } = useSelector((state: any) => state.PeriodClosing);

    const [filters, setFilters] = useState<{ year: string; status: string; periodType: string }>({ year: "", status: "", periodType: "" });
    const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showCloseYearModal, setShowCloseYearModal] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const farmId = userLogged?.farm_assigned;

    const MONTHS = t("finance.periodClosing.months", { returnObjects: true }) as string[];

    const formatPeriod = (row: PeriodClosingListItem) => {
        if (row.periodType === "annual") return `${row.year}`;
        return row.month ? `${MONTHS[row.month - 1]} ${row.year}` : `${row.year}`;
    };

    const statusBadge = (status: PeriodClosingStatus) => {
        switch (status) {
            case "closed":
                return <Badge color="success"><i className="ri-lock-line me-1" />{t("finance.periodClosing.status.closed")}</Badge>;
            case "reopened":
                return <Badge color="warning"><i className="ri-lock-unlock-line me-1" />{t("finance.periodClosing.status.reopened")}</Badge>;
            case "archived":
                return <Badge color="secondary"><i className="ri-archive-line me-1" />{t("finance.periodClosing.status.archived")}</Badge>;
            default:
                return <Badge color="light">{status}</Badge>;
        }
    };

    const loadList = () => {
        if (!farmId) return;
        dispatch(fetchPeriodClosings({
            farmId,
            year: filters.year ? Number(filters.year) : undefined,
            status: filters.status || undefined,
            periodType: filters.periodType || undefined,
            limit: 100,
        }));
    };

    useEffect(() => {
        loadList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.year, filters.status, filters.periodType, farmId]);

    const columns: Column<PeriodClosingListItem>[] = useMemo(() => [
        {
            header: t("finance.periodClosing.list.column.period"),
            accessor: "year",
            render: (_: any, row: PeriodClosingListItem) => (
                <span className="fw-semibold">{formatPeriod(row)}</span>
            ),
        },
        {
            header: t("finance.periodClosing.list.column.type"),
            accessor: "periodType",
            render: (value: string) => value === "annual"
                ? t("finance.periodClosing.list.periodType.annual")
                : t("finance.periodClosing.list.periodType.monthly"),
        },
        {
            header: t("finance.periodClosing.list.column.status"),
            accessor: "status",
            render: (value: PeriodClosingStatus) => statusBadge(value),
        },
        {
            header: t("finance.periodClosing.list.column.income"),
            accessor: "kpis",
            bgColor: "#E8F5E9",
            render: (_: any, row: PeriodClosingListItem) => formatCurrency(row.kpis?.totalIncome),
        },
        {
            header: t("finance.periodClosing.list.column.costs"),
            accessor: "kpis",
            bgColor: "#FFEBEE",
            render: (_: any, row: PeriodClosingListItem) => formatCurrency(row.kpis?.totalCosts),
        },
        {
            header: t("finance.periodClosing.list.column.result"),
            accessor: "kpis",
            bgColor: "#FFF8E1",
            render: (_: any, row: PeriodClosingListItem) => {
                const r = row.kpis?.operatingResult || 0;
                return <span className="fw-semibold">{formatCurrency(r)}</span>;
            },
        },
        {
            header: t("finance.periodClosing.list.column.closedBy"),
            accessor: "closedBy",
            render: (_: any, row: PeriodClosingListItem) =>
                row.closedBy ? `${row.closedBy.name} ${row.closedBy.lastname}` : "-",
        },
        {
            header: t("finance.periodClosing.list.column.closedAt"),
            accessor: "closedAt",
            render: (value: string) => formatDate(value),
        },
        {
            header: t("finance.periodClosing.list.column.actions"),
            accessor: "_id",
            render: (_: any, row: PeriodClosingListItem) => (
                <div className="d-flex gap-1">
                    <Button
                        className="farm-primary-button btn-icon"
                        onClick={() => navigate(`/finance/period-closing/${row._id}`)}
                    >
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            ),
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [navigate, t]);

    const currentYear = new Date().getFullYear();
    const yearOptions: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) yearOptions.push(y);

    const handleCloseSuccess = () => {
        setShowCloseModal(false);
        setAlertConfig({ visible: true, color: "success", message: t("finance.periodClosing.list.success.closed") });
        loadList();
    };

    const handleCloseYearSuccess = () => {
        setShowCloseYearModal(false);
        setAlertConfig({ visible: true, color: "success", message: t("finance.periodClosing.list.success.yearClosed") });
        loadList();
    };

    if (!configContext || !userLogged) return <LoadingAnimation />;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t("finance.periodClosing.list.breadcrumb")} pageTitle="Administración" />

                <Card>
                    <CardHeader>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <div className="me-auto">
                                <h4 className="mb-0">{t("finance.periodClosing.list.cardHeader")}</h4>
                                <small className="text-muted">{t("finance.periodClosing.list.cardSubheader")}</small>
                            </div>
                            <PeriodClosingFilters
                                filters={filters}
                                onFilterChange={(name, value) => setFilters((prev) => ({ ...prev, [name]: value }))}
                                onClearFilters={() => setFilters({ year: "", status: "", periodType: "" })}
                                popoverOpen={filtersPopoverOpen}
                                onTogglePopover={() => setFiltersPopoverOpen((p) => !p)}
                                yearOptions={yearOptions}
                            />
                            <Button color="info" onClick={() => setShowCloseYearModal(true)}>
                                <i className="ri-calendar-2-line me-1" />{t("finance.periodClosing.list.button.closeYear")}
                            </Button>
                            <Button className="farm-primary-button" onClick={() => setShowCloseModal(true)}>
                                <i className="ri-add-line me-1" />{t("finance.periodClosing.list.button.closeMonth")}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={items.length === 0 && !loadingList ? "d-flex flex-column justify-content-center align-items-center text-center py-5" : ""}>
                        {loadingList ? (
                            <Row><Col><LoadingAnimation /></Col></Row>
                        ) : items.length === 0 ? (
                            <>
                                <i className="ri-file-lock-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t("finance.periodClosing.list.empty.title")}</span>
                                <small className="text-muted mt-1">{t("finance.periodClosing.list.empty.hint")}</small>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={items} showPagination rowsPerPage={10} />
                        )}
                    </CardBody>
                </Card>

                {error && (
                    <AlertMessage
                        color="danger"
                        message={error}
                        visible={true}
                        onClose={() => { /* slice-controlled */ }}
                    />
                )}
            </Container>

            {farmId && (
                <ClosePeriodModal
                    isOpen={showCloseModal}
                    onClose={() => setShowCloseModal(false)}
                    onSuccess={handleCloseSuccess}
                    farmId={farmId}
                />
            )}
            {farmId && (
                <CloseYearModal
                    isOpen={showCloseYearModal}
                    onClose={() => setShowCloseYearModal(false)}
                    onSuccess={handleCloseYearSuccess}
                    farmId={farmId}
                />
            )}

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </div>
    );
};

export default PeriodClosingList;
