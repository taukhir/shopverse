package io.shopverse.user_service.repository;

import io.shopverse.user_service.entities.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {

    List<UserAddress> findByUserUsernameOrderByDefaultAddressDescUpdatedAtDescIdDesc(String username);

    Optional<UserAddress> findByIdAndUserUsername(Long id, String username);

    boolean existsByUserUsername(String username);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update UserAddress address set address.defaultAddress = false where address.user.username = :username and address.id <> :addressId")
    void clearOtherDefaultAddresses(@Param("username") String username, @Param("addressId") Long addressId);
}
