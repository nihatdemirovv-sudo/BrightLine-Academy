package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.Activity;
import com.aitqdk.magistr.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityRepository activityRepository;

    public void log(String studentId, String nov) {
        log(studentId, nov, null);
    }

    public void log(String studentId, String nov, String detal) {
        Activity a = new Activity();
        a.setStudentId(studentId);
        a.setNov(nov);
        a.setDetal(detal);
        activityRepository.save(a);
    }
}
