import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import ObjectDetails from "Components/Common/ObjectDetails";
import ProductForm from "Components/Common/ProductForm";
import { useContext, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import noImageUrl from '../../assets/images/no-image.png'
import { Attribute, ProductData } from "common/data_interfaces";
import { ConfigContext } from "App";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import AlertMessage from "Components/Common/AlertMesagge";
import LoadingAnimation from "Components/Common/LoadingAnimation";


const productAttributes: Attribute[] = [
    { key: 'id', label: 'Código', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'category', label: 'Categoría', type: 'text' },
    { key: 'unit_measurement', label: 'Unidad de Medida', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'text' },
]


const ViewProducts = () => {
    document.title = "Catálogo de Productos | Almacén"
    const configContext = useContext(ConfigContext);

    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState<ProductData>()
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, details: false, update: false, delete: false, activate: false });
    const [loading, setLoading] = useState<boolean>(true);

    const columns: Column<any>[] = [
        {
            header: 'Imagen', accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="Imagen del Producto" style={{ height: "70px" }} />
            ),
        },
        { header: 'Código', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
        { header: 'Categoría', accessor: 'category', isFilterable: true, type: 'text' },
        { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true, type: 'text' },
        {
            header: 'Estado', accessor: 'status', isFilterable: true, render: (value: boolean) => (
                <Badge color={value ? "success" : "danger"}>{value ? "Activo" : "Inactivo"}</Badge>
            ),
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleClicModal('details', row)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <Button className="farm-primary-button btn-icon" disabled={row.status !== true} onClick={() => handleClicModal('update', row)}>
                        <i className="ri-pencil-fill align-middle"></i>
                    </Button>
                    {row.status === true ? (
                        <Button className="farm-secondary-button btn-icon" onClick={() => handleClicModal('delete', row)}>
                            <i className="ri-forbid-line align-middle"></i>
                        </Button>
                    ) : (
                        <Button className="farm-secondary-button btn-icon" onClick={() => handleClicModal('activate', row)}>
                            <i className="ri-check-fill align-middle"></i>
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleClicModal = async (modal: any, data: ProductData) => {
        setSelectedProduct(data);
        toggleModal(modal)
    }

    const handleFetchProducts = async () => {
        setLoading(true);
        try {
            if (!configContext) return;
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product`);
            setProducts(response.data.data)
        } catch (error) {
            console.error('Error fetching products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los productos, intentelo más tarde' });
        } finally {
            setLoading(false);
        }
    };


    const handleCreateProduct = async (data: ProductData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/product/create_product`, data);
            setAlertConfig({ visible: true, color: 'success', message: 'Producto creado con éxito' });
            handleFetchProducts();
        } catch (error) {
            console.error('Error creating product:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al crear el producto, intentelo más tarde' });
        } finally {
            toggleModal('create');
        }
    };


    const handleUpdateProduct = async (data: ProductData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/product/update_product/${data.id}`, data);
            setAlertConfig({ visible: true, color: 'success', message: 'Producto actualizado con éxito' });

            handleFetchProducts();
        } catch (error) {
            console.error('Error updating products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al actualizar el producto, intentelo mas tarde' });
        } finally {
            toggleModal('update');
            setSelectedProduct(undefined);
        }
    };


    const handleDeleteProduct = async (product_id: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/product/delete_product/${product_id}`);
            setAlertConfig({ visible: true, color: 'success', message: 'Producto desactivado con éxito' });

            handleFetchProducts();
        } catch (error) {
            console.error('Error deactivating products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al desactivar el producto, intentelo mas tarde' });
        } finally {
            toggleModal('delete');
            setSelectedProduct(undefined);
        }
    };

    const handleActivateProduct = async (product_id: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/product/activate_product/${product_id}`, {});
            setAlertConfig({ visible: true, color: 'success', message: 'Producto activado con éxito' });
            handleFetchProducts();
        } catch (error) {
            console.error('Error ctivating products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al sactivar el producto, intentelo mas tarde' });
        } finally {
            toggleModal('activate');
            setSelectedProduct(undefined);
        }
    };


    const fetchImageById = async (imageId: string) => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/google_drive/download_file/${imageId}`, { responseType: 'blob' });
            const imageUrl = URL.createObjectURL(response.data);
            return imageUrl
        } catch (error) {
            console.error('Error al recuperar la imagen: ', error);
        }
    };


    useEffect(() => {
        handleFetchProducts();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Catálogo de Productos"} pageTitle={"Almacén General"}></BreadCrumb>

                <Card className="rounded" style={{ height: '75vh' }}>
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2  " />
                                Agregar Producto
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={products.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {products.length === 0 ? (
                            <>
                                <i className="ri-box-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay productos registrados en el inventario</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={products} showPagination={false} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Modal Details */}
            <Modal size="lg" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("details")}><h4>Detalles de Producto</h4></ModalHeader>
                <ModalBody>
                    {selectedProduct && (
                        <ObjectDetails attributes={productAttributes} object={selectedProduct} showImage={true} imageSrc={selectedProduct.image}></ObjectDetails>
                    )}
                </ModalBody>
            </Modal>

            {/* Modal Create */}
            <Modal size="lg" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nuevo Producto </ModalHeader>
                <ModalBody>
                    <ProductForm onSubmit={handleCreateProduct} onCancel={() => toggleModal("create", false)} />
                </ModalBody>
            </Modal>

            {/* Modal Update */}
            <Modal size="lg" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("update")}>Actualizar Producto</ModalHeader>
                <ModalBody>
                    <ProductForm initialData={selectedProduct} onSubmit={handleUpdateProduct} onCancel={() => toggleModal("update", false)} isCodeDisabled={true} />
                </ModalBody>
            </Modal>

            {/* Modal Delete */}
            <Modal isOpen={modals.delete} toggle={() => toggleModal("delete")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("delete")}>Desactivar Producto</ModalHeader>
                <ModalBody>¿Desea desactivar el producto {selectedProduct?.name}?</ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("delete", false)}>Cancelar</Button>
                    <Button className="farm-primary-button" onClick={() => {
                        if (selectedProduct) {
                            handleDeleteProduct(selectedProduct.id)
                        }
                    }}>Confirmar</Button>
                </ModalFooter>
            </Modal>

            {/* Modal Activate */}
            <Modal isOpen={modals.activate} toggle={() => toggleModal("activate")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("activate")}>Activar Producto</ModalHeader>
                <ModalBody>¿Desea activar el producto {selectedProduct?.name}?</ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("activate", false)}>Cancelar</Button>
                    <Button className="farm-primary-button" onClick={() => {
                        if (selectedProduct) {
                            handleActivateProduct(selectedProduct.id)
                        }
                    }}>Confirmar</Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewProducts;