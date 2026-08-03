package io.shopverse.labs;

import java.util.ArrayList;
import java.util.List;

public final class GcAllocationWorkload {
    public static void main(String[] args) throws Exception {
        int seconds = args.length == 0 ? 15 : Integer.parseInt(args[0]);
        long end = System.nanoTime() + seconds * 1_000_000_000L;
        List<byte[]> live = new ArrayList<>(); long allocated = 0;
        while (System.nanoTime() < end) {
            byte[] value = new byte[16 * 1024]; allocated += value.length;
            if ((allocated & ((1 << 20) - 1)) == 0) live.add(value);
            if (live.size() > 2_000) live.subList(0, 1_000).clear();
        }
        System.out.printf("allocated=%.2f GiB retained=%d%n", allocated / 1073741824.0, live.size());
        Thread.sleep(1_000);
    }
}
