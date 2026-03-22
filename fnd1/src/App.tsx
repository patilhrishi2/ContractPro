/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BlockchainProvider } from './context/BlockchainContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { CreateProject } from './pages/CreateProject';
import { AuditTrail } from './pages/AuditTrail';
import { ProjectDetails } from './pages/ProjectDetails';
import { Contractors } from './pages/Contractors';
import { Inspectors } from './pages/Inspectors';

export default function App() {
  return (
    <BlockchainProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateProject />} />
            <Route path="/audit" element={<AuditTrail />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path="/contractors" element={<Contractors />} />
            <Route path="/inspectors" element={<Inspectors />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </BlockchainProvider>
  );
}
