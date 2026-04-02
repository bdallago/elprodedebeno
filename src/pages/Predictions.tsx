import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { GROUPS, SPECIAL_QUESTIONS, KNOCKOUT_STAGES, ALL_TEAMS } from "../data";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { SortableItem } from "../components/SortableItem";
import { DndContext, closestCenter, KeyboardSensor, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Save, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { CountdownBanner } from "../components/CountdownBanner";

const DEADLINE = new Date('2026-06-08T00:00:00').getTime();

export default function Predictions({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [timeLeft, setTimeLeft] = useState(DEADLINE - Date.now());

  // State for predictions
  const [groupPredictions, setGroupPredictions] = useState<Record<string, string[]>>(GROUPS);
  const [specialPredictions, setSpecialPredictions] = useState<Record<string, string>>({});
  const [knockoutPredictions, setKnockoutPredictions] = useState<Record<string, string[]>>({});
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const docRef = doc(db, "predictions", user.uid);
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
          
          setGroupPredictions(sanitizedGroups);
          setSpecialPredictions(data.specials || {});
          setKnockoutPredictions(data.knockouts || {});
          setIsLocked(data.isLocked || false);
        } else {
          // Initialize with default order if no prediction exists
          setGroupPredictions(GROUPS);
        }
      } catch (error) {
        console.error("Error fetching predictions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [user.uid]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = DEADLINE - Date.now();
      setTimeLeft(remaining);
      
      // Auto-lock if time is up and it wasn't locked before
      if (remaining <= 0 && !isLocked && !loading) {
        setIsLocked(true);
        savePredictions(true); // Auto-save as locked
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked, loading]);

  const isTimeUp = timeLeft <= 0;
  const effectiveIsLocked = isLocked || isTimeUp;

  const handleDragEnd = (event: any, groupLetter: string) => {
    if (effectiveIsLocked) return;
    
    const { active, over } = event;

    if (active.id !== over.id) {
      setGroupPredictions((prev) => {
        const items = prev[groupLetter];
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        
        return {
          ...prev,
          [groupLetter]: arrayMove(items, oldIndex, newIndex),
        };
      });
    }
  };

  const handleSpecialChange = (id: string, value: string) => {
    if (effectiveIsLocked) return;
    setSpecialPredictions(prev => ({ ...prev, [id]: value }));
  };

  const savePredictions = async (lock: boolean = false) => {
    setSaving(true);
    setMessage(null);
    
    try {
      const docRef = doc(db, "predictions", user.uid);
      await setDoc(docRef, {
        uid: user.uid,
        groups: groupPredictions,
        specials: specialPredictions,
        knockouts: knockoutPredictions,
        isLocked: lock || effectiveIsLocked,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      if (lock || effectiveIsLocked) {
        setIsLocked(true);
      }
      
      setMessage({ type: 'success', text: lock ? 'Predicciones guardadas y fijadas con éxito.' : 'Predicciones guardadas con éxito.' });
    } catch (error) {
      console.error("Error saving predictions:", error);
      setMessage({ type: 'error', text: 'Hubo un error al guardar. Intenta de nuevo.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Cargando tus predicciones...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <CountdownBanner />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="w-full md:w-auto flex-1">
          <h1 className="text-3xl font-bold text-gray-900 text-center md:text-left">Mis Predicciones</h1>
          <p className="text-gray-500 mt-2 text-justify md:text-left">
            {effectiveIsLocked 
              ? "Tus predicciones están fijadas y no pueden ser modificadas." 
              : "Podés 'Guardar Borrador' cuantas veces quieras. Las elecciones solo se van a fijar permanentemente al hacer clic en 'Fijar Predicciones' (esta acción se puede hacer solo una vez)."}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0 shrink-0">
          {!effectiveIsLocked && (
            <>
              <Button 
                variant="outline" 
                onClick={() => savePredictions(false)}
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar Borrador"}
              </Button>
              <Button 
                onClick={() => setConfirmLock(true)}
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Lock className="w-4 h-4" /> Fijar Predicciones
              </Button>
            </>
          )}
          {effectiveIsLocked && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-md border border-green-200 w-full justify-center">
              <Lock className="w-4 h-4" /> Predicciones Fijadas
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-blue-900 border-b pb-2">Fase de Grupos</h2>
        <p className="text-sm text-gray-600 mb-4 text-justify">Arrastrá los equipos para ordenarlos del 1º al 4º puesto. Los dos primeros y los 8 mejores terceros avanzan a 16avos.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupPredictions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupLetter, teams]) => (
            <Card key={groupLetter} className="overflow-hidden border-t-4 border-t-blue-600">
              <CardHeader className="bg-gray-50 py-3 px-4 border-b">
                <CardTitle className="text-lg">Grupo {groupLetter}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, groupLetter)}
                >
                  <SortableContext 
                    items={(teams as string[]) as any}
                    strategy={verticalListSortingStrategy}
                  >
                    {(teams as string[]).map((team, index) => (
                      <SortableItem key={team} id={team} team={team} index={index} disabled={effectiveIsLocked} />
                    ))}
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-8">
        <h2 className="text-2xl font-bold text-blue-900 border-b pb-2">Preguntas Especiales</h2>
        <p className="text-sm text-gray-600 mb-4 text-justify">Por favor, escribí el nombre completo del jugador o selección elegida para evitar confusiones en la corrección.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SPECIAL_QUESTIONS.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {q.label}
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                  placeholder="Escribí tu respuesta..."
                  value={specialPredictions[q.id] || ""}
                  onChange={(e) => handleSpecialChange(q.id, e.target.value)}
                  disabled={effectiveIsLocked}
                />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center mt-6 shadow-sm">
          <p className="text-blue-800 font-bold">¿TENÉS IDEAS O SUGERENCIAS DE NUEVAS PREGUNTAS ESPECIALES? ¡NO DUDES EN MANDARLAS!</p>
        </div>
      </div>

      <div className="space-y-6 pt-8 pb-12 opacity-50">
        <h2 className="text-2xl font-bold text-blue-900 border-b pb-2">Fase Eliminatoria</h2>
        <div className="bg-gray-100 p-8 rounded-lg text-center border-2 border-dashed border-gray-300">
          <p className="text-gray-600 font-medium">Cuadro por definir</p>
          <p className="text-sm text-gray-500 mt-2">Esta sección se habilitará una vez finalizada la fase de grupos.</p>
        </div>
      </div>

      {confirmLock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Fijar predicciones?</h3>
            <p className="text-gray-600 mb-6">Una vez fijadas, no vas a poder modificarlas. ¿Estás seguro de que querés continuar?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmLock(false)}>Cancelar</Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white" 
                onClick={() => { 
                  setConfirmLock(false); 
                  savePredictions(true); 
                }}
                disabled={saving}
              >
                {saving ? "Fijando..." : "Sí, fijar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
