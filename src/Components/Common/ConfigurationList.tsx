import { ConfigContext } from "App";
import { useContext, useState } from "react";
import {
    Card, CardHeader, CardBody, Button, ListGroup, ListGroupItem,
    Modal, ModalHeader, ModalBody, ModalFooter, Input
} from "reactstrap";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";

// Definir tipos
type ItemType = string | { prefix: string; value: string };

interface ConfigurationsListProps {
    items: ItemType[];
    groupName: string;
    cardTitle: string;
    isObjectArray?: boolean; // Indicar si los elementos son objetos
}

const ConfigurationsList: React.FC<ConfigurationsListProps> = ({
    items,
    groupName,
    cardTitle,
    isObjectArray = false, // Por defecto, asumimos que es un arreglo de strings
}) => {
    const configContext = useContext(ConfigContext);
    const [localItems, setLocalItems] = useState<ItemType[]>(items);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<ItemType>("");
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = () => {
        setModalOpen(!modalOpen);
        setCurrentItem(isObjectArray ? { prefix: "", value: "" } : "");
        setEditIndex(null);
    };

    const toggleMessageModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleSave = () => {
        if (isObjectArray) {
            const item = currentItem as { prefix: string; value: string };
            if (item.prefix.trim() === "" || item.value.trim() === "") return;
        } else {
            if ((currentItem as string).trim() === "") return;
        }

        let updatedItems = [...localItems];

        if (editIndex !== null) {
            // Si el valor no cambió, no hacer actualización innecesaria
            if (JSON.stringify(localItems[editIndex]) === JSON.stringify(currentItem)) {
                toggleModal();
                return;
            }
            updatedItems[editIndex] = currentItem;
        } else {
            updatedItems.push(currentItem);
        }

        setLocalItems(updatedItems);
        updateConfiguration(updatedItems);
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
        updateConfiguration(updatedItems);
    };

    const updateConfiguration = async (itemsToUpdate = localItems) => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.put(
                `${configContext.apiUrl}/configurations/update_configuration/${groupName}`,
                itemsToUpdate
            );
            const updatedConfiguration = response.data.data;
            configContext.setConfigurationData(updatedConfiguration);
            toggleMessageModal("success");
        } catch (error) {
            console.error(error, "Error in ConfigurationList - updateConfiguration");
            toggleMessageModal("error");
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
                                    {isObjectArray ? (
                                        <div>
                                            <strong>{(item as { prefix: string }).prefix} - </strong>{" "}
                                            {(item as { value: string }).value}
                                        </div>
                                    ) : (
                                        item as string
                                    )}
                                    <div>
                                        <Button className="me-2 farm-primary-button" size="sm" onClick={() => handleEdit(index)}>Editar</Button>
                                        <Button className="farm-secondary-button" size="sm" onClick={() => handleDelete(index)}>Eliminar</Button>
                                    </div>
                                </ListGroupItem>
                            ))
                        )}
                    </ListGroup>
                </CardBody>

                <Modal isOpen={modalOpen} toggle={toggleModal} centered>
                    <ModalHeader toggle={toggleModal}>
                        {editIndex !== null ? "Editar" : "Agregar"} Elemento
                    </ModalHeader>
                    <ModalBody>
                        {isObjectArray ? (
                            <>
                                <div className="mb-3">
                                    <label htmlFor="prefixInput" className="form-label">
                                        Prefijo
                                    </label>
                                    <Input
                                        id="prefixInput"
                                        value={(currentItem as { prefix: string }).prefix}
                                        onChange={(e) =>
                                            setCurrentItem({
                                                ...(currentItem as { prefix: string; value: string }),
                                                prefix: e.target.value,
                                            })
                                        }
                                        placeholder="Ingrese el prefijo"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="valueInput" className="form-label">
                                        Valor
                                    </label>
                                    <Input
                                        id="valueInput"
                                        value={(currentItem as { value: string }).value}
                                        onChange={(e) =>
                                            setCurrentItem({
                                                ...(currentItem as { prefix: string; value: string }),
                                                value: e.target.value,
                                            })
                                        }
                                        placeholder="Ingrese el valor"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="mb-3">
                                <label htmlFor="itemInput" className="form-label">
                                    Nombre del elemento
                                </label>
                                <Input
                                    id="itemInput"
                                    value={currentItem as string}
                                    onChange={(e) => setCurrentItem(e.target.value)}
                                    placeholder="Ingrese el nombre del elemento"
                                />
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={toggleModal}>
                            Cancelar
                        </Button>
                        <Button className="farm-primary-button" onClick={handleSave}>
                            Guardar
                        </Button>
                    </ModalFooter>
                </Modal>
            </Card>

            <SuccessModal
                isOpen={modals.success}
                onClose={() => toggleMessageModal('success', false)}
                message="Configuración guardada exitosamente"
            />

            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleMessageModal('error', false)}
                message="Ha ocurrido un error al guardar la configuración, intentelo más tarde"
            />
        </div>
    );
};

export default ConfigurationsList;