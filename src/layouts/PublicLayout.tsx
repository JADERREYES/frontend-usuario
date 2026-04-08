import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="relative min-h-svh overflow-hidden px-4 pb-10 pt-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-5rem] top-[-5rem] h-56 w-56 rounded-full bg-[rgba(150,111,255,0.42)] blur-[90px]" />
        <div className="absolute right-[-4rem] top-16 h-52 w-52 rounded-full bg-[rgba(255,171,123,0.42)] blur-[90px]" />
        <div className="absolute bottom-8 left-1/3 h-56 w-56 rounded-full bg-[rgba(109,210,255,0.32)] blur-[110px]" />
        <div className="absolute inset-x-8 top-24 h-44 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.3),rgba(255,255,255,0.04),rgba(255,255,255,0.24))] blur-3xl" />
      </div>
      <div className="app-container relative">
        <Outlet />
      </div>
    </div>
  );
}
