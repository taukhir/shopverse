package io.shopverse.user_service.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;

class JpaAuditingConfigTest {

    private final JpaAuditingConfig config = new JpaAuditingConfig();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void returnsAuthenticatedPrincipalNameAsAuditor() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("ahmed", "n/a", AuthorityUtils.NO_AUTHORITIES)
        );

        assertThat(config.userAuditorAware().getCurrentAuditor()).contains("ahmed");
    }

    @Test
    void doesNotAttributeChangesToAnonymousPrincipal() {
        SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken(
                "test-key", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")
        ));

        assertThat(config.userAuditorAware().getCurrentAuditor()).isEmpty();
    }
}
