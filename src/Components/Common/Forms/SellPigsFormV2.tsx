import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
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

type SelectionMode = "group" | "individual";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const stageLabel: Record<string, string> = {
    general: "General", piglet: "Lechón", lactation: "Lactancia",
    weaning: "Destete", growing: "Crecimiento", fattening: "Engorda",
    gestation: "Gestación", breeder: "Reproductor",
    exit: "Salida", sale: "Venta",
};

const stageColor: Record<string, string> = {
    general: "#6c757d", piglet: "#e83e8c", lactation: "#f1b44c",
    weaning: "#50a5f1", growing: "#2ab57d", fattening: "#ff6f61",
    gestation: "#a855f7", breeder: "#556ee6",
    exit: "#74788d", sale: "#34c38f",
};

const sexConfig: Record<string, { label: string; icon: string; className: string; bg: string }> = {
    male: { label: "Macho", icon: "ri-men-line", className: "text-info", bg: "rgba(80,165,241,.12)" },
    female: { label: "Hembra", icon: "ri-women-line", className: "text-danger", bg: "rgba(232,62,140,.12)" },
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

// ─── Component ─────────────────────────────────────────────────────────────────

const SellPigsFormV2: React.FC<SellPigsFormV2Props> = ({ groupId, onSave }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
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
    }, [selectionMode]);

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
        const subtotal = active.reduce((s, p) => s + p.total, 0);
        const totalWeight = active.reduce((s, p) => s + p.weight, 0);
        const totalAdditional = additionalCosts.reduce((s, c) => s + c.amount, 0);
        return {
            totalPigs: active.length,
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
        if (active.length === 0) errs.selection = "Debes seleccionar al menos un cerdo para vender";
        if (active.some(p => p.weight <= 0)) errs.weight = "Todos los pesos deben ser mayores a 0";
        if (active.some(p => p.pricePerKg <= 0)) errs.price = "El precio por kg debe ser mayor a 0";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = () => {
        const errs: Record<string, string> = {};
        if (!formData.buyer.name.trim()) errs.buyerName = "El nombre del comprador es requerido";
        if (!formData.paymentMethod) errs.paymentMethod = "El método de pago es requerido";
        const badCosts = additionalCosts.filter(c => !c.concept.trim() || c.amount <= 0);
        if (badCosts.length > 0) errs.additionalCosts = "Todos los costos adicionales deben tener concepto y monto válido";
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
        try {
            setLoadingPreview(true);
            const active = selectedPigs.filter(p => p.selected);
            const res = await configContext.axiosHelper.create(
                `${configContext.apiUrl}/finances/pig_sales/calculate_preview`,
                {
                    groupId: groupId || undefined,
                    pigs: active.map(p => ({ pigId: p.pigId, weight: p.weight, pricePerKg: p.pricePerKg })),
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
            await configContext.axiosHelper.create(
                `${configContext.apiUrl}/finances/pig_sales/create_sale`,
                {
                    code: formData.code,
                    farm: userLogged.farm_assigned,
                    saleDate: new Date(formData.saleDate),
                    saleType: formData.saleType,
                    group: groupId ? {
                        groupId,
                        pigCount: active.length,
                        totalWeight: previewData.summary.totalWeight,
                        pricePerKg: previewData.summary.averagePricePerKg,
                        totalPrice: previewData.summary.subtotal,
                    } : undefined,
                    pigs: active.map(p => ({
                        pig: p.pigId,
                        weight: p.weight,
                        pricePerKg: p.pricePerKg,
                        totalPrice: p.total,
                        age: p.age,
                        groupId: p.groupId,
                    })),
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
            header: "Código",
            accessor: "code",
            render: (_, row) => <span className="fw-semibold">{row.code}</span>,
        },
        {
            header: "Peso Original",
            accessor: "originalWeight",
            render: v => <span className="text-muted">{Number(v).toFixed(2)} kg</span>,
        },
        {
            header: "Peso Venta (kg)",
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
            header: "Total",
            accessor: "total",
            render: v => <span className="fw-bold">${Number(v).toFixed(2)}</span>,
        },
    ];

    const individualPigColumns: Column<AvailablePig>[] = [
        { header: "Código", accessor: "code", render: (_, r) => <span className="fw-semibold">{r.code}</span> },
        { header: "Etapa", accessor: "currentStage", render: v => <Badge color="secondary">{stageLabel[v] || v}</Badge> },
        { header: "Peso", accessor: "currentWeight", render: v => `${Number(v).toFixed(1)} kg` },
        { header: "Sexo", accessor: "sex", render: v => v === "male" ? "Macho" : v === "female" ? "Hembra" : "—" },
    ];

    // ─── Render ───────────────────────────────────────────────────────────────

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <>
            {/* ── Step indicator ── */}
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    {[
                        { icon: "ri-list-check-2", label: "Selección" },
                        { icon: "ri-file-text-line", label: "Detalles" },
                        { icon: "ri-eye-line", label: "Confirmación" },
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
                                {isClassicMode ? "Venta de grupo" : "Nueva venta"}
                            </h5>
                            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                                {isClassicMode
                                    ? "Ajusta precios y pesos antes de continuar."
                                    : "Selecciona los cerdos que deseas vender."}
                            </p>
                        </div>
                        {!isClassicMode && (
                            <div
                                className="d-flex p-1 rounded-pill"
                                style={{ background: "#f0f0f0" }}
                            >
                                {([
                                    { key: "group" as SelectionMode, icon: "ri-folder-line", label: "Por grupo" },
                                    { key: "individual" as SelectionMode, icon: "ri-user-search-line", label: "Individual" },
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
                                        Precio / kg
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
                                            Usar sugerido: <span className="fw-bold text-success">${suggestedPricePerKg.toFixed(2)}</span>
                                        </button>
                                    )}
                                </Col>
                                <Col>
                                    <div className="d-flex align-items-center justify-content-end gap-4">
                                        {[
                                            { label: "Cerdos", value: totals.totalPigs.toString(), color: "#556ee6" },
                                            { label: "Peso total", value: `${totals.totalWeight.toFixed(1)} kg`, color: "#50a5f1" },
                                            { label: "Subtotal", value: `$${totals.subtotal.toFixed(2)}`, color: "#34c38f" },
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
                                            <span className="small">No hay grupos activos disponibles</span>
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
                                                                        <i className="ri-price-tag-3-line me-1" />{stageLabel[group.stage] || group.stage}
                                                                    </span>
                                                                    <span className="text-muted">
                                                                        <i className="ri-group-line me-1" />{group.pigCount} cerdos
                                                                    </span>
                                                                    <span className="text-muted">
                                                                        <i className="ri-scales-3-line me-1" />{group.avgWeight.toFixed(1)} kg prom.
                                                                    </span>
                                                                </div>
                                                                {isAdded && (
                                                                    <div className="mt-2 pt-2 border-top d-flex justify-content-end">
                                                                        <Button
                                                                            size="sm" color="soft-danger" className="px-2 py-0"
                                                                            style={{ fontSize: 11 }}
                                                                            onClick={e => { e.stopPropagation(); removeGroup(group._id); }}
                                                                        >
                                                                            <i className="ri-close-line me-1" />Quitar
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
                        </>
                    )}

                    {/* ── Navigation ── */}
                    <div className="mt-4 d-flex justify-content-end">
                        <Button color="primary" className="px-4" style={{ borderRadius: 8 }} onClick={handleNext}>
                            Continuar <i className="ri-arrow-right-s-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                {/* ══════════════════════ STEP 2 ══════════════════════ */}
                <TabPane tabId={2}>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-1">Detalles de la venta</h5>
                        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                            Completa la información del comprador y condiciones de pago.
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
                                        Código de venta
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
                                        Fecha de venta
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
                                        <div className="text-muted text-uppercase" style={{ fontSize: 10, letterSpacing: ".5px" }}>Resumen</div>
                                        <span className="fw-bold" style={{ fontSize: 15, color: "#556ee6" }}>
                                            {totals.totalPigs} cerdos
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
                        <i className="ri-user-3-line me-2" />Comprador
                    </h6>
                    <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                        <CardBody>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Label className="form-label small mb-1">
                                        Nombre <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.name}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, name: e.target.value } }))}
                                        placeholder="Nombre completo o razón social"
                                        invalid={!!errors.buyerName}
                                        style={{ borderRadius: 8 }}
                                    />
                                </Col>
                                <Col md={6}>
                                    <Label className="form-label small mb-1">Tipo de comprador</Label>
                                    <Input
                                        type="select"
                                        value={formData.buyer.type}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, type: e.target.value } }))}
                                        style={{ borderRadius: 8 }}
                                    >
                                        <option value="individual">Individual</option>
                                        <option value="company">Empresa</option>
                                        <option value="slaughterhouse">Matadero</option>
                                        <option value="other">Otro</option>
                                    </Input>
                                </Col>
                                <Col md={4}>
                                    <Label className="form-label small mb-1">Contacto</Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.contact}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, contact: e.target.value } }))}
                                        placeholder="Teléfono o email"
                                        style={{ borderRadius: 8 }}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Label className="form-label small mb-1">Dirección</Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.address}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, address: e.target.value } }))}
                                        placeholder="Dirección (opcional)"
                                        style={{ borderRadius: 8 }}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Label className="form-label small mb-1">RFC</Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.fiscalId}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, fiscalId: e.target.value } }))}
                                        placeholder="Identificación fiscal"
                                        style={{ borderRadius: 8 }}
                                    />
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* ── Payment section ── */}
                    <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: 11, letterSpacing: "1px" }}>
                        <i className="ri-bank-card-line me-2" />Pago
                    </h6>
                    <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                        <CardBody>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Label className="form-label small mb-1">
                                        Método de pago <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="select"
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData(p => ({ ...p, paymentMethod: e.target.value }))}
                                        style={{ borderRadius: 8 }}
                                    >
                                        <option value="cash">Efectivo</option>
                                        <option value="transfer">Transferencia</option>
                                        <option value="check">Cheque</option>
                                        <option value="credit">Crédito</option>
                                        <option value="other">Otro</option>
                                    </Input>
                                </Col>
                                <Col md={6}>
                                    <Label className="form-label small mb-1">Estado del pago</Label>
                                    <Input
                                        type="select"
                                        value={formData.paymentStatus}
                                        onChange={e => setFormData(p => ({ ...p, paymentStatus: e.target.value }))}
                                        style={{ borderRadius: 8 }}
                                    >
                                        <option value="pending">Pendiente</option>
                                        <option value="partial">Parcial</option>
                                        <option value="completed">Completado</option>
                                    </Input>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* ── Additional costs ── */}
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-uppercase text-muted mb-0" style={{ fontSize: 11, letterSpacing: "1px" }}>
                            <i className="ri-money-dollar-circle-line me-2" />Costos adicionales
                        </h6>
                        <Button
                            size="sm" color="soft-primary"
                            className="rounded-pill px-3"
                            style={{ fontSize: 12 }}
                            onClick={addCost}
                        >
                            <i className="ri-add-line me-1" />Agregar costo
                        </Button>
                    </div>
                    {additionalCosts.length === 0 ? (
                        <div
                            className="text-center text-muted py-4 mb-4 border border-dashed rounded-3"
                            style={{ borderColor: "#dee2e6", background: "#fafbfc" }}
                        >
                            <i className="ri-price-tag-3-line d-block mb-1" style={{ fontSize: 24, opacity: .3 }} />
                            <span className="small">Sin costos adicionales. Haz clic en "Agregar costo" para incluir transporte, comisiones, etc.</span>
                        </div>
                    ) : (
                        <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                            <CardBody className="pb-2">
                                {additionalCosts.map((cost, idx) => (
                                    <div key={idx} className="d-flex gap-2 align-items-center mb-2">
                                        <Input
                                            type="text" placeholder="Ej: Transporte, Comisión..."
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
                                            title="Eliminar"
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
                        <i className="ri-sticky-note-line me-2" />Notas
                    </h6>
                    <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                        <CardBody>
                            <Input
                                type="textarea" rows={3}
                                value={formData.notes}
                                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Observaciones adicionales sobre la venta..."
                                style={{ borderRadius: 8 }}
                            />
                        </CardBody>
                    </Card>

                    {/* ── Navigation ── */}
                    <div className="d-flex justify-content-between align-items-center pt-2">
                        <Button color="light" className="px-3" style={{ borderRadius: 8 }} onClick={handleBack}>
                            <i className="ri-arrow-left-s-line me-1" />Atrás
                        </Button>
                        <Button
                            color="primary"
                            className="px-4"
                            style={{ borderRadius: 8 }}
                            onClick={handleViewPreview}
                            disabled={loadingPreview}
                        >
                            {loadingPreview
                                ? <><Spinner size="sm" className="me-2" />Calculando...</>
                                : <>Ver preview <i className="ri-arrow-right-s-line ms-1" /></>}
                        </Button>
                    </div>
                </TabPane>

                {/* ── STEP 3 ── */}
                <TabPane tabId={3}>
                    {previewData && (
                        <>
                            <div className="mb-4">
                                <h5 className="fw-bold mb-1 text-dark">Preview y Confirmación</h5>
                                <p className="text-muted small">Revisa los detalles antes de confirmar la venta.</p>
                            </div>

                            <Row>
                                <Col lg={6} className="mb-3">
                                    <Card className="h-100">
                                        <CardHeader className="bg-light">
                                            <h6 className="mb-0 fw-bold">Resumen de Venta</h6>
                                        </CardHeader>
                                        <CardBody>
                                            <Row className="g-3 mb-3">
                                                {[
                                                    { label: "Total Cerdos", value: previewData.summary.totalPigs, color: "primary", suffix: "" },
                                                    { label: "Peso Total", value: previewData.summary.totalWeight.toFixed(2), color: "info", suffix: " kg" },
                                                    { label: "Peso Promedio", value: previewData.summary.averageWeight.toFixed(2), color: "secondary", suffix: " kg" },
                                                    { label: "Precio Promedio", value: `$${previewData.summary.averagePricePerKg.toFixed(2)}`, color: "warning", suffix: "/kg" },
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
                                                <span className="text-muted">Subtotal:</span>
                                                <span className="fw-bold">${previewData.summary.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Costos Adicionales:</span>
                                                <span className="fw-bold text-danger">-${previewData.summary.additionalCosts.toFixed(2)}</span>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between">
                                                <span className="fw-bold fs-5">Total Neto:</span>
                                                <span className="fw-bold fs-5 text-success">${previewData.summary.totalAmount.toFixed(2)}</span>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col lg={6} className="mb-3">
                                    <Card className={`h-100 border-2 border-${getROIColor(previewData.profitability.roi)}`}>
                                        <CardHeader className={`bg-${getROIColor(previewData.profitability.roi)} text-white`}>
                                            <h6 className="mb-0 fw-bold">Análisis de Rentabilidad</h6>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="text-center mb-4">
                                                <div className="text-muted mb-2 small">Retorno de Inversión (ROI)</div>
                                                <div className={`display-4 fw-bold text-${getROIColor(previewData.profitability.roi)}`}>
                                                    {previewData.profitability.roi.toFixed(1)}%
                                                </div>
                                                <Badge className={`${getROIBadgeClass(previewData.profitability.roi)} mt-2`}>
                                                    {previewData.profitability.roi > 50 ? "Excelente"
                                                        : previewData.profitability.roi >= 20 ? "Bueno"
                                                            : previewData.profitability.roi >= 0 ? "Regular"
                                                                : "Pérdida"}
                                                </Badge>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted small">Costos de Producción:</span>
                                                <span className="fw-bold small">${previewData.profitability.totalCosts.toFixed(2)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted small">Ganancia Estimada:</span>
                                                <span className={`fw-bold small text-${previewData.profitability.estimatedProfit >= 0 ? "success" : "danger"}`}>
                                                    ${previewData.profitability.estimatedProfit.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted small">Margen de Ganancia:</span>
                                                <span className="fw-bold small">{previewData.profitability.profitMargin.toFixed(1)}%</span>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            <div className="alert alert-info d-flex align-items-start gap-2 mb-4">
                                <FaCheckCircle className="mt-1 flex-shrink-0" />
                                <div className="small">
                                    <span className="fw-bold">Importante: </span>
                                    Al confirmar, se crearán las entradas financieras
                                    {isClassicMode ? ", se cerrará el ciclo de producción" : " y se actualizará el estado de los cerdos vendidos"}
                                    . Esta acción no se puede deshacer.
                                </div>
                            </div>

                            <div className="d-flex justify-content-between">
                                <Button color="light" onClick={handleBack} disabled={isSubmitting}>
                                    <i className="ri-arrow-left-line me-2" />Volver a editar
                                </Button>
                                <Button color="success" onClick={() => toggleModal("confirmation", true)} disabled={isSubmitting}>
                                    <i className="ri-check-line me-2" />Confirmar Venta
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
                                <span className="text-muted"><i className="ri-price-tag-3-line me-1" />{stageLabel[focusedGroup?.stage || ""] || focusedGroup?.stage}</span>
                                <span className="text-muted"><i className="ri-group-line me-1" />{groupModalPigs.length} cerdos</span>
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
                            <div className="text-muted small mt-2">Cargando cerdos...</div>
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
                                        <span className="fw-bold text-dark">{groupModalSelectedIds.size}</span> de {groupModalPigs.length} seleccionados
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
                                    {groupModalSelectedIds.size === groupModalPigs.length ? "Deseleccionar todos" : "Seleccionar todos"}
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
                                                        {stageLabel[pig.currentStage] || pig.currentStage}
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
                                                            <i className="ri-calendar-line me-1" />{pig.age} días
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
                            <span className="text-muted">Peso total:</span>{" "}
                            <span className="fw-bold" style={{ color: "#50a5f1" }}>
                                {groupModalPigs
                                    .filter(p => groupModalSelectedIds.has(p._id))
                                    .reduce((sum, p) => sum + p.currentWeight, 0)
                                    .toFixed(1)} kg
                            </span>
                        </div>
                    )}
                    {groupModalSelectedIds.size === 0 && (
                        <div className="text-muted small">Selecciona al menos un cerdo</div>
                    )}
                    <div className="d-flex gap-2">
                        <Button
                            color="light"
                            style={{ borderRadius: 8 }}
                            onClick={() => setGroupModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            color="primary"
                            className="px-4"
                            style={{ borderRadius: 8 }}
                            onClick={confirmGroupSelection}
                            disabled={groupModalSelectedIds.size === 0}
                        >
                            <i className="ri-check-line me-1" />
                            Confirmar ({groupModalSelectedIds.size})
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── CONFIRMATION MODAL ── */}
            <Modal isOpen={modals.confirmation} toggle={() => toggleModal("confirmation")} centered>
                <ModalHeader toggle={() => toggleModal("confirmation")}>
                    <i className="ri-alert-line text-warning me-2" />
                    Confirmar Venta de Cerdos
                </ModalHeader>
                <ModalBody>
                    <div className="text-center py-3">
                        <i className="ri-question-line text-warning" style={{ fontSize: "3.5rem" }} />
                        <h5 className="mt-3 mb-2">¿Estás seguro de confirmar esta venta?</h5>
                        <p className="text-muted small mb-0">
                            Esta acción no podrá deshacerse. Verifica que todos los datos sean correctos.
                        </p>
                        {previewData && (
                            <div className="mt-4 p-3 bg-light rounded text-start">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="fw-semibold small">Total de cerdos:</span>
                                    <span className="small">{previewData.summary.totalPigs}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="fw-semibold small">Peso total:</span>
                                    <span className="small">{previewData.summary.totalWeight.toFixed(2)} kg</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="fw-semibold small text-success">Monto total:</span>
                                    <span className="fw-bold small text-success">${previewData.summary.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => toggleModal("confirmation")} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button color="success" onClick={handleConfirmSale} disabled={isSubmitting}>
                        {isSubmitting
                            ? <><Spinner size="sm" className="me-2" />Procesando...</>
                            : <><i className="ri-check-line me-1" />Sí, Confirmar Venta</>}
                    </Button>
                </ModalFooter>
            </Modal>

            <SuccessModal
                isOpen={modals.success}
                onClose={() => { toggleModal("success"); onSave(); }}
                message="La venta se ha registrado exitosamente"
            />
            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal("error")}
                message="Ha ocurrido un error al procesar la venta. Por favor, intente nuevamente."
            />
        </>
    );
};

export default SellPigsFormV2;
