import React, { useEffect, useState } from 'react';

//import Scss
import './assets/scss/themes.scss';

//imoprt Route
import Route from './Routes';
import { APIClient } from 'helpers/api_helper';
import { ConfigurationData } from 'common/data_interfaces';

// Define el contexto con una estructura para exponer tanto el estado como el setter
export const ConfigContext = React.createContext<{
  configurationData: ConfigurationData | null;
  setConfigurationData: React.Dispatch<React.SetStateAction<ConfigurationData | null>>;
  logoUrl: string
  iconUrl: string
} | null>(null);

function App() {
  const apiUrl = process.env.REACT_APP_API_URL;
  const axiosHelper = new APIClient();

  const [configurationData, setConfigurationData] = useState<ConfigurationData | null>(null)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [iconUrl, setIconUrl] = useState<string>('')

  const getCondigurationData = async () => {
    await axiosHelper.get(`${apiUrl}/configurations/get_configurations`)
      .then((response) => {
        setConfigurationData(response.data.data)
      })
      .catch((error) => {
        console.error('Ha ocurrido un error al recuperar las configuraciones')
      })
  }

  const getSystemLogo = async () => {
    if (configurationData) {
      try {
        const response = await axiosHelper.get(`${apiUrl}/google_drive/download_file/${configurationData.farmLogo}`, { responseType: 'blob' });
        const logoUrl = URL.createObjectURL(response.data);
        setLogoUrl(logoUrl);
      } catch (error) {
        console.error('Ha ocurrido un error al obtener el logo');
      }
    }
  }

  const getSystemIcon = async () => {
    if (configurationData) {
      try {
        const response = await axiosHelper.get(`${apiUrl}/google_drive/download_file/${configurationData.farmIcon}`, { responseType: 'blob' });
        const iconUrl = URL.createObjectURL(response.data);
        setIconUrl(iconUrl);
      } catch (error) {
        console.error('Ha ocurrido un error al obtener el logo');
      }
    }
  }

  useEffect(() => {
    getCondigurationData();
  }, [])

  useEffect(() => {
    getSystemLogo();
    getSystemIcon();
  }, [configurationData])

  return (
    <ConfigContext.Provider value={{ configurationData, setConfigurationData, logoUrl, iconUrl }}>
      <React.Fragment>
        <Route />
      </React.Fragment>
    </ConfigContext.Provider>

  );
}

export default App;
