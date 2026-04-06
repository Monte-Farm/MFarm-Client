# CLAUDE.md — MFarm-Client

## Build & Run
```bash
npm start        # Dev server (CRA)
npm run build    # Production build
npm test         # Jest + React Testing Library
```

## Stack
- React 18 + TypeScript (strict mode, target es5, baseUrl: ./src)
- CRA (react-scripts 5), no custom webpack
- State: Redux Toolkit (slices in src/slices/, pattern: reducer.ts + thunk.ts per feature)
- Forms: Formik + Yup
- UI: Reactstrap + Bootstrap 5.3, SCSS (sass 1.77)
- Tables: TanStack React Table v8
- Charts: Nivo + ApexCharts
- Router: React Router v6
- HTTP: Axios (helper in src/helpers/api_helper.ts, base URL from REACT_APP_API_URL)
- i18n: i18next (8 languages, translations in src/locales/)
- Auth: sessionStorage token, AuthProtected route guard

## Project Structure
```
src/
  pages/            # Page-level components by domain (Pigs, Groups, Feeding, etc.)
  Components/Common/
    Details/         # Detail views
    Forms/           # Formik forms (modals & standalone)
    Tables/          # Table components (CustomTable, Pagination)
    Shared/          # Reusable cards (FeedingPackagesCard, etc.)
    Filters/         # Filter UI
    Graphics/        # Chart wrappers
    Views/           # View layouts
    Lists/           # List components
  slices/            # Redux: domain/reducer.ts + domain/thunk.ts
  helpers/           # api_helper.ts, url_helper.ts, auth helpers
  hooks/             # Custom hooks (useGroupsByStage, usePigFilters)
  utils/             # Utilities (chartTransformers)
  common/            # Shared interfaces (data_interfaces.ts)
  config.ts          # API & service config (reads REACT_APP_* env vars)
  Layouts/           # App layout (Header, Sidebar, Footer)
  Routes/            # allRoutes.tsx, AuthProtected.tsx
```

## Conventions
- **Components**: PascalCase files and folders (e.g., BirthForm.tsx, GroupDetails.tsx)
- **Forms**: `{Entity}Form.tsx`, use useFormik hook + Yup.object() schema
- **API URLs**: constants in src/helpers/url_helper.ts
- **Interfaces**: defined in src/common/data_interfaces.ts, exported with `export interface`
- **Thunks**: plain async functions `(params) => async (dispatch) => {...}`, not createAsyncThunk
- **Auth**: Bearer token from sessionStorage("authUser"), set via setAuthorization()
- **Imports**: absolute from src/ (baseUrl configured in tsconfig)
- **Modals**: SuccessModal / ErrorModal for form feedback
- **Language**: Spanish-speaking team; UI may mix Spanish/English; code identifiers in English
