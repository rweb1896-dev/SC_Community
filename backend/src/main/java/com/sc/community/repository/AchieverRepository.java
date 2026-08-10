package com.sc.community.repository;

import com.sc.community.entity.Achiever;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AchieverRepository extends JpaRepository<Achiever, Long> {
    List<Achiever> findAllByOrderByDisplayOrderAscFullNameAsc();
    List<Achiever> findByActiveTrueAndExpertiseFieldActiveTrueOrderByExpertiseFieldDisplayOrderAscDisplayOrderAscFullNameAsc();
}
