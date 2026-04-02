import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button } from "./ui/button";
import { Trophy, LogOut, Settings, PenSquare, BookOpen, Users, Home } from "lucide-react";

export default function Navbar({ user, isAdmin }: { user: User; isAdmin: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const getLinkStyle = (path: string, baseClass: string, hoverClass: string, activeClass: string) => {
    const isActive = location.pathname === path;
    return `hidden md:flex items-center gap-1 px-3 py-2 rounded-md transition-all duration-300 ${isActive ? activeClass : baseClass} ${hoverClass} hover:shadow-md text-white`;
  };

  const getMobileLinkStyle = (path: string, baseClass: string, activeClass: string) => {
    const isActive = location.pathname === path;
    return `flex flex-col items-center text-xs p-2 rounded-md transition-colors ${isActive ? activeClass : baseClass} text-white`;
  };

  return (
    <nav className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl md:w-1/4">
            <Trophy className="h-6 w-6 text-white" />
            <span className="hidden lg:inline">El Prode de Beno</span>
          </Link>
          
          <div className="hidden md:flex items-center justify-center gap-4 flex-1">
            <Link to="/" className={getLinkStyle("/", "bg-slate-600", "hover:bg-slate-500", "bg-slate-400 ring-2 ring-white/50") + " w-36 justify-center text-center"}>
              <Home className="h-4 w-4 shrink-0" /> <span className="truncate">Inicio</span>
            </Link>
            <Link to="/instructions" className={getLinkStyle("/instructions", "bg-blue-600", "hover:bg-blue-500", "bg-blue-400 ring-2 ring-white/50") + " w-36 justify-center text-center"}>
              <BookOpen className="h-4 w-4 shrink-0" /> <span className="truncate">Reglas</span>
            </Link>
            <Link to="/dashboard" className={getLinkStyle("/dashboard", "bg-orange-600", "hover:bg-orange-500", "bg-orange-400 ring-2 ring-white/50") + " w-36 justify-center text-center"}>
              <Trophy className="h-4 w-4 shrink-0" /> <span className="truncate">Ranking</span>
            </Link>
            <Link to="/leagues" className={getLinkStyle("/leagues", "bg-purple-600", "hover:bg-purple-500", "bg-purple-400 ring-2 ring-white/50") + " w-36 justify-center text-center"}>
              <Users className="h-4 w-4 shrink-0" /> <span className="truncate">Torneos</span>
            </Link>
            <Link to="/predictions" className={getLinkStyle("/predictions", "bg-green-600", "hover:bg-green-500", "bg-green-400 ring-2 ring-white/50") + " w-36 justify-center text-center"}>
              <PenSquare className="h-4 w-4 shrink-0" /> <span className="truncate">Predicciones</span>
            </Link>
            {isAdmin && (
              <Link to="/admin" className={getLinkStyle("/admin", "bg-gray-600", "hover:bg-gray-500", "bg-gray-400 ring-2 ring-white/50") + " w-36 justify-center text-center"}>
                <Settings className="h-4 w-4 shrink-0" /> <span className="truncate">Admin</span>
              </Link>
            )}
          </div>
            
          <div className="flex items-center justify-end gap-3 md:w-1/4">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-blue-400" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
                  {user.displayName?.charAt(0) || "U"}
                </div>
              )}
              <span className="text-sm font-medium hidden sm:block">{user.displayName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-blue-800 hover:text-white px-2">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile nav */}
      <div className="md:hidden flex justify-around p-2 bg-blue-950 border-t border-blue-800">
        <Link to="/" className={getMobileLinkStyle("/", "bg-slate-700", "bg-slate-500 ring-1 ring-white/50")}>
          <Home className="h-5 w-5 mb-1" /> Inicio
        </Link>
        <Link to="/instructions" className={getMobileLinkStyle("/instructions", "bg-blue-700", "bg-blue-500 ring-1 ring-white/50")}>
          <BookOpen className="h-5 w-5 mb-1" /> Reglas
        </Link>
        <Link to="/dashboard" className={getMobileLinkStyle("/dashboard", "bg-orange-700", "bg-orange-500 ring-1 ring-white/50")}>
          <Trophy className="h-5 w-5 mb-1" /> Ranking
        </Link>
        <Link to="/leagues" className={getMobileLinkStyle("/leagues", "bg-purple-700", "bg-purple-500 ring-1 ring-white/50")}>
          <Users className="h-5 w-5 mb-1" /> Torneos
        </Link>
        <Link to="/predictions" className={getMobileLinkStyle("/predictions", "bg-green-700", "bg-green-500 ring-1 ring-white/50")}>
          <PenSquare className="h-5 w-5 mb-1" /> Predicciones
        </Link>
        {isAdmin && (
          <Link to="/admin" className={getMobileLinkStyle("/admin", "bg-gray-700", "bg-gray-500 ring-1 ring-white/50")}>
            <Settings className="h-5 w-5 mb-1" /> Admin
          </Link>
        )}
      </div>
    </nav>
  );
}
