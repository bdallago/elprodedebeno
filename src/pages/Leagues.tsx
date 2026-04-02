import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { User } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Trophy, User as UserIcon, Plus, LogIn, LogOut, Share2, Users, Trash2, Check, Globe, Lock } from "lucide-react";
import { Button } from "../components/ui/button";
import { CountdownBanner } from "../components/CountdownBanner";
import { UserPredictionsModal } from "../components/UserPredictionsModal";

interface Player {
  uid: string;
  displayName: string;
  photoURL: string;
  totalPoints: number;
  role?: string;
}

interface League {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  createdAt: string;
  isPublic: boolean;
}

export default function Leagues({ user }: { user: User }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isConfirmingCreate, setIsConfirmingCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [leagueError, setLeagueError] = useState("");
  const [leagueToDelete, setLeagueToDelete] = useState<League | null>(null);
  const [leagueToLeave, setLeagueToLeave] = useState<League | null>(null);
  const [copiedLeagueId, setCopiedLeagueId] = useState<string | null>(null);
  const [pendingInvitation, setPendingInvitation] = useState<{league: League, inviter: string} | null>(null);
  const [selectedUser, setSelectedUser] = useState<{uid: string, name: string} | null>(null);
  const location = useLocation();

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("totalPoints", "desc"));
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      const playersData = snapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id } as Player));
      setPlayers(playersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leaderboard", error);
      setLoading(false);
    });

    const unsubscribeLeagues = onSnapshot(collection(db, "leagues"), (snapshot) => {
      const leaguesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as League));
      setLeagues(leaguesData);
      
      // Handle auto-join via URL or Hash
      let leagueId = new URLSearchParams(window.location.search).get('league');
      let inviter = new URLSearchParams(window.location.search).get('inviter') || 'Un jugador';
      
      if (!leagueId && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        leagueId = hashParams.get('league');
        if (hashParams.has('inviter')) {
          inviter = hashParams.get('inviter') || 'Un jugador';
        }
      }

      if (leagueId) {
        const league = leaguesData.find(l => l.id === leagueId);
        if (league) {
          if (!league.members.includes(user.uid)) {
            setPendingInvitation({ league, inviter });
          } else {
            window.history.replaceState({}, document.title, window.location.pathname);
            setSelectedLeague(league);
          }
        }
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLeagues();
    };
  }, [user.uid, location.hash, location.search]);

  const handleCreateClick = () => {
    if (!newLeagueName.trim()) return;

    const normalizedName = newLeagueName.trim().toLowerCase();
    const nameExists = leagues.some(l => l.name.toLowerCase() === normalizedName);
    
    if (nameExists) {
      setLeagueError("Ya existe un torneo con este nombre. Por favor, elige otro.");
      return;
    }

    setLeagueError("");
    setIsConfirmingCreate(true);
  };

  const confirmCreateLeague = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const newLeague = {
        name: newLeagueName.trim(),
        createdBy: user.uid,
        members: [user.uid],
        createdAt: new Date().toISOString(),
        isPublic: isPublic
      };
      await addDoc(collection(db, "leagues"), newLeague);
      setShowCreateModal(false);
      setIsConfirmingCreate(false);
      setNewLeagueName("");
      setIsPublic(false);
      setLeagueError("");
    } catch (err) {
      console.error("Error creating league", err);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteLeague = async (leagueId: string) => {
    try {
      await deleteDoc(doc(db, "leagues", leagueId));
      if (selectedLeague?.id === leagueId) setSelectedLeague(null);
      setLeagueToDelete(null);
    } catch (err) {
      console.error("Error deleting league", err);
    }
  };

  const joinLeague = async (leagueId: string) => {
    try {
      await updateDoc(doc(db, "leagues", leagueId), {
        members: arrayUnion(user.uid)
      });
    } catch (err) {
      console.error("Error joining league", err);
    }
  };

  const leaveLeague = async (leagueId: string) => {
    try {
      const league = leagues.find(l => l.id === leagueId);
      if (league && league.members.length === 1 && league.members[0] === user.uid) {
        // If last member, delete the league
        await deleteDoc(doc(db, "leagues", leagueId));
      } else {
        await updateDoc(doc(db, "leagues", leagueId), {
          members: arrayRemove(user.uid)
        });
      }
      if (selectedLeague?.id === leagueId) setSelectedLeague(null);
      setLeagueToLeave(null);
    } catch (err) {
      console.error("Error leaving league", err);
    }
  };

  const inviteToLeague = (league: League) => {
    // 1. Fijamos tu dominio oficial de producción
    const origin = "https://prode-mundial-549241234562.us-west1.run.app";
    
    // 2. Preparamos el nombre y armamos la URL correcta con el #
    const inviterName = encodeURIComponent(user.displayName || 'Un jugador');
    const url = `${origin}/#league=${league.id}&inviter=${inviterName}`;
    
    // 3. Copiamos al portapapeles
    navigator.clipboard.writeText(`¡Únete a mi torneo "${league.name}" en el Prode Mundial 2026! ${url}`);
    
    // 4. Mostramos el tilde de éxito
    setCopiedLeagueId(league.id);
    setTimeout(() => setCopiedLeagueId(null), 3000);
  };

  const handleAcceptInvitation = async () => {
    if (!pendingInvitation) return;
    try {
      await updateDoc(doc(db, "leagues", pendingInvitation.league.id), {
        members: arrayUnion(user.uid)
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      setSelectedLeague(pendingInvitation.league);
      setPendingInvitation(null);
    } catch (err) {
      console.error("Error joining league", err);
    }
  };

  const handleRejectInvitation = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setPendingInvitation(null);
  };

  const currentUser = players.find((p) => p.uid === user.uid);
  const isAdmin = currentUser?.role === 'admin';

  if (loading) {
    return <div className="text-center py-10">Cargando torneos...</div>;
  }

  const renderLeaderboard = (title: string, playersList: Player[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-blue-600" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {playersList.map((player, index) => {
            const rank = playersList.findIndex(p => p.totalPoints === player.totalPoints) + 1;
            return (
            <div 
              key={player.uid} 
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-gray-50 cursor-pointer ${player.uid === user.uid ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-white'}`}
              onClick={() => setSelectedUser({uid: player.uid, name: player.displayName})}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${
                  rank === 1 ? 'bg-blue-100 text-blue-700' : 
                  rank === 2 ? 'bg-slate-200 text-slate-700' : 
                  rank === 3 ? 'bg-indigo-100 text-indigo-700' : 
                  'bg-gray-100 text-gray-500'
                }`}>
                  {rank}
                </div>
                
                <div className="flex items-center gap-3">
                  {player.photoURL ? (
                    <img src={player.photoURL} alt={player.displayName} className="w-10 h-10 rounded-full border" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {player.displayName}
                      {player.uid === user.uid && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Tú</span>}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-xl font-bold text-gray-900">
                {player.totalPoints} <span className="text-sm font-normal text-gray-500">pts</span>
              </div>
            </div>
          )})}
          
          {playersList.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aún no hay participantes en este ranking.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Filter leagues: Show all leagues
  const visibleLeagues = leagues;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <CountdownBanner />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left w-full sm:w-auto">
            <h2 className="text-3xl font-bold text-gray-900">Torneos</h2>
            <p className="text-sm text-gray-500 mt-1 text-justify sm:text-left">Creá o unite a torneos para competir con tus amigos o con toda la comunidad.</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4 mr-2"/> Crear Torneo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleLeagues.map(league => {
            const isMember = league.members.includes(user.uid);
            return (
              <Card key={league.id} className={selectedLeague?.id === league.id ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {league.name}
                      {league.isPublic ? (
                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-normal" title="Cualquiera puede unirse">
                          <Globe className="w-3 h-3" /> Público
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-normal" title="Solo con invitación">
                          <Lock className="w-3 h-3" /> Privado
                        </span>
                      )}
                      {isAdmin && (
                        <button 
                          onClick={() => setLeagueToDelete(league)} 
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Eliminar torneo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <span className="text-sm font-normal text-gray-500 flex items-center gap-1">
                      <Users className="w-4 h-4" /> {league.members.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2 flex-wrap">
                  {isMember ? (
                    <>
                      <Button variant={selectedLeague?.id === league.id ? "default" : "outline"} size="sm" onClick={() => setSelectedLeague(league)}>
                        Ver Ranking
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => inviteToLeague(league)}>
                        {copiedLeagueId === league.id ? (
                          <><Check className="w-4 h-4 mr-2 text-green-600"/> <span className="text-green-600">¡Copiado!</span></>
                        ) : (
                          <><Share2 className="w-4 h-4 mr-2"/> Invitar</>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto" onClick={() => setLeagueToLeave(league)}>
                        <LogOut className="w-4 h-4 mr-2"/> Salir
                      </Button>
                    </>
                  ) : (
                    league.isPublic ? (
                      <Button size="sm" onClick={() => joinLeague(league.id)} className="w-full">
                        <LogIn className="w-4 h-4 mr-2"/> Unirse al Torneo
                      </Button>
                    ) : (
                      <Button size="sm" disabled className="w-full bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed">
                        <Lock className="w-4 h-4 mr-2"/> Requiere Invitación
                      </Button>
                    )
                  )}
                </CardContent>
              </Card>
            )
          })}
          {visibleLeagues.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              No hay torneos creados aún. ¡Creá el primero!
            </div>
          )}
        </div>

        {selectedLeague && (
          <div className="mt-8">
            {renderLeaderboard(
              `Ranking: ${selectedLeague.name}`, 
              players.filter(p => selectedLeague.members.includes(p.uid))
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            {!isConfirmingCreate ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Crear Nuevo Torneo</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Torneo</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Los Pibes del Barrio"
                    value={newLeagueName}
                    onChange={(e) => { setNewLeagueName(e.target.value); setLeagueError(""); }}
                    autoFocus
                  />
                  {leagueError && <p className="text-red-500 text-sm mt-2">{leagueError}</p>}
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Privacidad del Torneo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${!isPublic ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setIsPublic(false)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Lock className={`w-4 h-4 ${!isPublic ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={`font-medium ${!isPublic ? 'text-blue-900' : 'text-gray-700'}`}>Privado</span>
                      </div>
                      <p className="text-xs text-gray-500">Solo van a poder unirse quienes tengan el enlace de invitación.</p>
                    </div>
                    <div 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${isPublic ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setIsPublic(true)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className={`w-4 h-4 ${isPublic ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={`font-medium ${isPublic ? 'text-blue-900' : 'text-gray-700'}`}>Público</span>
                      </div>
                      <p className="text-xs text-gray-500">Cualquiera va a poder ver el torneo y unirse libremente.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setShowCreateModal(false); setLeagueError(""); }}>Cancelar</Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white" 
                    onClick={handleCreateClick}
                    disabled={!newLeagueName.trim()}
                  >
                    Continuar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Torneo</h3>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6">
                  <p className="text-blue-800 font-medium mb-2">Atención:</p>
                  <p className="text-blue-700 text-sm">
                    Estás a punto de crear el torneo <strong>"{newLeagueName.trim()}"</strong> de forma <strong>{isPublic ? 'Pública' : 'Privada'}</strong>. 
                    Una vez creado, <strong>no vas a poder modificar su nombre ni eliminarlo</strong>. Solo los administradores tienen permiso para borrar torneos.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsConfirmingCreate(false)}>Atrás</Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white" 
                    onClick={confirmCreateLeague}
                    disabled={isCreating}
                  >
                    {isCreating ? "Creando..." : "Confirmar y Crear"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {leagueToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar torneo?</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que querés eliminar el torneo "{leagueToDelete.name}"? Esta acción no se puede deshacer y todos los miembros van a ser removidos.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setLeagueToDelete(null)}>Cancelar</Button>
              <Button 
                variant="destructive"
                onClick={() => deleteLeague(leagueToDelete.id)}
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {leagueToLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Salir del torneo?</h3>
            {leagueToLeave.members.length === 1 ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
                <p className="text-red-800 font-medium mb-2">¡Atención!</p>
                <p className="text-red-700 text-sm">
                  Sos la <strong>última persona</strong> en el torneo "{leagueToLeave.name}". 
                  Si salís ahora, <strong>el torneo se va a eliminar permanentemente</strong>. ¿Estás absolutamente seguro?
                </p>
              </div>
            ) : (
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que querés salir del torneo "{leagueToLeave.name}"? Vas a poder volver a unirte más tarde si lo deseás.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setLeagueToLeave(null)}>Cancelar</Button>
              <Button 
                variant="destructive"
                onClick={() => leaveLeague(leagueToLeave.id)}
              >
                {leagueToLeave.members.length === 1 ? "Sí, salir y eliminar" : "Sí, salir"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingInvitation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <Trophy className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Invitación a Torneo!</h3>
            <p className="text-gray-600 mb-6 text-lg">
              <strong>{pendingInvitation.inviter}</strong> te está invitando a su torneo <strong>"{pendingInvitation.league.name}"</strong> en El Prode de Beno, ¡sumate!
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="w-full" onClick={handleRejectInvitation}>Rechazar</Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                onClick={handleAcceptInvitation}
              >
                Aceptar y Unirse
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <UserPredictionsModal 
          userId={selectedUser.uid} 
          userName={selectedUser.name} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
}
