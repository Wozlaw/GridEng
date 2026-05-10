import { CadShell } from './app/layout';
import { AppProviders } from './app/providers';
import './App.css';

function App() {
  return (
    <AppProviders>
      <div className="app-root">
        <CadShell />
      </div>
    </AppProviders>
  );
}

export default App;
