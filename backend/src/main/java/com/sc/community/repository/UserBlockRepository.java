package com.sc.community.repository;
import com.sc.community.entity.UserBlock; import java.util.Optional; import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param;
public interface UserBlockRepository extends JpaRepository<UserBlock,Long>{
 @Query("select count(b)>0 from UserBlock b where (b.blocker.id=:a and b.blocked.id=:b) or (b.blocker.id=:b and b.blocked.id=:a)") boolean blockedEitherWay(@Param("a") Long a,@Param("b") Long b);
 Optional<UserBlock> findByBlockerIdAndBlockedId(Long blockerId,Long blockedId);
}
