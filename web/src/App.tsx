import { Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/PublicLayout";
import ChooseEvent from "./pages/ChooseEvent";
import EventGallery from "./pages/EventGallery";
import Gallery from "./pages/Gallery";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Upload from "./pages/Upload";
import { AdminLayout } from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import EventDetail from "./pages/admin/EventDetail";
import Events from "./pages/admin/Events";
import Login from "./pages/admin/Login";
import SettingsPage from "./pages/admin/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="enviar" element={<ChooseEvent />} />
        <Route path="e/:token" element={<Upload />} />
        <Route path="galeria" element={<Gallery />} />
        <Route path="galeria/:token" element={<EventGallery />} />
        <Route path="privacidade" element={<Privacy />} />
      </Route>
      <Route path="admin/login" element={<Login />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="eventos" element={<Events />} />
        <Route path="eventos/:id" element={<EventDetail />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
