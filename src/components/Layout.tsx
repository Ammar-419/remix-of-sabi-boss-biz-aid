import { Outlet } from "react-router-dom";
import { Navigation } from "./Navigation";

export const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-dashboard">
      <Navigation />
      <main className="pb-20 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
};
