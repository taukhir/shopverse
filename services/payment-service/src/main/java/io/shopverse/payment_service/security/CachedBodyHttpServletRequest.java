package io.shopverse.payment_service.security;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.io.ByteArrayInputStream;
import java.io.IOException;

/**
 * Re-serves an already-read request body so it can be read once for
 * signature verification and again by Spring MVC's normal @RequestBody
 * binding, without changing the bytes in between.
 */
public class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {

    private final byte[] body;

    public CachedBodyHttpServletRequest(HttpServletRequest request, byte[] body) {
        super(request);
        this.body = body;
    }

    @Override
    public ServletInputStream getInputStream() {
        ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(body);
        return new ServletInputStream() {
            @Override
            public boolean isFinished() {
                return byteArrayInputStream.available() == 0;
            }

            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setReadListener(ReadListener readListener) {
                throw new UnsupportedOperationException("Async read listeners are not supported for cached webhook bodies");
            }

            @Override
            public int read() {
                return byteArrayInputStream.read();
            }
        };
    }

    @Override
    public java.io.BufferedReader getReader() throws IOException {
        return new java.io.BufferedReader(new java.io.InputStreamReader(getInputStream(), getCharacterEncoding() != null ? getCharacterEncoding() : "UTF-8"));
    }
}
