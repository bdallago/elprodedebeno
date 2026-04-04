import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Home, Trophy, Users, PenSquare, BookOpen, MessageSquareWarning, X, FileText, Image as ImageIcon, Film } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";
import { WorldCupBanner } from "../components/WorldCupBanner";
import { CountdownBanner } from "../components/CountdownBanner";
import { useTranslation } from 'react-i18next';

export default function Welcome() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setReportFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setReportFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const fileUrls: string[] = [];
      
      if (reportFiles.length > 0) {
        for (let i = 0; i < reportFiles.length; i++) {
          const file = reportFiles[i];
          const fileRef = ref(storage, `reports/${Date.now()}_${file.name}`);
          
          // Timeout to prevent hanging
          const uploadPromise = uploadBytes(fileRef, file);
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(t('welcome.storageError'))), 15000)
          );
          
          await Promise.race([uploadPromise, timeoutPromise]);
          const url = await getDownloadURL(fileRef);
          fileUrls.push(url);
        }
      }

      // Guardamos el reporte en Firestore
      await addDoc(collection(db, "reports"), {
        message: reportText,
        userEmail: auth.currentUser?.email || "",
        userName: auth.currentUser?.displayName || "",
        createdAt: new Date().toISOString(),
        attachments: fileUrls
      });
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsReportModalOpen(false);
        setSubmitSuccess(false);
        setReportText("");
        setReportFiles([]);
      }, 3000);
    } catch (error: any) {
      console.error("Error al guardar reporte:", error);
      setSubmitError(error.message || t('welcome.generalError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <WorldCupBanner />
      <CountdownBanner />
      <div className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
        <div className="w-full">
          <h1 className="text-4xl font-bold text-gray-900">
            {t('welcome.title')}<br />"{t('welcome.appTitle')}"
          </h1>
          <p className="text-gray-500 mt-4 text-lg text-justify">
            {t('welcome.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2 text-blue-900">
              <BookOpen className="w-5 h-5" /> {t('welcome.instructionsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">
            <p className="mb-4">
              {t('welcome.instructionsDesc')}
            </p>
            <Link to="/instructions">
              <Button variant="outline" className="w-full">{t('welcome.readRules')}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-t-4 border-t-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2 text-green-900">
              <PenSquare className="w-5 h-5" /> {t('welcome.predictionsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">
            <p className="mb-4">
              {t('welcome.predictionsDesc')}
            </p>
            <Link to="/predictions">
              <Button variant="outline" className="w-full">{t('welcome.makePredictions')}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-t-4 border-t-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2 text-purple-900">
              <Users className="w-5 h-5" /> {t('welcome.leaguesTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">
            <p className="mb-4">
              {t('welcome.leaguesDesc')}
            </p>
            <Link to="/leagues">
              <Button variant="outline" className="w-full">{t('welcome.viewLeagues')}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-t-4 border-t-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2 text-orange-900">
              <Trophy className="w-5 h-5" /> {t('welcome.rankingTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">
            <p className="mb-4">
              {t('welcome.rankingDesc')}
            </p>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full">{t('welcome.viewRanking')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow border-t-4 border-t-red-500 bg-red-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2 text-red-900">
            <MessageSquareWarning className="w-5 h-5" /> {t('welcome.reportTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-700">
          <p className="mb-4">
            {t('welcome.reportDesc')}
          </p>
          <Button onClick={() => setIsReportModalOpen(true)} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white">
            {t('welcome.reportBtn')}
          </Button>
        </CardContent>
      </Card>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setIsReportModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('welcome.reportModalTitle')}</h3>
            <p className="text-gray-600 mb-6 text-sm">
              {t('welcome.reportModalDesc')}
            </p>
            
            {submitSuccess ? (
              <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200 text-center">
                <p className="font-bold">{t('welcome.reportSuccess')}</p>
                <p className="text-sm mt-1">{t('welcome.reportSuccessDesc')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                {submitError && (
                  <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-200 text-sm">
                    {submitError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('welcome.yourMessage')}</label>
                  <textarea 
                    required
                    rows={5}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder={t('welcome.placeholder')}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('welcome.attachFiles')}</label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1 mb-3">{t('welcome.allowedFormats')}</p>
                  
                  {reportFiles.length > 0 && (
                    <div className="space-y-2 mt-3 max-h-40 overflow-y-auto pr-2">
                      {reportFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="bg-blue-100 p-1.5 rounded text-blue-600 shrink-0">
                              {file.type.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : 
                               file.type.startsWith('video/') ? <Film className="w-4 h-4" /> : 
                               <FileText className="w-4 h-4" />}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeFile(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                            title={t('welcome.deleteFile')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="pt-2">
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg">
                    {isSubmitting ? t('welcome.submitting') : t('welcome.submit')}
                  </Button>
                </div>
              </form>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                {t('welcome.orEmail')}<br/>
                <a href="mailto:bdallago01@gmail.com" className="text-blue-600 font-medium hover:underline">bdallago01@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
