import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Leagues from "./pages/Leagues";
import Predictions from "./pages/Predictions";
import Admin from "./pages/Admin";
import Instructions from "./pages/Instructions";
import Navbar from "./components/Navbar";
import { Fixture } from "./components/Fixture";
import ScrollToTop from "./components/ScrollToTop";

// Helper components for dynamic routing based on location
const RootRoute = ({ user }: { user: User | null }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to={"/login" + location.search + location.hash} />;
  }
  if (location.search.includes('league=') || location.hash.includes('league=')) {
    return <Navigate to={"/leagues" + location.search + location.hash} />;
  }
  return <Welcome />;
};

const LoginRoute = ({ user }: { user: User | null }) => {
  const location = useLocation();
  if (user) {
    const target = (location.search.includes('league=') || location.hash.includes('league=')) ? "/leagues" : "/";
    return <Navigate to={target + location.search + location.hash} />;
  }
  return <Login />;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isAdminEmail = currentUser.email?.toLowerCase() === "bdallago01@gmail.com";
        
        // Check if user exists in db, if not create
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const role = isAdminEmail ? "admin" : "player";
          await setDoc(userRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || "Usuario",
            email: currentUser.email,
            photoURL: currentUser.photoURL || "",
            role: role,
            totalPoints: 0
          });
          setIsAdmin(isAdminEmail);
        } else {
          const currentRole = userSnap.data().role;
          if (isAdminEmail && currentRole !== "admin") {
            // Force upgrade to admin if the email matches but role is player
            await setDoc(userRef, { role: "admin" }, { merge: true });
          }
          setIsAdmin(isAdminEmail || currentRole === "admin");
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-gray-50">
        {user && <Navbar user={user} isAdmin={isAdmin} />}
        
        <div className="flex-grow container mx-auto px-4 pt-6 pb-12">
          <Routes>
            <Route path="/login" element={<LoginRoute user={user} />} />
            <Route path="/" element={<RootRoute user={user} />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/leagues" element={user ? <Leagues user={user} /> : <Navigate to="/login" />} />
            <Route path="/predictions" element={user ? <Predictions user={user} /> : <Navigate to="/login" />} />
            <Route path="/instructions" element={user ? <Instructions /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user && isAdmin ? <Admin /> : <Navigate to="/" />} />
          </Routes>
          
          {/* Fixture at the bottom of all pages when logged in */}
          {user && (
            <div className="mt-12">
              <Fixture />
            </div>
          )}
        </div>

        {/* Footer */}
        {user && (
          <footer className="w-full bg-gradient-to-r from-blue-900 to-indigo-900 text-white mt-auto">
            <a 
              href="https://x.com/imbenodl" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block w-full py-8 text-center hover:bg-blue-800/50 transition-all duration-300 md:hover:shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.3)]"
            >
              <div className="space-y-2">
                <p className="text-lg font-semibold tracking-wide">
                  El Prode de Beno
                </p>
                <p className="text-blue-200 text-sm">
                  desarrollado por <span className="text-white font-bold">@imbenodl</span>
                </p>
              </div>
            </a>
          </footer>
        )}
      </div>
    </BrowserRouter>
  );
}
