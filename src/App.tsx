import { useEffect } from 'react';
import { AjustesView } from './components/ajustes/AjustesView';
import { InfoClienteView } from './components/clientes/InfoClienteView';
import { DashboardView } from './components/dashboard/DashboardView';
import { Header } from './components/layout/Header';
import { ProfileSelector } from './components/layout/ProfileSelector';
import { ProyectoDetail } from './components/proyectos/ProyectoDetail';
import { ProyectosList } from './components/proyectos/ProyectosList';
import { ReportesView } from './components/reportes/ReportesView';
import { MisTareasView } from './components/tareas/MisTareasView';
import { useAppStore } from './store/useAppStore';

function App() {
  const { vista, recalcularAlertas } = useAppStore();

  useEffect(() => {
    recalcularAlertas();
  }, [recalcularAlertas]);

  return (
    <div className="min-h-screen">
      <ProfileSelector />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {vista === 'dashboard' ? <DashboardView /> : null}
        {vista === 'proyectos' ? <ProyectosList /> : null}
        {vista === 'proyecto' || vista === 'fase' ? <ProyectoDetail /> : null}
        {vista === 'mis_tareas' ? <MisTareasView /> : null}
        {vista === 'info_cliente' ? <InfoClienteView /> : null}
        {vista === 'reportes' ? <ReportesView /> : null}
        {vista === 'ajustes' ? <AjustesView /> : null}
      </main>
    </div>
  );
}

export default App;
