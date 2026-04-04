import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BookOpen, Trophy, Target, AlertCircle } from "lucide-react";
import { CountdownBanner } from "../components/CountdownBanner";
import { useTranslation } from 'react-i18next';

export default function Instructions() {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <CountdownBanner />
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center md:text-left">
        <div className="bg-blue-100 p-3 rounded-full shrink-0">
          <BookOpen className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('instructions.title')}</h1>
          <p className="text-gray-500 mt-1">{t('instructions.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="bg-blue-50 border-b pb-4">
            <CardTitle className="text-xl flex items-center gap-2 text-blue-900">
              <Target className="w-5 h-5" /> {t('instructions.howToPlay')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-gray-700 text-justify">
            <p dangerouslySetInnerHTML={{ __html: t('instructions.howToPlayDesc') }} />
            <ul className="list-disc pl-5 space-y-2 text-left">
              <li dangerouslySetInnerHTML={{ __html: t('instructions.step1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('instructions.step2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('instructions.step3') }} />
              <li dangerouslySetInnerHTML={{ __html: t('instructions.step4') }} />
              <li dangerouslySetInnerHTML={{ __html: t('instructions.step5') }} />
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-green-50 border-b pb-4">
            <CardTitle className="text-xl flex items-center gap-2 text-green-900">
              <Trophy className="w-5 h-5" /> {t('instructions.scoringSystem')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-gray-700">
            <div>
              <h3 className="font-bold text-lg mb-2 border-b pb-1">{t('instructions.groupStage')}</h3>
              <ul className="space-y-2">
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">{t('instructions.groupScore1')}</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">{t('instructions.points1')}</span>
                </li>
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">{t('instructions.groupScore2')}</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">{t('instructions.points2')}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 border-b pb-1">{t('instructions.knockoutStage')}</h3>
              <ul className="space-y-2">
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">{t('instructions.knockoutScore1')}</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">{t('instructions.points1')}</span>
                </li>
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">{t('instructions.knockoutScore2')}</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">{t('instructions.points2')}</span>
                </li>
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">{t('instructions.knockoutScore3')}</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">{t('instructions.points3')}</span>
                </li>
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">{t('instructions.knockoutScore4')}</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">{t('instructions.points4')}</span>
                </li>
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">{t('instructions.knockoutScore5')}</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">{t('instructions.points5')}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 border-b pb-1">{t('instructions.specialQuestions')}</h3>
              <ul className="space-y-2">
                <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 rounded">
                  <span className="text-sm sm:text-base">{t('instructions.specialScore1')}</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">{t('instructions.points10')}</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-blue-50 border-b pb-4">
            <CardTitle className="text-xl flex items-center gap-2 text-blue-900">
              <AlertCircle className="w-5 h-5" /> {t('instructions.tournaments')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-gray-700 text-justify">
            <p dangerouslySetInnerHTML={{ __html: t('instructions.tournamentsDesc') }} />
            <ul className="list-disc pl-5 space-y-2 text-left">
              <li>{t('instructions.tournamentsStep1')}</li>
              <li>{t('instructions.tournamentsStep2')}</li>
              <li>{t('instructions.tournamentsStep3')}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
