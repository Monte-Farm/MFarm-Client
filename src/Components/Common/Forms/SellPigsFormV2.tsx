import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import {
    Badge, Button, Card, CardBody, CardHeader, Col, Input, Label,
    Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink,
    Row, Spinner, TabContent, TabPane, Table
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
    general: "General", lactation: "Lactancia", weaning: "Destete",
    fattening: "Engorda", gestation: "Gestación", breeder: "Reproductor",
    exit: "Salida", sale: "Venta",
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

    const fetchClassicData = async () => {
        if (!configContext || !groupId) return;
        try {
            setLoading(true);
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/finances/pig_sales/sale_form_data/${groupId}`
            );
            const data = res.data.data;
            setSuggestedPricePerKg(data.suggestedPricePerKg);
            setGlobalPricePerKg(data.suggestedPricePerKg);
            setNextSaleCode(data.nextSaleCode);
            setFormData(prev => ({ ...prev, code: data.nextSaleCode }));
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
            const [groupsRes, codeRes] = await Promise.all([
                configContext.axiosHelper.get(
                    `${configContext.apiUrl}/group/find_by_farm/${farmId}`
                ),
                configContext.axiosHelper.get(
                    `${configContext.apiUrl}/finances/pig_sales/sale_form_data/next_code`
                ).catch(() => ({ data: { data: { nextSaleCode: "" } } })),
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
            const code = codeRes.data?.data?.nextSaleCode || "";
            setNextSaleCode(code);
            setFormData(prev => ({ ...prev, code }));
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
            {/* Step indicator */}
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    {["Selección y Precios", "Información de Venta", "Preview y Confirmación"].map((label, i) => (
                        <NavItem key={i}>
                            <NavLink
                                href="#"
                                className={classnames({ active: activeStep === i + 1, done: activeStep > i + 1 })}
                                disabled
                            >
                                {label}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>

                {/* ── STEP 1 ── */}
                <TabPane tabId={1}>
                    <div className="d-flex align-items-center mb-4">
                        <div>
                            <h5 className="fw-bold mb-1 text-dark">Selección y Precios</h5>
                            <p className="text-muted small mb-0">
                                {isClassicMode
                                    ? "Define el precio y revisa los cerdos del grupo."
                                    : "Elige cómo quieres seleccionar los cerdos a vender."}
                            </p>
                        </div>
                        {!isClassicMode && (
                            <div className="d-flex gap-2 p-1 bg-light rounded ms-auto">
                                <Button
                                    color={selectionMode === "group" ? "primary" : "light"}
                                    size="sm"
                                    className="px-4"
                                    onClick={() => setSelectionMode("group")}
                                >
                                    <i className="ri-group-line me-2" />
                                    Por Grupo
                                </Button>
                                <Button
                                    color={selectionMode === "individual" ? "primary" : "light"}
                                    size="sm"
                                    className="px-4"
                                    onClick={() => setSelectionMode("individual")}
                                >
                                    <i className="ri-user-line me-2" />
                                    Individual
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Error banner */}
                    {Object.keys(errors).length > 0 && (
                        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                            <FaExclamationTriangle />
                            <div>{Object.values(errors).map((e, i) => <div key={i}>{e}</div>)}</div>
                        </div>
                    )}

                    {/* ── CLASSIC MODE ── */}
                    {isClassicMode && (
                        <>
                            <Card className="mb-3">
                                <CardBody>
                                    <Row>
                                        <Col md={6}>
                                            <Label className="form-label fw-semibold">Precio por kilogramo ($)</Label>
                                            <Input
                                                type="number" step="0.01"
                                                value={globalPricePerKg}
                                                onChange={e => handleGlobalPriceChange(e.target.value)}
                                                placeholder="0.00"
                                            />
                                            <div className="text-muted small mt-1">
                                                Precio sugerido:{" "}
                                                <span className="fw-bold text-success">${suggestedPricePerKg.toFixed(2)}/kg</span>
                                            </div>
                                        </Col>
                                        <Col md={6} className="d-flex align-items-center">
                                            <div className="w-100">
                                                <div className="d-flex justify-content-between text-muted small mb-1">
                                                    <span>Total cerdos</span>
                                                    <span className="fw-bold text-primary">{totals.totalPigs}</span>
                                                </div>
                                                <div className="d-flex justify-content-between text-muted small">
                                                    <span>Peso total</span>
                                                    <span className="fw-bold text-info">{totals.totalWeight.toFixed(2)} kg</span>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>

                            <SelectableCustomTable
                                columns={classicPigColumns}
                                data={selectedPigs}
                                selectionMode="multiple"
                                onSelect={rows => setSelectedPigs(prev =>
                                    prev.map(p => ({ ...p, selected: rows.some((r: any) => r.pigId === p.pigId) }))
                                )}
                                showSearchAndFilter={false}
                            />
                        </>
                    )}

                    {/* ── FREE MODE ── */}
                    {!isClassicMode && (
                        <>

                            {/* Global price — visible in both free modes */}
                            <Card className="mb-3 border-0 bg-light">
                                <CardBody className="py-2">
                                    <Row className="align-items-center">
                                        <Col md={4}>
                                            <Label className="form-label fw-semibold mb-1">Precio por kg ($)</Label>
                                            <Input
                                                type="number" step="0.01"
                                                value={globalPricePerKg}
                                                onChange={e => handleGlobalPriceChange(e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </Col>
                                        <Col md={8} className="d-flex align-items-center justify-content-end gap-4">
                                            <div className="text-center">
                                                <div className="text-muted small">Cerdos</div>
                                                <div className="fs-5 fw-bold text-primary">{totals.totalPigs}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-muted small">Peso total</div>
                                                <div className="fs-5 fw-bold text-info">{totals.totalWeight.toFixed(1)} kg</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-muted small">Subtotal</div>
                                                <div className="fs-5 fw-bold text-success">${totals.subtotal.toFixed(2)}</div>
                                            </div>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>

                            {/* ── SUB-MODE: GROUP ── */}
                            {selectionMode === "group" && (
                                <>
                                    <div className="mb-3">
                                        <p className="text-muted small mb-0">
                                            Selecciona uno o varios grupos. Puedes revisar y ajustar los cerdos de cada grupo antes de añadirlos.
                                        </p>
                                    </div>

                                    {availableGroups.length === 0 ? (
                                        <div className="text-center text-muted py-5">
                                            <i className="ri-inbox-line fs-1 d-block mb-2 opacity-25" />
                                            No hay grupos activos disponibles
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column gap-2">
                                            {availableGroups.map(group => {
                                                const addedCount = selectedPigs.filter(p => p.groupId === group._id).length;
                                                const isAdded = addedCount > 0;
                                                return (
                                                    <Card
                                                        key={group._id}
                                                        className={classnames("mb-0 border", {
                                                            "border-primary": isAdded,
                                                            "border-light": !isAdded,
                                                        })}
                                                    >
                                                        <CardBody className="py-2">
                                                            <div className="d-flex align-items-center justify-content-between gap-3">
                                                                <div className="d-flex align-items-center gap-3 flex-grow-1">
                                                                    {/* Status indicator */}
                                                                    <div
                                                                        className={classnames("rounded-circle flex-shrink-0", {
                                                                            "bg-primary": isAdded,
                                                                            "bg-light border": !isAdded,
                                                                        })}
                                                                        style={{ width: 12, height: 12 }}
                                                                    />
                                                                    <div>
                                                                        <div className="fw-semibold">{group.name}</div>
                                                                        <div className="d-flex gap-3 text-muted small">
                                                                            <span>
                                                                                <i className="ri-hashtag me-1" />{group.code}
                                                                            </span>
                                                                            <span>
                                                                                <i className="ri-price-tag-3-line me-1" />{stageLabel[group.stage] || group.stage}
                                                                            </span>
                                                                            <span>
                                                                                <i className="ri-group-line me-1" />{group.pigCount} cerdos
                                                                            </span>
                                                                            <span>
                                                                                <i className="ri-scales-3-line me-1" />{group.avgWeight.toFixed(1)} kg prom.
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                                                    {isAdded && (
                                                                        <Badge color="primary" className="me-1">
                                                                            {addedCount} seleccionado{addedCount !== 1 ? "s" : ""}
                                                                        </Badge>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        color={isAdded ? "secondary" : "primary"}
                                                                        onClick={() => openGroupModal(group)}
                                                                    >
                                                                        <i className={classnames("me-1", {
                                                                            "ri-edit-line": isAdded,
                                                                            "ri-add-line": !isAdded,
                                                                        })} />
                                                                        {isAdded ? "Editar" : "Agregar"}
                                                                    </Button>
                                                                    {isAdded && (
                                                                        <Button
                                                                            size="sm" color="danger"
                                                                            onClick={() => removeGroup(group._id)}
                                                                        >
                                                                            <i className="ri-close-line" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ── SUB-MODE: INDIVIDUAL ── */}
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

                    <div className="mt-4 d-flex justify-content-end">
                        <Button color="primary" onClick={handleNext}>
                            Siguiente <i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                {/* ── STEP 2 ── */}
                <TabPane tabId={2}>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-1 text-dark">Información de Venta</h5>
                        <p className="text-muted small">Completa los datos del comprador y detalles de pago.</p>
                    </div>

                    {Object.keys(errors).length > 0 && (
                        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                            <FaExclamationTriangle />
                            <div>{Object.values(errors).map((e, i) => <div key={i}>{e}</div>)}</div>
                        </div>
                    )}

                    <Card className="mb-3">
                        <CardHeader className="bg-light">
                            <h6 className="mb-0 fw-bold">Datos del Comprador</h6>
                        </CardHeader>
                        <CardBody>
                            <Row>
                                <Col md={6} className="mb-3">
                                    <Label className="form-label">Nombre <span className="text-danger">*</span></Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.name}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, name: e.target.value } }))}
                                        placeholder="Nombre del comprador"
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Label className="form-label">Tipo</Label>
                                    <Input
                                        type="select"
                                        value={formData.buyer.type}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, type: e.target.value } }))}
                                    >
                                        <option value="individual">Individual</option>
                                        <option value="company">Empresa</option>
                                        <option value="slaughterhouse">Matadero</option>
                                        <option value="other">Otro</option>
                                    </Input>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Label className="form-label">Contacto</Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.contact}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, contact: e.target.value } }))}
                                        placeholder="Teléfono o email"
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Label className="form-label">RFC / Identificación Fiscal</Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.fiscalId}
                                        onChange={e => setFormData(p => ({ ...p, buyer: { ...p.buyer, fiscalId: e.target.value } }))}
                                        placeholder="RFC"
                                    />
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Card className="mb-3">
                        <CardHeader className="bg-light">
                            <h6 className="mb-0 fw-bold">Información de Pago</h6>
                        </CardHeader>
                        <CardBody>
                            <Row>
                                <Col md={6} className="mb-3">
                                    <Label className="form-label">Método de Pago <span className="text-danger">*</span></Label>
                                    <Input
                                        type="select"
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData(p => ({ ...p, paymentMethod: e.target.value }))}
                                    >
                                        <option value="cash">Efectivo</option>
                                        <option value="transfer">Transferencia</option>
                                        <option value="check">Cheque</option>
                                        <option value="credit">Crédito</option>
                                        <option value="other">Otro</option>
                                    </Input>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Label className="form-label">Estado de Pago</Label>
                                    <Input
                                        type="select"
                                        value={formData.paymentStatus}
                                        onChange={e => setFormData(p => ({ ...p, paymentStatus: e.target.value }))}
                                    >
                                        <option value="pending">Pendiente</option>
                                        <option value="partial">Parcial</option>
                                        <option value="completed">Completado</option>
                                    </Input>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Card className="mb-3">
                        <CardHeader className="bg-light d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold">Costos Adicionales</h6>
                            <Button size="sm" color="primary" onClick={addCost}>
                                <i className="ri-add-line me-1" />Agregar
                            </Button>
                        </CardHeader>
                        <CardBody>
                            {additionalCosts.length === 0 ? (
                                <div className="text-center text-muted py-3 small">
                                    <i className="ri-information-line fs-5 d-block mb-1" />
                                    No hay costos adicionales
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {additionalCosts.map((cost, idx) => (
                                        <div key={idx} className="d-flex gap-2 align-items-center">
                                            <Input
                                                type="text" placeholder="Concepto"
                                                value={cost.concept}
                                                onChange={e => updateCost(idx, "concept", e.target.value)}
                                                className="flex-grow-1"
                                            />
                                            <div className="input-group" style={{ width: 150 }}>
                                                <span className="input-group-text">$</span>
                                                <Input
                                                    type="number" step="0.01" placeholder="0.00"
                                                    value={cost.amount}
                                                    onChange={e => updateCost(idx, "amount", Number(e.target.value))}
                                                />
                                            </div>
                                            <Button size="sm" color="danger" onClick={() => removeCost(idx)}>
                                                <i className="ri-delete-bin-line" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <Card className="mb-3">
                        <CardHeader className="bg-light">
                            <h6 className="mb-0 fw-bold">Notas</h6>
                        </CardHeader>
                        <CardBody>
                            <Input
                                type="textarea" rows={3}
                                value={formData.notes}
                                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Observaciones adicionales sobre la venta..."
                            />
                        </CardBody>
                    </Card>

                    <div className="mt-4 d-flex justify-content-between">
                        <Button color="light" onClick={handleBack}>
                            <i className="ri-arrow-left-line me-2" />Atrás
                        </Button>
                        <Button color="warning" onClick={handleViewPreview} disabled={loadingPreview}>
                            {loadingPreview
                                ? <><Spinner size="sm" className="me-2" />Calculando...</>
                                : <><i className="ri-eye-line me-2" />Ver Preview</>}
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
                <ModalHeader toggle={() => setGroupModalOpen(false)}>
                    Cerdos del grupo: <span className="text-primary ms-1">{focusedGroup?.name}</span>
                </ModalHeader>
                <ModalBody>
                    {loadingGroupPigs ? (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <p className="text-muted small mb-0">
                                    Selecciona los cerdos que deseas incluir en la venta.
                                </p>
                                <Button
                                    size="sm" color="light"
                                    onClick={() => {
                                        const allSelected = groupModalSelectedIds.size === groupModalPigs.length;
                                        setGroupModalSelectedIds(
                                            allSelected ? new Set() : new Set(groupModalPigs.map(p => p._id))
                                        );
                                    }}
                                >
                                    {groupModalSelectedIds.size === groupModalPigs.length ? "Deseleccionar todos" : "Seleccionar todos"}
                                </Button>
                            </div>
                            <Table hover responsive size="sm">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: 40 }}></th>
                                        <th>Código</th>
                                        <th>Peso actual</th>
                                        <th>Etapa</th>
                                        <th>Sexo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupModalPigs.map(pig => {
                                        const isChecked = groupModalSelectedIds.has(pig._id);
                                        return (
                                            <tr
                                                key={pig._id}
                                                onClick={() => setGroupModalSelectedIds(prev => {
                                                    const next = new Set(prev);
                                                    isChecked ? next.delete(pig._id) : next.add(pig._id);
                                                    return next;
                                                })}
                                                className={classnames("cursor-pointer", { "table-primary": isChecked })}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <td>
                                                    <Input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => { }}
                                                        className="form-check-input"
                                                    />
                                                </td>
                                                <td className="fw-semibold">{pig.code}</td>
                                                <td>{pig.currentWeight.toFixed(1)} kg</td>
                                                <td><Badge color="secondary">{stageLabel[pig.currentStage] || pig.currentStage}</Badge></td>
                                                <td>{pig.sex === "male" ? "Macho" : pig.sex === "female" ? "Hembra" : "—"}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <div className="me-auto text-muted small">
                        {groupModalSelectedIds.size} de {groupModalPigs.length} seleccionado{groupModalSelectedIds.size !== 1 ? "s" : ""}
                    </div>
                    <Button color="light" onClick={() => setGroupModalOpen(false)}>Cancelar</Button>
                    <Button
                        color="primary"
                        onClick={confirmGroupSelection}
                        disabled={groupModalSelectedIds.size === 0}
                    >
                        <i className="ri-check-line me-1" />
                        Confirmar selección
                    </Button>
                </ModalFooter>
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
