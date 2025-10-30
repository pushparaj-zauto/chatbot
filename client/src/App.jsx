import React from "react";
import ChatWindow from "./components/pages/ChatWindow";
import ChunksViewer from "./components/pages/ChunksViewer";
import PromptEditor from "./components/pages/PromptEditor";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./components/auth/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import PublicRoute from "./components/auth/PublicRoute";
import NotFound from "./components/pages/NotFound";
import ForgotPassword from "./components/auth/ForgotPassword";
import Signup from "./components/auth/Signup";
import ResetPassword from "./components/auth/ResetPassword";
import VerifyEmail from "./components/auth/VerifyEmail";
import Events from "./components/pages/Events";
import Persons from "./components/pages/Persons";
import Companies from "./components/pages/Companies";
import Configurables from "./components/pages/Configurables";
import AdminRoute from "./components/auth/AdminRoute";
import Teams from "./components/pages/Teams";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* public route */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>

        {/* protected route */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/chat" element={<ChatWindow />} />
          <Route path="/prompt" element={<PromptEditor />} />
          <Route path="/chunks" element={<ChunksViewer />} />
          <Route path="/events" element={<Events />} />
          <Route path="/persons" element={<Persons />} />
          <Route path="/companies" element={<Companies />} />

          {/* Admin-only routes - wrapped properly */}
          <Route element={<AdminRoute />}>
            <Route path="/configurables" element={<Configurables />} />
            <Route path="/teams" element={<Teams />} />
          </Route>

          <Route path="/" element={<Navigate to="/chat" replace />} />
        </Route>

        {/* 404 route - must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
