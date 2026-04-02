import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Trophy, Medal, User as UserIcon } from "lucide-react";
import { CountdownBanner } from "../components/CountdownBanner";
import { UserPredictionsModal } from "../components/UserPredictionsModal";

interface Player {
  uid: string;
  displayName: string;
  photoURL: string;
  totalPoints: number;
  role?: string;
}

export default function Dashboard({ user }: { user: User }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{uid: string, name: string} | null>(null);

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

    return () => {
      unsubscribeUsers();
    };
  }, [user.uid]);

  const myPoints = players.find((p) => p.uid === user.uid)?.totalPoints || 0;
  const myRank = players.findIndex((p) => p.totalPoints === myPoints) + 1;

  if (loading) {
    return <div className="text-center py-10">Cargando clasificación...</div>;
  }

  const renderLeaderboard = (title: string, playersList: Player[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-blue-600" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <CountdownBanner />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-blue-200 font-medium mb-1">Mis Puntos</p>
              <h2 className="text-5xl font-bold">{myPoints}</h2>
              <p className="text-xs text-blue-200 mt-2 opacity-80">Los puntos se calculan automáticamente según tus aciertos.</p>
            </div>
            <div className="bg-white/20 p-4 rounded-full">
              <Trophy className="h-10 w-10 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-600 to-purple-800 text-white border-none">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-indigo-200 font-medium mb-1">Mi Posición Global</p>
              <h2 className="text-5xl font-bold">#{myRank || "-"}</h2>
            </div>
            <div className="bg-white/20 p-4 rounded-full">
              <Medal className="h-10 w-10 text-indigo-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Ranking Global</h2>
        <p className="text-sm text-gray-500">Competí contra todos los usuarios registrados en el prode. Acá vas a ver la posición de cada jugador a nivel mundial.</p>
        {renderLeaderboard("Tabla de Posiciones Global", players)}
      </div>

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
