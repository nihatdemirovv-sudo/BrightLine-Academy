package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.TeacherPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Tapşırıq altındakı comment-lər — həm müəllim, həm tələbə eyni endpoint-dən yazır
 * (rol TeacherPortalService daxilində sessiyadan müəyyən olunur). */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TeacherPortalService teacherPortalService;

    public record CommentRequest(String sessionId, String mesaj) {
    }

    @PostMapping("/{id}/comments")
    public Map<String, Object> addComment(@PathVariable String id, @RequestBody CommentRequest req) {
        return teacherPortalService.addComment(req.sessionId(), id, req.mesaj());
    }
}
