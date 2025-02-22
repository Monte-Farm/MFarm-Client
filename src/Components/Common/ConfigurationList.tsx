import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { Card, CardHeader, CardBody, Button, ListGroup, ListGroupItem, Modal, ModalHeader, ModalBody, ModalFooter, Input } from "reactstrap";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";

interface ConfigurationsListProps {
    items: string[];
    groupName: string;
    cardTitle: string;
}

const ConfigurationsList: React.FC<ConfigurationsListProps> = ({ items, groupName, cardTitle }) => {
    const configContext = useContext(ConfigContext);
    const [localItems, setLocalItems] = useState<string[]>(items);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState("");
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = () => {
        setModalOpen(!modalOpen);
        setCurrentItem("");
        setEditIndex(null);
    };

    const toggleMessageModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleSave = () => {
        if (currentItem.trim() === "") return;

        let updatedItems = [...localItems];
        if (editIndex !== null) {
            updatedItems[editIndex] = currentItem;
        } else {
            updatedItems.push(currentItem);
        }

        setLocalItems(updatedItems);
        toggleModal();
    };

    const handleEdit = (index: number) => {
        setCurrentItem(localItems[index]);
        setEditIndex(index);
        setModalOpen(true);
    };

    const handleDelete = (index: number) => {
        const updatedItems = localItems.filter((_, i) => i !== index);
        setLocalItems(updatedItems);
    };

    const updateConfiguration = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.put(`${configContext.apiUrl}/configurations/update_configuration/${groupName}`, localItems);
            const updatedConfiguration = response.data.data;
            configContext.setConfigurationData(updatedConfiguration);
            toggleMessageModal('success');
        } catch (error) {
            console.error(error, 'Error in ConfigurationList - updateConfiguration');
            toggleMessageModal('error');
        }
    };

    return (
        <div>
            <Card>
                <CardHeader>
                    <div className="d-flex">
                        <h5 className="flex-grow-1">{cardTitle}</h5>
                        <Button className="farm-primary-button me-2" onClick={toggleModal}>
                            <i className="ri-add-line me-3" />
                            Agregar Elemento
                        </Button>
                        <Button className="farm-secondary-button" onClick={updateConfiguration}>
                            Guardar Configuración
                        </Button>
                    </div>
                </CardHeader>
                <CardBody>
                    <ListGroup>
                        {localItems.length === 0 ? (
                            <ListGroupItem className="text-center">
                                No hay elementos de configuración
                            </ListGroupItem>
                        ) : (
                            localItems.map((item, index) => (
                                <ListGroupItem key={index} className="d-flex justify-content-between">
                                    {item}
                                    <div>
                                        <Button className="me-2 farm-primary-button" size="sm" onClick={() => handleEdit(index)} >Editar</Button>
                                        <Button className="farm-secondary-button" size="sm" onClick={() => handleDelete(index)}>Eliminar</Button>
                                    </div>
                                </ListGroupItem>
                            ))
                        )}
                    </ListGroup>
                </CardBody>

                <Modal isOpen={modalOpen} toggle={toggleModal} centered>
                    <ModalHeader toggle={toggleModal}>{editIndex !== null ? "Editar" : "Agregar"} Elemento</ModalHeader>
                    <ModalBody>
                        <Input value={currentItem} onChange={(e) => setCurrentItem(e.target.value)} placeholder="Nombre del elemento" />
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={toggleModal}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={handleSave}>Guardar</Button>
                    </ModalFooter>
                </Modal>
            </Card>

            <SuccessModal isOpen={modals.success} onClose={() => toggleMessageModal('success', false)} message={"Configuracion guardada exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={() => toggleMessageModal('success', false)} message="Ha ocurrido un error al guardar la configuración, intentelo mas tarde"></ErrorModal>
        </div>
    );
};

export default ConfigurationsList;
