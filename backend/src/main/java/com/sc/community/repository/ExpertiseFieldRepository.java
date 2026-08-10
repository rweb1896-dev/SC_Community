package com.sc.community.repository;

import com.sc.community.entity.ExpertiseField;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpertiseFieldRepository extends JpaRepository<ExpertiseField, Long> {
    List<ExpertiseField> findAllByOrderByDisplayOrderAscNameAsc();
    List<ExpertiseField> findByActiveTrueOrderByDisplayOrderAscNameAsc();
    Optional<ExpertiseField> findByNameIgnoreCase(String name);
}
