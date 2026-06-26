package com.sudarshana.server.repository;

import com.sudarshana.server.model.BlacklistedDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlacklistedDomainRepository extends JpaRepository<BlacklistedDomain, String> {
}

