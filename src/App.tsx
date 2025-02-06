import React, { useEffect, useMemo, useState } from 'react';

//import Scss
import './assets/scss/themes.scss';

//import Route
import Route from './Routes';
import { APIClient, getLoggedinUser } from 'helpers/api_helper';
import { ConfigurationData } from 'common/data_interfaces';

// Define el contexto con una estructura para exponer tanto el estado como el setter
export const ConfigContext = React.createContext<{
  configurationData: ConfigurationData | null;
  setConfigurationData: React.Dispatch<React.SetStateAction<ConfigurationData | null>>;
  logoUrl: string
  iconUrl: string
  apiUrl: string
  axiosHelper: APIClient
  userLogged: any
  setUserLogged: any
} | null>(null);

function App() {

  const [configurationData, setConfigurationData] = useState<ConfigurationData | null>(null)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [iconUrl, setIconUrl] = useState<string>('')
  const [userLogged, setUserLogged] = useState()
  const apiUrl = process.env.REACT_APP_API_URL || '';
  const axiosHelper = useMemo(() => new APIClient(), []);

  const getConfigurationData = async () => {
    await axiosHelper.get(`${apiUrl}/configurations/get_configurations`)
      .then((response) => {
        setConfigurationData(response.data.data)
      })
      .catch((error) => {
        console.error('Ha ocurrido un error al recuperar las configuraciones', error)
      })
  }

  const getSystemLogo = async () => {
    if (!configurationData?.farmLogo) return;
    try {
      const response = await axiosHelper.get(`${apiUrl}/google_drive/download_file/${configurationData.farmLogo}`, { responseType: 'blob' });
      setLogoUrl(URL.createObjectURL(response.data));
    } catch (error) {
      console.error('Error al obtener el logo:', error);
    }
  };

  const getSystemIcon = async () => {
    if (!configurationData?.farmIcon) return;
    try {
      const response = await axiosHelper.get(`${apiUrl}/google_drive/download_file/${configurationData.farmIcon}`, { responseType: 'blob' });
      setIconUrl(URL.createObjectURL(response.data));
    } catch (error) {
      console.error('Error al obtener el icono:', error);
    }
  };


  useEffect(() => {
    getConfigurationData();
    setUserLogged(getLoggedinUser())
  }, [])

  useEffect(() => {
    getSystemLogo();
    getSystemIcon();
  }, [configurationData])

  return (
    <ConfigContext.Provider value={{ configurationData, setConfigurationData, logoUrl, iconUrl, apiUrl, axiosHelper, userLogged, setUserLogged }}>
      <React.Fragment>
        <Route />
      </React.Fragment>
    </ConfigContext.Provider>

  );
}

export default App;
