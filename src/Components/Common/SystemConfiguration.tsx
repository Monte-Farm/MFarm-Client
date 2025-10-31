import { APIClient } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Spinner } from "reactstrap";
import FileUploader from "./Shared/FileUploader";
import { useFormik } from "formik";
import { ConfigurationData, Tax } from "common/data_interfaces";
import { ConfigContext } from "App";
import TaxesTable from "./Tables/TaxesTable";

const SystemConfiguration = () => {
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [configuration, setConfiguration] = useState<ConfigurationData | null>(null);
    const [systemLogo, setSystemLogo] = useState<File | null>(null);
    const [systemIcon, setSystemIcon] = useState<File | null>(null);
    const configContext = useContext(ConfigContext)

    const formik = useFormik({
        initialValues: configuration || {
            farmName: "",
            farmLogo: "",
            farmIcon: "",
            unitMeasurements: [],
            productCategories: [],
            incomeTypes: [],
            outcomeTypes: [],
            userRoles: [],
            taxes: [],
            supplierCategories: []
        },
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            setSubmitting(true)
            let idFolder: string = "";
            try {
                if (systemLogo || systemIcon) {
                    idFolder = await handleCreateFolder();
                }

                if (systemLogo) {
                    await handleUploadLogo(idFolder)
                }

                if (systemIcon) {
                    await handleUploadIcon(idFolder)
                }

                await handleSaveConfiguration(values)
            } catch (error) {
                console.error("Error submitting form:", error);
            } finally {
                setSubmitting(false)
            }
        },
    });

    const handleError = (error: any, messagge: string) => {
        console.error(error, messagge)
        setAlertConfig({ visible: true, color: 'danger', message: messagge })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const handleFetchConfiguration = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/configurations/get_configurations`);
            setConfiguration(response.data.data);
            formik.setValues(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al recuperar las configuraciones, intentelo más tarde');
        }
    };


    const handleCreateFolder = async (): Promise<string> => {
        if (!configContext) return '';

        try {
            const folders = ['Configuration'];
            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/google_drive/create_folders`, folders);
            return response.data.data;
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al guardar los datos, intentelo más tarde');
            return '';
        }
    };


    const handleUploadLogo = async (folderId: string) => {
        if (!configContext || !systemLogo) return;

        try {
            const response = await configContext.axiosHelper.uploadImage(`${configContext.apiUrl}/google_drive/upload_file/${folderId}`, systemLogo);
            formik.values.farmLogo = response.data.data;
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al guardar los datos, intentelo más tarde');
        }
    };


    const handleUploadIcon = async (folderId: string) => {
        if (!configContext || !systemIcon) return;

        try {
            const response = await configContext.axiosHelper.uploadImage(`${configContext.apiUrl}/google_drive/upload_file/${folderId}`, systemIcon);
            formik.values.farmIcon = response.data.data;
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al guardar los datos, intentelo más tarde');
        }
    };


    const handleSaveConfiguration = async (data: ConfigurationData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/configurations/update_configurations`, data);
            configContext.setConfigurationData(data);
            setAlertConfig({ visible: true, color: 'success', message: 'Configuraciones guardadas con éxito' });
            setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al guardar las configuraciones, intentelo más tarde');
        }
    };


    const handleFormChange = (name: string, newValues: string[]) => {
        formik.setFieldValue(name, newValues);
    };

    const handleFormTaxChange = (name: string, newTax: Tax[]) => {
        formik.setFieldValue(name, newTax);
    };

    useEffect(() => {
        handleFetchConfiguration();
    }, []);

    return (
        <form onSubmit={formik.handleSubmit}> {/* Envolver en un formulario */}
            <div className="d-flex">
                <h5>Configuración del sistema</h5>

                <Button type="submit" color="success" className="ms-auto" disabled={formik.isSubmitting}>
                    {formik.isSubmitting ? <Spinner></Spinner> : 'Guardar'}
                </Button>
            </div>

            <div className="mt-4">
                <Label htmlFor="nameInput">Nombre del sistema</Label>
                <Input
                    type="text"
                    id="nameInput"
                    className="form-control"
                    name="farmName"
                    value={formik.values.farmName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.farmName && !!formik.errors.farmName}
                />
                {formik.touched.farmName && formik.errors.farmName && (
                    <FormFeedback>{formik.errors.farmName}</FormFeedback>
                )}
            </div>

            <div className="mt-4">
                <Label htmlFor="imageInput" className="form-label">
                    Logotipo del sistema
                </Label>
                <FileUploader
                    acceptedFileTypes={["image/*"]}
                    maxFiles={1}
                    onFileUpload={(file) => setSystemLogo(file)}
                />
            </div>

            <div className="mt-4">
                <Label htmlFor="imageInput" className="form-label">
                    Icono del sistema
                </Label>
                <FileUploader
                    acceptedFileTypes={["image/*"]}
                    maxFiles={1}
                    onFileUpload={(file) => setSystemIcon(file)}
                />
            </div>

            <Card className="border">
                <CardHeader>
                    <h5>Impuestos</h5>
                </CardHeader>
                <CardBody>
                    <TaxesTable name="taxes" taxes={formik.values.taxes} onChange={handleFormTaxChange}></TaxesTable>
                </CardBody>
            </Card>

            <div className="d-flex">
                <Button type="submit" color="success" className="mt-4 ms-auto" disabled={formik.isSubmitting}>
                    {formik.isSubmitting ? <Spinner></Spinner> : 'Guardar'}
                </Button>
            </div>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </form>

    );


};

export default SystemConfiguration;
