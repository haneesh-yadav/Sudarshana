package com.sudarshana.server.repository;

import com.sudarshana.server.model.SettingsConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SettingsConfigRepository extends JpaRepository<SettingsConfig, Long> {
}

