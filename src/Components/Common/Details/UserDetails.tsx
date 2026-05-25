import { logger } from 'utils/logger';
import { appendLangParam } from 'helpers/reports_url_helper';
import { ConfigContext } from "App";
import { Attribute, UserData } from "common/data_interfaces";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, CardBody, CardHeader, Col, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap";
import SimpleBar from "simplebar-react";
import defaultImageProfila from '../../../assets/images/default-profile-mage.jpg';
import ErrorModal from "../Shared/ErrorModal";
import LoadingAnimation from "../Shared/LoadingAnimation";
import SuccessModal from "../Shared/SuccessModal";
import ObjectDetails from "./ObjectDetails";
import PDFViewer from "../Shared/PDFViewer";
import UserForm from "../Forms/UserForm";
import UserHistoryItem from "../Lists/UserHistoryItem";

interface UserDetailsProps {
    userId: string
}

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const UserDetailsModal: React.FC<UserDetailsProps> = ({ userId }) => {
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);
    const { t } = useTranslation();
    const [userDetails, setUserDetails] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ details: false, create: false, update: false, deactivate: false, activate: false, success: false, error: false, viewPDF: false });
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    const roleColorsMap: Record<string, string> = {
        Superadmin: "danger",
        farm_manager: "primary",
        warehouse_manager: "warning",
        subwarehouse_manager: "secondary",
        general_worker: "success",
        reproduction_technician: "info",
        veterinarian: "dark",
    };

    const userAttributes: Attribute[] = [
        { key: 'username', label: t('users.details.attr.username'), type: 'text' },
        { key: 'name', label: t('users.details.attr.name'), type: 'text' },
        { key: 'lastname', label: t('users.details.attr.lastname'), type: 'text' },
        { key: 'email', label: t('users.details.attr.email'), type: 'text' },
        {
            key: 'role',
            label: t('users.details.attr.role'),
            type: 'text',
            render: (value: string | string[] | undefined) => {
                const roles = Array.isArray(value) ? value : value ? [value] : [];
                if (!roles.length) return <span className="text-muted">—</span>;
                return (
                    <div className="d-flex flex-wrap gap-2">
                        {roles.map((r: string) => (
                            <Badge key={r} color={roleColorsMap[r] || "secondary"} pill>
                                {t(`roles.${r}`, { defaultValue: r })}
                            </Badge>
                        ))}
                    </div>
                );
            },
        },
        { key: 'status', label: t('users.details.attr.status'), type: 'status' },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchUserDetails = async () => {
        if (!configContext || !userId) return;
        setIsLoading(true);
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_mongo_id/${userId}`);
            setUserDetails(response.data.data);
        } catch (error) {
            toggleModal('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivateUser = async () => {
        if (!configContext) return;
        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/user/delete_user/${userDetails?.username}`);
            setSuccessMessage(t('users.details.success.deactivated'));
            toggleModal('success');
        } catch (error) {
            toggleModal('error');
        } finally {
            toggleModal('deactivate', false);
        }
    };

    const handleActivateUser = async () => {
        if (!configContext) return;
        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/user/activate_user/${userDetails?.username}`, {});
            setSuccessMessage(t('users.details.success.activated'));
            toggleModal('success');
        } catch (error) {
            toggleModal('error');
        } finally {
            toggleModal('activate', false);
        }
    };

    const handleGenerateReport = async () => {
        if (!configContext) return;
        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(appendLangParam(`${configContext.apiUrl}/reports/users/${userId}?orientation=portrait&format=A4`));
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating report:', { error });
            toggleModal('error');
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        fetchUserDetails();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (isLoading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <div>
            <div className="d-flex mb-3 gap-2">
                <Button color="primary" className="btn-pdf" onClick={handleGenerateReport} disabled={pdfLoading}>
                    {pdfLoading ? (
                        <>
                            <Spinner className="me-2" size='sm' />
                            {t('common.button.generating')}
                        </>
                    ) : (
                        <>
                            <i className="ri-file-pdf-line me-2" />
                            {t('common.button.exportPdf')}
                        </>
                    )}
                </Button>

                {userDetails?.status === true ? (
                    <Button className="farm-secondary-button ms-auto" onClick={() => toggleModal("deactivate")}>
                        <i className="ri-delete-bin-line me-3" />
                        {t('users.details.button.deactivate')}
                    </Button>
                ) : (
                    <Button className="btn-success ms-auto" onClick={() => toggleModal("activate")}>
                        <i className="ri-check-line me-3" />
                        {t('users.details.button.activate')}
                    </Button>
                )}

                <Button className="farm-primary-button" onClick={() => toggleModal("update")} disabled={!userDetails?.status}>
                    <i className="ri-pencil-line me-3" />
                    {t('users.details.button.edit')}
                </Button>
            </div>

            <Row>
                <Col lg={5}>
                    <Card>
                        <CardHeader>
                            <h4>{t('users.details.card.info')}</h4>
                        </CardHeader>
                        <CardBody>
                            <ObjectDetails
                                attributes={userAttributes}
                                object={userDetails || {}}
                                showImage={true}
                                imageSrc={userDetails?.profile_image || defaultImageProfila}
                            />
                        </CardBody>
                    </Card>
                </Col>

                <Col lg={7}>
                    <Card>
                        <CardHeader>
                            <h4>{t('users.details.card.history')}</h4>
                        </CardHeader>
                        <CardBody style={{ padding: 0 }}>
                            {userDetails?.history?.length ? (
                                <SimpleBar style={{ maxHeight: 635, padding: '1rem' }} className="scrollable-history">
                                    {userDetails.history.map((item, idx) => (
                                        <UserHistoryItem key={idx} record={item} />
                                    ))}
                                </SimpleBar>
                            ) : (
                                <div
                                    className="d-flex flex-column justify-content-center align-items-center text-muted fst-italic"
                                    style={{ height: '635px', fontSize: '1.1rem' }}
                                >
                                    <i className="ri-file-info-line mb-2" style={{ fontSize: '2rem' }} />
                                    {t('users.details.emptyHistory')}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('update')}>{t('users.modal.update')}</ModalHeader>
                <ModalBody>
                    <UserForm
                        initialData={userDetails || undefined}
                        isUsernameDisable={true}
                        onSave={() => { toggleModal('update'); fetchUserDetails(); }}
                        onCancel={() => toggleModal('update', false)}
                        currentUserRole={userLogged.role}
                    />
                </ModalBody>
            </Modal>

            <Modal isOpen={modals.deactivate} toggle={() => toggleModal('deactivate')} size="md" keyboard={false} backdrop="static" centered>
                <ModalHeader toggle={() => toggleModal('deactivate')}>
                    {t('users.details.deactivateModal.title')}
                </ModalHeader>
                <ModalBody>
                    {t('users.details.deactivateModal.body', { username: userDetails?.username })}
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal('deactivate', false)}>
                        {t('common.button.cancel')}
                    </Button>
                    <Button className="farm-primary-button" onClick={() => { if (userDetails) handleDeactivateUser(); }}>
                        {t('users.details.deactivateModal.confirm')}
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={modals.activate} toggle={() => toggleModal('activate')} size="md" keyboard={false} backdrop="static" centered>
                <ModalHeader toggle={() => toggleModal('activate')}>
                    {t('users.details.activateModal.title')}
                </ModalHeader>
                <ModalBody>
                    {t('users.details.activateModal.body', { username: userDetails?.username })}
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal('activate', false)}>
                        {t('common.button.cancel')}
                    </Button>
                    <Button className="farm-primary-button" onClick={() => { if (userDetails) handleActivateUser(); }}>
                        {t('users.details.activateModal.confirm')}
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('users.details.pdfModal')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={modals.success} onClose={() => { toggleModal('success'); fetchUserDetails(); }} message={successMessage} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t('users.details.error')} />
        </div>
    );
};

export default UserDetailsModal;
