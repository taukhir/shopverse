package io.shopverse.platform.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class ShopverseJwtAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        addClaimAuthorities(authorities, jwt.getClaim("roles"));
        addClaimAuthorities(authorities, jwt.getClaim("permissions"));
        return authorities;
    }

    private void addClaimAuthorities(Set<GrantedAuthority> authorities, Object claimValue) {
        if (claimValue instanceof String value) {
            for (String authority : value.split(" ")) {
                addAuthority(authorities, authority);
            }
            return;
        }

        if (claimValue instanceof Collection<?> values) {
            values.stream()
                    .map(String::valueOf)
                    .forEach(authority -> addAuthority(authorities, authority));
        }
    }

    private void addAuthority(Set<GrantedAuthority> authorities, String authority) {
        if (authority != null && !authority.isBlank()) {
            authorities.add(new SimpleGrantedAuthority(authority));
        }
    }
}
