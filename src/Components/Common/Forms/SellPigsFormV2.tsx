import { useTranslation } from "react-i18next";
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import {
    Badge, Button, Card, CardBody, CardHeader, Col, Input, Label,
    Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink,
    Row, Spinner, TabContent, TabPane
} from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import classnames from "classnames";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import SelectableCustomTable from "../Tables/SelectableTable";
import PigFilters, { PigFiltersState } from "../Filters/PigFilters";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { Column } from "common/data/data_types";

interface SellPigsFormV2Props {
    groupId?: string;
    onSave: () => void;
}

interface SelectedPig {
    id: string;
    pigId: string;
    code: string;
    originalWeight: number;
    weight: number;
    pricePerKg: number;
    total: number;
    age: number;
    status: string;
    groupId?: string;
    groupName?: string;
    selected: boolean;
}

interface AvailableGroup {
    _id: string;
    code: string;
    name: string;
    stage: string;
    pigCount: number;
    avgWeight: number;
    suggestedPricePerKg: number;
}

interface AvailablePig {
    id: string;
    _id: string;
    code: string;
    currentWeight: number;
    age: number;
    status: string;
    currentStage: string;
    sex: string;
    breed: string;
    groupId?: string;
    groupName?: string;
}

interface AdditionalCost {
    concept: string;
    amount: number;
}

interface BuyerData {
    name: string;
    type: string;
    contact?: string;
    address?: string;
    fiscalId?: string;
}

interface AvailableLitter {
    _id: string;
    code: string;
    status: string;
    currentMale: number;
    currentFemale: number;
    averageWeight: number;
    mother?: { code?: string; earTag?: string };
}

interface LitterFormResponse {
    litter: {
        id: string;
        code: string;
        status: string;
        birthDate: string;
        mother: { _id: string; code: string; earTag?: string };
        currentMale: number;
        currentFemale: number;
        currentTotal: number;
        averageWeight: number;
        estimatedTotalWeight: number;
    };
    productionCosts: {
        feed: number;
        medication: number;
        vaccine: number;
        other: number;
        total: number;
        costPerPig: number;
        costPerKg: number;
    };
    suggestedPricePerKg: number;
    nextSaleCode: string;
}

interface LitterSaleData {
    litterId: string;
    litterCode: string;
    pigCount: number;
    male?: number;
    female?: number;
    avgWeight: number;
    totalWeight: number;
    pricePerKg: number;
    totalPrice: number;
}

interface SaleFormData {
    code: string;
    saleDate: string;
    saleType: string;
    buyer: BuyerData;
    paymentMethod: string;
    paymentStatus: string;
    notes: string;
}

interface PreviewData {
    summary: {
        totalPigs: number;
        totalWeight: number;
        averageWeight: number;
        averagePricePerKg: number;
        subtotal: number;
        additionalCosts: number;
        totalAmount: number;
    };
    profitability: {
        totalCosts: number;
        estimatedProfit: number;
        profitMargin: number;
        roi: number;
    };
}

type SelectionMode = "group" | "individual" | "litter";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const stageColor: Record<string, string> = {
    general: "#6c757d", piglet: "#e83e8c", lactation: "#f1b44c",
    weaning: "#50a5f1", growing: "#2ab57d", fattening: "#ff6f61",
    gestation: "#a855f7", breeder: "#556ee6",
    exit: "#74788d", sale: "#34c38f",
};

const getROIColor = (roi: number) => {
    if (roi > 50) return "success";
    if (roi >= 20) return "info";
    if (roi >= 0) return "warning";
    return "danger";
};

const getROIBadgeClass = (roi: number) => {
    if (roi > 50) return "bg-success";
    if (roi >= 20) return "bg-info";
    if (roi >= 0) return "bg-warning";
    return "bg-danger";
};

// ─── LitterSelectionPanel ──────────────────────────────────────────────────────

interface LitterSelectionPanelProps {
    availableLitters: AvailableLitter[];
    loadingLitters: boolean;
    loadingLitterForm: boolean;
    selectedLitter: LitterSaleData | null;
    litterFormResponse: LitterFormResponse | null;
    onSelectLitter: (litter: AvailableLitter) => void;
    onClearLitter: () => void;
    onFieldChange: (field: keyof LitterSaleData, value: number) => void;
    t: (key: string, opts?: any) => string;
}

const litterStatusColor: Record<string, string> = {
    active: "#2ab57d",
    ready_to_wean: "#f1b44c",
    wean_overdue: "#ff6f61",
};

