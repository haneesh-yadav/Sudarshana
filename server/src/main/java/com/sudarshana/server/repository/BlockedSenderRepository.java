package com.sudarshana.server.repository;

import com.sudarshana.server.model.BlockedSender;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface BlockedSenderRepository extends JpaRepository<BlockedSender, Long> {

    BlockedSender findBySenderEmail(String senderEmail);

    @Modifying
    @Transactional
    void deleteBySenderEmail(String senderEmail);
}
