package io.shopverse.labs;

import java.io.IOException;
import java.io.InputStream;

public final class ClassLoaderIdentityLab {
    static final class IsolatedLoader extends ClassLoader {
        IsolatedLoader() { super(null); }
        @Override protected Class<?> findClass(String name) throws ClassNotFoundException {
            String resource = "/" + name.replace('.', '/') + ".class";
            try (InputStream in = ClassLoaderIdentityLab.class.getResourceAsStream(resource)) {
                if (in == null) throw new ClassNotFoundException(name);
                byte[] bytes = in.readAllBytes();
                return defineClass(name, bytes, 0, bytes.length);
            } catch (IOException e) { throw new ClassNotFoundException(name, e); }
        }
    }
    public static void main(String[] args) throws Exception {
        String name = Payload.class.getName();
        Class<?> left = new IsolatedLoader().loadClass(name);
        Class<?> right = new IsolatedLoader().loadClass(name);
        System.out.printf("same name=%s, same class=%s%n", left.getName().equals(right.getName()), left == right);
    }
    public static final class Payload { }
}
