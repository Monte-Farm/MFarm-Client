import React, { useEffect, useMemo, useState } from 'react';

//import Scss
import './assets/scss/themes.scss';

//import Route
import Route from './Routes';
import { APIClient, getLoggedinUser } from 'helpers/api_helper';
import PeriodClosedModal from 'Components/Common/Shared/PeriodClosedModal';
import { ImpersonationData, getEffectiveUser, getImpersonation, getSuperadminFarmId, setSuperadminFarmIdStorage } from 'helpers/impersonation_helper';

// Define el contexto con una estructura para exponer tanto el estado como el setter
export const ConfigContext = React.createContext<{
  apiUrl: string
  axiosHelper: APIClient
  userLogged: any
  setUserLogged: any
  impersonation: ImpersonationData | null
  setImpersonation: (value: ImpersonationData | null) => void
  superadminFarmId: string
  setSuperadminFarmId: (id: string) => void
} | null>(null);

function App() {

  const [userLogged, setUserLogged] = useState<any>()
  const [impersonation, setImpersonationState] = useState<ImpersonationData | null>(getImpersonation)
  const [superadminFarmId, setSuperadminFarmIdState] = useState<string>(getSuperadminFarmId)
  const apiUrl = process.env.REACT_APP_API_URL || '';
  const axiosHelper = useMemo(() => new APIClient(), []);

  const setImpersonation = (value: ImpersonationData | null) => {
    setImpersonationState(value);
    setUserLogged(getEffectiveUser());
  };

  const setSuperadminFarmId = (id: string) => {
    setSuperadminFarmIdStorage(id);
    setSuperadminFarmIdState(id);
    setUserLogged(getEffectiveUser());
  };

  useEffect(() => {
    setUserLogged(getEffectiveUser());

    const handleImpersonationChange = () => {
      setImpersonationState(getImpersonation());
      setSuperadminFarmIdState(getSuperadminFarmId());
      setUserLogged(getEffectiveUser());
    };
    window.addEventListener('impersonation-change', handleImpersonationChange);
    return () => window.removeEventListener('impersonation-change', handleImpersonationChange);
  }, [])


  return (
    <ConfigContext.Provider value={{ apiUrl, axiosHelper, userLogged, setUserLogged, impersonation, setImpersonation, superadminFarmId, setSuperadminFarmId: setSuperadminFarmId }}>
      <React.Fragment>
        <Route />
        <PeriodClosedModal />
      </React.Fragment>
    </ConfigContext.Provider>

  );
}

export default App;
