import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminAuthProvider } from "../context/AdminAuthContext";

let adminSessionInFlight = null;
let adminSessionLastResult = null;
let adminSessionLastAt = 0;
const ADMIN_SESSION_DEDUPE_WINDOW_MS = 2000;

const verifyAdminSession = async () => {
  const now = Date.now();
  if (
    adminSessionLastResult &&
    now - adminSessionLastAt < ADMIN_SESSION_DEDUPE_WINDOW_MS
  ) {
    return adminSessionLastResult;
  }

  if (!adminSessionInFlight) {
    adminSessionInFlight = (async () => {
      const res = await fetch("/api/admin/verify-session", {
        credentials: "include",
        method: "GET",
      });

      let data = null;
      if (res.status !== 404 && res.status !== 401 && res.status !== 403) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      }

      const payload = { status: res.status, ok: res.ok, data };
      adminSessionLastResult = payload;
      adminSessionLastAt = Date.now();
      return payload;
    })().finally(() => {
      adminSessionInFlight = null;
    });
  }

  return adminSessionInFlight;
};

const AdminProtectedRoute = ({
  children,
  allowedRoles = ["platform_manager", "admin", "superadmin"],
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const result = await verifyAdminSession();
        if (result.status === 404) {
          navigate("/not-found");
          return;
        }
        if (result.status === 401 || result.status === 403) {
          navigate("/unauthorized");
          return;
        }
        const data = result.data;

        if (
          result.ok &&
          data?.authenticated &&
          (data.role === "platform_manager" ||
            data.role === "superadmin" ||
            data.role === "admin")
        ) {
          if (allowedRoles.includes(data.role)) {
            setAuthenticated(true);
            setRole(data.role);
          } else {
            navigate("/unauthorized");
          }
        } else {
          navigate("/admin-login");
        }
      } catch (error) {
        console.error("Admin auth check failed:", error);
        navigate("/admin-login");
      } finally {
        setLoading(false);
      }
    };
    checkAdminAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  return authenticated ? (
    <AdminAuthProvider role={role}>{children}</AdminAuthProvider>
  ) : null;
};

export default AdminProtectedRoute;
