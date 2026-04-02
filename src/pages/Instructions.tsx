import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BookOpen, Trophy, Target, AlertCircle } from "lucide-react";
import { CountdownBanner } from "../components/CountdownBanner";

export default function Instructions() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <CountdownBanner />
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center md:text-left">
        <div className="bg-blue-100 p-3 rounded-full shrink-0">
          <BookOpen className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instrucciones del Prode</h1>
          <p className="text-gray-500 mt-1">Reglamento y sistema de puntuación del torneo.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="bg-blue-50 border-b pb-4">
            <CardTitle className="text-xl flex items-center gap-2 text-blue-900">
              <Target className="w-5 h-5" /> ¿Cómo jugar?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-gray-700 text-justify">
            <p>
              Bienvenido a El Prode de Beno. El objetivo del juego es sumar la mayor cantidad de puntos posibles prediciendo los resultados de la fase de grupos y respondiendo a preguntas especiales sobre el torneo.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-left">
              <li>Andá a la pestaña <strong>"Mis Predicciones"</strong> para completar tu prode.</li>
              <li>En la <strong>Fase de Grupos</strong>, tenés que arrastrar y soltar los equipos para ordenarlos del 1º al 4º puesto. Los dos primeros y los 8 mejores terceros avanzan a 16avos.</li>
              <li>En las <strong>Preguntas Especiales</strong>, tenés que escribir el nombre completo del jugador o selección que creas que cumplirá con la consigna.</li>
              <li>Podés <strong>"Guardar Borrador"</strong> todas las veces que quieras sin compromiso.</li>
              <li>Una vez que estés seguro de tus elecciones, tenés que hacer clic en <strong>"Fijar Predicciones"</strong>. ¡Atención! Esta acción es definitiva, se puede hacer solo una vez y no vas a poder cambiar tus predicciones después.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-green-50 border-b pb-4">
            <CardTitle className="text-xl flex items-center gap-2 text-green-900">
              <Trophy className="w-5 h-5" /> Sistema de Puntuación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-gray-700">
            <div>
              <h3 className="font-bold text-lg mb-2 border-b pb-1">Fase de Grupos</h3>
              <ul className="space-y-2">
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">Por cada acierto en Posiciones finales en el grupo (por pais)</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">+1 Punto</span>
                </li>
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">Por cada grupo perfecto (acertar el orden exacto del 1º al 4º)</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">+2 Puntos</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 border-b pb-1">Fase Eliminatoria (Próximamente)</h3>
              <ul className="space-y-2">
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">Por cada acierto en ¿Quién avanza en 16avos?</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">+1 Punto</span>
                </li>
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">Por cada acierto en ¿Quién avanza en 8vos?</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">+2 Puntos</span>
                </li>
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">Por cada acierto en ¿Quién avanza en 4tos?</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">+3 Puntos</span>
                </li>
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">Por cada acierto en ¿Quién avanza en semis?</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">+4 Puntos</span>
                </li>
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">Por acertar ¿Quién sale campeón?</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">+5 Puntos</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 border-b pb-1">Preguntas Especiales</h3>
              <ul className="space-y-2">
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">Por cada respuesta correcta en las preguntas especiales</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">+10 Puntos</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-blue-50 border-b pb-4">
            <CardTitle className="text-xl flex items-center gap-2 text-blue-900">
              <AlertCircle className="w-5 h-5" /> Torneos y Ligas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-gray-700 text-justify">
            <p>
              Además de participar en el <strong>Ranking Global</strong> contra todos los usuarios de la aplicación, podés crear o unirte a <strong>Torneos Privados</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-left">
              <li>Andá a la pestaña "Torneos" en el Ranking para ver las ligas disponibles.</li>
              <li>Podés crear un nuevo torneo e invitar a tus amigos compartiendo el enlace.</li>
              <li>Adentro de cada torneo vas a ver una tabla de posiciones exclusiva con los miembros de ese grupo.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
