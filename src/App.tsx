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
  apiUrl: string
  axiosHelper: APIClient
  userLogged: any
  setUserLogged: any
} | null>(null);

function App() {

  const [configurationData, setConfigurationData] = useState<ConfigurationData | null>(null)
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

  useEffect(() => {
    getConfigurationData();
    setUserLogged(getLoggedinUser())
  }, [])


  return (
    <ConfigContext.Provider value={{ configurationData, setConfigurationData, apiUrl, axiosHelper, userLogged, setUserLogged }}>
      <React.Fragment>
        <Route />
      </React.Fragment>
    </ConfigContext.Provider>

  );
}

export default App;
