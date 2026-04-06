import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Col, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Row, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import classnames from "classnames";
import SimpleBar from "simplebar-react";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { FaCheckCircle, FaExclamationTriangle, FaQuestionCircle } from "react-icons/fa";
import Pagination from "../Tables/Pagination";
import SelectableCustomTable from "../Tables/SelectableTable";
import { Column } from "common/data/data_types";

interface SellPigsFormProps {
    groupId: string;
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
    selected: boolean;
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

interface FormData {
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
    breakdown: any[];
}

const SellPigsForm: React.FC<SellPigsFormProps> = ({ groupId, onSave }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    
    const [activeStep, setActiveStep] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
    
    const [formData, setFormData] = useState<FormData>({
        code: '',
        saleDate: new Date().toISOString().split('T')[0],
        saleType: 'group',
        buyer: {
            name: '',
            type: 'individual',
            contact: '',
            address: '',
            fiscalId: ''
        },
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        notes: ''
    });
    
    const [selectedPigs, setSelectedPigs] = useState<SelectedPig[]>([]);
    const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [groupData, setGroupData] = useState<any>(null);
    const [productionCycleData, setProductionCycleData] = useState<any>(null);
    const [suggestedPricePerKg, setSuggestedPricePerKg] = useState<number>(0);
    
    const [modals, setModals] = useState({ success: false, error: false, confirmation: false });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const [useIndividualSale, setUseIndividualSale] = useState<boolean>(false);
    const [groupPricePerKg, setGroupPricePerKg] = useState<number>(0);
    
    const [currentPage, setCurrentPage] = useState(1);
    const pigsPerPage = 10;

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchSaleFormData = async () => {
        if (!configContext || !groupId) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/finances/pig_sales/sale_form_data/${groupId}`
            );
            
            const data = response.data.data;
            
            setGroupData(data.group);
            setProductionCycleData(data.productionCycle);
            setSuggestedPricePerKg(data.suggestedPricePerKg);
            
            setFormData(prev => ({
                ...prev,
                code: data.nextSaleCode
            }));
            
            const pigsWithSelection = data.pigs.map((pig: any) => ({
                id: pig.id,
                pigId: pig.id,
                code: pig.code,
                originalWeight: pig.currentWeight,
                weight: pig.currentWeight,
                pricePerKg: data.suggestedPricePerKg,
                total: pig.currentWeight * data.suggestedPricePerKg,
                age: pig.age,
                status: pig.status,
                selected: true
            }));
            
            setSelectedPigs(pigsWithSelection);
            setGroupPricePerKg(data.suggestedPricePerKg);
        } catch (error) {
            console.error('Error fetching sale form data:', error);
            toggleModal('error');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        const activePigs = selectedPigs.filter(p => p.selected);
        const subtotal = activePigs.reduce((sum, pig) => sum + pig.total, 0);
        const totalWeight = activePigs.reduce((sum, pig) => sum + pig.weight, 0);
        const totalAdditionalCosts = additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
        const totalNet = subtotal - totalAdditionalCosts;
        const averagePricePerKg = totalWeight > 0 ? subtotal / totalWeight : 0;
        
        return {
            totalPigs: activePigs.length,
            totalWeight,
            subtotal,
            totalAdditionalCosts,
            totalNet,
            averagePricePerKg
        };
    };

    const handlePigWeightChange = (index: number, value: string) => {
        const newPigs = [...selectedPigs];
        const weight = value === '' ? 0 : Number(value);
        newPigs[index].weight = weight;
        newPigs[index].total = weight * newPigs[index].pricePerKg;
        setSelectedPigs(newPigs);
    };

    const handlePigPriceChange = (index: number, value: string) => {
        const newPigs = [...selectedPigs];
        const price = value === '' ? 0 : Number(value);
        newPigs[index].pricePerKg = price;
        newPigs[index].total = newPigs[index].weight * price;
        setSelectedPigs(newPigs);
    };

    const handleGroupPriceChange = (value: string) => {
        const price = value === '' ? 0 : Number(value);
        setGroupPricePerKg(price);
        
        const newPigs = selectedPigs.map(pig => ({
            ...pig,
            pricePerKg: price,
            total: pig.weight * price
        }));
        setSelectedPigs(newPigs);
    };

    const handlePigSelection = (index: number) => {
        const newPigs = [...selectedPigs];
        newPigs[index].selected = !newPigs[index].selected;
        setSelectedPigs(newPigs);
    };

    const handleSelectAll = () => {
        const allSelected = selectedPigs.every(p => p.selected);
        const newPigs = selectedPigs.map(p => ({ ...p, selected: !allSelected }));
        setSelectedPigs(newPigs);
    };

    const addAdditionalCost = () => {
        setAdditionalCosts([...additionalCosts, { concept: '', amount: 0 }]);
    };

    const removeAdditionalCost = (index: number) => {
        const newCosts = additionalCosts.filter((_, i) => i !== index);
        setAdditionalCosts(newCosts);
    };

    const updateAdditionalCost = (index: number, field: 'concept' | 'amount', value: string | number) => {
        const newCosts = [...additionalCosts];
        if (field === 'concept') {
            newCosts[index].concept = value as string;
        } else {
            newCosts[index].amount = value as number;
        }
        setAdditionalCosts(newCosts);
    };

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        
        const activePigs = selectedPigs.filter(p => p.selected);
        
        if (activePigs.length === 0) {
            newErrors.step1 = 'Debes seleccionar al menos un cerdo para vender';
        }
        
        if (activePigs.some(p => p.weight <= 0)) {
            newErrors.weight = 'Todos los pesos deben ser mayores a 0';
        }
        
        if (activePigs.some(p => p.pricePerKg <= 0)) {
            newErrors.price = 'Todos los precios deben ser mayores a 0';
        }

        if (useIndividualSale && activePigs.length === 0) {
            newErrors.selection = 'Debes seleccionar al menos un cerdo en modo de venta individual';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.buyer.name.trim()) {
            newErrors.buyerName = 'El nombre del comprador es requerido';
        }
        
        if (!formData.paymentMethod) {
            newErrors.paymentMethod = 'El método de pago es requerido';
        }
        
        const invalidCosts = additionalCosts.filter(c => !c.concept.trim() || c.amount <= 0);
        if (invalidCosts.length > 0) {
            newErrors.additionalCosts = 'Todos los costos adicionales deben tener concepto y monto válido';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (activeStep === 1 && validateStep1()) {
            setActiveStep(2);
        }
    };

    const handlePreviousStep = () => {
        if (activeStep > 1) {
            setActiveStep(activeStep - 1);
        }
    };

    const handleViewPreview = async () => {
        if (!validateStep2()) return;
        
        if (!configContext) return;
        
        try {
            setLoadingPreview(true);
            const activePigs = selectedPigs.filter(p => p.selected);
            
            const requestData = {
                groupId,
                pigs: activePigs.map(p => ({
                    pigId: p.pigId,
                    weight: p.weight,
                    pricePerKg: p.pricePerKg
                })),
                additionalCosts: additionalCosts.filter(c => c.concept.trim() && c.amount > 0)
            };
            
            const response = await configContext.axiosHelper.create(
                `${configContext.apiUrl}/finances/pig_sales/calculate_preview`,
                requestData
            );
            
            setPreviewData(response.data.data);
            setActiveStep(3);
        } catch (error) {
            console.error('Error calculating preview:', error);
            toggleModal('error');
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleConfirmSaleClick = () => {
        toggleModal('confirmation', true);
    };

    const handleConfirmSale = async () => {
        toggleModal('confirmation', false);
        if (!configContext || !previewData) return;
        
        try {
            setIsSubmitting(true);
            const activePigs = selectedPigs.filter(p => p.selected);
            
            const saleData = {
                code: formData.code,
                farm: userLogged.farm_assigned,
                saleDate: new Date(formData.saleDate),
                saleType: formData.saleType,
                group: {
                    groupId: groupId,
                    pigCount: activePigs.length,
                    totalWeight: previewData.summary.totalWeight,
                    pricePerKg: previewData.summary.averagePricePerKg,
                    totalPrice: previewData.summary.subtotal
                },
                pigs: activePigs.map(p => ({
                    pig: p.pigId,
                    weight: p.weight,
                    pricePerKg: p.pricePerKg,
                    totalPrice: p.total,
                    age: p.age
                })),
                buyer: {
                    name: formData.buyer.name,
                    type: formData.buyer.type,
                    contact: formData.buyer.contact || undefined,
                    address: formData.buyer.address || undefined,
                    fiscalId: formData.buyer.fiscalId || undefined
                },
                totalAmount: previewData.summary.totalAmount,
                paymentMethod: formData.paymentMethod,
                paymentStatus: formData.paymentStatus,
                additionalCosts: additionalCosts.filter(c => c.concept.trim() && c.amount > 0),
                notes: formData.notes || undefined,
                registeredBy: userLogged._id
            };
            
            await configContext.axiosHelper.create(
                `${configContext.apiUrl}/finances/pig_sales/create_sale`,
                saleData
            );
            
            toggleModal('success');
        } catch (error) {
            console.error('Error creating sale:', error);
            toggleModal('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getROIColor = (roi: number): string => {
        if (roi > 50) return 'success';
        if (roi >= 20) return 'info';
        if (roi >= 0) return 'warning';
        return 'danger';
    };

    const getROIBadgeClass = (roi: number): string => {
        if (roi > 50) return 'bg-success';
        if (roi >= 20) return 'bg-info';
        if (roi >= 0) return 'bg-warning';
        return 'bg-danger';
    };

    useEffect(() => {
        fetchSaleFormData();
    }, [groupId]);

    useEffect(() => {
        if (useIndividualSale) {
            const newPigs = selectedPigs.map(pig => ({ ...pig, selected: false }));
            setSelectedPigs(newPigs);
        } else {
            const newPigs = selectedPigs.map(pig => ({ ...pig, selected: true }));
            setSelectedPigs(newPigs);
        }
    }, [useIndividualSale]);

    if (loading) {
        return <LoadingAnimation absolutePosition={false} />;
    }

    const totals = calculateTotals();
    const indexOfLastPig = currentPage * pigsPerPage;
    const indexOfFirstPig = indexOfLastPig - pigsPerPage;
    const currentPigs = selectedPigs.slice(indexOfFirstPig, indexOfLastPig);
    const totalPages = Math.ceil(selectedPigs.length / pigsPerPage);

    return (
        <>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            href='#'
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            disabled
                        >
                            Selección y Precios
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            href='#'
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            disabled
                        >
                            Información de Venta
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            href='#'
                            className={classnames({
                                active: activeStep === 3,
                            })}
                            disabled
                        >
                            Preview y Confirmación
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-1 text-dark">Configuración de Venta</h5>
                        <p className="text-muted small">Define el precio y selecciona los cerdos a vender.</p>
                    </div>

                    {Object.keys(errors).length > 0 && (
                        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                            <FaExclamationTriangle />
                            <div>
                                {Object.values(errors).map((error, idx) => (
                                    <div key={idx}>{error}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="card border-2 border-secondary-subtle mb-3" role="button" onClick={() => setUseIndividualSale(!useIndividualSale)}>
                        <div className="card-body d-flex align-items-center gap-3">
                            <Input
                                className="form-check-input mt-0"
                                type="checkbox"
                                checked={useIndividualSale}
                                readOnly
                            />
                            <FaQuestionCircle className="text-secondary" size={20} />
                            <div>
                                <div className="fw-semibold">
                                    Venta individual de cerdos
                                </div>
                                <div className="small text-muted">
                                    {useIndividualSale
                                        ? "Selecciona individualmente los cerdos y ajusta precios por cerdo"
                                        : "Vender todo el grupo con un precio único por kilogramo"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {!useIndividualSale && (
                        <Card className="mb-3">
                            <CardBody>
                                <Row>
                                    <Col md={6}>
                                        <Label className="form-label fw-semibold">Precio por kilogramo ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={groupPricePerKg}
                                            onChange={(e) => handleGroupPriceChange(e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <div className="text-muted small mt-1">
                                            Precio sugerido: <span className="fw-bold text-success">${suggestedPricePerKg.toFixed(2)}/kg</span>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="mt-4">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="ri-group-line text-primary"></i>
                                                <span className="text-muted">Total de cerdos:</span>
                                                <span className="fw-bold text-primary">{selectedPigs.length}</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 mt-1">
                                                <i className="ri-scales-3-line text-info"></i>
                                                <span className="text-muted">Peso total:</span>
                                                <span className="fw-bold text-info">{totals.totalWeight.toFixed(2)} kg</span>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    )}

                    {useIndividualSale && (
                        <SelectableCustomTable
                            columns={[
                                {
                                    header: 'Código',
                                    accessor: 'code',
                                    type: 'text',
                                    render: (_, row) => <span className="fw-semibold">{row.code}</span>
                                },
                                {
                                    header: 'Peso Actual',
                                    accessor: 'originalWeight',
                                    type: 'text',
                                    render: (value) => <span className="text-muted">{value.toFixed(2)} kg</span>
                                },
                                {
                                    header: 'Peso Venta (kg)',
                                    accessor: 'weight',
                                    type: 'text',
                                    render: (value, row) => {
                                        const index = selectedPigs.findIndex(p => p.pigId === row.pigId);
                                        return (
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={value}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handlePigWeightChange(index, e.target.value);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                disabled={!row.selected}
                                                className="form-control-sm"
                                                style={{ width: '100px' }}
                                            />
                                        );
                                    }
                                },
                                {
                                    header: 'Precio/kg ($)',
                                    accessor: 'pricePerKg',
                                    type: 'text',
                                    render: (value, row) => {
                                        const index = selectedPigs.findIndex(p => p.pigId === row.pigId);
                                        return (
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={value}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handlePigPriceChange(index, e.target.value);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                disabled={!row.selected}
                                                className="form-control-sm"
                                                style={{ width: '100px' }}
                                            />
                                        );
                                    }
                                },
                                {
                                    header: 'Total',
                                    accessor: 'total',
                                    type: 'text',
                                    render: (value) => <span className="fw-bold">${value.toFixed(2)}</span>
                                }
                            ]}
                            data={selectedPigs}
                            selectionMode="multiple"
                            onSelect={(selected) => {
                                const newPigs = selectedPigs.map(pig => ({
                                    ...pig,
                                    selected: selected.some((s: any) => s.pigId === pig.pigId)
                                }));
                                setSelectedPigs(newPigs);
                            }}
                            showSearchAndFilter={false}
                        />
                    )}

                    <Card className="bg-light">
                        <CardBody>
                            <Row>
                                <Col md={3}>
                                    <div className="text-center">
                                        <div className="text-muted small">Total Cerdos</div>
                                        <div className="fs-4 fw-bold text-primary">{totals.totalPigs}</div>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="text-center">
                                        <div className="text-muted small">Peso Total</div>
                                        <div className="fs-4 fw-bold text-info">{totals.totalWeight.toFixed(2)} kg</div>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="text-center">
                                        <div className="text-muted small">Precio Promedio</div>
                                        <div className="fs-4 fw-bold text-warning">${totals.averagePricePerKg.toFixed(2)}/kg</div>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="text-center">
                                        <div className="text-muted small">Subtotal</div>
                                        <div className="fs-4 fw-bold text-success">${totals.subtotal.toFixed(2)}</div>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <div className="mt-4 d-flex justify-content-end">
                        <Button color="primary" onClick={handleNextStep}>
                            Siguiente
                            <i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={2}>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-1 text-dark">Información de Venta</h5>
                        <p className="text-muted small">Completa los datos del comprador y detalles de pago.</p>
                    </div>

                    {Object.keys(errors).length > 0 && (
                        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                            <FaExclamationTriangle />
                            <div>
                                {Object.values(errors).map((error, idx) => (
                                    <div key={idx}>{error}</div>
                                ))}
                            </div>
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
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            buyer: { ...formData.buyer, name: e.target.value }
                                        })}
                                        placeholder="Nombre del comprador"
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Label className="form-label">Tipo</Label>
                                    <Input
                                        type="select"
                                        value={formData.buyer.type}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            buyer: { ...formData.buyer, type: e.target.value }
                                        })}
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
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            buyer: { ...formData.buyer, contact: e.target.value }
                                        })}
                                        placeholder="Teléfono o email"
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Label className="form-label">RFC / Identificación Fiscal</Label>
                                    <Input
                                        type="text"
                                        value={formData.buyer.fiscalId}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            buyer: { ...formData.buyer, fiscalId: e.target.value }
                                        })}
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
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
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
                            <Button size="sm" color="primary" onClick={addAdditionalCost}>
                                <i className="ri-add-line me-1" />
                                Agregar
                            </Button>
                        </CardHeader>
                        <CardBody>
                            {additionalCosts.length === 0 ? (
                                <div className="text-center text-muted py-3">
                                    <i className="ri-information-line fs-4 d-block mb-2" />
                                    No hay costos adicionales
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {additionalCosts.map((cost, idx) => (
                                        <div key={idx} className="d-flex gap-2 align-items-center">
                                            <Input
                                                type="text"
                                                placeholder="Concepto"
                                                value={cost.concept}
                                                onChange={(e) => updateAdditionalCost(idx, 'concept', e.target.value)}
                                                className="flex-grow-1"
                                            />
                                            <div className="input-group" style={{ width: '150px' }}>
                                                <span className="input-group-text">$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={cost.amount}
                                                    onChange={(e) => updateAdditionalCost(idx, 'amount', Number(e.target.value))}
                                                />
                                            </div>
                                            <Button
                                                size="sm"
                                                color="danger"
                                                onClick={() => removeAdditionalCost(idx)}
                                            >
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
                                type="text"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Observaciones adicionales sobre la venta..."
                            />
                        </CardBody>
                    </Card>

                    <div className="mt-4 d-flex justify-content-between">
                        <Button color="danger" onClick={handlePreviousStep}>
                            <i className="ri-arrow-left-line me-2" />
                            Atrás
                        </Button>
                        <Button color="warning" onClick={handleViewPreview} disabled={loadingPreview}>
                            {loadingPreview ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Calculando...
                                </>
                            ) : (
                                <>
                                    <i className="ri-eye-line me-2" />
                                    Ver Preview
                                </>
                            )}
                        </Button>
                    </div>
                </TabPane>

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
                                            <Row className="g-3">
                                                <Col xs={6}>
                                                    <div className="text-center p-3 bg-light rounded">
                                                        <div className="text-muted small mb-1">Total Cerdos</div>
                                                        <div className="fs-4 fw-bold text-primary">{previewData.summary?.totalPigs || 0}</div>
                                                    </div>
                                                </Col>
                                                <Col xs={6}>
                                                    <div className="text-center p-3 bg-light rounded">
                                                        <div className="text-muted small mb-1">Peso Total</div>
                                                        <div className="fs-4 fw-bold text-info">{(previewData.summary?.totalWeight || 0).toFixed(2)} kg</div>
                                                    </div>
                                                </Col>
                                                <Col xs={6}>
                                                    <div className="text-center p-3 bg-light rounded">
                                                        <div className="text-muted small mb-1">Peso Promedio</div>
                                                        <div className="fs-4 fw-bold text-secondary">{(previewData.summary?.averageWeight || 0).toFixed(2)} kg</div>
                                                    </div>
                                                </Col>
                                                <Col xs={6}>
                                                    <div className="text-center p-3 bg-light rounded">
                                                        <div className="text-muted small mb-1">Precio Promedio</div>
                                                        <div className="fs-4 fw-bold text-warning">${(previewData.summary?.averagePricePerKg || 0).toFixed(2)}/kg</div>
                                                    </div>
                                                </Col>
                                            </Row>
                                            <hr />
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted fs-6">Subtotal:</span>
                                                <span className="fw-bold fs-6">${(previewData.summary?.subtotal || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted fs-6">Costos Adicionales:</span>
                                                <span className="fw-bold text-danger fs-6">-${(previewData.summary?.additionalCosts || 0).toFixed(2)}</span>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between">
                                                <span className="fw-bold fs-4">Total Neto:</span>
                                                <span className="fw-bold fs-4 text-success">${(previewData.summary?.totalAmount || 0).toFixed(2)}</span>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col lg={6} className="mb-3">
                                    <Card className={`h-100 border-2 border-${getROIColor(previewData.profitability?.roi || 0)}`}>
                                        <CardHeader className={`bg-${getROIColor(previewData.profitability?.roi || 0)} text-white`}>
                                            <h6 className="mb-0 fw-bold">Análisis de Rentabilidad</h6>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="text-center mb-4">
                                                <div className="text-muted mb-2">Retorno de Inversión (ROI)</div>
                                                <div className={`display-4 fw-bold text-${getROIColor(previewData.profitability?.roi || 0)}`}>
                                                    {(previewData.profitability?.roi || 0).toFixed(1)}%
                                                </div>
                                                <Badge className={`${getROIBadgeClass(previewData.profitability?.roi || 0)} mt-2`}>
                                                    {(previewData.profitability?.roi || 0) > 50 ? 'Excelente' :
                                                     (previewData.profitability?.roi || 0) >= 20 ? 'Bueno' :
                                                     (previewData.profitability?.roi || 0) >= 0 ? 'Regular' : 'Pérdida'}
                                                </Badge>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted fs-6">Costos de Producción:</span>
                                                <span className="fw-bold fs-6">${(previewData.profitability?.totalCosts || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted fs-6">Ganancia Estimada:</span>
                                                <span className={`fw-bold fs-6 text-${(previewData.profitability?.estimatedProfit || 0) >= 0 ? 'success' : 'danger'}`}>
                                                    ${(previewData.profitability?.estimatedProfit || 0).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted fs-6">Margen de Ganancia:</span>
                                                <span className="fw-bold fs-6">{(previewData.profitability?.profitMargin || 0).toFixed(1)}%</span>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            <div className="alert alert-info d-flex align-items-start gap-2">
                                <FaCheckCircle className="mt-1" />
                                <div>
                                    <div className="fw-bold mb-1">Importante</div>
                                    <div className="small">
                                        Al confirmar la venta, se crearán automáticamente las entradas financieras,
                                        se cerrará el ciclo de producción y se calcularán las métricas finales de rentabilidad.
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 d-flex justify-content-between">
                                <Button color="danger" onClick={handlePreviousStep} disabled={isSubmitting}>
                                    <i className="ri-arrow-left-line me-2" />
                                    Volver a editar
                                </Button>
                                <Button color="success" onClick={handleConfirmSaleClick} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Spinner size="sm" className="me-2" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-check-line me-2" />
                                            Confirmar Venta
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </TabPane>
            </TabContent>

            <SuccessModal
                isOpen={modals.success}
                onClose={() => {
                    toggleModal('success');
                    onSave();
                }}
                message="La venta se ha registrado exitosamente"
            />

            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error')}
                message="Ha ocurrido un error al procesar la venta. Por favor, intente nuevamente."
            />

            <Modal isOpen={modals.confirmation} toggle={() => toggleModal('confirmation')} centered>
                <ModalHeader toggle={() => toggleModal('confirmation')}>
                    <i className="ri-alert-line text-warning me-2" />
                    Confirmar Venta de Cerdos
                </ModalHeader>
                <ModalBody>
                    <div className="text-center py-3">
                        <i className="ri-question-line text-warning" style={{ fontSize: '4rem' }} />
                        <h5 className="mt-3 mb-2">¿Estás seguro de confirmar esta venta?</h5>
                        <p className="text-muted mb-0">
                            Esta acción creará las entradas financieras, cerrará el ciclo de producción 
                            y no podrá deshacerse. Por favor, verifica que todos los datos sean correctos.
                        </p>
                        {previewData && (
                            <div className="mt-4 p-3 bg-light rounded">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="fw-semibold">Total de cerdos:</span>
                                    <span>{previewData.summary?.totalPigs || 0}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="fw-semibold">Peso total:</span>
                                    <span>{(previewData.summary?.totalWeight || 0).toFixed(2)} kg</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="fw-semibold text-success">Monto total:</span>
                                    <span className="fw-bold text-success">${(previewData.summary?.totalAmount || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('confirmation')} disabled={isSubmitting}>
                        <i className="ri-close-line me-1" />
                        Cancelar
                    </Button>
                    <Button color="success" onClick={handleConfirmSale} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <i className="ri-check-line me-1" />
                                Sí, Confirmar Venta
                            </>
                        )}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default SellPigsForm;
