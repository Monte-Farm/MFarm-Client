import { APIClient } from "helpers/api_helper";
import { useEffect, useState } from "react";
import { Button, Card, CardBody, FormFeedback, Input, Label, Table } from "reactstrap";
import FileUploader from "./FileUploader";
import { useFormik } from "formik";
import CustomTable from "./CustomTable";

interface Tax {
  taxName: string;
  percentage: string;
}

export interface ConfigurationData {
  farmName: string;
  farmLogo: string;
  farmIcon: string;
  unitMeasurements: string[];
  categories: string[];
  userRoles: string[];
  taxes: Tax[];
}

const SystemConfiguration = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const axiosHelper = new APIClient();

  const [configuration, setConfiguration] = useState<ConfigurationData | null>(null);
  const [systemLogo, setSystemLogo] = useState<File | null>(null);
  const [systemIcon, setSystemIcon] = useState<File | null>(null);

  const formik = useFormik({
    initialValues: configuration || {
      farmName: '',
      farmLogo: '',
      farmIcon: '',
      unitMeasurements: [],
      categories: [],
      userRoles: [],
      taxes: []
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        console.log('Form values:', values);
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    }
  });

  const handleFetchConfiguration = async () => {
    await axiosHelper.get(`${apiUrl}/configurations/get_configurations`)
      .then((response) => {
        setConfiguration(response.data.data);
        console.log(response.data.data);
      })
      .catch((error) => {
        console.error('Error al recuperar los datos');
      });
  };

  useEffect(() => {
    handleFetchConfiguration();
  }, []);

  return (
    <>
      <h5>Configuración del sistema</h5>

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
        <Label htmlFor="imageInput" className="form-label">Logotipo del sistema</Label>
        <FileUploader acceptedFileTypes={['image/*']} maxFiles={1} onFileUpload={(file) => setSystemLogo(file)} />
      </div>

      <div className="mt-4">
        <Label htmlFor="imageInput" className="form-label">Icono del sistema</Label>
        <FileUploader acceptedFileTypes={['image/*']} maxFiles={1} onFileUpload={(file) => setSystemIcon(file)} />
      </div>

      <div className="d-flex gap-3">
        {/* Tabla de Impuestos */}
        <Card className="w-50">
          <CardBody>
            <h6>Impuestos</h6>
            {configuration?.taxes && configuration.taxes.length > 0 ? (
              <Table>
                <thead>
                  <tr>
                    <th>Nombre del Impuesto</th>
                    <th>Porcentaje</th>
                  </tr>
                </thead>
                <tbody>
                  {configuration.taxes.map((tax, index) => (
                    <tr key={index}>
                      <td>{tax.taxName}</td>
                      <td>{tax.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p>No hay impuestos configurados</p>
            )}
          </CardBody>
        </Card>

        {/* Tabla de Unidades de Medida */}
        <Card className="w-50">
          <CardBody>
            <h6>Unidades de Medida</h6>
            {configuration?.unitMeasurements && configuration.unitMeasurements.length > 0 ? (
              <Table>
                <thead>
                  <tr>
                    <th>Unidad de Medida</th>
                  </tr>
                </thead>
                <tbody>
                  {configuration.unitMeasurements.map((unit, index) => (
                    <tr key={index}>
                      <td>{unit}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p>No hay unidades de medida configuradas</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="d-flex gap-3 mt-3">
        {/* Tabla de Categorías */}
        <Card className="w-50">
          <CardBody>
            <h6>Categorías</h6>
            {configuration?.categories && configuration.categories.length > 0 ? (
              <Table>
                <thead>
                  <tr>
                    <th>Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {configuration.categories.map((category, index) => (
                    <tr key={index}>
                      <td>{category}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p>No hay categorías configuradas</p>
            )}
          </CardBody>
        </Card>

        {/* Tabla de Roles de Usuario */}
        <Card className="w-50">
          <CardBody>
            <h6>Roles de Usuario</h6>
            {configuration?.userRoles && configuration.userRoles.length > 0 ? (
              <Table>
                <thead>
                  <tr>
                    <th>Rol de Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {configuration.userRoles.map((role, index) => (
                    <tr key={index}>
                      <td>{role}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p>No hay roles de usuario configurados</p>
            )}
          </CardBody>
        </Card>
      </div>

      <Button color="success" className="mt-4">Guardar</Button>
    </>
  );
};

export default SystemConfiguration;
