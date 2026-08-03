package io.shopverse.labs;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;

public final class DirectMemoryPressureLab {
    public static void main(String[] args) throws Exception {
        int mib = args.length == 0 ? 32 : Math.min(Integer.parseInt(args[0]), 256);
        List<ByteBuffer> retained = new ArrayList<>();
        for (int i = 0; i < mib; i++) retained.add(ByteBuffer.allocateDirect(1024 * 1024));
        System.out.printf("Retained %d MiB direct memory; pid=%d%n", mib, ProcessHandle.current().pid());
        Thread.sleep(5_000);
    }
}
