import React, { useEffect, useMemo, useState } from 'react';

//import Scss
import './assets/scss/themes.scss';

//import Route
import Route from './Routes';
import { APIClient, getLoggedinUser } from 'helpers/api_helper';

// Define el contexto con una estructura para exponer tanto el estado como el setter
export const ConfigContext = React.createContext<{
  apiUrl: string
  axiosHelper: APIClient
  userLogged: any
  setUserLogged: any
} | null>(null);

function App() {

  const [userLogged, setUserLogged] = useState()
  const apiUrl = process.env.REACT_APP_API_URL || '';
  const axiosHelper = useMemo(() => new APIClient(), []);

  useEffect(() => {
    setUserLogged(getLoggedinUser())
  }, [])


  return (
    <ConfigContext.Provider value={{ apiUrl, axiosHelper, userLogged, setUserLogged }}>
      <React.Fragment>
        <Route />
      </React.Fragment>
    </ConfigContext.Provider>

  );
}

export default App;
