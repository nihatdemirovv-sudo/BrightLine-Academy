package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.AccountService;
import com.aitqdk.magistr.service.AdminExamQuestionsService;
import com.aitqdk.magistr.service.AdminStudentsService;
import com.aitqdk.magistr.service.ArenaService;
import com.aitqdk.magistr.service.ChatGroupService;
import com.aitqdk.magistr.service.LibraryMaterialService;
import com.aitqdk.magistr.service.RealMagistrSualService;
import com.aitqdk.magistr.service.SupportService;
import com.aitqdk.magistr.service.TeacherAdminService;
import com.aitqdk.magistr.service.UniversityCutoffAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminStudentsService adminStudentsService;
    private final AdminExamQuestionsService adminExamQuestionsService;
    private final UniversityCutoffAdminService universityCutoffAdminService;
    private final RealMagistrSualService realMagistrSualService;
    private final SupportService supportService;
    private final ChatGroupService chatGroupService;
    private final TeacherAdminService teacherAdminService;
    private final AccountService accountService;
    private final ArenaService arenaService;
    private final LibraryMaterialService libraryMaterialService;

    public record AddQuestionsRequest(List<Map<String, Object>> questions) {
    }

    @GetMapping("/students")
    public Map<String, Object> students(@RequestParam(defaultValue = "1") int page,
                                         @RequestParam(required = false) String q) {
        return adminStudentsService.list(page, q);
    }

    @GetMapping("/students/{id}")
    public Map<String, Object> studentDetail(@PathVariable String id) {
        return adminStudentsService.detail(id);
    }

    @GetMapping("/students/{id}/activity")
    public Map<String, Object> studentActivity(@PathVariable String id) {
        return teacherAdminService.studentActivity(id);
    }

    @DeleteMapping("/students/{id}")
    public Map<String, Object> deleteStudent(@PathVariable String id) {
        accountService.deleteAccountByAdmin(id);
        return Map.of("success", true);
    }

    @GetMapping("/exam-questions")
    public Map<String, Object> examQuestions() {
        return Map.of("questions", adminExamQuestionsService.list());
    }

    @PostMapping("/exam-questions")
    public Map<String, Object> addExamQuestions(@RequestBody AddQuestionsRequest req) {
        return adminExamQuestionsService.add(req.questions());
    }

    @DeleteMapping("/exam-questions")
    public Map<String, Object> deleteExamQuestion(@RequestParam String id) {
        return adminExamQuestionsService.delete(id);
    }

    public record ImportCutoffsRequest(String text, Boolean replaceAll) {
    }

    @PostMapping("/university-cutoffs/import")
    public Map<String, Object> importUniversityCutoffs(@RequestBody ImportCutoffsRequest req) {
        var result = universityCutoffAdminService.importText(req.text(), Boolean.TRUE.equals(req.replaceAll()));
        return Map.of(
                "əlavəEdildi", result.əlavəEdildi(),
                "sətirSayı", result.sətirSayı(),
                "xətalar", result.xətalar()
        );
    }

    @GetMapping("/university-cutoffs/stats")
    public Map<String, Object> universityCutoffStats() {
        return universityCutoffAdminService.stats();
    }

    public record AiFormatCutoffsRequest(String text) {
    }

    @PostMapping("/university-cutoffs/ai-format")
    public Map<String, Object> aiFormatUniversityCutoffs(@RequestBody AiFormatCutoffsRequest req) {
        var result = universityCutoffAdminService.aiFormatText(req.text());
        return Map.of(
                "formattedText", result.formattedText(),
                "xəbərdarlıqlar", result.xəbərdarlıqlar()
        );
    }

    public record ImportRealSualRequest(List<RealMagistrSualService.ImportItem> items, Boolean replaceFenn) {
    }

    @PostMapping("/real-magistr-suallar/import")
    public Map<String, Object> importRealMagistrSuallar(@RequestBody ImportRealSualRequest req) {
        var result = realMagistrSualService.importList(req.items(), Boolean.TRUE.equals(req.replaceFenn()));
        return Map.of("əlavəEdildi", result.əlavəEdildi());
    }

    public record UpdateIzahRequest(Map<String, String> izahlar) {
    }

    @PostMapping("/real-magistr-suallar/update-izah")
    public Map<String, Object> updateRealMagistrSualIzah(@RequestBody UpdateIzahRequest req) {
        int say = realMagistrSualService.updateIzahById(req.izahlar());
        return Map.of("yeniləndi", say);
    }

    // ==================== DƏSTƏK (SUPPORT) ====================

    @GetMapping("/support/tickets")
    public List<Map<String, Object>> supportTickets() {
        return supportService.listAllForAdmin();
    }

    @GetMapping("/support/tickets/{id}")
    public Map<String, Object> supportTicketDetail(@PathVariable String id) {
        return supportService.getTicketForAdmin(id);
    }

    public record SupportReplyRequest(String mesaj, String sekil) {
    }

    @PostMapping("/support/tickets/{id}/reply")
    public Map<String, Object> supportReply(@PathVariable String id, @RequestBody SupportReplyRequest req) {
        return supportService.addAdminReply(id, req.mesaj(), req.sekil());
    }

    public record SupportStatusRequest(String status) {
    }

    @PostMapping("/support/tickets/{id}/status")
    public Map<String, Object> supportSetStatus(@PathVariable String id, @RequestBody SupportStatusRequest req) {
        return supportService.setStatus(id, req.status());
    }

    @GetMapping("/support/tickets/{id}/stream")
    public SseEmitter supportStream(@PathVariable String id) {
        return supportService.subscribeAdmin(id);
    }

    @DeleteMapping("/support/tickets/{id}")
    public Map<String, Object> supportDelete(@PathVariable String id) {
        supportService.deleteTicket(id);
        return Map.of("success", true);
    }

    // ==================== QRUPLAR (CHAT GROUPS) ====================
    // Sistem admini şifrəsiz, üzvlük yaratmadan bütün qrupları görə/oxuya bilir.

    @GetMapping("/groups")
    public List<Map<String, Object>> groups() {
        return chatGroupService.listAllForAdmin();
    }

    @GetMapping("/groups/{id}")
    public Map<String, Object> groupDetail(@PathVariable String id) {
        return chatGroupService.getGroupForAdmin(id);
    }

    @GetMapping("/groups/{id}/stream")
    public SseEmitter groupStream(@PathVariable String id) {
        return chatGroupService.subscribeAdmin(id);
    }

    @DeleteMapping("/groups/{id}")
    public Map<String, Object> groupDelete(@PathVariable String id) {
        chatGroupService.deleteGroup(id);
        return Map.of("success", true);
    }

    // ==================== BİLDİRİŞLƏR (nav badge-ləri) ====================

    // Admin panel bunu bir neçə saniyədən bir yoxlayır — yeni müəllim qeydiyyatı anında görünür.
    @GetMapping("/notifications")
    public Map<String, Object> notifications() {
        return Map.of(
                "pendingTeachers", teacherAdminService.listPendingBrief(),
                "openSupport", supportService.countOpenTickets()
        );
    }

    // ==================== MÜƏLLİMLƏR ====================

    @GetMapping("/teachers")
    public List<Map<String, Object>> teachers(@RequestParam(defaultValue = "pending") String status) {
        return switch (status) {
            case "approved" -> teacherAdminService.listApproved();
            case "rejected" -> teacherAdminService.listRejected();
            default -> teacherAdminService.listPending();
        };
    }

    @GetMapping("/teachers/{id}")
    public Map<String, Object> teacherDetail(@PathVariable String id) {
        return teacherAdminService.detail(id);
    }

    @GetMapping("/teachers/{id}/students/{studentId}/activity")
    public Map<String, Object> teacherStudentActivity(@PathVariable String id, @PathVariable String studentId) {
        return teacherAdminService.studentActivity(studentId);
    }

    @PostMapping("/teachers/{id}/approve")
    public Map<String, Object> approveTeacher(@PathVariable String id) {
        teacherAdminService.approve(id);
        return Map.of("success", true);
    }

    @PostMapping("/teachers/{id}/reject")
    public Map<String, Object> rejectTeacher(@PathVariable String id) {
        teacherAdminService.reject(id);
        return Map.of("success", true);
    }

    // ==================== BİLİK ARENASI ====================

    @GetMapping("/arena/stats")
    public Map<String, Object> arenaStats() {
        return arenaService.adminStats();
    }

    @GetMapping("/arena/competitions")
    public List<Map<String, Object>> arenaCompetitions(@RequestParam(defaultValue = "all") String filter) {
        return arenaService.listForAdmin(filter);
    }

    @GetMapping("/arena/competitions/{id}")
    public Map<String, Object> arenaCompetitionDetail(@PathVariable String id) {
        return arenaService.getForAdmin(id);
    }

    @PostMapping("/arena/competitions/{id}/stop")
    public Map<String, Object> arenaCompetitionStop(@PathVariable String id) {
        return arenaService.stopForAdmin(id);
    }

    @DeleteMapping("/arena/competitions/{id}")
    public Map<String, Object> arenaCompetitionDelete(@PathVariable String id) {
        arenaService.deleteForAdmin(id);
        return Map.of("success", true);
    }

    // ==================== DƏRS MATERİALLARI (PDF) ====================

    @GetMapping("/materials")
    public List<Map<String, Object>> materials() {
        return libraryMaterialService.listMeta();
    }

    public record AddMaterialRequest(String ad, String tesvir, String fenn, String tip, String data) {
    }

    @PostMapping("/materials")
    public Map<String, Object> addMaterial(@RequestBody AddMaterialRequest req) {
        return libraryMaterialService.add(req.ad(), req.tesvir(), req.fenn(), req.tip(), req.data());
    }

    @DeleteMapping("/materials/{id}")
    public Map<String, Object> deleteMaterial(@PathVariable String id) {
        libraryMaterialService.delete(id);
        return Map.of("success", true);
    }
}
