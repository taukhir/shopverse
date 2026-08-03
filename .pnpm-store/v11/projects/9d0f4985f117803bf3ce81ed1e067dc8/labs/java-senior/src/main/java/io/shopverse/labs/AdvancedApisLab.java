package io.shopverse.labs;

import java.lang.foreign.Arena;
import java.lang.foreign.ValueLayout;
import java.nio.ByteBuffer;
import java.nio.channels.AsynchronousFileChannel;
import java.nio.file.Files;
import java.util.concurrent.TimeUnit;

import static java.nio.file.StandardOpenOption.READ;

public final class AdvancedApisLab {
    private static final ClassValue<String> METADATA = new ClassValue<>() {
        @Override protected String computeValue(Class<?> type) { return type.getName(); }
    };

    public static void main(String[] args) throws Exception {
        try (Arena arena = Arena.ofConfined()) {
            var segment = arena.allocate(ValueLayout.JAVA_LONG);
            segment.set(ValueLayout.JAVA_LONG, 0, 42L);
            if (segment.get(ValueLayout.JAVA_LONG, 0) != 42L) throw new AssertionError();
        }
        var file = Files.createTempFile("async-io-lab", ".txt");
        try {
            Files.writeString(file, "shopverse");
            try (var channel = AsynchronousFileChannel.open(file, READ)) {
                ByteBuffer buffer = ByteBuffer.allocate(32);
                int read = channel.read(buffer, 0).get(1, TimeUnit.SECONDS);
                if (read != 9) throw new AssertionError("unexpected read=" + read);
            }
        } finally { Files.deleteIfExists(file); }
        if (!METADATA.get(AdvancedApisLab.class).endsWith("AdvancedApisLab")) throw new AssertionError();
        System.out.println("FFM, asynchronous file I/O and ClassValue checks passed.");
    }
}
