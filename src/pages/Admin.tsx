import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, writeBatch, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { GROUPS, SPECIAL_QUESTIONS, KNOCKOUT_STAGES, ALL_TEAMS } from "../data";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Save, Calculator, AlertCircle, CheckCircle2, Trash2, Users, MessageSquareWarning, Paperclip, Unlock } from "lucide-react";
import { CountdownBanner } from "../components/CountdownBanner";

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: string;
  totalPoints: number;
}

interface Report {
  id: string;
  message: string;
  userEmail: string;
  userName: string;
  createdAt: string;
  attachments?: string[];
}

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{type: 'calc' | 'delete' | 'reset', uid?: string, name?: string} | null>(null);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // State for actual results
  const [actualGroups, setActualGroups] = useState<Record<string, string[]>>(GROUPS);
  const [actualSpecials, setActualSpecials] = useState<Record<string, string>>({});
  const [actualKnockouts, setActualKnockouts] = useState<Record<string, string[]>>({});
  
  // State for users
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // State for reports
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'results' | 'users' | 'reports' | 'analytics'>('results');

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalPredictions: 0,
    usersWithPredictions: 0,
    activeToday: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch results
        const docRef = doc(db, "results", "actual");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Sanitize groups to ensure they match current GROUPS
          const sanitizedGroups: Record<string, string[]> = {};
          const savedGroups = data.groups || {};
          
          for (const [groupLetter, currentTeams] of Object.entries(GROUPS)) {
            const savedTeams = savedGroups[groupLetter] || [];
            const validSavedTeams = (savedTeams as string[]).filter(t => currentTeams.includes(t));
            const missingTeams = currentTeams.filter(t => !validSavedTeams.includes(t));
            sanitizedGroups[groupLetter] = [...validSavedTeams, ...missingTeams];
          }
          
          setActualGroups(sanitizedGroups);
          setActualSpecials(data.specials || {});
          setActualKnockouts(data.knockouts || {});
        } else {
          setActualGroups(GROUPS);
        }

        // Fetch users
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = usersSnap.docs.map(d => ({ ...d.data(), uid: d.id } as any));
        setUsers(usersData);
        
        // Fetch predictions to calculate analytics
        const predictionsSnap = await getDocs(collection(db, "predictions"));
        
        // Calculate analytics
        const today = new Date().toISOString().split('T')[0];
        let activeTodayCount = 0;
        
        usersData.forEach(u => {
          if (u.lastLogin && u.lastLogin.startsWith(today)) {
            activeTodayCount++;
          }
        });

        setAnalytics({
          totalUsers: usersData.length,
          totalPredictions: predictionsSnap.size,
          usersWithPredictions: predictionsSnap.size, // Assuming 1 prediction doc per user
          activeToday: activeTodayCount
        });
        
        // Fetch reports
        const reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        const reportsSnap = await getDocs(reportsQuery);
        const reportsData = reportsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Report));
        setReports(reportsData);
        
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGroupChange = (groupLetter: string, index: number, value: string) => {
    setActualGroups(prev => {
      const newGroup = [...prev[groupLetter]];
      newGroup[index] = value;
      return { ...prev, [groupLetter]: newGroup };
    });
  };

  const handleSpecialChange = (id: string, value: string) => {
    setActualSpecials(prev => ({ ...prev, [id]: value }));
  };

  const saveResults = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const docRef = doc(db, "results", "actual");
      await setDoc(docRef, {
        groups: actualGroups,
        specials: actualSpecials,
        knockouts: actualKnockouts, // Keep this so it passes firestore rules
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setMessage({ type: 'success', text: 'Resultados oficiales guardados con éxito.' });
    } catch (error) {
      console.error("Error saving results:", error);
      setMessage({ type: 'error', text: 'Hubo un error al guardar los resultados.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const calculatePoints = async () => {
    setCalculating(true);
    setMessage(null);

    try {
      // 1. Fetch actual results
      const resultsRef = doc(db, "results", "actual");
      const resultsSnap = await getDoc(resultsRef);
      if (!resultsSnap.exists()) {
        throw new Error("No hay resultados oficiales guardados. Primero debes hacer clic en 'Guardar Resultados'.");
      }
      const actualData = resultsSnap.data();
      
      // Sanitize actualG
      const sanitizedActualG: Record<string, string[]> = {};
      const savedActualG = actualData.groups || {};
      for (const [groupLetter, currentTeams] of Object.entries(GROUPS)) {
        const savedTeams = savedActualG[groupLetter] || [];
        const validSavedTeams = (savedTeams as string[]).filter(t => currentTeams.includes(t));
        const missingTeams = currentTeams.filter(t => !validSavedTeams.includes(t));
        sanitizedActualG[groupLetter] = [...validSavedTeams, ...missingTeams];
      }
      
      const actualG = sanitizedActualG;
      const actualS = actualData.specials || {};
      const actualK = actualData.knockouts || {};

      // 2. Fetch all predictions
      const predictionsSnap = await getDocs(collection(db, "predictions"));
      const predictions = predictionsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

      // Fetch all users to ensure we only update existing ones
      const usersSnapCheck = await getDocs(collection(db, "users"));
      const existingUserIds = new Set(usersSnapCheck.docs.map(d => d.id));

      // 3. Prepare batch update for users
      const batch = writeBatch(db);
      
      for (const pred of predictions) {
        if (!existingUserIds.has(pred.id)) continue; // Skip if user doc is missing
        
        let totalPoints = 0;
        const pGroups = pred.groups || {};
        
        // Sanitize pGroups
        const sanitizedPGroups: Record<string, string[]> = {};
        for (const [groupLetter, currentTeams] of Object.entries(GROUPS)) {
          const savedTeams = pGroups[groupLetter] || [];
          const validSavedTeams = (savedTeams as string[]).filter(t => currentTeams.includes(t));
          const missingTeams = currentTeams.filter(t => !validSavedTeams.includes(t));
          sanitizedPGroups[groupLetter] = [...validSavedTeams, ...missingTeams];
        }

        const pSpecials = pred.specials || {};

        // Calculate Group Points
        // +1 Punto por cada acierto en la posición exacta
        // +2 Puntos por cada grupo perfecto (All 4 in correct order)
        for (const [groupLetter, actualTeams] of Object.entries(actualG)) {
          const predictedTeams = sanitizedPGroups[groupLetter];
          if (!predictedTeams || !Array.isArray(actualTeams)) continue;

          // Check exact matches
          let exactMatches = 0;
          for (let i = 0; i < 4; i++) {
            if (actualTeams[i] && predictedTeams[i] === actualTeams[i]) {
              exactMatches++;
              totalPoints += 1;
            }
          }

          // Check perfect group
          if (exactMatches === 4) {
            totalPoints += 2;
          }
        }

        // Calculate Special Points (+10 each)
        for (const [qId, actualAnswer] of Object.entries(actualS)) {
          const predictedAnswer = pSpecials[qId];
          if (predictedAnswer && actualAnswer && typeof actualAnswer === 'string' && typeof predictedAnswer === 'string') {
            if (predictedAnswer.trim().toLowerCase() === actualAnswer.trim().toLowerCase()) {
              totalPoints += 10;
            }
          }
        }

        // Calculate Knockout Points (Disabled for now)
        /*
        const pKnockouts = pred.knockouts || {};
        for (const stage of KNOCKOUT_STAGES) {
          const actualTeams = actualK[stage.id] || [];
          const predictedTeams = pKnockouts[stage.id] || [];
          
          const uniquePredicted = Array.from(new Set(predictedTeams.filter(Boolean)));
          for (const pTeam of uniquePredicted) {
            if (actualTeams.includes(pTeam)) {
              totalPoints += stage.points;
            }
          }
        }
        */

        // Update user document
        const userRef = doc(db, "users", pred.id); // Use pred.id which is guaranteed to be the UID
        batch.set(userRef, { totalPoints }, { merge: true });
      }

      await batch.commit();

      // Re-fetch users to update the UI with new points
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile));
      setUsers(usersData);

      setMessage({ type: 'success', text: 'Puntos calculados y actualizados para todos los usuarios.' });
      window.scrollTo(0, 0);

    } catch (error: any) {
      console.error("Error calculating points:", error);
      setMessage({ type: 'error', text: error.message || 'Hubo un error al calcular los puntos.' });
      window.scrollTo(0, 0);
    } finally {
      setCalculating(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const resetPoints = async () => {
    setCalculating(true);
    setMessage(null);

    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const batch = writeBatch(db);
      
      usersSnap.docs.forEach(d => {
        batch.set(doc(db, "users", d.id), { totalPoints: 0 }, { merge: true });
      });

      await batch.commit();

      const updatedUsersSnap = await getDocs(collection(db, "users"));
      const usersData = updatedUsersSnap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile));
      setUsers(usersData);

      setMessage({ type: 'success', text: 'Todos los puntos han sido reseteados a 0.' });
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error("Error resetting points:", error);
      setMessage({ type: 'error', text: 'Hubo un error al resetear los puntos.' });
      window.scrollTo(0, 0);
    } finally {
      setCalculating(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const deleteUser = async (uid: string, name: string) => {
    try {
      // Delete user profile
      await deleteDoc(doc(db, "users", uid));
      // Delete user predictions
      await deleteDoc(doc(db, "predictions", uid));
      
      // Update local state
      setUsers(users.filter(u => u.uid !== uid));
      setMessage({ type: 'success', text: `Usuario ${name} eliminado con éxito.` });
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage({ type: 'error', text: 'Error al eliminar usuario. Verifica los permisos.' });
    } finally {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const deleteReport = async (id: string) => {
    try {
      await deleteDoc(doc(db, "reports", id));
      setReports(reports.filter(r => r.id !== id));
      setMessage({ type: 'success', text: `Reporte eliminado con éxito.` });
    } catch (error) {
      console.error("Error deleting report:", error);
      setMessage({ type: 'error', text: 'Error al eliminar reporte.' });
    } finally {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const unfixPredictions = async (uid: string, name: string) => {
    try {
      const predRef = doc(db, "predictions", uid);
      const predSnap = await getDoc(predRef);
      if (predSnap.exists()) {
        await setDoc(predRef, { isLocked: false }, { merge: true });
        setMessage({ type: 'success', text: `Predicciones de ${name} desfijadas con éxito.` });
      } else {
        setMessage({ type: 'error', text: `El usuario ${name} aún no tiene predicciones guardadas.` });
      }
    } catch (error) {
      console.error("Error unfixing predictions:", error);
      setMessage({ type: 'error', text: 'Error al desfijar predicciones.' });
    } finally {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Cargando panel de administración...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <CountdownBanner />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-500 mt-1">Gestioná resultados, usuarios y reportes.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button 
            variant={activeTab === 'results' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('results')}
            className={activeTab === 'results' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            Resultados
          </Button>
          <Button 
            variant={activeTab === 'users' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('users')}
            className={activeTab === 'users' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            Usuarios
          </Button>
          <Button 
            variant={activeTab === 'reports' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('reports')}
            className={activeTab === 'reports' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            Reportes
          </Button>
          <Button 
            variant={activeTab === 'analytics' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('analytics')}
            className={activeTab === 'analytics' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            Estadísticas
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6 pt-4 pb-12">
          <h2 className="text-2xl font-bold text-indigo-700 border-b border-indigo-200 pb-2 flex items-center gap-2">
            <Calculator className="w-6 h-6" /> Estadísticas del Sitio
          </h2>
          <p className="text-sm text-gray-600 mb-4">Resumen rápido de la actividad en El Prode de Beno.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Usuarios Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{analytics.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Usuarios Activos Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{analytics.activeToday}</div>
                <p className="text-xs text-gray-500 mt-1">Iniciaron sesión hoy</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Predicciones Guardadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{analytics.totalPredictions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Tasa de Participación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {analytics.totalUsers > 0 ? Math.round((analytics.usersWithPredictions / analytics.totalUsers) * 100) : 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Usuarios con predicciones</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">Analíticas Avanzadas (Vercel)</h3>
            <p className="text-sm text-blue-800 mb-4">
              Para ver datos de tráfico detallados (visitas por página, tiempo en el sitio, países de origen, etc.), ingresá a tu panel de Vercel.
            </p>
            <a 
              href="https://vercel.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
            >
              Abrir Vercel Analytics
            </a>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <>
          <div className="flex gap-3 w-full flex-wrap mb-6">
            <Button 
              variant="outline" 
              onClick={saveResults}
              disabled={saving}
              className="flex-1 md:flex-none flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Guardar Resultados
            </Button>
            <Button 
              onClick={() => setConfirmAction({ type: 'calc' })}
              disabled={calculating}
              className="flex-1 md:flex-none flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Calculator className="w-4 h-4" /> Calcular Puntos
            </Button>
            <Button 
              variant="destructive"
              onClick={() => setConfirmAction({ type: 'reset' })}
              disabled={calculating}
              className="flex-1 md:flex-none flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" /> Resetear Puntos
            </Button>
          </div>

          <div className="space-y-6">
        <h2 className="text-2xl font-bold text-blue-900 border-b pb-2">Resultados Fase de Grupos</h2>
        <p className="text-sm text-gray-600 mb-4">Seleccioná el orden final real de cada grupo.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(actualGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupLetter, teams]) => (
            <Card key={groupLetter} className="overflow-hidden border-t-4 border-t-indigo-600">
              <CardHeader className="bg-gray-50 py-3 px-4 border-b">
                <CardTitle className="text-lg">Grupo {groupLetter}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-green-100 text-green-700' : 
                      index === 1 ? 'bg-green-50 text-green-600' : 
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <select
                      className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={teams[index] || ""}
                      onChange={(e) => handleGroupChange(groupLetter, index, e.target.value)}
                    >
                      <option value="">Seleccionar equipo...</option>
                      {GROUPS[groupLetter as keyof typeof GROUPS].map(team => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-8 pb-12">
        <h2 className="text-2xl font-bold text-blue-900 border-b pb-2">Resultados Preguntas Especiales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SPECIAL_QUESTIONS.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {q.label}
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Respuesta oficial..."
                  value={actualSpecials[q.id] || ""}
                  onChange={(e) => handleSpecialChange(q.id, e.target.value)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-8 pb-12 border-t border-gray-200 opacity-50">
        <h2 className="text-2xl font-bold text-blue-900 border-b pb-2">Resultados Fase Eliminatoria</h2>
        <div className="bg-gray-100 p-8 rounded-lg text-center border-2 border-dashed border-gray-300">
          <p className="text-gray-600 font-medium">Cuadro por definir</p>
          <p className="text-sm text-gray-500 mt-2">Esta sección se habilitará una vez finalizada la fase de grupos.</p>
        </div>
      </div>
      </>
      )}

      {activeTab === 'users' && (
      <div className="space-y-6 pt-4 pb-12">
        <h2 className="text-2xl font-bold text-red-700 border-b border-red-200 pb-2 flex items-center gap-2">
          <Users className="w-6 h-6" /> Gestión de Usuarios
        </h2>
        <p className="text-sm text-gray-600 mb-4">Administrá los participantes del Prode. Podés eliminar cuentas si alguien se arrepiente de jugar.</p>
        
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Usuario</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Rol</th>
                    <th className="px-6 py-3">Puntos</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.uid} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {u.displayName?.charAt(0) || "U"}
                          </div>
                        )}
                        {u.displayName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{u.totalPoints}</td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        {Date.now() < new Date('2026-06-08T00:00:00').getTime() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unfixPredictions(u.uid, u.displayName)}
                            className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            title="Permitir al usuario volver a editar sus predicciones"
                          >
                            <Unlock className="w-4 h-4" /> Desfijar
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => setConfirmAction({ type: 'delete', uid: u.uid, name: u.displayName })}
                          disabled={u.role === 'admin'} // Prevent deleting other admins or self easily
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {activeTab === 'reports' && (
      <div className="space-y-6 pt-4 pb-12">
        <h2 className="text-2xl font-bold text-orange-700 border-b border-orange-200 pb-2 flex items-center gap-2">
          <MessageSquareWarning className="w-6 h-6" /> Reportes y Sugerencias
        </h2>
        <p className="text-sm text-gray-600 mb-4">Revisá los reportes enviados por los usuarios. Podés ver los archivos adjuntos haciendo clic en los enlaces.</p>
        
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
              <p className="text-gray-500">No hay reportes nuevos.</p>
            </div>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="overflow-hidden border-l-4 border-l-orange-500">
                <CardHeader className="bg-gray-50 py-3 px-4 border-b flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-bold text-gray-900">{report.userName || "Usuario Anónimo"}</CardTitle>
                    <p className="text-xs text-gray-500">{report.userEmail || "Sin email"} • {new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteReport(report.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="text-gray-700 whitespace-pre-wrap text-sm">
                    {report.message}
                  </div>
                  
                  {report.attachments && report.attachments.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> Archivos adjuntos ({report.attachments.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {report.attachments.map((url, i) => (
                          <a 
                            key={i} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                          >
                            Ver archivo {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {confirmAction.type === 'calc' ? '¿Recalcular puntos?' : 
               confirmAction.type === 'reset' ? '¿Resetear todos los puntos a 0?' : 
               '¿Eliminar usuario?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmAction.type === 'calc' 
                ? 'Esto va a recalcular los puntos de todos los usuarios basándose en los resultados oficiales guardados. Puede tomar unos segundos.' 
                : confirmAction.type === 'reset'
                ? 'Esto va a poner los puntos de TODOS los usuarios en 0. Usá esta opción solo si estás probando o antes de que comience el torneo real. No se puede deshacer.'
                : `¿Estás seguro de eliminar al usuario ${confirmAction.name}? Esta acción va a borrar su perfil y todas sus predicciones. No se puede deshacer.`}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
              <Button 
                variant={confirmAction.type === 'delete' || confirmAction.type === 'reset' ? 'destructive' : 'default'}
                className={confirmAction.type === 'calc' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
                onClick={() => { 
                  if (confirmAction.type === 'calc') {
                    calculatePoints();
                  } else if (confirmAction.type === 'reset') {
                    resetPoints();
                  } else if (confirmAction.type === 'delete' && confirmAction.uid && confirmAction.name) {
                    deleteUser(confirmAction.uid, confirmAction.name);
                  }
                  setConfirmAction(null); 
                }}
              >
                {confirmAction.type === 'calc' ? 'Sí, recalcular' : 
                 confirmAction.type === 'reset' ? 'Sí, resetear a 0' : 
                 'Sí, eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
