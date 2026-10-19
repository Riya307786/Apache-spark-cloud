import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Overview } from './pages/Overview';
import { DatasetExplorer } from './pages/DatasetExplorer';
import { DataProcessing } from './pages/DataProcessing';
import { ModelLaboratory } from './pages/ModelLaboratory';
import { RiskPrediction } from './pages/RiskPrediction';
import { ExplainableAI } from './pages/ExplainableAI';
import { RiskStratification } from './pages/RiskStratification';
import { ScalabilityLab } from './pages/ScalabilityLab';
import { SystemDocker } from './pages/SystemDocker';
import { ResearchReports } from './pages/ResearchReports';

export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background-secondary/30 flex flex-col font-sans text-text-primary antialiased">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl w-full">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/datasets" element={<DatasetExplorer />} />
              <Route path="/processing" element={<DataProcessing />} />
              <Route path="/preprocessing" element={<Navigate to="/processing" replace />} />
              <Route path="/models" element={<ModelLaboratory />} />
              <Route path="/prediction" element={<RiskPrediction />} />
              <Route path="/explainability" element={<ExplainableAI />} />
              <Route path="/stratification" element={<RiskStratification />} />
              <Route path="/scalability" element={<ScalabilityLab />} />
              <Route path="/system" element={<SystemDocker />} />
              <Route path="/reports" element={<ResearchReports />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
