import { Canvas3D } from './components/Canvas3D';
import './App.css';

if (!__LIVELY_BUILD__) {
  import('./styles/Tweakpane-theme.css');
}

function App() {
  return (
    <main style={{ width: '100%', height: '100%' }}>
      <Canvas3D />
    </main>
  );
}

export default App;
