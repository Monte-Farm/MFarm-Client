import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { FEEDING_PACKAGE_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useState } from "react";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "./ObjectDetails";
import { Attribute } from "common/data_interfaces";
import { Badge, Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalFooter, ModalHeader, Progress } from "reactstrap";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import noImageUrl from '../../../assets/images/no-image.png';
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { HttpStatusCode } from "axios";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { useTranslation } from "react-i18next";

interface FeedingPackageDetailsProps {
    feedingPackageId: string;
}

const FeedingPackageDetails: React.FC<FeedingPackageDetailsProps> = ({ feedingPackageId }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [recipe, setRecipe] = useState<any>({});
    const [feedingsItems, setFeedingsItems] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({
        deactivate: false, activate: false,
        deactivationSuccess: false, activationSuccess: false,
        deactivationError: false, activationError: false,
    });
    const [, setSubmitting] = useState<boolean>(false);

    const totalPercentage = feedingsItems.reduce((acc, f) => acc + (f.percentage ?? 0), 0);

    const recipeAttributes: Attribute[] = [
        { key: 'code', label: t('feeding.package.detail.code'), type: 'text' },
        { key: 'name', label: t('feeding.package.detail.name'), type: 'text' },
        { key: 'creation_date', label: t('feeding.package.detail.createdAt'), type: 'date' },
        {
            key: 'stage', label: t('common.field.stage'), type: 'text',
            render: (_, row) => {
                const stageColors: Record<string, string> = {
                    general: 'info', piglet: 'info', weaning: 'warning',
                    fattening: 'primary', breeder: 'success',
                };
                return (
                    <Badge color={stageColors[row.stage] || 'secondary'}>
                        {t(`feeding.stage.${row.stage}`, { defaultValue: row.stage })}
                    </Badge>
                );
            },
        },
        {
            key: 'expectedYield', label: t('feeding.package.detail.expectedYield'),
            render: (_, row) => <span>{row.expectedYield ?? 100}%</span>
        },
        { key: 'description', label: t('feeding.package.detail.description'), type: 'text' },
        {
            key: 'creation_responsible', label: t('feeding.package.detail.responsible'),
            render: () => (<span className="text-black">{recipe?.creation_responsible?.name} {recipe?.creation_responsible?.lastname}</span>)
        },
        {
            key: 'is_active', label: t('feeding.package.detail.status'),
            render: (value: boolean) => (
                <Badge color={value ? "success" : "danger"}>
                    {value ? t('common.status.active') : t('common.status.inactive')}
                </Badge>
            ),
        },
    ];

    const ingredientColumns: Column<any>[] = [
        {
            header: t('feeding.package.form.column.image'), accessor: 'image',
            render: (_, row) => (
                <img src={row.feeding?.image || noImageUrl} alt={t('feeding.package.form.column.product')} style={{ height: "70px" }} />
            ),
        },
        {
            header: t('feeding.package.form.column.code'), accessor: "feeding.id", type: "text", isFilterable: true,
            render: (_, row) => row.feeding?.id || row.feeding?._id,
        },
        {
            header: t('feeding.package.form.column.product'), accessor: "name", type: "text", isFilterable: true,
            render: (_, row) => row.feeding?.name,
        },
        {
            header: t('feeding.package.form.column.percentage'), accessor: "percentage",
            render: (_, row) => <Badge color="success" className="fs-6">{(row.percentage ?? 0).toFixed(2)}%</Badge>
        },
        {
            header: t('feeding.package.form.column.contributionShort'), accessor: "perKg",
            render: (_, row) => <span>{((row.percentage ?? 0) / 100).toFixed(3)} kg</span>
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext || !userLogged || !feedingPackageId) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.findById(feedingPackageId)}`);
            const data = response.data.data;
            setRecipe(data);
            setFeedingsItems(data.feedings || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('feeding.package.error.load') });
        } finally {
            setLoading(false);
        }
    };

    const deactivateRecipe = async () => {
        if (!configContext || !userLogged || !feedingPackageId) return;
        try {
            setSubmitting(true);
            const response = await configContext.axiosHelper.put(`${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.deactivate(feedingPackageId)}`, {});
            if (response.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Receta de alimentación ${recipe.code} desactivada`,
                });
                toggleModal('deactivationSuccess');
            }
        } catch (error) {
            toggleModal('deactivationError');
        } finally {
            setSubmitting(false);
        }
    };

    const activateRecipe = async () => {
        if (!configContext || !userLogged || !feedingPackageId) return;
        try {
            setSubmitting(true);
            const response = await configContext.axiosHelper.put(`${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.activate(feedingPackageId)}`, {});
            if (response.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Receta de alimentación ${recipe.code} activada`,
                });
                toggleModal('activationSuccess');
            }
        } catch (error) {
            toggleModal('activationError');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedingPackageId]);

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <>
            <div className="d-flex gap-2 mb-3 justify-content-end">
                {(userLogged.role.includes('veterinarian') || userLogged.role.includes('farm_manager')) && (
                    recipe.is_active ? (
                        <Button color="danger" onClick={() => toggleModal('deactivate')}>
                            <i className="ri-forbid-line align-middle me-2 fs-5" />
                            {t('feeding.package.action.deactivate')}
                        </Button>
                    ) : (
                        <Button color="success" onClick={() => toggleModal('activate')}>
                            <i className="ri-check-line align-middle me-2 fs-5" />
                            {t('feeding.package.action.activate')}
                        </Button>
                    )
                )}
            </div>

            <div className="d-flex gap-3 align-items-start">
                <Card className="border-primary border-opacity-25 flex-shrink-0" style={{ width: '320px' }}>
                    <CardHeader className="bg-primary bg-opacity-10">
                        <h5 className="mb-0 text-primary">
                            <i className="ri-file-list-3-line me-2" /> {t('feeding.package.form.card.recipeInfo')}
                        </h5>
                    </CardHeader>
                    <CardBody>
                        <ObjectDetails attributes={recipeAttributes} object={recipe} />
                    </CardBody>
                </Card>

                <Card className="flex-fill border-success border-opacity-25">
                    <CardHeader className="bg-success bg-opacity-10 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 text-success">
                            <i className="ri-leaf-line me-2" /> {t('feeding.package.form.step.ingredients')}
                        </h5>
                        <Badge color={Math.abs(totalPercentage - 100) < 0.01 ? 'success' : 'danger'} className="fs-6">
                            {t('feeding.package.detail.totalPercentage', { val: totalPercentage.toFixed(2) })}
                        </Badge>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable
                            columns={ingredientColumns}
                            data={feedingsItems}
                            showSearchAndFilter={false}
                            showPagination={true}
                            rowsPerPage={5}
                        />
                        <div className="px-4 py-3 border-top bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <small className="text-muted">{t('feeding.package.form.card.percentageDistribution')}</small>
                                <small className="text-muted">{feedingsItems.length} {t('feeding.package.form.card.ingredientCount')}</small>
                            </div>
                            <Progress
                                value={Math.min(totalPercentage, 100)}
                                color={Math.abs(totalPercentage - 100) < 0.01 ? 'success' : 'warning'}
                                style={{ height: '10px' }}
                            />
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Modal size="md" isOpen={modals.deactivate} toggle={() => toggleModal("deactivate")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("deactivate")}>{t('feeding.package.action.deactivate')}</ModalHeader>
                <ModalBody>
                    <p>{t('feeding.package.action.deactivateConfirm')}</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('deactivate', false)}>{t('common.button.cancel')}</Button>
                    <Button color="danger" onClick={() => { toggleModal('deactivate'); deactivateRecipe(); }}>{t('common.button.confirm')}</Button>
                </ModalFooter>
            </Modal>

            <Modal size="md" isOpen={modals.activate} toggle={() => toggleModal("activate")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("activate")}>{t('feeding.package.action.activate')}</ModalHeader>
                <ModalBody>
                    <p>{t('feeding.package.action.activateConfirm')}</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('activate', false)}>{t('common.button.cancel')}</Button>
                    <Button color="success" onClick={() => { toggleModal('activate'); activateRecipe(); }}>{t('common.button.confirm')}</Button>
                </ModalFooter>
            </Modal>

            <SuccessModal isOpen={modals.deactivationSuccess} onClose={() => { toggleModal('deactivationSuccess'); fetchData(); }} message={t('feeding.package.success.deactivated')} />
            <SuccessModal isOpen={modals.activationSuccess} onClose={() => { toggleModal('activationSuccess'); fetchData(); }} message={t('feeding.package.success.activated')} />
            <ErrorModal isOpen={modals.deactivationError} onClose={() => toggleModal('deactivationError')} message={t('feeding.package.error.deactivate')} />
            <ErrorModal isOpen={modals.activationError} onClose={() => toggleModal('activationError')} message={t('feeding.package.error.activate')} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    );
};

export default FeedingPackageDetails;
