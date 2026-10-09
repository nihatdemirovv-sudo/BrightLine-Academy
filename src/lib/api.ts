// BrightLine Academy — API client wrappers
// Bütün çağırışlar relative path ilə gedir.
import type {
  GeneratedQuestion,
  DailyTask,
  Weakness,
  ChatMessage,
  Student,
  SubjectProgress,
} from "./store";
export type { GeneratedQuestion, DailyTask, Weakness, ChatMessage, Student, SubjectProgress };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Server xətası" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Server xətası" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function patchJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Server xətası" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function deleteJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Server xətası" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function putJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Server xətası" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// === Auth (Login / Register) ===
export const api = {
  async register(p: {
    username: string;
    password: string;
    ad: string;
    qrup?: string;
    rol?: "telebe" | "muellim";
    email?: string;
    telefon?: string;
    dogumTarixi?: string;
    muellimFenni?: string;
    muellimSened?: string;
  }): Promise<AuthResult | RegisterPendingResult> {
    return postJson("/api/auth/register", p);
  },
  async login(p: {
    username: string;
    password: string;
  }): Promise<AuthResult | RegisterPendingResult> {
    return postJson("/api/auth/login", p);
  },
  // Təsdiq gözləyən müəllimin statusu — qeydiyyat ekranı bir neçə saniyədən bir soruşur.
  async getTeacherStatus(token: string): Promise<TeacherStatusResult> {
    return getJson(`/api/auth/teacher-status?token=${encodeURIComponent(token)}`);
  },

  // === Oxunmamış sayğaclar (nav badge-ləri) ===
  async getUnreadCounts(sessionId: string): Promise<UnreadCounts> {
    return getJson(`/api/unread?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async markSeen(sessionId: string, key: string): Promise<{ success: boolean }> {
    return postJson("/api/unread/seen", { sessionId, key });
  },

  // === Şəxsi mesajlar (müəllim ↔ tələbə) ===
  async getDmConversations(sessionId: string): Promise<DmConversation[]> {
    return getJson(`/api/dm?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async getDmThread(sessionId: string, partnerId: string): Promise<DmThread> {
    return getJson(`/api/dm/${partnerId}?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async sendDm(p: { sessionId: string; partnerId: string; mesaj?: string; sekil?: string }): Promise<DmThread> {
    return postJson(`/api/dm/${p.partnerId}`, { sessionId: p.sessionId, mesaj: p.mesaj, sekil: p.sekil });
  },
  async deleteDm(p: { sessionId: string; partnerId: string; messageId: string }): Promise<DmThread> {
    return deleteJson(`/api/dm/${p.partnerId}/messages/${p.messageId}?sessionId=${encodeURIComponent(p.sessionId)}`);
  },

  // === Student ===
  async upsertStudent(p: {
    sessionId: string;
    ad?: string;
    qrup?: string;
    hedefUniversite?: string;
    onboarded?: boolean;
    diagnosticDone?: boolean;
  }): Promise<Student> {
    return postJson("/api/student", p);
  },
  async getStudent(sessionId: string): Promise<Student> {
    return getJson(`/api/student?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async getProgress(sessionId: string): Promise<SubjectProgress[]> {
    return getJson(`/api/progress?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async recordProgress(p: {
    sessionId: string;
    fenn: string;
    dogru: boolean;
    say?: number;
  }): Promise<{
    fenn: string;
    seviyye: number;
    yildiz: number;
  }> {
    return postJson("/api/progress", p);
  },
  async tutorChat(p: {
    sessionId: string;
    messages: { role: string; content: string }[];
    imageQuestion?: string;
  }): Promise<{ reply: string }> {
    return postJson("/api/tutor-chat", p);
  },
  async analyzeImage(p: {
    sessionId: string;
    imageBase64: string;
    mimeType: string;
    question?: string;
  }): Promise<{ reply: string }> {
    return postJson("/api/analyze-image", p);
  },
  async transcribe(audioBase64: string): Promise<{ text: string }> {
    return postJson("/api/transcribe", { audioBase64 });
  },
  async generateQuestions(p: {
    sessionId: string;
    fenn: string;
    say: number;
    movzu?: string;
    qrup?: string;
  }): Promise<{ suallar: GeneratedQuestion[] }> {
    return postJson("/api/generate-questions", p);
  },
  async generateDiagnostic(qrup: string): Promise<{ suallar: GeneratedQuestion[] }> {
    return postJson("/api/diagnostic", { qrup });
  },
  async getDailyQuest(sessionId: string): Promise<{
    tasks: DailyTask[];
    tamamlandi: number;
    toplam: number;
  }> {
    return getJson(`/api/daily-quest?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async completeTask(p: {
    sessionId: string;
    taskIndex: number;
  }): Promise<{
    tasks: DailyTask[];
    tamamlandi: number;
  }> {
    return postJson("/api/daily-quest", p);
  },
  async getWeaknesses(sessionId: string): Promise<{ zəifTərəflər: Weakness[] }> {
    return getJson(`/api/weaknesses?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async getParentReport(sessionId: string): Promise<{
    report: {
      id: string;
      baslamaTarixi: string;
      bitmeTarixi: string;
      metin: string;
      createdAt: string;
    };
    sonRaportlar: {
      id: string;
      baslamaTarixi: string;
      bitmeTarixi: string;
      metin: string;
      createdAt: string;
    }[];
    stats: {
      toplamSual: number;
      dogruCavab: number;
      aktivGünSayı: number;
      streak: number;
    };
  }> {
    return getJson(`/api/parent-report?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    return getJson(`/api/chat-history?sessionId=${encodeURIComponent(sessionId)}`);
  },

  // === Activity Heatmap ===
  async getActivityHeatmap(sessionId: string): Promise<HeatmapData> {
    return getJson(`/api/activity-heatmap?sessionId=${encodeURIComponent(sessionId)}`);
  },

  // === Achievements ===
  async getAchievements(sessionId: string): Promise<AchievementsResponse> {
    return getJson(`/api/achievements?sessionId=${encodeURIComponent(sessionId)}`);
  },

  // === Bookmarks (Səhv Cavablar Kitabxanası) ===
  async getBookmarks(sessionId: string): Promise<Bookmark[]> {
    return getJson(`/api/bookmarks?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async addBookmark(p: {
    sessionId: string;
    fenn: string;
    sual: string;
    variantlar: { A: string; B: string; C: string; D: string; E: string };
    dogruCavab: "A" | "B" | "C" | "D" | "E";
    izah: string;
    movzu?: string;
    sehvCavab: "A" | "B" | "C" | "D" | "E";
  }): Promise<Bookmark> {
    return postJson("/api/bookmarks", p);
  },
  async markBookmarkReviewed(bookmarkId: string, tekrarEdildi = true): Promise<void> {
    await patchJson("/api/bookmarks", { bookmarkId, tekrarEdildi });
  },
  async deleteBookmark(id: string): Promise<void> {
    await deleteJson(`/api/bookmarks?id=${encodeURIComponent(id)}`);
  },

  // === Study Session (Dərs Saatı) ===
  async getStudyStats(sessionId: string): Promise<StudyStats> {
    return getJson(`/api/study-session?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async createStudySession(p: {
    sessionId: string;
    müddet: number;
    fenn?: string;
  }): Promise<StudySessionResult> {
    return postJson("/api/study-session", p);
  },

  // === Exam Simulator (İmtahan Simulyatoru) ===
  async getExamConfig(sessionId: string): Promise<{ config: ExamConfig | null; qrup: string }> {
    return getJson(`/api/exam/config?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async saveExamConfig(p: {
    sessionId: string;
    imtahanTarixi: string;
    nov?: "tqdk" | "magistr";
    müddet?: number;
    sualSayi?: number;
    kecidBali?: number;
  }): Promise<ExamConfig> {
    return postJson("/api/exam/config", p);
  },
  async generateExam(p: {
    sessionId: string;
    fennler?: string[];
  }): Promise<ExamGenerateResult> {
    return postJson("/api/exam/generate", p);
  },
  async submitExam(p: {
    attemptId: string;
    cavablar: Record<number, "A" | "B" | "C" | "D" | "E" | null>;
    müddetSan: number;
  }): Promise<ExamSubmitResult> {
    return postJson("/api/exam/submit", p);
  },
  async getExamHistory(sessionId: string): Promise<ExamHistory> {
    return getJson(`/api/exam/history?sessionId=${encodeURIComponent(sessionId)}`);
  },

  // === İmtahana Düşən Suallar (yüklənmiş PDF/şəkil əsaslı imtahan) ===
  async parsePastExam(p: {
    sessionId: string;
    files: { base64: string; mimeType: string }[];
  }): Promise<{ suallar: ExamQuestion[] }> {
    return postJson("/api/past-exam/parse", p);
  },
  async startPastExam(p: {
    sessionId: string;
    suallar: ExamQuestion[];
    müddet: number;
  }): Promise<ExamGenerateResult> {
    return postJson("/api/past-exam/start", p);
  },

  // === Score Simulator (TQDK Bal Hesablayıcı) ===
  async getScoreSimulator(sessionId: string): Promise<ScoreSimulatorGetResult> {
    return getJson(`/api/score-simulator?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async submitScoreSimulation(p: {
    sessionId: string;
    fennNetice: FennNetice[];
  }): Promise<ScoreSimulatorPostResult> {
    return postJson("/api/score-simulator", p);
  },

  // === University Match (Universitet Kodlaşdırması) ===
  async getUniversityMatch(p: {
    sessionId: string;
    bal: number;
    qrup: string;
    altQrup?: string;
    istek?: string;
  }): Promise<UniversityMatchResult> {
    const params = new URLSearchParams({
      sessionId: p.sessionId,
      bal: String(p.bal),
      qrup: p.qrup,
    });
    if (p.altQrup) params.set("altQrup", p.altQrup);
    if (p.istek && p.istek.trim()) params.set("istek", p.istek.trim());
    return getJson(`/api/university-match?${params.toString()}`);
  },
  async importUniversityCutoffs(p: {
    text: string;
    replaceAll?: boolean;
  }): Promise<{ əlavəEdildi: number; sətirSayı: number; xətalar: string[] }> {
    return postJson("/api/admin/university-cutoffs/import", p);
  },
  async getUniversityCutoffStats(): Promise<{ toplam: number; qrupUzre: Record<string, number> }> {
    return getJson("/api/admin/university-cutoffs/stats");
  },

  // === Error Patterns (Xəta Nümunələri Analizi) ===
  async getErrorPatterns(sessionId: string): Promise<ErrorPatternsResult> {
    return getJson(`/api/error-patterns?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async classifyBookmarkError(p: {
    sessionId: string;
    bookmarkId: string;
  }): Promise<{ success: boolean; tip: string }> {
    return postJson("/api/error-patterns", p);
  },

  // === SRS Flashcards (SM-2 Təkrar Sistemi) ===
  async getFlashcards(sessionId: string, mode: "due" | "all" = "due"): Promise<FlashcardsResult> {
    return getJson(`/api/flashcards?sessionId=${encodeURIComponent(sessionId)}&mode=${mode}`);
  },
  async createFlashcard(p: {
    sessionId: string;
    onYuzu: string;
    cavab: string;
    fenn: string;
    movzu?: string;
    bookmarkId?: string;
  }): Promise<Flashcard> {
    return postJson("/api/flashcards", p);
  },
  async deleteFlashcard(id: string): Promise<{ success: boolean }> {
    return deleteJson(`/api/flashcards?id=${encodeURIComponent(id)}`);
  },
  async reviewFlashcard(p: {
    flashcardId: string;
    quality: number; // 0-5
  }): Promise<FlashcardReviewResult> {
    return postJson("/api/flashcards/review", p);
  },

  // === Weak Topics (Zəif Mövzular) ===
  async getWeakTopics(sessionId: string): Promise<WeakTopicsResult> {
    return getJson(`/api/weak-topics?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async markTopicLearned(topicId: string, oynenildi = true): Promise<WeakTopic> {
    return patchJson("/api/weak-topics", { topicId, oynenildi });
  },

  // === Mini-Lessons (Dərs Təkrarı) ===
  async getMiniLessons(sessionId: string): Promise<MiniLessonsResult> {
    return getJson(`/api/mini-lesson?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async toggleLessonRead(lessonId: string): Promise<MiniLessonPatchResult> {
    return patchJson("/api/mini-lesson", { lessonId, action: "read" });
  },
  async toggleLessonBookmark(lessonId: string): Promise<MiniLessonPatchResult> {
    return patchJson("/api/mini-lesson", { lessonId, action: "bookmark" });
  },
  async generateMiniLesson(p: {
    sessionId: string;
    fenn: string;
    movzu: string;
  }): Promise<MiniLesson> {
    return postJson("/api/mini-lesson/generate", p);
  },

  // === Settings (Ayarlar / Profil) ===
  async getSettings(sessionId: string): Promise<SettingsResult> {
    return getJson(`/api/settings?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async updateSettings(p: {
    sessionId: string;
    settings?: Partial<StudentSettings>;
    profil?: { ad?: string; hedefUniversite?: string; email?: string };
    examConfig?: Partial<ExamConfig> & { imtahanTarixi: string };
  }): Promise<SettingsResult & { success: boolean }> {
    return putJson("/api/settings", p);
  },
  async resetProgress(sessionId: string): Promise<{ success: boolean; mesaj: string }> {
    return deleteJson(`/api/settings?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async changePassword(p: { sessionId: string; oldPassword: string; newPassword: string }): Promise<{ success: boolean; mesaj: string }> {
    return postJson("/api/account/change-password", p);
  },
  async deleteMyAccount(p: { sessionId: string; password: string }): Promise<{ success: boolean }> {
    return postJson("/api/account/delete", p);
  },

  // === TTS — Mətni səsə çevir (audio/mpeg Blob qaytarır) ===
  // Mütləq Blob (binary) qaytarır — JSON deyil. Xəta halında Error atır.
  async synthesizeSpeech(text: string, speed: number = 1.0): Promise<Blob> {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, speed }),
    });
    if (!res.ok) {
      // Əgər JSON xəta gəlibsə, error mesajını oxu
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const err = await res.json().catch(() => ({ error: "Səs yaradıla bilmədi" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      throw new Error("Səs yaradıla bilmədi");
    }
    return res.blob();
  },

  // === Söhbət tarixçəsində axtarış ===
  // GET /api/chat-history/search?sessionId=&q=
  // Boş query halında son 50 mesajı qaytarır.
  async searchChatHistory(sessionId: string, query: string): Promise<ChatMessage[]> {
    const params = new URLSearchParams();
    params.set("sessionId", sessionId);
    params.set("q", query);
    const data = await getJson<{ messages: ChatMessage[]; query: string; say?: number }>(
      `/api/chat-history/search?${params.toString()}`
    );
    return data.messages;
  },

  // === Dərs Materialları (YouTube axtarış) ===
  async searchMaterials(query: string, limit = 8): Promise<MaterialsSearchResult> {
    return postJson("/api/materials/search", { query, limit });
  },

  // === Dərs Materialları — PDF (tələbə üçün read-only) ===
  async getLibraryMaterials(): Promise<LibraryMaterialMeta[]> {
    return getJson("/api/materials/library");
  },
  async getLibraryMaterial(id: string): Promise<LibraryMaterialFull> {
    return getJson(`/api/materials/library/${id}`);
  },

  // === Mövzu Detay (Subject Detail) ===
  async getSubjectDetail(sessionId: string, fenn: string): Promise<SubjectDetailResult> {
    return getJson(
      `/api/subject-detail?sessionId=${encodeURIComponent(sessionId)}&fenn=${encodeURIComponent(fenn)}`
    );
  },

  // === Sual Tarixçəsi (Question History) ===
  async getQuestionHistory(
    sessionId: string,
    fenn?: string,
    limit = 50
  ): Promise<QuestionHistoryResult> {
    const params = new URLSearchParams();
    params.set("sessionId", sessionId);
    if (fenn) params.set("fenn", fenn);
    params.set("limit", String(limit));
    return getJson(`/api/question-history?${params.toString()}`);
  },

  // === CV Yaratma (Resume Builder) ===
  async getResume(sessionId: string): Promise<Partial<ResumeData>> {
    return getJson(`/api/resume?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async saveResume(sessionId: string, data: ResumeData): Promise<{ success: boolean }> {
    return postJson("/api/resume", { sessionId, data });
  },
  async improveResumeText(p: {
    sessionId: string;
    metn: string;
    kontext?: string;
  }): Promise<{ netice: string }> {
    return postJson("/api/resume/ai-improve", p);
  },

  // === Dəstək (Support) ===
  async createSupportTicket(p: {
    sessionId: string;
    movzu: string;
    mesaj: string;
    sekil?: string;
  }): Promise<SupportTicketSummary> {
    return postJson("/api/support/tickets", p);
  },
  async getSupportTickets(sessionId: string): Promise<SupportTicketSummary[]> {
    return getJson(`/api/support/tickets?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async getSupportTicket(sessionId: string, id: string): Promise<SupportTicketDetail> {
    return getJson(`/api/support/tickets/${id}?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async replySupportTicket(p: {
    sessionId: string;
    id: string;
    mesaj: string;
    sekil?: string;
  }): Promise<SupportTicketDetail> {
    return postJson(`/api/support/tickets/${p.id}/reply`, { sessionId: p.sessionId, mesaj: p.mesaj, sekil: p.sekil });
  },

  // === Qruplar (Chat Groups) ===
  async getChatGroups(sessionId: string): Promise<ChatGroupSummary[]> {
    return getJson(`/api/groups?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async createChatGroup(p: { sessionId: string; ad: string; sifre: string; memberIds?: string[] }): Promise<ChatGroupDetail> {
    return postJson("/api/groups", p);
  },
  async joinChatGroup(p: { sessionId: string; id: string; sifre: string }): Promise<ChatGroupDetail> {
    return postJson(`/api/groups/${p.id}/join`, { sessionId: p.sessionId, sifre: p.sifre });
  },
  async getChatGroup(sessionId: string, id: string): Promise<ChatGroupDetail> {
    return getJson(`/api/groups/${id}?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async sendChatGroupMessage(p: {
    sessionId: string;
    id: string;
    mesaj: string;
    sekil?: string;
    ses?: string;
    cavabId?: string;
  }): Promise<ChatGroupDetail> {
    return postJson(`/api/groups/${p.id}/messages`, {
      sessionId: p.sessionId,
      mesaj: p.mesaj,
      sekil: p.sekil,
      ses: p.ses,
      cavabId: p.cavabId,
    });
  },
  async editChatGroupMessage(p: { sessionId: string; id: string; messageId: string; mesaj: string }): Promise<ChatGroupDetail> {
    return postJson(`/api/groups/${p.id}/messages/${p.messageId}/edit`, { sessionId: p.sessionId, mesaj: p.mesaj });
  },
  async deleteChatGroupMessage(p: { sessionId: string; id: string; messageId: string }): Promise<ChatGroupDetail> {
    return deleteJson(`/api/groups/${p.id}/messages/${p.messageId}?sessionId=${encodeURIComponent(p.sessionId)}`);
  },
  async hideChatGroupMessage(p: { sessionId: string; id: string; messageId: string }): Promise<ChatGroupDetail> {
    return postJson(`/api/groups/${p.id}/messages/${p.messageId}/hide`, { sessionId: p.sessionId });
  },
  async kickChatGroupMember(p: { sessionId: string; id: string; memberId: string }): Promise<ChatGroupDetail> {
    return postJson(`/api/groups/${p.id}/kick`, { sessionId: p.sessionId, memberId: p.memberId });
  },
  async updateChatGroupSettings(p: { sessionId: string; id: string; ad?: string; sifre?: string }): Promise<ChatGroupDetail> {
    return postJson(`/api/groups/${p.id}/settings`, { sessionId: p.sessionId, ad: p.ad, sifre: p.sifre });
  },
  async setChatGroupClosed(p: { sessionId: string; id: string; qapali: boolean }): Promise<ChatGroupDetail> {
    return postJson(`/api/groups/${p.id}/closed`, { sessionId: p.sessionId, qapali: p.qapali });
  },
  async clearChatGroup(p: { sessionId: string; id: string }): Promise<ChatGroupDetail> {
    return postJson(`/api/groups/${p.id}/clear`, { sessionId: p.sessionId });
  },
  async leaveChatGroup(p: { sessionId: string; id: string }): Promise<{ success: boolean }> {
    return postJson(`/api/groups/${p.id}/leave`, { sessionId: p.sessionId });
  },
  async disbandChatGroup(p: { sessionId: string; id: string }): Promise<{ success: boolean }> {
    return deleteJson(`/api/groups/${p.id}?sessionId=${encodeURIComponent(p.sessionId)}`);
  },
  async muteChatGroup(p: { sessionId: string; id: string; yalnizAdminYaza: boolean }): Promise<ChatGroupDetail> {
    return postJson(`/api/groups/${p.id}/mute`, { sessionId: p.sessionId, yalnizAdminYaza: p.yalnizAdminYaza });
  },

  // === Bilik Arenası ===
  async arenaListActive(sessionId: string): Promise<ArenaCompetitionCard[]> {
    return getJson(`/api/arena/competitions?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async arenaCreate(p: {
    sessionId: string;
    ad: string;
    fenn: string;
    sualSayi: number;
    cetinlik: string;
    maxIstirakci: number;
    gozlemeSaniye: number;
    sualSaniye: number;
  }): Promise<ArenaCompetitionDetail> {
    return postJson("/api/arena/competitions", p);
  },
  async arenaGet(sessionId: string, id: string): Promise<ArenaCompetitionDetail> {
    return getJson(`/api/arena/competitions/${id}?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async arenaJoin(sessionId: string, id: string): Promise<ArenaCompetitionDetail> {
    return postJson(`/api/arena/competitions/${id}/join`, { sessionId });
  },
  async arenaStart(sessionId: string, id: string): Promise<ArenaCompetitionDetail> {
    return postJson(`/api/arena/competitions/${id}/start`, { sessionId });
  },
  async arenaCancel(sessionId: string, id: string): Promise<ArenaCompetitionDetail> {
    return postJson(`/api/arena/competitions/${id}/cancel`, { sessionId });
  },
  async arenaLeave(sessionId: string, id: string): Promise<ArenaCompetitionDetail> {
    return postJson(`/api/arena/competitions/${id}/leave`, { sessionId });
  },
  async arenaAnswer(p: { sessionId: string; id: string; sualIndex: number; secim: string }): Promise<ArenaCompetitionDetail> {
    return postJson(`/api/arena/competitions/${p.id}/answer`, {
      sessionId: p.sessionId,
      sualIndex: p.sualIndex,
      secim: p.secim,
    });
  },
  async arenaHistory(sessionId: string): Promise<ArenaHistoryItem[]> {
    return getJson(`/api/arena/me/history?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async arenaMyStats(sessionId: string): Promise<ArenaStats> {
    return getJson(`/api/arena/me/stats?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async arenaLeaderboard(sessionId: string, period: "all" | "week" | "month"): Promise<ArenaLeaderboard> {
    return getJson(`/api/arena/leaderboard?sessionId=${encodeURIComponent(sessionId)}&period=${period}`);
  },
  async arenaNotifications(sessionId: string): Promise<{ bildirisler: ArenaNotificationItem[]; oxunmamis: number }> {
    return getJson(`/api/arena/notifications?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async arenaMarkNotificationsRead(sessionId: string): Promise<{ oxunmamis: number }> {
    return postJson("/api/arena/notifications/read", { sessionId });
  },

  // === Müəllim paneli ===
  async searchStudents(sessionId: string, q: string): Promise<TeacherStudentSearchItem[]> {
    return getJson(`/api/teacher/students/search?sessionId=${encodeURIComponent(sessionId)}&q=${encodeURIComponent(q)}`);
  },
  async addTeacherStudent(sessionId: string, studentId: string): Promise<TeacherStudentSearchItem> {
    return postJson("/api/teacher/students", { sessionId, studentId });
  },
  async getTeacherStudents(sessionId: string): Promise<TeacherStudentSummary[]> {
    return getJson(`/api/teacher/students?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async removeTeacherStudent(sessionId: string, studentId: string): Promise<{ success: boolean }> {
    return deleteJson(`/api/teacher/students/${studentId}?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async getStudentActivity(sessionId: string, studentId: string): Promise<WeeklyActivityResult> {
    return getJson(`/api/teacher/students/${studentId}/activity?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async createTask(p: { sessionId: string; studentId: string; baslik: string; items: string[] }): Promise<TaskDetail> {
    return postJson("/api/teacher/tasks", p);
  },
  async getTeacherTasks(sessionId: string, studentId: string): Promise<TaskDetail[]> {
    return getJson(`/api/teacher/tasks?sessionId=${encodeURIComponent(sessionId)}&studentId=${encodeURIComponent(studentId)}`);
  },
  async addTaskAttachment(p: { sessionId: string; taskId: string; ad: string; tip: string; data: string }): Promise<TaskDetail> {
    return postJson(`/api/teacher/tasks/${p.taskId}/attachments`, { sessionId: p.sessionId, ad: p.ad, tip: p.tip, data: p.data });
  },
  async deleteTeacherTask(sessionId: string, taskId: string): Promise<{ success: boolean }> {
    return deleteJson(`/api/teacher/tasks/${taskId}?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async uploadTeacherMaterial(p: { sessionId: string; ad: string; tip: string; data: string }): Promise<TeacherMaterialItem> {
    return postJson("/api/teacher/materials", p);
  },
  async getTeacherMaterials(sessionId: string): Promise<TeacherMaterialItem[]> {
    return getJson(`/api/teacher/materials?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async deleteTeacherMaterial(sessionId: string, id: string): Promise<{ success: boolean }> {
    return deleteJson(`/api/teacher/materials/${id}?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async createTeacherExam(p: { sessionId: string; baslik: string; sened?: string; telimat?: string }): Promise<TeacherExamItem> {
    return postJson("/api/teacher/exams", p);
  },
  async getTeacherExams(sessionId: string): Promise<TeacherExamItem[]> {
    return getJson(`/api/teacher/exams?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async getExamSubmissions(sessionId: string, examId: string): Promise<ExamSubmissionDetail[]> {
    return getJson(`/api/teacher/exams/${examId}/submissions?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async sendExamFeedback(p: { sessionId: string; examId: string; submissionId: string; feedback: string; netice?: string }): Promise<ExamSubmissionDetail> {
    return postJson(`/api/teacher/exams/${p.examId}/submissions/${p.submissionId}/feedback`, {
      sessionId: p.sessionId, feedback: p.feedback, netice: p.netice,
    });
  },
  async addTaskComment(sessionId: string, taskId: string, mesaj: string): Promise<TaskDetail> {
    return postJson(`/api/tasks/${taskId}/comments`, { sessionId, mesaj });
  },

  // === Tələbənin "Müəllimim" görünüşü ===
  async getMyTasks(sessionId: string): Promise<TaskDetail[]> {
    return getJson(`/api/student/tasks?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async toggleMyTaskItem(sessionId: string, taskId: string, itemId: string): Promise<TaskDetail> {
    return postJson(`/api/student/tasks/${taskId}/items/${itemId}/toggle`, { sessionId });
  },
  async getMyTeacherMaterials(sessionId: string): Promise<TeacherMaterialItem[]> {
    return getJson(`/api/student/materials?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async getMyExams(sessionId: string): Promise<TeacherExamItem[]> {
    return getJson(`/api/student/exams?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async submitMyExam(p: { sessionId: string; examId: string; cavab?: string; sekil?: string }): Promise<ExamSubmissionDetail> {
    return postJson(`/api/student/exams/${p.examId}/submit`, { sessionId: p.sessionId, cavab: p.cavab, sekil: p.sekil });
  },
  async getMyTeacher(sessionId: string): Promise<MyTeacherItem[]> {
    return getJson(`/api/student/my-teacher?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async leaveTeacher(sessionId: string, teacherId: string): Promise<{ success: boolean }> {
    return deleteJson(`/api/student/my-teacher/${teacherId}?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async getPendingTeacherRequests(sessionId: string): Promise<TeacherRequestItem[]> {
    return getJson(`/api/student/teacher-requests?sessionId=${encodeURIComponent(sessionId)}`);
  },
  async respondToTeacherRequest(p: { sessionId: string; teacherId: string; accept: boolean }): Promise<{ success: boolean }> {
    return postJson(`/api/student/teacher-requests/${p.teacherId}/respond`, { sessionId: p.sessionId, accept: p.accept });
  },

  // === Admin — Müəllimlər ===
  async getTeachersAdmin(status: "pending" | "approved"): Promise<TeacherAdminSummary[]> {
    return getJson(`/api/admin/teachers?status=${status}`);
  },
  async getTeacherDetailAdmin(id: string): Promise<TeacherAdminDetail> {
    return getJson(`/api/admin/teachers/${id}`);
  },
  async getTeacherStudentActivityAdmin(teacherId: string, studentId: string): Promise<WeeklyActivityResult> {
    return getJson(`/api/admin/teachers/${teacherId}/students/${studentId}/activity`);
  },
  async approveTeacherAdmin(id: string): Promise<{ success: boolean }> {
    return postJson(`/api/admin/teachers/${id}/approve`, {});
  },
  async rejectTeacherAdmin(id: string): Promise<{ success: boolean }> {
    return postJson(`/api/admin/teachers/${id}/reject`, {});
  },
};

// === Tiplər (yeni endpoint-lər üçün) ===
export interface HeatmapDay {
  tarix: string;
  say: number;
  intensivlik: 0 | 1 | 2 | 3 | 4;
}
export interface HeatmapWeek {
  günlər: HeatmapDay[];
}
export interface HeatmapData {
  həftələr: HeatmapWeek[];
  aktivGünlər: number;
  toplamAktivlik: number;
  buGünSay: number;
  ənYaxşıGün: number;
  cariStreak: number;
}

export interface Achievement {
  kod: string;
  ad: string;
  tesvir: string;
  icon: string;
  reng: "primary" | "accent" | "warning" | "destructive";
  acildi: boolean;
  acilmaTarixi: string | null;
  proqres: number | null;
}
export interface AchievementStats {
  streak: number;
  toplamSual: number;
  dogruCavab: number;
  chatSayi: number;
  fennSayi: number;
  bookmarkSayi: number;
  studyDəqiqə: number;
}
export interface AchievementsResponse {
  achievements: Achievement[];
  yeniAçılan: Achievement[];
  stats: AchievementStats;
}

export interface Bookmark {
  id: string;
  fenn: string;
  sual: string;
  variantlar: { A: string; B: string; C: string; D: string; E: string };
  dogruCavab: "A" | "B" | "C" | "D" | "E";
  izah: string;
  movzu?: string | null;
  sehvCavab: string;
  tekrarEdildi: boolean;
  createdAt: string;
}

export interface StudyStats {
  toplamDəqiqə: number;
  seansSayı: number;
  sonHəftəDəqiqə: number;
  sonHəftəSeans: number;
  toplamSaat: number;
  toplamQalıqDəqiqə: number;
}
export interface StudySessionResult {
  id: string;
  müddet: number;
  fenn: string | null;
}

// === İmtahan Simulyatoru tipləri ===
export interface ExamConfig {
  id: string;
  studentId: string;
  imtahanTarixi: string; // YYYY-MM-DD
  nov: "tqdk" | "magistr";
  müddet: number; // dəqiqə
  sualSayi: number;
  kecidBali: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamQuestion extends GeneratedQuestion {
  fenn: string;
  nomre: number;
}

export interface ExamAttempt {
  id: string;
  baslamaVaxti: string;
  bitmeVaxti: string | null;
  sualSayi: number;
  dogruCavab: number;
  sehvCavab: number;
  bosCavab: number;
  bal: number;
  müddetSan: number;
  fennBolugu: Record<string, number>;
}

export interface ExamHistoryStats {
  toplamCəhd: number;
  enYaxşıBal: number;
  ortaBal: number;
  sonBal: number;
  günQalıb: number | null;
  kecidBali: number;
}

export interface ExamHistory {
  cəhdlər: ExamAttempt[];
  config: ExamConfig | null;
  stats: ExamHistoryStats;
}

export interface ExamGenerateResult {
  attemptId: string;
  suallar: ExamQuestion[];
  fennBolugu: Record<string, number>;
  sualSayi: number;
  müddet: number;
}

export interface ExamSubmitResult extends ExamAttempt {
  fennNetice: Record<string, { dogru: number; sehv: number; bos: number }>;
  kecidBali: number;
}

// === Bal Hesablayıcı tipləri ===
export interface ScoreSimulation {
  id: string;
  nov: string;
  fennNetice: FennNetice[];
  bal: number;
  maksimalBal: number;
  qebulEhtimali: number;
  analiz: string;
  createdAt: string;
}

export interface QrupKonfiq {
  maksimalBal: number;
  fennler: {
    fenn: string;
    sualSayi: number;
    merhele?: string;
    emsal?: number;
    maksimalBal?: number;
    qapaliSayi?: number;
    aciqKodSayi?: number;
    aciqYaziliSayi?: number;
    qisa?: string;
  }[];
}

export interface ScoreSimulatorGetResult {
  qrupKonfiq: QrupKonfiq;
  simulyasiyalar: ScoreSimulation[];
}

export interface FennNetice {
  fenn: string;
  dogru: number;
  sehv: number;
  bos: number;
  toplamSual: number;
  merhele: "buraxilis" | "blok";
  emsal: number;
  // Per-type breakdown (DİM rəsmi formulları üçün)
  qapaliDogru?: number;
  qapaliYanlis?: number;
  aciqKodDogru?: number;
  yaziliDogru?: number;
}

export interface FennBal {
  fenn: string;
  bal: number;
  maksimal: number;
  dəqiqlik: number;
  merhele: string;
  emsal: number;
}

export interface ScoreSimulatorPostResult extends ScoreSimulation {
  fennNetice: FennNetice[];
  fennBallari: FennBal[];
  qrupKonfiq: QrupKonfiq;
  buraxilisBal: number;
  blokBal: number;
}

// === Xəta Nümunələri tipləri ===
export interface ErrorType {
  kod: string;
  ad: string;
  tesvir: string;
  icon: string;
  reng: "destructive" | "warning" | "accent" | "primary";
  say: number;
  faiz: number;
  fennler: Record<string, number>;
}

export interface ErrorPatternsResult {
  nümunələr: ErrorType[];
  toplamXəta: number;
  topFennXəta: { fenn: string; say: number }[];
  siniflendirilmemishBookmark: number;
  xetaTipleri: unknown[];
}

// === SRS Flashcards tipləri ===
export interface Flashcard {
  id: string;
  onYuzu: string;
  cavab: string;
  fenn: string;
  movzu: string | null;
  repetitions: number;
  ease: number;
  interval: number;
  nextReview: string;
  sehvSayi: number;
  dogruSayi: number;
  bookmarkId: string | null;
}

export interface FlashcardStats {
  toplam: number;
  buGunTəkrar: number;
  öyrənilen: number;
}

export interface FlashcardsResult {
  flashcards: Flashcard[];
  stats: FlashcardStats;
}

export interface FlashcardReviewResult extends Flashcard {
  növbətiGün: number;
}

// === Zəif Mövzular tipləri ===
export interface WeakTopic {
  id: string;
  fenn: string;
  movzu: string;
  sehvNisbeti: number;
  sualSayi: number;
  oncelik: number; // 1-5
  tovsie: string | null;
  oynenildi: boolean;
}

export interface WeakTopicsResult {
  weakTopics: WeakTopic[];
  stats: { toplam: number; kritik: number };
  mesaj?: string;
}

// === CV Yaratma tipləri ===
export interface ResumeEducation {
  id: string;
  mekteb: string;
  derece: string;
  saha?: string;
  başlanğıc: string;
  bitmə: string;
  qeyd?: string;
}

export interface ResumeExperience {
  id: string;
  şirket: string;
  vəzifə: string;
  başlanğıc: string;
  bitmə: string;
  təsvir: string;
}

export interface ResumeProject {
  id: string;
  ad: string;
  təsvir: string;
  link?: string;
  tarix?: string;
}

export interface ResumeData {
  adSoyad: string;
  email: string;
  telefon: string;
  unvan?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  hedef?: string; // hədəflədiyi vəzifə/proqram (CV başlığında göstərilir)
  xulase: string;
  tehsil: ResumeEducation[];
  tecrube: ResumeExperience[];
  layiheler: ResumeProject[];
  bacariqlar: string[];
  diller: string[];
  sertifikatlar: string[];
}

// === Dəstək (Support) tipləri ===
export type SupportTicketStatus = "ACIQ" | "CAVABLANDI" | "BAGLI";

export interface SupportTicketSummary {
  id: string;
  movzu: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  mesajSayi: number;
  sonMesaj?: string;
  sonGonderen?: "STUDENT" | "ADMIN";
  telebeAdi?: string;
  telebeUsername?: string;
}

export interface SupportMessageItem {
  id: string;
  gonderen: "STUDENT" | "ADMIN";
  mesaj: string;
  sekil?: string;
  createdAt: string;
}

export interface SupportTicketDetail {
  id: string;
  movzu: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  mesajlar: SupportMessageItem[];
  telebeAdi?: string;
  telebeUsername?: string;
}

// === Qruplar (Chat Groups) tipləri ===
export interface ChatGroupSummary {
  id: string;
  ad: string;
  createdAt: string;
  uzvSayi: number;
  daxilOlub: boolean;
}

export interface ChatGroupMemberItem {
  studentId: string;
  ad: string;
  inzibatci: boolean;
  muellimdi: boolean;
  joinedAt: string;
}

export interface ChatGroupReplyPreview {
  id: string;
  senderAdi: string;
  mesaj: string;
  sekilVar: boolean;
  sesVar: boolean;
}

export interface ChatGroupMessageItem {
  id: string;
  senderId: string;
  senderAdi: string;
  muellimdi: boolean;
  mesaj: string;
  sekil?: string;
  ses?: string;
  createdAt: string;
  redaktaEdilib: boolean;
  silinib: boolean;
  cavab?: ChatGroupReplyPreview;
}

export interface ChatGroupDetail {
  id: string;
  ad: string;
  yaradiciId: string;
  qapali: boolean;
  yalnizAdminYaza: boolean;
  createdAt: string;
  uzvler: ChatGroupMemberItem[];
  mesajlar: ChatGroupMessageItem[];
  // DİQQƏT: yalnız BİRBAŞA (SSE-siz) sorğu cavablarında düzgündür — SSE "group" hadisəsi
  // BAŞQA üzvün əməliyyatından gəlirsə bu sahə ONUN clearedAt-ıdır, sənin YOX. groups.tsx
  // bunu ayrıca `myClearedAt` state-ində saxlayır, SSE-dən gələn dəyərə etibar etmir.
  menimClearedAt: string | null;
}

// === Müəllim paneli tipləri ===
export interface TeacherStudentSearchItem {
  id: string;
  ad: string;
  username?: string | null;
  qrup?: string | null;
  status?: "GOZLEYIR" | "QEBUL_EDILIB" | string | null;
}

export interface MyTeacherItem {
  teacherId: string;
  ad: string;
  muellimFenni?: string | null;
  username: string;
}

export interface TeacherRequestItem {
  teacherId: string;
  teacherAdi: string;
  muellimFenni?: string | null;
  tarix: string;
}

export interface TeacherStudentSummary extends TeacherStudentSearchItem {
  lastActiveDate?: string | null;
  himayeTarixi: string;
  // YALNIZ qəbul edilmiş (öz) tələbələr üçün doldurulur — bax TeacherPortalService.listMyStudents
  telefon?: string | null;
  dogumTarixi?: string | null;
  email?: string | null;
}

export interface ActivityEntry {
  icon: string;
  mesaj: string;
}

export interface WeeklyActivityResult {
  gunler: Record<string, ActivityEntry[]>;
  cemiSay: number;
}

export interface TaskItem {
  id: string;
  metn: string;
  tamam: boolean;
}

export interface TaskAttachment {
  id: string;
  ad: string;
  tip: "image" | "pdf" | string;
  data: string;
}

export interface TaskCommentItem {
  id: string;
  authorId: string;
  authorAdi: string;
  authorRol: "telebe" | "muellim";
  mesaj: string;
  createdAt: string;
}

export interface TaskDetail {
  id: string;
  teacherId: string;
  studentId: string;
  baslik: string;
  items: TaskItem[];
  attachments: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
  comments: TaskCommentItem[];
  muellimAdi?: string;
}

export interface TeacherMaterialItem {
  id: string;
  ad: string;
  tip: "image" | "pdf" | string;
  data: string;
  createdAt: string;
}

export interface ExamSubmissionDetail {
  id: string;
  examId: string;
  studentId: string;
  studentAdi?: string;
  cavab?: string | null;
  sekil?: string | null;
  status: "GONDERILIB" | "YOXLANILIB";
  feedback?: string | null;
  netice?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

export interface TeacherExamItem {
  id: string;
  teacherId: string;
  baslik: string;
  sened?: string | null;
  telimat?: string | null;
  createdAt: string;
  menimCavabim?: ExamSubmissionDetail | null;
  gonderilenSay?: number;
  yoxlanilmamisSay?: number;
}

export interface TeacherAdminSummary {
  id: string;
  ad: string;
  username?: string | null;
  email?: string | null;
  telefon?: string | null;
  dogumTarixi?: string | null;
  muellimFenni?: string | null;
  muellimSened?: string | null;
  createdAt: string;
  telebeSayi?: number;
}

export interface TeacherAdminDetail extends TeacherAdminSummary {
  telebeler: TeacherStudentSummary[];
}

// === Universitet Kodlaşdırması tipləri ===
export interface UniversityMatch {
  universitet: string;
  ixtisas: string;
  minBal: number;
  tehsilNovu?: string | null; // "ödənişli" | "dövlət sifarişi" | null
  ferq: number; // sənin balın - minBal (mənfi ola bilər)
  kecir: boolean;
}

export interface UniversityMatchResult {
  bal: number;
  qrup?: string;
  proqramlar: UniversityMatch[];
  serh: string;
  mesaj?: string;
}

// === Mini-Lessons (Dərs Təkrarı) tipləri ===
export interface MiniLesson {
  id: string;
  fenn: string;
  movzu: string;
  slug: string;
  metin: string;
  basliq: string;
  oxunmaVaxti: number;
  quizSuallar: GeneratedQuestion[] | null;
  oxundu: boolean;
  bookmarkEdildi: boolean;
  createdAt: string;
}

export interface MiniLessonsResult {
  lessons: MiniLesson[];
  stats: { toplam: number; oxundu: number; oxunmamis: number; bookmark: number };
}

export type MiniLessonPatchResult = MiniLesson;

// === Ayarlar / Profil tipləri ===
export interface StudentSettings {
  bildirislerAktiv: boolean;
  gunlukPlanBildirisi: boolean;
  streakXebardarligi: boolean;
  gunkuSualHediyye: number;
  cetinlikSeviyyesi: "asan" | "orta" | "cetin";
  animasyonlar: boolean;
  valideynEmail: string | null;
  valideynBildirisiAktiv: boolean;
}

export interface SettingsProfil {
  ad: string;
  qrup: string;
  hedefUniversite: string;
  email?: string | null;
  streak: number;
  createdAt: string;
}

export interface SettingsResult {
  settings: StudentSettings;
  profil: SettingsProfil;
  examConfig: ExamConfig | null;
}

// === Mövzu Detay tipləri ===
export interface SubjectDetailProgress {
  seviyye: number;
  yildiz: number;
  dogruCavab: number;
  hallSualSayi: number;
  dəqiqlik: number;
}

export interface SubjectMovzuStat {
  movzu: string;
  toplam: number;
  sehv: number;
  dogru: number;
  sehvNisbeti: number;
}

export interface SubjectBalTrend {
  tarix: string;
  bal: number;
  dogru: number;
}

export interface SubjectSonAktivlik {
  nov: string;
  detal: string | null;
  tarix: string;
}

export interface SubjectZeifMovzu {
  movzu: string;
  sehvNisbeti: number;
  sualSayi: number;
  oncelik: number;
  oynenildi: boolean;
  tovsie: string | null;
}

export interface SubjectDetailResult {
  fenn: string;
  progress: SubjectDetailProgress;
  movzuStat: SubjectMovzuStat[];
  balTrend: SubjectBalTrend[];
  sonAktivlik: SubjectSonAktivlik[];
  zəifMövzular: SubjectZeifMovzu[];
  bookmarkSayi: number;
  miniDersSayi: number;
  flashcardSayi: number;
  oxunmusDersSayi: number;
}

// === Sual Tarixçəsi tipləri ===
export interface SualDesti {
  id: string;
  fenn: string;
  sualSayi: number;
  tarix: string;
  nov: "generated";
}

export interface SehvCavabEntry {
  id: string;
  fenn: string;
  movzu: string;
  sual: string;
  sehvCavab: string;
  dogruCavab: string;
  variantlar: { A: string; B: string; C: string; D: string; E: string };
  izah: string;
  tekrarEdildi: boolean;
  tarix: string;
  nov: "wrong_answer";
}

export interface QuestionHistoryResult {
  sualDəstləri: SualDesti[];
  səhvCavablar: SehvCavabEntry[];
  stats: {
    toplamDəst: number;
    toplamSual: number;
    toplamSəhv: number;
    təkrarEdilən: number;
  };
}

// === Auth tipləri ===
export interface AuthResult {
  id: string;
  sessionId: string;
  username?: string | null;
  ad: string;
  qrup: string;
  hedefUniversite?: string;
  onboarded: boolean;
  diagnosticDone?: boolean;
  streak?: number;
  progress?: SubjectProgress[];
  createdAt?: string;
  rol?: string | null;
  muellimStatus?: string | null;
  error?: string;
}

export interface RegisterPendingResult {
  pending: true;
  mesaj: string;
  statusToken?: string;
  username?: string;
}

export interface TeacherStatusResult {
  status: "GOZLEYIR" | "TESDIQLENIB" | "RED";
  ad: string;
  username: string;
}

// === Oxunmamış sayğac tipləri ===
export interface UnreadSection {
  total: number;
  items: Record<string, number>;
}

export interface UnreadCounts {
  groups: UnreadSection;
  support: UnreadSection;
  messages: UnreadSection;
  // yalnız tələbə
  arena?: number;
  myTeacher?: { total: number; requests: number; tasks: number; materials: number; exams: number };
  // yalnız müəllim
  exams?: number;
  students?: number;
}

// === Şəxsi mesaj tipləri ===
export interface DmConversation {
  partnerId: string;
  ad: string;
  altBaslik?: string | null;
  muellimdi: boolean;
  sonMesaj?: string;
  sonMesajVaxti?: string;
  sonGonderenMenem?: boolean;
  oxunmamis: number;
}

export interface DmPerson {
  id: string;
  ad: string;
  altBaslik?: string | null;
}

export interface DmMessage {
  id: string;
  senderId: string;
  silinib: boolean;
  mesaj: string;
  sekil?: string | null;
  createdAt: string;
}

export interface DmThread {
  teacher: DmPerson;
  student: DmPerson;
  mesajlar: DmMessage[];
}

export function isPendingRegister(r: AuthResult | RegisterPendingResult): r is RegisterPendingResult {
  return (r as RegisterPendingResult).pending === true;
}

// === Dərs Materialları tipləri ===
export interface MaterialVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number; // saniyə
  url: string;
}

export interface MaterialsSearchResult {
  query: string;
  results: MaterialVideo[];
  error?: string;
}

// === Dərs Materialları — PDF (admin-idarəli, tələbə üçün read-only) ===
export interface LibraryMaterialMeta {
  id: string;
  ad: string;
  tesvir?: string | null;
  fenn?: string | null;
  tip: string;
  olcu?: number | null;
  createdAt: string;
}

export interface LibraryMaterialFull extends LibraryMaterialMeta {
  data: string; // base64 data-URI
}

// === Bilik Arenası tipləri ===
export type ArenaStatus = "GOZLEYIR" | "BASLADI" | "BITDI" | "LEGV" | "VAXT_BITDI";

export interface ArenaCompetitionCard {
  id: string;
  ad: string;
  fenn: string;
  cetinlik: string;
  sualSayi: number;
  sualSaniye: number;
  status: ArenaStatus;
  suallarHazir: boolean;
  suallarXeta: boolean;
  maxIstirakci: number;
  istirakciSayi: number;
  yaradiciId: string;
  yaradiciAdi: string;
  menimIstirakim: boolean;
  createdAt: string;
  gozlemeBitir: string | null;
}

export interface ArenaQuestion {
  sual: string;
  variantlar: Record<string, string>;
  movzu?: string;
  cetinlik?: string;
  figura?: unknown;
  dogruCavab?: string; // yalnız müsabiqə bitəndə
  izah?: string; // yalnız müsabiqə bitəndə
}

export interface ArenaParticipant {
  studentId: string;
  ad: string;
  istirakciNo: number;
  bitirib: boolean;
  cavabladiSay?: number; // yarış zamanı — rəqibin irəliləyişi (düzgünlük YOX)
  dogruSay?: number;
  sehvSay?: number;
  cavabsizSay?: number;
  xal?: number;
  ortaCavabMuddeti?: number;
  sira?: number | null;
  qalib?: boolean;
  /** Yalnız müsabiqə bitəndən sonra: sual indeksi → seçilən hərf. */
  secimler?: Record<string, string>;
}

export interface ArenaMyParticipation {
  istirakciNo: number;
  bitirib: boolean;
  cavabladiIndexler: number[];
  secimler: Record<string, string>;
  dogruSay?: number;
  sehvSay?: number;
  cavabsizSay?: number;
  xal?: number;
  ortaCavabMuddeti?: number;
  sira?: number | null;
  qalib?: boolean;
}

export interface ArenaCompetitionDetail {
  id: string;
  ad: string;
  fenn: string;
  cetinlik: string;
  sualSayi: number;
  sualSaniye: number;
  gozlemeSaniye: number;
  maxIstirakci: number;
  status: ArenaStatus;
  yaradiciId: string;
  yaradiciAdi: string;
  suallarHazir: boolean;
  suallarXeta: boolean;
  createdAt: string;
  baslamaVaxti: string | null;
  bitmeVaxti: string | null;
  serverTime: string;
  gozlemeBitir: string | null;
  cariSualIndex: number | null;
  istirakciSayi: number;
  istirakcilar: ArenaParticipant[];
  menimIstirakim?: ArenaMyParticipation;
  suallar: ArenaQuestion[];
}

export interface ArenaHistoryItem {
  competitionId: string;
  ad: string;
  fenn: string;
  cetinlik: string;
  sualSayi: number;
  tarix: string;
  istirakciSayi: number;
  sira: number | null;
  xal: number;
  dogruSay: number;
  sehvSay: number;
  cavabsizSay: number;
  qalib: boolean;
}

export interface ArenaStats {
  istirakSayi: number;
  qalibSayi: number;
  meglubSayi: number;
  umumiXal: number;
  enYaxsiXal: number;
  sonMusabiqe: {
    ad: string;
    fenn: string;
    tarix: string;
    sira: number | null;
    xal: number;
    qalib: boolean;
  } | null;
}

export interface ArenaLeaderboardRow {
  studentId: string;
  ad: string;
  xal: number;
  musabiqeSayi: number;
  qalibSayi: number;
  sira: number;
}

export interface ArenaLeaderboard {
  period: "all" | "week" | "month";
  liderler: ArenaLeaderboardRow[];
  menim: { sira: number | null; xal: number; umumiIstirakci: number };
}

export interface ArenaNotificationItem {
  id: string;
  tip: "QOSULDU" | "BASLADI" | "BITDI" | "QALIB" | "DEVET";
  mesaj: string;
  competitionId: string | null;
  oxunub: boolean;
  createdAt: string;
}

// === Konfiqurasiya ===
export const ALL_FENLER = [
  "Riyaziyyat",
  "Fizika",
  "Kimya",
  "Biologiya",
  "Tarix",
  "Ədəbiyyat",
  "Coğrafiya",
  "Xarici dili",
  "Azərbaycan dili",
  "İnformatika",
];

export const QRUP_FENLERI: Record<string, string[]> = {
  "1": ["Riyaziyyat","Azərbaycan Dili", "Xarici dil", "Fizika", "Kimya", "İnformatika"],
  "2": ["Riyaziyyat","Azərbaycan Dili", "Xarici Dil", "Coğrafiya", "Tarix"],
  "3": ["Azərbaycan dili", "Xarici dil", "Tarix", "Ədəbiyyat"],
  "4": ["Azərbaycan Dili", "Xarici Dil", "Biologiya", "Kimya", "Fizika"],
  // 5-ci qrup: tək mərhələli (yalnız Buraxılış imtahanı, blok yoxdur, 300 bal üzərindən).
  "5": ["Riyaziyyat", "Azərbaycan Dili", "Xarici Dil"],
  magistr: ["Məntiq", "İnformatika", "Xarici dil"],
};

export const QRUP_LABELS: Record<string, string> = {
  "1": "1-ci Qrup",
  "2": "2-ci Qrup",
  "3": "3-cü Qrup",
  "4": "4-cü Qrup",
  "5": "5-ci Qrup (yalnız Buraxılış)",
  magistr: "Magistr",
};

// Universitetlər və bölmələr (2026 — 52 universitet, sec.az üzrə)
export const UNIVERSITETLER: { universite: string; bolmeler: string[] }[] = [
  {
    universite: "BDU — Bakı Dövlət Universiteti",
    bolmeler: [
      "Ekologiya mühəndisliyi", "Fizika", "Fizika müəllimliyi", "Geologiya", "Geologiya və geofizika mühəndisliyi",
      "Geomatika və geodeziya mühəndisliyi", "İnformasiya təhlükəsizliyi", "İnformatika müəllimliyi",
      "Kimya mühəndisliyi", "Kompüter elmləri", "Qida mühəndisliyi", "Mexanika",
      "Meliorasiya mühəndisliyi", "Mədən mühəndisliyi", "Mühəndislik fizikası",
      "Riyaziyyat", "Riyaziyyat müəllimliyi", "Riyaziyyat və informatika",
      "Torpaqşünaslıq və aqrokimya", "Yerquruluşu və daşınmaz əmlakın kadastrı",
      "Beynəlxalq ticarət və logistika", "Biznesin idarə edilməsi", "Coğrafiya",
      "Coğrafiya müəllimliyi", "Hidrometeorologiya", "İqtisadiyyat", "Maliyyə", "Menecment",
      "Sosiologiya", "Statistika", "Tarix və coğrafiya müəllimliyi",
      "Turizm işinin təşkili",
      "Azərbaycan dili və ədəbiyyatı müəllimliyi", "Beynəlxalq münasibətlər",
      "Dövlət və ictimai münasibətlər", "Fəlsəfə", "Hüquqşünaslıq",
      "Xüsusi pedaqogika", "Jurnalistika", "Kitabxanaçılıq və informasiya fəaliyyəti",
      "Məktəbəqədər təhsil", "Politologiya", "Tarix", "Tarix müəllimliyi",
      "Sosial iş", "Regionşünaslıq (Türkiyə üzrə)", "Regionşünaslıq (Rusiya üzrə)",
      "Regionşünaslıq (İran üzrə)", "Regionşünaslıq (ABŞ üzrə)", "Regionşünaslıq (Çin üzrə)",
      "Tərcümə (ingilis dili üzrə)", "Tərcümə (ərəb dili üzrə)", "Tərcümə (fars dili üzrə)",
      "Biologiya", "Biologiya müəllimliyi", "Biotexnologiya",
      "Bitki mühafizəsi", "Ekologiya", "Kimya", "Kimya müəllimliyi",
      "Psixologiya", "Su bioehtiyatları və akvakultura",
      "Fiziki tərbiyə və çağırışaqədərki hazırlıq müəllimliyi",
    ],
  },
  {
    universite: "ADNSU — Azərbaycan Dövlət Neft və Sənaye Universiteti",
    bolmeler: [
      "Cihaz mühəndisliyi", "Data analitikası", "Ekologiya mühəndisliyi",
      "Elektrik və elektronika mühəndisliyi", "Energetika mühəndisliyi", "Geologiya",
      "Geologiya və geofizika mühəndisliyi", "Həyat fəaliyyətinin təhlükəsizliyi mühəndisliyi",
      "İnformasiya texnologiyaları", "İnformasiya təhlükəsizliyi", "İnşaat mühəndisliyi",
      "Kimya mühəndisliyi", "Kompüter elmləri", "Kompüter mühəndisliyi",
      "Qida mühəndisliyi", "Logistika və nəqliyyat texnologiyaları mühəndisliyi",
      "Maşın mühəndisliyi", "Materiallar mühəndisliyi", "Mexanika mühəndisliyi",
      "Mexatronika və robototexnika mühəndisliyi", "Mədən mühəndisliyi",
      "Mühəndislik fizikası", "Neft-qaz mühəndisliyi",
      "Proseslərin avtomatlaşdırılması mühəndisliyi",
      "Radiotexnika və telekommunikasiya mühəndisliyi", "Sənaye mühəndisliyi",
      "Beynəlxalq ticarət və logistika", "Biznesin idarə edilməsi",
      "İqtisadiyyat", "Marketinq", "Menecment",
    ],
  },
  {
    universite: "UNEC — Azərbaycan Dövlət İqtisad Universiteti",
    bolmeler: [
      "Ekologiya mühəndisliyi", "Elektrik və elektronika mühəndisliyi",
      "İnformasiya texnologiyaları", "İnformasiya təhlükəsizliyi",
      "Kommunikasiya sistemləri mühəndisliyi", "Kompüter elmləri",
      "Kompüter mühəndisliyi", "Qida mühəndisliyi", "Maşın mühəndisliyi",
      "Materiallar mühəndisliyi", "Sənaye mühəndisliyi",
      "Beynəlxalq ticarət və logistika", "Biznesin idarə edilməsi",
      "Dövlət və bələdiyyə idarəetməsi", "İqtisadiyyat", "Maliyyə",
      "Marketinq", "Menecment", "Mühasibat", "Statistika", "Turizm işinin təşkili",
      "Beynəlxalq münasibətlər", "Sosial iş", "Ekologiya", "Dizayn",
    ],
  },
  {
    universite: "ADPU — Azərbaycan Dövlət Pedaqoji Universiteti",
    bolmeler: [
      "Fizika müəllimliyi", "İnformatika", "Riyaziyyat müəllimliyi",
      "Riyaziyyat və informatika", "Texnologiya müəllimliyi",
      "Coğrafiya müəllimliyi", "Tarix və coğrafiya müəllimliyi",
      "Azərbaycan dili və ədəbiyyatı müəllimliyi", "Dil və ədəbiyyat müəllimliyi (türk dili)",
      "Filologiya (Azərbaycan dili və ədəbiyyatı üzrə)",
      "Xarici dil müəllimliyi (fransız)", "Xarici dil müəllimliyi (ingilis)",
      "Xüsusi pedaqogika", "İbtidai sinif müəllimliyi", "Məktəbəqədər təhsil",
      "Sosial iş", "Tarix müəllimliyi", "Təhsildə sosial-psixoloji xidmət",
      "Biologiya müəllimliyi", "Kimya müəllimliyi", "Kimya və biologiya müəllimliyi",
      "Fiziki tərbiyə və çağırışaqədərki hazırlıq müəllimliyi",
      "Musiqi müəllimliyi", "Təsviri incəsənət müəllimliyi",
    ],
  },
  {
    universite: "ATU — Azərbaycan Tibb Universiteti",
    bolmeler: [
      "Əczaçılıq", "Fizioterapiya", "İctimai səhiyyə", "Stomatologiya",
      "Tibb", "Tibb (ingilis dilində)", "Tibb bacısı işi",
    ],
  },
  {
    universite: "AzTU — Azərbaycan Texniki Universiteti",
    bolmeler: [
      "Aerokosmik mühəndislik", "Cihaz mühəndisliyi", "Ekologiya mühəndisliyi",
      "Elektrik və elektronika mühəndisliyi", "Energetika mühəndisliyi",
      "Həyat fəaliyyətinin təhlükəsizliyi mühəndisliyi",
      "Xüsusi rabitə vasitələri mühəndisliyi", "İnformasiya texnologiyaları",
      "İnformasiya təhlükəsizliyi", "Kimya mühəndisliyi", "Kompüter elmləri",
      "Kompüter mühəndisliyi", "Qida mühəndisliyi",
      "Logistika və nəqliyyat texnologiyaları mühəndisliyi",
      "Maşın mühəndisliyi", "Materiallar mühəndisliyi", "Mexanika mühəndisliyi",
      "Mexatronika və robototexnika mühəndisliyi", "Metallurgiya mühəndisliyi",
      "Mədən mühəndisliyi", "Nəqliyyat mühəndisliyi",
      "Proseslərin avtomatlaşdırılması mühəndisliyi",
      "Radiotexnika və telekommunikasiya mühəndisliyi", "Sənaye mühəndisliyi",
      "Silah və silah sistemləri mühəndisliyi", "Sistemlər mühəndisliyi",
      "Beynəlxalq ticarət və logistika", "Biznesin idarə edilməsi",
      "İqtisadiyyat", "Maliyyə", "Marketinq", "Menecment",
      "Nəqliyyatda servis", "Statistika",
    ],
  },
  {
    universite: "ADU — Azərbaycan Dillər Universiteti",
    bolmeler: [
      "Azərbaycan dili və ədəbiyyatı müəllimliyi", "Beynəlxalq münasibətlər",
      "Filologiya (alman dili)", "Filologiya (Azərbaycan dili)",
      "Filologiya (fransız dili)", "Filologiya (ingilis dili)", "Filologiya (ispan dili)",
      "Xarici dil müəllimliyi (alman)", "Xarici dil müəllimliyi (fransız)",
      "Xarici dil müəllimliyi (ingilis)", "Xüsusi pedaqogika",
      "Jurnalistika", "Məktəbəqədər təhsil",
      "Regionşünaslıq (Türkiyə üzrə)", "Regionşünaslıq (Rusiya üzrə)",
      "Regionşünaslıq (ABŞ üzrə)", "Regionşünaslıq (Çin üzrə)",
      "Regionşünaslıq (Almaniya üzrə)", "Regionşünaslıq (Fransa üzrə)",
      "Regionşünaslıq (ərəb ölkələri üzrə)", "Regionşünaslıq (İran üzrə)",
      "Regionşünaslıq (İsrail üzrə)", "Regionşünaslıq (Hindistan üzrə)",
      "Təhsildə sosial-psixoloji xidmət",
      "Tərcümə (alman)", "Tərcümə (erməni)", "Tərcümə (ərəb)",
      "Tərcümə (fransız)", "Tərcümə (ingilis)", "Tərcümə (ispan)",
      "Tərcümə (Koreya)", "Tərcümə (rus)",
    ],
  },
  {
    universite: "AzMİU — Azərbaycan Memarlıq və İnşaat Universiteti",
    bolmeler: [
      "Ekologiya mühəndisliyi", "Elektrik və elektronika mühəndisliyi",
      "Geomatika və geodeziya mühəndisliyi",
      "Həyat fəaliyyətinin təhlükəsizliyi mühəndisliyi",
      "İnformasiya texnologiyaları", "İnformasiya təhlükəsizliyi",
      "İnşaat mühəndisliyi", "Kommunikasiya sistemləri mühəndisliyi",
      "Logistika və nəqliyyat texnologiyaları mühəndisliyi",
      "Maşın mühəndisliyi", "Materiallar mühəndisliyi", "Mexanika mühəndisliyi",
      "Meliorasiya mühəndisliyi", "Memarlıq", "Neft-qaz mühəndisliyi",
      "Nəqliyyat mühəndisliyi", "Nəqliyyat tikintisi mühəndisliyi",
      "Proseslərin avtomatlaşdırılması mühəndisliyi", "Sənaye mühəndisliyi",
      "Şəhərsalma", "Yerquruluşu və daşınmaz əmlakın kadastrı",
      "Biznesin idarə edilməsi", "Davamlı inkişaf", "İqtisadiyyat",
      "Marketinq", "Menecment", "Dizayn",
    ],
  },
  {
    universite: "ADA — ADA Universiteti",
    bolmeler: [
      "Elektrik və elektronika mühəndisliyi", "İnformasiya texnologiyaları",
      "Kompüter elmləri", "Kompüter mühəndisliyi", "Qida texnologiyaları",
      "Memarlıq", "Riyaziyyat", "Şəhərsalma",
      "Heyvandarlıq", "Kənd təsərrüfatı texnologiyaları",
      "Biznesin idarə edilməsi", "İqtisadiyyat", "Maliyyə",
      "Beynəlxalq münasibətlər (ingilis dilində)",
      "Dövlət və ictimai münasibətlər (ingilis dilində)",
      "Hüquqşünaslıq (ingilis dilində)",
      "Kommunikasiya və rəqəmsal media (ingilis dilində)", "Dizayn",
    ],
  },
  {
    universite: "GDU — Gəncə Dövlət Universiteti",
    bolmeler: [
      "Ekologiya mühəndisliyi", "Fizika müəllimliyi", "İnformatika",
      "Kimya mühəndisliyi", "Kompüter elmləri", "Maşın mühəndisliyi",
      "Riyaziyyat müəllimliyi", "Riyaziyyat və informatika", "Texnologiya müəllimliyi",
      "Biznesin idarə edilməsi", "Coğrafiya müəllimliyi",
      "Dövlət və bələdiyyə idarəetməsi", "İqtisadiyyat", "Maliyyə",
      "Marketinq", "Menecment", "Mühasibat", "Tarix və coğrafiya müəllimliyi",
      "Turizm bələdçiliyi", "Turizm işinin təşkili",
      "Azərbaycan dili və ədəbiyyatı müəllimliyi",
      "Filologiya (Azərbaycan dili və ədəbiyyatı üzrə)",
      "Xarici dil müəllimliyi (alman)", "Xarici dil müəllimliyi (fransız)",
      "Xarici dil müəllimliyi (ingilis)", "Xarici dil müəllimliyi (rus)",
      "Məktəbəqədər təhsil", "Sosial iş", "Tarix", "Tarix müəllimliyi",
      "Təhsildə sosial-psixoloji xidmət", "Tərcümə (ingilis dili üzrə)",
      "Biologiya", "Biologiya müəllimliyi", "Ekologiya", "Kimya",
      "Kimya müəllimliyi", "Kimya və biologiya müəllimliyi", "Psixologiya",
      "Fiziki tərbiyə və çağırışaqədərki hazırlıq müəllimliyi",
      "Məşqçilik", "Musiqi müəllimliyi", "Təsviri incəsənət müəllimliyi",
      "Ümumi fiziki hazırlıq",
    ],
  },
  {
    universite: "SDU — Sumqayıt Dövlət Universiteti",
    bolmeler: [
      "Ekologiya mühəndisliyi", "Elektrik və elektronika mühəndisliyi",
      "Energetika mühəndisliyi", "Fizika", "Fizika müəllimliyi",
      "İnformasiya texnologiyaları", "İnformasiya təhlükəsizliyi", "İnformatika",
      "Kimya mühəndisliyi", "Kompüter mühəndisliyi",
      "Logistika və nəqliyyat texnologiyaları mühəndisliyi",
      "Mexanika mühəndisliyi", "Mexatronika və robototexnika mühəndisliyi",
      "Neft-qaz mühəndisliyi", "Proseslərin avtomatlaşdırılması mühəndisliyi",
      "Riyaziyyat", "Riyaziyyat müəllimliyi", "Riyaziyyat və informatika",
      "Beynəlxalq ticarət və logistika", "Biznesin idarə edilməsi",
      "İqtisadiyyat", "Maliyyə", "Marketinq", "Menecment", "Mühasibat",
      "Tarix və coğrafiya müəllimliyi", "Turizm işinin təşkili",
      "Azərbaycan dili və ədəbiyyatı müəllimliyi",
      "Filologiya (Azərbaycan dili və ədəbiyyatı üzrə)",
      "Xarici dil müəllimliyi (ingilis)", "Xüsusi pedaqogika",
      "İbtidai sinif müəllimliyi", "Məktəbəqədər təhsil", "Politologiya",
      "Sosial iş", "Tarix", "Tarix müəllimliyi",
      "Təhsildə sosial-psixoloji xidmət",
      "Biologiya", "Biologiya müəllimliyi", "Ekologiya", "Kimya",
      "Kimya müəllimliyi", "Kimya müəllimliyi (ingilis dilində)",
      "Kimya və biologiya müəllimliyi", "Psixologiya",
      "Fiziki tərbiyə və çağırışaqədərki hazırlıq müəllimliyi",
    ],
  },
  {
    universite: "NDU — Naxçıvan Dövlət Universiteti",
    bolmeler: [
      "Ekologiya mühəndisliyi", "Elektrik və elektronika mühəndisliyi",
      "Energetika mühəndisliyi", "Fizika", "Fizika müəllimliyi",
      "İnformasiya texnologiyaları", "İnformasiya təhlükəsizliyi",
      "Kompüter mühəndisliyi", "Meliorasiya mühəndisliyi", "Memarlıq",
      "Nəqliyyat mühəndisliyi", "Proseslərin avtomatlaşdırılması mühəndisliyi",
      "Riyaziyyat", "Riyaziyyat müəllimliyi", "Riyaziyyat və informatika",
      "Texnologiya müəllimliyi", "Torpaqşünaslıq və aqrokimya",
      "Yerquruluşu və daşınmaz əmlakın kadastrı",
      "Beynəlxalq ticarət və logistika", "Coğrafiya", "Coğrafiya müəllimliyi",
      "Dövlət və bələdiyyə idarəetməsi", "İqtisadiyyat", "Maliyyə",
      "Marketinq", "Menecment", "Mühasibat", "Turizm işinin təşkili",
      "Azərbaycan dili və ədəbiyyatı müəllimliyi", "Beynəlxalq münasibətlər",
      "Dövlət və ictimai münasibətlər",
      "Filologiya (Azərbaycan dili və ədəbiyyatı üzrə)", "Hüquqşünaslıq",
      "Xarici dil müəllimliyi (alman)", "Xarici dil müəllimliyi (fransız)",
      "Xarici dil müəllimliyi (ingilis)", "Xarici dil müəllimliyi (rus)",
      "Jurnalistika", "Kitabxanaçılıq və informasiya fəaliyyəti",
      "Sosial iş", "Tarix", "Tarix müəllimliyi",
      "Tərcümə (ərəb)", "Tərcümə (fars)", "Tərcümə (ingilis)",
      "Baytarlıq təbabəti", "Biologiya", "Biologiya müəllimliyi",
      "Əczaçılıq", "İctimai səhiyyə", "Kimya", "Kimya müəllimliyi",
      "Psixologiya", "Stomatologiya", "Tibb", "Tibb (ingilis dilində)",
      "Tibb bacısı işi",
      "Aktyor sənəti", "Bəstəkarlıq", "Dirijorluq", "Dizayn",
      "Fiziki tərbiyə və çağırışaqədərki hazırlıq müəllimliyi",
      "İnstrumental ifaçılıq", "Məşqçilik", "Musiqi müəllimliyi",
      "Musiqişünaslıq", "Rəngkarlıq", "Təsviri incəsənət müəllimliyi",
      "Vokal sənəti",
    ],
  },
  {
    universite: "LDU — Lənkəran Dövlət Universiteti",
    bolmeler: [
      "Ekologiya mühəndisliyi", "Fizika müəllimliyi", "İnformatika",
      "Kimya mühəndisliyi", "Kompüter elmləri", "Maşın mühəndisliyi",
      "Riyaziyyat müəllimliyi", "Riyaziyyat və informatika", "Texnologiya müəllimliyi",
      "Biznesin idarə edilməsi", "Coğrafiya müəllimliyi",
      "Dövlət və bələdiyyə idarəetməsi", "İqtisadiyyat", "Maliyyə",
      "Marketinq", "Menecment", "Mühasibat", "Tarix və coğrafiya müəllimliyi",
      "Turizm bələdçiliyi", "Turizm işinin təşkili",
      "Azərbaycan dili və ədəbiyyatı müəllimliyi",
      "Filologiya (Azərbaycan dili və ədəbiyyatı üzrə)",
      "Xarici dil müəllimliyi (ingilis)", "İbtidai sinif müəllimliyi",
      "Məktəbəqədər təhsil", "Tarix", "Tarix müəllimliyi",
      "Biologiya", "Biologiya müəllimliyi", "Ekologiya",
      "Kimya", "Kimya müəllimliyi", "Psixologiya",
      "Fiziki tərbiyə və çağırışaqədərki hazırlıq müəllimliyi",
      "Musiqi müəllimliyi", "Təsviri incəsənət müəllimliyi",
    ],
  },
  {
    universite: "MDU — Mingəçevir Dövlət Universiteti",
    bolmeler: [
      "Ekologiya mühəndisliyi", "Elektrik və elektronika mühəndisliyi",
      "Energetika mühəndisliyi", "Fizika müəllimliyi",
      "Həyat fəaliyyətinin təhlükəsizliyi mühəndisliyi",
      "İnformasiya texnologiyaları", "İnformasiya təhlükəsizliyi", "İnformatika",
      "Kompüter elmləri", "Kompüter mühəndisliyi", "Nəqliyyat mühəndisliyi",
      "Riyaziyyat müəllimliyi", "Riyaziyyat və informatika",
      "Sənaye mühəndisliyi", "Texnologiya müəllimliyi",
      "Biznesin idarə edilməsi", "Dövlət və bələdiyyə idarəetməsi",
      "İqtisadiyyat", "Maliyyə", "Marketinq", "Menecment", "Mühasibat",
      "Turizm bələdçiliyi", "Turizm işinin təşkili",
      "Azərbaycan dili və ədəbiyyatı müəllimliyi",
      "Dil və ədəbiyyat müəllimliyi (ingilis dili)",
      "Filologiya (Azərbaycan dili və ədəbiyyatı üzrə)",
      "Xarici dil müəllimliyi (ingilis)", "İbtidai sinif müəllimliyi",
      "Məktəbəqədər təhsil", "Sosial iş", "Tarix", "Tarix müəllimliyi",
      "Təhsildə sosial-psixoloji xidmət", "Ekologiya",
      "Kimya və biologiya müəllimliyi",
    ],
  },
  {
    universite: "BSU — Bakı Slavyan Universiteti",
    bolmeler: [
      "Azərbaycan dili və ədəbiyyatı müəllimliyi", "Beynəlxalq münasibətlər",
      "Filologiya (Azərbaycan dili)", "Filologiya (ingilis dili)",
      "Filologiya (türk dili)", "Xarici dil müəllimliyi (alman)",
      "Xarici dil müəllimliyi (fransız)", "Xarici dil müəllimliyi (ingilis)",
      "Xarici dil müəllimliyi (rus)", "Xüsusi pedaqogika",
      "İbtidai sinif müəllimliyi", "Jurnalistika", "Məktəbəqədər təhsil",
      "Regionşünaslıq (Balkan ölkələri)", "Regionşünaslıq (Xəzəryanı ölkələr)",
      "Regionşünaslıq (Qərbi Avropa)", "Regionşünaslıq (Mərkəzi Asiya)",
      "Regionşünaslıq (Şərqi Avropa)", "Təhsildə sosial-psixoloji xidmət",
      "Tərcümə (Azərbaycan-alman)", "Tərcümə (Azərbaycan-bolqar)",
      "Tərcümə (Azərbaycan-çex)", "Tərcümə (Azərbaycan-fransız)",
      "Tərcümə (Azərbaycan-ingilis)", "Tərcümə (Azərbaycan-polyak)",
      "Tərcümə (Azərbaycan-rus)", "Tərcümə (Azərbaycan-ukrayna)",
      "Tərcümə (Azərbaycan-yunan)", "Psixologiya",
    ],
  },
  {
    universite: "MAA — Milli Aviasiya Akademiyası",
    bolmeler: [
      "Aerokosmik mühəndislik", "Aviasiya təhlükəsizliyi mühəndisliyi",
      "Cihaz mühəndisliyi", "Ekologiya mühəndisliyi",
      "Elektrik və elektronika mühəndisliyi", "Energetika mühəndisliyi",
      "Hava nəqliyyatının hərəkətinin təşkili", "İnformasiya texnologiyaları",
      "Kompüter mühəndisliyi", "Logistika və nəqliyyat texnologiyaları mühəndisliyi",
      "Materiallar mühəndisliyi", "Mexanika mühəndisliyi",
      "Mexatronika və robototexnika mühəndisliyi", "Mühəndislik fizikası",
      "Proseslərin avtomatlaşdırılması mühəndisliyi",
      "Radiotexnika və telekommunikasiya mühəndisliyi", "Uçuş mühəndisliyi",
      "Biznesin idarə edilməsi", "Hidrometeorologiya", "İqtisadiyyat",
      "Maliyyə", "Menecment",
      "Hüquqşünaslıq", "Hüquqşünaslıq (ingilis dilində)",
    ],
  },
  {
    universite: "ATMU — Azərbaycan Turizm və Menecment Universiteti",
    bolmeler: [
      "Qida mühəndisliyi",
      "Beynəlxalq ticarət və logistika", "Biznesin idarə edilməsi",
      "Dövlət və bələdiyyə idarəetməsi", "Maliyyə", "Menecment",
      "Turizm bələdçiliyi", "Turizm işinin təşkili",
      "Beynəlxalq münasibətlər",
      "Muzey, arxiv işi və abidələrin qorunması", "Sosial iş",
      "Tərcümə (ingilis dili)",
    ],
  },
  {
    universite: "ADMİU — Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti",
    bolmeler: [
      "Sosiologiya", "Turizm bələdçiliyi", "Turizm işinin təşkili",
      "Ədəbi yaradıcılıq və ekran dramaturgiyası",
      "Kitabxanaçılıq və informasiya fəaliyyəti",
      "Muzey, arxiv işi və abidələrin qorunması",
      "Sənətşünaslıq (kinoşünaslıq)", "Sənətşünaslıq (teatrşünaslıq)",
      "Sənətşünaslıq (təsviri sənətin tarixi və nəzəriyyəsi)", "Sosial iş",
      "Aktyor sənəti", "Dekorativ-tətbiqi sənət", "Dizayn",
      "İnstrumental ifaçılıq", "Qrafika", "Musiqi müəllimliyi",
      "Musiqişünaslıq", "Operator sənəti", "Populyar musiqi və caz ifaçılığı",
      "Rejissorluq", "Rəngkarlıq", "Təsviri incəsənət müəllimliyi", "Vokal sənəti",
    ],
  },
  {
    universite: "ADDA — Azərbaycan Dövlət Dəniz Akademiyası",
    bolmeler: [
      "Dəniz naviqasiyası mühəndisliyi", "Elektrik və elektronika mühəndisliyi",
      "Gəmi energetik qurğularının istismarı mühəndisliyi",
      "Gəmiqayırma və gəmi təmiri mühəndisliyi",
    ],
  },
  {
    universite: "BANM — Bakı Ali Neft Məktəbi",
    bolmeler: [
      "Data analitikası", "İnformasiya təhlükəsizliyi", "Kimya mühəndisliyi",
      "Kompüter elmləri", "Kompüter mühəndisliyi", "Neft-qaz mühəndisliyi",
      "Proseslərin avtomatlaşdırılması mühəndisliyi",
      "Biznesin idarə edilməsi", "Maliyyə",
    ],
  },
  {
    universite: "ADAU — Azərbaycan Dövlət Aqrar Universiteti",
    bolmeler: [
      "Aqromühəndislik", "Aqronomluq", "Balıqçılıq",
      "Elektrik və elektronika mühəndisliyi", "Energetika mühəndisliyi",
      "Həyat fəaliyyətinin təhlükəsizliyi mühəndisliyi",
      "İnformasiya texnologiyaları", "Kompüter mühəndisliyi",
      "Qida mühəndisliyi", "Logistika və nəqliyyat texnologiyaları mühəndisliyi",
      "Maşın mühəndisliyi", "Meliorasiya mühəndisliyi", "Meşəçilik",
      "Şərabçılıq", "Torpaqşünaslıq və aqrokimya",
      "Yerquruluşu və daşınmaz əmlakın kadastrı", "Zoomühəndislik",
      "Biznesin idarə edilməsi", "İqtisadiyyat", "Maliyyə",
      "Marketinq", "Menecment", "Mühasibat",
      "Bağçılıq və tərəvəzçilik", "Baytarlıq təbabəti", "Biotexnologiya",
      "Bitki mühafizəsi", "Ekologiya", "Əczaçılıq",
      "Su bioehtiyatları və akvakultura", "Dizayn",
    ],
  },
  {
    universite: "AzTU (Gəncə) — Azərbaycan Texnologiya Universiteti",
    bolmeler: [
      "Qida mühəndisliyi", "Kimya mühəndisliyi", "Texnologiya mühəndisliyi",
    ],
  },
  {
    universite: "AKU — Azərbaycan Kooperasiya Universiteti",
    bolmeler: [
      "Biznesin idarə edilməsi", "İqtisadiyyat", "Maliyyə", "Marketinq",
      "Menecment", "Mühasibat", "Beynəlxalq ticarət və logistika",
      "Turizm işinin təşkili",
    ],
  },
  {
    universite: "AU — Azərbaycan Universiteti",
    bolmeler: [
      "Biznesin idarə edilməsi", "İqtisadiyyat", "Maliyyə", "Marketinq",
      "Menecment", "Hüquqşünaslıq", "Beynəlxalq münasibətlər",
      "İnformasiya texnologiyaları", "Kompüter mühəndisliyi",
    ],
  },
  {
    universite: "UFAZ — Azərbaycan–Fransız Universiteti",
    bolmeler: [
      "Kompüter elmləri", "İnformasiya texnologiyaları",
      "Biznesin idarə edilməsi", "İqtisadiyyat",
      "Geologiya", "Kimya",
    ],
  },
  {
    universite: "QKU — Qərbi Kaspi Universiteti",
    bolmeler: [
      "Hüquqşünaslıq", "Biznesin idarə edilməsi", "İqtisadiyyat",
      "Maliyyə", "Menecment", "Mühasibat", "Marketinq",
      "Beynəlxalq münasibətlər", "Sosial iş", "Psixologiya",
      "İnformasiya texnologiyaları", "Kompüter mühəndisliyi",
    ],
  },
  {
    universite: "BAAU — Bakı Avrasiya Universiteti",
    bolmeler: [
      "Hüquqşünaslıq", "Biznesin idarə edilməsi", "İqtisadiyyat",
      "Maliyyə", "Menecment", "Mühasibat", "Marketinq",
      "İnformasiya texnologiyaları", "Kompüter mühəndisliyi",
      "Beynəlxalq münasibətlər",
    ],
  },
  {
    universite: "BBU — Bakı Biznes Universiteti",
    bolmeler: [
      "Biznesin idarə edilməsi", "İqtisadiyyat", "Maliyyə",
      "Marketinq", "Menecment", "Mühasibat",
      "Beynəlxalq ticarət və logistika", "Turizm işinin təşkili",
    ],
  },
  {
    universite: "BMU — Bakı Mühəndislik Universiteti",
    bolmeler: [
      "İnşaat mühəndisliyi", "Memarlıq", "Elektrik və elektronika mühəndisliyi",
      "Kompüter mühəndisliyi", "İnformasiya texnologiyaları",
      "Maşın mühəndisliyi", "Nəqliyyat mühəndisliyi",
    ],
  },
  {
    universite: "Khazar — Xəzər Universiteti",
    bolmeler: [
      "Hüquqşünaslıq", "Biznesin idarə edilməsi", "İqtisadiyyat",
      "Maliyyə", "Menecment", "Marketinq",
      "Beynəlxalq münasibətlər", "Kompüter elmləri",
      "İnformasiya texnologiyaları", "Jurnalistika",
      "Sosial iş", "Psixologiya",
    ],
  },
  {
    universite: "OYU — Odlar Yurdu Universiteti",
    bolmeler: [
      "Hüquqşünaslıq", "Biznesin idarə edilməsi", "İqtisadiyyat",
      "Maliyyə", "Menecment", "Mühasibat", "Marketinq",
      "İnformasiya texnologiyaları", "Kompüter mühəndisliyi",
      "Beynəlxalq münasibətlər",
    ],
  },
  {
    universite: "NU — Naxçıvan Universiteti",
    bolmeler: [
      "Hüquqşünaslıq", "Biznesin idarə edilməsi", "İqtisadiyyat",
      "Maliyyə", "Menecment", "Mühasibat",
      "İnformasiya texnologiyaları", "Kompüter mühəndisliyi",
      "Tibb", "Stomatologiya",
    ],
  },
  {
    universite: "TAU — Türkiyə–Azərbaycan Universiteti",
    bolmeler: [
      "İnformatika müəllimliyi", "Riyaziyyat müəllimliyi", "Fizika müəllimliyi",
    ],
  },
  {
    universite: "Aİİ — Azərbaycan İlahiyyat İnstitutu",
    bolmeler: [
      "İlahiyyat", "Dinşünaslıq",
    ],
  },
  {
    universite: "ADRA — Azərbaycan Dövlət Rəssamlıq Akademiyası",
    bolmeler: [
      "Təsviri incəsənət",
    ],
  },
  {
    universite: "AMK — Azərbaycan Milli Konservatoriyası",
    bolmeler: [
      "Musiqi müəllimliyi", "Musiqişünaslıq",
    ],
  },
  {
    universite: "DİA — Prezident yanında Dövlət İdarəçilik Akademiyası",
    bolmeler: [
      "Dövlət idarəetməsi",
    ],
  },
  {
    universite: "DGKA — Dövlət Gömrük Komitəsinin Akademiyası",
    bolmeler: [
      "Gömrük işi",
    ],
  },
  {
    universite: "ASMA — Əmək və Sosial Münasibətlər Akademiyası",
    bolmeler: [
      "Sosial iş", "Mühasibat", "Menecment",
      "İnformasiya texnologiyaları",
    ],
  },
  {
    universite: "Qarabağ Universiteti",
    bolmeler: [
      "Azərbaycan dili və ədəbiyyatı", "Tarix", "Coğrafiya",
      "İnformatika", "Riyaziyyat", "Fizika", "Kimya", "Biologiya",
      "İqtisadiyyat", "Hüquqşünaslıq", "Beynəlxalq münasibətlər",
    ],
  },
];
