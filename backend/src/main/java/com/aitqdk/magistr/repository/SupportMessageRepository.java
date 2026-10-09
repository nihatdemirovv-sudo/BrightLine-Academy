package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, String> {
    List<SupportMessage> findByTicketIdOrderByCreatedAtAsc(String ticketId);

    long countByTicketId(String ticketId);

    long countByTicketIdAndGonderenAndCreatedAtAfter(String ticketId, String gonderen, java.time.Instant after);

    void deleteByTicketId(String ticketId);
}
