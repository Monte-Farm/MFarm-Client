import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Col, Input, Label, Nav, NavItem, NavLink, Row, Spinner, TabContent, TabPane } from "reactstrap";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import SimpleBar from "simplebar-react";
import classnames from "classnames";
import Flatpickr from "react-flatpickr";
import SelectableCustomTable from "../Tables/SelectableTable";
import { Column } from "common/data/data_types";
import { useTranslation } from "react-i18next";

interface DiscardPigletsFormProps {
    litterId: string;
    piglets: any[];
    mother?: { code?: string; breed?: string; birthdate?: string };
    onSave: () => void;
}

const DiscardPigletsForm: React.FC<DiscardPigletsFormProps> = ({ litterId, piglets, mother, onSave }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);

    const REASON_OPTIONS = [
        { value: "", label: t("pigs.discardPiglets.reason.select") },
        { value: "DEATH", label: t("pigs.discardPiglets.reason.death") },
        { value: "SACRIFICE", label: t("pigs.discardPiglets.reason.sacrifice") },
        { value: "TRANSFER", label: t("pigs.discardPiglets.reason.transfer") },
        { value: "DEFECT", label: t("pigs.discardPiglets.reason.defect") },
        { value: "OTHER", label: t("pigs.discardPiglets.reason.other") },
    ];

    const getReasonLabel = (value: string) => REASON_OPTIONS.find((o) => o.value === value)?.label ?? value;
    const userLogged = getEffectiveUser();

    const [activeStep, setActiveStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modals, setModals] = useState({ success: false, error: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    // Paso 1 — datos compartidos
    const [reason, setReason] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [observations, setObservations] = useState("");

    // Paso 2 — selección de lechones
    const [selectedPiglets, setSelectedPiglets] = useState<any[]>([]);

    const alivePiglets = piglets
        .filter((p) => p.status === "alive")
        .map((p, i) => ({ ...p, id: p._id ?? `piglet-${i}` }));

    const selectedMaleCount = selectedPiglets.filter((p) => p.sex === "male").length;
    const selectedFemaleCount = selectedPiglets.filter((p) => p.sex === "female").length;

    const pigletColumns: Column<any>[] = [
        {
            header: "#",
            accessor: "id",
            type: "text",
            render: (_: any, row: any) => <span>{alivePiglets.indexOf(row) + 1}</span>,
        },
        {
            header: t("litter.pigletColumn.sex"),
            accessor: "sex",
            type: "text",
            render: (value: string) => (
                <Badge color={value === "male" ? "info" : "danger"}>
                    {value === "male" ? t("common.sex.male") : t("common.sex.female")}
                </Badge>
            ),
        },
        {
            header: t("litter.pigletColumn.weight"),
            accessor: "weight",
            type: "text",
            render: (value: any) => `${Number(value).toFixed(2)} kg`,
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    // Validaciones por paso
    const validateStep1 = (): boolean => {
        if (!reason) {
            setAlertConfig({ visible: true, color: "danger", message: t('pigs.discardPiglets.validation.selectReason') });
            return false;
        }
        if (!date) {
            setAlertConfig({ visible: true, color: "danger", message: t('pigs.discardPiglets.validation.selectDate') });
            return false;
        }
        return true;
    };

    const validateStep2 = (): boolean => {
        if (selectedPiglets.length === 0) {
            setAlertConfig({ visible: true, color: "danger", message: t('pigs.discardPiglets.validation.selectPiglet') });
            return false;
        }
        return true;
    };

    const goToStep = (step: number) => {
        if (step === 2 && !validateStep1()) return;
        if (step === 3 && !validateStep2()) return;
        setActiveStep(step);
    };

    // Construir body agrupando por sexo
    const buildRequestBody = () => {
        const groups: Record<string, number> = {};
        selectedPiglets.forEach((p) => {
            groups[p.sex] = (groups[p.sex] || 0) + 1;
        });

        const discards = Object.entries(groups).map(([sex, quantity]) => ({
            reason,
            sex,
            quantity,
            date: date.toISOString(),
            ...(observations ? { observations } : {}),
        }));

        return { discards, registeredBy: userLogged._id };
    };

    const handleSubmit = async () => {
        if (!configContext || !userLogged) return;

        try {
            setIsSubmitting(true);
            const body = buildRequestBody();

            await configContext.axiosHelper.put(
                `${configContext.apiUrl}/litter/discard_piglets/${litterId}`,
                body
            );

            await configContext.axiosHelper.create(
                `${configContext.apiUrl}/user/add_user_history/${userLogged._id}`,
                { event: `Lechones descartados de la camada` }
            );

            toggleModal("success", true);
        } catch (error) {
            logger.error("Error discarding piglets:", { error });
            toggleModal("error", true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Wizard nav */}
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            href="#"
                            className={classnames({ active: activeStep === 1, done: activeStep > 1 })}
                            disabled
                        >
                            {t('pigs.discardPiglets.step.discardData')}
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            href="#"
                            className={classnames({ active: activeStep === 2, done: activeStep > 2 })}
                            disabled
                        >
                            {t('pigs.discardPiglets.step.selectPiglets')}
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            href="#"
                            className={classnames({ active: activeStep === 3 })}
                            disabled
                        >
                            {t('pigs.discardPiglets.step.summary')}
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                {/* ========== PASO 1: Datos del descarte ========== */}
                <TabPane tabId={1}>
                    <h5 className="mb-3">{t('pigs.discardPiglets.title.discardInfo')}</h5>

                    <Row className="g-3">
                        <Col md={6}>
                            <Label className="form-label">{t('pigs.discardPiglets.field.reason')}</Label>
                            <Input type="select" value={reason} onChange={(e) => setReason(e.target.value)}>
                                {REASON_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Input>
                        </Col>
                        <Col md={6}>
                            <Label className="form-label">{t('pigs.discardPiglets.field.date')}</Label>
                            <Flatpickr
                                className="form-control"
                                value={date}
                                onChange={(dates: Date[]) => { if (dates[0]) setDate(dates[0]); }}
                                options={{ dateFormat: "d/m/Y" }}
                            />
                        </Col>
                        <Col md={12}>
                            <Label className="form-label">{t('pigs.discardPiglets.field.observations')}</Label>
                            <Input
                                type="textarea"
                                rows={3}
                                placeholder="Opcional"
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                            />
                        </Col>
                    </Row>

                    <div className="mt-4 d-flex">
                        <Button className="ms-auto" onClick={() => goToStep(2)}>
                            {t('common.button.next')}
                            <i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                {/* ========== PASO 2: Selección de lechones ========== */}
                <TabPane tabId={2}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">{t('pigs.discardPiglets.title.selectPiglets')}</h5>
                        <Badge color="primary" className="fs-6">
                            {selectedPiglets.length} / {alivePiglets.length} seleccionados
                        </Badge>
                    </div>

                    {/* Resumen rápido de selección */}
                    <div className="row g-2 mb-3">
                        <div className="col-6">
                            <div className="border rounded p-2 text-center bg-light">
                                <div className="d-flex align-items-center justify-content-center mb-1">
                                    <i className="ri-men-line fs-5 text-info me-1"></i>
                                    <span className="text-muted fw-semibold">{t('pigs.discardPiglets.stats.selectedMales')}</span>
                                </div>
                                <h4 className="mb-0 text-info fw-bold">{selectedMaleCount}</h4>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="border rounded p-2 text-center bg-light">
                                <div className="d-flex align-items-center justify-content-center mb-1">
                                    <i className="ri-women-line fs-5 text-danger me-1"></i>
                                    <span className="text-muted fw-semibold">{t('pigs.discardPiglets.stats.selectedFemales')}</span>
                                </div>
                                <h4 className="mb-0 text-danger fw-bold">{selectedFemaleCount}</h4>
                            </div>
                        </div>
                    </div>

                    <SelectableCustomTable
                        columns={pigletColumns}
                        data={alivePiglets}
                        selectionMode="multiple"
                        onSelect={(rows) => setSelectedPiglets(rows)}
                        showSearchAndFilter={false}
                        showPagination={false}
                    />

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => setActiveStep(1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back')}
                        </Button>
                        <Button className="ms-auto" onClick={() => goToStep(3)}>
                            {t('common.button.next')}
                            <i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                {/* ========== PASO 3: Resumen ========== */}
                <TabPane tabId={3}>
                    {/* Banner de advertencia */}
                    <div className="alert alert-danger d-flex align-items-center gap-3 mb-4">
                        <i className="ri-error-warning-line fs-1"></i>
                        <div>
                            <div className="fw-semibold fs-6">{t('pigs.discardPiglets.summary.confirm')}</div>
                            <div className="small">{t('pigs.discardPiglets.summary.confirmWarning')}</div>
                        </div>
                    </div>

                    {mother && (
                        <Card className="mb-4">
                            <CardHeader className="d-flex align-items-center bg-light fs-5">
                                <i className="ri-heart-line me-2 text-success"></i>
                                <span className="text-black">{t('pigs.discardPiglets.summary.motherData')}</span>
                            </CardHeader>
                            <CardBody>
                                <div className="d-flex gap-4">
                                    <div>
                                        <span className="text-muted d-block small">{t('litter.motherAttr.code')}</span>
                                        <span className="fw-semibold">{mother.code ?? '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted d-block small">{t('litter.motherAttr.breed')}</span>
                                        <span className="fw-semibold">{mother.breed ?? '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted d-block small">{t('litter.motherAttr.birthdate')}</span>
                                        <span className="fw-semibold">{mother.birthdate ? new Date(mother.birthdate).toLocaleDateString() : '-'}</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    <div className="d-flex gap-3 align-items-stretch">
                        {/* Columna izquierda — Datos del descarte */}
                        <div className="d-flex flex-column w-50">
                            <Card className="w-100 mb-0 flex-fill">
                                <CardHeader className="d-flex align-items-center bg-light fs-5">
                                    <i className="ri-file-list-3-line me-2 text-danger"></i>
                                    <span className="text-black">{t('pigs.discardPiglets.summary.discardData')}</span>
                                </CardHeader>
                                <CardBody>
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="avatar-xs me-3">
                                            <div className="avatar-title bg-danger-subtle text-danger rounded">
                                                <i className="ri-alert-line"></i>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted d-block small">Razón</span>
                                            <span className="fw-semibold">{getReasonLabel(reason)}</span>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center mb-3">
                                        <div className="avatar-xs me-3">
                                            <div className="avatar-title bg-primary-subtle text-primary rounded">
                                                <i className="ri-calendar-line"></i>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted d-block small">Fecha</span>
                                            <span className="fw-semibold">{date.toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {observations && (
                                        <div className="d-flex align-items-start">
                                            <div className="avatar-xs me-3">
                                                <div className="avatar-title bg-warning-subtle text-warning rounded">
                                                    <i className="ri-chat-3-line"></i>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-muted d-block small">Observaciones</span>
                                                <span className="fw-semibold">{observations}</span>
                                            </div>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </div>

                        {/* Columna derecha — Lechones */}
                        <div className="d-flex flex-column w-50">
                            <Card className="w-100 mb-0 flex-fill">
                                <CardHeader className="d-flex align-items-center bg-light fs-5">
                                    <i className="ri-group-line me-2 text-danger"></i>
                                    <span className="text-black">{t('pigs.discardPiglets.summary.piglets')}</span>
                                </CardHeader>
                                <CardBody className="p-3">
                                    {/* Estadísticas */}
                                    <div className="row g-2 mb-3">
                                        <div className="col-4">
                                            <div className="border rounded p-2 text-center bg-danger-subtle">
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <i className="ri-parent-line fs-5 text-danger me-1"></i>
                                                    <span className="text-muted fw-semibold">{t('pigs.discardPiglets.stats.total')}</span>
                                                </div>
                                                <h4 className="mb-0 text-danger fw-bold">{selectedPiglets.length}</h4>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="border rounded p-2 text-center bg-light">
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <i className="ri-men-line fs-5 text-info me-1"></i>
                                                    <span className="text-muted fw-semibold">{t('pigs.discardPiglets.stats.males')}</span>
                                                </div>
                                                <h4 className="mb-0 text-info fw-bold">{selectedMaleCount}</h4>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="border rounded p-2 text-center bg-light">
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <i className="ri-women-line fs-5 text-danger me-1"></i>
                                                    <span className="text-muted fw-semibold">{t('pigs.discardPiglets.stats.females')}</span>
                                                </div>
                                                <h4 className="mb-0 text-danger fw-bold">{selectedFemaleCount}</h4>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabla */}
                                    <span className="text-muted fw-semibold d-block mb-2">{t('pigs.discardPiglets.stats.detail')}</span>
                                    <SimpleBar style={{ maxHeight: "200px" }}>
                                        <table className="table table-sm table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="text-center">#</th>
                                                    <th className="text-center">{t('litter.pigletColumn.sex')}</th>
                                                    <th className="text-center">{t('litter.pigletColumn.weight')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedPiglets.map((piglet, index) => (
                                                    <tr key={index}>
                                                        <td className="text-center">{index + 1}</td>
                                                        <td className="text-center">
                                                            <Badge color={piglet.sex === "male" ? "info" : "danger"}>
                                                                {piglet.sex === "male" ? t("common.sex.male") : t("common.sex.female")}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-center">{Number(piglet.weight).toFixed(2)} kg</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </SimpleBar>
                                </CardBody>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => setActiveStep(2)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back')}
                        </Button>
                        <Button className="ms-auto btn-danger" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Spinner size="sm" />
                            ) : (
                                <>
                                    <i className="ri-close-circle-line me-1" />
                                    {t('pigs.discardPiglets.button.confirmDiscard')}
                                </>
                            )}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                absolutePosition={false}
                autoClose={3000}
            />

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('pigs.discardPiglets.success')} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal("error", false)} message={t('pigs.discardPiglets.error')} />
        </>
    );
};

export default DiscardPigletsForm;
