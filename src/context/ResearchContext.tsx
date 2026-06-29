import React, { createContext, useContext, useState, useEffect } from "react";
import { ResearchNotebook } from "../types";
import { 
  getResearchNotebooks, 
  addResearchNotebook, 
  updateResearchNotebook, 
  deleteResearchNotebook,
  migrateUserLegacyData
} from "../lib/dbService";

interface ResearchContextType {
  notebooks: ResearchNotebook[];
  currentNotebook: ResearchNotebook | null;
  isLoadingNotebooks: boolean;
  loadNotebooks: (userId: string, preferredLanguage?: "en" | "pt") => Promise<void>;
  switchNotebook: (notebookId: string) => void;
  createNotebook: (title: string, subtitle: string, description: string, language: "en" | "pt", isDemo?: boolean) => Promise<ResearchNotebook>;
  renameNotebook: (notebookId: string, title: string, subtitle?: string, description?: string) => Promise<void>;
  archiveNotebook: (notebookId: string, archive: boolean) => Promise<void>;
  deleteNotebook: (notebookId: string) => Promise<void>;
  toggleFavoriteNotebook: (notebookId: string) => Promise<void>;
}

const ResearchContext = createContext<ResearchContextType | undefined>(undefined);

export const ResearchProvider: React.FC<{ children: React.ReactNode; userId: string | null; preferredLanguage?: "en" | "pt" }> = ({ 
  children, 
  userId,
  preferredLanguage = "en"
}) => {
  const [notebooks, setNotebooks] = useState<ResearchNotebook[]>([]);
  const [currentNotebook, setCurrentNotebook] = useState<ResearchNotebook | null>(null);
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState<boolean>(false);

  const loadNotebooks = async (uid: string, lang: "en" | "pt" = preferredLanguage === "pt" ? "pt" : "en") => {
    if (!uid) return;
    setIsLoadingNotebooks(true);
    try {
      console.log(`[ResearchContext] Loading notebooks for user: ${uid}`);
      let list = await getResearchNotebooks(uid);

      if (list.length === 0) {
        console.log(`[ResearchContext] No notebooks found. Bootstrapping default notebook...`);
        const title = lang === "pt" ? "Caderno de Pesquisa Principal" : "Main Research Notebook";
        const subtitle = lang === "pt" ? "Caderno de Pesquisa" : "Personal Notebook Workspace";
        const description = lang === "pt" 
          ? "Meu primeiro caderno de pesquisa artística. Reúne reflexões, processos e referências estruturantes."
          : "My first artistic research notebook. Gathers core reflections, processes, and references.";
        
        const defaultNotebook = await addResearchNotebook(uid, {
          userId: uid,
          title,
          subtitle,
          description,
          status: "active",
          language: lang,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          favorite: true
        });

        console.log(`[ResearchContext] Default notebook created. Migrating legacy data...`);
        await migrateUserLegacyData(uid, defaultNotebook.id);
        
        // Reload notebooks
        list = await getResearchNotebooks(uid);
      }

      setNotebooks(list);

      // Determine active notebook
      const lastNotebookId = localStorage.getItem(`atlas_last_notebook_uid_${uid}`);
      let found = list.find(nb => nb.id === lastNotebookId);
      
      // If last opened is not found or is archived, fall back to first active notebook
      if (!found || found.status === "archived") {
        found = list.find(nb => nb.status === "active") || list[0] || null;
      }

      setCurrentNotebook(found);
      if (found) {
        localStorage.setItem(`atlas_last_notebook_uid_${uid}`, found.id);
      }
    } catch (err) {
      console.error("[ResearchContext] Error loading notebooks:", err);
    } finally {
      setIsLoadingNotebooks(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadNotebooks(userId);
    } else {
      setNotebooks([]);
      setCurrentNotebook(null);
    }
  }, [userId]);

  const switchNotebook = (notebookId: string) => {
    if (!userId) return;
    const found = notebooks.find(nb => nb.id === notebookId);
    if (found) {
      setCurrentNotebook(found);
      localStorage.setItem(`atlas_last_notebook_uid_${userId}`, found.id);
      console.log(`[ResearchContext] Switched active notebook to: ${found.title} (${found.id})`);
    }
  };

  const createNotebook = async (title: string, subtitle: string, description: string, language: "en" | "pt", isDemo?: boolean) => {
    if (!userId) throw new Error("No authenticated user.");
    
    const newNb = await addResearchNotebook(userId, {
      userId,
      title,
      subtitle: subtitle || undefined,
      description: description || undefined,
      status: "active",
      language,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorite: false,
      isDemo: isDemo || false
    });

    setNotebooks(prev => [newNb, ...prev]);
    setCurrentNotebook(newNb);
    localStorage.setItem(`atlas_last_notebook_uid_${userId}`, newNb.id);
    return newNb;
  };

  const renameNotebook = async (notebookId: string, title: string, subtitle?: string, description?: string) => {
    await updateResearchNotebook(notebookId, { title, subtitle, description });
    setNotebooks(prev => prev.map(nb => nb.id === notebookId ? { ...nb, title, subtitle, description, updatedAt: new Date().toISOString() } : nb));
    if (currentNotebook?.id === notebookId) {
      setCurrentNotebook(prev => prev ? { ...prev, title, subtitle, description, updatedAt: new Date().toISOString() } : null);
    }
  };

  const archiveNotebook = async (notebookId: string, archive: boolean) => {
    const status = archive ? "archived" : "active";
    await updateResearchNotebook(notebookId, { status });
    setNotebooks(prev => prev.map(nb => nb.id === notebookId ? { ...nb, status, updatedAt: new Date().toISOString() } : nb));
    
    // If we archived the current active notebook, switch to another active one
    if (currentNotebook?.id === notebookId && archive) {
      const activeList = notebooks.filter(nb => nb.id !== notebookId && nb.status === "active");
      const nextActive = activeList[0] || null;
      setCurrentNotebook(nextActive);
      if (nextActive && userId) {
        localStorage.setItem(`atlas_last_notebook_uid_${userId}`, nextActive.id);
      }
    } else if (currentNotebook?.id === notebookId && !archive) {
      setCurrentNotebook(prev => prev ? { ...prev, status } : null);
    }
  };

  const deleteNotebook = async (notebookId: string) => {
    await deleteResearchNotebook(notebookId);
    setNotebooks(prev => prev.filter(nb => nb.id !== notebookId));
    
    // If deleted the current one, switch to another active
    if (currentNotebook?.id === notebookId) {
      const activeList = notebooks.filter(nb => nb.id !== notebookId && nb.status === "active");
      const nextActive = activeList[0] || null;
      setCurrentNotebook(nextActive);
      if (nextActive && userId) {
        localStorage.setItem(`atlas_last_notebook_uid_${userId}`, nextActive.id);
      }
    }
  };

  const toggleFavoriteNotebook = async (notebookId: string) => {
    const target = notebooks.find(nb => nb.id === notebookId);
    if (!target) return;
    const favorite = !target.favorite;
    await updateResearchNotebook(notebookId, { favorite });
    setNotebooks(prev => prev.map(nb => nb.id === notebookId ? { ...nb, favorite, updatedAt: new Date().toISOString() } : nb));
    if (currentNotebook?.id === notebookId) {
      setCurrentNotebook(prev => prev ? { ...prev, favorite } : null);
    }
  };

  return (
    <ResearchContext.Provider value={{
      notebooks,
      currentNotebook,
      isLoadingNotebooks,
      loadNotebooks,
      switchNotebook,
      createNotebook,
      renameNotebook,
      archiveNotebook,
      deleteNotebook,
      toggleFavoriteNotebook
    }}>
      {children}
    </ResearchContext.Provider>
  );
};

export const useResearch = () => {
  const context = useContext(ResearchContext);
  if (context === undefined) {
    throw new Error("useResearch must be used within a ResearchProvider");
  }
  return context;
};
