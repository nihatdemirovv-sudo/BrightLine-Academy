package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, String> {
    List<SupportTicket> findByStudentIdOrderByUpdatedAtDesc(String studentId);

    List<SupportTicket> findAllByOrderByUpdatedAtDesc();

    long countByStatus(String status);
}