const LitterSelectionPanel: React.FC<LitterSelectionPanelProps> = ({
    availableLitters, loadingLitters, loadingLitterForm,
    selectedLitter, litterFormResponse,
    onSelectLitter, onClearLitter, onFieldChange, t,
}) => {
    if (loadingLitters) {
        return (
            <div className="text-center py-4">
                <Spinner color="primary" />
                <div className="text-muted small mt-2">{t("sellPigs.litter.loadingLitters", { defaultValue: "Cargando camadas..." })}</div>
            </div>
        );
    }

    if (!selectedLitter) {
        if (availableLitters.length === 0) {
            return (
                <div className="text-center text-muted py-5">
                    <i className="ri-seedling-line d-block mb-2" style={{ fontSize: 40, opacity: .2 }} />
                    <span className="small">{t("sellPigs.litter.noActiveLitters", { defaultValue: "No hay camadas activas disponibles para venta" })}</span>
                </div>
            );
        }
        return (
            <Row className="g-3">
                {availableLitters.map(litter => {
                    const currentTotal = litter.currentMale + litter.currentFemale;
                    const statusColor = litterStatusColor[litter.status] || "#6c757d";
                    return (
                        <Col md={6} key={litter._id}>
                            <Card
                                className="mb-0 h-100 border"
                                style={{ borderRadius: 12, cursor: "pointer", transition: "all .15s" }}
                                onClick={() => onSelectLitter(litter)}
                            >
                                <CardBody className="p-3">
                                    <div className="d-flex align-items-start justify-content-between mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 bg-light text-muted"
                                                style={{ width: 36, height: 36 }}
                                            >
                                                <i className="ri-seedling-line" style={{ fontSize: 18 }} />
                                            </div>
                                            <div>
                                                <div className="fw-semibold" style={{ fontSize: 14 }}>{litter.code}</div>
                                                {litter.mother?.code && (
                                                    <span className="text-muted" style={{ fontSize: 12 }}>
                                                        <i className="ri-heart-line me-1" />{litter.mother.code}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span
                                            className="badge rounded-pill px-2"
                                            style={{ fontSize: 10, background: `${statusColor}20`, color: statusColor }}
                                        >
                                            {t(`litter.status.${litter.status}`, { defaultValue: litter.status })}
                                        </span>
                                    </div>
                                    <div className="d-flex gap-3 flex-wrap" style={{ fontSize: 12 }}>
                                        <span className="text-muted">
                                            <i className="ri-group-line me-1" />{currentTotal} {t("sellPigs.litter.piglets", { defaultValue: "lechones" })}
                                        </span>
                                        <span className="text-muted">
                                            <i className="ri-men-line me-1 text-info" />{litter.currentMale}
                                        </span>
                                        <span className="text-muted">
                                            <i className="ri-women-line me-1 text-danger" />{litter.currentFemale}
                                        </span>
                                        {litter.averageWeight > 0 && (
                                            <span className="text-muted">
                                                <i className="ri-scales-3-line me-1" />{litter.averageWeight.toFixed(1)} kg {t("sellPigs.label.kgAvg", { defaultValue: "kg prom." })}
                                            </span>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        );
    }

    // Litter selected — show form fields
    const maxPiglets = litterFormResponse
        ? litterFormResponse.litter.currentTotal
        : (selectedLitter.pigCount || 0);

    return (
        <Card className="border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <CardBody>
                {loadingLitterForm ? (
                    <div className="text-center py-3"><Spinner color="primary" size="sm" /></div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center gap-2">
                                <i className="ri-seedling-line text-success" style={{ fontSize: 18 }} />
                                <span className="fw-semibold">{selectedLitter.litterCode}</span>
                                {litterFormResponse && (
                                    <span className="text-muted small">
                                        — {t("sellPigs.litter.mother", { defaultValue: "Madre:" })} {litterFormResponse.litter.mother?.code ?? "—"}
                                    </span>
                                )}
                            </div>
                            <button type="button" className="btn btn-sm text-muted px-2" onClick={onClearLitter}>
                                <i className="ri-close-line" />
                            </button>
                        </div>

                        {/* Cost info */}
                        {litterFormResponse && (
                            <div
                                className="d-flex gap-4 mb-3 p-3 rounded-3"
                                style={{ background: "#f8f9fa", fontSize: 12 }}
                            >
                                <div>
                                    <div className="text-muted text-uppercase" style={{ fontSize: 10, letterSpacing: ".5px" }}>{t("sellPigs.litter.available", { defaultValue: "Disponibles" })}</div>
                                    <div className="fw-bold" style={{ color: "#2ab57d" }}>{litterFormResponse.litter.currentTotal}</div>
                                </div>
                                <div>
                                    <div className="text-muted text-uppercase" style={{ fontSize: 10, letterSpacing: ".5px" }}>{t("sellPigs.litter.avgWeight", { defaultValue: "Peso prom." })}</div>
                                    <div className="fw-bold">{litterFormResponse.litter.averageWeight.toFixed(1)} kg</div>
                                </div>
                                <div>
                                    <div className="text-muted text-uppercase" style={{ fontSize: 10, letterSpacing: ".5px" }}>{t("sellPigs.litter.costPerKg", { defaultValue: "Costo/kg" })}</div>
                                    <div className="fw-bold text-danger">${litterFormResponse.productionCosts.costPerKg.toFixed(0)}</div>
                                </div>
                                <div>
                                    <div className="text-muted text-uppercase" style={{ fontSize: 10, letterSpacing: ".5px" }}>{t("sellPigs.litter.suggested", { defaultValue: "Precio sug." })}</div>
                                    <div className="fw-bold text-success">${litterFormResponse.suggestedPricePerKg.toFixed(0)}</div>
                                </div>
                            </div>
                        )}

                        {/* Input fields */}
                        <Row className="g-3">
                            <Col md={3}>
                                <Label className="form-label small mb-1">
                                    {t("sellPigs.litter.field.pigCount", { defaultValue: "Cantidad" })}
                                    {litterFormResponse && <span className="text-muted ms-1">(máx. {maxPiglets})</span>}
                                </Label>
                                <Input
                                    type="number" min={1} max={maxPiglets}
                                    value={selectedLitter.pigCount}
                                    onChange={e => onFieldChange("pigCount", Math.min(Number(e.target.value), maxPiglets))}
                                    style={{ borderRadius: 8 }}
                                />
                            </Col>
                            <Col md={2}>
                                <Label className="form-label small mb-1">{t("sellPigs.litter.field.male", { defaultValue: "Machos" })}</Label>
                                <Input
                                    type="number" min={0}
                                    value={selectedLitter.male ?? ""}
                                    onChange={e => onFieldChange("male", Number(e.target.value))}
                                    placeholder="—"
                                    style={{ borderRadius: 8 }}
                                />
                            </Col>
                            <Col md={2}>
                                <Label className="form-label small mb-1">{t("sellPigs.litter.field.female", { defaultValue: "Hembras" })}</Label>
                                <Input
                                    type="number" min={0}
                                    value={selectedLitter.female ?? ""}
                                    onChange={e => onFieldChange("female", Number(e.target.value))}
                                    placeholder="—"
                                    style={{ borderRadius: 8 }}
                                />
                            </Col>
                            <Col md={2}>
                                <Label className="form-label small mb-1">{t("sellPigs.litter.field.avgWeight", { defaultValue: "Peso prom. (kg)" })}</Label>
                                <Input
                                    type="number" step="0.01" min={0}
                                    value={selectedLitter.avgWeight}
                                    onChange={e => onFieldChange("avgWeight", Number(e.target.value))}
                                    style={{ borderRadius: 8 }}
                                />
                            </Col>
                            <Col md={3}>
                                <Label className="form-label small mb-1">{t("sellPigs.label.pricePerKg", { defaultValue: "Precio / kg" })}</Label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0" style={{ borderRadius: "8px 0 0 8px" }}>$</span>
                                    <Input
                                        type="number" step="0.01" min={0}
                                        value={selectedLitter.pricePerKg}
                                        onChange={e => onFieldChange("pricePerKg", Number(e.target.value))}
                                        className="border-start-0"
                                        style={{ borderRadius: "0 8px 8px 0" }}
                                    />
                                </div>
                                {litterFormResponse && (
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm p-0 mt-1 text-decoration-none"
                                        style={{ fontSize: 12 }}
                                        onClick={() => onFieldChange("pricePerKg", litterFormResponse.suggestedPricePerKg)}
                                    >
                                        <i className="ri-magic-line me-1" />
                                        {t("sellPigs.label.useSuggested", { defaultValue: "Usar sugerido:" })} <span className="fw-bold text-success">${litterFormResponse.suggestedPricePerKg}</span>
                                    </button>
                                )}
                            </Col>
                        </Row>

                        {/* Auto-calculated totals */}
                        <div className="mt-3 pt-2 border-top d-flex gap-4" style={{ fontSize: 12 }}>
                            <div>
                                <span className="text-muted">{t("sellPigs.litter.totalWeight", { defaultValue: "Peso total:" })}</span>{" "}
                                <span className="fw-bold" style={{ color: "#50a5f1" }}>{selectedLitter.totalWeight.toFixed(1)} kg</span>
                            </div>
                            <div>
                                <span className="text-muted">{t("sellPigs.litter.totalPrice", { defaultValue: "Total lechones:" })}</span>{" "}
                                <span className="fw-bold text-success">${selectedLitter.totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
};

// ─── Component ─────────────────────────────────────────────────────────────────

const SellPigsFormV2: React.FC<SellPigsFormV2Props> = ({ groupId, onSave }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);

    const sexConfig: Record<string, { label: string; icon: string; className: string; bg: string }> = {
        male: { label: t("pigs.sex.male", { defaultValue: "Macho" }), icon: "ri-men-line", className: "text-info", bg: "rgba(80,165,241,.12)" },
        female: { label: t("pigs.sex.female", { defaultValue: "Hembra" }), icon: "ri-women-line", className: "text-danger", bg: "rgba(232,62,140,.12)" },
    };
    const userLogged = getEffectiveUser();
    const isClassicMode = Boolean(groupId);

    // ── Navigation ──
    const [activeStep, setActiveStep] = useState(1);
    const [selectionMode, setSelectionMode] = useState<SelectionMode>("group");

    // ── Loading states ──
    const [loading, setLoading] = useState(true);
    const [loadingGroupPigs, setLoadingGroupPigs] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Data ──
    const [availableGroups, setAvailableGroups] = useState<AvailableGroup[]>([]);
    const [availablePigs, setAvailablePigs] = useState<AvailablePig[]>([]);
    const [selectedPigs, setSelectedPigs] = useState<SelectedPig[]>([]);
    const [globalPricePerKg, setGlobalPricePerKg] = useState(0);
    const [suggestedPricePerKg, setSuggestedPricePerKg] = useState(0);
    const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [nextSaleCode, setNextSaleCode] = useState("");

    // ── Group modal ──
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [focusedGroup, setFocusedGroup] = useState<AvailableGroup | null>(null);
    const [groupModalPigs, setGroupModalPigs] = useState<AvailablePig[]>([]);
    const [groupModalSelectedIds, setGroupModalSelectedIds] = useState<Set<string>>(new Set());

    // ── Litter ──
    const [availableLitters, setAvailableLitters] = useState<AvailableLitter[]>([]);
    const [litterFormResponse, setLitterFormResponse] = useState<LitterFormResponse | null>(null);
    const [selectedLitter, setSelectedLitter] = useState<LitterSaleData | null>(null);
    const [loadingLitters, setLoadingLitters] = useState(false);
    const [loadingLitterForm, setLoadingLitterForm] = useState(false);
    const [includeLitter, setIncludeLitter] = useState(false);

    // ── Individual filters ──
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
    const [pigFilters, setPigFilters] = useState<PigFiltersState>({
        status: "alive", currentStage: "", origin: "", sex: "", breed: "",
        weightRange: [0, 500],
    });

    // ── Form ──
    const [formData, setFormData] = useState<SaleFormData>({
        code: "",
        saleDate: new Date().toISOString().split("T")[0],
        saleType: isClassicMode ? "group" : "mixed",
        buyer: { name: "", type: "individual", contact: "", address: "", fiscalId: "" },
        paymentMethod: "cash",
        paymentStatus: "pending",
        notes: "",
    });

    // ── Errors & modals ──
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [modals, setModals] = useState({ success: false, error: false, confirmation: false });

    const toggleModal = (name: keyof typeof modals, state?: boolean) =>
        setModals(prev => ({ ...prev, [name]: state ?? !prev[name] }));

    // ─── Data fetching ────────────────────────────────────────────────────────

    const fetchNextCode = async () => {
        if (!configContext) return;
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/finances/pig_sales/next_code`
            );
            const code = res.data?.data?.code || "";
            setNextSaleCode(code);
            setFormData(prev => ({ ...prev, code }));
        } catch {
            // silently fail — user can still type a code manually
        }
    };

    const fetchClassicData = async () => {
        if (!configContext || !groupId) return;
        try {
            setLoading(true);
            const [res] = await Promise.all([
                configContext.axiosHelper.get(
                    `${configContext.apiUrl}/finances/pig_sales/sale_form_data/${groupId}`
                ),
                fetchNextCode(),
            ]);
            const data = res.data.data;
            setSuggestedPricePerKg(data.suggestedPricePerKg);
            setGlobalPricePerKg(data.suggestedPricePerKg);
            const pigs: SelectedPig[] = data.pigs.map((p: any) => ({
                id: p.id,
                pigId: p.id,
                code: p.code,
                originalWeight: p.currentWeight,
                weight: p.currentWeight,
                pricePerKg: data.suggestedPricePerKg,
                total: p.currentWeight * data.suggestedPricePerKg,
                age: p.age,
                status: p.status,
                selected: true,
            }));
            setSelectedPigs(pigs);
        } catch {
            toggleModal("error");
        } finally {
            setLoading(false);
        }
    };

    const fetchFreeData = async () => {
        if (!configContext) return;
        try {
            setLoading(true);
            const farmId = userLogged.farm_assigned;
            const [groupsRes] = await Promise.all([
                configContext.axiosHelper.get(
                    `${configContext.apiUrl}/group/find_by_farm/${farmId}`
                ),
                fetchNextCode(),
            ]);

            const groups: AvailableGroup[] = (groupsRes.data.data || [])
                .filter((g: any) => g.isActive)
                .map((g: any) => ({
                    _id: g._id,
                    code: g.code,
                    name: g.name,
                    stage: g.stage,
                    pigCount: g.pigCount || g.pigsInGroup?.length || 0,
                    avgWeight: g.avgWeight || 0,
                    suggestedPricePerKg: 0,
                }));
            setAvailableGroups(groups);
        } catch {
            toggleModal("error");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailablePigs = async () => {
        if (!configContext) return;
        try {
            const farmId = userLogged.farm_assigned;
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/pig/find_all_by_farm/${farmId}`
            );
            const pigs: AvailablePig[] = (res.data.data || [])
                .filter((p: any) => p.status === "alive")
                .map((p: any) => ({
                    id: p._id,
                    _id: p._id,
                    code: p.code,
                    currentWeight: p.weight || 0,
                    age: p.age || 0,
                    status: p.status,
                    currentStage: p.currentStage,
                    sex: p.sex,
                    breed: p.breed,
                }));
            setAvailablePigs(pigs);
        } catch {
            toggleModal("error");
        }
    };

    const fetchGroupPigs = async (group: AvailableGroup) => {
        if (!configContext) return;
        try {
            setLoadingGroupPigs(true);
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/group/find_by_id/${group._id}`
            );
            const groupDetail = res.data.data;
            const pigs: AvailablePig[] = (groupDetail.pigsInGroup || [])
                .filter((p: any) => !p.status || p.status === "alive")
                .map((p: any) => ({
                    id: p._id || p,
                    _id: p._id || p,
                    code: p.code || p,
                    currentWeight: p.weight || 0,
                    age: p.age || 0,
                    status: p.status || "alive",
                    currentStage: p.currentStage || group.stage,
                    sex: p.sex || "",
                    breed: p.breed || "",
                    groupId: group._id,
                    groupName: group.name,
                }));
            setGroupModalPigs(pigs);

            // Sync pigCount on the card with the real count from the API
            setAvailableGroups(prev => prev.map(g =>
                g._id === group._id ? { ...g, pigCount: pigs.length } : g
            ));

            // Pre-select all if this group was previously added fully, or those already selected
            const alreadySelectedInGroup = new Set(
                selectedPigs.filter(sp => sp.groupId === group._id).map(sp => sp.pigId)
            );
            setGroupModalSelectedIds(
                alreadySelectedInGroup.size > 0 ? alreadySelectedInGroup : new Set(pigs.map(p => p._id))
            );
        } catch {
            toggleModal("error");
        } finally {
            setLoadingGroupPigs(false);
        }
    };

    useEffect(() => {
        if (isClassicMode) fetchClassicData();
        else fetchFreeData();
    }, []);

    useEffect(() => {
        if (selectionMode === "individual" && availablePigs.length === 0) {
            fetchAvailablePigs();
        }
        if (selectionMode === "litter" && availableLitters.length === 0) {
            fetchAvailableLitters();
        }
    }, [selectionMode]);

    useEffect(() => {
        if (includeLitter && availableLitters.length === 0) {
            fetchAvailableLitters();
        }
    }, [includeLitter]);

    // ─── Litter helpers ───────────────────────────────────────────────────────

    const fetchAvailableLitters = async () => {
        if (!configContext) return;
        try {
            setLoadingLitters(true);
            const farmId = userLogged.farm_assigned;
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/litter/found_by_farm/${farmId}`
            );
            const litters: AvailableLitter[] = (res.data.data || [])
                .filter((l: any) => l.status !== "weaned")
                .map((l: any) => ({
                    _id: l._id,
                    code: l.code,
                    status: l.status,
                    currentMale: l.currentMale || 0,
                    currentFemale: l.currentFemale || 0,
                    averageWeight: l.averageWeight || 0,
                    mother: l.mother ? { code: l.mother.code, earTag: l.mother.earTag } : undefined,
                }));
            setAvailableLitters(litters);
        } catch {
            toggleModal("error");
        } finally {
            setLoadingLitters(false);
        }
    };

    const fetchLitterFormData = async (litter: AvailableLitter) => {
        if (!configContext) return;
        try {
            setLoadingLitterForm(true);
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/finances/pig_sales/litter_form/${litter._id}`
            );
            const data: LitterFormResponse = res.data.data;
            setLitterFormResponse(data);
            const total = data.litter.currentTotal;
            const avgW = data.litter.averageWeight;
            const pricePerKg = data.suggestedPricePerKg;
            setSelectedLitter({
                litterId: litter._id,
                litterCode: data.litter.code,
                pigCount: total,
                avgWeight: avgW,
                totalWeight: parseFloat((total * avgW).toFixed(2)),
                pricePerKg,
                totalPrice: parseFloat((total * avgW * pricePerKg).toFixed(2)),
            });
        } catch {
            toggleModal("error");
        } finally {
            setLoadingLitterForm(false);
        }
    };

    const handleLitterFieldChange = (field: keyof LitterSaleData, value: number) => {
        if (!selectedLitter) return;
        setSelectedLitter(prev => {
            if (!prev) return prev;
            const updated = { ...prev, [field]: value };
            if (field === "pigCount" || field === "avgWeight") {
                updated.totalWeight = parseFloat((updated.pigCount * updated.avgWeight).toFixed(2));
                updated.totalPrice = parseFloat((updated.totalWeight * updated.pricePerKg).toFixed(2));
            }
            if (field === "pricePerKg") {
                updated.totalPrice = parseFloat((updated.totalWeight * value).toFixed(2));
            }
            if (field === "totalWeight") {
                updated.totalPrice = parseFloat((value * updated.pricePerKg).toFixed(2));
            }
            return updated;
        });
    };

    const clearLitter = () => {
        setSelectedLitter(null);
        setLitterFormResponse(null);
    };

    // ─── Group modal actions ──────────────────────────────────────────────────

    const openGroupModal = async (group: AvailableGroup) => {
        setFocusedGroup(group);
        setGroupModalOpen(true);
        await fetchGroupPigs(group);
    };

    const confirmGroupSelection = () => {
        if (!focusedGroup) return;
        // Remove any pigs previously added from this group
        const withoutThisGroup = selectedPigs.filter(p => p.groupId !== focusedGroup._id);
        const price = globalPricePerKg || focusedGroup.suggestedPricePerKg || suggestedPricePerKg;
        const newPigs: SelectedPig[] = groupModalPigs
            .filter(p => groupModalSelectedIds.has(p._id))
            .map(p => ({
                id: p._id,
                pigId: p._id,
                code: p.code,
                originalWeight: p.currentWeight,
                weight: p.currentWeight,
                pricePerKg: price,
                total: p.currentWeight * price,
                age: p.age,
                status: p.status,
                groupId: focusedGroup._id,
                groupName: focusedGroup.name,
                selected: true,
            }));
        setSelectedPigs([...withoutThisGroup, ...newPigs]);
        setGroupModalOpen(false);
        setFocusedGroup(null);
        setGroupModalPigs([]);
    };

    const removeGroup = (gId: string) => {
        setSelectedPigs(prev => prev.filter(p => p.groupId !== gId));
    };

    // ─── Totals ───────────────────────────────────────────────────────────────

    const calculateTotals = () => {
        const active = selectedPigs.filter(p => p.selected);
        const pigSubtotal = active.reduce((s, p) => s + p.total, 0);
        const pigWeight = active.reduce((s, p) => s + p.weight, 0);
        const litterSubtotal = selectedLitter?.totalPrice || 0;
        const litterWeight = selectedLitter?.totalWeight || 0;
        const litterCount = selectedLitter?.pigCount || 0;
        const subtotal = pigSubtotal + litterSubtotal;
        const totalWeight = pigWeight + litterWeight;
        const totalAdditional = additionalCosts.reduce((s, c) => s + c.amount, 0);
        return {
            totalPigs: active.length + litterCount,
            totalWeight,
            subtotal,
            totalAdditional,
            totalNet: subtotal - totalAdditional,
            averagePricePerKg: totalWeight > 0 ? subtotal / totalWeight : 0,
        };
    };

    // ─── Global price sync ────────────────────────────────────────────────────

    const handleGlobalPriceChange = (value: string) => {
        const price = value === "" ? 0 : Number(value);
        setGlobalPricePerKg(price);
        setSelectedPigs(prev => prev.map(p => ({
            ...p, pricePerKg: price, total: p.weight * price,
        })));
    };

    // ─── Individual mode: apply selected pigs from table ─────────────────────

    const handleIndividualSelect = (rows: any[]) => {
        const price = globalPricePerKg || suggestedPricePerKg;
        const newPigs: SelectedPig[] = rows.map(p => ({
            id: p._id,
            pigId: p._id,
            code: p.code,
            originalWeight: p.currentWeight,
            weight: p.currentWeight,
            pricePerKg: price,
            total: p.currentWeight * price,
            age: p.age,
            status: p.status,
            selected: true,
        }));
        setSelectedPigs(newPigs);
    };

    // ─── Classic mode: weight edit ────────────────────────────────────────────

    const handleWeightChange = (pigId: string, value: string) => {
        const w = value === "" ? 0 : Number(value);
        setSelectedPigs(prev => prev.map(p =>
            p.pigId === pigId ? { ...p, weight: w, total: w * p.pricePerKg } : p
        ));
    };

    // ─── Additional costs ─────────────────────────────────────────────────────

    const addCost = () => setAdditionalCosts(prev => [...prev, { concept: "", amount: 0 }]);
    const removeCost = (i: number) => setAdditionalCosts(prev => prev.filter((_, idx) => idx !== i));
    const updateCost = (i: number, field: "concept" | "amount", value: string | number) => {
        setAdditionalCosts(prev => prev.map((c, idx) =>
            idx === i ? { ...c, [field]: value } : c
        ));
    };

    // ─── Validation ───────────────────────────────────────────────────────────

    const validateStep1 = () => {
        const errs: Record<string, string> = {};
        const active = selectedPigs.filter(p => p.selected);
        const hasLitter = !!selectedLitter;
        if (active.length === 0 && !hasLitter) {
            errs.selection = t("sellPigs.validation.selectAtLeastOne", { defaultValue: "Debes seleccionar al menos un cerdo para vender" });
        }
        if (active.some(p => p.weight <= 0)) errs.weight = t("sellPigs.validation.weightPositive", { defaultValue: "Todos los pesos deben ser mayores a 0" });
        if (active.some(p => p.pricePerKg <= 0)) errs.price = t("sellPigs.validation.pricePositive", { defaultValue: "El precio por kg debe ser mayor a 0" });
        if (hasLitter) {
            if (!selectedLitter!.pigCount || selectedLitter!.pigCount <= 0) {
                errs.litterCount = t("sellPigs.litter.validation.pigCountRequired", { defaultValue: "La cantidad de lechones debe ser mayor a 0" });
            }
            if (!selectedLitter!.avgWeight || selectedLitter!.avgWeight <= 0) {
                errs.litterWeight = t("sellPigs.litter.validation.avgWeightRequired", { defaultValue: "El peso promedio de los lechones debe ser mayor a 0" });
            }
            if (!selectedLitter!.pricePerKg || selectedLitter!.pricePerKg <= 0) {
                errs.litterPrice = t("sellPigs.litter.validation.priceRequired", { defaultValue: "El precio por kg de los lechones debe ser mayor a 0" });
            }
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = () => {
        const errs: Record<string, string> = {};
        if (!formData.buyer.name.trim()) errs.buyerName = t("sellPigs.validation.buyerNameRequired", { defaultValue: "El nombre del comprador es requerido" });
        if (!formData.paymentMethod) errs.paymentMethod = t("sellPigs.validation.paymentMethodRequired", { defaultValue: "El método de pago es requerido" });
        const badCosts = additionalCosts.filter(c => !c.concept.trim() || c.amount <= 0);
        if (badCosts.length > 0) errs.additionalCosts = t("sellPigs.validation.additionalCostsInvalid", { defaultValue: "Todos los costos adicionales deben tener concepto y monto válido" });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ─── Step navigation ──────────────────────────────────────────────────────

    const handleNext = () => {
        if (activeStep === 1 && validateStep1()) setActiveStep(2);
    };

    const handleBack = () => {
        if (activeStep > 1) setActiveStep(activeStep - 1);
    };

    const handleViewPreview = async () => {
        if (!validateStep2() || !configContext) return;
        const active = selectedPigs.filter(p => p.selected);
        const hasPigs = active.length > 0;
        const hasLitter = !!selectedLitter;
        const totalAdditional = additionalCosts.filter(c => c.concept.trim() && c.amount > 0).reduce((s, c) => s + c.amount, 0);

        // Litter-only: build preview locally using production cost data from litter form
        if (!hasPigs && hasLitter && litterFormResponse) {
            const litterPrice = selectedLitter!.totalPrice;
            const costs = litterFormResponse.productionCosts.total;
            const profit = litterPrice - costs - totalAdditional;
            const margin = litterPrice > 0 ? (profit / litterPrice) * 100 : 0;
            const roi = costs > 0 ? (profit / costs) * 100 : 0;
            setPreviewData({
                summary: {
                    totalPigs: selectedLitter!.pigCount,
                    totalWeight: selectedLitter!.totalWeight,
                    averageWeight: selectedLitter!.avgWeight,
                    averagePricePerKg: selectedLitter!.pricePerKg,
                    subtotal: litterPrice,
                    additionalCosts: totalAdditional,
                    totalAmount: litterPrice - totalAdditional,
                },
                profitability: {
                    totalCosts: costs,
                    estimatedProfit: profit,
                    profitMargin: margin,
                    roi,
                },
            });
            setActiveStep(3);
            return;
        }

        // Pigs (with or without litter): call calculate_preview
        try {
            setLoadingPreview(true);
            const res = await configContext.axiosHelper.create(
                `${configContext.apiUrl}/finances/pig_sales/calculate_preview`,
                {
                    groupId: groupId || undefined,
                    pigs: active.map(p => ({ pigId: p.pigId, weight: p.weight, pricePerKg: p.pricePerKg })),
                    litter: hasLitter ? {
                        litterId: selectedLitter!.litterId,
                        pigCount: selectedLitter!.pigCount,
                        totalWeight: selectedLitter!.totalWeight,
                        pricePerKg: selectedLitter!.pricePerKg,
                        totalPrice: selectedLitter!.totalPrice,
                    } : undefined,
                    additionalCosts: additionalCosts.filter(c => c.concept.trim() && c.amount > 0),
                }
            );
            setPreviewData(res.data.data);
            setActiveStep(3);
        } catch {
            toggleModal("error");
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleConfirmSale = async () => {
        toggleModal("confirmation", false);
        if (!configContext || !previewData) return;
        try {
            setIsSubmitting(true);
            const active = selectedPigs.filter(p => p.selected);
            const hasPigs = active.length > 0;
            const hasLitter = !!selectedLitter;

            // Determine saleType
            let saleType = formData.saleType;
            if (hasPigs && hasLitter) saleType = "mixed";
            else if (!hasPigs && hasLitter) saleType = "litter";
            else if (isClassicMode) saleType = "group";
            else if (selectionMode === "individual") saleType = "individual";

            await configContext.axiosHelper.create(
                `${configContext.apiUrl}/finances/pig_sales/create_sale`,
                {
                    code: formData.code,
                    farm: userLogged.farm_assigned,
                    saleDate: new Date(formData.saleDate),
                    saleType,
                    group: groupId ? {
                        groupId,
                        pigCount: active.length,
                        totalWeight: previewData.summary.totalWeight,
                        pricePerKg: previewData.summary.averagePricePerKg,
                        totalPrice: previewData.summary.subtotal,
                    } : undefined,
                    pigs: hasPigs ? active.map(p => ({
                        pig: p.pigId,
                        weight: p.weight,
                        pricePerKg: p.pricePerKg,
                        totalPrice: p.total,
                        age: p.age,
                        groupId: p.groupId,
                    })) : undefined,
                    litter: hasLitter ? {
                        litterId: selectedLitter!.litterId,
                        pigCount: selectedLitter!.pigCount,
                        male: selectedLitter!.male,
                        female: selectedLitter!.female,
                        avgWeight: selectedLitter!.avgWeight,
                        totalWeight: selectedLitter!.totalWeight,
                        pricePerKg: selectedLitter!.pricePerKg,
                        totalPrice: selectedLitter!.totalPrice,
                    } : undefined,
                    buyer: {
                        name: formData.buyer.name,
                        type: formData.buyer.type,
                        contact: formData.buyer.contact || undefined,
                        address: formData.buyer.address || undefined,
                        fiscalId: formData.buyer.fiscalId || undefined,
                    },
                    totalWeight: previewData.summary.totalWeight,
                    totalAmount: previewData.summary.totalAmount,
                    paymentMethod: formData.paymentMethod,
                    paymentStatus: formData.paymentStatus,
                    additionalCosts: additionalCosts.filter(c => c.concept.trim() && c.amount > 0),
                    notes: formData.notes || undefined,
                    registeredBy: userLogged._id,
                }
            );
            toggleModal("success");
        } catch {
            toggleModal("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Filtered pigs for individual mode ───────────────────────────────────

    const filteredPigs = availablePigs.filter(p => {
        if (searchTerm && !p.code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (pigFilters.status && p.status !== pigFilters.status) return false;
        if (pigFilters.currentStage && p.currentStage !== pigFilters.currentStage) return false;
        if (pigFilters.sex && p.sex !== pigFilters.sex) return false;
        if (pigFilters.breed && p.breed !== pigFilters.breed) return false;
        if (p.currentWeight < pigFilters.weightRange[0] || p.currentWeight > pigFilters.weightRange[1]) return false;
        return true;
    });

    const totals = calculateTotals();

    // ─── Pig columns for classic mode ─────────────────────────────────────────

    const classicPigColumns: Column<SelectedPig>[] = [
        {
            header: t("common.field.code", { defaultValue: "Código" }),
            accessor: "code",
            render: (_, row) => <span className="fw-semibold">{row.code}</span>,
        },
        {
            header: t("sellPigs.column.originalWeight", { defaultValue: "Peso Original" }),
            accessor: "originalWeight",
            render: v => <span className="text-muted">{Number(v).toFixed(2)} kg</span>,
        },
        {
            header: t("sellPigs.column.saleWeight", { defaultValue: "Peso Venta (kg)" }),
            accessor: "weight",
            render: (v, row) => (
                <Input
                    type="number" step="0.01"
                    value={v}
                    onChange={e => handleWeightChange(row.pigId, e.target.value)}
                    className="form-control-sm"
                    style={{ width: 100 }}
                />
            ),
        },
        {
            header: t("sellPigs.column.total", { defaultValue: "Total" }),
            accessor: "total",
            render: v => <span className="fw-bold">${Number(v).toFixed(2)}</span>,
        },
    ];

    const individualPigColumns: Column<AvailablePig>[] = [
        { header: t("common.field.code", { defaultValue: "Código" }), accessor: "code", render: (_, r) => <span className="fw-semibold">{r.code}</span> },
        { header: t("common.field.stage", { defaultValue: "Etapa" }), accessor: "currentStage", render: v => <Badge color="secondary">{t(`pigs.stage.${v}`, { defaultValue: v })}</Badge> },
        { header: t("common.field.weight", { defaultValue: "Peso" }), accessor: "currentWeight", render: v => `${Number(v).toFixed(1)} kg` },
        { header: t("sellPigs.column.sex", { defaultValue: "Sexo" }), accessor: "sex", render: v => v === "male" ? t("pigs.sex.male", { defaultValue: "Macho" }) : v === "female" ? t("pigs.sex.female", { defaultValue: "Hembra" }) : "—" },
    ];

    // ─── Render ───────────────────────────────────────────────────────────────

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <>
            {/* ── Step indicator ── */}
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    {[
                        { icon: "ri-list-check-2", label: t("sellPigs.step.selection", { defaultValue: "Selección" }) },
                        { icon: "ri-file-text-line", label: t("sellPigs.step.details", { defaultValue: "Detalles" }) },
                        { icon: "ri-eye-line", label: t("sellPigs.step.confirmation", { defaultValue: "Confirmación" }) },
                    ].map((step, i) => (
                        <NavItem key={i}>
                            <NavLink
                                href="#"
                                className={classnames({ active: activeStep === i + 1, done: activeStep > i + 1 })}
                                disabled
                            >
                                <i className={`${step.icon} me-2`} />
                                {step.label}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>

                {/* ══════════════════════ STEP 1 ══════════════════════ */}
                <TabPane tabId={1}>

                    {/* ── Header + mode toggle ── */}
                    <div className="d-flex align-items-start justify-content-between mb-4">
                        <div>
                            <h5 className="fw-bold mb-1">
                                {isClassicMode ? t("sellPigs.header.groupSale", { defaultValue: "Venta de grupo" }) : t("sellPigs.header.newSale", { defaultValue: "Nueva venta" })}
                            </h5>
                            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                                {isClassicMode
                                    ? t("sellPigs.header.adjustPricesHint", { defaultValue: "Ajusta precios y pesos antes de continuar." })
                                    : t("sellPigs.header.selectPigsHint", { defaultValue: "Selecciona los cerdos que deseas vender." })}
                            </p>
                        </div>
                        {!isClassicMode && (
                            <div
                                className="d-flex p-1 rounded-pill"
                                style={{ background: "#f0f0f0" }}
                            >
                                {([
                                    { key: "group" as SelectionMode, icon: "ri-folder-line", label: t("sellPigs.mode.byGroup", { defaultValue: "Por grupo" }) },
                                    { key: "individual" as SelectionMode, icon: "ri-user-search-line", label: t("sellPigs.mode.individual", { defaultValue: "Individual" }) },
                                    { key: "litter" as SelectionMode, icon: "ri-seedling-line", label: t("sellPigs.mode.litter", { defaultValue: "Camada" }) },
                                ]).map(opt => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        className={classnames(
                                            "btn btn-sm border-0 rounded-pill px-3 d-flex align-items-center gap-1",
                                            selectionMode === opt.key
                                                ? "bg-white shadow-sm fw-semibold text-dark"
                                                : "text-muted"
                                        )}
                                        style={{ transition: "all .2s" }}
                                        onClick={() => setSelectionMode(opt.key)}
                                    >
                                        <i className={opt.icon} />
                                        <span style={{ fontSize: 13 }}>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Error banner ── */}
                    {Object.keys(errors).length > 0 && (
                        <div className="alert alert-danger border-0 d-flex align-items-start gap-2 mb-3" style={{ borderRadius: 10 }}>
                            <FaExclamationTriangle className="mt-1 flex-shrink-0" />
                            <div className="small">{Object.values(errors).map((e, i) => <div key={i}>{e}</div>)}</div>
                        </div>
                    )}

                    {/* ── Pricing bar (shared by all modes) ── */}
                    <Card className="mb-3 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                        <CardBody className="py-3">
                            <Row className="align-items-center g-3">
                                <Col md={isClassicMode ? 4 : 3}>
                                    <Label className="form-label text-muted small text-uppercase mb-1" style={{ fontSize: 11, letterSpacing: ".5px" }}>
                                        {t("sellPigs.label.pricePerKg", { defaultValue: "Precio / kg" })}
                                    </Label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0" style={{ borderRadius: "8px 0 0 8px" }}>$</span>
                                        <Input
                                            type="number" step="0.01"
                                            value={globalPricePerKg}
                                            onChange={e => handleGlobalPriceChange(e.target.value)}
                                            placeholder="0.00"
                                            className="border-start-0"
                                            style={{ borderRadius: "0 8px 8px 0" }}
                                        />
                                    </div>
                                    {isClassicMode && suggestedPricePerKg > 0 && (
                                        <button
                                            type="button"
                                            className="btn btn-link btn-sm p-0 mt-1 text-decoration-none"
                                            style={{ fontSize: 12 }}
                                            onClick={() => handleGlobalPriceChange(suggestedPricePerKg.toString())}
                                        >
                                            <i className="ri-magic-line me-1" />
                                            {t("sellPigs.label.useSuggested", { defaultValue: "Usar sugerido:" })} <span className="fw-bold text-success">${suggestedPricePerKg.toFixed(2)}</span>
                                        </button>
                                    )}
                                </Col>
                                <Col>
                                    <div className="d-flex align-items-center justify-content-end gap-4">
                                        {[
                                            { label: t("sellPigs.summary.pigs", { defaultValue: "Cerdos" }), value: totals.totalPigs.toString(), color: "#556ee6" },
                                            { label: t("sellPigs.summary.totalWeight", { defaultValue: "Peso total" }), value: `${totals.totalWeight.toFixed(1)} kg`, color: "#50a5f1" },
                                            { label: t("sellPigs.summary.subtotal", { defaultValue: "Subtotal" }), value: `$${totals.subtotal.toFixed(2)}`, color: "#34c38f" },
                                        ].map(metric => (
                                            <div key={metric.label} className="text-end">
                                                <div className="text-muted text-uppercase" style={{ fontSize: 10, letterSpacing: ".5px" }}>
                                                    {metric.label}
                                                </div>
                                                <div className="fw-bold" style={{ fontSize: 18, color: metric.color }}>
                                                    {metric.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* ══ CLASSIC MODE ══ */}
                    {isClassicMode && (
                        <SelectableCustomTable
                            columns={classicPigColumns}
                            data={selectedPigs}
                            selectionMode="multiple"
                            onSelect={rows => setSelectedPigs(prev =>
                                prev.map(p => ({ ...p, selected: rows.some((r: any) => r.pigId === p.pigId) }))
                            )}
                            showSearchAndFilter={false}
                        />
                    )}

                    {/* ══ FREE MODE ══ */}
                    {!isClassicMode && (
                        <>
                            {/* ── Group sub-mode ── */}
                            {selectionMode === "group" && (
                                <>
                                    {availableGroups.length === 0 ? (
                                        <div className="text-center text-muted py-5">
                                            <i className="ri-inbox-line d-block mb-2" style={{ fontSize: 40, opacity: .2 }} />
                                            <span className="small">{t("sellPigs.empty.noActiveGroups", { defaultValue: "No hay grupos activos disponibles" })}</span>
                                        </div>
                                    ) : (
                                        <Row className="g-3">
                                            {availableGroups.map(group => {
                                                const addedCount = selectedPigs.filter(p => p.groupId === group._id).length;
                                                const isAdded = addedCount > 0;
                                                return (
                                                    <Col md={6} key={group._id}>
                                                        <Card
                                                            className={classnames("mb-0 h-100 border", {
                                                                "border-primary shadow-sm": isAdded,
                                                            })}
                                                            style={{
                                                                borderRadius: 12,
                                                                cursor: "pointer",
                                                                transition: "all .15s",
                                                            }}
                                                            onClick={() => openGroupModal(group)}
                                                        >
                                                            <CardBody className="p-3">
                                                                <div className="d-flex align-items-start justify-content-between mb-2">
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <div
                                                                            className={classnames(
                                                                                "d-flex align-items-center justify-content-center rounded-circle flex-shrink-0",
                                                                                isAdded ? "bg-primary bg-opacity-10 text-primary" : "bg-light text-muted"
                                                                            )}
                                                                            style={{ width: 36, height: 36 }}
                                                                        >
                                                                            <i className={isAdded ? "ri-checkbox-circle-fill" : "ri-folder-line"} style={{ fontSize: 18 }} />
                                                                        </div>
                                                                        <div>
                                                                            <div className="fw-semibold" style={{ fontSize: 14 }}>{group.name}</div>
                                                                            <span className="text-muted" style={{ fontSize: 12 }}>{group.code}</span>
                                                                        </div>
                                                                    </div>
                                                                    {isAdded && (
                                                                        <Badge color="primary" pill className="px-2" style={{ fontSize: 11 }}>
                                                                            {addedCount} sel.
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="d-flex gap-3 flex-wrap" style={{ fontSize: 12 }}>
                                                                    <span className="text-muted">
                                                                        <i className="ri-price-tag-3-line me-1" />{t(`pigs.stage.${group.stage}`, { defaultValue: group.stage })}
                                                                    </span>
                                                                    <span className="text-muted">
                                                                        <i className="ri-group-line me-1" />{group.pigCount} {t("sellPigs.label.pigs", { defaultValue: "cerdos" })}
                                                                    </span>
                                                                    <span className="text-muted">
                                                                        <i className="ri-scales-3-line me-1" />{group.avgWeight.toFixed(1)} {t("sellPigs.label.kgAvg", { defaultValue: "kg prom." })}
                                                                    </span>
                                                                </div>
                                                                {isAdded && (
                                                                    <div className="mt-2 pt-2 border-top d-flex justify-content-end">
                                                                        <Button
                                                                            size="sm" color="soft-danger" className="px-2 py-0"
                                                                            style={{ fontSize: 11 }}
                                                                            onClick={e => { e.stopPropagation(); removeGroup(group._id); }}
                                                                        >
                                                                            <i className="ri-close-line me-1" />{t("sellPigs.button.remove", { defaultValue: "Quitar" })}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    )}
                                </>
                            )}

                            {/* ── Individual sub-mode ── */}
                            {selectionMode === "individual" && (
                                <>
                                    <div className="mb-3">
                                        <PigFilters
                                            searchTerm={searchTerm}
                                            onSearchChange={setSearchTerm}
                                            filters={pigFilters}
                                            onFilterChange={(key, val) => setPigFilters(prev => ({ ...prev, [key]: val }))}
                                            onWeightRangeChange={val => setPigFilters(prev => ({
                                                ...prev,
                                                weightRange: val as [number, number],
                                            }))}
                                            onClearFilters={() => setPigFilters({
                                                status: "alive", currentStage: "", origin: "",
                                                sex: "", breed: "", weightRange: [0, 500],
                                            })}
                                            popoverOpen={filterPopoverOpen}
                                            onTogglePopover={() => setFilterPopoverOpen(p => !p)}
                                        />
                                    </div>

                                    {availablePigs.length === 0 ? (
                                        <div className="text-center py-4">
                                            <Spinner color="primary" />
                                        </div>
                                    ) : (
                                        <SelectableCustomTable
                                            columns={individualPigColumns}
                                            data={filteredPigs}
                                            selectionMode="multiple"
                                            onSelect={handleIndividualSelect}
                                            showSearchAndFilter={false}
                                        />
                                    )}
                                </>
                            )}

                            {/* ── Litter sub-mode ── */}
                            {selectionMode === "litter" && (
                                <LitterSelectionPanel
                                    availableLitters={availableLitters}
                                    loadingLitters={loadingLitters}
                                    loadingLitterForm={loadingLitterForm}
                                    selectedLitter={selectedLitter}
                                    litterFormResponse={litterFormResponse}
                                    onSelectLitter={fetchLitterFormData}
                                    onClearLitter={clearLitter}
                                    onFieldChange={handleLitterFieldChange}
                                    t={t}
                                />
                            )}

                            {/* ── Include litter toggle (group / individual modes) ── */}
                            {selectionMode !== "litter" && (
                                <div className="mt-4">
                                    <div
                                        className="d-flex align-items-center justify-content-between p-3 rounded-3 border border-dashed"
                                        style={{ borderColor: includeLitter ? "#556ee6" : "#dee2e6", background: includeLitter ? "rgba(85,110,230,.04)" : "#fafbfc", cursor: "pointer" }}
                                        onClick={() => { setIncludeLitter(p => !p); if (includeLitter) clearLitter(); }}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ri-seedling-line" style={{ fontSize: 18, color: includeLitter ? "#556ee6" : "#adb5bd" }} />
                                            <span className="fw-semibold" style={{ fontSize: 13, color: includeLitter ? "#556ee6" : "#495057" }}>
                                                {t("sellPigs.litter.includeToggle", { defaultValue: "Incluir lechones de camada" })}
                                            </span>
                                        </div>
                                        <div
                                            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                            style={{ width: 22, height: 22, background: includeLitter ? "#556ee6" : "#e9ecef", transition: "all .2s" }}
                                        >
                                            {includeLitter
                                                ? <i className="ri-check-line text-white" style={{ fontSize: 13 }} />
                                                : <i className="ri-add-line text-muted" style={{ fontSize: 13 }} />}
                                        </div>
                                    </div>
                                    {includeLitter && (
                                        <div className="mt-3">
                                            <LitterSelectionPanel
                                                availableLitters={availableLitters}
                                                loadingLitters={loadingLitters}
                                                loadingLitterForm={loadingLitterForm}
                                                selectedLitter={selectedLitter}
                                                litterFormResponse={litterFormResponse}
                                                onSelectLitter={fetchLitterFormData}
                                                onClearLitter={clearLitter}
                                                onFieldChange={handleLitterFieldChange}
                                                t={t}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Navigation ── */}
                    <div className="mt-4 d-flex justify-content-end">
                        <Button color="primary" className="px-4" style={{ borderRadius: 8 }} onClick={handleNext}>
                            {t("sellPigs.button.continue", { defaultValue: "Continuar" })} <i className="ri-arrow-right-s-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                {/* ══════════════════════ STEP 2 ══════════════════════ */}
                <TabPane tabId={2}>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-1">{t("sellPigs.step2.title", { defaultValue: "Detalles de la venta" })}</h5>
                        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                            {t("sellPigs.step2.subtitle", { defaultValue: "Completa la información del comprador y condiciones de pago." })}
                        </p>
                    </div>

                    {Object.keys(errors).length > 0 && (
                        <div className="alert alert-danger border-0 d-flex align-items-start gap-2 mb-3" style={{ borderRadius: 10 }}>
                            <FaExclamationTriangle className="mt-1 flex-shrink-0" />
                            <div className="small">{Object.values(errors).map((e, i) => <div key={i}>{e}</div>)}</div>
                        </div>
                    )}

                    {/* ── Sale info strip ── */}
                    <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                        <CardBody className="py-3">
                            <Row className="align-items-center g-3">
                                <Col md={4}>
                                    <Label className="form-label text-muted small text-uppercase mb-1" style={{ fontSize: 11, letterSpacing: ".5px" }}>
                                        {t("sellPigs.label.saleCode", { defaultValue: "Código de venta" })}
                                    </Label>
                                    <Input
                                        type="text"
                                        value={formData.code}
                                        onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
                                        className="fw-semibold"
                                        style={{ borderRadius: 8 }}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Label className="form-label text-muted small text-uppercase mb-1" style={{ fontSize: 11, letterSpacing: ".5px" }}>
                                        {t("sellPigs.label.saleDate", { defaultValue: "Fecha de venta" })}
                                    </Label>
                                    <Input
                                        type="date"
                                        value={formData.saleDate}
                                        onChange={e => setFormData(p => ({ ...p, saleDate: e.target.value }))}
                                        style={{ borderRadius: 8 }}
                                    />
                                </Col>
                                <Col md={4} className="d-flex align-items-end justify-content-end">
                                    <div className="text-end">
                                        <div className="text-muted text-uppercase" style={{ fontSize: 10, letterSpacing: ".5px" }}>{t("sellPigs.summary.title", { defaultValue: "Resumen" })}</div>
                                        <span className="fw-bold" style={{ fontSize: 15, color: "#556ee6" }}>
                                            {totals.totalPigs} {t("sellPigs.label.pigs", { defaultValue: "cerdos" })}
                                        </span>
                                        <span className="text-muted mx-2">&middot;</span>
                                        <span className="fw-bold" style={{ fontSize: 15, color: "#34c38f" }}>
                                            ${totals.subtotal.toFixed(2)}
                                        </span>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* ── Buyer section ── */}
                    <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: 11, letterSpacing: "1px" }}>
                        <i className="ri-user-3-line me-2" />{t("sellPigs.section.buyer", { defaultValue: "Comprador" })}
                    </h6>
                    <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                        <CardBody>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Label className="form-label small mb-1">
                                        {t("common.field.name", { defaultValue: "Nombre" })} <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.name}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, name: e.target.value } }))}
                                        placeholder={t("sellPigs.placeholder.buyerName", { defaultValue: "Nombre completo o razón social" })}
                                        invalid={!!errors.buyerName}
                                        style={{ borderRadius: 8 }}
                                    />
                                </Col>
                                <Col md={6}>
                                    <Label className="form-label small mb-1">{t("sellPigs.label.buyerType", { defaultValue: "Tipo de comprador" })}</Label>
                                    <Input
                                        type="select"
                                        value={formData.buyer.type}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, type: e.target.value } }))}
                                        style={{ borderRadius: 8 }}
                                    >
                                        <option value="individual">{t("sellPigs.buyerType.individual", { defaultValue: "Individual" })}</option>
                                        <option value="company">{t("sellPigs.buyerType.company", { defaultValue: "Empresa" })}</option>
                                        <option value="slaughterhouse">{t("sellPigs.buyerType.slaughterhouse", { defaultValue: "Matadero" })}</option>
                                        <option value="other">{t("sellPigs.buyerType.other", { defaultValue: "Otro" })}</option>
                                    </Input>
                                </Col>
                                <Col md={4}>
                                    <Label className="form-label small mb-1">{t("sellPigs.label.contact", { defaultValue: "Contacto" })}</Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.contact}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, contact: e.target.value } }))}
                                        placeholder={t("sellPigs.placeholder.contact", { defaultValue: "Teléfono o email" })}
                                        style={{ borderRadius: 8 }}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Label className="form-label small mb-1">{t("sellPigs.label.address", { defaultValue: "Dirección" })}</Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.address}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, address: e.target.value } }))}
                                        placeholder={t("sellPigs.placeholder.address", { defaultValue: "Dirección (opcional)" })}
                                        style={{ borderRadius: 8 }}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Label className="form-label small mb-1">{t("sellPigs.label.fiscalId", { defaultValue: "RFC" })}</Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.fiscalId}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, fiscalId: e.target.value } }))}
                                        placeholder={t("sellPigs.placeholder.fiscalId", { defaultValue: "Identificación fiscal" })}
                                        style={{ borderRadius: 8 }}
                                    />
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* ── Payment section ── */}
                    <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: 11, letterSpacing: "1px" }}>
                        <i className="ri-bank-card-line me-2" />{t("sellPigs.section.payment", { defaultValue: "Pago" })}
                    </h6>
                    <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                        <CardBody>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Label className="form-label small mb-1">
                                        {t("sellPigs.label.paymentMethod", { defaultValue: "Método de pago" })} <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="select"
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData(p => ({ ...p, paymentMethod: e.target.value }))}
                                        style={{ borderRadius: 8 }}
                                    >
                                        <option value="cash">{t("sellPigs.paymentMethod.cash", { defaultValue: "Efectivo" })}</option>
                                        <option value="transfer">{t("sellPigs.paymentMethod.transfer", { defaultValue: "Transferencia" })}</option>
                                        <option value="check">{t("sellPigs.paymentMethod.check", { defaultValue: "Cheque" })}</option>
                                        <option value="credit">{t("sellPigs.paymentMethod.credit", { defaultValue: "Crédito" })}</option>
                                        <option value="other">{t("sellPigs.paymentMethod.other", { defaultValue: "Otro" })}</option>
                                    </Input>
                                </Col>
                                <Col md={6}>
                                    <Label className="form-label small mb-1">{t("sellPigs.label.paymentStatus", { defaultValue: "Estado del pago" })}</Label>
                                    <Input
                                        type="select"
                                        value={formData.paymentStatus}
                                        onChange={e => setFormData(p => ({ ...p, paymentStatus: e.target.value }))}
                                        style={{ borderRadius: 8 }}
                                    >
                                        <option value="pending">{t("sellPigs.paymentStatus.pending", { defaultValue: "Pendiente" })}</option>
                                        <option value="partial">{t("sellPigs.paymentStatus.partial", { defaultValue: "Parcial" })}</option>
                                        <option value="completed">{t("sellPigs.paymentStatus.completed", { defaultValue: "Completado" })}</option>
                                    </Input>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* ── Additional costs ── */}
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-uppercase text-muted mb-0" style={{ fontSize: 11, letterSpacing: "1px" }}>
                            <i className="ri-money-dollar-circle-line me-2" />{t("sellPigs.section.additionalCosts", { defaultValue: "Costos adicionales" })}
                        </h6>
                        <Button
                            size="sm" color="soft-primary"
                            className="rounded-pill px-3"
                            style={{ fontSize: 12 }}
                            onClick={addCost}
                        >
                            <i className="ri-add-line me-1" />{t("sellPigs.button.addCost", { defaultValue: "Agregar costo" })}
                        </Button>
                    </div>
                    {additionalCosts.length === 0 ? (
                        <div
                            className="text-center text-muted py-4 mb-4 border border-dashed rounded-3"
                            style={{ borderColor: "#dee2e6", background: "#fafbfc" }}
                        >
                            <i className="ri-price-tag-3-line d-block mb-1" style={{ fontSize: 24, opacity: .3 }} />
                            <span className="small">{t("sellPigs.empty.noAdditionalCosts", { defaultValue: "Sin costos adicionales. Haz clic en \"Agregar costo\" para incluir transporte, comisiones, etc." })}</span>
                        </div>
                    ) : (
                        <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                            <CardBody className="pb-2">
                                {additionalCosts.map((cost, idx) => (
                                    <div key={idx} className="d-flex gap-2 align-items-center mb-2">
                                        <Input
                                            type="text" placeholder={t("sellPigs.placeholder.costConcept", { defaultValue: "Ej: Transporte, Comisión..." })}
                                            value={cost.concept}
                                            onChange={e => updateCost(idx, "concept", e.target.value)}
                                            className="flex-grow-1"
                                            style={{ borderRadius: 8 }}
                                        />
                                        <div className="input-group flex-shrink-0" style={{ width: 160 }}>
                                            <span className="input-group-text bg-light" style={{ borderRadius: "8px 0 0 8px" }}>$</span>
                                            <Input
                                                type="number" step="0.01" placeholder="0.00"
                                                value={cost.amount}
                                                onChange={e => updateCost(idx, "amount", Number(e.target.value))}
                                                style={{ borderRadius: "0 8px 8px 0" }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm text-muted px-2"
                                            onClick={() => removeCost(idx)}
                                            title={t("common.button.delete", { defaultValue: "Eliminar" })}
                                        >
                                            <i className="ri-delete-bin-line" />
                                        </button>
                                    </div>
                                ))}
                            </CardBody>
                        </Card>
                    )}

                    {/* ── Notes ── */}
                    <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: 11, letterSpacing: "1px" }}>
                        <i className="ri-sticky-note-line me-2" />{t("sellPigs.section.notes", { defaultValue: "Notas" })}
                    </h6>
                    <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                        <CardBody>
                            <Input
                                type="textarea" rows={3}
                                value={formData.notes}
                                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                placeholder={t("sellPigs.placeholder.notes", { defaultValue: "Observaciones adicionales sobre la venta..." })}
                                style={{ borderRadius: 8 }}
                            />
                        </CardBody>
                    </Card>

                    {/* ── Navigation ── */}
                    <div className="d-flex justify-content-between align-items-center pt-2">
                        <Button color="light" className="px-3" style={{ borderRadius: 8 }} onClick={handleBack}>
                            <i className="ri-arrow-left-s-line me-1" />{t("common.button.back", { defaultValue: "Atrás" })}
                        </Button>
                        <Button
                            color="primary"
                            className="px-4"
                            style={{ borderRadius: 8 }}
                            onClick={handleViewPreview}
                            disabled={loadingPreview}
                        >
                            {loadingPreview
                                ? <><Spinner size="sm" className="me-2" />{t("sellPigs.button.calculating", { defaultValue: "Calculando..." })}</>
                                : <>{t("sellPigs.button.viewPreview", { defaultValue: "Ver preview" })} <i className="ri-arrow-right-s-line ms-1" /></>}
                        </Button>
                    </div>
                </TabPane>

                {/* ── STEP 3 ── */}
                <TabPane tabId={3}>
                    {previewData && (
                        <>
                            <div className="mb-4">
                                <h5 className="fw-bold mb-1 text-dark">{t("sellPigs.step3.title", { defaultValue: "Preview y Confirmación" })}</h5>
                                <p className="text-muted small">{t("sellPigs.step3.subtitle", { defaultValue: "Revisa los detalles antes de confirmar la venta." })}</p>
                            </div>

                            <Row>
                                <Col lg={6} className="mb-3">
                                    <Card className="h-100">
                                        <CardHeader className="bg-light">
                                            <h6 className="mb-0 fw-bold">{t("sellPigs.preview.saleSummary", { defaultValue: "Resumen de Venta" })}</h6>
                                        </CardHeader>
                                        <CardBody>
                                            <Row className="g-3 mb-3">
                                                {[
                                                    { label: t("sellPigs.preview.totalPigs", { defaultValue: "Total Cerdos" }), value: previewData.summary.totalPigs, color: "primary", suffix: "" },
                                                    { label: t("sellPigs.preview.totalWeight", { defaultValue: "Peso Total" }), value: previewData.summary.totalWeight.toFixed(2), color: "info", suffix: " kg" },
                                                    { label: t("sellPigs.preview.avgWeight", { defaultValue: "Peso Promedio" }), value: previewData.summary.averageWeight.toFixed(2), color: "secondary", suffix: " kg" },
                                                    { label: t("sellPigs.preview.avgPrice", { defaultValue: "Precio Promedio" }), value: `$${previewData.summary.averagePricePerKg.toFixed(2)}`, color: "warning", suffix: "/kg" },
                                                ].map(({ label, value, color, suffix }) => (
                                                    <Col xs={6} key={label}>
                                                        <div className="text-center p-3 bg-light rounded">
                                                            <div className="text-muted small mb-1">{label}</div>
                                                            <div className={`fs-5 fw-bold text-${color}`}>{value}{suffix}</div>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                            <hr />
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">{t("sellPigs.preview.subtotal", { defaultValue: "Subtotal:" })}</span>
                                                <span className="fw-bold">${previewData.summary.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">{t("sellPigs.preview.additionalCosts", { defaultValue: "Costos Adicionales:" })}</span>
                                                <span className="fw-bold text-danger">-${previewData.summary.additionalCosts.toFixed(2)}</span>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between">
                                                <span className="fw-bold fs-5">{t("sellPigs.preview.netTotal", { defaultValue: "Total Neto:" })}</span>
                                                <span className="fw-bold fs-5 text-success">${previewData.summary.totalAmount.toFixed(2)}</span>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col lg={6} className="mb-3">
                                    <Card className={`h-100 border-2 border-${getROIColor(previewData.profitability.roi)}`}>
                                        <CardHeader className={`bg-${getROIColor(previewData.profitability.roi)} text-white`}>
                                            <h6 className="mb-0 fw-bold">{t("sellPigs.preview.profitabilityAnalysis", { defaultValue: "Análisis de Rentabilidad" })}</h6>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="text-center mb-4">
                                                <div className="text-muted mb-2 small">{t("sellPigs.preview.roi", { defaultValue: "Retorno de Inversión (ROI)" })}</div>
                                                <div className={`display-4 fw-bold text-${getROIColor(previewData.profitability.roi)}`}>
                                                    {previewData.profitability.roi.toFixed(1)}%
                                                </div>
                                                <Badge className={`${getROIBadgeClass(previewData.profitability.roi)} mt-2`}>
                                                    {previewData.profitability.roi > 50 ? t("sellPigs.roi.excellent", { defaultValue: "Excelente" })
                                                        : previewData.profitability.roi >= 20 ? t("sellPigs.roi.good", { defaultValue: "Bueno" })
                                                            : previewData.profitability.roi >= 0 ? t("sellPigs.roi.regular", { defaultValue: "Regular" })
                                                                : t("sellPigs.roi.loss", { defaultValue: "Pérdida" })}
                                                </Badge>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted small">{t("sellPigs.preview.productionCosts", { defaultValue: "Costos de Producción:" })}</span>
                                                <span className="fw-bold small">${previewData.profitability.totalCosts.toFixed(2)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted small">{t("sellPigs.preview.estimatedProfit", { defaultValue: "Ganancia Estimada:" })}</span>
                                                <span className={`fw-bold small text-${previewData.profitability.estimatedProfit >= 0 ? "success" : "danger"}`}>
                                                    ${previewData.profitability.estimatedProfit.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted small">{t("sellPigs.preview.profitMargin", { defaultValue: "Margen de Ganancia:" })}</span>
                                                <span className="fw-bold small">{previewData.profitability.profitMargin.toFixed(1)}%</span>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            <div className="alert alert-info d-flex align-items-start gap-2 mb-4">
                                <FaCheckCircle className="mt-1 flex-shrink-0" />
                                <div className="small">
                                    <span className="fw-bold">{t("sellPigs.alert.important", { defaultValue: "Importante:" })} </span>
                                    {t("sellPigs.alert.confirmWarning", { defaultValue: "Al confirmar, se crearán las entradas financieras" })}
                                    {isClassicMode ? t("sellPigs.alert.classicModeExtra", { defaultValue: ", se cerrará el ciclo de producción" }) : t("sellPigs.alert.freeModeExtra", { defaultValue: " y se actualizará el estado de los cerdos vendidos" })}
                                    {t("sellPigs.alert.irreversible", { defaultValue: ". Esta acción no se puede deshacer." })}
                                </div>
                            </div>

                            <div className="d-flex justify-content-between">
                                <Button color="light" onClick={handleBack} disabled={isSubmitting}>
                                    <i className="ri-arrow-left-line me-2" />{t("sellPigs.button.backToEdit", { defaultValue: "Volver a editar" })}
                                </Button>
                                <Button color="success" onClick={() => toggleModal("confirmation", true)} disabled={isSubmitting}>
                                    <i className="ri-check-line me-2" />{t("sellPigs.button.confirmSale", { defaultValue: "Confirmar Venta" })}
                                </Button>
                            </div>
                        </>
                    )}
                </TabPane>
            </TabContent>

            {/* ── GROUP PIGS MODAL ── */}
            <Modal isOpen={groupModalOpen} toggle={() => setGroupModalOpen(false)} size="lg" centered scrollable>
                {/* ── Custom header ── */}
                <div className="px-4 pt-4 pb-0 d-flex align-items-start justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                        <div
                            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 bg-primary bg-opacity-10 text-primary"
                            style={{ width: 44, height: 44 }}
                        >
                            <i className="ri-folder-open-line" style={{ fontSize: 20 }} />
                        </div>
                        <div>
                            <h6 className="fw-bold mb-0" style={{ fontSize: 16 }}>{focusedGroup?.name}</h6>
                            <div className="d-flex gap-3 mt-1" style={{ fontSize: 12 }}>
                                <span className="text-muted"><i className="ri-hashtag me-1" />{focusedGroup?.code}</span>
                                <span className="text-muted"><i className="ri-price-tag-3-line me-1" />{t(`pigs.stage.${focusedGroup?.stage || ""}`, { defaultValue: focusedGroup?.stage || "" })}</span>
                                <span className="text-muted"><i className="ri-group-line me-1" />{groupModalPigs.length} {t("sellPigs.label.pigs", { defaultValue: "cerdos" })}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn btn-sm text-muted p-1"
                        onClick={() => setGroupModalOpen(false)}
                        style={{ lineHeight: 1 }}
                    >
                        <i className="ri-close-line" style={{ fontSize: 20 }} />
                    </button>
                </div>

                <ModalBody className="px-4 pt-3">
                    {loadingGroupPigs ? (
                        <div className="text-center py-5">
                            <Spinner color="primary" />
                            <div className="text-muted small mt-2">{t("sellPigs.loading.pigs", { defaultValue: "Cargando cerdos..." })}</div>
                        </div>
                    ) : (
                        <>
                            {/* ── Toolbar ── */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div
                                    className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
                                    style={{ background: "#f8f9fa", fontSize: 13 }}
                                >
                                    <i className="ri-checkbox-multiple-line text-primary" />
                                    <span className="text-muted">
                                        <span className="fw-bold text-dark">{groupModalSelectedIds.size}</span> {t("sellPigs.modal.ofSelected", { defaultValue: "de" })} {groupModalPigs.length} {t("sellPigs.modal.selected", { defaultValue: "seleccionados" })}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-soft-primary rounded-pill px-3"
                                    style={{ fontSize: 12 }}
                                    onClick={() => {
                                        const allSelected = groupModalSelectedIds.size === groupModalPigs.length;
                                        setGroupModalSelectedIds(
                                            allSelected ? new Set() : new Set(groupModalPigs.map(p => p._id))
                                        );
                                    }}
                                >
                                    <i className={classnames("me-1", {
                                        "ri-checkbox-line": groupModalSelectedIds.size !== groupModalPigs.length,
                                        "ri-checkbox-indeterminate-line": groupModalSelectedIds.size === groupModalPigs.length,
                                    })} />
                                    {groupModalSelectedIds.size === groupModalPigs.length ? t("sellPigs.modal.deselectAll", { defaultValue: "Deseleccionar todos" }) : t("sellPigs.modal.selectAll", { defaultValue: "Seleccionar todos" })}
                                </button>
                            </div>

                            {/* ── Pig list ── */}
                            <div className="d-flex flex-column gap-2" style={{ maxHeight: 380, overflowY: "auto" }}>
                                {groupModalPigs.map(pig => {
                                    const isChecked = groupModalSelectedIds.has(pig._id);
                                    return (
                                        <div
                                            key={pig._id}
                                            className={classnames(
                                                "d-flex align-items-center gap-3 p-3 rounded-3 border",
                                                isChecked ? "border-primary" : "border-light"
                                            )}
                                            style={{
                                                cursor: "pointer",
                                                transition: "all .15s",
                                                background: isChecked ? "rgba(85,110,230,.04)" : "#fff",
                                            }}
                                            onClick={() => setGroupModalSelectedIds(prev => {
                                                const next = new Set(prev);
                                                isChecked ? next.delete(pig._id) : next.add(pig._id);
                                                return next;
                                            })}
                                        >
                                            {/* Checkbox */}
                                            <div
                                                className="d-flex align-items-center justify-content-center flex-shrink-0 rounded"
                                                style={{
                                                    width: 22, height: 22,
                                                    border: isChecked ? "none" : "2px solid #d0d5dd",
                                                    background: isChecked ? "#556ee6" : "#fff",
                                                    transition: "all .15s",
                                                    borderRadius: 6,
                                                }}
                                            >
                                                {isChecked && <i className="ri-check-line text-white" style={{ fontSize: 14 }} />}
                                            </div>

                                            {/* Pig info */}
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-semibold" style={{ fontSize: 14 }}>{pig.code}</span>
                                                    <Badge
                                                        color=""
                                                        className="px-2"
                                                        style={{
                                                            fontSize: 10,
                                                            background: `${stageColor[pig.currentStage] || "#6c757d"}18`,
                                                            color: stageColor[pig.currentStage] || "#6c757d",
                                                            borderRadius: 4,
                                                        }}
                                                    >
                                                        {t(`pigs.stage.${pig.currentStage}`, { defaultValue: pig.currentStage })}
                                                    </Badge>
                                                    {pig.sex && sexConfig[pig.sex] && (
                                                        <span
                                                            className={`d-inline-flex align-items-center gap-1 px-2 rounded-pill ${sexConfig[pig.sex].className}`}
                                                            style={{ fontSize: 11, background: sexConfig[pig.sex].bg }}
                                                        >
                                                            <i className={sexConfig[pig.sex].icon} style={{ fontSize: 13 }} />
                                                            {sexConfig[pig.sex].label}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="d-flex gap-3 mt-1" style={{ fontSize: 12 }}>
                                                    {pig.age > 0 && (
                                                        <span className="text-muted">
                                                            <i className="ri-calendar-line me-1" />{pig.age} {t("sellPigs.label.days", { defaultValue: "días" })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Weight highlight */}
                                            <div
                                                className="text-center flex-shrink-0 rounded-3 px-3 py-1"
                                                style={{
                                                    background: isChecked ? "rgba(85,110,230,.1)" : "#f5f5f5",
                                                    minWidth: 72,
                                                }}
                                            >
                                                <div className="fw-bold" style={{ fontSize: 18, color: isChecked ? "#556ee6" : "#343a40" }}>
                                                    {pig.currentWeight.toFixed(1)}
                                                </div>
                                                <div className="text-uppercase fw-semibold" style={{ fontSize: 9, color: "#999", letterSpacing: ".5px" }}>kg</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </ModalBody>

                {/* ── Footer ── */}
                <div className="px-4 py-3 d-flex align-items-center justify-content-between border-top">
                    {groupModalSelectedIds.size > 0 && (
                        <div style={{ fontSize: 13 }}>
                            <span className="text-muted">{t("sellPigs.modal.totalWeight", { defaultValue: "Peso total:" })}</span>{" "}
                            <span className="fw-bold" style={{ color: "#50a5f1" }}>
                                {groupModalPigs
                                    .filter(p => groupModalSelectedIds.has(p._id))
                                    .reduce((sum, p) => sum + p.currentWeight, 0)
                                    .toFixed(1)} kg
                            </span>
                        </div>
                    )}
                    {groupModalSelectedIds.size === 0 && (
                        <div className="text-muted small">{t("sellPigs.modal.selectAtLeastOne", { defaultValue: "Selecciona al menos un cerdo" })}</div>
                    )}
                    <div className="d-flex gap-2">
                        <Button
                            color="light"
                            style={{ borderRadius: 8 }}
                            onClick={() => setGroupModalOpen(false)}
                        >
                            {t("common.button.cancel", { defaultValue: "Cancelar" })}
                        </Button>
                        <Button
                            color="primary"
                            className="px-4"
                            style={{ borderRadius: 8 }}
                            onClick={confirmGroupSelection}
                            disabled={groupModalSelectedIds.size === 0}
                        >
                            <i className="ri-check-line me-1" />
                            {t("common.button.confirm", { defaultValue: "Confirmar" })} ({groupModalSelectedIds.size})
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── CONFIRMATION MODAL ── */}
            <Modal isOpen={modals.confirmation} toggle={() => toggleModal("confirmation")} centered>
                <ModalHeader toggle={() => toggleModal("confirmation")}>
                    <i className="ri-alert-line text-warning me-2" />
                    {t("sellPigs.confirmModal.title", { defaultValue: "Confirmar Venta de Cerdos" })}
                </ModalHeader>
                <ModalBody>
                    <div className="text-center py-3">
                        <i className="ri-question-line text-warning" style={{ fontSize: "3.5rem" }} />
                        <h5 className="mt-3 mb-2">{t("sellPigs.confirmModal.question", { defaultValue: "¿Estás seguro de confirmar esta venta?" })}</h5>
                        <p className="text-muted small mb-0">
                            {t("sellPigs.confirmModal.warning", { defaultValue: "Esta acción no podrá deshacerse. Verifica que todos los datos sean correctos." })}
                        </p>
                        {previewData && (
                            <div className="mt-4 p-3 bg-light rounded text-start">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="fw-semibold small">{t("sellPigs.confirmModal.totalPigs", { defaultValue: "Total de cerdos:" })}</span>
                                    <span className="small">{previewData.summary.totalPigs}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="fw-semibold small">{t("sellPigs.confirmModal.totalWeight", { defaultValue: "Peso total:" })}</span>
                                    <span className="small">{previewData.summary.totalWeight.toFixed(2)} kg</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="fw-semibold small text-success">{t("sellPigs.confirmModal.totalAmount", { defaultValue: "Monto total:" })}</span>
                                    <span className="fw-bold small text-success">${previewData.summary.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => toggleModal("confirmation")} disabled={isSubmitting}>
                        {t("common.button.cancel", { defaultValue: "Cancelar" })}
                    </Button>
                    <Button color="success" onClick={handleConfirmSale} disabled={isSubmitting}>
                        {isSubmitting
                            ? <><Spinner size="sm" className="me-2" />{t("sellPigs.button.processing", { defaultValue: "Procesando..." })}</>
                            : <><i className="ri-check-line me-1" />{t("sellPigs.button.yesConfirmSale", { defaultValue: "Sí, Confirmar Venta" })}</>}
                    </Button>
                </ModalFooter>
            </Modal>

            <SuccessModal
                isOpen={modals.success}
                onClose={() => { toggleModal("success"); onSave(); }}
                message={t("sellPigs.success.message", { defaultValue: "La venta se ha registrado exitosamente" })}
            />
            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal("error")}
                message={t("sellPigs.error.message", { defaultValue: "Ha ocurrido un error al procesar la venta. Por favor, intente nuevamente." })}
            />
        </>
    );
};

export default SellPigsFormV2;
