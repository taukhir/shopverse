package io.shopverse.labs;

import org.openjdk.jol.info.ClassLayout;
import org.openjdk.jol.info.GraphLayout;

public final class ObjectLayoutLab {
    static final class Sample {
        final long id; final boolean active; final Object reference;
        Sample(long id, boolean active, Object reference) {
            this.id = id; this.active = active; this.reference = reference;
        }
    }
    public static void main(String[] args) {
        Sample value = new Sample(42, true, new byte[128]);
        System.out.println(ClassLayout.parseInstance(value).toPrintable());
        System.out.println(GraphLayout.parseInstance(value).toFootprint());
    }
}
